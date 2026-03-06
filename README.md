# AI Interface Critic

AI Interface Critic is a web application that analyzes UI screenshots and returns structured UX feedback, including hierarchy, accessibility, layout, and interaction issues.

## Product direction

- Input: UI screenshot
- Processing: AI-powered UX analysis
- Output: structured report with actionable recommendations

## Target user

- Junior designers
- Product managers
- Students learning UX

## MVP

1. Upload a screenshot
2. Analyze the interface with AI
3. Generate UX issues in clear categories
4. Display a report with actionable feedback

## Recommended stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS
- Backend: Next.js Route Handlers
- AI: OpenAI vision-capable model
- Storage: Supabase

## Docs

- [Project roadmap](./docs/roadmap.md)
- [Git workflow](./docs/git-workflow.md)

## Build order

1. Product spec and UX structure
2. Next.js app scaffold
3. Landing and upload flow
4. Loading and report UI with mock data
5. Analysis API contract
6. OpenAI integration
7. Persistence, scoring, and deployment
