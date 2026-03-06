import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { UploadForm } from "@/components/upload/upload-form";
import { listWorkspaces } from "@/lib/supabase/workspace-store";

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

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <UploadForm
          initialWorkspaceId={selectedWorkspaceId}
          isSignedIn={Boolean(user)}
          workspaces={workspaces ?? []}
        />

        <Link href="/" className="material-button material-button-text w-fit px-0">
          Back to landing page
        </Link>
      </main>
    </div>
  );
}
