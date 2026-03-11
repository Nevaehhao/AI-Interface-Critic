import { z } from "zod";

export const ANALYSIS_MODE_VALUES = [
  "ux-review",
  "accessibility-audit",
  "conversion-review",
  "design-system-review",
  "implementation-handoff",
] as const;

export type AnalysisMode = (typeof ANALYSIS_MODE_VALUES)[number];

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

const optionalStringField = (maxLength: number) =>
  z.preprocess(
    normalizeOptionalString,
    z.string().max(maxLength).nullable().default(null),
  );

const optionalUrlField = z.preprocess(
  normalizeOptionalString,
  z.string().url().nullable().default(null),
);

export const analysisContextSchema = z.object({
  analysisMode: z.enum(ANALYSIS_MODE_VALUES).default("ux-review"),
  notes: optionalStringField(600),
  pageUrl: optionalUrlField,
  productGoal: optionalStringField(240),
  repoUrl: optionalUrlField,
  targetAudience: optionalStringField(240),
  techStack: optionalStringField(240),
});

export type AnalysisContext = z.infer<typeof analysisContextSchema>;

export function createDefaultAnalysisContext(): AnalysisContext {
  return analysisContextSchema.parse({});
}

export function getAnalysisModeLabel(mode: AnalysisMode) {
  switch (mode) {
    case "accessibility-audit":
      return "Accessibility audit";
    case "conversion-review":
      return "Conversion review";
    case "design-system-review":
      return "Design system review";
    case "implementation-handoff":
      return "Implementation handoff";
    default:
      return "UX review";
  }
}

export function parseAnalysisContextFromFormData(formData: FormData) {
  return analysisContextSchema.parse({
    analysisMode: formData.get("analysisMode"),
    notes: formData.get("notes"),
    pageUrl: formData.get("pageUrl"),
    productGoal: formData.get("productGoal"),
    repoUrl: formData.get("repoUrl"),
    targetAudience: formData.get("targetAudience"),
    techStack: formData.get("techStack"),
  });
}
