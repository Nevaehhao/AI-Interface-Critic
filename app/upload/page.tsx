import { SiteHeader } from "@/components/layout/site-header";
import { UploadForm } from "@/components/upload/upload-form";
import { listWorkspaces } from "@/lib/data/workspace-store";

export default async function UploadPage({
  searchParams,
}: {
  searchParams?: Promise<{ workspaceId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedWorkspaceId = resolvedSearchParams?.workspaceId ?? null;
  const { workspaces, user } = await listWorkspaces();

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
        <UploadForm
          initialWorkspaceId={selectedWorkspaceId}
          isSignedIn={Boolean(user)}
          workspaces={workspaces ?? []}
        />
      </main>
    </div>
  );
}
