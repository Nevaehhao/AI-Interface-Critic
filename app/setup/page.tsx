import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPlatformStatus } from "@/lib/platform-status";

function toneClasses(status: "ready" | "action-required" | "offline") {
  if (status === "ready") {
    return "status-badge status-badge-success";
  }

  if (status === "action-required") {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-error";
}

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const platformStatus = await getPlatformStatus();
  const actionRequiredCount = platformStatus.checks.filter(
    (check) => check.status === "action-required",
  ).length;
  const offlineCount = platformStatus.checks.filter((check) => check.status === "offline").length;

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="surface-card p-7 sm:p-10">
            <p className="eyebrow">Platform setup</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
              Readiness for your AI provider, Neon, local storage, and deployment.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
              Use this page as the operational checklist before you call the stack live, whether
              the analysis engine runs through Ollama, a hosted OpenAI-compatible API, Anthropic,
              or Gemini.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/api/health" className="material-button material-button-primary">
                Open JSON health check
              </Link>
              <Link href="/upload" className="material-button material-button-secondary">
                Return to upload
              </Link>
            </div>
          </div>

          <aside className="surface-tonal p-7 sm:p-8">
            <p className="eyebrow">Readiness snapshot</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
                <p className="eyebrow text-[var(--color-muted)]">Ready</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">
                  {platformStatus.readyCount}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Checks currently passing.
                </p>
              </div>
              <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
                <p className="eyebrow text-[var(--color-muted)]">Action required</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">
                  {actionRequiredCount}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Config present but incomplete.
                </p>
              </div>
              <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
                <p className="eyebrow text-[var(--color-muted)]">Offline</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">{offlineCount}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Missing or unreachable services.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          {platformStatus.checks.map((check) => (
            <article key={check.id} className="surface-card p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">{check.label}</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                    {check.detail}
                  </h2>
                </div>
                <span className={toneClasses(check.status)}>{check.status}</span>
              </div>

              <div className="surface-muted mt-5 p-4">
                <p className="eyebrow text-[var(--color-accent)]">Next action</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {check.nextAction}
                </p>
              </div>
            </article>
          ))}
        </div>

        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Extra setup</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
            Optional capabilities to unlock.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">URL capture</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Install Chromium for Playwright with <code>npx playwright install chromium</code>.
              </p>
            </div>
            <div className="surface-muted p-5">
              <p className="eyebrow">GitHub intake</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Add <code>GITHUB_TOKEN</code> if you want better GitHub API limits or private repo
                access.
              </p>
            </div>
            <div className="surface-muted p-5">
              <p className="eyebrow">Builder CLI</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Use <code>npm run builder -- help</code> to bridge exported reports into a local
                repo workflow.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
