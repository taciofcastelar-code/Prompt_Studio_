-- Prompt Studio V4.1 Intelligence
-- Migration inicial. Aplicar em projeto Supabase exclusivo.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  objective text,
  context jsonb not null default '{}'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  success_criteria jsonb not null default '[]'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text,
  current_text text not null,
  status text not null default 'draft',
  favorite boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  version_number integer not null,
  text text not null,
  optimization_mode text,
  change_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(prompt_id, version_number)
);

create table if not exists public.prompt_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_version_id uuid not null references public.prompt_versions(id) on delete cascade,
  clarity numeric not null check (clarity between 0 and 100),
  context_score numeric not null check (context_score between 0 and 100),
  specificity numeric not null check (specificity between 0 and 100),
  assertiveness numeric not null check (assertiveness between 0 and 100),
  efficiency numeric not null check (efficiency between 0 and 100),
  authenticity numeric not null check (authenticity between 0 and 100),
  creativity numeric not null check (creativity between 0 and 100),
  success_criteria numeric not null check (success_criteria between 0 and 100),
  overall_score numeric not null check (overall_score between 0 and 100),
  diagnostics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  prompt_version_id uuid references public.prompt_versions(id) on delete set null,
  result_text text,
  execution_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.result_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  execution_id uuid not null references public.prompt_executions(id) on delete cascade,
  outcome text not null check (outcome in ('success','partial','failure')),
  quality smallint check (quality between 1 and 5),
  needed_reformulation boolean,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  prompt_id uuid references public.prompts(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists prompts_user_id_idx on public.prompts(user_id);
create index if not exists prompts_project_id_idx on public.prompts(project_id);
create index if not exists prompt_versions_prompt_id_idx on public.prompt_versions(prompt_id);
create index if not exists executions_prompt_id_idx on public.prompt_executions(prompt_id);
create index if not exists learning_events_user_id_idx on public.learning_events(user_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.prompt_scores enable row level security;
alter table public.prompt_executions enable row level security;
alter table public.result_feedback enable row level security;
alter table public.learning_events enable row level security;
alter table public.user_preferences enable row level security;

create policy "profiles_own_all" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "projects_own_all" on public.projects
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "prompts_own_all" on public.prompts
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "prompt_versions_own_all" on public.prompt_versions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "prompt_scores_own_all" on public.prompt_scores
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "prompt_executions_own_all" on public.prompt_executions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "result_feedback_own_all" on public.result_feedback
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "learning_events_own_all" on public.learning_events
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_preferences_own_all" on public.user_preferences
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
