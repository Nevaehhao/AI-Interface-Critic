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
      <div className="rounded-[1.75rem] border border-dashed border-[var(--color-line)] bg-[#090d18] p-5">
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
        className="aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090d18] bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url("${draft?.dataUrl ?? fallbackImageUrl ?? ""}")`,
        }}
      >
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-4">
        {draft ? (
          <>
            <p className="text-sm text-white">{draft.name}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
              <span className="rounded-full border border-white/8 px-3 py-1">
                {draft.type}
              </span>
              <span className="rounded-full border border-white/8 px-3 py-1">
                {formatBytes(draft.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearPendingAnalysisDraft();
                setDraft(null);
              }}
              className="mt-4 text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
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
