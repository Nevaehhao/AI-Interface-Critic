"use client";

import { useEffect, useState } from "react";

import { getAnalysisResultForId, type AnalysisSource } from "@/lib/analysis-result";
import { mockAnalysisReport, type AnalysisReport } from "@/lib/analysis-report";
import { ReportView } from "@/components/report/report-view";

export function ReportPageClient({
  analysisId,
  initialReport = null,
  initialScreenshotUrl = null,
  initialSource = "mock",
  initialWarning = null,
}: {
  analysisId: string;
  initialReport?: AnalysisReport | null;
  initialScreenshotUrl?: string | null;
  initialSource?: AnalysisSource;
  initialWarning?: string | null;
}) {
  const [report, setReport] = useState<AnalysisReport | null>(
    initialReport ?? (analysisId === "demo" ? mockAnalysisReport : null),
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(initialScreenshotUrl);
  const [source, setSource] = useState<AnalysisSource>(initialSource);
  const [warning, setWarning] = useState<string | null>(initialWarning);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedResult = getAnalysisResultForId(analysisId);
      setReport(storedResult?.analysis ?? initialReport ?? mockAnalysisReport);
      setScreenshotUrl(storedResult?.screenshotDataUrl ?? initialScreenshotUrl);
      setSource(storedResult?.source ?? initialSource);
      setWarning(storedResult?.warning ?? initialWarning);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [analysisId, initialReport, initialScreenshotUrl, initialSource, initialWarning]);

  return (
    <ReportView
      analysisId={analysisId}
      report={report ?? mockAnalysisReport}
      screenshotUrl={screenshotUrl}
      source={source}
      warning={warning}
    />
  );
}
