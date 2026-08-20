// What the landing page is allowed to offer right now.
//
// Two flags, deliberately separate, because they answer different questions:
//
//   EARLY_ACCESS_MODE — is the product itself open? While this is on, the
//   landing has exactly one live action: the early-access form. Nothing may
//   promise a purchase or start a case study.
//
//   DEMO_URL — does the intro video exist yet? Unrelated to the above: the
//   video may ship before the product opens, or long after.
//
// Both default to the closed state. A typo in an env var name should leave
// the page too quiet, never accidentally selling something that isn't ready.
//
// Module-level constants, same shape as GOOGLE_ENABLED in AuthGateModal:
// Next only inlines NEXT_PUBLIC_* when it is read as a static expression, and
// reading it once here keeps every caller on one answer instead of each
// re-deriving its own from a slightly different string comparison.

export const EARLY_ACCESS_MODE =
  process.env.NEXT_PUBLIC_EARLY_ACCESS_MODE !== 'false'

const rawDemoUrl = process.env.NEXT_PUBLIC_DEMO_URL?.trim()
export const DEMO_URL = rawDemoUrl && rawDemoUrl.length > 0 ? rawDemoUrl : null
