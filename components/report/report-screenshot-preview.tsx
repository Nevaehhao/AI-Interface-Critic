"use client";

import { useEffect, useState } from "react";

import type { AnalysisIssue, AnalysisIssueHighlight } from "@/lib/analysis-report";
import {
  clearPendingAnalysisDraft,
  loadPendingAnalysisDraft,
  type PendingAnalysisDraft,
} from "@/lib/analysis-draft";
import { formatBytes } from "@/lib/uploads";

export type HighlightableIssue = Pick<
  AnalysisIssue,
  "description" | "id" | "severity" | "title"
> & {
  highlights: AnalysisIssueHighlight[];
  sectionTitle: string;
};

export function ReportScreenshotPreview({
  fallbackImageUrl = null,
  issues = [],
  selectedIssueId = null,
  onSelectIssue,
}: {
  fallbackImageUrl?: string | null;
  issues?: HighlightableIssue[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string) => void;
}) {
  const [draft, setDraft] = useState<PendingAnalysisDraft | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDraft(loadPendingAnalysisDraft());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  if (!draft && !fallbackImageUrl) {
    return (
      <div className="surface-muted border-dashed p-5">
        <p className="text-sm leading-7 text-[var(--color-muted)]">
          No screenshot preview is available yet. Once the upload flow runs, the
          report will show the analyzed image here.
        </p>
      </div>
    );
  }

  const previewDraft = fallbackImageUrl ? null : draft;
  const backgroundImage = fallbackImageUrl ?? previewDraft?.dataUrl ?? "";
  const selectedIssue =
    issues.find((issue) => issue.id === selectedIssueId) ?? issues[0] ?? null;
  const selectedHighlights = selectedIssue?.highlights ?? [];

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-white">
        <div
          aria-label="Analyzed screenshot preview"
          className="absolute inset-0 bg-cover bg-center"
          role="img"
          style={{
            backgroundImage: `url("${backgroundImage}")`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(255,255,255,0.1)]" />

        {selectedIssue ? (
          <div className="absolute inset-x-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm backdrop-blur">
            Focused issue: {selectedIssue.title}
          </div>
        ) : null}

        {selectedHighlights.map((highlight, highlightIndex) => (
          <div
            key={`${selectedIssue?.id ?? "issue"}-${highlight.id}`}
            aria-label={`Highlight ${selectedIssue?.title ?? ""}`}
            className="absolute rounded-xl border-[3px] border-[var(--color-accent)] bg-[rgba(26,115,232,0.12)] shadow-[0_0_0_9999px_rgba(255,255,255,0.2)] transition"
            style={{
              height: `${highlight.height}%`,
              left: `${highlight.x}%`,
              top: `${highlight.y}%`,
              width: `${highlight.width}%`,
              zIndex: 2,
            }}
          >
            <span className="absolute -top-3 left-3 rounded-full bg-[var(--color-accent)] px-2 py-1 text-[10px] font-medium tracking-[0.04em] text-white shadow-sm">
              {highlightIndex + 1}
            </span>
          </div>
        ))}
      </div>

      {selectedIssue ? (
        <div className="surface-card rounded-[1.5rem] p-4 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Selected issue</p>
              <h3 className="mt-2 text-lg font-medium">{selectedIssue.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                {selectedIssue.description}
              </p>
            </div>
            <span className="app-chip">{selectedIssue.sectionTitle}</span>
          </div>

          {selectedHighlights.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedHighlights.map((highlight, highlightIndex) => (
                <span key={highlight.id} className="app-chip">
                  Area {highlightIndex + 1}: {highlight.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="surface-card rounded-[1.5rem] p-4 shadow-none">
          <p className="eyebrow">Mapped issues</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {issues.map((issue) => {
              const isSelected = issue.id === selectedIssue?.id;

              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onSelectIssue?.(issue.id)}
                  className={`material-button px-4 py-2 text-sm ${
                    isSelected
                      ? "material-button-primary"
                      : "material-button-secondary"
                  }`}
                >
                  {issue.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="surface-card rounded-[1.5rem] p-4 shadow-none">
        {previewDraft ? (
          <>
            <p className="text-sm">{previewDraft.name}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
              <span className="app-chip px-3 py-1 text-xs">{previewDraft.type}</span>
              <span className="app-chip px-3 py-1 text-xs">
                {formatBytes(previewDraft.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearPendingAnalysisDraft();
                setDraft(null);
              }}
              className="material-button material-button-text mt-4 px-0 py-0 text-sm"
            >
              Clear preview
            </button>
          </>
        ) : (
          <p className="text-sm leading-7 text-[var(--color-muted)]">
            This image was loaded from the saved report record.
          </p>
        )}
      </div>
    </div>
  );
}
