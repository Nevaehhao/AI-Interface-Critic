import { HistoryPageClient } from "@/components/history/history-page-client";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { listPersistedAnalyses } from "@/lib/data/analysis-store";
import { listWorkspaces } from "@/lib/data/workspace-store";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ selected?: string; workspaceId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedWorkspaceId = resolvedSearchParams?.workspaceId ?? null;
  const selectedAnalysisIds = (resolvedSearchParams?.selected ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5);

  const [{ analyses, user }, { workspaces }] = await Promise.all([
    listPersistedAnalyses(selectedWorkspaceId),
    listWorkspaces({ includeArchived: true }),
  ]);

  const persistenceConfigured = hasDatabaseConfig() && hasNeonAuthConfig();

  return (
    <div className="page-shell">
      <SiteHeader />

      <HistoryPageClient
        initialAnalyses={analyses ?? []}
        initialSelectedIds={selectedAnalysisIds}
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

      <SiteFooter />
    </div>
  );
}
