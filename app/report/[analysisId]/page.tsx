import { ReportPageClient } from "@/components/report/report-page-client";
import { getPersistedAnalysisById } from "@/lib/data/analysis-store";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;
  const initialRecord =
    analysisId === "demo" ? null : await getPersistedAnalysisById(analysisId);

  return (
    <ReportPageClient
      analysisId={analysisId}
      initialReport={initialRecord?.report ?? null}
      initialScreenshotUrl={initialRecord?.screenshotUrl ?? null}
      initialSource={initialRecord?.source ?? "mock"}
    />
  );
}
