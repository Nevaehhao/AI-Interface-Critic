import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "build",
  "node_modules",
]);

const MAX_REPO_FILES = 240;
const MAX_SELECTED_FILES = 10;
const MAX_FILE_BYTES = 18_000;

export type RepoSnapshotFile = {
  content: string;
  path: string;
};

export type RepoSnapshot = {
  repoPath: string;
  rootEntries: string[];
  selectedFiles: RepoSnapshotFile[];
  tree: string[];
};

async function walkRepoFiles(
  repoPath: string,
  currentPath = "",
  entries: string[] = [],
): Promise<string[]> {
  if (entries.length >= MAX_REPO_FILES) {
    return entries;
  }

  const absolutePath = path.join(repoPath, currentPath);
  const children = await readdir(absolutePath, {
    withFileTypes: true,
  });

  for (const child of children) {
    if (entries.length >= MAX_REPO_FILES) {
      break;
    }

    if (child.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(child.name)) {
        await walkRepoFiles(repoPath, path.join(currentPath, child.name), entries);
      }

      continue;
    }

    entries.push(path.join(currentPath, child.name));
  }

  return entries.sort((left, right) => left.localeCompare(right));
}

function normalizeHint(value: string) {
  return value.replace(/^\.?\//, "");
}

function selectRelevantFiles(allFiles: string[], hints: string[]) {
  const normalizedHints = hints.map(normalizeHint);
  const selected: string[] = [];

  for (const hint of normalizedHints) {
    const directMatch = allFiles.find((file) => file === hint);

    if (directMatch && !selected.includes(directMatch)) {
      selected.push(directMatch);
      continue;
    }

    const nestedMatches = allFiles
      .filter((file) => file.startsWith(`${hint}/`))
      .slice(0, 2);

    for (const match of nestedMatches) {
      if (!selected.includes(match)) {
        selected.push(match);
      }
    }
  }

  const defaults = [
    "package.json",
    "app/page.tsx",
    "app/layout.tsx",
    "pages/index.tsx",
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "components",
    "src/components",
    "lib",
    "src/lib",
  ];

  for (const hint of defaults) {
    if (selected.length >= MAX_SELECTED_FILES) {
      break;
    }

    const directMatch = allFiles.find((file) => file === hint);

    if (directMatch && !selected.includes(directMatch)) {
      selected.push(directMatch);
      continue;
    }

    const nestedMatch = allFiles.find((file) => file.startsWith(`${hint}/`));

    if (nestedMatch && !selected.includes(nestedMatch)) {
      selected.push(nestedMatch);
    }
  }

  return selected.slice(0, MAX_SELECTED_FILES);
}

async function readSnapshotFile(repoPath: string, relativePath: string) {
  const absolutePath = path.join(repoPath, relativePath);
  const fileBuffer = await readFile(absolutePath);

  return {
    content: fileBuffer.subarray(0, MAX_FILE_BYTES).toString("utf8"),
    path: relativePath,
  };
}

export async function buildLocalRepoSnapshot(
  repoPath: string,
  preferredPaths: string[],
): Promise<RepoSnapshot> {
  const rootEntries = (await readdir(repoPath)).sort((left, right) =>
    left.localeCompare(right),
  );
  const tree = await walkRepoFiles(repoPath);
  const selectedFilePaths = selectRelevantFiles(tree, preferredPaths);
  const selectedFiles = await Promise.all(
    selectedFilePaths.map((relativePath) => readSnapshotFile(repoPath, relativePath)),
  );

  return {
    repoPath,
    rootEntries,
    selectedFiles,
    tree,
  };
}
