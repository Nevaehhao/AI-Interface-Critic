import { z } from "zod";

import {
  analysisReportSchema,
  createMockAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";

export const STORED_ANALYSIS_KEY = "ai-interface-critic.latest-analysis";
export const ANALYSIS_SOURCE_VALUES = ["mock", "ollama"] as const;
export type AnalysisSource = (typeof ANALYSIS_SOURCE_VALUES)[number];

export const analyzeResponseSchema = z.object({
  analysis: analysisReportSchema,
  source: z.enum(ANALYSIS_SOURCE_VALUES),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export function createMockAnalyzeResponse() {
  return analyzeResponseSchema.parse({
    analysis: createMockAnalysisReport(),
    source: "mock",
  });
}

export function saveLatestAnalysisResult(response: AnalyzeResponse) {
  window.sessionStorage.setItem(STORED_ANALYSIS_KEY, JSON.stringify(response));
}

export function loadLatestAnalysisResult() {
  const rawValue = window.sessionStorage.getItem(STORED_ANALYSIS_KEY);

  if (!rawValue) {
    return null;
  }

  return analyzeResponseSchema.parse(JSON.parse(rawValue));
}

export function getAnalysisForId(analysisId: string): AnalysisReport | null {
  const latestAnalysis = loadLatestAnalysisResult();

  if (!latestAnalysis) {
    return null;
  }

  return latestAnalysis.analysis.id === analysisId ? latestAnalysis.analysis : null;
}

export function getAnalysisResultForId(analysisId: string) {
  const latestAnalysis = loadLatestAnalysisResult();

  if (!latestAnalysis) {
    return null;
  }

  return latestAnalysis.analysis.id === analysisId ? latestAnalysis : null;
}
