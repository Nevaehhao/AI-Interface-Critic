"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

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
    if (!selectedFile) {
      setError("Choose a screenshot before starting analysis.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await savePendingAnalysisDraft(selectedFile, {
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
        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">Upload one screenshot.</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-muted)]">
          Use a single screen where the main layout and primary actions are visible. Supported
          types: PNG, JPG, and WebP up to {MAX_UPLOAD_SIZE_MB}MB.
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
        ) : (
          <div className="surface-muted mt-6 p-6">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Your screenshot preview appears here after you choose a valid file.
            </p>
          </div>
        )}

        <div className="surface-muted mt-6 p-4">
          <p className="text-sm leading-7 text-[var(--color-muted)]">
            Next step: the app sends the screenshot to the analysis API and then opens a report.
            The report will tell you whether Ollama ran successfully or fallback output was used.
          </p>
        </div>

        <button
          type="button"
          disabled={!selectedFile || isSubmitting}
          onClick={handleSubmit}
          className="material-button material-button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Preparing..." : "Analyze screenshot"}
        </button>
      </aside>
    </div>
  );
}
