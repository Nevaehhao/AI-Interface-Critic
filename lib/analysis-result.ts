import { z } from "zod";

import {
  analysisReportSchema,
  createMockAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";

export const STORED_ANALYSIS_KEY = "ai-interface-critic.latest-analysis";
export const STORED_ANALYSIS_HISTORY_KEY = "ai-interface-critic.analysis-history";
export const ANALYSIS_SOURCE_VALUES = [
  "mock",
  "ollama",
  "openai-compatible",
  "anthropic",
  "gemini",
] as const;
export type AnalysisSource = (typeof ANALYSIS_SOURCE_VALUES)[number];
const MAX_STORED_ANALYSES = 24;

export const analyzeResponseSchema = z.object({
  analysis: analysisReportSchema,
  screenshotDataUrl: z.string().nullable().optional(),
  source: z.enum(ANALYSIS_SOURCE_VALUES),
  warning: z.string().nullable().optional(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
const storedLatestAnalysisSchema = analyzeResponseSchema.extend({
  viewerUserId: z.string().nullable().optional(),
});

export const storedAnalysisHistoryEntrySchema = analyzeResponseSchema.extend({
  viewerUserId: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  workspaceName: z.string().nullable().optional(),
});

export const storedAnalysisHistorySchema = z.array(storedAnalysisHistoryEntrySchema);

export type StoredAnalysisHistoryEntry = z.infer<typeof storedAnalysisHistoryEntrySchema>;

export function createMockAnalyzeResponse() {
  return analyzeResponseSchema.parse({
    analysis: createMockAnalysisReport(),
    screenshotDataUrl: null,
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

function matchesViewerUserId(
  entry: { viewerUserId?: string | null },
  viewerUserId: string | null | undefined,
) {
  if (typeof viewerUserId === "undefined") {
    return true;
  }

  return (entry.viewerUserId ?? null) === viewerUserId;
}

function loadStoredLatestAnalysis() {
  const rawValue = window.sessionStorage.getItem(STORED_ANALYSIS_KEY);

  if (!rawValue) {
    return null;
  }

  return storedLatestAnalysisSchema.parse(JSON.parse(rawValue));
}

export function saveLatestAnalysisResult(
  response: AnalyzeResponse,
  options?: {
    screenshotDataUrl?: string | null;
    viewerUserId?: string | null;
    workspaceId?: string | null;
    workspaceName?: string | null;
  },
) {
  window.sessionStorage.setItem(
    STORED_ANALYSIS_KEY,
    JSON.stringify({
      ...response,
      viewerUserId: options?.viewerUserId ?? null,
    }),
  );

  const historyEntry = storedAnalysisHistoryEntrySchema.parse({
    ...response,
    screenshotDataUrl: options?.screenshotDataUrl ?? response.screenshotDataUrl ?? null,
    viewerUserId: options?.viewerUserId ?? null,
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
  const storedLatestAnalysis = loadStoredLatestAnalysis();

  if (!storedLatestAnalysis) {
    return null;
  }

  return analyzeResponseSchema.parse(storedLatestAnalysis);
}

export function loadStoredAnalysisHistory(options?: {
  viewerUserId?: string | null;
}) {
  return loadStoredHistoryFromLocalStorage().filter((entry) =>
    matchesViewerUserId(entry, options?.viewerUserId),
  );
}

export function getAnalysisForId(
  analysisId: string,
  options?: {
    viewerUserId?: string | null;
  },
): AnalysisReport | null {
  const latestAnalysis = loadStoredLatestAnalysis();

  if (!latestAnalysis) {
    return null;
  }

  return latestAnalysis.analysis.id === analysisId &&
    matchesViewerUserId(latestAnalysis, options?.viewerUserId)
    ? latestAnalysis.analysis
    : null;
}

export function getAnalysisResultForId(
  analysisId: string,
  options?: {
    viewerUserId?: string | null;
  },
) {
  const storedHistoryMatch = loadStoredHistoryFromLocalStorage().find(
    (entry) =>
      entry.analysis.id === analysisId && matchesViewerUserId(entry, options?.viewerUserId),
  );

  if (storedHistoryMatch) {
    return storedHistoryMatch;
  }

  const latestAnalysis = loadStoredLatestAnalysis();

  if (!latestAnalysis) {
    return null;
  }

  return latestAnalysis.analysis.id === analysisId &&
    matchesViewerUserId(latestAnalysis, options?.viewerUserId)
    ? storedAnalysisHistoryEntrySchema.parse({
        ...latestAnalysis,
        screenshotDataUrl: latestAnalysis.screenshotDataUrl ?? null,
        viewerUserId: latestAnalysis.viewerUserId ?? null,
        workspaceId: null,
        workspaceName: null,
      })
    : null;
}

export function updateStoredAnalysisReport(
  analysisId: string,
  report: AnalysisReport,
) {
  const latestAnalysis = loadStoredLatestAnalysis();

  if (latestAnalysis?.analysis.id === analysisId) {
    window.sessionStorage.setItem(
      STORED_ANALYSIS_KEY,
      JSON.stringify({
        ...latestAnalysis,
        analysis: report,
      }),
    );
  }

  const currentHistory = loadStoredHistoryFromLocalStorage();
  const nextHistory = currentHistory.map((entry) =>
    entry.analysis.id === analysisId
      ? storedAnalysisHistoryEntrySchema.parse({
          ...entry,
          analysis: report,
        })
      : entry,
  );

  window.localStorage.setItem(STORED_ANALYSIS_HISTORY_KEY, JSON.stringify(nextHistory));
}
