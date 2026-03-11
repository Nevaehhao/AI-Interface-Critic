import { buildAnalysisPrompt } from "@/lib/analysis-prompt";
import {
  analysisReportContentJsonSchema,
  normalizeAnalysisContent,
  parseStructuredAnalysisContent,
} from "@/lib/analysis-schema";
import { resolveAnalysisProvider } from "@/lib/analysis-provider";

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

export const normalizeOllamaAnalysisContent = normalizeAnalysisContent;

export async function analyzeScreenshotWithOllama(
  file: File,
) {
  const providerConfig = resolveAnalysisProvider();

  if (providerConfig.provider !== "ollama") {
    throw new Error("Ollama analysis was selected without an Ollama provider config.");
  }

  const response = await fetch(normalizeOllamaChatUrl(providerConfig.baseUrl), {
    body: JSON.stringify({
      model: providerConfig.model,
      messages: [
        {
          role: "user",
          content: buildAnalysisPrompt(),
          images: [await fileToBase64(file)],
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
      payload.error ?? `Ollama request failed with status ${response.status}.`,
    );
  }

  if (!payload.message?.content) {
    throw new Error("Ollama did not return structured analysis output.");
  }

  return parseStructuredAnalysisContent(payload.message.content);
}
