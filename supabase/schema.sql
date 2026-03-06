create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  source text not null check (source in ('mock', 'ollama')),
  product_type text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  main_finding text not null,
  screenshot_url text,
  report jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

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
