import { analysisReportContentJsonSchema } from "@/lib/analysis-schema";

const ANALYSIS_PROMPT = `
You are a senior UI/UX designer reviewing a product screenshot.

Analyze the provided UI screenshot and return structured UX feedback in these categories:
- Visual hierarchy
- Accessibility
- Interaction clarity
- Layout issues
- Redesign suggestions

Instructions:
- Be specific and practical.
- Focus on actual UI critique, not generic praise.
- Use 1 to 2 issues per section when relevant.
- Keep recommendations actionable.
- Use a 0 to 100 score for the overall summary and each section.
- Add screenshot highlight boxes for each issue when a visible region can be identified.
- Highlight coordinates must use percentages from 0 to 100 for x, y, width, and height.
- Always return a highlights array for every issue. Use an empty array if no region is clear.
- Return valid JSON matching the required schema exactly.
`.trim();

export function buildAnalysisPrompt() {
  return [
    ANALYSIS_PROMPT,
    "",
    "Return JSON for this schema:",
    JSON.stringify(analysisReportContentJsonSchema),
  ].join("\n");
}
