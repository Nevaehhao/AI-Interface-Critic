import { HistoryPageClient } from "@/components/history/history-page-client";
import { SiteHeader } from "@/components/layout/site-header";
import { listPersistedAnalyses } from "@/lib/data/analysis-store";
import { listWorkspaces } from "@/lib/data/workspace-store";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

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

  const persistenceConfigured = hasDatabaseConfig() && hasNeonAuthConfig();

  return (
    <div className="page-shell">
      <SiteHeader />

      <HistoryPageClient
        initialAnalyses={analyses ?? []}
        isPersistenceConfigured={persistenceConfigured}
        isSignedIn={Boolean(user)}
        selectedWorkspaceId={selectedWorkspaceId}
        userEmail={user?.email ?? null}
        viewerUserId={user?.id ?? null}
        workspaces={(workspaces ?? []).map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
        }))}
      />
    </div>
  );
}
