import { getDb } from "@/lib/db";
import {
  getAnalysisProviderDisplayName,
  resolveAnalysisProvider,
} from "@/lib/analysis-provider";
import {
  getClientEnv,
  getServerEnv,
  hasDatabaseConfig,
  hasNeonAuthConfig,
} from "@/lib/env";
import { checkLocalScreenshotStorage } from "@/lib/storage/local";

export type PlatformCheckStatus = "ready" | "action-required" | "offline";

export type PlatformCheck = {
  detail: string;
  id: string;
  label: string;
  nextAction: string;
  status: PlatformCheckStatus;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

async function checkAnalysisProvider() {
  try {
    const providerConfig = resolveAnalysisProvider();

    if (providerConfig.provider === "openai-compatible") {
      const response = await fetch(`${normalizeBaseUrl(providerConfig.baseUrl)}/models`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
        },
        signal: AbortSignal.timeout(2500),
      });

      return {
        detail: response.ok
          ? `Connected to ${providerConfig.model} via ${getAnalysisProviderDisplayName(providerConfig.provider)}.`
          : `The configured API endpoint responded with ${response.status}.`,
        id: "analysis-provider",
        label: "Analysis provider",
        nextAction: response.ok
          ? "No action required."
          : "Verify AI_BASE_URL, AI_API_KEY, AI_MODEL, and whether the endpoint supports the OpenAI chat completions API.",
        status: response.ok ? ("ready" as const) : ("offline" as const),
      };
    }

    const tagsUrl = `${normalizeBaseUrl(providerConfig.baseUrl).replace(/\/api$/, "")}/api/tags`;
    const response = await fetch(tagsUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      return {
        detail: `Ollama responded with ${response.status}.`,
        id: "analysis-provider",
        label: "Analysis provider",
        nextAction: "Start the local Ollama server and confirm the configured base URL is reachable.",
        status: "offline" as const,
      };
    }

    const payload = (await response.json()) as {
      models?: Array<{ name?: string }>;
    };
    const hasModel = (payload.models ?? []).some(
      (model) => model.name === providerConfig.model,
    );

    return {
      detail: hasModel
        ? `Connected to ${providerConfig.model} via Ollama.`
        : `Ollama is reachable, but ${providerConfig.model} is not installed yet.`,
      id: "analysis-provider",
      label: "Analysis provider",
      nextAction: hasModel
        ? "No action required."
        : `Run ollama pull ${providerConfig.model} on this machine.`,
      status: hasModel ? ("ready" as const) : ("action-required" as const),
    };
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "The configured analysis provider is not reachable from this app.",
      id: "analysis-provider",
      label: "Analysis provider",
      nextAction:
        "Set AI_PROVIDER and the corresponding AI_BASE_URL / AI_MODEL / AI_API_KEY values before running live analysis.",
      status: "action-required" as const,
    };
  }
}

async function checkNeonAuth() {
  const serverEnv = getServerEnv();

  if (!hasNeonAuthConfig()) {
    return {
      detail: "Neon Auth is disabled because NEON_AUTH_BASE_URL is missing.",
      id: "neon-auth",
      label: "Neon Auth",
      nextAction:
        "Create a Neon Auth project, enable Google and email/password, then add NEON_AUTH_BASE_URL.",
      status: "action-required" as const,
    };
  }

  try {
    const response = await fetch(
      `${normalizeBaseUrl(serverEnv.NEON_AUTH_BASE_URL!)}/get-session`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );

    return {
      detail: response.ok
        ? "Neon Auth is reachable."
        : `Neon Auth responded with ${response.status}.`,
      id: "neon-auth",
      label: "Neon Auth",
      nextAction: response.ok
        ? "Confirm Google and email/password providers are enabled in the Neon Auth console."
        : "Check NEON_AUTH_BASE_URL and confirm the Neon Auth project is active.",
      status: response.ok ? ("ready" as const) : ("offline" as const),
    };
  } catch {
    return {
      detail: "The app could not reach your Neon Auth endpoint.",
      id: "neon-auth",
      label: "Neon Auth",
      nextAction: "Verify NEON_AUTH_BASE_URL and that the auth service is reachable.",
      status: "offline" as const,
    };
  }
}

async function checkDatabase() {
  if (!hasDatabaseConfig()) {
    return {
      detail: "Database persistence is disabled because DATABASE_URL is missing.",
      id: "neon-db",
      label: "Neon Postgres",
      nextAction: "Create a Neon Postgres project and add DATABASE_URL.",
      status: "action-required" as const,
    };
  }

  const sql = getDb();

  if (!sql) {
    return {
      detail: "The app could not initialize the Neon Postgres client.",
      id: "neon-db",
      label: "Neon Postgres",
      nextAction: "Verify DATABASE_URL and restart the app.",
      status: "offline" as const,
    };
  }

  try {
    await sql`select 1 as ok`;

    return {
      detail: "Neon Postgres is reachable.",
      id: "neon-db",
      label: "Neon Postgres",
      nextAction: "Apply db/schema.sql if you have not created the tables yet.",
      status: "ready" as const,
    };
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "The app could not query Neon Postgres.",
      id: "neon-db",
      label: "Neon Postgres",
      nextAction: "Check DATABASE_URL, network access, and whether the database is online.",
      status: "offline" as const,
    };
  }
}

async function checkLocalStorage() {
  const result = await checkLocalScreenshotStorage();

  return {
    detail: result.detail,
    id: "local-storage",
    label: "Local screenshot storage",
    nextAction:
      result.status === "ready"
        ? `Screenshots will be written to ${process.env.LOCAL_SCREENSHOT_STORAGE_DIR ?? ".data/screenshots"}.`
        : "Verify the local screenshot directory path and file system permissions.",
    status: result.status,
  };
}

function checkDeploymentTarget() {
  const clientEnv = getClientEnv();
  const appUrl = clientEnv.NEXT_PUBLIC_APP_URL ?? "";
  const isLocalhost = /localhost|127\.0\.0\.1/.test(appUrl);

  if (!appUrl) {
    return {
      detail: "NEXT_PUBLIC_APP_URL is missing.",
      id: "deployment",
      label: "Deployment target",
      nextAction: "Set NEXT_PUBLIC_APP_URL to your final deployed domain before production release.",
      status: "action-required" as const,
    };
  }

  if (isLocalhost) {
    return {
      detail: `The app is still configured for local development at ${appUrl}.`,
      id: "deployment",
      label: "Deployment target",
      nextAction:
        "Deploy the app, then replace NEXT_PUBLIC_APP_URL with the public Vercel URL or custom domain.",
      status: "action-required" as const,
    };
  }

  return {
    detail: `NEXT_PUBLIC_APP_URL points to ${appUrl}.`,
    id: "deployment",
    label: "Deployment target",
    nextAction: "Confirm the same domain is added to Neon Auth redirect URLs.",
    status: "ready" as const,
  };
}

export async function getPlatformStatus() {
  const checks = [
    checkDeploymentTarget(),
    await checkAnalysisProvider(),
    await checkNeonAuth(),
    await checkDatabase(),
    await checkLocalStorage(),
  ];

  return {
    checks,
    generatedAt: new Date().toISOString(),
    readyCount: checks.filter((check) => check.status === "ready").length,
  };
}
