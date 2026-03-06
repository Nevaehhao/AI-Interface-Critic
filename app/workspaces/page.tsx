import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { WorkspaceCreateForm } from "@/components/workspaces/workspace-create-form";
import { listPersistedAnalyses } from "@/lib/supabase/analysis-store";
import { listWorkspaces } from "@/lib/supabase/workspace-store";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const [{ analyses, user: analysisUser }, { workspaces, user: workspaceUser }] =
    await Promise.all([listPersistedAnalyses(), listWorkspaces()]);

  const user = workspaceUser ?? analysisUser;
  const analysisCounts = new Map<string, number>();

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
          <Link href="/upload" className="material-button material-button-primary">
            New analysis
          </Link>
        </div>

        {workspaces === null ? (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">Supabase not configured</p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Add Supabase keys to enable workspace persistence.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Workspaces are stored with Supabase, so this feature stays inactive until project
              credentials are configured.
            </p>
          </div>
        ) : !user ? (
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow text-[var(--color-accent)]">Sign-in required</p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Sign in to create shared project buckets.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Workspaces are attached to your Supabase account so your history, uploads, and reports
              stay grouped correctly.
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
              <h2 className="mt-3 text-3xl tracking-tight">Active project groups</h2>

              {workspaces.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {workspaces.map((workspace) => (
                    <article key={workspace.id} className="surface-card rounded-[1.5rem] p-5 shadow-none">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl tracking-tight">{workspace.name}</h3>
                          {workspace.description ? (
                            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                              {workspace.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="app-chip">
                          {analysisCounts.get(workspace.id) ?? 0} analyses
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
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
                    </article>
                  ))}
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
