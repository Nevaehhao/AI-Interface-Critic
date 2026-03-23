"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  ANALYSIS_MODE_VALUES,
  analysisContextSchema,
  getAnalysisModeLabel,
  type AnalysisMode,
} from "@/lib/analysis-context";
import { savePendingAnalysisDraft } from "@/lib/analysis-draft";
import type { WorkspaceRecord } from "@/lib/data/workspace-store";
import {
  loadStoredAnalysisHistory,
  type StoredAnalysisHistoryEntry,
} from "@/lib/analysis-result";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FLOW_SCREENSHOTS,
  MAX_UPLOAD_SIZE_MB,
  formatBytes,
  validateImageFiles,
} from "@/lib/uploads";

type InputMode = "upload" | "url-capture";

const inputMethodCards: Array<{
  description: string;
  id: InputMode;
  title: string;
}> = [
  {
    description: "Drop one screenshot or a short flow batch when the UI is already captured.",
    id: "upload",
    title: "Upload screenshots",
  },
  {
    description: "Paste a live URL when you want the critic to inspect the rendered page.",
    id: "url-capture",
    title: "Capture live URL",
  },
];

function countBriefFields(values: string[]) {
  return values.filter((value) => value.trim().length > 0).length;
}

function getHistoryTone(entry: StoredAnalysisHistoryEntry) {
  if (entry.analysis.summary.overallScore >= 80) {
    return {
      badgeClassName: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      label: "Optimal",
    };
  }

  if (entry.analysis.summary.overallScore >= 60) {
    return {
      badgeClassName: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
      label: "Review",
    };
  }

  return {
    badgeClassName: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
    label: "Critical",
  };
}

