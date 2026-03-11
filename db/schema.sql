create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null,
  name text not null,
  description text,
  accent_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key,
  auth_user_id text not null,
  workspace_id uuid references workspaces(id) on delete set null,
  source text not null check (source in ('mock', 'ollama', 'openai-compatible')),
  product_type text not null,
  overall_score integer not null,
  main_finding text not null,
  screenshot_key text,
  report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspaces_auth_user_id
  on workspaces (auth_user_id, created_at desc);

create index if not exists idx_analyses_auth_user_id
  on analyses (auth_user_id, created_at desc);

create index if not exists idx_analyses_workspace_id
  on analyses (workspace_id, created_at desc);
