-- Phase 4 needs two things the schema does not have: somewhere to put the
-- block document the pipeline produces, and somewhere to record what each
-- agent call cost.

-- ---------------------------------------------------------------------------
-- The document
-- ---------------------------------------------------------------------------
--
-- A new column rather than reusing `compiled_narrative`. That column holds the
-- deleted 8-section shape in existing rows, and writing a second, incompatible
-- shape into it would leave a column whose meaning depends on the age of the
-- row — exactly the ambiguity Phase 6 would have to guess its way through.
-- The old column stays where it is, dead and typed `unknown`.

alter table public.case_studies
  add column document jsonb;

comment on column public.case_studies.document is
  'The CaseStudy block document from the agent pipeline: {spine, blocks}. Shape and validation rules live in lib/case-study-blocks.ts. Deliberately NOT selectable by `authenticated` — see below.';

-- Locking the column down takes an explicit revoke, and finding out why is
-- worth writing down.
--
-- Migration 0005 revoked SELECT on this table from `authenticated` and granted
-- it back column by column, so `authenticated` genuinely cannot see a new
-- column. It never touched `anon`, which still holds a **table-level** SELECT
-- grant — and a table-level grant covers every column, including ones added
-- years later. So `document` arrived readable by `anon`, and a column-level
-- `revoke select (document) ... from anon` is silently a no-op against a
-- table-level grant: the grant has to be replaced, not trimmed.
--
-- Nothing was ever exposed. Every RLS policy on case_studies names the
-- `authenticated` role, so `anon` matches no policy and reads zero rows
-- whatever its grants say. But the paywall should not rest on that single
-- layer, and the two roles being asymmetric is the kind of thing the next
-- person adding a column would have to rediscover the hard way.
--
-- `headline` (0007) and `meta` (0008) stay readable because they are
-- anonymised page furniture. The document is the thing people pay for.

revoke select on public.case_studies from anon;

grant select
  (id, user_id, status, title, headline, meta, client_type, project_type,
   tone, intake, created_at, updated_at)
  on public.case_studies to anon;

-- ---------------------------------------------------------------------------
-- Token accounting
-- ---------------------------------------------------------------------------
--
-- The spec asks for per-agent token logging from day one, and it is right to:
-- the pipeline makes up to four model calls per compile, the estimate is
-- $0.10–0.15, and there is currently no way to find out whether that estimate
-- is anywhere near true. Cost per compile against a $1.80 price is the number
-- that decides whether this business works.
--
-- One row per model call, not per compile, because the interesting question is
-- which agent is expensive — a synthesis retry costs several times what the
-- vision pass does.

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  -- 'extraction' | 'synthesis' | 'qa'. Text rather than an enum: this list
  -- will change while the pipeline is being tuned, and a check constraint on
  -- a diagnostic table buys nothing.
  agent text not null,
  model text not null,
  -- 0 for the first attempt, 1+ for QA-driven retries.
  attempt integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  duration_ms integer not null default 0,
  ok boolean not null default true,
  -- Populated when ok is false. The failure is worth as much as the success:
  -- a truncated response and a refusal look identical in a token count.
  error text,
  created_at timestamptz not null default now()
);

create index agent_runs_case_study_id_idx
  on public.agent_runs (case_study_id, created_at);

-- RLS on with zero policies: deny all. Nothing outside the service role has
-- any business reading this, and the waitlist table (0011) already establishes
-- the pattern in this schema.
alter table public.agent_runs enable row level security;

revoke all on public.agent_runs from anon, authenticated;
