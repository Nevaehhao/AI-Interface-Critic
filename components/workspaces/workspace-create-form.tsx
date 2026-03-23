"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

function parseTags(value: string) {
  return [...new Set(value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean))].slice(0, 8);
}

export function WorkspaceCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState("#111111");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldClassName =
    "w-full rounded-[1.25rem] border border-[rgba(175,177,188,0.24)] bg-white/80 px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-muted)]";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/workspaces", {
        body: JSON.stringify({
          accentColor,
          description,
          name,
          tags: parseTags(tags),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create workspace.");
      }

      setName("");
      setDescription("");
      setAccentColor("#111111");
      setTags("");
      setSuccessMessage("Workspace created.");
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="surface-card p-6 sm:p-8">
      <p className="eyebrow">Create workspace</p>
      <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">Open a new project stream</h2>
      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
        Use one workspace per case study, product line, client, or design stream so upload,
        history, and triage stay readable.
      </p>

      <div className="surface-tonal mt-6 p-5">
        <p className="eyebrow">Preview</p>
        <div className="mt-4 flex items-center gap-4">
          <span
            aria-hidden="true"
            className="h-12 w-12 rounded-full shadow-[0_12px_28px_rgba(111,78,156,0.12)]"
            style={{ backgroundColor: accentColor }}
          />
          <div>
            <p className="text-lg font-semibold tracking-[-0.03em]">
              {name.trim() || "Untitled workspace"}
            </p>
            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
              {description.trim() || "Add a short note so future critiques have context."}
            </p>
          </div>
        </div>
        {tags.trim() ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {parseTags(tags).map((tag) => (
              <span key={tag} className="app-chip">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Workspace name</span>
          <input
            required
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Onboarding audit"
            className={fieldClassName}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Critiques for the marketing site redesign."
            className={fieldClassName}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Accent color</span>
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="h-12 w-full rounded-[1.25rem] border border-[rgba(175,177,188,0.24)] bg-white/80 px-2 py-2"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Tags</span>
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="marketing, onboarding, mobile"
              className={fieldClassName}
            />
          </label>
        </div>
      </div>

      {successMessage ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="material-button material-button-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}
