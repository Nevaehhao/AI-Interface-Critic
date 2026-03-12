import type { Browser } from "playwright";

import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/uploads";

export type CapturedPageScreenshot = {
  dataUrl: string;
  file: File;
  finalUrl: string;
  pageTitle: string | null;
};

function buildScreenshotFileName(pageUrl: string) {
  const { hostname, pathname } = new URL(pageUrl);
  const normalizedPath = pathname
    .replace(/\/+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  return `${hostname}${normalizedPath ? `-${normalizedPath}` : ""}.png`;
}

export async function capturePageScreenshot(
  pageUrl: string,
): Promise<CapturedPageScreenshot> {
  let browser: Browser | undefined;

  try {
    const { chromium } = await import("playwright");

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      viewport: {
        height: 1080,
        width: 1440,
      },
    });

    await page.goto(pageUrl, {
      timeout: 45_000,
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(500);

    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: "png",
    });

    if (screenshotBuffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(
        "The captured screenshot is too large. Try a narrower page or upload a manual screenshot instead.",
      );
    }

    const finalUrl = page.url();
    const title = (await page.title()).trim();
    const file = new File([new Uint8Array(screenshotBuffer)], buildScreenshotFileName(finalUrl), {
      type: "image/png",
    });

    return {
      dataUrl: `data:image/png;base64,${screenshotBuffer.toString("base64")}`,
      file,
      finalUrl,
      pageTitle: title.length > 0 ? title : null,
    };
  } catch (error) {
    if (error instanceof Error && /Executable doesn't exist|browserType\.launch/.test(error.message)) {
      throw new Error(
        "Playwright is installed but Chromium is missing. Run `npx playwright install chromium` and try again.",
      );
    }

    if (error instanceof Error && /Cannot find package 'playwright'/.test(error.message)) {
      throw new Error(
        "Playwright is not installed. Run `npm install playwright` and `npx playwright install chromium` to enable URL capture.",
      );
    }

    throw error;
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
