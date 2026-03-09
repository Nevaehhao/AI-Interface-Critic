import {
  analysisReportContentSchema,
  createAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";
import { getServerEnv } from "@/lib/env";
import { ZodError } from "zod";

const ANALYSIS_PROMPT = `
You are a senior UX designer reviewing a product screenshot.

Analyze the provided UI screenshot and return structured UX feedback in these categories:
- Visual hierarchy
- Accessibility
- Interaction clarity
- Layout issues
- Redesign suggestions

Instructions:
- Be specific and practical.
- Focus on actual UI critique, not generic praise.
- Use 1 to 2 issues per section when relevant.
- Keep recommendations actionable.
- Use a 0 to 100 score for the overall summary and each section.
- Add screenshot highlight boxes for each issue when a visible region can be identified.
- Highlight coordinates must use percentages from 0 to 100 for x, y, width, and height.
- Always return a highlights array for every issue. Use an empty array if no region is clear.
- Return valid JSON matching the required schema exactly.
`.trim();

export const analysisReportContentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "sections", "redesignSuggestions"],
  properties: {
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "overallScore",
        "productType",
        "mainFinding",
        "strengths",
        "nextAction",
      ],
      properties: {
        overallScore: { type: "number" },
        productType: { type: "string" },
        mainFinding: { type: "string" },
        strengths: {
          type: "array",
          minItems: 1,
          items: { type: "string" },
        },
        nextAction: { type: "string" },
      },
    },
    sections: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "summary", "score", "issues"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          score: { type: "number" },
          issues: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "title",
                "description",
                "recommendation",
                "severity",
                "highlights",
              ],
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
                highlights: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "x", "y", "width", "height", "label"],
                    properties: {
                      id: { type: "string" },
                      x: { type: "number" },
                      y: { type: "number" },
                      width: { type: "number" },
                      height: { type: "number" },
                      label: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    redesignSuggestions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "summary",
          "rationale",
          "priority",
          "actions",
          "expectedImpact",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          rationale: { type: "string" },
          priority: {
            type: "string",
            enum: ["now", "next", "later"],
          },
          actions: {
            type: "array",
            minItems: 2,
            items: { type: "string" },
          },
          expectedImpact: { type: "string" },
        },
      },
    },
  },
} as const;

type OllamaChatResponse = {
  done: boolean;
  error?: string;
  message?: {
    content?: string;
    role?: string;
  };
};

function normalizeOllamaChatUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? `${trimmed}/chat` : `${trimmed}/api/chat`;
}

async function fileToBase64(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  return fileBuffer.toString("base64");
}

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeScore(value: unknown) {
  const numericValue = toFiniteNumber(value);
  return numericValue === null ? value : clamp(numericValue, 0, 100);
}

function normalizeSeverity(value: unknown) {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function normalizeHighlight(
  value: unknown,
  issueId: string,
  highlightIndex: number,
) {
  if (!isJsonRecord(value)) {
    return null;
  }

  const x = clamp(toFiniteNumber(value.x) ?? 0, 0, 99);
  const y = clamp(toFiniteNumber(value.y) ?? 0, 0, 99);
  const maxWidth = Math.max(1, 100 - x);
  const maxHeight = Math.max(1, 100 - y);

  return {
    height: clamp(toFiniteNumber(value.height) ?? maxHeight, 1, maxHeight),
    id: normalizeString(value.id, `${issueId}-highlight-${highlightIndex + 1}`),
    label: normalizeString(value.label, "Highlighted region"),
    width: clamp(toFiniteNumber(value.width) ?? maxWidth, 1, maxWidth),
    x,
    y,
  };
}

function normalizeHighlights(value: unknown, issueId: string) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((highlight, index) => normalizeHighlight(highlight, issueId, index))
    .filter((highlight) => highlight !== null);
}

function normalizeIssue(value: unknown, sectionId: string, issueIndex: number) {
  if (!isJsonRecord(value)) {
    return value;
  }

  const issueId = normalizeString(value.id, `${sectionId}-issue-${issueIndex + 1}`);

  return {
    ...value,
    highlights: normalizeHighlights(value.highlights, issueId),
    id: issueId,
    severity: normalizeSeverity(value.severity),
  };
}

