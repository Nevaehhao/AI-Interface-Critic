import { NextResponse } from "next/server";

import type { AnalysisContext } from "@/lib/analysis-context";
import { createMockAnalyzeResponse } from "@/lib/analysis-result";
import { createMockAnalysisReport } from "@/lib/analysis-report";
import { analyzeScreenshot } from "@/lib/analyze-screenshot";
import { parseAnalysisContextFromFormData } from "@/lib/analysis-context";
import { getCurrentAuthSession } from "@/lib/auth/server";
import { persistAnalysis } from "@/lib/data/analysis-store";
import { fetchGitHubRepoIntake } from "@/lib/github-repo";
import { capturePageScreenshot } from "@/lib/page-capture";
import { validateImageFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const workspaceIdValue = formData.get("workspaceId");
  const workspaceId =
    typeof workspaceIdValue === "string" && workspaceIdValue.trim().length > 0
      ? workspaceIdValue
      : null;
  let analysisContext: AnalysisContext;

  try {
    analysisContext = parseAnalysisContextFromFormData(formData);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The analysis context is invalid.",
      },
      { status: 400 },
    );
  }

  let analysisFile = file instanceof File ? file : null;
  let screenshotDataUrl: string | null = null;
  let enrichedContext: AnalysisContext = {
    ...analysisContext,
    pageCaptureMode: analysisFile ? "upload" : "url-capture",
  };

  if (!analysisFile && !analysisContext.pageUrl) {
    return NextResponse.json(
      { error: "A screenshot file or valid page URL is required." },
      { status: 400 },
    );
  }

  try {
    if (!analysisFile && analysisContext.pageUrl) {
      const capturedPage = await capturePageScreenshot(analysisContext.pageUrl);

      analysisFile = capturedPage.file;
      screenshotDataUrl = capturedPage.dataUrl;
      enrichedContext = {
        ...enrichedContext,
        pageTitle: capturedPage.pageTitle,
        pageUrl: capturedPage.finalUrl,
      };
    }

    if (analysisContext.repoUrl) {
      const repoIntake = await fetchGitHubRepoIntake(analysisContext.repoUrl).catch((error) => {
        console.error("GitHub repo intake failed.", error);
        return null;
      });

      if (repoIntake) {
        enrichedContext = {
          ...enrichedContext,
          repoEntryPoints: repoIntake.suggestedFiles,
          repoSummary: repoIntake.summary,
        };
      }
    }

    const validationError = analysisFile
      ? validateImageFile(analysisFile)
      : "Unable to prepare an analysis screenshot.";

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!analysisFile) {
      return NextResponse.json(
        { error: "Unable to prepare an analysis screenshot." },
        { status: 400 },
      );
    }

    const { analysis, provider } = await analyzeScreenshot(analysisFile, enrichedContext);
    const { user } = await getCurrentAuthSession();

    await persistAnalysis({
      file: analysisFile,
      report: analysis,
      source: provider,
      userId: user?.id ?? null,
      workspaceId,
    }).catch((error) => {
      console.error("Persistence failed.", error);
    });

    return NextResponse.json({
      analysis,
      screenshotDataUrl,
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
      context: enrichedContext,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    });
    const { user } = await getCurrentAuthSession();

    if (analysisFile) {
      await persistAnalysis({
        file: analysisFile,
        report: mockAnalysis,
        source: "mock",
        userId: user?.id ?? null,
        workspaceId,
      }).catch((persistError) => {
        console.error("Persistence failed.", persistError);
      });
    }

    return NextResponse.json({
      ...mockResponse,
      analysis: mockAnalysis,
      screenshotDataUrl,
      warning: fallbackReason,
    });
  }
}
