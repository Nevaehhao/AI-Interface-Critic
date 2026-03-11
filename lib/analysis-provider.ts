import { getServerEnv, type ServerEnv } from "@/lib/env";

export const ANALYSIS_PROVIDER_VALUES = ["ollama", "openai-compatible"] as const;

export type AnalysisProvider = (typeof ANALYSIS_PROVIDER_VALUES)[number];

export type ResolvedAnalysisProviderConfig =
  | {
      baseUrl: string;
      model: string;
      provider: "ollama";
    }
  | {
      apiKey: string;
      baseUrl: string;
      model: string;
      provider: "openai-compatible";
    };

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export function getAnalysisProviderDisplayName(
  provider: AnalysisProvider | "mock",
) {
  if (provider === "mock") {
    return "Fallback";
  }

  return provider === "ollama" ? "Ollama" : "OpenAI-compatible API";
}

export function resolveAnalysisProvider(
  serverEnv: ServerEnv = getServerEnv(),
): ResolvedAnalysisProviderConfig {
  const provider = serverEnv.AI_PROVIDER;

  if (provider === "openai-compatible") {
    const apiKey = serverEnv.AI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error(
        "AI_API_KEY is required when AI_PROVIDER is set to openai-compatible.",
      );
    }

    return {
      apiKey,
      baseUrl: normalizeBaseUrl(serverEnv.AI_BASE_URL ?? "https://api.openai.com/v1"),
      model: serverEnv.AI_MODEL ?? "gpt-4.1-mini",
      provider,
    };
  }

  return {
    baseUrl: normalizeBaseUrl(serverEnv.AI_BASE_URL ?? serverEnv.OLLAMA_BASE_URL),
    model: serverEnv.AI_MODEL ?? serverEnv.OLLAMA_MODEL,
    provider,
  };
}
