import {
  getAnalysisModeLabel,
  type AnalysisContext,
} from "@/lib/analysis-context";
import { analysisReportContentJsonSchema } from "@/lib/analysis-schema";

const ANALYSIS_PROMPT = `
You are a senior UI/UX designer and pragmatic full-stack engineer reviewing a product screenshot.

Analyze the provided UI screenshot and return structured UX feedback in these categories:
- Visual hierarchy
- Accessibility
- Interaction clarity
- Layout issues
- Redesign suggestions
- Implementation plan

Instructions:
- Write like a principal product designer who can hand work to engineering.
- Be specific and practical.
- Focus on actual UI critique, not generic praise.
- Use 1 to 2 issues per section when relevant.
- Keep recommendations actionable.
- Use a 0 to 100 score for the overall summary and each section.
- Add screenshot highlight boxes for each issue when a visible region can be identified.
- Highlight coordinates must use percentages from 0 to 100 for x, y, width, and height.
- Always return a highlights array for every issue. Use an empty array if no region is clear.
- The implementation plan must separate front-end work, back-end work, files to inspect, acceptance criteria, and risks.
- If the repo URL, page URL, goal, or stack are provided, use them to make the plan more concrete.
- Return valid JSON matching the required schema exactly.
`.trim();

export function buildAnalysisPrompt(context?: AnalysisContext) {
  const contextLines = [
    `Review mode: ${getAnalysisModeLabel(context?.analysisMode ?? "ux-review")}`,
    context?.pageUrl ? `Live page URL: ${context.pageUrl}` : null,
    context?.repoUrl ? `Repository URL: ${context.repoUrl}` : null,
    context?.productGoal ? `Product goal: ${context.productGoal}` : null,
    context?.targetAudience ? `Target audience: ${context.targetAudience}` : null,
    context?.techStack ? `Tech stack: ${context.techStack}` : null,
    context?.notes ? `Extra notes: ${context.notes}` : null,
  ].filter((line): line is string => Boolean(line));

  return [
    ANALYSIS_PROMPT,
    "",
    "Context:",
    ...contextLines,
    "",
    "Return JSON for this schema:",
    JSON.stringify(analysisReportContentJsonSchema),
  ].join("\n");
}
