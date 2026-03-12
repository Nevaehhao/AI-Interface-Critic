import type { AnalysisContext } from "@/lib/analysis-context";
import { buildAnalysisPrompt } from "@/lib/analysis-prompt";
import { parseStructuredAnalysisContent } from "@/lib/analysis-schema";
import { resolveAnalysisProvider } from "@/lib/analysis-provider";

type AnthropicResponse = {
  content?: Array<{
    text?: string;
    type?: string;
  }>;
  error?: {
    message?: string;
  };
};

function normalizeMessagesUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/messages") ? trimmed : `${trimmed}/messages`;
}

async function fileToBase64(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  return fileBuffer.toString("base64");
}

function extractResponseContent(payload: AnthropicResponse) {
  const text = (payload.content ?? [])
    .map((item) => (item.type === "text" ? item.text?.trim() ?? "" : ""))
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("Anthropic did not return structured analysis output.");
  }

  return text;
}

export async function analyzeScreenshotWithAnthropic(
  file: File,
  context?: AnalysisContext,
) {
  const providerConfig = resolveAnalysisProvider();

  if (providerConfig.provider !== "anthropic") {
    throw new Error("Anthropic analysis was selected without an Anthropic provider config.");
  }

  const response = await fetch(normalizeMessagesUrl(providerConfig.baseUrl), {
    body: JSON.stringify({
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildAnalysisPrompt(context),
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type,
                data: await fileToBase64(file),
              },
            },
          ],
        },
      ],
      model: providerConfig.model,
    }),
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": providerConfig.anthropicVersion,
      "x-api-key": providerConfig.apiKey,
    },
    method: "POST",
  });

  const payload = (await response.json()) as AnthropicResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Anthropic request failed with status ${response.status}.`,
    );
  }

  return parseStructuredAnalysisContent(extractResponseContent(payload), {
    context,
  });
}
