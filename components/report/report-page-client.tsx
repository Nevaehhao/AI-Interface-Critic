"use client";

import { useEffect, useState } from "react";

import { getAnalysisForId } from "@/lib/analysis-result";
import { mockAnalysisReport, type AnalysisReport } from "@/lib/analysis-report";
import { ReportView } from "@/components/report/report-view";

export function ReportPageClient({
  analysisId,
  initialReport = null,
}: {
  analysisId: string;
  initialReport?: AnalysisReport | null;
}) {
  const [report, setReport] = useState<AnalysisReport | null>(
    initialReport ?? (analysisId === "demo" ? mockAnalysisReport : null),
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedReport = getAnalysisForId(analysisId);
      setReport(storedReport ?? initialReport ?? mockAnalysisReport);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [analysisId, initialReport]);

  return <ReportView analysisId={analysisId} report={report ?? mockAnalysisReport} />;
}
