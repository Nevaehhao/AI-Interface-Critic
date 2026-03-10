import { describe, expect, it } from "vitest";

import { createMockAnalysisReport } from "../lib/analysis-report";
import { resolveReportClientState } from "../lib/report-client-state";

describe("report client state", () => {
  it("returns a missing state for unknown non-demo reports", () => {
    const state = resolveReportClientState({
      analysisId: "unknown-report",
    });

    expect(state.report).toBeNull();
    expect(state.screenshotUrl).toBeNull();
    expect(state.source).toBe("mock");
  });

  it("uses stored browser history over missing server state", () => {
    const report = createMockAnalysisReport({
      createdAt: "2026-03-10T00:00:00.000Z",
      id: "stored-report",
    });

    const state = resolveReportClientState({
      analysisId: "stored-report",
      initialReport: null,
      initialScreenshotUrl: "/api/screenshots/stored-report",
      initialSource: "mock",
      initialWarning: "Old warning",
      storedResult: {
        analysis: report,
        screenshotDataUrl: "data:image/png;base64,abc",
        source: "ollama",
        warning: null,
        workspaceId: "workspace-1",
        workspaceName: "Portfolio",
      },
    });

    expect(state.report?.id).toBe("stored-report");
    expect(state.screenshotUrl).toBe("data:image/png;base64,abc");
    expect(state.source).toBe("ollama");
    expect(state.warning).toBeNull();
  });
});
