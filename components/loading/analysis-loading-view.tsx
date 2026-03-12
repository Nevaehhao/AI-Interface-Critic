"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAnalysisModeLabel } from "@/lib/analysis-context";
import {
  clearPendingAnalysisDraft,
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

export function AnalysisLoadingView({
  viewerUserId = null,
}: {
  viewerUserId?: string | null;
}) {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
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
        if (file) {
          formData.append("file", file);
        }
        if (currentDraft.workspaceId) {
          formData.append("workspaceId", currentDraft.workspaceId);
        }
        if (currentDraft.context) {
          formData.append("analysisMode", currentDraft.context.analysisMode);
          if (currentDraft.context.pageUrl) {
            formData.append("pageUrl", currentDraft.context.pageUrl);
          }
          if (currentDraft.context.repoUrl) {
            formData.append("repoUrl", currentDraft.context.repoUrl);
          }
          if (currentDraft.context.productGoal) {
            formData.append("productGoal", currentDraft.context.productGoal);
          }
          if (currentDraft.context.targetAudience) {
            formData.append("targetAudience", currentDraft.context.targetAudience);
          }
          if (currentDraft.context.techStack) {
            formData.append("techStack", currentDraft.context.techStack);
          }
          if (currentDraft.context.notes) {
            formData.append("notes", currentDraft.context.notes);
          }
        }

        const response = await fetch("/api/analyze", {
          body: formData,
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(
            typeof errorPayload?.error === "string"
              ? errorPayload.error
              : "Analysis failed. Try uploading the screenshot again.",
          );
        }

        const payload = analyzeResponseSchema.parse(await response.json());
        saveLatestAnalysisResult(payload, {
          screenshotDataUrl: payload.screenshotDataUrl ?? currentDraft.dataUrl,
          viewerUserId,
          workspaceId: currentDraft.workspaceId ?? null,
          workspaceName: currentDraft.workspaceName ?? null,
        });
        clearPendingAnalysisDraft();
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
  }, [attemptKey, draft, router, viewerUserId]);

  if (!draft) {
    return (
      <div className="surface-card p-6 sm:p-8">
        <p className="eyebrow text-[var(--color-accent)]">Missing screenshot</p>
        <h1 className="mt-4 text-3xl tracking-tight sm:text-4xl">There is no upload to analyze.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
          Start from the upload page so the analysis step has a screenshot to process.
        </p>
        <Link href="/upload" className="material-button material-button-secondary mt-6">
          Go to upload
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="surface-card p-6 sm:p-8">
        <p className="eyebrow">Analyzing</p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Review in progress.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          The app is processing your screenshot now. When the report opens, it will clearly show
          whether Ollama produced the result or fallback output was used.
        </p>

        {error ? (
          <div className="mt-6 space-y-4 rounded-2xl bg-[var(--color-error-soft)] px-4 py-4 text-sm text-[var(--color-error)]">
            <p>{error}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveStepIndex(0);
                  setError(null);
                  setAttemptKey((currentAttemptKey) => currentAttemptKey + 1);
                }}
                className="material-button material-button-secondary"
              >
                Retry analysis
              </button>
              <Link href="/upload" className="material-button material-button-text px-0">
                Back to upload
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          {loadingSteps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isComplete = index < activeStepIndex;

            return (
              <div
                key={step}
                className={`rounded-[1.25rem] border px-4 py-4 transition ${
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                    : isComplete
                      ? "border-[rgba(24,128,56,0.18)] bg-[var(--color-success-soft)]"
                      : "border-[var(--color-line)] bg-white"
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

      <aside className="surface-card space-y-5 p-6">
        <div>
          <p className="eyebrow">Input</p>
          <h2 className="mt-3 text-3xl tracking-tight">
            {draft.captureMode === "url-capture" ? "Current page" : "Current screenshot"}
          </h2>
        </div>

        {draft.dataUrl ? (
          <>
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

            <div className="surface-muted p-4">
              <p className="text-sm">{draft.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                {draft.type ? <span className="app-chip">{draft.type}</span> : null}
                {draft.size ? <span className="app-chip">{formatBytes(draft.size)}</span> : null}
              </div>
            </div>
          </>
        ) : (
          <div className="surface-muted p-5">
            <p className="text-sm font-medium">Server capture pending</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              The app will open the provided URL in a headless browser, capture the visible
              viewport, and use that screenshot for analysis.
            </p>
            {draft.context?.pageUrl ? (
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                URL: {draft.context.pageUrl}
              </p>
            ) : null}
          </div>
        )}

        <div className="surface-muted p-5">
          <p className="eyebrow text-[var(--color-accent)]">Engine</p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            The app tries your configured analysis provider first. If that fails, the final report
            will explicitly say it used fallback output and show the reason.
          </p>
          {draft.workspaceName ? (
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              This run will be saved to the workspace <strong>{draft.workspaceName}</strong>.
            </p>
          ) : null}
          {draft.captureMode === "url-capture" ? (
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              URL capture requires Playwright with Chromium installed on the server.
            </p>
          ) : null}
        </div>

        {draft.context ? (
          <div className="surface-muted p-5">
            <p className="eyebrow text-[var(--color-accent)]">Review context</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
              <span className="app-chip">{getAnalysisModeLabel(draft.context.analysisMode)}</span>
              {draft.context.pageUrl ? <span className="app-chip">Page URL attached</span> : null}
              {draft.context.repoUrl ? <span className="app-chip">Repo URL attached</span> : null}
              {draft.context.techStack ? <span className="app-chip">{draft.context.techStack}</span> : null}
            </div>
            {draft.context.productGoal ? (
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Goal: {draft.context.productGoal}
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
