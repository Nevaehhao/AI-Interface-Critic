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
}: {
  analysisId: string;
  initialReport?: AnalysisReport | null;
  initialScreenshotUrl?: string | null;
  initialSource?: AnalysisSource;
}) {
  const [report, setReport] = useState<AnalysisReport | null>(
    initialReport ?? (analysisId === "demo" ? mockAnalysisReport : null),
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(initialScreenshotUrl);
  const [source, setSource] = useState<AnalysisSource>(initialSource);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedResult = getAnalysisResultForId(analysisId);
      setReport(storedResult?.analysis ?? initialReport ?? mockAnalysisReport);
      setScreenshotUrl(storedResult?.screenshotDataUrl ?? initialScreenshotUrl);
      setSource(storedResult?.source ?? initialSource);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [analysisId, initialReport, initialScreenshotUrl, initialSource]);

  return (
    <ReportView
      analysisId={analysisId}
      report={report ?? mockAnalysisReport}
      screenshotUrl={screenshotUrl}
      source={source}
    />
  );
}
