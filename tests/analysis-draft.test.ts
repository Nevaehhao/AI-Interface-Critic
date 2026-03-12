import { describe, expect, it } from "vitest";

import {
  getPendingAnalysisScreenshots,
  type PendingAnalysisDraft,
} from "../lib/analysis-draft";

describe("pending analysis draft", () => {
  it("returns explicit screenshots when present", () => {
    const draft: PendingAnalysisDraft = {
      captureMode: "upload",
      context: undefined,
      dataUrl: "data:image/png;base64,aaa",
      name: "primary.png",
      screenshots: [
        {
          dataUrl: "data:image/png;base64,aaa",
          name: "screen-1.png",
          size: 1200,
          type: "image/png",
        },
        {
          dataUrl: "data:image/png;base64,bbb",
          name: "screen-2.png",
          size: 1400,
          type: "image/png",
        },
      ],
      size: 1200,
      type: "image/png",
      workspaceId: null,
      workspaceName: null,
    };

    expect(getPendingAnalysisScreenshots(draft)).toHaveLength(2);
    expect(getPendingAnalysisScreenshots(draft)[1]?.name).toBe("screen-2.png");
  });

  it("falls back to the legacy single screenshot fields", () => {
    const draft: PendingAnalysisDraft = {
      captureMode: "upload",
      context: undefined,
      dataUrl: "data:image/png;base64,aaa",
      name: "primary.png",
      screenshots: [],
      size: 1200,
      type: "image/png",
      workspaceId: null,
      workspaceName: null,
    };

    expect(getPendingAnalysisScreenshots(draft)).toEqual([
      {
        dataUrl: "data:image/png;base64,aaa",
        name: "primary.png",
        size: 1200,
        type: "image/png",
      },
    ]);
  });
});
