import Link from "next/link";

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

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="eyebrow">Platform setup</p>
            <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
              Readiness for Ollama, Neon, local storage, and deployment.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
              This page checks the services and environment variables your app needs before you
              call the stack “live”.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="app-chip">
              {platformStatus.readyCount} / {platformStatus.checks.length} ready
            </span>
            <Link href="/api/health" className="material-button material-button-secondary">
              Open JSON health check
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {platformStatus.checks.map((check) => (
            <article key={check.id} className="surface-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">{check.label}</p>
                  <h2 className="mt-3 text-2xl tracking-tight">{check.detail}</h2>
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
      </main>
    </div>
  );
}
