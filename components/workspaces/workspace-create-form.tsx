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
    <form onSubmit={(event) => void handleSubmit(event)} className="surface-card p-6">
      <p className="eyebrow">Create workspace</p>
      <h2 className="mt-3 text-2xl tracking-tight">Group analyses by project</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
        Use one workspace per case study, product line, client, or design stream.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Workspace name</span>
          <input
            required
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Onboarding audit"
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Critiques for the marketing site redesign."
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Accent color</span>
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="h-12 w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-2 py-2"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Tags</span>
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="marketing, onboarding, mobile"
              className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
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
        className="material-button material-button-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}
