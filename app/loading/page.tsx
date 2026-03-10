import { getCurrentAuthSession } from "@/lib/auth/server";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalysisLoadingView } from "@/components/loading/analysis-loading-view";

export const dynamic = "force-dynamic";

export default async function LoadingPage() {
  const { user } = await getCurrentAuthSession();

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <AnalysisLoadingView viewerUserId={user?.id ?? null} />
      </main>
    </div>
  );
}
