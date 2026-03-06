import {
  analysisReportContentSchema,
  createAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";
import { getServerEnv } from "@/lib/env";

const ANALYSIS_PROMPT = `
You are a senior UX designer reviewing a product screenshot.

Analyze the provided UI screenshot and return structured UX feedback in these categories:
- Visual hierarchy
- Accessibility
- Interaction clarity
- Layout issues

Instructions:
- Be specific and practical.
- Focus on actual UI critique, not generic praise.
- Use 1 to 2 issues per section when relevant.
- Keep recommendations actionable.
- Use a 0 to 100 score for the overall summary and each section.
- Return valid JSON matching the required schema exactly.
`.trim();

export const analysisReportContentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "sections"],
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
              },
            },
          },
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

  const content = analysisReportContentSchema.parse(
    JSON.parse(payload.message.content),
  );

  return createAnalysisReport(content);
}
