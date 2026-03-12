"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import type { WorkspaceRecord } from "@/lib/data/workspace-store";

function parseTags(value: string) {
  return [...new Set(value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean))].slice(0, 8);
}

export function WorkspaceManagerCard({
  analysisCount,
  workspace,
}: {
  analysisCount: number;
  workspace: WorkspaceRecord;
}) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [accentColor, setAccentColor] = useState(workspace.accent_color ?? "#111111");
  const [tags, setTags] = useState(workspace.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateWorkspace(payload: Record<string, unknown>) {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to update workspace.");
      }

      setMessage("Workspace updated.");
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to update workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to delete workspace.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to delete workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="surface-card rounded-[1.5rem] p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: workspace.accent_color ?? accentColor }}
          />
          <h3 className="text-xl tracking-tight">{workspace.name}</h3>
        </div>
        <span className="app-chip">{analysisCount} analyses</span>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Workspace name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
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
              className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
        {workspace.tags.map((tag) => (
          <span key={`${workspace.id}-${tag}`} className="app-chip">
            {tag}
          </span>
        ))}
        {workspace.archived_at ? <span className="app-chip">Archived</span> : null}
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() =>
            void updateWorkspace({
              accentColor,
              description,
              name,
              tags: parseTags(tags),
            })
          }
          className="material-button material-button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() =>
            void updateWorkspace({
              archived: !workspace.archived_at,
              mode: "archive",
            })
          }
          className="material-button material-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {workspace.archived_at ? "Restore" : "Archive"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleDelete()}
          className="material-button material-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
