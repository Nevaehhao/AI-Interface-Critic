import { z } from "zod";

import {
  analysisContextSchema,
  createDefaultAnalysisContext,
  type AnalysisContext,
} from "@/lib/analysis-context";

export const analysisIssueHighlightSchema = z.object({
  id: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  label: z.string(),
});

export const analysisIssueSchema = z.object({
  confidence: z.number().min(0).max(1).default(0.72),
  id: z.string(),
  title: z.string(),
  description: z.string(),
  evidence: z.array(z.string()).default([]),
  heuristics: z.array(z.string()).default([]),
  implementationComplexity: z
    .enum(["small", "medium", "large"])
    .default("medium"),
  recommendation: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  triageNote: z.string().trim().max(400).nullable().default(null),
  triageStatus: z
    .enum(["open", "fixed", "ignored", "revisit"])
    .default("open"),
  triageUpdatedAt: z.string().nullable().default(null),
  highlights: z.array(analysisIssueHighlightSchema).default([]),
});

export const analysisSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  score: z.number().min(0).max(100),
  issues: z.array(analysisIssueSchema).min(1),
});

export const analysisSummarySchema = z.object({
  overallScore: z.number().min(0).max(100),
  productType: z.string(),
  mainFinding: z.string(),
  strengths: z.array(z.string()).min(1),
  nextAction: z.string(),
});

export const analysisRedesignSuggestionSchema = z.object({
  id: z.string(),
  implementationComplexity: z
    .enum(["small", "medium", "large"])
    .default("medium"),
  title: z.string(),
  summary: z.string(),
  rationale: z.string(),
  priority: z.enum(["now", "next", "later"]),
  actions: z.array(z.string()).min(2),
  expectedImpact: z.string(),
});

export const analysisImplementationPlanSchema = z.object({
  acceptanceCriteria: z.array(z.string()).default([]),
  backendChanges: z.array(z.string()).default([]),
  estimatedScope: z.enum(["small", "medium", "large"]).default("medium"),
  filesToInspect: z.array(z.string()).default([]),
  frontendChanges: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  summary: z.string(),
});

export const emptyImplementationPlan = analysisImplementationPlanSchema.parse({
  acceptanceCriteria: [],
  backendChanges: [],
  estimatedScope: "medium",
  filesToInspect: [],
  frontendChanges: [],
  risks: [],
  summary: "No implementation plan is available yet.",
});

export const analysisReportContentSchema = z.object({
  implementationPlan: analysisImplementationPlanSchema.default(emptyImplementationPlan),
  summary: analysisSummarySchema,
  sections: z.array(analysisSectionSchema).min(1),
  redesignSuggestions: z.array(analysisRedesignSuggestionSchema).default([]),
});

export const analysisReportSchema = z.object({
  context: analysisContextSchema.default(createDefaultAnalysisContext()),
  id: z.string(),
  createdAt: z.string(),
  implementationPlan: analysisReportContentSchema.shape.implementationPlan,
  summary: analysisReportContentSchema.shape.summary,
  sections: analysisReportContentSchema.shape.sections,
  redesignSuggestions: analysisReportContentSchema.shape.redesignSuggestions,
});

export type AnalysisIssue = z.infer<typeof analysisIssueSchema>;
export type AnalysisIssueHighlight = z.infer<typeof analysisIssueHighlightSchema>;
export type AnalysisSection = z.infer<typeof analysisSectionSchema>;
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>;
export type AnalysisRedesignSuggestion = z.infer<typeof analysisRedesignSuggestionSchema>;
export type AnalysisImplementationPlan = z.infer<typeof analysisImplementationPlanSchema>;
export type AnalysisReportContent = z.infer<typeof analysisReportContentSchema>;
export type AnalysisReport = z.infer<typeof analysisReportSchema>;

export function createAnalysisReport(
  content: AnalysisReportContent,
  overrides?: Partial<Pick<AnalysisReport, "id" | "createdAt" | "context">>,
) {
  return analysisReportSchema.parse({
    context: overrides?.context ?? createDefaultAnalysisContext(),
    id: overrides?.id ?? crypto.randomUUID(),
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    ...content,
  });
}

