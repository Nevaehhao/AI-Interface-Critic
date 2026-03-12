import type { AnalysisReport } from "@/lib/analysis-report";
import { resolveAnalysisProvider } from "@/lib/analysis-provider";
import type { RepoSnapshot } from "@/lib/local-repo";

const BUILDER_SYSTEM_PROMPT = `
You are a principal full-stack engineer implementing a UI critique inside a real product repository.

Rules:
- Respect the existing stack and file structure.
- Prefer small, targeted changes over broad rewrites.
- Keep output concrete and implementation-focused.
- When asked for a patch, return only a valid unified diff with no markdown fences.
- Do not invent files unless the task clearly requires a new file.
- Use the report acceptance criteria and risks as hard constraints.
`.trim();

function buildRepoSnapshotSection(snapshot: RepoSnapshot) {
  const selectedFileBlocks = snapshot.selectedFiles.map(
    (file) => `File: ${file.path}\n${file.content}`,
  );

  return [
    `Repository path: ${snapshot.repoPath}`,
    `Top-level entries: ${snapshot.rootEntries.join(", ")}`,
    "Repository tree sample:",
    ...snapshot.tree.slice(0, 120).map((entry) => `- ${entry}`),
    "",
    "Selected file contents:",
    ...selectedFileBlocks,
  ].join("\n");
}

