# Neon + Local Storage Setup

## 1. Create a Neon Postgres project

Create a free Neon Postgres database and copy the connection string into:

```bash
DATABASE_URL=
```

## 2. Create a Neon Auth project

Enable these providers in Neon Auth:

- Google
- Email and password

Then set:

```bash
NEON_AUTH_BASE_URL=
```

For local development, add:

```text
http://localhost:3000
```

as an allowed redirect or app URL in Neon Auth.

## 3. Configure local screenshot storage

The app now stores screenshots on local disk during development.

Add this value to `.env.local`:

```bash
LOCAL_SCREENSHOT_STORAGE_DIR=.data/screenshots
```

If omitted, the app defaults to `.data/screenshots` inside the project root.

## 4. Apply the database schema

Run [db/schema.sql](../db/schema.sql) against your Neon database.

This creates:

- `workspaces`
- `analyses`

## 5. Configure the app URL

Set the public app URL:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

When deployed, replace this with your live domain.

## 6. Verify setup

Run the app locally:

```bash
npm install
npm run dev
```

Then open:

```text
/setup
```

The setup page checks Ollama, Neon Auth, Neon Postgres, local screenshot storage, and deployment readiness.
