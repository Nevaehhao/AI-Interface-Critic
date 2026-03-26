import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WorkspaceCreateForm } from "@/components/workspaces/workspace-create-form";
import { WorkspaceManagerCard } from "@/components/workspaces/workspace-manager-card";
import { listPersistedAnalyses } from "@/lib/data/analysis-store";
import { listWorkspaces } from "@/lib/data/workspace-store";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams?: Promise<{ archive?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [{ analyses, user: analysisUser }, { workspaces, user: workspaceUser }] =
    await Promise.all([listPersistedAnalyses(), listWorkspaces({ includeArchived: true })]);

  const persistenceConfigured = hasDatabaseConfig() && hasNeonAuthConfig();
  const user = workspaceUser ?? analysisUser;
  const analysisCounts = new Map<string, number>();
  const activeWorkspaces = (workspaces ?? []).filter((workspace) => !workspace.archived_at);
  const archivedWorkspaces = (workspaces ?? []).filter((workspace) => Boolean(workspace.archived_at));
  const totalAnalyses = analyses?.length ?? 0;
  const isArchiveOpen = resolvedSearchParams?.archive === "open";

  for (const analysis of analyses ?? []) {
    if (!analysis.workspace_id) {
      continue;
    }

    analysisCounts.set(
      analysis.workspace_id,
      (analysisCounts.get(analysis.workspace_id) ?? 0) + 1,
    );
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="surface-card p-7 sm:p-10">
            <p className="eyebrow">Workspace atelier</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
              Organize critiques into clean project streams.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
              Keep marketing audits, product flows, and client reviews separated before they turn
              into a crowded report archive. Each workspace becomes a durable bucket for uploads,
              history, and follow-up.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/upload" className="material-button material-button-primary">
                Start new analysis
              </Link>
              {isArchiveOpen ? (
                <Link
                  href="/workspaces#project-groups"
                  className="material-button material-button-secondary"
                >
                  Hide archive
                </Link>
              ) : (
                <Link
                  href="/workspaces?archive=open#archived-workspaces"
                  className="material-button material-button-secondary"
                >
                  Open archive
                </Link>
              )}
              {user ? <SignOutButton /> : null}
            </div>
          </div>

          <aside className="surface-tonal p-7 sm:p-8">
            <p className="eyebrow">Portfolio snapshot</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
                <p className="eyebrow text-[var(--color-muted)]">Active</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">
                  {activeWorkspaces.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Project spaces ready for new critiques.
                </p>
              </div>
              <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
                <p className="eyebrow text-[var(--color-muted)]">Archived</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">
                  {archivedWorkspaces.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Stored safely for historical comparison.
                </p>
              </div>
              <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
                <p className="eyebrow text-[var(--color-muted)]">Analyses</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">{totalAnalyses}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Reports currently routed across the archive.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {!persistenceConfigured || workspaces === null ? (
          <section className="surface-card p-7 sm:p-10">
            <p className="eyebrow text-[var(--color-accent)]">Platform setup required</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.05em]">
              Connect Neon Auth and Neon Postgres before turning workspaces on.
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
              <div className="surface-muted p-5">
                <p className="text-sm leading-7 text-[var(--color-muted)]">
                  Workspaces are stored in Neon and tied to the signed-in account. Until
                  `DATABASE_URL` and `NEON_AUTH_BASE_URL` are configured, uploads can still run,
                  but project grouping will stay unavailable.
                </p>
              </div>
              <div className="surface-tonal p-5">
                <p className="eyebrow">Next step</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Open setup to verify auth, database, and local health in one pass.
                </p>
                <Link href="/setup" className="material-button material-button-primary mt-5">
                  Open setup checklist
                </Link>
              </div>
            </div>
          </section>
        ) : !user ? (
          <section className="surface-card p-7 sm:p-10">
            <p className="eyebrow text-[var(--color-accent)]">Sign-in required</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.05em]">
              Sign in before creating shared project buckets.
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
              <div className="surface-muted p-5">
                <p className="text-sm leading-7 text-[var(--color-muted)]">
                  Workspace ownership lives on the Neon Auth account so critique history, triage,
                  and uploads stay attached to the right project stream across devices.
                </p>
              </div>
              <div className="surface-tonal p-5">
                <p className="eyebrow">Continue</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Sign in first, then come back here to create and manage workspace buckets.
                </p>
                <Link href="/auth/sign-in" className="material-button material-button-primary mt-5">
                  Open sign-in
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            <WorkspaceCreateForm />

            <section className="surface-tonal p-6 sm:p-8">
              <div
                id="project-groups"
                className="flex flex-wrap items-start justify-between gap-4"
              >
                <div>
                  <p className="eyebrow">Your workspaces</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Project groups</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="app-chip">{activeWorkspaces.length} active</span>
                  {archivedWorkspaces.length > 0 ? (
                    <span className="app-chip">{archivedWorkspaces.length} archived</span>
                  ) : null}
                </div>
              </div>

              {workspaces.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {activeWorkspaces.map((workspace) => (
                    <div key={workspace.id} className="grid gap-3">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/upload?workspaceId=${workspace.id}`}
                          className="material-button material-button-primary"
                        >
                          Start in workspace
                        </Link>
                        <Link
                          href={`/history?workspaceId=${workspace.id}`}
                          className="material-button material-button-secondary"
                        >
                          Open history
                        </Link>
                      </div>
                      <WorkspaceManagerCard
                        analysisCount={analysisCounts.get(workspace.id) ?? 0}
                        workspace={workspace}
                      />
                    </div>
                  ))}

                  {archivedWorkspaces.length > 0 && isArchiveOpen ? (
                    <div id="archived-workspaces" className="mt-4 grid gap-4 scroll-mt-32">
                      <div className="flex flex-wrap items-start justify-between gap-4 px-1">
                        <div>
                          <p className="eyebrow">Archived</p>
                          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                            Archived workspaces stay available for history and can be restored.
                          </p>
                        </div>
                        <Link
                          href="/workspaces#project-groups"
                          className="material-button material-button-text px-0"
                        >
                          Back to project groups
                        </Link>
                      </div>

                      {archivedWorkspaces.map((workspace) => (
                        <WorkspaceManagerCard
                          key={workspace.id}
                          analysisCount={analysisCounts.get(workspace.id) ?? 0}
                          workspace={workspace}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="surface-card mt-6 rounded-[1.75rem] p-6 shadow-none">
                  <p className="eyebrow">No workspaces yet</p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                    Create one on the left, then choose it during upload so each critique lands in
                    the right project stream from the start.
                  </p>
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
