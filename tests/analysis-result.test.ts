import { describe, expect, it } from "vitest";

import {
  analyzeResponseSchema,
  createMockAnalyzeResponse,
} from "../lib/analysis-result";

describe("analysis result contract", () => {
  it("returns a valid mock response", () => {
    const response = createMockAnalyzeResponse();

    expect(analyzeResponseSchema.parse(response)).toEqual(response);
    expect(response.source).toBe("mock");
    expect(response.warning).toBeNull();
    expect(response.analysis.summary.overallScore).toBeGreaterThan(0);
  });

  it("accepts hosted providers in the response contract", () => {
    const response = createMockAnalyzeResponse();
    response.source = "anthropic";

    expect(analyzeResponseSchema.parse(response).source).toBe("anthropic");

    response.source = "gemini";

    expect(analyzeResponseSchema.parse(response).source).toBe("gemini");
  });
});
