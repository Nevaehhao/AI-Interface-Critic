import { describe, expect, it } from "vitest";

import {
  analysisReportSchema,
  createMockAnalysisReport,
  updateIssueTriage,
} from "../lib/analysis-report";

describe("analysis report schema", () => {
  it("accepts the mock report with highlights and redesign suggestions", () => {
    const report = createMockAnalysisReport({
      createdAt: "2026-03-06T00:00:00.000Z",
      id: "report-under-test",
    });

    expect(analysisReportSchema.parse(report)).toEqual(report);
    expect(
      report.sections.some((section) =>
        section.issues.some((issue) => issue.highlights.length > 0),
      ),
    ).toBe(true);
    expect(report.redesignSuggestions.length).toBeGreaterThan(0);
    expect(report.implementationPlan.frontendChanges.length).toBeGreaterThan(0);
  });

  it("fills new top-level report fields for legacy payloads", () => {
    const parsed = analysisReportSchema.parse({
      createdAt: "2026-03-06T00:00:00.000Z",
      id: "legacy-report",
      sections: [
        {
          id: "visual-hierarchy",
          issues: [
            {
              description: "The primary action blends into the layout.",
              id: "issue-1",
              recommendation: "Increase contrast around the main action.",
              severity: "high",
              title: "Primary action lacks emphasis",
            },
          ],
          score: 70,
          summary: "The main CTA does not stand out enough.",
          title: "Visual hierarchy",
        },
      ],
      summary: {
        mainFinding: "Primary action lacks emphasis.",
        nextAction: "Increase CTA contrast.",
        overallScore: 70,
        productType: "marketing page",
        strengths: ["Clear structure"],
      },
    });

    expect(parsed.context.analysisMode).toBe("ux-review");
    expect(parsed.redesignSuggestions).toEqual([]);
    expect(parsed.implementationPlan.summary).toBe("No implementation plan is available yet.");
    expect(parsed.implementationPlan.estimatedScope).toBe("medium");
    expect(parsed.sections[0]?.issues[0]).toMatchObject({
      confidence: 0.72,
      evidence: [],
      heuristics: [],
      implementationComplexity: "medium",
      triageNote: null,
      triageStatus: "open",
      triageUpdatedAt: null,
    });
  });

  it("updates issue triage without breaking the report contract", () => {
    const report = createMockAnalysisReport();
    const nextReport = updateIssueTriage(report, {
      issueId: report.sections[0]!.issues[0]!.id,
      triageNote: "CTA now matches the revised visual hierarchy.",
      triageStatus: "fixed",
    });

    expect(analysisReportSchema.parse(nextReport)).toEqual(nextReport);
    expect(nextReport.sections[0]?.issues[0]).toMatchObject({
      triageNote: "CTA now matches the revised visual hierarchy.",
      triageStatus: "fixed",
    });
    expect(nextReport.sections[0]?.issues[0]?.triageUpdatedAt).toBeTruthy();
  });
});
