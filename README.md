# AI Interface Critic

AI Interface Critic is a web application that analyzes UI screenshots and returns structured UX feedback, including hierarchy, accessibility, layout, and interaction issues.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase for auth, storage, and persistence
- Ollama for screenshot analysis

## Current status

This repository is being built in feature-sized branches and merged into `main` after each milestone.

## Product focus

- Problem: junior designers need fast pre-review UX feedback
- Input: UI screenshot
- Processing: AI UX analysis
- Output: structured critique report

## Feature roadmap

1. Project scaffold
2. Landing page
3. Upload flow
4. Loading experience
5. Report UI
6. Analyze API
7. Ollama integration
8. Supabase platform integration

## Environment variables

Create `.env.local` from [`.env.example`](./.env.example).

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Docs

- [Roadmap](./docs/roadmap.md)
- [Git workflow](./docs/git-workflow.md)
- [Product brief](./docs/product-brief.md)
- [UX blueprint](./docs/ux-blueprint.md)
- [System architecture](./docs/system-architecture.md)
- [Ollama setup](./docs/ollama-setup.md)
- [Supabase setup](./docs/supabase-setup.md)
