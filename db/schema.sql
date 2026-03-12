create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null,
  name text not null,
  description text,
  accent_color text,
  tags text[] not null default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key,
  auth_user_id text not null,
  workspace_id uuid references workspaces(id) on delete set null,
  source text not null check (
    source in ('mock', 'ollama', 'openai-compatible', 'anthropic', 'gemini')
  ),
  product_type text not null,
  overall_score integer not null,
  main_finding text not null,
  screenshot_key text,
  share_enabled boolean not null default false,
  share_token text unique,
  report jsonb not null,
  created_at timestamptz not null default now()
);

alter table if exists workspaces
  add column if not exists tags text[] not null default '{}';

alter table if exists workspaces
  add column if not exists archived_at timestamptz;

alter table if exists analyses
  add column if not exists share_enabled boolean not null default false;

alter table if exists analyses
  add column if not exists share_token text unique;

create index if not exists idx_workspaces_auth_user_id
  on workspaces (auth_user_id, created_at desc);

create index if not exists idx_analyses_auth_user_id
  on analyses (auth_user_id, created_at desc);

create index if not exists idx_analyses_workspace_id
  on analyses (workspace_id, created_at desc);
