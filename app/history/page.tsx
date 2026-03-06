import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { listPersistedAnalyses } from "@/lib/supabase/analysis-store";

export const dynamic = "force-dynamic";

function formatAnalysisSource(source: "mock" | "ollama") {
  return source === "ollama" ? "Local Ollama" : "Mock fallback";
}

export default async function HistoryPage() {
  const { analyses, user } = await listPersistedAnalyses();

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
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="material-button material-button-secondary">
                  Sign out
                </button>
              </form>
            ) : null}
            <Link href="/upload" className="material-button material-button-primary">
              New analysis
            </Link>
            <Link
              href="/auth/sign-in"
              className="material-button material-button-secondary"
            >
              Auth settings
            </Link>
          </div>
        </div>

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
              auth, and persistence stay inactive until project credentials are
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
              Saved analyses are tied to your Supabase account. Use Google,
              Apple, or email sign-in to keep a history of critiques.
            </p>
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="grid gap-4">
            {analyses.map((analysis) => (
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
            ))}
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
              saved report data.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
