import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { getServerEnv } from "@/lib/env";

const DEFAULT_SCREENSHOT_STORAGE_DIR = ".data/screenshots";

function sanitizePathSegment(segment: string) {
  const sanitized = segment.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized.length > 0 && sanitized !== "." && sanitized !== ".."
    ? sanitized
    : "file";
}

function getLocalStorageRoot() {
  const storageDir =
    getServerEnv().LOCAL_SCREENSHOT_STORAGE_DIR ?? DEFAULT_SCREENSHOT_STORAGE_DIR;
  return path.resolve(process.cwd(), storageDir);
}

function getLocalStoragePath(key: string) {
  const safePath = key
    .split("/")
    .filter(Boolean)
    .map((segment) => sanitizePathSegment(segment))
    .join(path.sep);

  return path.join(getLocalStorageRoot(), safePath);
}

function contentTypeFromKey(key: string) {
  const extension = path.extname(key).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  if (extension === ".avif") {
    return "image/avif";
  }

  return "application/octet-stream";
}

async function ensureLocalStorageRoot() {
  await mkdir(getLocalStorageRoot(), { recursive: true });
}

export async function writeScreenshotToLocalStorage({
  body,
  key,
}: {
  body: Buffer;
  key: string;
}) {
  const destinationPath = getLocalStoragePath(key);
  await ensureLocalStorageRoot();
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, body);

  return { key };
}

export async function getScreenshotFromLocalStorage(key: string) {
  const destinationPath = getLocalStoragePath(key);

  try {
    const [body, fileStats] = await Promise.all([
      readFile(destinationPath),
      stat(destinationPath),
    ]);

    return {
      body: new Uint8Array(body),
      contentLength: fileStats.size,
      contentType: contentTypeFromKey(key),
      etag: createHash("sha1").update(body).digest("hex"),
    };
  } catch {
    return null;
  }
}

export async function checkLocalScreenshotStorage() {
  try {
    await ensureLocalStorageRoot();
    await access(getLocalStorageRoot());

    return {
      detail: `Local screenshot storage is ready at ${getLocalStorageRoot()}.`,
      status: "ready" as const,
    };
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "Unable to access the local screenshot storage directory.",
      status: "offline" as const,
    };
  }
}
