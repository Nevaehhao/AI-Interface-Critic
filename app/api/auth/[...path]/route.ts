import { authApiHandler } from "@neondatabase/auth/next/server";
import { NextRequest, NextResponse } from "next/server";

const methods = authApiHandler;

async function handleAuthRequest(
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
  request: NextRequest,
  context: {
    params: Promise<unknown>;
  },
) {
  if (!process.env.NEON_AUTH_BASE_URL) {
    return NextResponse.json(
      { error: "Neon Auth is not configured." },
      { status: 503 },
    );
  }

  return methods()[method](request, context as { params: Promise<{ path: string[] }> });
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<unknown>;
  },
) {
  return handleAuthRequest("GET", request, context);
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<unknown>;
  },
) {
  return handleAuthRequest("POST", request, context);
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<unknown>;
  },
) {
  return handleAuthRequest("PUT", request, context);
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<unknown>;
  },
) {
  return handleAuthRequest("PATCH", request, context);
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<unknown>;
  },
) {
  return handleAuthRequest("DELETE", request, context);
}
