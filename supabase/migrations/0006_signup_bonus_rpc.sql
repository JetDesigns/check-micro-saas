-- Signup bonus: one free credit granted the first time a user completes an
-- email magic-link login. Idempotent per user_id via the credit_transactions
-- ledger — if we've already inserted a 'signup_bonus' row for this user, we
-- return the current balance without crediting again. Same pattern as
-- add_credits() using stripe_payment_id for webhook idempotency.
--
-- Service-role only. The client never calls this directly — the
-- /auth/callback route invokes it after the session exchange succeeds.

create function public.grant_signup_bonus(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  -- Idempotent guard. One bonus per user_id, ever.
  if exists (
    select 1 from public.credit_transactions
     where user_id = p_user_id
       and reason = 'signup_bonus'
  ) then
    select credit_balance into v_balance
      from public.users
     where id = p_user_id;
    return v_balance;
  end if;

  update public.users
     set credit_balance = credit_balance + 1
   where id = p_user_id
   returning credit_balance into v_balance;

  if v_balance is null then
    raise exception 'user_not_found';
  end if;

  insert into public.credit_transactions (user_id, delta, reason)
  values (p_user_id, 1, 'signup_bonus');

  return v_balance;
end;
$$;

-- Service-role only — never callable from the browser.
revoke execute on function public.grant_signup_bonus(uuid) from public, anon, authenticated;
grant execute on function public.grant_signup_bonus(uuid) to service_role;
