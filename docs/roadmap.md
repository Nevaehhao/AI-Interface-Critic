# Project Roadmap

## Product statement

AI Interface Critic is an open-source critique-to-builder app for UI review workflows.

## Current direction

The project is moving from:

- screenshot critique only

to:

- screenshot critique plus engineering handoff

and then toward:

- repository-aware implementation workflows

## Goals

- Let users plug in their own model provider
- Produce critique that feels like senior design review
- Produce handoff that is useful to engineering
- Stay honest about what is generated, inferred, or still manual

## Roadmap phases

### Phase 1: Stable critique core

Status: shipped

- Upload flow
- Loading flow
- Structured report UI
- Highlighted issue regions
- Mock fallback behavior

### Phase 2: Open provider foundation

Status: shipped

- Ollama support
- OpenAI-compatible provider support
- Setup visibility for the active provider
- Environment-variable driven provider configuration

### Phase 3: Critic to builder handoff

Status: shipped

- Review modes
- Page URL and repo URL context
- Product goal, audience, and stack context
- Implementation plan in the report
- Copyable builder brief

### Phase 4: Better source inputs

Status: shipped for URL capture and repo intake foundation

- Capture screenshots directly from a URL
- GitHub repository intake for public repos
- Richer page metadata and repo hints

### Phase 5: Repo-aware automation

Status: shipped for the local bridge, still evolving for patch quality

- File tree summarization for builder mode
- Local CLI bridge for repo access
- Patch and PR generation commands

### Phase 6: Team workflows

Status: partly shipped, deeper collaboration still later

- Shared reports
- Review annotations and issue triage
- Team workspaces with archive, tags, and colors
- Approval flows for generated implementation plans

## Product constraints

- The app should remain useful without paid hosted services
- The UI must clearly disclose fallback output
- Schema stability matters more than adding vendor-specific hacks quickly
- Browser-only workflows should not pretend to have direct local repo access

## Near-term priorities

1. Richer multi-screen input directly from upload
2. Better patch quality, validation, and auto-test loops in builder mode
3. Private repository adapters and authentication flows
4. Team review permissions and approval workflows
