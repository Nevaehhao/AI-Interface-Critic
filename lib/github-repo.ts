import { getServerEnv } from "@/lib/env";

type GitHubRepoApiResponse = {
  default_branch?: string;
  description?: string | null;
  homepage?: string | null;
  language?: string | null;
  name?: string;
  owner?: {
    login?: string;
  };
  topics?: string[];
};

type GitHubContentItem = {
  name?: string;
  path?: string;
  type?: string;
};

type GitHubReadmeResponse = {
  content?: string;
  encoding?: string;
};

export type GitHubRepoReference = {
  owner: string;
  repo: string;
};

export type GitHubRepoIntake = {
  defaultBranch: string | null;
  description: string | null;
  frameworkHints: string[];
  homepage: string | null;
  owner: string;
  repo: string;
  rootEntries: string[];
  suggestedFiles: string[];
  summary: string;
  topics: string[];
};

function buildApiHeaders() {
  const apiKey = getServerEnv().GITHUB_TOKEN?.trim();

  return {
    Accept: "application/vnd.github+json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    "User-Agent": "AI-Interface-Critic",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function decodeBase64(value: string) {
  return Buffer.from(value, "base64").toString("utf8");
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];
}

function inferFrameworkHints(readme: string | null, packageJson: string | null) {
  const haystack = `${packageJson ?? ""}\n${readme ?? ""}`.toLowerCase();
  const hints: string[] = [];

  if (haystack.includes("\"next\"")) {
    hints.push("Next.js");
  }

  if (haystack.includes("\"react\"")) {
    hints.push("React");
  }

  if (haystack.includes("tailwind")) {
    hints.push("Tailwind CSS");
  }

  if (haystack.includes("\"vite\"")) {
    hints.push("Vite");
  }

  if (haystack.includes("\"typescript\"")) {
    hints.push("TypeScript");
  }

  if (haystack.includes("\"express\"")) {
    hints.push("Express");
  }

  return hints;
}

async function fetchGitHubJson<T>(path: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    cache: "no-store",
    headers: buildApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function fetchOptionalFile(
  owner: string,
  repo: string,
  path: string,
  ref: string | null,
) {
  const searchParams = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}${searchParams}`,
    {
      cache: "no-store",
      headers: buildApiHeaders(),
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GitHubReadmeResponse;

  if (payload.encoding !== "base64" || !payload.content) {
    return null;
  }

  return decodeBase64(payload.content.replace(/\n/g, ""));
}

function prioritizeSuggestedFiles(rootEntries: string[]) {
  const priorities = [
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "package-lock.json",
    "README.md",
    "app",
    "src",
    "components",
    "pages",
    "lib",
    "server",
    "api",
  ];

  return priorities.filter((entry) => rootEntries.includes(entry)).slice(0, 8);
}

export function parseGitHubRepoUrl(repoUrl: string): GitHubRepoReference | null {
  try {
    const url = new URL(repoUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length < 2) {
      return null;
    }

    return {
      owner: segments[0] ?? "",
      repo: (segments[1] ?? "").replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

export async function fetchGitHubRepoIntake(
  repoUrl: string,
): Promise<GitHubRepoIntake | null> {
  const parsedRepo = parseGitHubRepoUrl(repoUrl);

  if (!parsedRepo) {
    return null;
  }

  const { owner, repo } = parsedRepo;
  const repoMeta = await fetchGitHubJson<GitHubRepoApiResponse>(
    `/repos/${owner}/${repo}`,
  );
  const defaultBranch = repoMeta.default_branch ?? null;
  const rootItems = await fetchGitHubJson<GitHubContentItem[]>(
    `/repos/${owner}/${repo}/contents${defaultBranch ? `?ref=${encodeURIComponent(defaultBranch)}` : ""}`,
  );
  const rootEntries = rootItems
    .map((item) => item.path ?? item.name ?? null)
    .filter((item): item is string => Boolean(item))
    .sort((left, right) => left.localeCompare(right));
  const suggestedFiles = prioritizeSuggestedFiles(rootEntries);
  const [readme, packageJson] = await Promise.all([
    fetchOptionalFile(owner, repo, "README.md", defaultBranch),
    fetchOptionalFile(owner, repo, "package.json", defaultBranch),
  ]);
  const frameworkHints = inferFrameworkHints(readme, packageJson);
  const topics = repoMeta.topics ?? [];
  const summaryParts = uniqueStrings([
    repoMeta.description ?? null,
    repoMeta.language ? `Primary language: ${repoMeta.language}.` : null,
    frameworkHints.length > 0 ? `Detected stack: ${frameworkHints.join(", ")}.` : null,
    suggestedFiles.length > 0
      ? `Likely entry points: ${suggestedFiles.join(", ")}.`
      : null,
  ]);

  return {
    defaultBranch,
    description: repoMeta.description ?? null,
    frameworkHints,
    homepage: repoMeta.homepage ?? null,
    owner,
    repo,
    rootEntries,
    suggestedFiles,
    summary:
      summaryParts.join(" ") ||
      `Public GitHub repository ${owner}/${repo} is available for implementation context.`,
    topics,
  };
}