function normalizeSection(value: unknown, sectionIndex: number) {
  if (!isJsonRecord(value)) {
    return value;
  }

  const sectionId = normalizeString(value.id, `section-${sectionIndex + 1}`);

  return {
    ...value,
    id: sectionId,
    issues: Array.isArray(value.issues)
      ? value.issues.map((issue, issueIndex) =>
          normalizeIssue(issue, sectionId, issueIndex),
        )
      : value.issues,
    score: normalizeScore(value.score),
  };
}

function normalizeSummary(value: unknown) {
  if (!isJsonRecord(value)) {
    return value;
  }

  return {
    ...value,
    overallScore: normalizeScore(value.overallScore),
  };
}

function normalizeRedesignSuggestion(value: unknown, suggestionIndex: number) {
  if (!isJsonRecord(value)) {
    return value;
  }

  const actions = Array.isArray(value.actions)
    ? value.actions.filter(
        (action): action is string =>
          typeof action === "string" && action.trim().length > 0,
      )
    : value.actions;

  return {
    ...value,
    actions,
    id: normalizeString(value.id, `redesign-${suggestionIndex + 1}`),
    priority:
      value.priority === "now" || value.priority === "next" || value.priority === "later"
        ? value.priority
        : "next",
  };
}

export function normalizeOllamaAnalysisContent(value: unknown) {
  if (!isJsonRecord(value)) {
    return value;
  }

  return {
    ...value,
    redesignSuggestions: Array.isArray(value.redesignSuggestions)
      ? value.redesignSuggestions.map((suggestion, suggestionIndex) =>
          normalizeRedesignSuggestion(suggestion, suggestionIndex),
        )
      : value.redesignSuggestions,
    sections: Array.isArray(value.sections)
      ? value.sections.map((section, sectionIndex) =>
          normalizeSection(section, sectionIndex),
        )
      : value.sections,
    summary: normalizeSummary(value.summary),
  };
}

function summarizeValidationError(error: ZodError) {
  const issuePaths = error.issues.map((issue) => issue.path.join("."));

  if (issuePaths.some((path) => path.includes("highlights"))) {
    return new Error("Ollama returned invalid screenshot highlight data.");
  }

  if (issuePaths.some((path) => path.endsWith("overallScore") || path.endsWith("score"))) {
    return new Error("Ollama returned invalid score values.");
  }

  return new Error("Ollama returned an invalid analysis structure.");
}

export async function analyzeScreenshotWithOllama(
  file: File,
): Promise<AnalysisReport> {
  const serverEnv = getServerEnv();
  const endpoint = normalizeOllamaChatUrl(serverEnv.OLLAMA_BASE_URL);
  const imageBase64 = await fileToBase64(file);
  const promptWithSchema = [
    ANALYSIS_PROMPT,
    "",
    "Return JSON for this schema:",
    JSON.stringify(analysisReportContentJsonSchema),
  ].join("\n");

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      model: serverEnv.OLLAMA_MODEL,
      messages: [
        {
          role: "user",
          content: promptWithSchema,
          images: [imageBase64],
        },
      ],
      stream: false,
      format: analysisReportContentJsonSchema,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json()) as OllamaChatResponse;

  if (!response.ok) {
    throw new Error(
      payload.error ??
        `Ollama request failed with status ${response.status}.`,
    );
  }

  if (!payload.message?.content) {
    throw new Error("Ollama did not return structured analysis output.");
  }

  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(payload.message.content);
  } catch {
    throw new Error("Ollama returned invalid JSON.");
  }

  const normalizedContent = normalizeOllamaAnalysisContent(parsedContent);
  const validationResult = analysisReportContentSchema.safeParse(normalizedContent);

  if (!validationResult.success) {
    throw summarizeValidationError(validationResult.error);
  }

  return createAnalysisReport(validationResult.data);
}
