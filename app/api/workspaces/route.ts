import { NextResponse } from "next/server";

import {
  createWorkspace,
  listWorkspaces,
  workspaceInputSchema,
} from "@/lib/data/workspace-store";

export async function GET() {
  const { user, workspaces } = await listWorkspaces();

  return NextResponse.json({
    signedIn: Boolean(user),
    workspaces,
  });
}

export async function POST(request: Request) {
  try {
    const body = workspaceInputSchema.parse(await request.json());
    const workspace = await createWorkspace(body);

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create workspace.",
      },
      { status: 400 },
    );
  }
}
