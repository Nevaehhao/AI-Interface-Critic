import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  checkLocalScreenshotStorage,
  getScreenshotFromLocalStorage,
  writeScreenshotToLocalStorage,
} from "../lib/storage/local";

const ORIGINAL_STORAGE_DIR = process.env.LOCAL_SCREENSHOT_STORAGE_DIR;
const tempDirs: string[] = [];

afterEach(async () => {
  process.env.LOCAL_SCREENSHOT_STORAGE_DIR = ORIGINAL_STORAGE_DIR;

  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop();

    if (tempDir) {
      await rm(tempDir, { force: true, recursive: true });
    }
  }
});

describe("local screenshot storage", () => {
  it("writes and reads screenshots from the configured local directory", async () => {
    const storageDir = await mkdtemp(path.join(os.tmpdir(), "ai-critic-storage-"));
    tempDirs.push(storageDir);
    process.env.LOCAL_SCREENSHOT_STORAGE_DIR = storageDir;

    await writeScreenshotToLocalStorage({
      body: Buffer.from("png-data"),
      key: "user-1/example-screen.png",
    });

    const object = await getScreenshotFromLocalStorage("user-1/example-screen.png");

    expect(object?.contentType).toBe("image/png");
    expect(object?.contentLength).toBe(8);
    expect(Buffer.from(object?.body ?? [])).toEqual(Buffer.from("png-data"));
  });

  it("reports the local storage directory as ready", async () => {
    const storageDir = await mkdtemp(path.join(os.tmpdir(), "ai-critic-storage-"));
    tempDirs.push(storageDir);
    process.env.LOCAL_SCREENSHOT_STORAGE_DIR = storageDir;

    const result = await checkLocalScreenshotStorage();

    expect(result.status).toBe("ready");
    expect(result.detail).toContain(storageDir);
  });
});
