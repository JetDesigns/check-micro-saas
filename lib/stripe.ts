import 'server-only'
import Stripe from 'stripe'

// Single Stripe client used by both /api/checkout and /api/stripe/webhook.
// `apiVersion` pins the API shape so a Stripe-side change can't silently
// break our webhook payload assumptions.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set on the server.')
  }
  return new Stripe(key, { apiVersion: '2026-07-29.dahlia' })
}
