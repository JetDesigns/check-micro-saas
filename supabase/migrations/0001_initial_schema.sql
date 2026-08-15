-- Check micro-SaaS — initial schema (authoritative).
-- Safe to re-run: drops existing objects first. Only do that while tables are empty.

-- ============================================================================
-- Reset
-- ============================================================================
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_email_updated on auth.users;

drop table if exists public.payments cascade;
drop table if exists public.answers cascade;
drop table if exists public.case_studies cascade;
drop table if exists public.users cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_user_email_update() cascade;
drop function if exists public.update_updated_at() cascade;

drop type if exists case_study_status cascade;
drop type if exists payment_status cascade;

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums
-- ============================================================================
-- draft    → wizard in progress
-- preview  → narrative compiled, only the "problem" section visible
-- paid     → payment succeeded, full narrative unlocked
-- complete → user has exported/finished
create type case_study_status as enum ('draft', 'preview', 'paid', 'complete');

create type payment_status as enum ('pending', 'succeeded', 'failed');

-- ============================================================================
-- Shared helpers
-- ============================================================================
create function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- Mirror of auth.users, populated by trigger.
-- email is nullable: anonymous users (signInAnonymously) have no email until
-- they link one at the payment/unlock step.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status case_study_status not null default 'draft',
  -- Nullable: the wizard starts before the user has named anything.
  title text,
  -- Canonical compiled narrative from /api/compile. Shape:
  -- { problem, approach, value_framing, outcome, cta }
  -- All three output formats render from this one object.
  compiled_narrative jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_studies_user_id_idx on public.case_studies(user_id);

create trigger case_studies_updated_at
  before update on public.case_studies
  for each row execute function public.update_updated_at();

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  -- Stable identifier for one of the 8 fixed interview questions,
  -- e.g. 'cost_before', 'why_this_approach'. Not the question text.
  question_key text not null,
  answer_text text not null,
  -- Number of AI follow-up probes already spent on this question.
  -- Capped at 2 in application code so the interview never drags.
  ai_followup_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_study_id, question_key)
);

create index answers_case_study_id_idx on public.answers(case_study_id);

create trigger answers_updated_at
  before update on public.answers
  for each row execute function public.update_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- Which case study this payment unlocks. Required by the unlock flow.
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  -- Smallest currency unit (cents).
  amount integer not null,
  currency text not null default 'usd',
  stripe_payment_id text unique,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments(user_id);
create index payments_case_study_id_idx on public.payments(case_study_id);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Sync public.users with auth.users
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When an anonymous user links an email at the unlock step, auth.users.email
-- changes. Propagate it so public.users stays accurate.
create function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.users        enable row level security;
alter table public.case_studies enable row level security;
alter table public.answers      enable row level security;
alter table public.payments     enable row level security;

-- users: read/update own row only. No insert policy — the trigger creates rows.
create policy "users: select own"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users: update own"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- case_studies: full CRUD on own rows. Works identically for anonymous and
-- email-linked users, since both have a real auth.uid().
create policy "case_studies: select own"
  on public.case_studies for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "case_studies: insert own"
  on public.case_studies for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "case_studies: update own"
  on public.case_studies for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "case_studies: delete own"
  on public.case_studies for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- answers: ownership derived from the parent case_study.
create policy "answers: select own"
  on public.answers for select
  to authenticated
  using (exists (
    select 1 from public.case_studies cs
    where cs.id = answers.case_study_id and cs.user_id = (select auth.uid())
  ));

create policy "answers: insert own"
  on public.answers for insert
  to authenticated
  with check (exists (
    select 1 from public.case_studies cs
    where cs.id = answers.case_study_id and cs.user_id = (select auth.uid())
  ));

create policy "answers: update own"
  on public.answers for update
  to authenticated
  using (exists (
    select 1 from public.case_studies cs
    where cs.id = answers.case_study_id and cs.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.case_studies cs
    where cs.id = answers.case_study_id and cs.user_id = (select auth.uid())
  ));

create policy "answers: delete own"
  on public.answers for delete
  to authenticated
  using (exists (
    select 1 from public.case_studies cs
    where cs.id = answers.case_study_id and cs.user_id = (select auth.uid())
  ));

-- payments: read-only for users. All writes go through the Stripe webhook
-- using the service-role key, which bypasses RLS.
create policy "payments: select own"
  on public.payments for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- Hardening
-- ============================================================================
-- Trigger functions must not be callable via PostgREST RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_update() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;

-- Supabase advisor will warn about "anonymous access policies" on the tables
-- above. That is INTENDED for this product: the wizard must run before login,
-- so anonymous users are legitimate authors of their own case_studies and
-- answers. The payments and users policies still guard by auth.uid().
