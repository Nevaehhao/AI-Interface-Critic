import { z } from "zod";

export const analysisIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
  severity: z.enum(["low", "medium", "high"]),
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

export const analysisReportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  summary: analysisSummarySchema,
  sections: z.array(analysisSectionSchema).min(1),
});

export type AnalysisIssue = z.infer<typeof analysisIssueSchema>;
export type AnalysisSection = z.infer<typeof analysisSectionSchema>;
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>;
export type AnalysisReport = z.infer<typeof analysisReportSchema>;

export const mockAnalysisReport: AnalysisReport = analysisReportSchema.parse({
  id: "demo",
  createdAt: "2026-03-06T11:00:00.000Z",
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
          recommendation:
            "Increase CTA contrast, simplify nearby supporting UI, and create more separation around the key action.",
          severity: "high",
        },
        {
          id: "vh-equal-weight",
          title: "Secondary content carries similar emphasis",
          description:
            "Multiple blocks share similar scale and color intensity, reducing the sense of a clear entry point.",
          recommendation:
            "Introduce a stronger type scale and reserve brighter treatments for the most important content.",
          severity: "medium",
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
            "Subdued labels match the visual style, but some text appears at risk of insufficient contrast on darker surfaces.",
          recommendation:
            "Raise contrast on supporting copy and validate critical text against WCAG contrast ratios.",
          severity: "high",
        },
        {
          id: "a11y-small-meta",
          title: "Metadata text is compact for scan-heavy use",
          description:
            "Small uppercase labels look polished, but they can become hard to read when stacked repeatedly.",
          recommendation:
            "Increase font size or reduce frequency of dense uppercase microcopy in key areas.",
          severity: "low",
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
          recommendation:
            "Pair the main action with clearer helper text or stronger positional emphasis.",
          severity: "medium",
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
          recommendation:
            "Add more vertical spacing between stacked regions and reduce repeated border treatments where possible.",
          severity: "medium",
        },
      ],
    },
  ],
});
