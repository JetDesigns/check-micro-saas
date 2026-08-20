-- Early-access waitlist captured on the landing page.
--
-- Two survey answers plus an email. The answers are stored as short stable
-- slugs, not the prose the visitor read: the question wording will change as
-- the pitch is tuned, and rows written months apart still need to group. The
-- slug↔label mapping lives in lib/waitlist.ts, which the form and the API
-- route both import — one contract, not two copies.
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- 'almost_always' | 'often' | 'sometimes' | 'rarely_never'
  pain_frequency text not null,
  -- 'free_only' | 'usd_5_10' | 'usd_15_25' | 'usd_25_plus'
  price_willingness text not null,
  created_at timestamptz not null default now()
);

-- The route upserts on this, which makes a double-clicked submit harmless and
-- lets a visitor revise their answers by submitting again instead of leaving
-- two contradictory rows behind.
--
-- Indexed on the plain column rather than lower(email), because PostgREST's
-- on_conflict takes column names and cannot name an expression index — so a
-- lower(email) index would simply never be the arbiter and every repeat
-- submission would come back as a duplicate-key error. Case folding happens
-- on the way in instead (parseWaitlistSubmission lowercases), which keeps
-- Someone@Example.com and someone@example.com one person.
create unique index waitlist_email_key on public.waitlist (email);

-- Deny by default: RLS on, zero policies. anon and authenticated get nothing,
-- so the table is unreachable through PostgREST in either direction — a
-- public form must not double as a public mailing-list dump. Writes go
-- through /api/waitlist on the service role, which is the only thing that
-- validates the two answers against the allowlist.
alter table public.waitlist enable row level security;
