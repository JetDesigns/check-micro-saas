// Early-access waitlist: the option sets and the validation, in one place.
//
// The landing form renders from these arrays and /api/waitlist validates
// against the same ones, so a new option can never exist in the UI without
// the server accepting it — the failure mode that a second hand-maintained
// copy invites.
//
// `value` is what lands in the database and must not be reworded once rows
// exist; `label` is what the visitor reads and can be tuned freely.

export type WaitlistOption<T extends string> = {
  value: T
  label: string
}

export type PainFrequency =
  | 'almost_always'
  | 'often'
  | 'sometimes'
  | 'rarely_never'

export type PriceWillingness =
  | 'free_only'
  | 'usd_5_10'
  | 'usd_15_25'
  | 'usd_25_plus'

export const PAIN_FREQUENCY_QUESTION =
  'After finishing a design project, how often do you struggle to explain the business impact to your next prospect?'

export const PAIN_FREQUENCY_OPTIONS: WaitlistOption<PainFrequency>[] = [
  { value: 'almost_always', label: 'Almost always' },
  { value: 'often', label: 'Often' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'rarely_never', label: 'Rarely or never' },
]

export const PRICE_WILLINGNESS_QUESTION =
  'If a tool could help you turn finished design work into a business narrative ready to use with clients — in 15 minutes — what would be worth paying per project?'

export const PRICE_WILLINGNESS_OPTIONS: WaitlistOption<PriceWillingness>[] = [
  { value: 'free_only', label: "Wouldn't pay, needs to be free" },
  { value: 'usd_5_10', label: '$5–10' },
  { value: 'usd_15_25', label: '$15–25' },
  { value: 'usd_25_plus', label: '$25+ if the output is solid' },
]

// Same shape as the check in /api/checkout — deliberately loose. Address
// syntax has more edge cases than a regex should be trusted with, and the
// only thing this needs to catch is a visitor who typed their name.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Long enough for any real address, short enough that the column can't be
// used as free storage by someone posting to the endpoint directly.
export const EMAIL_MAX_LENGTH = 254

export type WaitlistSubmission = {
  email: string
  painFrequency: PainFrequency
  priceWillingness: PriceWillingness
}

export function isValidWaitlistEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= EMAIL_MAX_LENGTH &&
    EMAIL_RE.test(value)
  )
}

export function isPainFrequency(value: unknown): value is PainFrequency {
  return PAIN_FREQUENCY_OPTIONS.some((o) => o.value === value)
}

export function isPriceWillingness(value: unknown): value is PriceWillingness {
  return PRICE_WILLINGNESS_OPTIONS.some((o) => o.value === value)
}

// Returns the cleaned submission, or the name of the first field that failed
// so the route can say which one without leaking the raw input back.
export function parseWaitlistSubmission(
  body: unknown
): { ok: true; value: WaitlistSubmission } | { ok: false; field: string } {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

  // Lowercased here, not in the database: the unique index is on the plain
  // column (see migration 0011), so folding must happen before the write or
  // two casings of one address become two rows.
  const email =
    typeof b.email === 'string' ? b.email.trim().toLowerCase() : b.email
  if (!isValidWaitlistEmail(email)) return { ok: false, field: 'email' }
  if (!isPainFrequency(b.painFrequency)) return { ok: false, field: 'painFrequency' }
  if (!isPriceWillingness(b.priceWillingness)) {
    return { ok: false, field: 'priceWillingness' }
  }

  return {
    ok: true,
    value: {
      email,
      painFrequency: b.painFrequency,
      priceWillingness: b.priceWillingness,
    },
  }
}
