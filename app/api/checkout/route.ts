// POST /api/checkout
//
// Creates a Stripe Checkout Session for the $9 / 5-credit pack. Credits are
// user-scoped and unrelated to any specific case study — the pack is what
// gets bought, and /api/unlock spends one credit against a study later.
//
// Body: { caseStudyId?: string, email?: string }
//   caseStudyId — optional; carried through the redirect so the client can
//   restore the preview after Stripe sends the user back.
//   email — optional; Stripe collects one during checkout if not supplied.
//
// Returns: { url: string } — the Stripe-hosted checkout URL to redirect to.

import { getStripe } from '@/lib/stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const CREDITS_PER_PACK = 5

export async function POST(req: Request) {
  const priceId = process.env.STRIPE_PRICE_ID_PACK
  if (!priceId) {
    return Response.json(
      {
        error: 'stripe_disabled',
        message: 'STRIPE_PRICE_ID_PACK not set on the server.',
      },
      { status: 503 }
    )
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // Empty body is fine — caseStudyId and email are both optional.
  }
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const caseStudyId =
    typeof b.caseStudyId === 'string' && b.caseStudyId.length > 0
      ? b.caseStudyId
      : undefined
  const email =
    typeof b.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)
      ? b.email
      : undefined

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const origin = new URL(req.url).origin

  const successQuery = new URLSearchParams({ purchased: '1' })
  if (caseStudyId) successQuery.set('cs', caseStudyId)
  const cancelQuery = new URLSearchParams({ purchase_cancelled: '1' })
  if (caseStudyId) cancelQuery.set('cs', caseStudyId)

  const stripe = getStripe()
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${origin}/?${successQuery.toString()}&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?${cancelQuery.toString()}`,
      // Metadata is echoed back on the webhook. Stripe stores values as
      // strings, so serialize numbers.
      metadata: {
        user_id: user.id,
        credit_amount: String(CREDITS_PER_PACK),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          credit_amount: String(CREDITS_PER_PACK),
        },
      },
    })

    if (!session.url) {
      return Response.json({ error: 'stripe_no_url' }, { status: 502 })
    }

    return Response.json({ url: session.url })
  } catch (e) {
    console.error('[/api/checkout] stripe error:', e)
    return Response.json(
      {
        error: 'stripe_failed',
        message:
          e instanceof Error ? e.message : 'Stripe rejected the request.',
      },
      { status: 502 }
    )
  }
}
