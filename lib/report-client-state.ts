import {
  mockAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";
import type {
  AnalysisSource,
  StoredAnalysisHistoryEntry,
} from "@/lib/analysis-result";

export type ReportClientState = {
  report: AnalysisReport | null;
  screenshotUrl: string | null;
  source: AnalysisSource;
  warning: string | null;
};

export function resolveReportClientState({
  analysisId,
  initialReport = null,
  initialScreenshotUrl = null,
  initialSource = "mock",
  initialWarning = null,
  storedResult = null,
}: {
  analysisId: string;
  initialReport?: AnalysisReport | null;
  initialScreenshotUrl?: string | null;
  initialSource?: AnalysisSource;
  initialWarning?: string | null;
  storedResult?: StoredAnalysisHistoryEntry | null;
}): ReportClientState {
  if (initialReport) {
    return {
      report: initialReport,
      screenshotUrl: initialScreenshotUrl ?? storedResult?.screenshotDataUrl ?? null,
      source: initialSource,
      warning: initialWarning ?? storedResult?.warning ?? null,
    };
  }

  if (storedResult) {
    return {
      report: storedResult.analysis,
      screenshotUrl: storedResult.screenshotDataUrl ?? initialScreenshotUrl,
      source: storedResult.source,
      warning:
        typeof storedResult.warning === "undefined"
          ? initialWarning
          : storedResult.warning,
    };
  }

  if (analysisId === "demo") {
    return {
      report: mockAnalysisReport,
      screenshotUrl: initialScreenshotUrl,
      source: initialSource,
      warning: initialWarning,
    };
  }

  return {
    report: null,
    screenshotUrl: null,
    source: initialSource,
    warning: initialWarning,
  };
}
