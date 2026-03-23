"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import {
  ReportScreenshotPreview,
  type HighlightableIssue,
} from "@/components/report/report-screenshot-preview";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getAnalysisModeLabel } from "@/lib/analysis-context";
import { updateIssueTriage, type AnalysisReport } from "@/lib/analysis-report";
import { buildBuilderBrief } from "@/lib/builder-brief";
import type { AnalysisSource } from "@/lib/analysis-result";
import { updateStoredAnalysisReport } from "@/lib/analysis-result";
import {
  buildAnalysisReportPdf,
  createAnalysisPdfFileName,
} from "@/lib/report-pdf";

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
    return "Generated from the local Ollama model.";
  }

  if (source === "openai-compatible") {
    return "Generated through a configured OpenAI-compatible API.";
  }

  if (source === "anthropic") {
    return "Generated through a configured Anthropic model.";
  }

  if (source === "gemini") {
    return "Generated through a configured Gemini model.";
  }

  return "The configured provider did not complete the run, so fallback output was used.";
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
  return "The configured provider did not complete the run, so fallback output was used.";
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

function createAnalysisJsonFileName(report: AnalysisReport, analysisId: string) {
  const normalizedType = report.summary.productType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `ai-interface-critic-${normalizedType || "report"}-${analysisId}.json`;
}

function resolveAbsoluteShareUrl(shareUrl: string | null) {
  if (!shareUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(shareUrl)) {
    return shareUrl;
  }

  if (typeof window === "undefined") {
    return shareUrl;
  }

  return new URL(shareUrl, window.location.origin).toString();
}

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(Math.min(score, 100), 0) / 100) * circumference;

  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgba(224,226,236,0.95)"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="var(--color-accent)"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl font-extrabold tracking-[-0.05em]">
          {(score / 10).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function ActionMessage({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`surface-card px-5 py-4 text-sm ${
        tone === "error" ? "bg-[var(--color-error-soft)] text-[var(--color-error)]" : "text-[var(--color-muted)]"
      }`}
    >
      {children}
    </div>
  );
}

