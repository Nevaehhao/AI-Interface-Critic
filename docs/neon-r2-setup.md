# Neon + R2 Setup

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

## 3. Create a Cloudflare R2 bucket

Create a bucket for screenshots, then generate an API token with object read and write access.

Add these values to `.env.local`:

```bash
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=ui-screenshots
R2_ENDPOINT=
```

`R2_ENDPOINT` is optional. If omitted, the app builds the default endpoint from `R2_ACCOUNT_ID`.

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

The setup page checks Ollama, Neon Auth, Neon Postgres, Cloudflare R2, and deployment readiness.
