import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteHeader } from "@/components/layout/site-header";
import { WorkspaceCreateForm } from "@/components/workspaces/workspace-create-form";
import { WorkspaceManagerCard } from "@/components/workspaces/workspace-manager-card";
import { listPersistedAnalyses } from "@/lib/data/analysis-store";
import { listWorkspaces } from "@/lib/data/workspace-store";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const [{ analyses, user: analysisUser }, { workspaces, user: workspaceUser }] =
    await Promise.all([listPersistedAnalyses(), listWorkspaces({ includeArchived: true })]);

  const persistenceConfigured = hasDatabaseConfig() && hasNeonAuthConfig();
  const user = workspaceUser ?? analysisUser;
  const analysisCounts = new Map<string, number>();
  const activeWorkspaces = (workspaces ?? []).filter((workspace) => !workspace.archived_at);
  const archivedWorkspaces = (workspaces ?? []).filter((workspace) => Boolean(workspace.archived_at));

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

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="eyebrow">Workspaces</p>
            <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
              Organize critiques by project.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
              Create a workspace for each case study or product stream, then route uploads into the
              right bucket before analysis begins.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? <SignOutButton /> : null}
            <Link href="/upload" className="material-button material-button-primary">
              New analysis
            </Link>
          </div>
        </div>

        {!persistenceConfigured || workspaces === null ? (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">Platform setup required</p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Add Neon Auth and Neon Postgres to enable workspace persistence.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Workspaces are stored in Neon and tied to the signed-in account. They stay inactive
              until the app has `DATABASE_URL` and `NEON_AUTH_BASE_URL`.
            </p>
            <Link href="/setup" className="material-button material-button-secondary mt-6">
              Open setup checklist
            </Link>
          </div>
        ) : !user ? (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">Sign-in required</p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Sign in to create shared project buckets.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Workspaces are attached to your Neon Auth account so your history, uploads, and
              reports stay grouped correctly.
            </p>
            <Link href="/auth/sign-in" className="material-button material-button-secondary mt-6">
              Open sign-in
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <WorkspaceCreateForm />

            <section className="surface-tonal p-6">
              <p className="eyebrow">Your workspaces</p>
              <h2 className="mt-3 text-3xl tracking-tight">Project groups</h2>

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

                  {archivedWorkspaces.length > 0 ? (
                    <div className="mt-4 grid gap-4">
                      <div className="px-1">
                        <p className="eyebrow">Archived</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                          Archived workspaces stay available for history and can be restored.
                        </p>
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
                <div className="surface-card mt-6 rounded-[1.5rem] p-5 shadow-none">
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    No workspaces yet. Create one on the left, then use it during upload to keep
                    analyses grouped by project.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
