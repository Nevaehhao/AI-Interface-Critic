"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  loadStoredAnalysisHistory,
  type StoredAnalysisHistoryEntry,
} from "@/lib/analysis-result";

type PersistedAnalysisItem = {
  created_at: string;
  id: string;
  main_finding: string;
  overall_score: number;
  product_type: string;
  report: {
    summary: {
      nextAction: string;
    };
  };
  screenshot_url: string | null;
  source: "mock" | "ollama";
  workspace_id: string | null;
};

type WorkspaceOption = {
  id: string;
  name: string;
};

function formatAnalysisSource(source: "mock" | "ollama") {
  return source === "ollama" ? "Local Ollama" : "Mock fallback";
}

function HistoryCard({
  createdAt,
  href,
  mainFinding,
  nextAction,
  overallScore,
  productType,
  screenshotUrl,
  source,
  storageLabel,
  workspaceName,
}: {
  createdAt: string;
  href: string;
  mainFinding: string;
  nextAction: string;
  overallScore: number;
  productType: string;
  screenshotUrl: string | null;
  source: "mock" | "ollama";
  storageLabel: string;
  workspaceName?: string | null;
}) {
  return (
    <article className="surface-card p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {screenshotUrl ? (
          <div
            aria-label="Saved analysis screenshot"
            className="aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-white bg-cover bg-center lg:w-64"
            role="img"
            style={{
              backgroundImage: `url("${screenshotUrl}")`,
            }}
          >
          </div>
        ) : null}

        <div className="flex-1">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            <span>{productType}</span>
            <span>{formatAnalysisSource(source)}</span>
            {workspaceName ? <span>{workspaceName}</span> : null}
            <span>{storageLabel}</span>
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
          <h2 className="mt-3 text-2xl tracking-tight">{mainFinding}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {nextAction}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="app-chip">Score {overallScore}</span>
          <Link href={href} className="material-button material-button-secondary">
            Open report
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HistoryPageClient({
  initialAnalyses,
  isPersistenceConfigured,
  isSignedIn,
  selectedWorkspaceId,
  userEmail,
  workspaces,
}: {
  initialAnalyses: PersistedAnalysisItem[];
  isPersistenceConfigured: boolean;
  isSignedIn: boolean;
  selectedWorkspaceId: string | null;
  userEmail: string | null;
  workspaces: WorkspaceOption[];
}) {
  const [localAnalyses, setLocalAnalyses] = useState<StoredAnalysisHistoryEntry[]>([]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLocalAnalyses(loadStoredAnalysisHistory());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const workspaceMap = new Map(workspaces.map((workspace) => [workspace.id, workspace]));
  const selectedWorkspace = selectedWorkspaceId
    ? workspaceMap.get(selectedWorkspaceId) ?? null
    : null;
  const persistedIds = new Set(initialAnalyses.map((analysis) => analysis.id));
  const visibleLocalAnalyses = localAnalyses.filter((entry) => {
    if (persistedIds.has(entry.analysis.id)) {
      return false;
    }

    if (!selectedWorkspaceId) {
      return true;
    }

    return entry.workspaceId === selectedWorkspaceId;
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
        <div>
          <p className="eyebrow">History</p>
          <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
            Review past critiques.
          </h1>
          {userEmail ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">Signed in as {userEmail}</p>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Local analyses on this device appear here even when cloud sync is not configured.
            </p>
          )}
          {selectedWorkspace ? (
            <div className="mt-3">
              <span className="app-chip">Filtered by {selectedWorkspace.name}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {isSignedIn ? <SignOutButton /> : null}
          <Link
            href={selectedWorkspaceId ? `/upload?workspaceId=${selectedWorkspaceId}` : "/upload"}
            className="material-button material-button-primary"
          >
            New analysis
          </Link>
          <Link href="/workspaces" className="material-button material-button-secondary">
            Workspaces
          </Link>
          <Link href="/auth/sign-in" className="material-button material-button-secondary">
            Auth settings
          </Link>
        </div>
      </div>

      {isSignedIn && workspaces.length > 0 ? (
        <div className="surface-card p-5">
          <p className="eyebrow">Workspace filter</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/history"
              className={`material-button px-4 py-2 text-sm ${
                !selectedWorkspaceId ? "material-button-primary" : "material-button-secondary"
              }`}
            >
              All analyses
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
        </div>
      ) : null}

      {visibleLocalAnalyses.length > 0 ? (
        <section className="grid gap-4">
          <div className="surface-card p-5">
            <p className="eyebrow">Recent on this device</p>
            <h2 className="mt-3 text-3xl tracking-tight">Local history</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              These analyses are stored in your browser so you can revisit reports without waiting
              for cloud sync.
            </p>
          </div>

          {visibleLocalAnalyses.map((entry) => (
            <HistoryCard
              key={entry.analysis.id}
              createdAt={entry.analysis.createdAt}
              href={`/report/${entry.analysis.id}`}
              mainFinding={entry.analysis.summary.mainFinding}
              nextAction={entry.analysis.summary.nextAction}
              overallScore={entry.analysis.summary.overallScore}
              productType={entry.analysis.summary.productType}
              screenshotUrl={entry.screenshotDataUrl ?? null}
              source={entry.source}
              storageLabel="Stored locally"
              workspaceName={entry.workspaceName ?? null}
            />
          ))}
        </section>
      ) : null}

      {initialAnalyses.length > 0 ? (
        <section className="grid gap-4">
          <div className="surface-card p-5">
            <p className="eyebrow">Saved to your account</p>
            <h2 className="mt-3 text-3xl tracking-tight">Cloud history</h2>
          </div>

          {initialAnalyses.map((analysis) => (
            <HistoryCard
              key={analysis.id}
              createdAt={analysis.created_at}
              href={`/report/${analysis.id}`}
              mainFinding={analysis.main_finding}
              nextAction={analysis.report.summary.nextAction}
              overallScore={analysis.overall_score}
              productType={analysis.product_type}
              screenshotUrl={analysis.screenshot_url}
              source={analysis.source}
              storageLabel="Synced"
              workspaceName={
                analysis.workspace_id
                  ? (workspaceMap.get(analysis.workspace_id)?.name ?? null)
                  : null
              }
            />
          ))}
        </section>
      ) : null}

      {!isPersistenceConfigured ? (
        <div className="surface-card p-6 sm:p-8">
          <p className="eyebrow text-[var(--color-accent)]">Cloud sync optional</p>
          <h2 className="mt-3 text-3xl tracking-tight">
            Local history is working even without Neon.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            If you also want cross-device history, account sign-in, and synced workspaces, finish
            the setup for `DATABASE_URL` and `NEON_AUTH_BASE_URL`.
          </p>
          <Link href="/setup" className="material-button material-button-secondary mt-6">
            Open setup checklist
          </Link>
        </div>
      ) : !isSignedIn ? (
        <div className="surface-card p-6 sm:p-8">
          <p className="eyebrow text-[var(--color-accent)]">Sign-in unlocks sync</p>
          <h2 className="mt-3 text-3xl tracking-tight">
            Local history is visible now. Sign in if you want it synced to your account.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Signed-in analyses are stored in Neon so they can follow you across devices and
            workspaces.
          </p>
          <Link href="/auth/sign-in" className="material-button material-button-secondary mt-6">
            Open sign-in
          </Link>
        </div>
      ) : null}

      {visibleLocalAnalyses.length === 0 && initialAnalyses.length === 0 ? (
        <div className="surface-card p-6 sm:p-8">
          <p className="eyebrow text-[var(--color-accent)]">No analyses yet</p>
          <h2 className="mt-3 text-3xl tracking-tight">
            Run your first critique and it will show up here.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Every new analysis is added to local history immediately. If cloud sync is configured,
            signed-in runs also appear in your account history.
          </p>
          <Link href="/upload" className="material-button material-button-primary mt-6">
            Start analysis
          </Link>
        </div>
      ) : null}
    </main>
  );
}
