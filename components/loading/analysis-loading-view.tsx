"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAnalysisModeLabel } from "@/lib/analysis-context";
import {
  clearPendingAnalysisDraft,
  dataUrlToFile,
  getPendingAnalysisScreenshots,
  loadPendingAnalysisDraft,
  pendingScreenshotToFile,
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

function stepToneClassName({
  isActive,
  isComplete,
}: {
  isActive: boolean;
  isComplete: boolean;
}) {
  if (isActive) {
    return "surface-tonal";
  }

  if (isComplete) {
    return "bg-[var(--color-success-soft)]";
  }

  return "bg-white/72";
}

export function AnalysisLoadingView({
  viewerUserId = null,
}: {
  viewerUserId?: string | null;
}) {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [draft, setDraft] = useState<ReturnType<typeof loadPendingAnalysisDraft>>(null);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
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
    const draftScreenshots = getPendingAnalysisScreenshots(currentDraft);
    const stepInterval = window.setInterval(() => {
      setActiveStepIndex((currentIndex) =>
        currentIndex >= loadingSteps.length - 1 ? currentIndex : currentIndex + 1,
      );
    }, 1400);

    const controller = new AbortController();

    async function analyzeDraft() {
      try {
        const selectedAnalysisIds: string[] = [];
        const screenshotsToAnalyze =
          draftScreenshots.length > 0
            ? draftScreenshots
            : [null];

        for (const [screenIndex, screenshot] of screenshotsToAnalyze.entries()) {
          setCurrentScreenIndex(screenIndex);
          const file = screenshot
            ? await pendingScreenshotToFile(screenshot)
            : await dataUrlToFile(currentDraft);
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
              const notesSuffix =
                draftScreenshots.length > 1
                  ? `\nFlow screen ${screenIndex + 1} of ${draftScreenshots.length}: ${screenshot?.name ?? `screen-${screenIndex + 1}`}`
                  : "";
              formData.append("notes", `${currentDraft.context.notes}${notesSuffix}`);
            } else if (draftScreenshots.length > 1) {
              formData.append(
                "notes",
                `Flow screen ${screenIndex + 1} of ${draftScreenshots.length}: ${screenshot?.name ?? `screen-${screenIndex + 1}`}`,
              );
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
            screenshotDataUrl: payload.screenshotDataUrl ?? screenshot?.dataUrl ?? currentDraft.dataUrl,
            viewerUserId,
            workspaceId: currentDraft.workspaceId ?? null,
            workspaceName: currentDraft.workspaceName ?? null,
          });
          selectedAnalysisIds.push(payload.analysis.id);
        }

        clearPendingAnalysisDraft();

        if (selectedAnalysisIds.length > 1) {
          router.push(`/history?selected=${selectedAnalysisIds.join(",")}`);
          return;
        }

        router.push(`/report/${selectedAnalysisIds[0]}`);
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

  const draftScreenshots = draft ? getPendingAnalysisScreenshots(draft) : [];
  const currentScreenshot = draftScreenshots[currentScreenIndex] ?? draftScreenshots[0] ?? null;

  if (!draft) {
    return (
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card p-7 sm:p-10">
          <p className="eyebrow text-[var(--color-accent)]">Missing upload</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
            There is no input queued for analysis.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Start from the upload page so this step has a screenshot or captured URL to process.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/upload" className="material-button material-button-primary">
              Go to upload
            </Link>
            <Link href="/" className="material-button material-button-secondary">
              Return to landing
            </Link>
          </div>
        </div>

        <aside className="surface-tonal p-7 sm:p-8">
          <p className="eyebrow">Before retrying</p>
          <div className="mt-5 grid gap-4">
            <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Upload a screenshot if you want exact issue highlights and annotation mapping in the
                report.
              </p>
            </div>
            <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Or use URL capture if Playwright with Chromium is installed on the server.
              </p>
            </div>
          </div>
        </aside>
      </section>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.98fr_1.02fr]">
      <section className="surface-card p-6 sm:p-8 lg:p-10">
        <p className="eyebrow">Analyzing</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          Review in progress.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          The app is processing your input now. When the report opens, it will clearly show whether
          the configured provider produced the result or fallback output was used.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="app-chip">{loadingSteps.length} critique passes</span>
          <span className="app-chip">Automatic report handoff</span>
          {draft.captureMode === "url-capture" ? (
            <span className="app-chip">Live page capture</span>
          ) : (
            <span className="app-chip">Screenshot upload</span>
          )}
        </div>
        {draftScreenshots.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span className="app-chip">Flow batch</span>
            <span className="app-chip">
              Screen {Math.min(currentScreenIndex + 1, draftScreenshots.length)} of {draftScreenshots.length}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 space-y-4 rounded-[1.5rem] bg-[var(--color-error-soft)] px-5 py-5 text-sm text-[var(--color-error)]">
            <p>{error}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveStepIndex(0);
                  setCurrentScreenIndex(0);
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

        <div className="mt-8 grid gap-3">
          {loadingSteps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isComplete = index < activeStepIndex;

            return (
              <div
                key={step}
                className={`rounded-[1.5rem] px-5 py-5 transition ${stepToneClassName({ isActive, isComplete })}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    {isComplete ? "Complete" : isActive ? "In progress" : "Queued"}
                  </p>
                  <span className="font-mono text-sm text-[var(--color-muted)]">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 rounded-full ${
                      isActive
                        ? "bg-[var(--color-accent)]"
                        : isComplete
                          ? "bg-[var(--color-success)]"
                          : "bg-[rgba(175,177,188,0.48)]"
                    }`}
                  />
                  <p className="text-base">{step}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="surface-card space-y-5 p-6 sm:p-8">
          <div>
            <p className="eyebrow">Input</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
              {draft.captureMode === "url-capture" ? "Current page" : "Current screenshot"}
            </h2>
          </div>

          {currentScreenshot ? (
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-white">
                <Image
                  alt="Screenshot being analyzed"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  src={currentScreenshot.dataUrl}
                  unoptimized
                />
              </div>

              <div className="surface-muted p-4">
                <p className="text-sm">{currentScreenshot.name}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                  <span className="app-chip">{currentScreenshot.type}</span>
                  <span className="app-chip">{formatBytes(currentScreenshot.size)}</span>
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
        </section>

        <section className="surface-tonal p-6">
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
        </section>

        {draft.context ? (
          <section className="surface-card p-6">
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
            {draftScreenshots.length > 1 ? (
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                This run will analyze {draftScreenshots.length} screenshots one by one, then open
                history with the full batch selected for compare and flow review.
              </p>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
