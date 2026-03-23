import { ReportView } from "@/components/report/report-view";
import { mockAnalysisReport } from "@/lib/analysis-report";

export default function DemoReportPage() {
  return (
    <ReportView
      analysisId="demo"
      report={mockAnalysisReport}
      screenshotUrl="/demo/report-preview.png"
    />
  );
}
