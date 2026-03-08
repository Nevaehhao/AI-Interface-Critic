"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import {
  buildAnalysisReportPdf,
  createAnalysisPdfFileName,
} from "@/lib/report-pdf";
import type { AnalysisReport } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";
import {
  ReportScreenshotPreview,
  type HighlightableIssue,
} from "@/components/report/report-screenshot-preview";

function severityTone(severity: string) {
  if (severity === "high") {
    return "status-badge status-badge-error";
  }

  if (severity === "medium") {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-neutral";
}

function sourceTone(source: AnalysisSource) {
  return source === "ollama"
    ? "status-badge status-badge-success"
    : "status-badge status-badge-warning";
}

function flattenHighlightableIssues(report: AnalysisReport): HighlightableIssue[] {
  return report.sections.flatMap((section) =>
    section.issues
      .filter((issue) => issue.highlights.length > 0)
      .map((issue) => ({
        description: issue.description,
        highlights: issue.highlights,
        id: issue.id,
        sectionTitle: section.title,
        severity: issue.severity,
        title: issue.title,
      })),
  );
}

export function ReportView({
  analysisId,
  report,
  screenshotUrl = null,
  source = "mock",
  warning = null,
}: {
  analysisId: string;
  report: AnalysisReport;
  screenshotUrl?: string | null;
  source?: AnalysisSource;
  warning?: string | null;
}) {
  const highlightableIssues = flattenHighlightableIssues(report);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    highlightableIssues[0]?.id ?? null,
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const selectedIssue =
    highlightableIssues.find((issue) => issue.id === selectedIssueId) ?? highlightableIssues[0] ?? null;

  async function handleExportPdf() {
    try {
      setIsExportingPdf(true);
      setExportError(null);

      const pdfBytes = await buildAnalysisReportPdf({
        analysisId,
        report,
        source,
      });
      const pdfBlob = new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = createAnalysisPdfFileName(report, analysisId);
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Unable to export this report as PDF.",
      );
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/upload" className="material-button material-button-text w-fit px-0">
            Back to upload
          </Link>
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isExportingPdf}
            className="material-button material-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingPdf ? "Exporting..." : "Export PDF"}
          </button>
        </div>

        {source === "ollama" ? (
          <div className="surface-card px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={sourceTone(source)}>Ollama result</span>
              <p className="text-sm text-[var(--color-muted)]">
                This report was generated from the local Ollama model.
              </p>
            </div>
          </div>
        ) : (
          <div className="surface-card border-[rgba(234,134,0,0.24)] bg-[var(--color-warning-soft)] px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={sourceTone(source)}>Fallback result</span>
                <p className="text-sm text-[var(--color-muted)]">
                  Ollama did not complete this run, so the app showed fallback output instead.
                </p>
              </div>
              {warning ? (
                <p className="text-sm leading-7 text-[var(--color-foreground)]">Reason: {warning}</p>
              ) : null}
            </div>
          </div>
        )}

        {exportError ? (
          <div className="rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {exportError}
          </div>
        ) : null}

        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="eyebrow">Report</p>
              <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
                {report.summary.mainFinding}
              </h1>
              <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                Product type: {report.summary.productType}
              </p>
            </div>
            <div className="surface-muted min-w-40 p-5 text-center">
              <p className="eyebrow">Overall score</p>
              <p className="mt-3 text-5xl font-medium tracking-tight text-[var(--color-accent)]">
                {report.summary.overallScore}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="surface-muted p-5">
              <p className="eyebrow">Strengths</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
                {report.summary.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Next action</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                {report.summary.nextAction}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                <span className="app-chip">Analysis {analysisId}</span>
                <span className="app-chip">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="surface-card p-6">
            <p className="eyebrow">Screenshot</p>
            <h2 className="mt-4 text-2xl tracking-tight">Issue map</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              Select an issue to see its mapped region on the screenshot.
            </p>

            <div className="mt-6">
              <ReportScreenshotPreview
                fallbackImageUrl={screenshotUrl}
                issues={highlightableIssues}
                selectedIssueId={selectedIssue?.id ?? null}
                onSelectIssue={setSelectedIssueId}
              />
            </div>
          </aside>

          <div className="grid gap-4">
            {report.sections.map((section) => (
              <section key={section.id} className="surface-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">{section.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      {section.summary}
                    </p>
                  </div>
                  <span className="app-chip">Score {section.score}</span>
                </div>

                <div className="mt-5 grid gap-3">
                  {section.issues.map((issue) => {
                    const isSelected = selectedIssue?.id === issue.id;

                    return (
                      <article
                        key={issue.id}
                        className={`surface-muted p-4 ${isSelected ? "ring-2 ring-[var(--color-accent)]" : ""}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-lg font-medium">{issue.title}</h3>
                          <span className={severityTone(issue.severity)}>{issue.severity}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                          {issue.description}
                        </p>
                        <p className="mt-3 text-sm leading-7">{issue.recommendation}</p>
                        {issue.highlights.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="material-button material-button-secondary mt-4 px-4 py-2 text-sm"
                          >
                            Show on screenshot
                          </button>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        {report.redesignSuggestions.length > 0 ? (
          <section className="surface-card p-6 sm:p-8">
            <p className="eyebrow">Redesign suggestions</p>
            <h2 className="mt-4 text-3xl tracking-tight">What to improve next.</h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {report.redesignSuggestions.map((suggestion) => (
                <article key={suggestion.id} className="surface-muted p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-medium">{suggestion.title}</h3>
                    <span className="app-chip">{suggestion.priority}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {suggestion.summary}
                  </p>
                  <p className="mt-3 text-sm leading-7">{suggestion.expectedImpact}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
