"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getAnalysisResultForId, type AnalysisSource } from "@/lib/analysis-result";
import type { AnalysisReport } from "@/lib/analysis-report";
import { resolveReportClientState } from "@/lib/report-client-state";
import { ReportView } from "@/components/report/report-view";

export function ReportPageClient({
  analysisId,
  initialReport = null,
  initialScreenshotUrl = null,
  initialShareUrl = null,
  initialSource = "mock",
  initialWarning = null,
  viewerUserId = null,
}: {
  analysisId: string;
  initialReport?: AnalysisReport | null;
  initialScreenshotUrl?: string | null;
  initialShareUrl?: string | null;
  initialSource?: AnalysisSource;
  initialWarning?: string | null;
  viewerUserId?: string | null;
}) {
  const [reportState, setReportState] = useState(() =>
    resolveReportClientState({
      analysisId,
      initialReport,
      initialScreenshotUrl,
      initialSource,
      initialWarning,
    }),
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedResult = getAnalysisResultForId(analysisId, { viewerUserId });
      setReportState(
        resolveReportClientState({
          analysisId,
          initialReport,
          initialScreenshotUrl,
          initialSource,
          initialWarning,
          storedResult,
        }),
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [analysisId, initialReport, initialScreenshotUrl, initialSource, initialWarning, viewerUserId]);

  if (!reportState.report) {
    return (
      <div className="page-shell">
        <SiteHeader />

        <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-6 pb-20 pt-32 sm:px-8">
          <section className="surface-card p-8">
            <p className="eyebrow">Report not found</p>
            <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.05em]">
              This analysis is no longer available.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-muted)]">
              Open a report from history or run a new analysis first. Demo reports are still
              available at <span className="font-medium text-[var(--color-foreground)]">/report/demo</span>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/history" className="material-button material-button-secondary">
                Open history
              </Link>
              <Link href="/upload" className="material-button material-button-primary">
                Start new analysis
              </Link>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    );
  }

  return (
    <ReportView
      analysisId={analysisId}
      initialShareUrl={initialShareUrl}
      report={reportState.report}
      screenshotUrl={reportState.screenshotUrl}
      source={reportState.source}
      warning={reportState.warning}
    />
  );
}
