"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  savePendingAnalysisDraft,
} from "@/lib/analysis-draft";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_MB,
  formatBytes,
  validateImageFile,
} from "@/lib/uploads";

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      await savePendingAnalysisDraft(selectedFile);
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
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Step 1
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Upload a screenshot for critique.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Start with a single interface image. The MVP accepts PNG, JPG, and
            WebP files up to {MAX_UPLOAD_SIZE_MB}MB.
          </p>
        </div>

        <div
          role="presentation"
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          className={`rounded-[2rem] border border-dashed p-6 transition sm:p-8 ${
            isDragging
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
              : "border-[var(--color-line)] bg-white/5"
          }`}
        >
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
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
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-[#ff9d57]"
              >
                Choose screenshot
              </button>
              <div className="inline-flex items-center rounded-full border border-[var(--color-line)] px-4 py-3 text-sm text-[var(--color-muted)]">
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
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="space-y-5 rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Selected file
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            Preview before analysis
          </h2>
        </div>

        {selectedFile && previewUrl ? (
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0f1a]">
              <Image
                alt="Selected UI screenshot preview"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 32rem, 100vw"
                src={previewUrl}
                unoptimized
              />
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-4">
              <p className="text-sm text-white">{selectedFile.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                <span className="rounded-full border border-white/8 px-3 py-1">
                  {selectedFile.type}
                </span>
                <span className="rounded-full border border-white/8 px-3 py-1">
                  {formatBytes(selectedFile.size)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--color-line)] bg-[#090d18]/60 p-6">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Your screenshot preview will appear here once a valid image is
              selected.
            </p>
          </div>
        )}

        <div className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
            What happens next
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
            <li>The screenshot is prepared in the browser</li>
            <li>The app transitions into a staged analysis state</li>
            <li>A structured report is rendered after processing</li>
          </ul>
        </div>

        <button
          type="button"
          disabled={!selectedFile || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-[#ff9d57] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Preparing analysis..." : "Analyze screenshot"}
        </button>
      </aside>
    </div>
  );
}