export function createMockAnalysisReport(
  overrides?: Partial<AnalysisReport>,
): AnalysisReport {
  const baseContent = analysisReportContentSchema.parse({
    summary: {
      overallScore: 78,
      productType: "marketing landing page",
      mainFinding:
        "The primary call-to-action loses emphasis because nearby elements compete for the same visual weight.",
      strengths: [
        "The page uses clear section grouping and generous spacing.",
        "Headlines are concise and easy to scan.",
        "The overall palette feels focused and modern.",
      ],
      nextAction:
        "Increase CTA contrast and reduce the visual intensity of neighboring secondary elements.",
    },
    sections: [
      {
        id: "visual-hierarchy",
        title: "Visual hierarchy",
        summary:
          "The page introduces information in a sensible order, but the main action is not visually dominant enough.",
        score: 74,
        issues: [
          {
            id: "vh-primary-action",
            title: "Primary action is not visually dominant",
            description:
              "The main CTA competes with surrounding labels and supporting elements, making first-scan prioritization slower.",
            evidence: [
              "The CTA shares similar fill intensity with nearby elements.",
              "The surrounding cluster reduces the first-scan entry point.",
            ],
            heuristics: ["Visual hierarchy", "Primary action clarity"],
            implementationComplexity: "small",
            recommendation:
              "Increase CTA contrast, simplify nearby supporting UI, and create more separation around the key action.",
            confidence: 0.88,
            severity: "high",
            highlights: [
              {
                id: "vh-primary-action-cta",
                x: 56,
                y: 61,
                width: 24,
                height: 11,
                label: "Primary CTA",
              },
            ],
          },
          {
            id: "vh-equal-weight",
            title: "Secondary content carries similar emphasis",
            description:
              "Multiple blocks share similar scale and color intensity, reducing the sense of a clear entry point.",
            evidence: [
              "Cards and callouts are visually weighted too closely.",
            ],
            heuristics: ["Progressive disclosure", "Reading rhythm"],
            implementationComplexity: "medium",
            recommendation:
              "Introduce a stronger type scale and reserve brighter treatments for the most important content.",
            confidence: 0.72,
            severity: "medium",
            highlights: [
              {
                id: "vh-equal-weight-supporting-card",
                x: 18,
                y: 48,
                width: 28,
                height: 16,
                label: "Secondary card cluster",
              },
            ],
          },
        ],
      },
      {
        id: "accessibility",
        title: "Accessibility",
        summary:
          "The interface is close to usable, but muted text and small labels may reduce readability for some users.",
        score: 76,
        issues: [
          {
            id: "a11y-muted-copy",
            title: "Muted supporting text may be too low contrast",
            description:
              "Subdued labels match the visual style, but some text appears at risk of insufficient contrast against low-emphasis surfaces.",
            evidence: [
              "Muted supporting labels sit on low-contrast backgrounds.",
            ],
            heuristics: ["WCAG contrast", "Text readability"],
            implementationComplexity: "small",
            recommendation:
              "Raise contrast on supporting copy and validate critical text against WCAG contrast ratios.",
            confidence: 0.82,
            severity: "high",
            highlights: [
              {
                id: "a11y-muted-copy-supporting-text",
                x: 16,
                y: 28,
                width: 36,
                height: 12,
                label: "Muted supporting copy",
              },
            ],
          },
          {
            id: "a11y-small-meta",
            title: "Metadata text is compact for scan-heavy use",
            description:
              "Small uppercase labels look polished, but they can become hard to read when stacked repeatedly.",
            evidence: [
              "Repeated compact labels increase scan effort.",
            ],
            heuristics: ["Legibility", "Scan efficiency"],
            implementationComplexity: "small",
            recommendation:
              "Increase font size or reduce frequency of dense uppercase microcopy in key areas.",
            confidence: 0.69,
            severity: "low",
            highlights: [
              {
                id: "a11y-small-meta-labels",
                x: 15,
                y: 12,
                width: 24,
                height: 8,
                label: "Compact labels",
              },
            ],
          },
        ],
      },
      {
        id: "interaction-clarity",
        title: "Interaction clarity",
        summary:
          "The UI signals available actions, but the most important next step could be made more explicit.",
        score: 79,
        issues: [
          {
            id: "interaction-cta-priority",
            title: "Preferred next action is not explicit enough",
            description:
              "Users can identify likely actions, but the interface does not strongly indicate the intended progression path.",
            evidence: [
              "The main next step is not sufficiently differentiated from supporting actions.",
            ],
            heuristics: ["Interaction clarity", "Next-step affordance"],
            implementationComplexity: "medium",
            recommendation:
              "Pair the main action with clearer helper text or stronger positional emphasis.",
            confidence: 0.76,
            severity: "medium",
            highlights: [
              {
                id: "interaction-cta-priority-actions",
                x: 52,
                y: 57,
                width: 31,
                height: 17,
                label: "Competing actions",
              },
            ],
          },
        ],
      },
      {
        id: "layout-issues",
        title: "Layout issues",
        summary:
          "Spacing and alignment are mostly clean, though some dense groupings compress visual breathing room.",
        score: 82,
        issues: [
          {
            id: "layout-density",
            title: "Some sections feel visually dense",
            description:
              "Clusters of cards and labels sit close together, which can reduce clarity when scanning quickly.",
            evidence: [
              "Multiple surface treatments and tight stacks compete for attention.",
            ],
            heuristics: ["Spacing rhythm", "Content grouping"],
            implementationComplexity: "medium",
            recommendation:
              "Add more vertical spacing between stacked regions and reduce repeated border treatments where possible.",
            confidence: 0.74,
            severity: "medium",
            highlights: [
              {
                id: "layout-density-cluster",
                x: 14,
                y: 44,
                width: 72,
                height: 28,
                label: "Dense content cluster",
              },
            ],
          },
        ],
      },
    ],
    redesignSuggestions: [
      {
        id: "redesign-cta-stack",
        title: "Restructure the primary action stack",
        summary:
          "Make one action visually dominant and reduce the emphasis of nearby supporting elements.",
        rationale:
          "The current layout asks users to compare equally weighted options before they understand which action matters most.",
        implementationComplexity: "small",
        priority: "now",
        actions: [
          "Promote the primary CTA with stronger color contrast and more whitespace.",
          "Demote secondary actions to tonal or text treatments instead of matching fill intensity.",
          "Move supporting badges and helper text away from the CTA cluster.",
        ],
        expectedImpact:
          "Users should identify the intended next step faster during first scan.",
      },
      {
        id: "redesign-reading-rhythm",
        title: "Improve reading rhythm with stronger type hierarchy",
        summary:
          "Create clearer separation between headline, metadata, and support copy.",
        rationale:
          "Several text blocks currently feel similar in scale and contrast, which weakens scan order and increases effort.",
        implementationComplexity: "medium",
        priority: "next",
        actions: [
          "Increase contrast for critical labels and body copy.",
          "Reserve uppercase microcopy for a smaller number of orientation moments.",
          "Expand spacing between summary text and dense content clusters.",
        ],
        expectedImpact:
          "The interface should feel easier to scan and more accessible for repeated review.",
      },
      {
        id: "redesign-section-density",
        title: "Reduce density in repeated card groups",
        summary:
          "Introduce more vertical spacing and simplify repeated surfaces so the layout can breathe.",
        rationale:
          "Dense stacks of cards and chips create unnecessary visual competition, especially when multiple sections are reviewed quickly.",
        implementationComplexity: "medium",
        priority: "later",
        actions: [
          "Increase vertical spacing between grouped sections.",
          "Collapse repeated borders or chip treatments that do not add meaning.",
          "Use one container rhythm consistently instead of mixing equally strong surfaces.",
        ],
        expectedImpact:
          "The interface should feel calmer and better organized without losing content depth.",
      },
    ],
    implementationPlan: {
      acceptanceCriteria: [
        "The primary CTA is the strongest visual action above the fold.",
        "Supporting copy meets contrast targets without losing the visual style.",
        "Secondary actions no longer compete with the main path.",
      ],
      backendChanges: [
        "No backend change is required unless CTA experiments are tied to analytics events.",
      ],
      estimatedScope: "medium",
      filesToInspect: [
        "Landing page hero component",
        "Shared button styles or CTA design tokens",
        "Section spacing and typography utilities",
      ],
      frontendChanges: [
        "Increase contrast and spacing around the primary CTA.",
        "Reduce emphasis on neighboring secondary actions.",
        "Tighten the typography scale so headline, support copy, and metadata are easier to scan.",
      ],
      risks: [
        "Over-correcting contrast or spacing could disrupt the brand tone.",
        "If CTA variants are scattered across the codebase, style drift may persist after the first fix.",
      ],
      summary:
        "Start with the CTA stack and supporting typography. The highest-value implementation work is front-end only and should be validated with a quick first-scan usability check after the visual changes land.",
    },
  });

  const baseReport = createAnalysisReport(baseContent, {
    createdAt: "2026-03-06T11:00:00.000Z",
    context: createDefaultAnalysisContext(),
    id: "demo",
  });

  return analysisReportSchema.parse({
    ...baseReport,
    ...overrides,
  });
}

export const mockAnalysisReport: AnalysisReport = createMockAnalysisReport();

export function updateIssueTriage(
  report: AnalysisReport,
  input: {
    issueId: string;
    triageNote: string | null;
    triageStatus: AnalysisIssue["triageStatus"];
  },
) {
  const nextUpdatedAt = new Date().toISOString();

  return analysisReportSchema.parse({
    ...report,
    sections: report.sections.map((section) => ({
      ...section,
      issues: section.issues.map((issue) =>
        issue.id === input.issueId
          ? {
              ...issue,
              triageNote: input.triageNote,
              triageStatus: input.triageStatus,
              triageUpdatedAt: nextUpdatedAt,
            }
          : issue,
      ),
    })),
  });
}
