import { mockAnalysisReport } from "@/lib/analysis-report";
import { ReportView } from "@/components/report/report-view";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;

  return <ReportView analysisId={analysisId} report={mockAnalysisReport} />;
}