function buildReportSection(report: AnalysisReport) {
  return [
    `Main finding: ${report.summary.mainFinding}`,
    `Product type: ${report.summary.productType}`,
    `Overall score: ${report.summary.overallScore}`,
    `Next action: ${report.summary.nextAction}`,
    `Review mode: ${report.context.analysisMode}`,
    report.context.pageUrl ? `Page URL: ${report.context.pageUrl}` : null,
    report.context.pageTitle ? `Page title: ${report.context.pageTitle}` : null,
    report.context.repoUrl ? `Repo URL: ${report.context.repoUrl}` : null,
    report.context.repoSummary ? `Repo summary: ${report.context.repoSummary}` : null,
    report.context.repoEntryPoints.length > 0
      ? `Repo entry points: ${report.context.repoEntryPoints.join(", ")}`
      : null,
    "",
    "Issues:",
    ...report.sections.flatMap((section) => [
      `Section: ${section.title} (${section.score})`,
      ...section.issues.map(
        (issue) =>
          `- ${issue.title} | severity=${issue.severity} | complexity=${issue.implementationComplexity} | recommendation=${issue.recommendation}`,
      ),
    ]),
    "",
    "Implementation plan:",
    report.implementationPlan.summary,
    `Estimated scope: ${report.implementationPlan.estimatedScope}`,
    `Frontend changes: ${report.implementationPlan.frontendChanges.join(" | ") || "None"}`,
    `Backend changes: ${report.implementationPlan.backendChanges.join(" | ") || "None"}`,
    `Files to inspect: ${report.implementationPlan.filesToInspect.join(" | ") || "None"}`,
    `Acceptance criteria: ${report.implementationPlan.acceptanceCriteria.join(" | ") || "None"}`,
    `Risks: ${report.implementationPlan.risks.join(" | ") || "None"}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildBuilderPlan(
  report: AnalysisReport,
  snapshot: RepoSnapshot,
) {
  return [
    "# Builder plan",
    "",
    "## Product direction",
    `- ${report.summary.mainFinding}`,
    `- Next action: ${report.summary.nextAction}`,
    `- Estimated scope: ${report.implementationPlan.estimatedScope}`,
    "",
    "## Repository context",
    `- Repo path: ${snapshot.repoPath}`,
    `- Top-level entries: ${snapshot.rootEntries.join(", ")}`,
    `- Candidate files: ${
      snapshot.selectedFiles.map((file) => file.path).join(", ") || "None"
    }`,
    "",
    "## Front-end changes",
    ...report.implementationPlan.frontendChanges.map((item) => `- ${item}`),
    ...(report.implementationPlan.frontendChanges.length === 0 ? ["- None"] : []),
    "",
    "## Back-end changes",
    ...report.implementationPlan.backendChanges.map((item) => `- ${item}`),
    ...(report.implementationPlan.backendChanges.length === 0 ? ["- None"] : []),
    "",
    "## Acceptance criteria",
    ...report.implementationPlan.acceptanceCriteria.map((item) => `- ${item}`),
    ...(report.implementationPlan.acceptanceCriteria.length === 0 ? ["- None"] : []),
    "",
    "## Risks",
    ...report.implementationPlan.risks.map((item) => `- ${item}`),
    ...(report.implementationPlan.risks.length === 0 ? ["- None"] : []),
  ].join("\n");
}

export function buildBuilderPrompt({
  mode,
  report,
  snapshot,
}: {
  mode: "patch" | "prompt";
  report: AnalysisReport;
  snapshot: RepoSnapshot;
}) {
  const modeInstruction =
    mode === "patch"
      ? "Return only a unified diff patch against the provided files."
      : "Return a concise implementation prompt for a coding agent.";

  return [
    modeInstruction,
    "",
    "Report:",
    buildReportSection(report),
    "",
    "Repository snapshot:",
    buildRepoSnapshotSection(snapshot),
  ].join("\n");
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string;
            type?: string;
          }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AnthropicTextResponse = {
  content?: Array<{
    text?: string;
    type?: string;
  }>;
  error?: {
    message?: string;
  };
};

type GeminiTextResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type OllamaTextResponse = {
  error?: string;
  message?: {
    content?: string;
  };
};

function extractTextContent(content: ChatCompletionResponse["choices"]) {
  const messageContent = content?.[0]?.message?.content;

  if (typeof messageContent === "string" && messageContent.trim().length > 0) {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((item) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
  }

  throw new Error("The configured provider did not return text output.");
}

function normalizeChatUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions")
    ? trimmed
    : `${trimmed.replace(/\/v1$/, "")}/v1/chat/completions`;
}

function normalizeAnthropicUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/messages") ? trimmed : `${trimmed}/messages`;
}

function normalizeGeminiUrl(baseUrl: string, model: string, apiKey: string) {
  return `${baseUrl.replace(/\/+$/, "")}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function normalizeOllamaUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? `${trimmed}/chat` : `${trimmed}/api/chat`;
}

export async function generateBuilderOutput(prompt: string) {
  const providerConfig = resolveAnalysisProvider();

  if (providerConfig.provider === "openai-compatible") {
    const response = await fetch(normalizeChatUrl(providerConfig.baseUrl), {
      body: JSON.stringify({
        messages: [
          {
            content: BUILDER_SYSTEM_PROMPT,
            role: "system",
          },
          {
            content: prompt,
            role: "user",
          },
        ],
        model: providerConfig.model,
        temperature: 0.1,
      }),
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as ChatCompletionResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ??
          `OpenAI-compatible request failed with status ${response.status}.`,
      );
    }

    return extractTextContent(payload.choices);
  }

  if (providerConfig.provider === "anthropic") {
    const response = await fetch(normalizeAnthropicUrl(providerConfig.baseUrl), {
      body: JSON.stringify({
        max_tokens: 4096,
        messages: [
          {
            content: prompt,
            role: "user",
          },
        ],
        model: providerConfig.model,
        system: BUILDER_SYSTEM_PROMPT,
      }),
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": providerConfig.anthropicVersion,
        "x-api-key": providerConfig.apiKey,
      },
      method: "POST",
    });
    const payload = (await response.json()) as AnthropicTextResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `Anthropic request failed with status ${response.status}.`,
      );
    }

    const text = (payload.content ?? [])
      .map((item) => (item.type === "text" ? item.text?.trim() ?? "" : ""))
      .filter(Boolean)
      .join("\n");

    if (!text) {
      throw new Error("Anthropic did not return builder output.");
    }

    return text;
  }

  if (providerConfig.provider === "gemini") {
    const response = await fetch(
      normalizeGeminiUrl(providerConfig.baseUrl, providerConfig.model, providerConfig.apiKey),
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${BUILDER_SYSTEM_PROMPT}\n\n${prompt}`,
                },
              ],
              role: "user",
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );
    const payload = (await response.json()) as GeminiTextResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `Gemini request failed with status ${response.status}.`,
      );
    }

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");

    if (!text) {
      throw new Error("Gemini did not return builder output.");
    }

    return text;
  }

  const response = await fetch(normalizeOllamaUrl(providerConfig.baseUrl), {
    body: JSON.stringify({
      messages: [
        {
          content: BUILDER_SYSTEM_PROMPT,
          role: "system",
        },
        {
          content: prompt,
          role: "user",
        },
      ],
      model: providerConfig.model,
      stream: false,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as OllamaTextResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? `Ollama request failed with status ${response.status}.`);
  }

  if (!payload.message?.content) {
    throw new Error("Ollama did not return builder output.");
  }

  return payload.message.content;
}
