// What to say when submitting the wizard fails.
//
// Written after a real one: "Failed to fetch" sat on the review screen and told
// nobody anything. It is what the browser raises for every network-level
// failure — DNS, CORS, offline, a refused connection — and `err.message` was
// being rendered verbatim. The actual cause that day was the Supabase project
// host returning NXDOMAIN, which is three questions away from "Failed to fetch"
// and none of them are the user's to ask.
//
// A pure function so it can be tested, and so the copy sits with the rest of the
// wizard's strings rather than inside a component where nothing checks it.

/** Which call was in flight. Submitting makes three, and they fail differently. */
export type SubmitStage = 'save' | 'upload' | 'write'

/**
 * True for the failures where no HTTP response came back at all.
 *
 * The browser gives almost nothing to go on: Chrome raises a TypeError reading
 * "Failed to fetch", Safari "Load failed", Firefox "NetworkError when attempting
 * to fetch resource". None of them say whether it was DNS, CORS, a refused
 * connection or an offline machine — that distinction is withheld from
 * JavaScript deliberately, so it cannot be recovered by trying harder here.
 *
 * MATCHED ON THE MESSAGE, NOT THE CONSTRUCTOR. The first version of this
 * required `err.name === 'TypeError'` and caught nothing at all in practice,
 * because supabase-js rethrows as `AuthRetryableFetchError` and other SDKs wrap
 * it too. The name is whatever the layer above chose to call it; the message is
 * the browser's and survives the wrapping.
 */
const NETWORK_MESSAGES = [
  'failed to fetch', // Chrome, Edge
  'load failed', // Safari
  'networkerror', // Firefox
  'network request failed', // React Native
]

export function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const m = err.message.toLowerCase()
  return NETWORK_MESSAGES.some((needle) => m.includes(needle))
}

const UNREACHABLE: Record<SubmitStage, string> = {
  // The first two talk to Supabase directly from the browser; the third talks to
  // this app's own API route, so "the server" means something different and the
  // thing to check is different too.
  save: 'Could not reach the database, so nothing was saved. Your answers are still on this page. Check that the Supabase project in .env.local still exists and that you are online.',
  upload:
    'The case study was saved, but the screens could not be uploaded — the storage bucket was unreachable. Check the Supabase project and try again.',
  write:
    'Could not reach this app’s own server. The dev server may have stopped. Your answers are still on this page.',
}

const FALLBACK: Record<SubmitStage, string> = {
  save: 'The case study could not be saved. Your answers are still on this page.',
  upload: 'The case study was saved, but the screens could not be uploaded.',
  write: 'The case study could not be written. Your answers are still on this page.',
}

/**
 * A sentence the person can act on, plus the stage it failed at.
 *
 * Never returns the raw message for a network failure, because that message is
 * always one of four useless strings. For everything else the underlying message
 * is the most specific thing available — a Supabase error names the constraint,
 * and the API route already translates its own failures into readable sentences
 * (see readableFailure in app/api/compile/route.ts) — so it is passed through.
 */
export function describeSubmitFailure(err: unknown, stage: SubmitStage): string {
  if (isNetworkFailure(err)) return UNREACHABLE[stage]
  const message = err instanceof Error ? err.message.trim() : ''
  return message || FALLBACK[stage]
}

/**
 * The full cause, for the console.
 *
 * The sentence above is deliberately short, so the detail has to go somewhere —
 * and a network failure carries nothing in its message, so the useful part is
 * which call was in flight and what it was trying to reach.
 */
export function logSubmitFailure(err: unknown, stage: SubmitStage, target?: string): void {
  console.error(
    `[studio] submit failed at "${stage}"${target ? ` (${target})` : ''}:`,
    err instanceof Error ? `${err.name}: ${err.message}` : err,
    err
  )
}
