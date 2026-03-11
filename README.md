# AI Interface Critic

AI Interface Critic is an open-source UI review app that turns a screenshot into two outputs:

1. A structured critique from a senior UI/UX designer
2. A builder-ready implementation handoff for a full-stack engineer or coding agent

Bring your own model. Bring your own stack. Bring your own repo.

The app already supports:

- Screenshot-based critique with highlighted issue regions
- Review modes for UX, accessibility, conversion, design systems, and implementation handoff
- Optional page URL, repo URL, product goal, audience, and tech stack context
- Builder briefs with front-end work, back-end work, files to inspect, risks, and acceptance criteria
- Local-first history with optional Neon-backed persistence
- PDF export
- Workspace grouping
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

Current provider strategy:

- `AI_PROVIDER=ollama` for local analysis
- `AI_PROVIDER=openai-compatible` for OpenAI, OpenRouter, local gateways, or other compatible endpoints

## Quickstart

```bash
npm install
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

## Optional platform services

These are not required to run the UI locally, but they unlock persistence and auth:

- `DATABASE_URL` for Neon Postgres
- `NEON_AUTH_BASE_URL` for Neon Auth
- `LOCAL_SCREENSHOT_STORAGE_DIR` for saved screenshots
- `NEXT_PUBLIC_APP_URL` for deployment-aware URLs and auth redirects

Create `.env.local` from [`.env.example`](./.env.example).

## What the workflow looks like

1. Upload a screenshot
2. Add review context such as page URL, repo URL, goal, target audience, and stack
3. Let the configured provider generate structured critique
4. Review issue cards, screenshot highlights, and redesign suggestions
5. Copy the builder brief into your coding workflow or export the report as PDF

## What the report contains

- Overall score and main finding
- Section scores for hierarchy, accessibility, interaction, and layout
- Screenshot highlight regions for mapped issues
- Redesign suggestions
- Builder handoff:
  - Front-end changes
  - Back-end changes
  - Files to inspect
  - Acceptance criteria
  - Risks

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Zod
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

- BYO model provider support
- Review context for repo-aware critique
- Builder handoff generation
- Local and synced history

What is next:

- Page capture from URL
- GitHub repo ingestion
- Local CLI / coding-agent bridge
- Patch and PR generation
- Multi-screen flow reviews

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
