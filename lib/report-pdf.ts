import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { AnalysisReport } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const PAGE_MARGIN_X = 48;
const PAGE_MARGIN_TOP = 56;
const PAGE_MARGIN_BOTTOM = 52;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;

type PdfCursor = {
  page: PDFPage;
  y: number;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const sanitized = text.replace(/\s+/g, " ").trim();

  if (!sanitized) {
    return [""];
  }

  const words = sanitized.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] ?? "";

  for (const word of words.slice(1)) {
    const candidate = `${currentLine} ${word}`;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  lines.push(currentLine);
  return lines;
}

function createPage(pdf: PDFDocument): PdfCursor {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  return {
    page,
    y: PAGE_HEIGHT - PAGE_MARGIN_TOP,
  };
}

function ensureSpace(pdf: PDFDocument, cursor: PdfCursor, requiredHeight: number) {
  if (cursor.y - requiredHeight >= PAGE_MARGIN_BOTTOM) {
    return cursor;
  }

  return createPage(pdf);
}

function drawLines({
  color = rgb(0.12, 0.12, 0.12),
  font,
  lineGap = 5,
  lines,
  pdf,
  size,
  topPadding = 0,
  cursor,
}: {
  color?: ReturnType<typeof rgb>;
  cursor: PdfCursor;
  font: PDFFont;
  lineGap?: number;
  lines: string[];
  pdf: PDFDocument;
  size: number;
  topPadding?: number;
}) {
  const lineHeight = size + lineGap;
  const neededHeight = topPadding + lines.length * lineHeight;
  const nextCursor = ensureSpace(pdf, cursor, neededHeight);
  let currentY = nextCursor.y - topPadding;

  for (const line of lines) {
    nextCursor.page.drawText(line, {
      color,
      font,
      size,
      x: PAGE_MARGIN_X,
      y: currentY - size,
    });
    currentY -= lineHeight;
  }

  nextCursor.y = currentY;
  return nextCursor;
}

function drawDivider(page: PDFPage, y: number) {
  page.drawLine({
    color: rgb(0.82, 0.85, 0.89),
    end: { x: PAGE_MARGIN_X + CONTENT_WIDTH, y },
    start: { x: PAGE_MARGIN_X, y },
    thickness: 1,
  });
}

function formatAnalysisSource(source: AnalysisSource) {
  if (source === "ollama") {
    return "Local Ollama";
  }

  if (source === "openai-compatible") {
    return "OpenAI-compatible API";
  }

  return "Mock fallback";
}

export function createAnalysisPdfFileName(report: AnalysisReport, analysisId: string) {
  const normalizedType = report.summary.productType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `ai-interface-critic-${normalizedType || "report"}-${analysisId}.pdf`;
}

