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
    description: "Use one screenshot or a short multi-screen batch when you already have the UI captured.",
    id: "upload",
    title: "Upload screenshots",
  },
  {
    description: "Paste a live page URL and let the app capture the visible viewport before analysis.",
    id: "url-capture",
    title: "Capture live URL",
  },
];

function countBriefFields(values: string[]) {
  return values.filter((value) => value.trim().length > 0).length;
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
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="surface-card p-6 sm:p-8">
        <p className="eyebrow">Upload</p>
        <h1 className="mt-4 max-w-4xl text-4xl tracking-tight sm:text-5xl">
          Start with the input you want reviewed.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
          Pick one capture method, then add optional product and repository context only if it
          helps the critique. The selected method is the only input that will be analyzed.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {inputMethodCards.map((card) => {
            const isActive = card.id === inputMode;
            const isPrepared =
              card.id === "upload" ? selectedFiles.length > 0 : pageUrl.trim().length > 0;

            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setInputMode(card.id);
                  setError(null);
                }}
                className={`rounded-[1.5rem] border p-5 text-left transition ${
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                    : "border-[var(--color-line)] bg-white hover:border-[rgba(17,17,17,0.16)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">{card.id === "upload" ? "Method 1" : "Method 2"}</p>
                  {isPrepared ? <span className="app-chip">Ready</span> : null}
                </div>
                <h2 className="mt-3 text-xl tracking-tight">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="surface-muted mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">1. Primary input</p>
              <h2 className="mt-3 text-2xl tracking-tight">
                {isUploadMode ? "Choose screenshots" : "Paste a page URL"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                {isUploadMode
                  ? `Use PNG, JPG, or WebP files up to ${MAX_UPLOAD_SIZE_MB}MB each. Multi-screen batches support up to ${MAX_FLOW_SCREENSHOTS} screenshots.`
                  : "Provide the page you want captured. The app will open it in a headless browser and analyze the visible viewport."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
              <span className="app-chip">{getAnalysisModeLabel(analysisMode)}</span>
              <span className="app-chip">
                {isUploadMode ? "Screenshot upload" : "Live URL capture"}
              </span>
            </div>
          </div>

          {isUploadMode ? (
            <div
              role="presentation"
              onDrop={handleDrop}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              className={`mt-6 rounded-[1.5rem] border border-dashed p-8 text-center transition ${
                isDragging
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                  : "border-[var(--color-line)] bg-white"
              }`}
            >
              <p className="text-base font-medium">
                {selectedFiles.length > 0 ? "Replace screenshots" : "Drag screenshots here"}
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                or choose up to {MAX_FLOW_SCREENSHOTS} files from your computer
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="material-button material-button-primary"
                >
                  {selectedFiles.length > 0 ? "Replace files" : "Choose files"}
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
              <p className="mt-4 text-xs text-[var(--color-muted)]">PNG, JPG, WebP</p>

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
            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Page URL</span>
                <input
                  type="url"
                  value={pageUrl}
                  onChange={(event) => setPageUrl(event.target.value)}
                  placeholder="https://example.com/pricing"
                  className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
              </label>

              <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-4 text-sm leading-7 text-[var(--color-muted)]">
                The app captures the final rendered page, so use this mode when you want the review
                to reflect a live environment instead of a saved screenshot.
              </div>
            </div>
          )}
        </div>

        {isSignedIn && workspaces.length > 0 ? (
          <label className="mt-6 block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Workspace</span>
            <select
              value={selectedWorkspaceId}
              onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            {selectedWorkspace?.description ? (
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                {selectedWorkspace.description}
              </p>
            ) : null}
          </label>
        ) : !isSignedIn ? (
          <div className="surface-muted mt-6 p-4 text-sm leading-7 text-[var(--color-muted)]">
            History still works locally without sign-in. If you want synced workspaces later, use{" "}
            <Link href="/auth/sign-in" className="text-[var(--color-accent)]">
              sign in
            </Link>
            .
          </div>
        ) : (
          <div className="surface-muted mt-6 p-4 text-sm leading-7 text-[var(--color-muted)]">
            No workspace selected yet. You can still run analyses now and create shared project
            buckets later in{" "}
            <Link href="/workspaces" className="text-[var(--color-accent)]">
              workspaces
            </Link>
            .
          </div>
        )}

        {error ? (
          <div className="mt-6 rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={!activeHasInput || isSubmitting}
            onClick={() => void handleSubmit()}
            className="material-button material-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Preparing..."
              : isUploadMode && selectedFiles.length > 1
                ? "Analyze flow batch"
                : "Start analysis"}
          </button>
          <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            The optional brief below improves issue prioritization, redesign suggestions, and the
            builder handoff.
          </p>
        </div>

        <div className="mt-8 border-t border-[var(--color-line)] pt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">2. Review brief</p>
              <h2 className="mt-3 text-3xl tracking-tight">Add extra context if you have it.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                These fields are optional, but they help the critique land closer to your product
                goal and make the engineering handoff more concrete.
              </p>
            </div>

            <div className="surface-muted min-w-44 px-4 py-4 text-right">
              <p className="eyebrow">Brief coverage</p>
              <p className="mt-3 text-3xl tracking-tight">{briefFieldCount}/5</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Review mode</span>
              <select
                value={analysisMode}
                onChange={(event) => setAnalysisMode(event.target.value as AnalysisMode)}
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
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
                  className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Product goal</span>
                <input
                  type="text"
                  value={productGoal}
                  onChange={(event) => setProductGoal(event.target.value)}
                  placeholder="Drive trial signups from the hero"
                  className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
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
                  className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Tech stack</span>
                <input
                  type="text"
                  value={techStack}
                  onChange={(event) => setTechStack(event.target.value)}
                  placeholder="Next.js, Tailwind, shadcn/ui"
                  className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
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
                className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
            </label>
          </div>
        </div>
      </section>

      <aside className="surface-card self-start p-6 lg:sticky lg:top-24">
        <p className="eyebrow">Preview</p>
        <h2 className="mt-4 text-2xl tracking-tight">What will be analyzed.</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
          The active capture method on the left controls this preview and the final analysis input.
        </p>

        {isUploadMode && selectedFiles.length > 0 && previewUrls.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className={`grid gap-3 ${previewUrls.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {previewUrls.map((previewUrl, index) => (
                <div
                  key={`${selectedFiles[index]?.name ?? previewUrl}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-[var(--color-line)] bg-white"
                >
                  <Image
                    alt={`Selected UI screenshot preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 20rem, 100vw"
                    src={previewUrl}
                    unoptimized
                  />
                  {previewUrls.length > 1 ? (
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs text-[var(--color-foreground)] shadow-sm">
                      Screen {index + 1}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="surface-muted p-4">
              <p className="text-sm font-medium">
                {selectedFiles.length === 1
                  ? selectedFiles[0]?.name
                  : `${selectedFiles.length} screenshots ready for one batch`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
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
                {selectedFiles.length > 1 ? <span className="app-chip">Flow batch</span> : null}
              </div>
            </div>
          </div>
        ) : !isUploadMode && pageUrl.trim().length > 0 ? (
          <div className="surface-muted mt-6 p-6">
            <p className="text-sm font-medium">Live page capture</p>
            <p className="mt-3 break-all text-sm leading-7 text-[var(--color-muted)]">
              The app will open <span className="font-medium">{pageUrl}</span>, capture the visible
              viewport, and analyze that screenshot.
            </p>
          </div>
        ) : (
          <div className="surface-muted mt-6 p-6">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Add the active screenshot or live URL input on the left to see the run preview here.
            </p>
          </div>
        )}

        <div className="surface-muted mt-6 p-4">
          <p className="eyebrow">Run summary</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span className="app-chip">{getAnalysisModeLabel(analysisMode)}</span>
            <span className="app-chip">
              {isUploadMode ? "Screenshot upload" : "Live URL capture"}
            </span>
            {selectedWorkspace ? <span className="app-chip">{selectedWorkspace.name}</span> : null}
            {briefFieldCount > 0 ? (
              <span className="app-chip">{briefFieldCount} brief fields filled</span>
            ) : (
              <span className="app-chip">Brief optional</span>
            )}
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
            After submission, the app sends the active input to the analysis API and opens a report
            that clearly labels whether the configured provider succeeded or fallback output was
            used.
          </p>
        </div>
      </aside>
    </div>
  );
}
