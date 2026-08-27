-- The two survey questions changed meaning on Aug 25, 2026 when Check's genre
-- flipped from sales collateral to portfolio case study.
--
-- The stored slugs did not change — 'often' is still 'often', 'usd_5_10' is
-- still 'usd_5_10'. That is exactly the danger: rows collected before and after
-- read as directly comparable and are not. One set answers "how often do you
-- struggle to explain business impact to a prospect", the other "how often do
-- you struggle to turn a project into a portfolio case study". Averaging them
-- would produce a number that means nothing.
--
-- Version stamp rather than a wipe. The pre-change answer is real data about a
-- real question; it just belongs to a different question. Deleting it to keep
-- the table tidy would destroy evidence to avoid a footnote.
alter table public.waitlist
  add column survey_version integer not null default 2;

-- Everything already in the table predates the change.
update public.waitlist set survey_version = 1;

comment on column public.waitlist.survey_version is
  '1 = sales-genre questions (pre Aug 25 2026). 2 = portfolio-genre questions. Never compare across versions; the slugs match but the questions do not. Bump this whenever the question wording changes meaning.';
