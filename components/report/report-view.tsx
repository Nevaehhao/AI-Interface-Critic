"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  AnalysisReport,
  AnalysisSection,
} from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";
import {
  buildAnalysisReportPdf,
  createAnalysisPdfFileName,
} from "@/lib/report-pdf";
import { SiteHeader } from "@/components/layout/site-header";
import {
  ReportScreenshotPreview,
  type HighlightableIssue,
} from "@/components/report/report-screenshot-preview";

function scoreTone(score: number) {
  if (score >= 85) {
    return "status-badge status-badge-success";
  }

  if (score >= 70) {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-error";
}

function severityTone(severity: string) {
  if (severity === "high") {
    return "status-badge status-badge-error";
  }

  if (severity === "medium") {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-neutral";
}

function suggestionPriorityTone(priority: string) {
  if (priority === "now") {
    return "status-badge status-badge-primary";
  }

  if (priority === "next") {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-neutral";
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

function SectionCard({
  section,
  selectedIssueId,
  onSelectIssue,
}: {
  section: AnalysisSection;
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
}) {
  return (
    <section id={section.id} className="surface-card p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Section</p>
          <h2 className="mt-3 text-3xl tracking-tight">{section.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            {section.summary}
          </p>
        </div>

        <div className={scoreTone(section.score)}>Score {section.score}</div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {section.issues.map((issue) => {
          const isSelected = selectedIssueId === issue.id;
          const hasHighlights = issue.highlights.length > 0;

          return (
            <article
              key={issue.id}
              className={`surface-muted p-5 transition ${
                isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="eyebrow text-[var(--color-accent)]">
                    {section.title}
                  </p>
                  <h3 className="mt-3 text-xl tracking-tight">{issue.title}</h3>
                </div>
                <span className={severityTone(issue.severity)}>
                  {issue.severity} impact
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                {issue.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {hasHighlights ? (
                  <>
                    <span className="app-chip">
                      {issue.highlights.length} highlight
                      {issue.highlights.length > 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectIssue(issue.id)}
                      className="material-button material-button-secondary px-4 py-2 text-sm"
                    >
                      {isSelected ? "Highlighted on screenshot" : "Show on screenshot"}
                    </button>
                  </>
                ) : (
                  <span className="app-chip">No mapped region</span>
                )}
              </div>

              <div className="mt-5 rounded-[1.25rem] bg-white p-4 shadow-sm">
                <p className="eyebrow">Recommendation</p>
                <p className="mt-2 text-sm leading-7">{issue.recommendation}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ReportView({
  analysisId,
  report,
  screenshotUrl = null,
  source = "mock",
}: {
  analysisId: string;
  report: AnalysisReport;
  screenshotUrl?: string | null;
  source?: AnalysisSource;
}) {
  const highlightableIssues = flattenHighlightableIssues(report);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    highlightableIssues[0]?.id ?? null,
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const selectedIssue =
    highlightableIssues.find((issue) => issue.id === selectedIssueId) ?? null;
  const activeSelectedIssue = selectedIssue ?? highlightableIssues[0] ?? null;
  const activeSelectedIssueId = activeSelectedIssue?.id ?? null;

  async function handleExportPdf() {
    try {
      setIsExportingPdf(true);
      setExportError(null);

      const pdfBytes = await buildAnalysisReportPdf({
        analysisId,
        report,
        source,
      });
      const pdfByteArray = Uint8Array.from(pdfBytes);
      const pdfBlob = new Blob([pdfByteArray], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = createAnalysisPdfFileName(report, analysisId);
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Unable to export this report as PDF.",
      );
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
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
            {isExportingPdf ? "Exporting PDF..." : "Export report as PDF"}
          </button>
        </div>

        {exportError ? (
          <div className="rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {exportError}
          </div>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="app-chip">Analysis {analysisId}</span>
              <span
                className={
                  source === "ollama"
                    ? "status-badge status-badge-primary"
                    : "status-badge status-badge-success"
                }
              >
                {source === "ollama" ? "Ollama analysis" : "Mock fallback"}
              </span>
              <span className="app-chip">
                {new Date(report.createdAt).toLocaleString()}
              </span>
              <span className="app-chip">
                {highlightableIssues.length} mapped issue
                {highlightableIssues.length === 1 ? "" : "s"}
              </span>
              <span className="app-chip">
                {report.redesignSuggestions.length} redesign suggestion
                {report.redesignSuggestions.length === 1 ? "" : "s"}
              </span>
            </div>

            <h1 className="mt-5 text-4xl tracking-tight sm:text-5xl">
              Structured UX critique for a {report.summary.productType}.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
              {report.summary.mainFinding}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-[0.62fr_1fr]">
              <div className="surface-tonal p-5">
                <p className="eyebrow">Overall score</p>
                <p className="mt-3 text-6xl font-medium tracking-tight text-[var(--color-accent)]">
                  {report.summary.overallScore}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  A concise signal for how strong the interface feels before reading the details.
                </p>
              </div>

              <div className="surface-muted p-5">
                <p className="eyebrow">Strong signals</p>
                <ul className="mt-4 space-y-3 text-sm leading-7">
                  {report.summary.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
                <div className="mt-5 rounded-[1.25rem] bg-white p-4 shadow-sm">
                  <p className="eyebrow">Next action</p>
                  <p className="mt-2 text-sm leading-7">
                    {report.summary.nextAction}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="surface-tonal space-y-5 p-6">
            <div>
              <p className="eyebrow">Screenshot context</p>
              <h2 className="mt-3 text-3xl tracking-tight">
                Highlighted issue map
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Select an issue card to focus the screenshot on the affected region.
              </p>
            </div>

            <ReportScreenshotPreview
              fallbackImageUrl={screenshotUrl}
              issues={highlightableIssues}
              selectedIssueId={activeSelectedIssueId}
              onSelectIssue={setSelectedIssueId}
            />

            <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
              <p className="eyebrow">Selected issue</p>
              {activeSelectedIssue ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="app-chip">{activeSelectedIssue.sectionTitle}</span>
                    <span className={severityTone(activeSelectedIssue.severity)}>
                      {activeSelectedIssue.severity} impact
                    </span>
                  </div>
                  <h3 className="text-xl tracking-tight">{activeSelectedIssue.title}</h3>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {activeSelectedIssue.description}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  This report does not include mapped screenshot regions yet.
                </p>
              )}
            </div>

            <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
              <p className="eyebrow">Jump to section</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="#redesign-suggestions"
                  className="material-button material-button-secondary px-4 py-2 text-sm"
                >
                  Redesign suggestions
                </a>
                {report.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="material-button material-button-secondary px-4 py-2 text-sm"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="redesign-suggestions" className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="eyebrow">Redesign suggestions</p>
              <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
                A clearer plan for what to redesign next.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
                These suggestions roll multiple issue-level observations into broader design moves
                you can take back into a real iteration cycle.
              </p>
            </div>
            <span className="app-chip">
              Suggested improvements module
            </span>
          </div>

          {report.redesignSuggestions.length > 0 ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {report.redesignSuggestions.map((suggestion) => (
                <article key={suggestion.id} className="surface-muted p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={suggestionPriorityTone(suggestion.priority)}>
                      {suggestion.priority}
                    </span>
                    <span className="app-chip">Redesign direction</span>
                  </div>
                  <h3 className="mt-4 text-xl tracking-tight">{suggestion.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {suggestion.summary}
                  </p>

                  <div className="mt-4 rounded-[1.25rem] bg-white p-4 shadow-sm">
                    <p className="eyebrow">Why this matters</p>
                    <p className="mt-2 text-sm leading-7">{suggestion.rationale}</p>
                  </div>

                  <div className="mt-4">
                    <p className="eyebrow">Actions</p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                      {suggestion.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] bg-[var(--color-accent-soft)] p-4">
                    <p className="eyebrow text-[var(--color-accent)]">Expected impact</p>
                    <p className="mt-2 text-sm leading-7">{suggestion.expectedImpact}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-muted mt-8 p-5">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                This older report does not include dedicated redesign suggestions yet.
              </p>
            </div>
          )}
        </section>

        <div className="grid gap-6">
          {report.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              selectedIssueId={activeSelectedIssueId}
              onSelectIssue={setSelectedIssueId}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
