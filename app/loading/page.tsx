import { getCurrentAuthSession } from "@/lib/auth/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalysisLoadingView } from "@/components/loading/analysis-loading-view";

export const dynamic = "force-dynamic";

export default async function LoadingPage() {
  const { user } = await getCurrentAuthSession();

  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
        <AnalysisLoadingView viewerUserId={user?.id ?? null} />
      </main>

      <SiteFooter />
    </div>
  );
}
