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
  return source === "ollama" ? "Ollama" : "Fallback";
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
  workspaceName?: string | null;
}) {
  return (
    <article className="surface-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {screenshotUrl ? (
          <div
            aria-label="Saved analysis screenshot"
            className="aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-[var(--color-line)] bg-white bg-cover bg-center lg:w-52"
            role="img"
            style={{ backgroundImage: `url("${screenshotUrl}")` }}
          />
        ) : null}

        <div className="flex-1">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
            <span>{productType}</span>
            <span>{formatAnalysisSource(source)}</span>
            {workspaceName ? <span>{workspaceName}</span> : null}
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
          <h2 className="mt-3 text-xl tracking-tight">{mainFinding}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{nextAction}</p>
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

      {visibleLocalAnalyses.length > 0 ? (
        <section className="grid gap-4">
          <div className="px-1">
            <p className="eyebrow">Local history</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              These reports are stored in this browser and remain available even before cloud sync.
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
              workspaceName={entry.workspaceName ?? null}
            />
          ))}
        </section>
      ) : null}

      {initialAnalyses.length > 0 ? (
        <section className="grid gap-4">
          <div className="px-1">
            <p className="eyebrow">Synced history</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              These reports were saved to your Neon-backed account and can be reopened across sessions.
            </p>
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
              workspaceName={
                analysis.workspace_id
                  ? (workspaceMap.get(analysis.workspace_id)?.name ?? null)
                  : null
              }
            />
          ))}
        </section>
      ) : null}

      {visibleLocalAnalyses.length === 0 && initialAnalyses.length === 0 ? (
        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">No history yet</p>
          <h2 className="mt-4 text-3xl tracking-tight">Run one analysis first.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            After the first run, reports appear here automatically. If cloud sync is configured,
            signed-in runs also sync to your account.
          </p>
          <Link href="/upload" className="material-button material-button-primary mt-6">
            Start analysis
          </Link>
        </section>
      ) : null}

      {!isPersistenceConfigured ? (
        <section className="surface-muted p-5 text-sm leading-7 text-[var(--color-muted)]">
          Cloud sync is optional. Local history already works in this browser. If you want synced
          history later, finish the Neon setup in <Link href="/setup" className="text-[var(--color-accent)]">setup</Link>.
        </section>
      ) : null}
    </main>
  );
}
