-- The Focused Fix generation path: where the page lands, and what stops the
-- vision pass running twice over the same screens.
--
-- Three things, all on the paid side of the paywall or invisible to the browser
-- entirely. Nothing here is granted to `authenticated` — migration 0014 set that
-- precedent for `document` and the rule it wrote down is that any new
-- AI-written column picks a side before anything is granted.

-- ---------------------------------------------------------------------------
-- 1. The generated page
-- ---------------------------------------------------------------------------
--
-- A different shape from `document`, which holds the {spine, blocks} object the
-- legacy pipeline writes. The spec path produces markdown plus the figures and
-- the variance register that go with it, and the two paths run side by side
-- behind a dev flag — so this is a second column rather than a reinterpretation
-- of the first.

alter table public.case_studies
  add column if not exists generated jsonb;

comment on column public.case_studies.generated is
  'The Focused Fix envelope: { markdown, figures, variance_register, branch }. '
  'Page content, so it sits on the paid side of the paywall — no SELECT grant to '
  'authenticated, the same side as `document`.';

-- ---------------------------------------------------------------------------
-- 2. The extraction cache
-- ---------------------------------------------------------------------------
--
-- Ablation regenerates one row many times with a single input blanked, and the
-- vision pass is the slow leg. Re-running it each time costs money, but the
-- reason this table exists is accuracy: extraction is nondeterministic, so its
-- descriptions drift slightly between runs and that drift lands in the ablation
-- diff as noise that is not the blanked field.
--
-- KEYED ON THE SET, NOT JUST THE FILE. runExtraction makes one batched call for
-- every image on purpose — it lets the model see the set as a set, so which
-- screen is the overview and which is a detail is answerable at all. A
-- description written for a six-image set is therefore not valid inside a
-- three-image set, and keying on file content alone would serve context-
-- dependent text into a different context. Rows are per attachment; validity is
-- scoped to the set the description was written in.
--
-- Invalidation needs no TTL, because every part of the key is immutable: the
-- bytes change the content hash, adding or removing a screen changes the set
-- hash, the prompt version is bumped by hand when EXTRACTION_SYSTEM changes, and
-- the model id is in the key so switching models misses rather than serving
-- descriptions written by a different one.

create table if not exists public.attachment_extractions (
  content_hash   text        not null,
  set_hash       text        not null,
  prompt_version integer     not null,
  model          text        not null,
  description    jsonb       not null,
  created_at     timestamptz not null default now(),
  primary key (content_hash, set_hash, prompt_version, model)
);

comment on table public.attachment_extractions is
  'Vision-pass descriptions, one row per attachment, valid only within the set '
  'they were produced in. Service role only — never exposed to the browser.';

-- The lookup is always "every row for this set", so that is the index.
create index if not exists attachment_extractions_set_idx
  on public.attachment_extractions (set_hash, prompt_version, model);

alter table public.attachment_extractions enable row level security;

-- No policies, deliberately. RLS with no policy denies every row to `anon` and
-- `authenticated`; the service role bypasses RLS and is the only reader. A table
-- with RLS enabled and no policy is the closed default — adding a policy later
-- is a decision someone has to make on purpose.

revoke all on public.attachment_extractions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Cache accounting on agent_runs
-- ---------------------------------------------------------------------------
--
-- The spec goes first in the system prompt with a cache breakpoint after it,
-- because it is byte-identical on every run. There is no way to tell whether
-- that is working without these two numbers: a silent invalidator — a timestamp
-- in the prefix, a reordered key — shows up as cache reads that are always zero,
-- and nothing else about the request looks wrong.

alter table public.agent_runs
  add column if not exists cache_read_input_tokens integer not null default 0,
  add column if not exists cache_creation_input_tokens integer not null default 0;

comment on column public.agent_runs.cache_read_input_tokens is
  'usage.cache_read_input_tokens. Zero across repeated runs means the prompt '
  'prefix is not stable and the cache never hits.';
