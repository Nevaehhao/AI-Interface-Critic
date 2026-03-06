"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  dataUrlToFile,
  loadPendingAnalysisDraft,
} from "@/lib/analysis-draft";
import {
  analyzeResponseSchema,
  saveLatestAnalysisResult,
} from "@/lib/analysis-result";
import { formatBytes } from "@/lib/uploads";

const loadingSteps = [
  "Analyzing visual hierarchy",
  "Checking accessibility",
  "Evaluating layout structure",
  "Preparing structured critique",
] as const;

export function AnalysisLoadingView() {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [draft, setDraft] = useState<ReturnType<typeof loadPendingAnalysisDraft>>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDraft(loadPendingAnalysisDraft());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const currentDraft = draft;
    const stepInterval = window.setInterval(() => {
      setActiveStepIndex((currentIndex) =>
        currentIndex >= loadingSteps.length - 1 ? currentIndex : currentIndex + 1,
      );
    }, 1400);

    const controller = new AbortController();

    async function analyzeDraft() {
      try {
        const file = await dataUrlToFile(currentDraft);
        const formData = new FormData();
        formData.append("file", file);
        if (currentDraft.workspaceId) {
          formData.append("workspaceId", currentDraft.workspaceId);
        }

        const response = await fetch("/api/analyze", {
          body: formData,
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Analysis failed. Try uploading the screenshot again.");
        }

        const payload = analyzeResponseSchema.parse(await response.json());
        saveLatestAnalysisResult(payload);
        router.push(`/report/${payload.analysis.id}`);
      } catch (analyzeError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          analyzeError instanceof Error
            ? analyzeError.message
            : "Analysis failed. Try uploading the screenshot again.",
        );
      }
    }

    void analyzeDraft();

    return () => {
      window.clearInterval(stepInterval);
      controller.abort();
    };
  }, [draft, router]);

  if (!draft) {
    return (
      <div className="surface-card p-6 sm:p-8">
        <p className="eyebrow text-[var(--color-accent)]">
          Missing screenshot
        </p>
        <h1 className="mt-4 text-3xl tracking-tight sm:text-4xl">
          There is no pending upload to analyze.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
          Start from the upload flow so the loading state has a screenshot to
          process.
        </p>
        <Link
          href="/upload"
          className="material-button material-button-secondary mt-6"
        >
          Go to upload
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-card p-6 sm:p-8">
        <p className="eyebrow">
          Step 2
        </p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
          The screenshot is being reviewed.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          This loading state explains the critique process so the wait feels
          intentional instead of opaque.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          {loadingSteps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isComplete = index < activeStepIndex;

            return (
              <div
                key={step}
                className={`rounded-[1.5rem] border px-4 py-4 transition ${
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                    : isComplete
                      ? "border-[rgba(24,128,56,0.18)] bg-[var(--color-success-soft)]"
                      : "border-[var(--color-line)] bg-[rgba(255,255,255,0.7)]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    {isComplete ? "Complete" : isActive ? "In progress" : "Queued"}
                  </p>
                  <span className="font-mono text-sm text-[var(--color-muted)]">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-base">{step}</p>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="surface-tonal space-y-5 p-6">
        <div>
          <p className="eyebrow">
            Screenshot snapshot
          </p>
          <h2 className="mt-3 text-3xl tracking-tight">
            Current analysis input
          </h2>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-white">
          <Image
            alt="Screenshot being analyzed"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 32rem, 100vw"
            src={draft.dataUrl}
            unoptimized
          />
        </div>

        <div className="surface-card rounded-[1.5rem] p-4 shadow-none">
          <p className="text-sm">{draft.name}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span className="app-chip px-3 py-1 text-xs">
              {draft.type}
            </span>
            <span className="app-chip px-3 py-1 text-xs">
              {formatBytes(draft.size)}
            </span>
          </div>
        </div>

        <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
          <p className="eyebrow text-[var(--color-accent)]">
            Analysis engine
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            The app prefers a local Ollama model for screenshot critique and
            falls back to typed mock output when the local model is unavailable.
          </p>
          {draft.workspaceName ? (
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              This run will be saved to the workspace <strong>{draft.workspaceName}</strong>.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