function RecentUploadCard({ entry }: { entry: StoredAnalysisHistoryEntry }) {
  const tone = getHistoryTone(entry);

  return (
    <article className="surface-card overflow-hidden p-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-[var(--color-surface-muted)]">
        {entry.screenshotDataUrl ? (
          <div
            aria-label="Recent upload screenshot"
            className="absolute inset-0 bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url("${entry.screenshotDataUrl}")` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(237,220,255,0.55),rgba(255,255,255,0.9))]" />
        )}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${tone.badgeClassName}`}
          >
            {tone.label}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold tracking-[-0.04em]">
            {entry.analysis.summary.productType}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Uploaded {new Date(entry.analysis.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-extrabold tracking-[-0.05em] text-[var(--color-accent)]">
            {entry.analysis.summary.overallScore}
            <span className="ml-0.5 text-xs font-bold">/100</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            UI health
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/50 pt-4">
        <span className="app-chip">{getAnalysisModeLabel(entry.analysis.context.analysisMode)}</span>
        <Link
          href={`/report/${entry.analysis.id}`}
          className="font-display text-sm font-bold text-[var(--color-accent)] transition hover:opacity-80"
        >
          View report
        </Link>
      </div>
    </article>
  );
}

export function UploadForm({
  initialWorkspaceId = null,
  isSignedIn,
  workspaces,
}: {
  initialWorkspaceId?: string | null;
  isSignedIn: boolean;
  workspaces: WorkspaceRecord[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("ux-review");
  const [pageUrl, setPageUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [productGoal, setProductGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [techStack, setTechStack] = useState("");
  const [notes, setNotes] = useState("");
  const [recentUploads, setRecentUploads] = useState<StoredAnalysisHistoryEntry[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    workspaces.some((workspace) => workspace.id === initialWorkspaceId)
      ? initialWorkspaceId ?? ""
      : workspaces[0]?.id ?? "",
  );

  const selectedWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const isUploadMode = inputMode === "upload";
  const activeHasInput = isUploadMode
    ? selectedFiles.length > 0
    : pageUrl.trim().length > 0;
  const briefFieldCount = countBriefFields([
    repoUrl,
    productGoal,
    targetAudience,
    techStack,
    notes,
  ]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [previewUrls]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setRecentUploads(loadStoredAnalysisHistory().slice(0, 3));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  function clearSelectedFiles() {
    setSelectedFiles([]);
    setPreviewUrls((currentPreviewUrls) => {
      currentPreviewUrls.forEach((currentPreviewUrl) => {
        URL.revokeObjectURL(currentPreviewUrl);
      });

      return [];
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function updateFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setInputMode("upload");
    const validationError = validateImageFiles(files);

    if (validationError) {
      clearSelectedFiles();
      setError(validationError);
      return;
    }

    const nextPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setSelectedFiles(files);
    setPreviewUrls((currentPreviewUrls) => {
      currentPreviewUrls.forEach((currentPreviewUrl) => {
        URL.revokeObjectURL(currentPreviewUrl);
      });

      return nextPreviewUrls;
    });
    setError(null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    updateFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    updateFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  async function handleSubmit() {
    if (!activeHasInput) {
      setError(
        isUploadMode
          ? "Add at least one screenshot before starting analysis."
          : "Enter a live page URL before starting analysis.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const parsedContext = analysisContextSchema.safeParse({
        analysisMode,
        notes,
        pageCaptureMode: inputMode,
        pageUrl: isUploadMode ? null : pageUrl,
        productGoal,
        repoUrl,
        targetAudience,
        techStack,
      });

      if (!parsedContext.success) {
        throw new Error(
          parsedContext.error.issues[0]?.path[0] === "pageUrl"
            ? "Enter a valid page URL."
            : parsedContext.error.issues[0]?.path[0] === "repoUrl"
              ? "Enter a valid repository URL."
              : "Review context is incomplete or invalid.",
        );
      }

      await savePendingAnalysisDraft(isUploadMode ? selectedFiles : null, {
        context: parsedContext.data,
        workspaceId: selectedWorkspace?.id ?? null,
        workspaceName: selectedWorkspace?.name ?? null,
      });
      router.push("/loading");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to prepare the screenshot for analysis.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-20">
      <header className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Upload</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.05em] md:text-[3.65rem]">
          The Digital Curator.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          Upload your interface and let our intelligence observe, analyze, and elevate your
          design.
        </p>
      </header>

      <section className="surface-card p-6 sm:p-8">
        <div className="grid gap-10 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 flex flex-wrap justify-center gap-3 xl:justify-start">
              {inputMethodCards.map((card) => {
                const isActive = inputMode === card.id;

                return (
                  <button
                    key={card.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setInputMode(card.id);
                      setError(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "bg-white/80 text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                    }`}
                  >
                    {card.title}
                  </button>
                );
              })}
            </div>

            {isUploadMode ? (
              <div
                role="presentation"
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                className={`rounded-[2rem] border border-dashed px-6 py-14 text-center transition ${
                  isDragging
                    ? "border-[rgba(111,78,156,0.42)] bg-[rgba(237,220,255,0.56)]"
                    : "border-[rgba(175,177,188,0.34)] bg-[var(--color-surface-muted)]"
                }`}
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.2rem] bg-white text-[var(--color-accent)] shadow-[0_16px_30px_rgba(111,78,156,0.08)]">
                  <span className="font-display text-4xl font-extrabold">+</span>
                </div>
                <h2 className="mt-7 text-3xl font-bold tracking-[-0.04em]">
                  {selectedFiles.length > 0 ? "Screenshots ready to analyze" : "Drop your interface here"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  PNG, JPG, or WebP up to {MAX_UPLOAD_SIZE_MB}MB. Multi-screen flows support up to{" "}
                  {MAX_FLOW_SCREENSHOTS} screenshots.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="material-button material-button-primary"
                  >
                    {selectedFiles.length > 0 ? "Replace files" : "Browse files"}
                  </button>
                  {selectedFiles.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearSelectedFiles}
                      className="material-button material-button-secondary"
                    >
                      Clear files
                    </button>
                  ) : null}
                </div>

                <input
                  ref={inputRef}
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="sr-only"
                  onChange={handleInputChange}
                  multiple
                  type="file"
                />
              </div>
            ) : (
              <div className="surface-muted rounded-[2rem] p-8">
                <h2 className="text-3xl font-bold tracking-[-0.04em]">Capture a live page</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Paste the page you want analyzed. UXCritic will open it in a headless
                  browser and critique the captured viewport.
                </p>
                <label className="mt-6 block space-y-2">
                  <span className="text-sm text-[var(--color-muted)]">Page URL</span>
                  <input
                    type="url"
                    value={pageUrl}
                    onChange={(event) => setPageUrl(event.target.value)}
                    placeholder="https://example.com/pricing"
                    className="w-full rounded-[1rem] px-4 py-3 text-sm"
                  />
                </label>
              </div>
            )}

            {error ? (
              <div className="mt-5 rounded-[1rem] bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={!activeHasInput || isSubmitting}
                onClick={() => void handleSubmit()}
                className="material-button material-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Preparing..."
                  : isUploadMode && selectedFiles.length > 1
                    ? "Analyze flow batch"
                    : "Start analysis"}
              </button>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                The selected input is the only source that will be analyzed for this run.
              </p>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="surface-muted p-6">
              <p className="eyebrow">Run setup</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="app-chip">{getAnalysisModeLabel(analysisMode)}</span>
                <span className="app-chip">
                  {isUploadMode ? "Screenshot upload" : "Live URL capture"}
                </span>
                {briefFieldCount > 0 ? (
                  <span className="app-chip">{briefFieldCount} brief fields</span>
                ) : (
                  <span className="app-chip">Brief optional</span>
                )}
              </div>
            </div>

            <div className="surface-muted p-6">
              <p className="eyebrow">Workspace</p>
              {isSignedIn && workspaces.length > 0 ? (
                <label className="mt-4 block space-y-2">
                  <span className="text-sm text-[var(--color-muted)]">Project bucket</span>
                  <select
                    value={selectedWorkspaceId}
                    onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                    className="w-full rounded-[1rem] px-4 py-3 text-sm"
                  >
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  {isSignedIn
                    ? "Create a workspace later if you want synced project buckets."
                    : "Sign in later if you want synced workspaces and cloud history."}
                </p>
              )}
            </div>

            <div className="surface-muted p-6">
              <p className="eyebrow">Preview</p>
              {isUploadMode && previewUrls.length > 0 ? (
                <div className="mt-4 space-y-4">
                  <div className={`grid gap-3 ${previewUrls.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {previewUrls.map((previewUrl, index) => (
                      <div
                        key={`${previewUrl}-${index}`}
                        className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-white"
                      >
                        <Image
                          alt={`Selected screenshot ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 20rem, 100vw"
                          src={previewUrl}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.length === 1 ? (
                      <>
                        <span className="app-chip">{selectedFiles[0]?.type}</span>
                        <span className="app-chip">{formatBytes(selectedFiles[0]?.size ?? 0)}</span>
                      </>
                    ) : (
                      <span className="app-chip">
                        {formatBytes(selectedFiles.reduce((sum, file) => sum + file.size, 0))} total
                      </span>
                    )}
                  </div>
                </div>
              ) : !isUploadMode && pageUrl.trim().length > 0 ? (
                <p className="mt-4 break-all text-sm leading-7 text-[var(--color-muted)]">
                  {pageUrl}
                </p>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  Add a screenshot or live URL and the current run preview will appear here.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Review brief</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
                Add context for a sharper critique.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                These fields are optional, but they make the analysis more specific and improve the
                builder handoff.
              </p>
            </div>
            <div className="surface-muted min-w-40 px-5 py-4 text-right">
              <p className="eyebrow">Coverage</p>
              <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em]">
                {briefFieldCount}/5
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Review mode</span>
              <select
                value={analysisMode}
                onChange={(event) => setAnalysisMode(event.target.value as AnalysisMode)}
                className="w-full rounded-[1rem] px-4 py-3 text-sm"
              >
                {ANALYSIS_MODE_VALUES.map((mode) => (
                  <option key={mode} value={mode}>
                    {getAnalysisModeLabel(mode)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Repo URL</span>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/you/product"
                  className="w-full rounded-[1rem] px-4 py-3 text-sm"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Product goal</span>
                <input
                  type="text"
                  value={productGoal}
                  onChange={(event) => setProductGoal(event.target.value)}
                  placeholder="Drive signups from the hero"
                  className="w-full rounded-[1rem] px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Target audience</span>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(event) => setTargetAudience(event.target.value)}
                  placeholder="First-time founders on mobile"
                  className="w-full rounded-[1rem] px-4 py-3 text-sm"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Tech stack</span>
                <input
                  type="text"
                  value={techStack}
                  onChange={(event) => setTechStack(event.target.value)}
                  placeholder="Next.js, Tailwind, shadcn/ui"
                  className="w-full rounded-[1rem] px-4 py-3 text-sm"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Extra notes</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="The hero was recently redesigned and the CTA is underperforming."
                className="w-full rounded-[1rem] px-4 py-3 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Recent uploads</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">Archive preview</h2>
            </div>
            <Link href="/history" className="eyebrow text-[var(--color-accent)]">
              View all
            </Link>
          </div>

          {recentUploads.length > 0 ? (
            <div className="mt-8 grid gap-5">
              {recentUploads.map((entry) => (
                <RecentUploadCard key={entry.analysis.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="surface-muted mt-8 flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[rgba(175,177,188,0.34)] p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--color-accent)] shadow-[0_12px_30px_rgba(111,78,156,0.08)]">
                <span className="font-display text-3xl font-extrabold">+</span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-[-0.04em]">
                Analyze new UI
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-7 text-[var(--color-muted)]">
                Your recent runs from this browser will appear here after the first analysis.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
