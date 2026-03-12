import { describe, expect, it } from "vitest";

import {
  buildBuilderPlan,
  buildBuilderPrompt,
} from "../lib/builder-agent";
import { createMockAnalysisReport } from "../lib/analysis-report";
import type { RepoSnapshot } from "../lib/local-repo";

function createSnapshot(): RepoSnapshot {
  return {
    repoPath: "/tmp/example-repo",
    rootEntries: ["app", "components", "lib", "package.json"],
    selectedFiles: [
      {
        content: "export default function Page() { return <main>Home</main>; }",
        path: "app/page.tsx",
      },
      {
        content: "export function Button() { return <button>Click</button>; }",
        path: "components/button.tsx",
      },
    ],
    tree: ["app/page.tsx", "components/button.tsx", "lib/utils.ts"],
  };
}

describe("builder agent helpers", () => {
  it("builds a markdown plan from the report and repo snapshot", () => {
    const report = createMockAnalysisReport();
    const plan = buildBuilderPlan(report, createSnapshot());

    expect(plan).toContain("# Builder plan");
    expect(plan).toContain(report.summary.mainFinding);
    expect(plan).toContain("app/page.tsx");
  });

  it("builds a coding-agent prompt with repo file contents", () => {
    const report = createMockAnalysisReport();
    const prompt = buildBuilderPrompt({
      mode: "prompt",
      report,
      snapshot: createSnapshot(),
    });

    expect(prompt).toContain("Repository snapshot:");
    expect(prompt).toContain("File: app/page.tsx");
    expect(prompt).toContain(report.implementationPlan.summary);
  });
});
