import { NextResponse } from "next/server";
import { z } from "zod";

import { getClientEnv } from "@/lib/env";
import { setAnalysisShareEnabled } from "@/lib/data/analysis-store";

const shareSchema = z.object({
  enabled: z.boolean().default(true),
});

export async function POST(
  request: Request,
  context: {
    params: Promise<{ analysisId: string }>;
  },
) {
  const { analysisId } = await context.params;

  try {
    const body = shareSchema.parse(await request.json().catch(() => ({})));
    const sharedRecord = await setAnalysisShareEnabled(analysisId, body.enabled);
    const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";

    return NextResponse.json({
      shareEnabled: sharedRecord.shareEnabled,
      shareToken: sharedRecord.shareToken,
      shareUrl:
        sharedRecord.shareEnabled && sharedRecord.shareToken
          ? `${appUrl}/share/${sharedRecord.shareToken}`
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update report sharing.",
      },
      { status: 400 },
    );
  }
}
