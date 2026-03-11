import { buildAnalysisPrompt } from "@/lib/analysis-prompt";
import {
  analysisReportContentJsonSchema,
  parseStructuredAnalysisContent,
} from "@/lib/analysis-schema";
import { resolveAnalysisProvider } from "@/lib/analysis-provider";

type OpenAiCompatibleResponse = {
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

function normalizeChatCompletionsUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions")
    ? trimmed
    : `${trimmed.replace(/\/v1$/, "")}/v1/chat/completions`;
}

async function fileToBase64DataUrl(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${fileBuffer.toString("base64")}`;
}

function extractResponseContent(payload: OpenAiCompatibleResponse) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim().length > 0) {
    return content;
  }

  if (Array.isArray(content)) {
    const textContent = content
      .map((item) => (item.type === "text" ? item.text?.trim() ?? "" : ""))
      .filter(Boolean)
      .join("\n");

    if (textContent) {
      return textContent;
    }
  }

  throw new Error("The API did not return structured analysis output.");
}

export async function analyzeScreenshotWithOpenAiCompatibleApi(
  file: File,
) {
  const providerConfig = resolveAnalysisProvider();

  if (providerConfig.provider !== "openai-compatible") {
    throw new Error(
      "OpenAI-compatible analysis was selected without an OpenAI-compatible provider config.",
    );
  }

  const endpoint = normalizeChatCompletionsUrl(providerConfig.baseUrl);
  const response = await fetch(endpoint, {
    body: JSON.stringify({
      model: providerConfig.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildAnalysisPrompt(),
            },
            {
              type: "image_url",
              image_url: {
                url: await fileToBase64DataUrl(file),
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ui_ux_analysis_report",
          schema: analysisReportContentJsonSchema,
          strict: true,
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${providerConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json()) as OpenAiCompatibleResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Analysis API request failed with status ${response.status}.`,
    );
  }

  return parseStructuredAnalysisContent(extractResponseContent(payload));
}
