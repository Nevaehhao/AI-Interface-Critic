import { NextResponse } from "next/server";

import {
  deleteWorkspace,
  setWorkspaceArchived,
  updateWorkspace,
  workspaceInputSchema,
} from "@/lib/data/workspace-store";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ workspaceId: string }>;
  },
) {
  const { workspaceId } = await context.params;

  try {
    const body = (await request.json()) as {
      archived?: boolean;
      mode?: "archive" | "update";
    } & Record<string, unknown>;

    if (body.mode === "archive") {
      const workspace = await setWorkspaceArchived(workspaceId, Boolean(body.archived));
      return NextResponse.json({ workspace });
    }

    const workspace = await updateWorkspace(
      workspaceId,
      workspaceInputSchema.parse(body),
    );

    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update workspace.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ workspaceId: string }>;
  },
) {
  const { workspaceId } = await context.params;

  try {
    await deleteWorkspace(workspaceId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete workspace.",
      },
      { status: 400 },
    );
  }
}
