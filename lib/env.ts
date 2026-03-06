import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().min(1).default("gemma3"),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).default("ui-screenshots"),
  R2_ENDPOINT: z.string().url().optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
});

export function getClientEnv() {
  return clientSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getServerEnv() {
  return serverSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  });
}

export function hasDatabaseConfig() {
  return Boolean(getServerEnv().DATABASE_URL);
}

export function hasNeonAuthConfig() {
  return Boolean(getServerEnv().NEON_AUTH_BASE_URL);
}

export function hasR2Config() {
  const serverEnv = getServerEnv();

  return Boolean(
    serverEnv.R2_ACCESS_KEY_ID &&
      serverEnv.R2_SECRET_ACCESS_KEY &&
      (serverEnv.R2_ENDPOINT || serverEnv.R2_ACCOUNT_ID),
  );
}
