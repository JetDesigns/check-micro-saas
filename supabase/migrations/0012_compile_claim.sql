-- The idempotency guard in /api/compile checked `status` and let anything
-- still at 'draft' through. A compile takes about 150 seconds, and status
-- stays 'draft' for every one of them — so a second request arriving inside
-- that window sailed past the guard, made its own Anthropic call, and
-- overwrote the first result. Measured, not theorised: one case study,
-- two rows counted in compile_attempts, and the stored narrative changed
-- between two reads.
--
-- A status check cannot fix this, because the state it needs to observe
-- ("someone is working on this right now") did not exist. This adds it.

alter table public.case_studies
  add column compile_claimed_at timestamptz;

comment on column public.case_studies.compile_claimed_at is
  'When a compile started. Set by claim_compile(), cleared by /api/compile if the attempt fails. Not a status — see migration 0012 for why the enum was left alone.';

-- Atomic claim. The update is the lock: only one caller can match the WHERE
-- and write the timestamp, so the loser gets no row back and knows to wait.
--
-- Deliberately NOT a new value on case_study_status. That enum is branched on
-- in /c/[id], /api/unlock, /api/edit and the compile guard itself; adding a
-- value would mean auditing every one of those. A separate column touches
-- none of them.
--
-- Takes no user id, and scopes every statement to auth.uid(). Migration 0009
-- removed a p_user_id parameter from rate_limit_compile for exactly this
-- reason: a security-definer function that trusts a caller-supplied id lets
-- any signed-in user act on a stranger's row through PostgREST. Here that
-- would mean claiming someone else's draft and blocking their compile for
-- the whole stale window.
create function public.claim_compile(
  p_case_study_id uuid,
  p_stale_after interval
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed uuid;
  v_status public.case_study_status;
begin
  update public.case_studies
     set compile_claimed_at = now()
   where id = p_case_study_id
     and user_id = auth.uid()
     and status = 'draft'
     and (compile_claimed_at is null
          or compile_claimed_at < now() - p_stale_after)
  returning id into v_claimed;

  if v_claimed is not null then
    return 'claimed';
  end if;

  -- Nothing claimed. Work out why, so the route can answer correctly rather
  -- than treating "already finished" and "busy" as the same thing. Scoped to
  -- the caller too, so this cannot be used to probe other people's rows.
  select status into v_status
    from public.case_studies
   where id = p_case_study_id
     and user_id = auth.uid();

  if v_status is null then
    return 'not_found';
  elsif v_status = 'draft' then
    -- Draft, but the claim window is still open: another compile is running.
    return 'in_progress';
  else
    return 'already_done';
  end if;
end;
$$;

revoke execute on function public.claim_compile(uuid, interval) from public, anon;
grant execute on function public.claim_compile(uuid, interval) to authenticated;
