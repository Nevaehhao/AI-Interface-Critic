import { NextRequest, NextResponse } from "next/server";

import { getStoredScreenshotKeyForSharedToken } from "@/lib/data/analysis-store";
import { getScreenshotFromLocalStorage } from "@/lib/storage/local";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<unknown>;
  },
) {
  const { shareToken } = (await params) as { shareToken: string };
  const screenshotKey = await getStoredScreenshotKeyForSharedToken(shareToken);

  if (!screenshotKey) {
    return NextResponse.json({ error: "Screenshot not found." }, { status: 404 });
  }

  const object = await getScreenshotFromLocalStorage(screenshotKey);

  if (!object?.body) {
    return NextResponse.json(
      { error: "Screenshot file was not found on local storage." },
      { status: 404 },
    );
  }

  const headers = new Headers({
    "Cache-Control": "public, max-age=3600",
    "Content-Type": object.contentType ?? "application/octet-stream",
  });

  if (object.contentLength) {
    headers.set("Content-Length", String(object.contentLength));
  }

  if (object.etag) {
    headers.set("ETag", object.etag);
  }

  return new NextResponse(object.body, { headers });
}
