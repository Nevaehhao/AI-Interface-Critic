# Deployment Guide

## Target

- Vercel for the Next.js app
- Neon Auth for authentication
- Neon Postgres for persistence
- Local file storage for screenshots during development
- Ollama running on the machine or service that handles analysis

## Important constraint

Ollama is a local model runtime. Vercel cannot run a persistent local Ollama daemon inside the app deployment.

That means you need one of these production setups:

1. Keep the web app on Vercel and point `OLLAMA_BASE_URL` to a separate machine that runs Ollama.
2. Deploy the whole app to a server where both Next.js and Ollama can run together.

## Vercel environment variables

Set the same values from `.env.local` in Vercel:

```bash
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
LOCAL_SCREENSHOT_STORAGE_DIR=
NEON_AUTH_BASE_URL=
OLLAMA_BASE_URL=
OLLAMA_MODEL=
```

## Deployment checklist

1. Deploy the Next.js app.
2. Set `NEXT_PUBLIC_APP_URL` to the deployed domain.
3. Add the deployed domain to Neon Auth allowed URLs.
4. Confirm the Neon database schema is applied.
5. Confirm the server can write to `LOCAL_SCREENSHOT_STORAGE_DIR` or swap to a cloud object store.
6. Confirm the deployed app can reach `OLLAMA_BASE_URL`.
7. Open `/setup` and verify all checks are ready.

## Pre-launch verification

Run these locally before every release:

```bash
npm run lint
npm run typecheck
npm run build
```
