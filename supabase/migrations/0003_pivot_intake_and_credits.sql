-- Pivot: stepper interview → single-page intake form, and per-study payment →
-- credit balance. See the plan for why; the short version is that the product
-- now mirrors casestudydesigner.app's flow with business framing.
--
-- Tables are empty at time of writing, so drops are safe.

-- ============================================================================
-- case_studies: intake fields
-- ============================================================================
-- The form is submitted in one shot, so per-field rows buy nothing. The whole
-- form lives in `intake`; the columns below are pulled out because they either
-- steer compilation (project_type, tone) or get displayed in listings.
alter table public.case_studies
  add column client_type text,
  add column project_type text,
  add column tone text,
  add column intake jsonb;

alter table public.case_studies
  add constraint case_studies_project_type_check
  check (project_type is null or project_type in ('focused_fix', 'zero_to_one', 'advisory'));

alter table public.case_studies
  add constraint case_studies_tone_check
  check (tone is null or tone in ('professional', 'direct', 'confident', 'data_driven', 'warm'));

-- ============================================================================
-- answers: obsolete
-- ============================================================================
-- The Q&A model is gone. Intake is a single jsonb blob; AI probing moved to
-- the post-generation review agent.
drop table if exists public.answers cascade;

-- ============================================================================
-- review_messages: AI review agent transcript
-- ============================================================================
create type review_role as enum ('user', 'agent');

create table public.review_messages (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  role review_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index review_messages_case_study_id_idx
  on public.review_messages(case_study_id, created_at);

alter table public.review_messages enable row level security;

create policy "review_messages: select own"
  on public.review_messages for select
  to authenticated
  using (exists (
    select 1 from public.case_studies cs
    where cs.id = review_messages.case_study_id
      and cs.user_id = (select auth.uid())
  ));

create policy "review_messages: insert own"
  on public.review_messages for insert
  to authenticated
  with check (exists (
    select 1 from public.case_studies cs
    where cs.id = review_messages.case_study_id
      and cs.user_id = (select auth.uid())
  ));

-- ============================================================================
-- Credits
-- ============================================================================
alter table public.users
  add column credit_balance integer not null default 0
  constraint users_credit_balance_non_negative check (credit_balance >= 0);

-- SECURITY: the existing "users: update own" policy grants UPDATE on the whole
-- row, which would let any user set their own credit_balance. RLS has no
-- column-level control, so gate columns with grants instead: RLS decides WHICH
-- ROW, the grant decides WHICH COLUMNS. Balance is written only by
-- spend_credit() (security definer) and the Stripe webhook (service role).
revoke update on public.users from authenticated;
grant update (email) on public.users to authenticated;

-- Audit ledger. A bare balance can't answer "why does this user have 3 credits"
-- during a payment dispute; this can.
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- Positive for purchases, negative for spends.
  delta integer not null,
  -- 'purchase' | 'unlock' | 'refund' | 'grant'
  reason text not null,
  case_study_id uuid references public.case_studies(id) on delete set null,
  stripe_payment_id text,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_id_idx
  on public.credit_transactions(user_id, created_at desc);

alter table public.credit_transactions enable row level security;

-- Read-only for users. All writes go through spend_credit() or the webhook.
create policy "credit_transactions: select own"
  on public.credit_transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- payments: now buys a pack, not one case study
-- ============================================================================
alter table public.payments alter column case_study_id drop not null;

-- ============================================================================
-- spend_credit(): atomic unlock
-- ============================================================================
-- Doing this client-side opens a race — two tabs could unlock two case studies
-- with one credit. Balance check, decrement, ledger entry, and status flip all
-- happen inside one transaction with row locks.
--
-- Lock order is always case_studies → users so concurrent callers can't
-- deadlock against each other.
create function public.spend_credit(p_case_study_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_status public.case_study_status;
  v_balance integer;
begin
  select cs.user_id, cs.status
    into v_user_id, v_status
    from public.case_studies cs
   where cs.id = p_case_study_id
     for update;

  if v_user_id is null then
    raise exception 'case_study_not_found';
  end if;

  if v_user_id <> (select auth.uid()) then
    raise exception 'not_owner';
  end if;

  if v_status in ('paid', 'complete') then
    raise exception 'already_unlocked';
  end if;

  select u.credit_balance
    into v_balance
    from public.users u
   where u.id = v_user_id
     for update;

  if v_balance < 1 then
    raise exception 'insufficient_credits';
  end if;

  update public.users
     set credit_balance = credit_balance - 1
   where id = v_user_id;

  insert into public.credit_transactions (user_id, delta, reason, case_study_id)
  values (v_user_id, -1, 'unlock', p_case_study_id);

  update public.case_studies
     set status = 'paid'
   where id = p_case_study_id;

  return v_balance - 1;
end;
$$;

revoke execute on function public.spend_credit(uuid) from public;
grant execute on function public.spend_credit(uuid) to authenticated;

-- ============================================================================
-- add_credits(): called by the Stripe webhook (service role)
-- ============================================================================
-- Idempotent on stripe_payment_id so a webhook retry can't double-credit.
create function public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_stripe_payment_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  -- Stripe retries failed webhooks; this must be safe to run twice.
  if exists (
    select 1 from public.credit_transactions
     where stripe_payment_id = p_stripe_payment_id
  ) then
    select credit_balance into v_balance from public.users where id = p_user_id;
    return v_balance;
  end if;

  update public.users
     set credit_balance = credit_balance + p_amount
   where id = p_user_id
   returning credit_balance into v_balance;

  if v_balance is null then
    raise exception 'user_not_found';
  end if;

  insert into public.credit_transactions
    (user_id, delta, reason, stripe_payment_id)
  values (p_user_id, p_amount, 'purchase', p_stripe_payment_id);

  return v_balance;
end;
$$;

-- Service role only — never callable from the browser.
revoke execute on function public.add_credits(uuid, integer, text) from public;
revoke execute on function public.add_credits(uuid, integer, text) from authenticated;
grant execute on function public.add_credits(uuid, integer, text) to service_role;
