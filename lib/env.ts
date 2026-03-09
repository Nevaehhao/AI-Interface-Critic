import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  LOCAL_SCREENSHOT_STORAGE_DIR: z.string().min(1).optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().min(1).default("gemma3"),
});

export function getClientEnv() {
  return clientSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getServerEnv() {
  return serverSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    LOCAL_SCREENSHOT_STORAGE_DIR: process.env.LOCAL_SCREENSHOT_STORAGE_DIR,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  });
}

export function hasDatabaseConfig() {
  return Boolean(getServerEnv().DATABASE_URL);
}

export function hasNeonAuthConfig() {
  return Boolean(getServerEnv().NEON_AUTH_BASE_URL);
}
