import { ZodError } from "zod";

import {
  analysisReportContentSchema,
  createAnalysisReport,
  type AnalysisReport,
} from "@/lib/analysis-report";

export const analysisReportContentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "sections", "redesignSuggestions", "implementationPlan"],
  properties: {
    implementationPlan: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "frontendChanges",
        "backendChanges",
        "filesToInspect",
        "acceptanceCriteria",
        "risks",
      ],
      properties: {
        summary: { type: "string" },
        frontendChanges: {
          type: "array",
          items: { type: "string" },
        },
        backendChanges: {
          type: "array",
          items: { type: "string" },
        },
        filesToInspect: {
          type: "array",
          items: { type: "string" },
        },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
        },
        risks: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "overallScore",
        "productType",
        "mainFinding",
        "strengths",
        "nextAction",
      ],
      properties: {
        overallScore: { type: "number" },
        productType: { type: "string" },
        mainFinding: { type: "string" },
        strengths: {
          type: "array",
          minItems: 1,
          items: { type: "string" },
        },
        nextAction: { type: "string" },
      },
    },
    sections: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "summary", "score", "issues"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          score: { type: "number" },
          issues: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "title",
                "description",
                "recommendation",
                "severity",
                "highlights",
              ],
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
                highlights: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "x", "y", "width", "height", "label"],
                    properties: {
                      id: { type: "string" },
                      x: { type: "number" },
                      y: { type: "number" },
                      width: { type: "number" },
                      height: { type: "number" },
                      label: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    redesignSuggestions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "summary",
          "rationale",
          "priority",
          "actions",
          "expectedImpact",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          rationale: { type: "string" },
          priority: {
            type: "string",
            enum: ["now", "next", "later"],
          },
          actions: {
            type: "array",
            minItems: 2,
            items: { type: "string" },
          },
          expectedImpact: { type: "string" },
        },
      },
    },
  },
} as const;

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeScore(value: unknown) {
  const numericValue = toFiniteNumber(value);
  return numericValue === null ? value : clamp(numericValue, 0, 100);
}

function normalizeSeverity(value: unknown) {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function normalizeHighlight(
  value: unknown,
  issueId: string,
  highlightIndex: number,
) {
  if (!isJsonRecord(value)) {
    return null;
  }

  const x = clamp(toFiniteNumber(value.x) ?? 0, 0, 99);
  const y = clamp(toFiniteNumber(value.y) ?? 0, 0, 99);
  const maxWidth = Math.max(1, 100 - x);
  const maxHeight = Math.max(1, 100 - y);

  return {
    height: clamp(toFiniteNumber(value.height) ?? maxHeight, 1, maxHeight),
    id: normalizeString(value.id, `${issueId}-highlight-${highlightIndex + 1}`),
    label: normalizeString(value.label, "Highlighted region"),
    width: clamp(toFiniteNumber(value.width) ?? maxWidth, 1, maxWidth),
    x,
    y,
  };
}

function normalizeHighlights(value: unknown, issueId: string) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((highlight, index) => normalizeHighlight(highlight, issueId, index))
    .filter((highlight) => highlight !== null);
}

function normalizeIssue(value: unknown, sectionId: string, issueIndex: number) {
  if (!isJsonRecord(value)) {
    return value;
  }

  const issueId = normalizeString(value.id, `${sectionId}-issue-${issueIndex + 1}`);

  return {
    ...value,
    highlights: normalizeHighlights(value.highlights, issueId),
    id: issueId,
    severity: normalizeSeverity(value.severity),
  };
}

function normalizeSection(value: unknown, sectionIndex: number) {
  if (!isJsonRecord(value)) {
    return value;
  }

  const sectionId = normalizeString(value.id, `section-${sectionIndex + 1}`);

  return {
    ...value,
    id: sectionId,
    issues: Array.isArray(value.issues)
      ? value.issues.map((issue, issueIndex) =>
          normalizeIssue(issue, sectionId, issueIndex),
        )
      : value.issues,
    score: normalizeScore(value.score),
  };
}

function normalizeSummary(value: unknown) {
  if (!isJsonRecord(value)) {
    return value;
  }

  return {
    ...value,
    overallScore: normalizeScore(value.overallScore),
  };
}

function normalizeRedesignSuggestion(value: unknown, suggestionIndex: number) {
  if (!isJsonRecord(value)) {
    return value;
  }

  const actions = Array.isArray(value.actions)
    ? value.actions.filter(
        (action): action is string =>
          typeof action === "string" && action.trim().length > 0,
      )
    : value.actions;

  return {
    ...value,
    actions,
    id: normalizeString(value.id, `redesign-${suggestionIndex + 1}`),
    priority:
      value.priority === "now" || value.priority === "next" || value.priority === "later"
        ? value.priority
        : "next",
  };
}

export function normalizeAnalysisContent(value: unknown) {
  if (!isJsonRecord(value)) {
    return value;
  }

  return {
    ...value,
    implementationPlan: isJsonRecord(value.implementationPlan)
      ? {
          ...value.implementationPlan,
          acceptanceCriteria: Array.isArray(value.implementationPlan.acceptanceCriteria)
            ? value.implementationPlan.acceptanceCriteria.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : value.implementationPlan.acceptanceCriteria,
          backendChanges: Array.isArray(value.implementationPlan.backendChanges)
            ? value.implementationPlan.backendChanges.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : value.implementationPlan.backendChanges,
          filesToInspect: Array.isArray(value.implementationPlan.filesToInspect)
            ? value.implementationPlan.filesToInspect.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : value.implementationPlan.filesToInspect,
          frontendChanges: Array.isArray(value.implementationPlan.frontendChanges)
            ? value.implementationPlan.frontendChanges.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : value.implementationPlan.frontendChanges,
          risks: Array.isArray(value.implementationPlan.risks)
            ? value.implementationPlan.risks.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : value.implementationPlan.risks,
        }
      : value.implementationPlan,
    redesignSuggestions: Array.isArray(value.redesignSuggestions)
      ? value.redesignSuggestions.map((suggestion, suggestionIndex) =>
          normalizeRedesignSuggestion(suggestion, suggestionIndex),
        )
      : value.redesignSuggestions,
    sections: Array.isArray(value.sections)
      ? value.sections.map((section, sectionIndex) =>
          normalizeSection(section, sectionIndex),
        )
      : value.sections,
    summary: normalizeSummary(value.summary),
  };
}

function summarizeValidationError(error: ZodError) {
  const issuePaths = error.issues.map((issue) => issue.path.join("."));

  if (issuePaths.some((path) => path.includes("highlights"))) {
    return new Error("The model returned invalid screenshot highlight data.");
  }

  if (issuePaths.some((path) => path.endsWith("overallScore") || path.endsWith("score"))) {
    return new Error("The model returned invalid score values.");
  }

  return new Error("The model returned an invalid analysis structure.");
}

export function parseStructuredAnalysisContent(
  content: string,
  options?: {
    context?: AnalysisReport["context"];
  },
): AnalysisReport {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(content);
  } catch {
    throw new Error("The model returned invalid JSON.");
  }

  const normalizedContent = normalizeAnalysisContent(parsedContent);
  const validationResult = analysisReportContentSchema.safeParse(normalizedContent);

  if (!validationResult.success) {
    throw summarizeValidationError(validationResult.error);
  }

  return createAnalysisReport(validationResult.data, {
    context: options?.context,
  });
}
