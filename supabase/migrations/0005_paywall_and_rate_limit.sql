-- Fase D. Two independent hardening moves:
--
-- 1) Column-level paywall on case_studies.compiled_narrative.
--    RLS decides WHICH ROW; a grant decides WHICH COLUMN. Revoke SELECT on
--    the whole table from `authenticated`, then re-grant SELECT explicitly on
--    every column EXCEPT compiled_narrative. The browser reaches the narrative
--    only through /api/compile (returns just `situation`) and /api/unlock
--    (returns full, only after spend_credit succeeds via service role).
--
-- 2) Rate limit anonymous compile calls. Free preview means every visitor
--    triggers a paid Anthropic call (~$0.04); a single bad actor could burn
--    the API budget. Cap at 5 compiles per anonymous user per day.

-- ============================================================================
-- 1) compiled_narrative column-level paywall
-- ============================================================================
revoke select on public.case_studies from authenticated;

grant select
  (id, user_id, status, title, client_type, project_type, tone, intake,
   created_at, updated_at)
  on public.case_studies to authenticated;
-- Note: compiled_narrative is intentionally NOT granted. Access goes through
-- server routes using the service role client (lib/supabase/admin.ts).

-- ============================================================================
-- 2) Compile rate limit
-- ============================================================================
create table public.compile_attempts (
  user_id uuid not null references public.users(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);

-- Direct access is denied — the SECURITY DEFINER function below is the only
-- path in. RLS with zero policies = deny for non-owner roles.
alter table public.compile_attempts enable row level security;

-- Atomic upsert-and-check. RETURNING gives the post-increment count, and the
-- ON CONFLICT clause takes a row lock so two parallel calls can't both squeak
-- past the cap. Raises `rate_limit_exceeded` on overflow — /api/compile
-- catches it and returns HTTP 429.
create function public.rate_limit_compile(p_user_id uuid, p_max integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.compile_attempts (user_id, day, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day)
  do update set count = public.compile_attempts.count + 1
  returning count into v_count;

  if v_count > p_max then
    raise exception 'rate_limit_exceeded';
  end if;

  return v_count;
end;
$$;

revoke execute on function public.rate_limit_compile(uuid, integer)
  from public, anon;
grant execute on function public.rate_limit_compile(uuid, integer)
  to authenticated;
