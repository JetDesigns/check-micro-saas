// What the landing page is allowed to offer right now.
//
// Two flags, deliberately separate, because they answer different questions:
//
//   EARLY_ACCESS_MODE — are we selling yet? While this is on, the landing
//   makes no purchase offer: the "Buy credit" button is not rendered at all,
//   and the early-access form is the thing to do instead.
//
//   It used to gate the wizard's write action too. It no longer does —
//   generating a case study spends our own Anthropic credit rather than a
//   visitor's money, so the two were never the same question, and being able
//   to run the product without editing an env var matters more right now.
//   See the note in IntakeForm.handleSubmit before deploying.
//
//   DEMO_URL — does the intro video exist yet? Unrelated to the above: the
//   video may ship before the product opens, or long after.
//
// Both default to the closed state. A typo in an env var name should leave
// the page too quiet, never accidentally selling something that isn't ready.
// That property still holds for the thing it now guards: payment.
//
// Module-level constants, same shape as GOOGLE_ENABLED in AuthGateModal:
// Next only inlines NEXT_PUBLIC_* when it is read as a static expression, and
// reading it once here keeps every caller on one answer instead of each
// re-deriving its own from a slightly different string comparison.

export const EARLY_ACCESS_MODE =
  process.env.NEXT_PUBLIC_EARLY_ACCESS_MODE !== 'false'

const rawDemoUrl = process.env.NEXT_PUBLIC_DEMO_URL?.trim()
export const DEMO_URL = rawDemoUrl && rawDemoUrl.length > 0 ? rawDemoUrl : null
