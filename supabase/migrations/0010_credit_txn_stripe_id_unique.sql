-- add_credits() guards against double-crediting a webhook retry with
--
--   if exists (select 1 from credit_transactions where stripe_payment_id = ...)
--
-- which is a read followed by a write. Two concurrent deliveries of the same
-- checkout.session.completed can both run the select before either inserts,
-- both see nothing, and both credit the account. Stripe does occasionally
-- deliver an event more than once, and retries are not serialized.
--
-- The unique index turns that race into a constraint violation: the losing
-- transaction aborts, the webhook returns 500, and Stripe's retry then takes
-- the idempotent path. Crediting twice stops being possible rather than
-- being merely unlikely.
--
-- Partial, because stripe_payment_id is null for every non-purchase ledger
-- row (unlock, signup_bonus). Postgres does allow repeated nulls in a plain
-- unique index, so this is belt-and-braces — but it also documents that the
-- constraint is about purchases only, and keeps the index off the rows that
-- will always dominate the table.
create unique index if not exists credit_transactions_stripe_payment_id_key
  on public.credit_transactions (stripe_payment_id)
  where stripe_payment_id is not null;
