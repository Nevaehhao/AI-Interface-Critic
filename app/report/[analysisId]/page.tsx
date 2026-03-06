import { ReportPageClient } from "@/components/report/report-page-client";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;

  return <ReportPageClient analysisId={analysisId} />;
}
