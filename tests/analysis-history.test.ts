import { afterEach, describe, expect, it, vi } from "vitest";

import { createMockAnalysisReport } from "../lib/analysis-report";
import {
  analyzeResponseSchema,
  getAnalysisResultForId,
  loadStoredAnalysisHistory,
  saveLatestAnalysisResult,
} from "../lib/analysis-result";

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    get length() {
      return store.size;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local analysis history", () => {
  it("stores a browser history entry and retrieves it by analysis id", () => {
    const windowMock = {
      localStorage: createStorageMock(),
      sessionStorage: createStorageMock(),
    };

    vi.stubGlobal("window", windowMock);

    const response = analyzeResponseSchema.parse({
      analysis: createMockAnalysisReport({
        createdAt: "2026-03-08T00:00:00.000Z",
        id: "history-entry-1",
      }),
      source: "mock",
      warning: "Ollama request failed.",
    });

    saveLatestAnalysisResult(response, {
      screenshotDataUrl: "data:image/png;base64,abc",
      workspaceId: "workspace-1",
      workspaceName: "Portfolio",
    });

    const history = loadStoredAnalysisHistory();

    expect(history).toHaveLength(1);
    expect(history[0]?.workspaceName).toBe("Portfolio");
    expect(history[0]?.warning).toBe("Ollama request failed.");
    expect(getAnalysisResultForId("history-entry-1")?.screenshotDataUrl).toBe(
      "data:image/png;base64,abc",
    );
  });
});
