"use client";

import { useEffect, useState } from "react";

import {
  clearPendingAnalysisDraft,
  loadPendingAnalysisDraft,
  type PendingAnalysisDraft,
} from "@/lib/analysis-draft";
import { formatBytes } from "@/lib/uploads";

export function ReportScreenshotPreview({
  fallbackImageUrl = null,
}: {
  fallbackImageUrl?: string | null;
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

  return (
    <div className="space-y-4">
      <div
        aria-label="Analyzed screenshot preview"
        className="aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-white bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url("${draft?.dataUrl ?? fallbackImageUrl ?? ""}")`,
        }}
      >
      </div>

      <div className="surface-card rounded-[1.5rem] p-4 shadow-none">
        {draft ? (
          <>
            <p className="text-sm">{draft.name}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
              <span className="app-chip px-3 py-1 text-xs">
                {draft.type}
              </span>
              <span className="app-chip px-3 py-1 text-xs">
                {formatBytes(draft.size)}
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
            This image was loaded from saved analysis history.
          </p>
        )}
      </div>
    </div>
  );
}
