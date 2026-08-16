// POST /api/stripe/webhook
//
// Stripe → us, signed callback. On `checkout.session.completed` we credit
// the buyer's account:
//   1. Verify signature (STRIPE_WEBHOOK_SECRET) — refuses a fake `paid` event.
//   2. Call add_credits(user_id, credit_amount, session.id) via service role
//      — the RPC is idempotent on stripe_payment_id, so it is both the thing
//      that grants the credits and the gate that stops a retry granting them
//      twice. Nothing else may gate this; see the comment at the call site.
//   3. Record a `payments` row (upsert on the unique stripe_payment_id).
//   4. Attach the email Stripe collected to the anon user so they can sign
//      back in later via magic link.
//
// The pack model means we do NOT flip any case_study to 'paid' here — that
// happens later inside spend_credit() when the user hits /api/unlock.
//
// Stripe CLI in local dev prints `whsec_...` on start; that value must be
// STRIPE_WEBHOOK_SECRET.

import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return Response.json(
      {
        error: 'webhook_disabled',
        message: 'STRIPE_WEBHOOK_SECRET not set on the server.',
      },
      { status: 503 }
    )
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'missing_signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (e) {
    console.error('[/api/stripe/webhook] signature verify failed:', e)
    return Response.json({ error: 'bad_signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session

  const userId = session.metadata?.user_id
  const creditAmountStr = session.metadata?.credit_amount
  const email = session.customer_details?.email ?? session.customer_email

  if (!userId || !creditAmountStr) {
    console.error(
      '[/api/stripe/webhook] session missing metadata:',
      session.id
    )
    return Response.json({ error: 'missing_metadata' }, { status: 400 })
  }

  const creditAmount = Number.parseInt(creditAmountStr, 10)
  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    console.error(
      '[/api/stripe/webhook] invalid credit_amount:',
      creditAmountStr
    )
    return Response.json({ error: 'invalid_credit_amount' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Credit FIRST, then record the payment.
  //
  // add_credits() is the idempotency gate — it guards on
  // credit_transactions.stripe_payment_id inside a single statement, so
  // calling it on every delivery of the same event is safe. The payments row
  // is bookkeeping and must not gate anything: an earlier version checked
  // `payments` first and returned 200 `already_processed`, which meant a
  // failure between the insert and the credit left the buyer paid and
  // uncredited, with every Stripe retry short-circuiting on the row the
  // failed attempt had already written.
  //
  // With this order every partial failure converges on retry, and the worst
  // case flips to "credited, payments row still missing" — recoverable from
  // Stripe's own record, unlike the reverse.
  const { data: newBalance, error: creditError } = await admin.rpc(
    'add_credits',
    {
      p_user_id: userId,
      p_amount: creditAmount,
      p_stripe_payment_id: session.id,
    }
  )

  if (creditError) {
    console.error(
      '[/api/stripe/webhook] add_credits failed:',
      creditError
    )
    return Response.json({ error: creditError.message }, { status: 500 })
  }

  // stripe_payment_id is unique, so a redelivery lands on the conflict and
  // leaves the original row untouched instead of erroring.
  const { error: paymentError } = await admin.from('payments').upsert(
    {
      user_id: userId,
      // Pack purchase isn't tied to a specific study — column is nullable.
      case_study_id: null,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      stripe_payment_id: session.id,
      status: 'succeeded',
    },
    { onConflict: 'stripe_payment_id', ignoreDuplicates: true }
  )

  // Credits are already granted at this point, so this 500 is asking Stripe
  // to retry the bookkeeping, not the money. add_credits() no-ops next time.
  if (paymentError) {
    console.error(
      '[/api/stripe/webhook] record payment failed (credits already granted):',
      paymentError
    )
    return Response.json({ error: paymentError.message }, { status: 500 })
  }

  // Attach the email Stripe verified — non-fatal if it fails.
  if (email) {
    const { error: updateUserError } =
      await admin.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
      })
    if (updateUserError) {
      console.error(
        '[/api/stripe/webhook] failed to attach email to user:',
        updateUserError
      )
    }
  }

  return Response.json({
    received: true,
    credited: creditAmount,
    balance: newBalance,
  })
}
