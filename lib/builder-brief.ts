import { getAnalysisModeLabel } from "@/lib/analysis-context";
import type { AnalysisReport } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";

function formatAnalysisSource(source: AnalysisSource) {
  if (source === "ollama") {
    return "Ollama";
  }

  if (source === "openai-compatible") {
    return "OpenAI-compatible API";
  }

  if (source === "anthropic") {
    return "Anthropic";
  }

  if (source === "gemini") {
    return "Gemini";
  }

  return "Fallback";
}

function formatList(title: string, items: string[]) {
  if (items.length === 0) {
    return `${title}\n- None`;
  }

  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function buildBuilderBrief({
  analysisId,
  report,
  source,
}: {
  analysisId: string;
  report: AnalysisReport;
  source: AnalysisSource;
}) {
  const contextLines = [
    `Review mode: ${getAnalysisModeLabel(report.context.analysisMode)}`,
    report.context.pageUrl ? `Page URL: ${report.context.pageUrl}` : null,
    report.context.repoUrl ? `Repo URL: ${report.context.repoUrl}` : null,
    report.context.productGoal ? `Product goal: ${report.context.productGoal}` : null,
    report.context.targetAudience ? `Target audience: ${report.context.targetAudience}` : null,
    report.context.techStack ? `Tech stack: ${report.context.techStack}` : null,
    report.context.notes ? `Extra notes: ${report.context.notes}` : null,
  ].filter((line): line is string => Boolean(line));

  return [
    `Analysis ID: ${analysisId}`,
    `Source: ${formatAnalysisSource(source)}`,
    "",
    "Summary",
    `- Main finding: ${report.summary.mainFinding}`,
    `- Product type: ${report.summary.productType}`,
    `- Overall score: ${report.summary.overallScore}`,
    `- Next action: ${report.summary.nextAction}`,
    "",
    "Context",
    ...(contextLines.length > 0 ? contextLines.map((line) => `- ${line}`) : ["- No extra context provided."]),
    "",
    "Implementation plan",
    report.implementationPlan.summary,
    `Estimated scope: ${report.implementationPlan.estimatedScope}`,
    "",
    formatList("Frontend changes", report.implementationPlan.frontendChanges),
    "",
    formatList("Backend changes", report.implementationPlan.backendChanges),
    "",
    formatList("Files to inspect", report.implementationPlan.filesToInspect),
    "",
    formatList("Acceptance criteria", report.implementationPlan.acceptanceCriteria),
    "",
    formatList("Risks", report.implementationPlan.risks),
  ].join("\n");
}
