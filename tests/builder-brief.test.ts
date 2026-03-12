import { describe, expect, it } from "vitest";

import { buildBuilderBrief } from "../lib/builder-brief";
import { createMockAnalysisReport } from "../lib/analysis-report";
import { analysisContextSchema } from "../lib/analysis-context";

describe("builder brief", () => {
  it("includes context and implementation steps for engineering handoff", () => {
    const report = createMockAnalysisReport({
      context: analysisContextSchema.parse({
        analysisMode: "implementation-handoff",
        notes: "Optimize the hero before launch.",
        pageUrl: "https://example.com",
        productGoal: "Improve signup conversion",
        repoUrl: "https://github.com/example/repo",
        targetAudience: "New users",
        techStack: "Next.js",
      }),
      createdAt: "2026-03-11T00:00:00.000Z",
      id: "builder-brief-report",
    });

    const brief = buildBuilderBrief({
      analysisId: report.id,
      report,
      source: "openai-compatible",
    });

    expect(brief).toContain("Implementation handoff");
    expect(brief).toContain("https://github.com/example/repo");
    expect(brief).toContain("Frontend changes");
    expect(brief).toContain(report.implementationPlan.summary);
  });
});
