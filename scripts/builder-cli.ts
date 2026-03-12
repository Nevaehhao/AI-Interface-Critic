#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildBuilderPlan,
  buildBuilderPrompt,
  generateBuilderOutput,
} from "@/lib/builder-agent";
import { analysisReportSchema } from "@/lib/analysis-report";
import { buildLocalRepoSnapshot } from "@/lib/local-repo";

type ParsedArgs = {
  flags: Map<string, string>;
  positionals: string[];
};

function parseArgs(argv: string[]): ParsedArgs {
  const flags = new Map<string, string>();
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current) {
      continue;
    }

    if (current.startsWith("--")) {
      const next = argv[index + 1];

      if (!next || next.startsWith("--")) {
        flags.set(current.slice(2), "true");
      } else {
        flags.set(current.slice(2), next);
        index += 1;
      }

      continue;
    }

    positionals.push(current);
  }

  return {
    flags,
    positionals,
  };
}

function requireFlag(flags: Map<string, string>, name: string) {
  const value = flags.get(name);

  if (!value) {
    throw new Error(`Missing required flag --${name}.`);
  }

  return value;
}

async function readReport(reportPath: string) {
  const rawValue = await readFile(reportPath, "utf8");
  return analysisReportSchema.parse(JSON.parse(rawValue));
}

async function writeOutputFile(outputPath: string, content: string) {
  await mkdir(path.dirname(outputPath), {
    recursive: true,
  });
  await writeFile(outputPath, content, "utf8");
}

function printHelp() {
  process.stdout.write(
    [
      "AI Interface Critic Builder CLI",
      "",
      "Commands:",
      "  plan  --report report.json --repo /path/to/repo [--output builder-output/plan.md]",
      "  prompt --report report.json --repo /path/to/repo [--output builder-output/prompt.md]",
      "  patch --report report.json --repo /path/to/repo [--output builder-output/changes.patch]",
      "  apply --patch builder-output/changes.patch",
      "  pr --title \"Improve CTA hierarchy\" [--body-file builder-output/plan.md] [--base main]",
      "",
      "Notes:",
      "  - `patch` uses the configured AI provider from your environment.",
      "  - `apply` runs `git apply` in the current working directory.",
      "  - `pr` requires the GitHub CLI (`gh`) to be installed and authenticated.",
      "",
    ].join("\n"),
  );
}

async function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  const command = positionals[0];

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "apply") {
    const patchPath = requireFlag(flags, "patch");
    const result = spawnSync("git", ["apply", patchPath], {
      stdio: "inherit",
    });

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }

    process.stdout.write(`Applied ${patchPath}\n`);
    return;
  }

  if (command === "pr") {
    const title = requireFlag(flags, "title");
    const base = flags.get("base") ?? "main";
    const bodyFile = flags.get("body-file");
    const args = ["pr", "create", "--title", title, "--base", base];

    if (bodyFile) {
      args.push("--body-file", bodyFile);
    }

    const result = spawnSync("gh", args, {
      stdio: "inherit",
    });

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }

    return;
  }

  const reportPath = path.resolve(requireFlag(flags, "report"));
  const repoPath = path.resolve(requireFlag(flags, "repo"));
  const report = await readReport(reportPath);
  const snapshot = await buildLocalRepoSnapshot(repoPath, [
    ...report.context.repoEntryPoints,
    ...report.implementationPlan.filesToInspect,
  ]);

  if (command === "plan") {
    const content = buildBuilderPlan(report, snapshot);
    const outputPath = path.resolve(flags.get("output") ?? "builder-output/plan.md");

    await writeOutputFile(outputPath, content);
    process.stdout.write(`Wrote ${outputPath}\n`);
    return;
  }

  if (command === "prompt") {
    const content = buildBuilderPrompt({
      mode: "prompt",
      report,
      snapshot,
    });
    const outputPath = path.resolve(flags.get("output") ?? "builder-output/prompt.md");

    await writeOutputFile(outputPath, content);
    process.stdout.write(`Wrote ${outputPath}\n`);
    return;
  }

  if (command === "patch") {
    const prompt = buildBuilderPrompt({
      mode: "patch",
      report,
      snapshot,
    });
    const patch = await generateBuilderOutput(prompt);
    const outputPath = path.resolve(flags.get("output") ?? "builder-output/changes.patch");

    await writeOutputFile(outputPath, patch);
    process.stdout.write(`Wrote ${outputPath}\n`);
    return;
  }

  throw new Error(`Unknown command "${command}".`);
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Builder CLI failed."}\n`);
  process.exit(1);
});