export function ReportView({
  analysisId,
  report,
  screenshotUrl = null,
  source = "mock",
  warning = null,
  initialShareUrl = null,
  isReadOnly = false,
}: {
  analysisId: string;
  report: AnalysisReport;
  screenshotUrl?: string | null;
  source?: AnalysisSource;
  warning?: string | null;
  initialShareUrl?: string | null;
  isReadOnly?: boolean;
}) {
  const [currentReport, setCurrentReport] = useState(report);
  const [triageNotes, setTriageNotes] = useState<Record<string, string>>({});
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    flattenHighlightableIssues(report)[0]?.id ?? null,
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const [shareLink, setShareLink] = useState(() => resolveAbsoluteShareUrl(initialShareUrl));
  const [triageSavingId, setTriageSavingId] = useState<string | null>(null);
  const [triageMessage, setTriageMessage] = useState<string | null>(null);
  const highlightableIssues = flattenHighlightableIssues(currentReport);

  useEffect(() => {
    setCurrentReport(report);
    setSelectedIssueId(flattenHighlightableIssues(report)[0]?.id ?? null);
    setShareLink(resolveAbsoluteShareUrl(initialShareUrl));
    setCopyState("idle");
    setShareState("idle");
    setExportError(null);
    setTriageSavingId(null);
    setTriageMessage(null);
    setTriageNotes(
      Object.fromEntries(
        report.sections.flatMap((section) =>
          section.issues.map((issue) => [issue.id, issue.triageNote ?? ""]),
        ),
      ),
    );
  }, [initialShareUrl, report]);

  const selectedIssue =
    highlightableIssues.find((issue) => issue.id === selectedIssueId) ??
    highlightableIssues[0] ??
    null;

  async function handleExportPdf() {
    try {
      setIsExportingPdf(true);
      setExportError(null);

      const pdfBytes = await buildAnalysisReportPdf({
        analysisId,
        report: currentReport,
        source,
      });
      const pdfBlob = new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = createAnalysisPdfFileName(currentReport, analysisId);
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
          report: currentReport,
          source,
        }),
      );
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function handleExportJson() {
    const jsonBlob = new Blob([JSON.stringify(currentReport, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = createAnalysisJsonFileName(currentReport, analysisId);
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  async function handleSaveIssueTriage(
    issueId: string,
    triageStatus: "open" | "fixed" | "ignored" | "revisit",
  ) {
    const nextReport = updateIssueTriage(currentReport, {
      issueId,
      triageNote: triageNotes[issueId]?.trim() || null,
      triageStatus,
    });

    setCurrentReport(nextReport);
    updateStoredAnalysisReport(analysisId, nextReport);
    setTriageSavingId(issueId);
    setTriageMessage(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}/triage`, {
        body: JSON.stringify({
          issueId,
          triageNote: triageNotes[issueId]?.trim() || null,
          triageStatus,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Saved locally, but the server copy could not be updated.");
      }

      const payload = (await response.json()) as {
        report?: AnalysisReport;
      };

      if (payload.report) {
        setCurrentReport(payload.report);
        updateStoredAnalysisReport(analysisId, payload.report);
      }

      setTriageMessage("Issue triage updated.");
    } catch (error) {
      setTriageMessage(
        error instanceof Error
          ? error.message
          : "Saved locally, but the server copy could not be updated.",
      );
    } finally {
      setTriageSavingId(null);
    }
  }

  async function handleCopyShareLink() {
    try {
      const response = await fetch(`/api/analyses/${analysisId}/share`, {
        body: JSON.stringify({
          enabled: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to create a share link for this report.");
      }

      const payload = (await response.json()) as {
        shareUrl?: string | null;
      };

      if (!payload.shareUrl) {
        throw new Error("Unable to create a share link for this report.");
      }

      const resolvedShareUrl = resolveAbsoluteShareUrl(payload.shareUrl);

      if (!resolvedShareUrl) {
        throw new Error("Unable to create a share link for this report.");
      }

      await navigator.clipboard.writeText(resolvedShareUrl);
      setShareLink(resolvedShareUrl);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Analysis session #{analysisId.slice(0, 8)}</p>
            <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.05em]">
              Design Critique:{" "}
              <span className="text-[var(--color-accent)]">{currentReport.summary.productType}</span>
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
              {currentReport.summary.mainFinding}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/upload" className="material-button material-button-text">
              Back to upload
            </Link>
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
            {!isReadOnly ? (
              <button
                type="button"
                onClick={() => void handleCopyShareLink()}
                className="material-button material-button-secondary"
              >
                {shareState === "copied"
                  ? "Share link copied"
                  : shareState === "error"
                    ? "Share failed"
                    : "Copy share link"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleExportJson}
              className="material-button material-button-secondary"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => void handleExportPdf()}
              disabled={isExportingPdf}
              className="material-button material-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingPdf ? "Exporting..." : "Download report"}
            </button>
          </div>
        </header>

        {exportError ? <ActionMessage tone="error">{exportError}</ActionMessage> : null}
        {triageMessage ? <ActionMessage>{triageMessage}</ActionMessage> : null}
        {shareLink && !isReadOnly ? (
          <ActionMessage>
            Share link:{" "}
            <a
              href={shareLink}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[var(--color-accent)]"
            >
              {shareLink}
            </a>
          </ActionMessage>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.04fr_0.96fr]">
          <section className="surface-card p-6 xl:sticky xl:top-28 xl:self-start">
            <ReportScreenshotPreview
              fallbackImageUrl={screenshotUrl}
              issues={highlightableIssues}
              selectedIssueId={selectedIssue?.id ?? null}
              onSelectIssue={setSelectedIssueId}
            />
            <div className="mt-6 flex items-center gap-4 px-2">
              <p className="eyebrow text-[var(--color-muted)]">Hover numbers to view detailed AI notes</p>
              <div className="h-px flex-1 bg-white/60" />
            </div>
          </section>

          <section className="space-y-5">
            <div className="surface-card p-6">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.04em]">Curator&apos;s Rating</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {currentReport.summary.nextAction}
                  </p>
                </div>
                <ScoreRing score={currentReport.summary.overallScore} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="surface-muted p-4">
                  <p className="eyebrow text-[var(--color-muted)]">Accessibility</p>
                  <p className="mt-3 text-lg font-bold text-[var(--color-error)]">
                    {currentReport.sections.find((section) => section.id === "accessibility")?.score &&
                    currentReport.sections.find((section) => section.id === "accessibility")!.score < 80
                      ? "Fail (AA)"
                      : "Passing"}
                  </p>
                </div>
                <div className="surface-muted p-4">
                  <p className="eyebrow text-[var(--color-muted)]">Consistency</p>
                  <p className="mt-3 text-lg font-bold text-[var(--color-accent)]">
                    {currentReport.summary.strengths[0] ?? "Strong"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="app-chip">{getAnalysisModeLabel(currentReport.context.analysisMode)}</span>
                <span className="app-chip">
                  {currentReport.context.pageCaptureMode === "url-capture"
                    ? "Captured from URL"
                    : "Uploaded screenshot"}
                </span>
                <span className="app-chip">Analysis {analysisId}</span>
              </div>
            </div>

            {isLiveResult(source) ? (
              <div className="surface-card p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={sourceTone(source)}>{sourceLabel(source)}</span>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {sourceDescription(source)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="surface-card bg-[var(--color-warning-soft)] p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={sourceTone(source)}>{sourceLabel(source)}</span>
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      {fallbackDescription()}
                    </p>
                  </div>
                  {warning ? (
                    <p className="text-sm leading-7 text-[var(--color-foreground)]">Reason: {warning}</p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {currentReport.sections.map((section) => (
                <section key={section.id} className="surface-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-soft)]" />
                      <div>
                        <h3 className="text-xl font-bold tracking-[-0.04em]">{section.title}</h3>
                        <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                          {section.summary}
                        </p>
                      </div>
                    </div>
                    <span className="app-chip">{section.score}/100</span>
                  </div>

                  <div className="mt-4 rounded-[1rem] bg-[rgba(255,255,255,0.66)] px-4 py-3 text-sm leading-7 text-[var(--color-muted)]">
                    {section.issues[0]?.description ?? "No issues highlighted in this section."}
                  </div>
                </section>
              ))}
            </div>

            <div className="surface-muted p-6">
              <p className="eyebrow">Expert mode</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                {isReadOnly
                  ? "This shared report is read-only. Open the original report to update triage or copy implementation handoff."
                  : "Copy the builder brief or share link when you want to move this critique into implementation."}
              </p>
              {!isReadOnly ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyBuilderBrief()}
                    className="material-button material-button-secondary w-full"
                  >
                    Copy builder brief
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyShareLink()}
                    className="material-button material-button-secondary w-full"
                  >
                    Copy share link
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Review brief</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
            What the model was optimizing for.
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <DetailListCard
              emptyLabel="No page or repository URLs were provided for this run."
              items={[
                ...(currentReport.context.pageUrl ? [`Live page: ${currentReport.context.pageUrl}`] : []),
                ...(currentReport.context.pageTitle ? [`Page title: ${currentReport.context.pageTitle}`] : []),
                ...(currentReport.context.repoUrl ? [`Repository: ${currentReport.context.repoUrl}`] : []),
              ]}
              title="Attached links"
            />
            <DetailListCard
              emptyLabel="No extra audience or business context was attached."
              items={[
                ...(currentReport.context.productGoal ? [`Goal: ${currentReport.context.productGoal}`] : []),
                ...(currentReport.context.targetAudience
                  ? [`Audience: ${currentReport.context.targetAudience}`]
                  : []),
                ...(currentReport.context.notes ? [`Notes: ${currentReport.context.notes}`] : []),
              ]}
              title="Product context"
            />
            <DetailListCard
              emptyLabel="No repository summary was generated for this run."
              items={[
                ...(currentReport.context.repoSummary ? [currentReport.context.repoSummary] : []),
                ...currentReport.context.repoEntryPoints.map((entryPoint) => `Inspect: ${entryPoint}`),
              ]}
              title="Repository intake"
            />
          </div>
        </section>

        <section className="grid gap-6">
          {currentReport.sections.map((section) => (
            <section key={section.id} className="surface-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">{section.title}</p>
                  <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
                    Detailed findings
                  </h2>
                  <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-muted)]">
                    {section.summary}
                  </p>
                </div>
                <span className="app-chip">Score {section.score}</span>
              </div>

              <div className="mt-6 grid gap-4">
                {section.issues.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;

                  return (
                    <article
                      key={issue.id}
                      className={`surface-muted p-5 ${
                        isSelected ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-white/40" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-2xl font-bold tracking-[-0.04em]">{issue.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="app-chip">{issue.implementationComplexity}</span>
                          <span className="app-chip">
                            Confidence {Math.round(issue.confidence * 100)}%
                          </span>
                          <span className={severityTone(issue.severity)}>{issue.severity}</span>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                        {issue.description}
                      </p>

                      {issue.heuristics.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {issue.heuristics.map((heuristic) => (
                            <span key={`${issue.id}-${heuristic}`} className="app-chip">
                              {heuristic}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {issue.evidence.length > 0 ? (
                        <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                          {issue.evidence.map((evidence) => (
                            <li key={`${issue.id}-${evidence}`}>{evidence}</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="mt-4 rounded-[1rem] bg-white/70 px-4 py-4 text-sm leading-7">
                        {issue.recommendation}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="app-chip">Status {issue.triageStatus}</span>
                        {issue.triageUpdatedAt ? (
                          <span className="app-chip">
                            Updated {new Date(issue.triageUpdatedAt).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>

                      {!isReadOnly ? (
                        <div className="mt-5 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {(["open", "fixed", "ignored", "revisit"] as const).map((status) => (
                              <button
                                key={`${issue.id}-${status}`}
                                type="button"
                                disabled={triageSavingId === issue.id}
                                onClick={() => void handleSaveIssueTriage(issue.id, status)}
                                className={`material-button px-3 py-2 text-sm ${
                                  issue.triageStatus === status
                                    ? "material-button-primary"
                                    : "material-button-secondary"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={triageNotes[issue.id] ?? ""}
                            onChange={(event) =>
                              setTriageNotes((currentNotes) => ({
                                ...currentNotes,
                                [issue.id]: event.target.value,
                              }))
                            }
                            placeholder="Add a note for follow-up, rationale, or implementation context."
                            className="w-full rounded-[1rem] px-4 py-3 text-sm"
                          />
                          <button
                            type="button"
                            disabled={triageSavingId === issue.id}
                            onClick={() => void handleSaveIssueTriage(issue.id, issue.triageStatus)}
                            className="material-button material-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {triageSavingId === issue.id ? "Saving..." : "Save note"}
                          </button>
                        </div>
                      ) : null}

                      {issue.highlights.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedIssueId(issue.id)}
                          className="material-button material-button-text mt-4 px-0"
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
        </section>

        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Builder handoff</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
            Implementation plan for a full-stack pass.
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-muted)]">
            {currentReport.implementationPlan.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="app-chip">
              Estimated scope {currentReport.implementationPlan.estimatedScope}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DetailListCard
              emptyLabel="No front-end tasks were generated."
              items={currentReport.implementationPlan.frontendChanges}
              title="Front-end changes"
            />
            <DetailListCard
              emptyLabel="No back-end changes were generated."
              items={currentReport.implementationPlan.backendChanges}
              title="Back-end changes"
            />
            <DetailListCard
              emptyLabel="No file hints were generated."
              items={currentReport.implementationPlan.filesToInspect}
              title="Files to inspect"
            />
            <DetailListCard
              emptyLabel="No risks were called out."
              items={currentReport.implementationPlan.risks}
              title="Risks"
            />
          </div>

          <div className="mt-4">
            <DetailListCard
              emptyLabel="No acceptance criteria were generated."
              items={currentReport.implementationPlan.acceptanceCriteria}
              title="Acceptance criteria"
            />
          </div>
        </section>

        {currentReport.redesignSuggestions.length > 0 ? (
          <section className="surface-card p-6 sm:p-8">
            <p className="eyebrow">Redesign suggestions</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">What to improve next.</h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {currentReport.redesignSuggestions.map((suggestion) => (
                <article key={suggestion.id} className="surface-muted p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold tracking-[-0.04em]">{suggestion.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="app-chip">{suggestion.priority}</span>
                      <span className="app-chip">{suggestion.implementationComplexity}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {suggestion.summary}
                  </p>
                  <p className="mt-4 text-sm leading-7">{suggestion.expectedImpact}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
