import type { AnalysisContext } from "@/lib/analysis-context";
import { buildAnalysisPrompt } from "@/lib/analysis-prompt";
import { parseStructuredAnalysisContent } from "@/lib/analysis-schema";
import { resolveAnalysisProvider } from "@/lib/analysis-provider";

type GeminiResponse = {
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

function normalizeGenerateContentUrl(baseUrl: string, model: string, apiKey: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function fileToBase64(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  return fileBuffer.toString("base64");
}

function extractResponseContent(payload: GeminiResponse) {
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("Gemini did not return structured analysis output.");
  }

  return text;
}

export async function analyzeScreenshotWithGemini(
  file: File,
  context?: AnalysisContext,
) {
  const providerConfig = resolveAnalysisProvider();

  if (providerConfig.provider !== "gemini") {
    throw new Error("Gemini analysis was selected without a Gemini provider config.");
  }

  const response = await fetch(
    normalizeGenerateContentUrl(
      providerConfig.baseUrl,
      providerConfig.model,
      providerConfig.apiKey,
    ),
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildAnalysisPrompt(context),
              },
              {
                inline_data: {
                  data: await fileToBase64(file),
                  mime_type: file.type,
                },
              },
            ],
            role: "user",
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Gemini request failed with status ${response.status}.`,
    );
  }

  return parseStructuredAnalysisContent(extractResponseContent(payload), {
    context,
  });
}
