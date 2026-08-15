-- Structured meta grid for the CSD-style case-study page header:
--   { role, client, audience, platform }
--
-- Rendered as the 4-column meta row under the H1. Distinct from `intake`
-- (the user's raw answers) — `meta` is AI-inferred, anonymized, and shaped
-- specifically for the public page header. Nullable so old rows without a
-- meta grid keep rendering; UI degrades gracefully when null.
--
-- Same trust profile as `headline` (migration 0007): anonymized, pre-paywall,
-- safe to expose to authenticated readers. `compiled_narrative` stays revoked.

alter table public.case_studies
  add column meta jsonb;

-- Migration 0005 revoked all SELECT and re-granted an explicit column list.
-- Extend that list with `meta`; `compiled_narrative` intentionally stays off.
grant select (meta) on public.case_studies to authenticated;
