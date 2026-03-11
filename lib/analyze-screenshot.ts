import type { AnalysisContext } from "@/lib/analysis-context";
import type { AnalysisReport } from "@/lib/analysis-report";
import {
  resolveAnalysisProvider,
  type AnalysisProvider,
} from "@/lib/analysis-provider";
import { analyzeScreenshotWithOllama } from "@/lib/ollama-analysis";
import { analyzeScreenshotWithOpenAiCompatibleApi } from "@/lib/openai-compatible-analysis";

export type AnalyzeScreenshotResult = {
  analysis: AnalysisReport;
  provider: AnalysisProvider;
};

export async function analyzeScreenshot(
  file: File,
  context?: AnalysisContext,
): Promise<AnalyzeScreenshotResult> {
  const providerConfig = resolveAnalysisProvider();

  if (providerConfig.provider === "openai-compatible") {
    return {
      analysis: await analyzeScreenshotWithOpenAiCompatibleApi(file, context),
      provider: providerConfig.provider,
    };
  }

  return {
    analysis: await analyzeScreenshotWithOllama(file, context),
    provider: providerConfig.provider,
  };
}
