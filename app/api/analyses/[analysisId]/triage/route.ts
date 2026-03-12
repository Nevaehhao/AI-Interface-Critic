import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getPersistedAnalysisById,
  updatePersistedAnalysisReport,
} from "@/lib/data/analysis-store";
import { updateIssueTriage } from "@/lib/analysis-report";

const triageSchema = z.object({
  issueId: z.string().min(1),
  triageNote: z.string().trim().max(400).nullable().optional(),
  triageStatus: z.enum(["open", "fixed", "ignored", "revisit"]),
});

export async function POST(
  request: Request,
  context: {
    params: Promise<{ analysisId: string }>;
  },
) {
  const { analysisId } = await context.params;

  try {
    const body = triageSchema.parse(await request.json());
    const persistedAnalysis = await getPersistedAnalysisById(analysisId);

    if (!persistedAnalysis) {
      return NextResponse.json(
        {
          error: "This report is not available for server-side triage updates.",
        },
        { status: 404 },
      );
    }

    const nextReport = updateIssueTriage(persistedAnalysis.report, {
      issueId: body.issueId,
      triageNote: body.triageNote ?? null,
      triageStatus: body.triageStatus,
    });
    const updatedRecord = await updatePersistedAnalysisReport(analysisId, nextReport);

    return NextResponse.json({
      report: updatedRecord.report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update issue triage.",
      },
      { status: 400 },
    );
  }
}
