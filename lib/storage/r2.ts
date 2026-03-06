import {
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getServerEnv, hasR2Config } from "@/lib/env";

let r2Client: S3Client | null = null;

function getR2Endpoint() {
  const serverEnv = getServerEnv();

  if (serverEnv.R2_ENDPOINT) {
    return serverEnv.R2_ENDPOINT;
  }

  if (!serverEnv.R2_ACCOUNT_ID) {
    return null;
  }

  return `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

export function getR2Client() {
  if (!hasR2Config()) {
    return null;
  }

  if (!r2Client) {
    const serverEnv = getServerEnv();
    const endpoint = getR2Endpoint();

    if (!endpoint) {
      return null;
    }

    r2Client = new S3Client({
      credentials: {
        accessKeyId: serverEnv.R2_ACCESS_KEY_ID!,
        secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY!,
      },
      endpoint,
      region: "auto",
    });
  }

  return r2Client;
}

export async function uploadScreenshotToR2({
  body,
  contentType,
  key,
}: {
  body: Buffer;
  contentType: string;
  key: string;
}) {
  const client = getR2Client();

  if (!client) {
    return null;
  }

  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: getServerEnv().R2_BUCKET_NAME,
      CacheControl: "public, max-age=31536000",
      ContentType: contentType,
      Key: key,
    }),
  );

  return { key };
}

export async function getScreenshotObject(key: string) {
  const client = getR2Client();

  if (!client) {
    return null;
  }

  const response = await client.send(
    new GetObjectCommand({
      Bucket: getServerEnv().R2_BUCKET_NAME,
      Key: key,
    }),
  );

  return {
    body: response.Body ?? null,
    contentLength: response.ContentLength ?? null,
    contentType: response.ContentType ?? null,
    etag: response.ETag ?? null,
  };
}

export async function checkR2Bucket() {
  const client = getR2Client();

  if (!client) {
    return {
      detail: "R2 credentials are missing from the environment.",
      status: "action-required" as const,
    };
  }

  try {
    await client.send(
      new HeadBucketCommand({
        Bucket: getServerEnv().R2_BUCKET_NAME,
      }),
    );

    return {
      detail: `Connected to bucket ${getServerEnv().R2_BUCKET_NAME}.`,
      status: "ready" as const,
    };
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "Unable to reach the configured R2 bucket.",
      status: "offline" as const,
    };
  }
}
