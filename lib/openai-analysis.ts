import OpenAI from "openai";

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
- Return valid JSON matching the required schema.
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
        overallScore: {
          type: "number",
        },
        productType: {
          type: "string",
        },
        mainFinding: {
          type: "string",
        },
        strengths: {
          type: "array",
          minItems: 1,
          items: {
            type: "string",
          },
        },
        nextAction: {
          type: "string",
        },
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
          id: {
            type: "string",
          },
          title: {
            type: "string",
          },
          summary: {
            type: "string",
          },
          score: {
            type: "number",
          },
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
                id: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                recommendation: {
                  type: "string",
                },
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

async function fileToDataUrl(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const base64 = fileBuffer.toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function analyzeScreenshotWithOpenAI(
  file: File,
): Promise<AnalysisReport | null> {
  const serverEnv = getServerEnv();

  if (!serverEnv.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({
    apiKey: serverEnv.OPENAI_API_KEY,
  });

  const imageDataUrl = await fileToDataUrl(file);
  const response = await client.responses.create({
    model: serverEnv.OPENAI_MODEL,
    instructions: ANALYSIS_PROMPT,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analyze this screenshot and produce a structured UX critique.",
          },
          {
            type: "input_image",
            detail: "auto",
            image_url: imageDataUrl,
          },
        ],
      },
    ],
    text: {
      format: {
        description: "Structured UX critique for a single product screenshot.",
        name: "ux_analysis_report",
        schema: analysisReportContentJsonSchema,
        strict: true,
        type: "json_schema",
      },
    },
  });

  if (!response.output_text) {
    throw new Error("OpenAI did not return structured analysis output.");
  }

  const content = analysisReportContentSchema.parse(
    JSON.parse(response.output_text),
  );

  return createAnalysisReport(content);
}
