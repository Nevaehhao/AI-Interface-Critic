# System Architecture

## Design sequence

Problem → Critique contract → Provider abstraction → Product UX → Builder handoff

This repo should behave like a product layer over models, not a thin model demo.

## Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS v4
- Backend: Next.js Route Handlers
- Validation: Zod
- AI provider layer: Ollama, OpenAI-compatible APIs, Anthropic, and Gemini
- URL capture: Playwright
- Platform: Neon Auth, Neon Postgres, local screenshot storage

## Core request flow

1. The user uploads a screenshot or provides a page URL plus optional context from the web client
2. The browser stores a draft locally and moves into the loading route
3. `POST /api/analyze` validates the image, parses analysis context, and can capture a screenshot from a page URL
4. GitHub repo intake can enrich the context before inference
5. The provider layer resolves the configured model backend
6. The server sends a structured prompt and image to the provider
7. The returned JSON is normalized and validated against shared report schemas
8. The server optionally persists the report, screenshot, share state, and workspace linkage
9. The client renders critique, screenshot highlights, triage controls, redesign suggestions, and builder handoff data

## Key contracts

### Analysis context

Attached before inference:

- Review mode
- Page URL
- Capture mode and page title
- Repo URL
- Repo summary and entry points
- Product goal
- Target audience
- Tech stack
- Free-form notes

### Analysis report

Returned after inference:

- Summary
- Sectioned UX issues
- Screenshot highlight coordinates
- Issue triage state and notes
- Redesign suggestions
- Implementation plan
- Stored context for reopening and handoff

## Provider abstraction

The app should support multiple providers behind one interface.

Current providers:

- `ollama`
- `openai-compatible`
- `anthropic`
- `gemini`

Design constraint:

- The UI should not be tightly coupled to any single vendor protocol

## Builder handoff and local builder bridge

The browser app produces a builder-ready brief and a local builder CLI entry point instead of trying
to mutate repositories directly from the browser.

The browser report and CLI together include:

- Front-end changes
- Back-end changes
- Files to inspect
- Acceptance criteria
- Risks
- Prompt and patch generation paths for local repo workflows

This keeps the web app honest while still making it useful inside coding-agent workflows.

## Route map

- `/`: landing page
- `/upload`: screenshot and context intake
- `/loading`: staged analysis state
- `/report/[analysisId]`: completed report
- `/history`: local and synced report history
- `/share/[shareToken]`: public shared report view
- `/workspaces`: project grouping
- `/setup`: provider and platform readiness
- `/api/analyze`: analysis endpoint
- `/api/analyses/[analysisId]/triage`: issue triage persistence
- `/api/analyses/[analysisId]/share`: share link enablement

## Integration constraints

- The app must still run when hosted providers or Neon are unavailable
- Mock fallback must remain available for local UI work
- Shared schemas must remain the source of truth for report rendering
- The report must disclose whether a live model or fallback generated the output
