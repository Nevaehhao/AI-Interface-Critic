"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { getAnalysisModeLabel } from "@/lib/analysis-context";
import { buildBuilderBrief } from "@/lib/builder-brief";
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

function DetailListCard({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="surface-muted p-5">
      <p className="eyebrow">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
          {items.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{emptyLabel}</p>
      )}
    </div>
  );
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

function sourceTone(source: AnalysisSource) {
  return source === "mock"
    ? "status-badge status-badge-warning"
    : "status-badge status-badge-success";
}

function sourceLabel(source: AnalysisSource) {
  if (source === "ollama") {
    return "Ollama result";
  }

  if (source === "openai-compatible") {
    return "API model result";
  }

  if (source === "anthropic") {
    return "Anthropic result";
  }

  if (source === "gemini") {
    return "Gemini result";
  }

  return "Fallback result";
}

function sourceDescription(source: AnalysisSource) {
  if (source === "ollama") {
    return "This report was generated from the local Ollama model.";
  }

  if (source === "openai-compatible") {
    return "This report was generated through a user-configured OpenAI-compatible API.";
  }

  if (source === "anthropic") {
    return "This report was generated through a user-configured Anthropic model.";
  }

  if (source === "gemini") {
    return "This report was generated through a user-configured Gemini model.";
  }

  return "The configured provider did not complete this run, so the app showed fallback output instead.";
}

function isLiveResult(source: AnalysisSource) {
  return (
    source === "ollama" ||
    source === "openai-compatible" ||
    source === "anthropic" ||
    source === "gemini"
  );
}

function fallbackDescription() {
  return "The configured provider did not complete this run, so the app showed fallback output instead.";
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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

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

  async function handleCopyBuilderBrief() {
    try {
      await navigator.clipboard.writeText(
        buildBuilderBrief({
          analysisId,
          report,
          source,
        }),
      );
      setCopyState("copied");
    } catch {
      setCopyState("error");
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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleCopyBuilderBrief()}
              className="material-button material-button-secondary"
            >
              {copyState === "copied"
                ? "Builder brief copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy builder brief"}
            </button>
            <button
              type="button"
              onClick={() => void handleExportPdf()}
              disabled={isExportingPdf}
              className="material-button material-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingPdf ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>

        {isLiveResult(source) ? (
          <div className="surface-card px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={sourceTone(source)}>{sourceLabel(source)}</span>
              <p className="text-sm text-[var(--color-muted)]">
                {sourceDescription(source)}
              </p>
            </div>
          </div>
        ) : (
          <div className="surface-card border-[rgba(234,134,0,0.24)] bg-[var(--color-warning-soft)] px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={sourceTone(source)}>{sourceLabel(source)}</span>
                <p className="text-sm text-[var(--color-muted)]">
                  {fallbackDescription()}
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

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span className="app-chip">{getAnalysisModeLabel(report.context.analysisMode)}</span>
            {report.context.pageUrl ? <span className="app-chip">Page URL attached</span> : null}
            {report.context.repoUrl ? <span className="app-chip">Repo URL attached</span> : null}
            {report.context.techStack ? <span className="app-chip">{report.context.techStack}</span> : null}
          </div>
        </section>

        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Review brief</p>
          <h2 className="mt-4 text-3xl tracking-tight">What the model was optimizing for.</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DetailListCard
              emptyLabel="No page or repository URLs were provided for this run."
              items={[
                ...(report.context.pageUrl ? [`Live page: ${report.context.pageUrl}`] : []),
                ...(report.context.repoUrl ? [`Repository: ${report.context.repoUrl}`] : []),
              ]}
              title="Attached links"
            />
            <DetailListCard
              emptyLabel="No extra audience or business context was attached."
              items={[
                ...(report.context.productGoal ? [`Goal: ${report.context.productGoal}`] : []),
                ...(report.context.targetAudience
                  ? [`Audience: ${report.context.targetAudience}`]
                  : []),
                ...(report.context.notes ? [`Notes: ${report.context.notes}`] : []),
              ]}
              title="Product context"
            />
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="app-chip">{issue.implementationComplexity}</span>
                            <span className="app-chip">
                              Confidence {Math.round(issue.confidence * 100)}%
                            </span>
                            <span className={severityTone(issue.severity)}>{issue.severity}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                          {issue.description}
                        </p>
                        {issue.heuristics.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {issue.heuristics.map((heuristic) => (
                              <span key={`${issue.id}-${heuristic}`} className="app-chip">
                                {heuristic}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {issue.evidence.length > 0 ? (
                          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                            {issue.evidence.map((evidence) => (
                              <li key={`${issue.id}-${evidence}`}>{evidence}</li>
                            ))}
                          </ul>
                        ) : null}
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

        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Builder handoff</p>
          <h2 className="mt-4 text-3xl tracking-tight">Implementation plan for a full-stack pass.</h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-muted)]">
            {report.implementationPlan.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="app-chip">
              Estimated scope {report.implementationPlan.estimatedScope}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DetailListCard
              emptyLabel="No front-end tasks were generated."
              items={report.implementationPlan.frontendChanges}
              title="Front-end changes"
            />
            <DetailListCard
              emptyLabel="No back-end changes were generated."
              items={report.implementationPlan.backendChanges}
              title="Back-end changes"
            />
            <DetailListCard
              emptyLabel="No file hints were generated."
              items={report.implementationPlan.filesToInspect}
              title="Files to inspect"
            />
            <DetailListCard
              emptyLabel="No risks were called out."
              items={report.implementationPlan.risks}
              title="Risks"
            />
          </div>

          <div className="mt-4">
            <DetailListCard
              emptyLabel="No acceptance criteria were generated."
              items={report.implementationPlan.acceptanceCriteria}
              title="Acceptance criteria"
            />
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
                    <div className="flex flex-wrap gap-2">
                      <span className="app-chip">{suggestion.priority}</span>
                      <span className="app-chip">{suggestion.implementationComplexity}</span>
                    </div>
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
