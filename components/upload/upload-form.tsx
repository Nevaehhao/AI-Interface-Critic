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
  MAX_UPLOAD_SIZE_MB,
  formatBytes,
  validateImageFile,
} from "@/lib/uploads";

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
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateFile(file: File | null) {
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setSelectedFile(null);
      setPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        return null;
      });
      setError(validationError);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });
    setError(null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    updateFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    updateFile(event.dataTransfer.files?.[0] ?? null);
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
    if (!selectedFile && pageUrl.trim().length === 0) {
      setError("Add a screenshot or enter a live page URL before starting analysis.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const parsedContext = analysisContextSchema.safeParse({
        analysisMode,
        notes,
        pageUrl,
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

      await savePendingAnalysisDraft(selectedFile, {
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
        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
          Upload a screenshot or analyze a live URL.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-muted)]">
          Use a single screen where the main layout and primary actions are visible, or provide a
          page URL and let the app capture the page for you. Supported image types: PNG, JPG, and
          WebP up to {MAX_UPLOAD_SIZE_MB}MB.
        </p>

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
        ) : null}

        {!isSignedIn ? (
          <div className="surface-muted mt-6 p-4 text-sm leading-7 text-[var(--color-muted)]">
            History still works locally without sign-in. If you want synced workspaces later, use{" "}
            <Link href="/auth/sign-in" className="text-[var(--color-accent)]">
              sign in
            </Link>
            .
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <div className="surface-muted p-4">
            <p className="eyebrow">Review brief</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              Add product and code context so the AI can critique like a senior UI/UX designer and
              produce a more concrete engineering handoff.
            </p>
          </div>

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
              <span className="text-sm text-[var(--color-muted)]">Page URL</span>
              <input
                type="url"
                value={pageUrl}
                onChange={(event) => setPageUrl(event.target.value)}
                placeholder="https://example.com/pricing"
                className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
            </label>

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
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
          </div>

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
          <p className="text-base font-medium">Drag a screenshot here</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">or choose a file from your computer</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="material-button material-button-primary mt-6"
          >
            Choose file
          </button>
          <p className="mt-4 text-xs text-[var(--color-muted)]">PNG, JPG, WebP</p>

          <input
            ref={inputRef}
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={handleInputChange}
            type="file"
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}
      </section>

      <aside className="surface-card p-6">
        <p className="eyebrow">Preview</p>
        <h2 className="mt-4 text-2xl tracking-tight">Ready before you analyze.</h2>

        {selectedFile && previewUrl ? (
          <div className="mt-6 space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-[var(--color-line)] bg-white">
              <Image
                alt="Selected UI screenshot preview"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 32rem, 100vw"
                src={previewUrl}
                unoptimized
              />
            </div>

            <div className="surface-muted p-4">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                <span className="app-chip">{selectedFile.type}</span>
                <span className="app-chip">{formatBytes(selectedFile.size)}</span>
                {selectedWorkspace ? <span className="app-chip">{selectedWorkspace.name}</span> : null}
              </div>
            </div>
          </div>
        ) : pageUrl.trim().length > 0 ? (
          <div className="surface-muted mt-6 p-6">
            <p className="text-sm font-medium">Live page capture</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              The app will open <span className="font-medium">{pageUrl}</span> in a headless
              browser, capture the visible viewport, and analyze that screenshot.
            </p>
          </div>
        ) : (
          <div className="surface-muted mt-6 p-6">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Your screenshot preview or live URL capture summary appears here after you add a valid
              input.
            </p>
          </div>
        )}

        <div className="surface-muted mt-6 p-4">
          <p className="text-sm leading-7 text-[var(--color-muted)]">
            Next step: the app sends the screenshot or captured URL to the analysis API and then
            opens a report. The report will tell you whether your configured provider ran
            successfully or fallback output was used.
          </p>
        </div>

        <button
          type="button"
          disabled={(!selectedFile && pageUrl.trim().length === 0) || isSubmitting}
          onClick={handleSubmit}
          className="material-button material-button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Preparing..." : "Analyze input"}
        </button>
      </aside>
    </div>
  );
}
