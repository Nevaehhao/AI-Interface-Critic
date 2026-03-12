# AI Interface Critic

AI Interface Critic is an open-source UI review app that turns a screenshot into two outputs:

1. A structured critique from a senior UI/UX designer
2. A builder-ready implementation handoff for a full-stack engineer or coding agent

Bring your own model. Bring your own stack. Bring your own repo.

The app already supports:

- Screenshot-based critique with highlighted issue regions
- URL capture with Playwright-backed headless screenshots
- Review modes for UX, accessibility, conversion, design systems, and implementation handoff
- Optional page URL, repo URL, product goal, audience, and tech stack context
- GitHub repo intake for public repositories
- Builder briefs with front-end work, back-end work, files to inspect, risks, and acceptance criteria
- Builder CLI commands for `plan`, `prompt`, `patch`, `apply`, and `pr`
- Before/after compare and multi-screen flow review from history selection
- Issue triage with `open`, `fixed`, `ignored`, and `revisit`
- Local-first history with optional Neon-backed persistence
- Search, source filters, score filters, and score trends in history
- PDF export
- JSON export
- Shared report links
- Workspace grouping with colors, tags, archive, rename, and delete
- A visible fallback path when live model output fails

## Why this project exists

Most AI screenshot tools stop at generic feedback.

This project is trying to close the gap between:

- "The UI has problems"
- "Here is what should change"
- "Here is how an engineer should implement it"

The browser app is the critique and handoff layer. The long-term direction is a full critic-to-builder workflow that can connect to repos and coding agents more directly.

## Bring your own AI

This repo does not require a hosted SaaS account from us.

You can run it with:

- `Ollama`
- Any `OpenAI-compatible` API endpoint
- `Anthropic`
- `Gemini`

Current provider strategy:

- `AI_PROVIDER=ollama` for local analysis
- `AI_PROVIDER=openai-compatible` for OpenAI, OpenRouter, local gateways, or other compatible endpoints
- `AI_PROVIDER=anthropic` for Claude models
- `AI_PROVIDER=gemini` for Gemini models

## Quickstart

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Local Ollama example

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3
```

### Hosted OpenAI-compatible example

```env
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_api_key
AI_MODEL=gpt-4.1-mini
```

The app falls back to mock output when the configured provider fails, and the report makes that visible.

### Anthropic example

```env
AI_PROVIDER=anthropic
AI_API_KEY=your_anthropic_key
AI_MODEL=claude-3-5-sonnet-latest
```

### Gemini example

```env
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_key
AI_MODEL=gemini-2.0-flash
```

## Optional platform services

These are not required to run the UI locally, but they unlock persistence and auth:

- `DATABASE_URL` for Neon Postgres
- `GITHUB_TOKEN` for higher-rate-limit GitHub repo intake or private repo access
- `NEON_AUTH_BASE_URL` for Neon Auth
- `LOCAL_SCREENSHOT_STORAGE_DIR` for saved screenshots
- `NEXT_PUBLIC_APP_URL` for deployment-aware URLs and auth redirects

Create `.env.local` from [`.env.example`](./.env.example).

## What the workflow looks like

1. Upload a screenshot or capture a live page URL
2. Add review context such as repo URL, goal, target audience, and stack
3. Let the configured provider generate structured critique
4. Review issue cards, screenshot highlights, triage status, and redesign suggestions
5. Compare multiple reports, scan flow-level patterns, or share a link
6. Export JSON or hand the report to the local builder CLI

## What the report contains

- Overall score and main finding
- Section scores for hierarchy, accessibility, interaction, and layout
- Screenshot highlight regions for mapped issues
- Issue triage state and notes
- Redesign suggestions
- Before / after compare and flow review from history
- Builder handoff:
  - Front-end changes
  - Back-end changes
  - Files to inspect
  - Acceptance criteria
  - Risks

## Scripts

```bash
npm run builder -- help
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

### Builder CLI examples

```bash
npm run builder -- plan --report report.json --repo /path/to/repo
npm run builder -- prompt --report report.json --repo /path/to/repo
npm run builder -- patch --report report.json --repo /path/to/repo
npm run builder -- apply --patch builder-output/changes.patch
```

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Zod
- Playwright
- Neon Auth
- Neon Postgres
- pdf-lib

## Project structure

```text
app/                    routes and route handlers
components/             UI for upload, loading, history, reports, auth
lib/                    analysis schemas, provider adapters, storage, persistence
db/                     SQL schema
docs/                   product, architecture, setup, and roadmap docs
tests/                  vitest coverage
```

## Open-source direction

What is already in place:

- BYO model provider support across Ollama, OpenAI-compatible APIs, Anthropic, and Gemini
- URL capture, GitHub repo intake, and builder CLI bridging
- Review workflow features such as compare, triage, trends, share links, and workspace management

What is next:

- Deeper repo-aware patch quality and automatic validation loops
- Private repository adapters beyond raw GitHub URLs
- Richer multi-screen input modes directly from upload
- More opinionated team review workflows

## Reference projects

These open-source projects helped calibrate the product and UI direction:

- [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot)
- [assistant-ui](https://github.com/assistant-ui/assistant-ui)
- [open-webui/open-webui](https://github.com/open-webui/open-webui)

## Contributing

Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

The repo is intentionally structured for feature-sized branches and small merges. If you want to contribute a new provider, report section, or builder integration, open an issue or draft PR early so the interface contracts stay stable.

## Docs

- [Product brief](./docs/product-brief.md)
- [System architecture](./docs/system-architecture.md)
- [Roadmap](./docs/roadmap.md)
- [UX blueprint](./docs/ux-blueprint.md)
- [Ollama setup](./docs/ollama-setup.md)
- [Neon + R2 setup](./docs/neon-r2-setup.md)
- [Deployment guide](./docs/deployment.md)
- [Git workflow](./docs/git-workflow.md)

## Status

This is an actively evolving open-source project. The critique workflow is production-shaped today; the deeper repo-to-code automation path is the next major buildout.
