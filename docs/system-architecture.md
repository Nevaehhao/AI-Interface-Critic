# System Architecture

## Design sequence

Problem → UX → System → Code

The implementation should follow that order so the app behaves like a product instead of a thin model wrapper.

## Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS v4
- Backend: Next.js Route Handlers
- AI: Ollama image analysis
- Platform: Neon Auth, Neon Postgres, and local screenshot storage

## Core request flow

1. The user uploads a screenshot from the web client
2. The browser sends the image to `POST /api/analyze`
3. The server validates the file and prepares analysis input
4. The server calls Ollama to generate structured UX feedback
5. The server optionally writes the screenshot to local disk
6. The server optionally persists the analysis to Neon Postgres
7. The client renders the returned report

## Initial route map

- `/`: landing page
- `/upload`: screenshot upload flow
- `/loading`: analysis waiting state
- `/report/[analysisId]`: completed report
- `/api/analyze`: analysis endpoint
- `/history`: persisted analysis history

## Integration constraints

- The app must still build locally when Ollama or Neon are unavailable
- Mock analysis should remain available for local UI development
- Shared TypeScript schemas should define the API contract before model output is rendered

## Deployment target

- Vercel for application hosting
- Neon Auth for Google and email sign-in
- Neon Postgres for report and workspace persistence
- Local file storage for screenshots during development
