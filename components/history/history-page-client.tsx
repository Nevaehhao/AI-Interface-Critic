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

function formatAnalysisSource(source: AnalysisSource) {
  if (source === "ollama") {
    return "Ollama";
  }

  if (source === "openai-compatible") {
    return "API model";
  }

  if (source === "anthropic") {
    return "Anthropic";
  }

  if (source === "gemini") {
    return "Gemini";
  }

  return "Fallback";
}

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

function HistoryCard({
  entry,
  isSelected,
  onToggleSelect,
}: {
  entry: HistoryAnalysisEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <article className="surface-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {entry.screenshotUrl ? (
          <div
            aria-label="Saved analysis screenshot"
            className="aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-[var(--color-line)] bg-white bg-cover bg-center lg:w-52"
            role="img"
            style={{ backgroundImage: `url("${entry.screenshotUrl}")` }}
          />
        ) : null}

        <div className="flex-1">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
            <span>{entry.productType}</span>
            <span>{formatAnalysisSource(entry.source)}</span>
            <span>{entry.isLocal ? "Local" : "Synced"}</span>
            {entry.workspaceName ? <span>{entry.workspaceName}</span> : null}
            {entry.shareEnabled ? <span>Shared</span> : null}
            <span>{new Date(entry.createdAt).toLocaleString()}</span>
          </div>
          <h2 className="mt-3 text-xl tracking-tight">{entry.mainFinding}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{entry.nextAction}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="app-chip">Score {entry.overallScore}</span>
          <button
            type="button"
            onClick={onToggleSelect}
            className={`material-button ${isSelected ? "material-button-primary" : "material-button-secondary"}`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
          <Link href={`/report/${entry.id}`} className="material-button material-button-secondary">
            Open report
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
        entry.workspaceId ? (workspaceMap.get(entry.workspaceId)?.name ?? entry.workspaceName ?? null) : null,
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
      [
        entry.mainFinding,
        entry.nextAction,
        entry.productType,
        entry.workspaceName,
      ]
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">History</p>
            <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">Past analyses.</h1>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {userEmail
                ? `Signed in as ${userEmail}`
                : "Recent reports from this browser appear here automatically."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isSignedIn ? <SignOutButton /> : null}
            <Link href="/upload" className="material-button material-button-primary">
              New analysis
            </Link>
          </div>
        </div>
      </section>

      {isSignedIn && workspaces.length > 0 ? (
        <section className="surface-card p-5">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/history"
              className={`material-button px-4 py-2 text-sm ${
                !selectedWorkspaceId ? "material-button-primary" : "material-button-secondary"
              }`}
            >
              All
            </Link>
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/history?workspaceId=${workspace.id}`}
                className={`material-button px-4 py-2 text-sm ${
                  selectedWorkspaceId === workspace.id
                    ? "material-button-primary"
                    : "material-button-secondary"
                }`}
              >
                {workspace.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-5">
          <p className="eyebrow">Filters</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search finding, next action, or workspace"
                className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Source</span>
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as AnalysisSource | "all")
                }
                className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
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
                className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
              >
                <option value="all">All</option>
                <option value="high">80 and up</option>
                <option value="mid">60 to 79</option>
                <option value="low">Below 60</option>
              </select>
            </label>
          </div>
        </div>

        <TrendSparkline entries={visibleEntries} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface-muted p-5">
          <p className="eyebrow">Visible reports</p>
          <p className="mt-3 text-4xl tracking-tight">{visibleEntries.length}</p>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">Average score</p>
          <p className="mt-3 text-4xl tracking-tight">{averageScore ?? "--"}</p>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">Selection</p>
          <p className="mt-3 text-4xl tracking-tight">{selectedEntries.length}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setShowBatchNotice(false);
              }}
              className="material-button material-button-secondary"
            >
              Clear selection
            </button>
          </div>
        </div>
      </section>

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
        <section className="grid gap-4">
          {visibleEntries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              isSelected={selectedIds.includes(entry.id)}
              onToggleSelect={() => toggleSelectedId(entry.id)}
            />
          ))}
        </section>
      ) : (
        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">No matching history</p>
          <h2 className="mt-4 text-3xl tracking-tight">Nothing matches the current filters.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
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
