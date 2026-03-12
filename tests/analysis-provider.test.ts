import { describe, expect, it } from "vitest";

import { resolveAnalysisProvider } from "../lib/analysis-provider";
import type { ServerEnv } from "../lib/env";

describe("analysis provider resolution", () => {
  it("defaults to the Ollama provider and legacy variables", () => {
    const serverEnv: ServerEnv = {
      AI_API_KEY: undefined,
      AI_BASE_URL: undefined,
      AI_MODEL: undefined,
      AI_PROVIDER: "ollama",
      DATABASE_URL: undefined,
      GITHUB_TOKEN: undefined,
      LOCAL_SCREENSHOT_STORAGE_DIR: undefined,
      NEON_AUTH_BASE_URL: undefined,
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODEL: "gemma3",
    };

    expect(resolveAnalysisProvider(serverEnv)).toEqual({
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma3",
      provider: "ollama",
    });
  });

  it("resolves a hosted OpenAI-compatible API config", () => {
    const serverEnv: ServerEnv = {
      AI_API_KEY: "test-key",
      AI_BASE_URL: "https://openrouter.ai/api/v1",
      AI_MODEL: "openai/gpt-4.1-mini",
      AI_PROVIDER: "openai-compatible",
      DATABASE_URL: undefined,
      GITHUB_TOKEN: undefined,
      LOCAL_SCREENSHOT_STORAGE_DIR: undefined,
      NEON_AUTH_BASE_URL: undefined,
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODEL: "gemma3",
    };

    expect(resolveAnalysisProvider(serverEnv)).toEqual({
      apiKey: "test-key",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4.1-mini",
      provider: "openai-compatible",
    });
  });

  it("throws when an OpenAI-compatible config is missing an API key", () => {
    const serverEnv: ServerEnv = {
      AI_API_KEY: undefined,
      AI_BASE_URL: undefined,
      AI_MODEL: undefined,
      AI_PROVIDER: "openai-compatible",
      DATABASE_URL: undefined,
      GITHUB_TOKEN: undefined,
      LOCAL_SCREENSHOT_STORAGE_DIR: undefined,
      NEON_AUTH_BASE_URL: undefined,
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODEL: "gemma3",
    };

    expect(() => resolveAnalysisProvider(serverEnv)).toThrow(/AI_API_KEY/);
  });

  it("resolves an Anthropic config", () => {
    const serverEnv: ServerEnv = {
      AI_API_KEY: "anthropic-test-key",
      AI_BASE_URL: undefined,
      AI_MODEL: undefined,
      AI_PROVIDER: "anthropic",
      DATABASE_URL: undefined,
      GITHUB_TOKEN: undefined,
      LOCAL_SCREENSHOT_STORAGE_DIR: undefined,
      NEON_AUTH_BASE_URL: undefined,
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODEL: "gemma3",
    };

    expect(resolveAnalysisProvider(serverEnv)).toEqual({
      anthropicVersion: "2023-06-01",
      apiKey: "anthropic-test-key",
      baseUrl: "https://api.anthropic.com/v1",
      model: "claude-3-5-sonnet-latest",
      provider: "anthropic",
    });
  });

  it("resolves a Gemini config", () => {
    const serverEnv: ServerEnv = {
      AI_API_KEY: "gemini-test-key",
      AI_BASE_URL: undefined,
      AI_MODEL: undefined,
      AI_PROVIDER: "gemini",
      DATABASE_URL: undefined,
      GITHUB_TOKEN: undefined,
      LOCAL_SCREENSHOT_STORAGE_DIR: undefined,
      NEON_AUTH_BASE_URL: undefined,
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODEL: "gemma3",
    };

    expect(resolveAnalysisProvider(serverEnv)).toEqual({
      apiKey: "gemini-test-key",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.0-flash",
      provider: "gemini",
    });
  });
});
