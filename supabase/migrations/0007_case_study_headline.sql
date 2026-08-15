-- AI-generated compact case-study headline. Distinct from `title` (the user's
-- raw answer to "What was the project?") — headline is 6-10 words, angle-
-- or outcome-driven, designed to work as an H1 on the shareable page.
--
-- Nullable so old rows compiled before this feature keep working; UI falls
-- back to `title` when headline is null.
--
-- Unlike compiled_narrative, this column is safe to expose to authenticated
-- readers — it's an anonymized headline, not the paid body — so we extend
-- the existing SELECT grant to include it.

alter table public.case_studies
  add column headline text;

-- Migration 0005 revoked all SELECT and re-granted an explicit column list.
-- Add `headline` to that list; `compiled_narrative` intentionally stays off.
grant select (headline) on public.case_studies to authenticated;
