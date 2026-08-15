-- Close a cross-user hole in the compile rate limiter.
--
-- The 0005 signature was rate_limit_compile(p_user_id uuid, p_max integer),
-- SECURITY DEFINER, granted to `authenticated`. Both arguments came from the
-- caller and the body used p_user_id verbatim — it never checked auth.uid().
-- Any signed-in user could therefore POST to
--   /rest/v1/rpc/rate_limit_compile  {"p_user_id": "<someone else>", "p_max": 0}
-- and burn a stranger's daily compile quota. Not a data or money leak, but a
-- trivial denial-of-service against a named user.
--
-- spend_credit() already got this right (it raises 'not_owner' when
-- v_user_id <> auth.uid()); the rate limiter was simply missed.
--
-- Fix: the caller no longer names the user. The counter is always keyed to
-- auth.uid(), so the only quota you can spend is your own. p_max stays a
-- parameter because the cap is an application policy (DAILY_COMPILE_LIMIT),
-- and passing a large one only inflates your own counter — it cannot buy
-- extra compiles, since /api/compile always passes the real cap.

-- Old signature goes away entirely so no caller can reach the unsafe form.
drop function if exists public.rate_limit_compile(uuid, integer);

create function public.rate_limit_compile(p_max integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_count integer;
begin
  -- The identity comes from the JWT, never from the caller's arguments.
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.compile_attempts (user_id, day, count)
  values (v_user_id, current_date, 1)
  on conflict (user_id, day)
  do update set count = public.compile_attempts.count + 1
  returning count into v_count;

  if v_count > p_max then
    raise exception 'rate_limit_exceeded';
  end if;

  return v_count;
end;
$$;

revoke execute on function public.rate_limit_compile(integer)
  from public, anon;
grant execute on function public.rate_limit_compile(integer)
  to authenticated;
