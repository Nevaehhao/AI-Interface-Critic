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

Next

- Capture screenshots directly from a URL
- Support multiple screens for a single flow review
- Support richer page metadata and crawl hints

### Phase 5: Repo-aware automation

Next

- GitHub repository connection
- File tree summarization for builder mode
- Local CLI bridge for repo access
- Patch and PR generation

### Phase 6: Team workflows

Later

- Shared reports
- Review annotations
- Team workspaces
- Approval flows for generated implementation plans

## Product constraints

- The app should remain useful without paid hosted services
- The UI must clearly disclose fallback output
- Schema stability matters more than adding vendor-specific hacks quickly
- Browser-only workflows should not pretend to have direct local repo access

## Near-term priorities

1. URL capture
2. GitHub and local CLI builder integration
3. Better report comparison and before/after diffs
4. Stronger persistence and shareability
