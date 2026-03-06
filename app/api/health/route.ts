import { NextResponse } from "next/server";

import { getPlatformStatus } from "@/lib/platform-status";

export async function GET() {
  const status = await getPlatformStatus();
  const httpStatus = status.checks.every((check) => check.status === "ready")
    ? 200
    : 503;

  return NextResponse.json(status, { status: httpStatus });
}
