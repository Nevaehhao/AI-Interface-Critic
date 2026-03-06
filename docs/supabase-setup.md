# Supabase Setup

## 1. Create project credentials

Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=ui-screenshots
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3
```

Use the publishable key when available. The app also accepts the legacy anon key for compatibility.

## 2. Enable auth providers

In the Supabase dashboard, enable:

- Google
- Apple
- Email

Set the site URL to your local or production app URL and add the callback path:

```text
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

## 3. Create the database table

Run [schema.sql](../supabase/schema.sql) in the SQL editor.

This creates:

- `public.analyses`
- RLS policy for viewing personal history
- RLS policy for inserting signed-in rows

## 4. Create the storage bucket

Create a public bucket named `ui-screenshots`.

The server uploads screenshots with the service role key so no client-side storage credentials are required for the MVP.

## 5. Deployment notes

- Deploy the Next.js app to Vercel
- Add the same Supabase and Ollama environment variables in Vercel
- Add the Vercel domain to Supabase Auth redirect URLs
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only