export async function buildAnalysisReportPdf({
  analysisId,
  report,
  source,
}: {
  analysisId: string;
  report: AnalysisReport;
  source: AnalysisSource;
}) {
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  let cursor = createPage(pdf);

  cursor.page.drawText("AI Interface Critic", {
    color: rgb(0.1, 0.45, 0.91),
    font: boldFont,
    size: 14,
    x: PAGE_MARGIN_X,
    y: cursor.y,
  });

  cursor = drawLines({
    color: rgb(0.12, 0.12, 0.12),
    cursor,
    font: boldFont,
    lines: wrapText(
      `Structured UX critique for ${report.summary.productType}`,
      boldFont,
      24,
      CONTENT_WIDTH,
    ),
    pdf,
    size: 24,
    topPadding: 28,
  });

  cursor = drawLines({
    color: rgb(0.37, 0.39, 0.41),
    cursor,
    font: regularFont,
    lines: [
      `Analysis ID: ${analysisId}`,
      `Generated: ${new Date(report.createdAt).toLocaleString()}`,
      `Source: ${formatAnalysisSource(source)}`,
    ],
    pdf,
    size: 11,
    topPadding: 14,
  });

  drawDivider(cursor.page, cursor.y - 8);
  cursor.y -= 26;

  cursor = drawLines({
    color: rgb(0.1, 0.45, 0.91),
    cursor,
    font: boldFont,
    lines: ["Summary"],
    pdf,
    size: 15,
  });

  cursor = drawLines({
    cursor,
    font: boldFont,
    lines: [`Overall score: ${report.summary.overallScore}`],
    pdf,
    size: 18,
    topPadding: 8,
  });

  cursor = drawLines({
    color: rgb(0.12, 0.12, 0.12),
    cursor,
    font: regularFont,
    lines: wrapText(report.summary.mainFinding, regularFont, 12, CONTENT_WIDTH),
    pdf,
    size: 12,
    topPadding: 8,
  });

  cursor = drawLines({
    color: rgb(0.37, 0.39, 0.41),
    cursor,
    font: regularFont,
    lines: [`Next action: ${report.summary.nextAction}`],
    pdf,
    size: 11,
    topPadding: 12,
  });

  cursor = drawLines({
    color: rgb(0.1, 0.45, 0.91),
    cursor,
    font: boldFont,
    lines: ["Strengths"],
    pdf,
    size: 15,
    topPadding: 20,
  });

  for (const strength of report.summary.strengths) {
    cursor = drawLines({
      cursor,
      font: regularFont,
      lines: wrapText(`• ${strength}`, regularFont, 11, CONTENT_WIDTH),
      pdf,
      size: 11,
      topPadding: 8,
    });
  }

  if (report.redesignSuggestions.length > 0) {
    cursor = drawLines({
      color: rgb(0.1, 0.45, 0.91),
      cursor,
      font: boldFont,
      lines: ["Redesign suggestions"],
      pdf,
      size: 15,
      topPadding: 24,
    });

    for (const suggestion of report.redesignSuggestions) {
      cursor = drawLines({
        cursor,
        font: boldFont,
        lines: wrapText(
          `${suggestion.title} (${suggestion.priority})`,
          boldFont,
          13,
          CONTENT_WIDTH,
        ),
        pdf,
        size: 13,
        topPadding: 10,
      });

      cursor = drawLines({
        color: rgb(0.37, 0.39, 0.41),
        cursor,
        font: regularFont,
        lines: wrapText(suggestion.summary, regularFont, 11, CONTENT_WIDTH),
        pdf,
        size: 11,
        topPadding: 6,
      });

      cursor = drawLines({
        cursor,
        font: regularFont,
        lines: wrapText(`Why: ${suggestion.rationale}`, regularFont, 11, CONTENT_WIDTH),
        pdf,
        size: 11,
        topPadding: 6,
      });

      for (const action of suggestion.actions) {
        cursor = drawLines({
          color: rgb(0.37, 0.39, 0.41),
          cursor,
          font: regularFont,
          lines: wrapText(`• ${action}`, regularFont, 11, CONTENT_WIDTH - 8),
          pdf,
          size: 11,
          topPadding: 4,
        });
      }

      cursor = drawLines({
        color: rgb(0.1, 0.45, 0.91),
        cursor,
        font: regularFont,
        lines: wrapText(
          `Expected impact: ${suggestion.expectedImpact}`,
          regularFont,
          11,
          CONTENT_WIDTH,
        ),
        pdf,
        size: 11,
        topPadding: 6,
      });
    }
  }

  cursor = drawLines({
    color: rgb(0.1, 0.45, 0.91),
    cursor,
    font: boldFont,
    lines: ["Detailed sections"],
    pdf,
    size: 15,
    topPadding: 26,
  });

  for (const section of report.sections) {
    cursor = drawLines({
      cursor,
      font: boldFont,
      lines: wrapText(
        `${section.title}  Score ${section.score}`,
        boldFont,
        15,
        CONTENT_WIDTH,
      ),
      pdf,
      size: 15,
      topPadding: 12,
    });

    cursor = drawLines({
      color: rgb(0.37, 0.39, 0.41),
      cursor,
      font: regularFont,
      lines: wrapText(section.summary, regularFont, 11, CONTENT_WIDTH),
      pdf,
      size: 11,
      topPadding: 6,
    });

    for (const issue of section.issues) {
      cursor = drawLines({
        cursor,
        font: boldFont,
        lines: wrapText(
          `${issue.title} (${issue.severity})`,
          boldFont,
          12,
          CONTENT_WIDTH,
        ),
        pdf,
        size: 12,
        topPadding: 10,
      });

      cursor = drawLines({
        color: rgb(0.37, 0.39, 0.41),
        cursor,
        font: regularFont,
        lines: wrapText(issue.description, regularFont, 11, CONTENT_WIDTH),
        pdf,
        size: 11,
        topPadding: 4,
      });

      cursor = drawLines({
        cursor,
        font: regularFont,
        lines: wrapText(
          `Recommendation: ${issue.recommendation}`,
          regularFont,
          11,
          CONTENT_WIDTH,
        ),
        pdf,
        size: 11,
        topPadding: 5,
      });
    }
  }

  const pageCount = pdf.getPages().length;

  pdf.getPages().forEach((page, index) => {
    page.drawText(`${index + 1} / ${pageCount}`, {
      color: rgb(0.45, 0.47, 0.49),
      font: regularFont,
      size: 10,
      x: PAGE_WIDTH - PAGE_MARGIN_X - 28,
      y: 20,
    });
  });

  return pdf.save();
}
