import { NextResponse } from "next/server";

import { createMockAnalyzeResponse } from "@/lib/analysis-result";
import { createMockAnalysisReport } from "@/lib/analysis-report";
import { analyzeScreenshot } from "@/lib/analyze-screenshot";
import { getCurrentAuthSession } from "@/lib/auth/server";
import { persistAnalysis } from "@/lib/data/analysis-store";
import { validateImageFile } from "@/lib/uploads";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const workspaceIdValue = formData.get("workspaceId");
  const workspaceId =
    typeof workspaceIdValue === "string" && workspaceIdValue.trim().length > 0
      ? workspaceIdValue
      : null;

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
    const { analysis, provider } = await analyzeScreenshot(file);
    const { user } = await getCurrentAuthSession();

    await persistAnalysis({
      file,
      report: analysis,
      source: provider,
      userId: user?.id ?? null,
      workspaceId,
    }).catch((error) => {
      console.error("Persistence failed.", error);
    });

    return NextResponse.json({
      analysis,
      source: provider,
      warning: null,
    });
  } catch (error) {
    console.error("Analysis failed, falling back to mock output.", error);

    const fallbackReason =
      error instanceof Error
        ? error.message
        : "The configured provider did not return a usable analysis result.";

    const mockResponse = createMockAnalyzeResponse();
    const mockAnalysis = createMockAnalysisReport({
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    });
    const { user } = await getCurrentAuthSession();

    await persistAnalysis({
      file,
      report: mockAnalysis,
      source: "mock",
      userId: user?.id ?? null,
      workspaceId,
    }).catch((persistError) => {
      console.error("Persistence failed.", persistError);
    });

    return NextResponse.json({
      ...mockResponse,
      analysis: mockAnalysis,
      warning: fallbackReason,
    });
  }
}
