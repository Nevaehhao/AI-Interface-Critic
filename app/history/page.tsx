import Link from "next/link";

import { listPersistedAnalyses } from "@/lib/supabase/analysis-store";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { analyses, user } = await listPersistedAnalyses();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.16),_transparent_32%),linear-gradient(180deg,#0b1020_0%,#090d18_54%,#070b14_100%)] px-6 py-16 text-[var(--color-foreground)] sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
              Saved analyses
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Review past critiques.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-[#ff9d57]"
            >
              New analysis
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Auth settings
            </Link>
          </div>
        </div>

        {analyses === null ? (
          <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Supabase not configured
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">
              Add Supabase keys to enable saved history.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              The app can analyze screenshots without Supabase, but history,
              auth, and persistence stay inactive until project credentials are
              available.
            </p>
          </div>
        ) : !user ? (
          <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Sign-in required
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">
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
                className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      <span>{analysis.product_type}</span>
                      <span>{analysis.source}</span>
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
                    <span className="rounded-full border border-white/8 px-4 py-2 text-sm text-white/90">
                      Score {analysis.overall_score}
                    </span>
                    <Link
                      href={`/report/${analysis.id}`}
                      className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Open report
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
              No saved analyses
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">
              Persistence is ready once Supabase is configured.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Run one analysis while signed in and it will appear here with its
              saved report data.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
