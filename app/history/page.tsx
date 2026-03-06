import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { listPersistedAnalyses } from "@/lib/supabase/analysis-store";
import { listWorkspaces } from "@/lib/supabase/workspace-store";

export const dynamic = "force-dynamic";

function formatAnalysisSource(source: "mock" | "ollama") {
  return source === "ollama" ? "Local Ollama" : "Mock fallback";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ workspaceId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedWorkspaceId = resolvedSearchParams?.workspaceId ?? null;

  const [{ analyses, user }, { workspaces }] = await Promise.all([
    listPersistedAnalyses(selectedWorkspaceId),
    listWorkspaces(),
  ]);

  const workspaceMap = new Map(
    (workspaces ?? []).map((workspace) => [workspace.id, workspace]),
  );
  const selectedWorkspace = selectedWorkspaceId
    ? workspaceMap.get(selectedWorkspaceId) ?? null
    : null;

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="eyebrow">Saved analyses</p>
            <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
              Review past critiques.
            </h1>
            {user?.email ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Signed in as {user.email}
              </p>
            ) : null}
            {selectedWorkspace ? (
              <div className="mt-3">
                <span className="app-chip">Filtered by {selectedWorkspace.name}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="material-button material-button-secondary">
                  Sign out
                </button>
              </form>
            ) : null}
            <Link
              href={selectedWorkspaceId ? `/upload?workspaceId=${selectedWorkspaceId}` : "/upload"}
              className="material-button material-button-primary"
            >
              New analysis
            </Link>
            <Link
              href="/workspaces"
              className="material-button material-button-secondary"
            >
              Workspaces
            </Link>
            <Link
              href="/auth/sign-in"
              className="material-button material-button-secondary"
            >
              Auth settings
            </Link>
          </div>
        </div>

        {user && workspaces && workspaces.length > 0 ? (
          <div className="surface-card p-5">
            <p className="eyebrow">Workspace filter</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/history"
                className={`material-button px-4 py-2 text-sm ${
                  !selectedWorkspaceId
                    ? "material-button-primary"
                    : "material-button-secondary"
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

        {analyses === null ? (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">
              Supabase not configured
            </p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Add Supabase keys to enable saved history.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              The app can analyze screenshots without Supabase, but history,
              auth, persistence, and workspace grouping stay inactive until project credentials are
              available.
            </p>
          </div>
        ) : !user ? (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">
              Sign-in required
            </p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Sign in to unlock persistence.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Saved analyses and workspaces are tied to your Supabase account. Use Google,
              Apple, or email sign-in to keep a history of critiques.
            </p>
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="grid gap-4">
            {analyses.map((analysis) => {
              const workspace = analysis.workspace_id
                ? workspaceMap.get(analysis.workspace_id) ?? null
                : null;

              return (
                <article
                  key={analysis.id}
                  className="surface-card p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {analysis.screenshot_url ? (
                      <div
                        aria-label="Saved analysis screenshot"
                        className="aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-white bg-cover bg-center lg:w-64"
                        role="img"
                        style={{
                          backgroundImage: `url("${analysis.screenshot_url}")`,
                        }}
                      >
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                        <span>{analysis.product_type}</span>
                        <span>{formatAnalysisSource(analysis.source)}</span>
                        {workspace ? <span>{workspace.name}</span> : null}
                        <span>{new Date(analysis.created_at).toLocaleString()}</span>
                      </div>
                      <h2 className="mt-3 text-2xl tracking-tight">
                        {analysis.main_finding}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                        {analysis.report.summary.nextAction}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="app-chip">
                        Score {analysis.overall_score}
                      </span>
                      <Link
                        href={`/report/${analysis.id}`}
                        className="material-button material-button-secondary"
                      >
                        Open report
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">
              No saved analyses
            </p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Persistence is ready once Supabase is configured.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Run one analysis while signed in and it will appear here with its
              saved report data. Workspaces can be used to keep those reports grouped by project.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
