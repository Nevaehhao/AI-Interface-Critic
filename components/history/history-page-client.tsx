"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  HistoryComparePanel,
  HistoryFlowPanel,
  TrendSparkline,
  type HistoryAnalysisEntry,
} from "@/components/history/history-insights";
import type { AnalysisReport } from "@/lib/analysis-report";
import {
  loadStoredAnalysisHistory,
  type AnalysisSource,
  type StoredAnalysisHistoryEntry,
} from "@/lib/analysis-result";

type PersistedAnalysisItem = {
  created_at: string;
  id: string;
  main_finding: string;
  overall_score: number;
  product_type: string;
  report: AnalysisReport;
  screenshot_url: string | null;
  share_enabled: boolean;
  source: AnalysisSource;
  workspace_id: string | null;
};

type WorkspaceOption = {
  id: string;
  name: string;
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function toPersistedEntry(
  analysis: PersistedAnalysisItem,
  workspaceName: string | null,
): HistoryAnalysisEntry {
  return {
    createdAt: analysis.created_at,
    id: analysis.id,
    isLocal: false,
    mainFinding: analysis.main_finding,
    nextAction: analysis.report.summary.nextAction,
    overallScore: analysis.overall_score,
    productType: analysis.product_type,
    report: analysis.report,
    screenshotUrl: analysis.screenshot_url,
    shareEnabled: analysis.share_enabled,
    source: analysis.source,
    workspaceId: analysis.workspace_id,
    workspaceName,
  };
}

function toLocalEntry(
  entry: StoredAnalysisHistoryEntry,
  workspaceName: string | null,
): HistoryAnalysisEntry {
  return {
    createdAt: entry.analysis.createdAt,
    id: entry.analysis.id,
    isLocal: true,
    mainFinding: entry.analysis.summary.mainFinding,
    nextAction: entry.analysis.summary.nextAction,
    overallScore: entry.analysis.summary.overallScore,
    productType: entry.analysis.summary.productType,
    report: entry.analysis,
    screenshotUrl: entry.screenshotDataUrl ?? null,
    shareEnabled: false,
    source: entry.source,
    workspaceId: entry.workspaceId ?? null,
    workspaceName,
  };
}

function getHistoryTone(entry: HistoryAnalysisEntry) {
  if (entry.overallScore >= 80) {
    return {
      badgeClassName: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      label: "Optimal",
      scoreClassName: "text-[var(--color-accent)]",
    };
  }

  if (entry.overallScore >= 60) {
    return {
      badgeClassName: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
      label: "Review",
      scoreClassName: "text-[var(--color-accent)]",
    };
  }

  return {
    badgeClassName: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
    label: "Critical",
    scoreClassName: "text-[var(--color-error)]",
  };
}

function HistoryCard({
  entry,
  isSelected,
  onToggleSelect,
}: {
  entry: HistoryAnalysisEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const tone = getHistoryTone(entry);

  return (
    <article className="surface-card group flex h-full flex-col overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(111,78,156,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-[var(--color-surface-muted)]">
        {entry.screenshotUrl ? (
          <div
            aria-label="Saved analysis screenshot"
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
            role="img"
            style={{ backgroundImage: `url("${entry.screenshotUrl}")` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(237,220,255,0.56),rgba(255,255,255,0.92))]" />
        )}

        <div className="absolute right-4 top-4">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${tone.badgeClassName}`}
          >
            {tone.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-[-0.04em]">
              {entry.productType}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Analyzed {new Date(entry.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`font-display text-3xl font-extrabold tracking-[-0.05em] ${tone.scoreClassName}`}
            >
              {entry.overallScore}
              <span className="ml-0.5 text-xs font-bold">/100</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              UI health
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
          {entry.mainFinding}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="app-chip">{entry.isLocal ? "Local" : "Synced"}</span>
          {entry.workspaceName ? <span className="app-chip">{entry.workspaceName}</span> : null}
          {entry.shareEnabled ? <span className="app-chip">Shared</span> : null}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/50 pt-5">
          <button
            type="button"
            onClick={onToggleSelect}
            className={`font-display text-sm font-bold transition ${
              isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
            }`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
          <Link
            href={`/report/${entry.id}`}
            className="font-display text-sm font-bold text-[var(--color-accent)] transition hover:opacity-80"
          >
            View report
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HistoryPageClient({
  initialAnalyses,
  initialSelectedIds,
  isPersistenceConfigured,
  isSignedIn,
  selectedWorkspaceId,
  userEmail,
  viewerUserId,
  workspaces,
}: {
  initialAnalyses: PersistedAnalysisItem[];
  initialSelectedIds: string[];
  isPersistenceConfigured: boolean;
  isSignedIn: boolean;
  selectedWorkspaceId: string | null;
  userEmail: string | null;
  viewerUserId: string | null;
  workspaces: WorkspaceOption[];
}) {
  const [localAnalyses, setLocalAnalyses] = useState<StoredAnalysisHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<AnalysisSource | "all">("all");
  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "mid" | "low">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [showBatchNotice, setShowBatchNotice] = useState(initialSelectedIds.length > 1);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLocalAnalyses(loadStoredAnalysisHistory({ viewerUserId }));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [viewerUserId]);

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
    setShowBatchNotice(initialSelectedIds.length > 1);
  }, [initialSelectedIds]);

  const workspaceMap = new Map(workspaces.map((workspace) => [workspace.id, workspace]));
  const persistedIds = new Set(initialAnalyses.map((analysis) => analysis.id));
  const persistedEntries = initialAnalyses.map((analysis) =>
    toPersistedEntry(
      analysis,
      analysis.workspace_id ? (workspaceMap.get(analysis.workspace_id)?.name ?? null) : null,
    ),
  );
  const localEntries = localAnalyses
    .filter((entry) => !persistedIds.has(entry.analysis.id))
    .map((entry) =>
      toLocalEntry(
        entry,
        entry.workspaceId
          ? (workspaceMap.get(entry.workspaceId)?.name ?? entry.workspaceName ?? null)
          : null,
      ),
    );
  const allEntries = [...persistedEntries, ...localEntries]
    .filter((entry) => (selectedWorkspaceId ? entry.workspaceId === selectedWorkspaceId : true))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const visibleEntries = allEntries.filter((entry) => {
    if (sourceFilter !== "all" && entry.source !== sourceFilter) {
      return false;
    }

    if (scoreFilter === "high" && entry.overallScore < 80) {
      return false;
    }

    if (scoreFilter === "mid" && (entry.overallScore < 60 || entry.overallScore >= 80)) {
      return false;
    }

    if (scoreFilter === "low" && entry.overallScore >= 60) {
      return false;
    }

    if (!normalizedSearchQuery) {
      return true;
    }

    const haystack = normalizeSearchValue(
      [entry.mainFinding, entry.nextAction, entry.productType, entry.workspaceName]
        .filter(Boolean)
        .join(" "),
    );

    return haystack.includes(normalizedSearchQuery);
  });
  const selectedEntries = allEntries.filter((entry) => selectedIds.includes(entry.id));
  const averageScore =
    visibleEntries.length > 0
      ? Math.round(
          visibleEntries.reduce((sum, entry) => sum + entry.overallScore, 0) /
            visibleEntries.length,
        )
      : null;

  function toggleSelectedId(entryId: string) {
    setSelectionMessage(null);
    setShowBatchNotice(false);
    setSelectedIds((currentSelectedIds) => {
      if (currentSelectedIds.includes(entryId)) {
        return currentSelectedIds.filter((currentId) => currentId !== entryId);
      }

      if (currentSelectedIds.length >= 5) {
        setSelectionMessage("Select up to five reports for compare and flow review.");
        return currentSelectedIds;
      }

      return [...currentSelectedIds, entryId];
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
      <header className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">Archive</p>
          <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.05em]">Project History</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Review your past interface evaluations and track your design evolution through the eyes
            of the Digital Curator.
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
            {userEmail
              ? `Signed in as ${userEmail}`
              : "Recent reports from this browser appear here automatically."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSignedIn ? <SignOutButton /> : null}
          <Link href="/upload" className="material-button material-button-primary">
            Upload UI
          </Link>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="surface-card p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-[1rem] px-4 py-3 text-sm"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Source</span>
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as AnalysisSource | "all")
                }
                className="w-full rounded-[1rem] px-4 py-3 text-sm"
              >
                <option value="all">All</option>
                <option value="ollama">Ollama</option>
                <option value="openai-compatible">OpenAI-compatible</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Gemini</option>
                <option value="mock">Fallback</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Score</span>
              <select
                value={scoreFilter}
                onChange={(event) =>
                  setScoreFilter(event.target.value as "all" | "high" | "mid" | "low")
                }
                className="w-full rounded-[1rem] px-4 py-3 text-sm"
              >
                <option value="all">All</option>
                <option value="high">80 and up</option>
                <option value="mid">60 to 79</option>
                <option value="low">Below 60</option>
              </select>
            </label>
          </div>
        </div>

        <div className="surface-card flex min-w-72 items-center justify-between gap-6 p-5">
          <div>
            <p className="eyebrow">Visible reports</p>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em]">
              {visibleEntries.length}
            </p>
          </div>
          <div>
            <p className="eyebrow">Average score</p>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em]">
              {averageScore ?? "--"}
            </p>
          </div>
        </div>
      </section>

      {isSignedIn && workspaces.length > 0 ? (
        <section className="flex flex-wrap gap-3">
          <Link
            href="/history"
            className={`material-button ${
              !selectedWorkspaceId ? "material-button-primary" : "material-button-secondary"
            }`}
          >
            All
          </Link>
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/history?workspaceId=${workspace.id}`}
              className={`material-button ${
                selectedWorkspaceId === workspace.id
                  ? "material-button-primary"
                  : "material-button-secondary"
              }`}
            >
              {workspace.name}
            </Link>
          ))}
        </section>
      ) : null}

      <TrendSparkline entries={visibleEntries} />

      {selectionMessage ? (
        <div className="surface-card px-5 py-4 text-sm text-[var(--color-muted)]">
          {selectionMessage}
        </div>
      ) : null}

      {!selectionMessage && showBatchNotice ? (
        <div className="surface-card px-5 py-4 text-sm text-[var(--color-muted)]">
          Batch upload complete. The new reports are preselected below for compare and flow review.
        </div>
      ) : null}

      <HistoryComparePanel entries={selectedEntries} />
      <HistoryFlowPanel entries={selectedEntries} />

      {visibleEntries.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleEntries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              isSelected={selectedIds.includes(entry.id)}
              onToggleSelect={() => toggleSelectedId(entry.id)}
            />
          ))}

          <Link
            href="/upload"
            className="surface-card flex min-h-[26rem] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[rgba(175,177,188,0.34)] p-8 text-center transition hover:bg-[rgba(237,220,255,0.34)]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--color-accent)] shadow-[0_12px_30px_rgba(111,78,156,0.08)]">
              <span className="font-display text-3xl font-extrabold">+</span>
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.04em]">
              Analyze New UI
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-7 text-[var(--color-muted)]">
              Get expert AI feedback on your latest design or product surface.
            </p>
          </Link>
        </section>
      ) : (
        <section className="surface-card p-8">
          <p className="eyebrow">No matching history</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
            Nothing matches the current filters.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-muted)]">
            Adjust the workspace, source, score, or keyword filters to widen the result set.
          </p>
        </section>
      )}

      {!isPersistenceConfigured ? (
        <section className="surface-muted p-5 text-sm leading-7 text-[var(--color-muted)]">
          Cloud sync is optional. Local history already works in this browser. If you want synced
          history later, finish the Neon setup in{" "}
          <Link href="/setup" className="text-[var(--color-accent)]">
            setup
          </Link>
          .
        </section>
      ) : null}
    </main>
  );
}
