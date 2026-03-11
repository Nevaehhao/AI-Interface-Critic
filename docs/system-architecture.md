# System Architecture

## Design sequence

Problem → Critique contract → Provider abstraction → Product UX → Builder handoff

This repo should behave like a product layer over models, not a thin model demo.

## Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS v4
- Backend: Next.js Route Handlers
- Validation: Zod
- AI provider layer: Ollama or OpenAI-compatible APIs
- Platform: Neon Auth, Neon Postgres, local screenshot storage

## Core request flow

1. The user uploads a screenshot and optional context from the web client
2. The browser stores a draft locally and moves into the loading route
3. `POST /api/analyze` validates the image and parses analysis context
4. The provider layer resolves the configured model backend
5. The server sends a structured prompt and image to the provider
6. The returned JSON is normalized and validated against shared report schemas
7. The server optionally persists the report and screenshot
8. The client renders critique, screenshot highlights, redesign suggestions, and builder handoff data

## Key contracts

### Analysis context

Attached before inference:

- Review mode
- Page URL
- Repo URL
- Product goal
- Target audience
- Tech stack
- Free-form notes

### Analysis report

Returned after inference:

- Summary
- Sectioned UX issues
- Screenshot highlight coordinates
- Redesign suggestions
- Implementation plan
- Stored context for reopening and handoff

## Provider abstraction

The app should support multiple providers behind one interface.

Current providers:

- `ollama`
- `openai-compatible`

Design constraint:

- The UI should not be tightly coupled to any single vendor protocol

## Builder handoff

The browser app currently produces a builder-ready brief instead of directly mutating repositories.

That brief includes:

- Front-end changes
- Back-end changes
- Files to inspect
- Acceptance criteria
- Risks

This keeps the web app honest while still making it useful inside coding-agent workflows.

## Route map

- `/`: landing page
- `/upload`: screenshot and context intake
- `/loading`: staged analysis state
- `/report/[analysisId]`: completed report
- `/history`: local and synced report history
- `/workspaces`: project grouping
- `/setup`: provider and platform readiness
- `/api/analyze`: analysis endpoint

## Integration constraints

- The app must still run when hosted providers or Neon are unavailable
- Mock fallback must remain available for local UI work
- Shared schemas must remain the source of truth for report rendering
- The report must disclose whether a live model or fallback generated the output
