create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  accent_color text default '#1a73e8',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  source text not null check (source in ('mock', 'ollama')),
  product_type text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  main_finding text not null,
  screenshot_url text,
  report jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspaces_user_id_created_at_idx
  on public.workspaces (user_id, created_at desc);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

create index if not exists analyses_workspace_id_created_at_idx
  on public.analyses (workspace_id, created_at desc);

alter table public.workspaces enable row level security;
alter table public.analyses enable row level security;

drop policy if exists "Users can view their own workspaces" on public.workspaces;
create policy "Users can view their own workspaces"
  on public.workspaces
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workspaces" on public.workspaces;
create policy "Users can insert their own workspaces"
  on public.workspaces
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workspaces" on public.workspaces;
create policy "Users can update their own workspaces"
  on public.workspaces
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own analyses" on public.analyses;
create policy "Users can view their own analyses"
  on public.analyses
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own analyses" on public.analyses;
create policy "Users can insert their own analyses"
  on public.analyses
  for insert
  with check (auth.uid() = user_id);
