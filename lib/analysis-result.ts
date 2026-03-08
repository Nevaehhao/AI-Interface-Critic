import { z } from "zod";

import {
  analysisReportSchema,
  createMockAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";

export const STORED_ANALYSIS_KEY = "ai-interface-critic.latest-analysis";
export const STORED_ANALYSIS_HISTORY_KEY = "ai-interface-critic.analysis-history";
export const ANALYSIS_SOURCE_VALUES = ["mock", "ollama"] as const;
export type AnalysisSource = (typeof ANALYSIS_SOURCE_VALUES)[number];
const MAX_STORED_ANALYSES = 24;

export const analyzeResponseSchema = z.object({
  analysis: analysisReportSchema,
  source: z.enum(ANALYSIS_SOURCE_VALUES),
  warning: z.string().nullable().optional(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export const storedAnalysisHistoryEntrySchema = analyzeResponseSchema.extend({
  screenshotDataUrl: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  workspaceName: z.string().nullable().optional(),
});

export const storedAnalysisHistorySchema = z.array(storedAnalysisHistoryEntrySchema);

export type StoredAnalysisHistoryEntry = z.infer<typeof storedAnalysisHistoryEntrySchema>;

export function createMockAnalyzeResponse() {
  return analyzeResponseSchema.parse({
    analysis: createMockAnalysisReport(),
    source: "mock",
    warning: null,
  });
}

function loadStoredHistoryFromLocalStorage() {
  const rawValue = window.localStorage.getItem(STORED_ANALYSIS_HISTORY_KEY);

  if (!rawValue) {
    return [] as StoredAnalysisHistoryEntry[];
  }

  try {
    return storedAnalysisHistorySchema.parse(JSON.parse(rawValue));
  } catch {
    return [] as StoredAnalysisHistoryEntry[];
  }
}

export function saveLatestAnalysisResult(
  response: AnalyzeResponse,
  options?: {
    screenshotDataUrl?: string | null;
    workspaceId?: string | null;
    workspaceName?: string | null;
  },
) {
  window.sessionStorage.setItem(STORED_ANALYSIS_KEY, JSON.stringify(response));

  const historyEntry = storedAnalysisHistoryEntrySchema.parse({
    ...response,
    screenshotDataUrl: options?.screenshotDataUrl ?? null,
    workspaceId: options?.workspaceId ?? null,
    workspaceName: options?.workspaceName ?? null,
  });
  const nextHistory = [
    historyEntry,
    ...loadStoredHistoryFromLocalStorage().filter(
      (entry) => entry.analysis.id !== historyEntry.analysis.id,
    ),
  ].slice(0, MAX_STORED_ANALYSES);

  window.localStorage.setItem(STORED_ANALYSIS_HISTORY_KEY, JSON.stringify(nextHistory));
}

export function loadLatestAnalysisResult() {
  const rawValue = window.sessionStorage.getItem(STORED_ANALYSIS_KEY);

  if (!rawValue) {
    return null;
  }

  return analyzeResponseSchema.parse(JSON.parse(rawValue));
}

export function loadStoredAnalysisHistory() {
  return loadStoredHistoryFromLocalStorage();
}

export function getAnalysisForId(analysisId: string): AnalysisReport | null {
  const latestAnalysis = loadLatestAnalysisResult();

  if (!latestAnalysis) {
    return null;
  }

  return latestAnalysis.analysis.id === analysisId ? latestAnalysis.analysis : null;
}

export function getAnalysisResultForId(analysisId: string) {
  const storedHistoryMatch = loadStoredHistoryFromLocalStorage().find(
    (entry) => entry.analysis.id === analysisId,
  );

  if (storedHistoryMatch) {
    return storedHistoryMatch;
  }

  const latestAnalysis = loadLatestAnalysisResult();

  if (!latestAnalysis) {
    return null;
  }

  return latestAnalysis.analysis.id === analysisId
    ? storedAnalysisHistoryEntrySchema.parse({
        ...latestAnalysis,
        screenshotDataUrl: null,
        workspaceId: null,
        workspaceName: null,
      })
    : null;
}
