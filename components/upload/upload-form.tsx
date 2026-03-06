"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  savePendingAnalysisDraft,
} from "@/lib/analysis-draft";
import type { WorkspaceRecord } from "@/lib/supabase/workspace-store";
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
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="surface-card space-y-6 p-6 sm:p-8">
        <div>
          <p className="eyebrow">
            Step 1
          </p>
          <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
            Upload a screenshot for critique.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Start with a single interface image. The MVP accepts PNG, JPG, and
            WebP files up to {MAX_UPLOAD_SIZE_MB}MB.
          </p>
        </div>

        <div className="surface-muted p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--color-accent)]">Workspace</p>
              <h2 className="mt-3 text-2xl tracking-tight">
                Organize this critique before you run it.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                Workspaces let you group analyses by product, case study, or client.
              </p>
            </div>
            <Link href="/workspaces" className="material-button material-button-secondary">
              Manage workspaces
            </Link>
          </div>

          {isSignedIn ? (
            workspaces.length > 0 ? (
              <label className="mt-5 block space-y-2">
                <span className="text-sm text-[var(--color-muted)]">Save analysis to</span>
                <select
                  value={selectedWorkspaceId}
                  onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                  className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
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
            ) : (
              <div className="mt-5 rounded-2xl bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-warning)]">
                Create your first workspace to group analyses by project.
              </div>
            )
          ) : (
            <div className="mt-5 rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent)]">
              Sign in to save analyses into reusable workspaces. Anonymous runs still work locally.
            </div>
          )}
        </div>

        <div
          role="presentation"
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          className={`rounded-[2rem] border border-dashed p-6 transition sm:p-8 ${
            isDragging
              ? "border-[var(--color-accent)] bg-[rgba(232,240,254,0.92)]"
              : "border-[var(--color-line)] bg-[rgba(255,255,255,0.74)]"
          }`}
        >
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <p className="eyebrow text-[var(--color-accent)]">
                Screenshot input
              </p>
              <h2 className="text-2xl tracking-tight">
                Drag a file here or open the picker.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-[var(--color-muted)]">
                Use a full-screen or cropped UI image where hierarchy, spacing,
                and interaction choices are visible.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="material-button material-button-primary"
              >
                Choose screenshot
              </button>
              <div className="app-chip">
                Accepted: PNG, JPG, WebP
              </div>
            </div>

            <input
              ref={inputRef}
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={handleInputChange}
              type="file"
            />

            {error ? (
              <div className="rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="surface-tonal space-y-5 p-6">
        <div>
          <p className="eyebrow">
            Selected file
          </p>
          <h2 className="mt-3 text-3xl tracking-tight">
            Preview before analysis
          </h2>
        </div>

        {selectedFile && previewUrl ? (
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-white">
              <Image
                alt="Selected UI screenshot preview"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 32rem, 100vw"
                src={previewUrl}
                unoptimized
              />
            </div>

            <div className="surface-card rounded-[1.5rem] p-4 shadow-none">
              <p className="text-sm">{selectedFile.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                <span className="app-chip px-3 py-1 text-xs">
                  {selectedFile.type}
                </span>
                <span className="app-chip px-3 py-1 text-xs">
                  {formatBytes(selectedFile.size)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-muted border-dashed p-6">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Your screenshot preview will appear here once a valid image is
              selected.
            </p>
          </div>
        )}

        <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
          <p className="eyebrow text-[var(--color-accent)]">
            What happens next
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
            <li>The screenshot is prepared in the browser</li>
            <li>The app transitions into a staged analysis state</li>
            <li>A structured report is rendered after processing</li>
            {selectedWorkspace ? (
              <li>The result is assigned to {selectedWorkspace.name}</li>
            ) : null}
          </ul>
        </div>

        <button
          type="button"
          disabled={!selectedFile || isSubmitting}
          onClick={handleSubmit}
          className="material-button material-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Preparing analysis..." : "Analyze screenshot"}
        </button>
      </aside>
    </div>
  );
}
