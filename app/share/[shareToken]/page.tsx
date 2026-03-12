import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { ReportView } from "@/components/report/report-view";
import { getSharedAnalysisByToken } from "@/lib/data/analysis-store";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const sharedRecord = await getSharedAnalysisByToken(shareToken);

  if (!sharedRecord) {
    return (
      <div className="page-shell">
        <SiteHeader />

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <section className="surface-card p-6 sm:p-8">
            <p className="eyebrow">Shared report</p>
            <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
              This shared link is no longer available.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-muted)]">
              The report may have been disabled or the link may be invalid.
            </p>
            <Link href="/" className="material-button material-button-secondary mt-6">
              Back to home
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <ReportView
      analysisId={sharedRecord.analysisId}
      initialShareUrl={`/share/${shareToken}`}
      isReadOnly
      report={sharedRecord.report}
      screenshotUrl={sharedRecord.screenshotUrl}
      source={sharedRecord.source}
    />
  );
}
