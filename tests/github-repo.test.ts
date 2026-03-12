import { describe, expect, it } from "vitest";

import { parseGitHubRepoUrl } from "../lib/github-repo";

describe("GitHub repo parsing", () => {
  it("extracts owner and repo from a standard URL", () => {
    expect(parseGitHubRepoUrl("https://github.com/vercel/ai-chatbot")).toEqual({
      owner: "vercel",
      repo: "ai-chatbot",
    });
  });

  it("ignores non-GitHub URLs", () => {
    expect(parseGitHubRepoUrl("https://gitlab.com/example/repo")).toBeNull();
  });

  it("strips the .git suffix", () => {
    expect(parseGitHubRepoUrl("https://github.com/openai/openai-cookbook.git")).toEqual({
      owner: "openai",
      repo: "openai-cookbook",
    });
  });
});
