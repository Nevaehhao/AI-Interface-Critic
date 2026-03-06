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
      <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
          Missing screenshot
        </p>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          There is no pending upload to analyze.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
          Start from the upload flow so the loading state has a screenshot to
          process.
        </p>
        <Link
          href="/upload"
          className="mt-6 inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          Go to upload
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
          Step 2
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          The screenshot is being reviewed.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          This loading state explains the critique process so the wait feels
          intentional instead of opaque.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
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
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : "border-white/8 bg-[#090d18]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    {isComplete ? "Complete" : isActive ? "In progress" : "Queued"}
                  </p>
                  <span className="font-mono text-sm text-white/80">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-base text-white">{step}</p>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-5 rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Screenshot snapshot
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            Current analysis input
          </h2>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0f1a]">
          <Image
            alt="Screenshot being analyzed"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 32rem, 100vw"
            src={draft.dataUrl}
            unoptimized
          />
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-4">
          <p className="text-sm text-white">{draft.name}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span className="rounded-full border border-white/8 px-3 py-1">
              {draft.type}
            </span>
            <span className="rounded-full border border-white/8 px-3 py-1">
              {formatBytes(draft.size)}
            </span>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
            UX review model
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            The report will be grouped into hierarchy, accessibility,
            interaction, and layout so the output reads like a critique rather
            than a chat transcript.
          </p>
        </div>
      </aside>
    </div>
  );
}
