import { NextResponse } from "next/server";

import { createMockAnalyzeResponse } from "@/lib/analysis-result";
import { createMockAnalysisReport } from "@/lib/analysis-report";
import { analyzeScreenshotWithOpenAI } from "@/lib/openai-analysis";
import { validateImageFile } from "@/lib/uploads";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A screenshot file is required." },
      { status: 400 },
    );
  }

  const validationError = validateImageFile(file);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const openAIAnalysis = await analyzeScreenshotWithOpenAI(file);

    if (openAIAnalysis) {
      return NextResponse.json({
        analysis: openAIAnalysis,
        source: "openai",
      });
    }
  } catch (error) {
    console.error("OpenAI analysis failed, falling back to mock output.", error);
  }

  const mockResponse = createMockAnalyzeResponse();

  return NextResponse.json({
    ...mockResponse,
    analysis: createMockAnalysisReport({
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    }),
  });
}
