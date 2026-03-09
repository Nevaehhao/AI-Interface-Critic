import { describe, expect, it } from "vitest";

import {
  analysisReportContentSchema,
  createMockAnalysisReport,
} from "../lib/analysis-report";
import { normalizeOllamaAnalysisContent } from "../lib/ollama-analysis";

describe("ollama analysis normalization", () => {
  it("clamps out-of-range highlights instead of forcing a fallback run", () => {
    const report = createMockAnalysisReport({
      createdAt: "2026-03-09T00:00:00.000Z",
      id: "normalization-report",
    });

    const rawContent = {
      redesignSuggestions: report.redesignSuggestions.map((suggestion, index) =>
        index === 0
          ? {
              ...suggestion,
              actions: [suggestion.actions[0], "", 123, suggestion.actions[1]],
              id: "",
              priority: "soon",
            }
          : suggestion,
      ),
      sections: report.sections.map((section, sectionIndex) => ({
        ...section,
        id: sectionIndex === 0 ? "" : section.id,
        issues: section.issues.map((issue, issueIndex) => ({
          ...issue,
          highlights:
            sectionIndex === 0 && issueIndex === 0
              ? [
                  {
                    ...issue.highlights[0],
                    height: 30,
                    id: "",
                    label: "",
                    width: 140,
                    x: 96,
                    y: 98,
                  },
                ]
              : issue.highlights,
          severity: sectionIndex === 0 && issueIndex === 0 ? "urgent" : issue.severity,
        })),
        score: 130,
      })),
      summary: {
        ...report.summary,
        overallScore: 105,
      },
    };

    const normalized = normalizeOllamaAnalysisContent(rawContent);
    const parsed = analysisReportContentSchema.parse(normalized);
    const firstSection = parsed.sections[0];
    const firstIssue = firstSection?.issues[0];
    const firstHighlight = firstIssue?.highlights[0];
    const firstSuggestion = parsed.redesignSuggestions[0];

    expect(parsed.summary.overallScore).toBe(100);
    expect(firstSection?.id).toBe("section-1");
    expect(firstSection?.score).toBe(100);
    expect(firstIssue?.severity).toBe("medium");
    expect(firstHighlight).toMatchObject({
      height: 2,
      id: "vh-primary-action-highlight-1",
      label: "Highlighted region",
      width: 4,
      x: 96,
      y: 98,
    });
    expect(firstSuggestion).toMatchObject({
      actions: [report.redesignSuggestions[0]?.actions[0], report.redesignSuggestions[0]?.actions[1]],
      id: "redesign-1",
      priority: "next",
    });
  });
});
