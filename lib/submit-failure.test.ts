import { describe, expect, it } from 'vitest'
import {
  describeSubmitFailure,
  isNetworkFailure,
  type SubmitStage,
} from './submit-failure'
import { DISCOURAGING_WORDS } from './wizard-steps'

// This exists because of a real half-hour. "Failed to fetch" sat on the review
// screen; the dev server log showed the request had never arrived; the cause was
// the Supabase project host returning NXDOMAIN. None of that was recoverable
// from what the screen said.

const STAGES: SubmitStage[] = ['save', 'upload', 'write']

/** What each browser actually raises. All four mean the same thing. */
function networkError(message: string): TypeError {
  return new TypeError(message)
}

describe('isNetworkFailure', () => {
  it.each([
    'Failed to fetch', // Chrome
    'Load failed', // Safari
    'NetworkError when attempting to fetch resource.', // Firefox
    'Network request failed', // React Native
  ])('recognises %j', (message) => {
    expect(isNetworkFailure(networkError(message))).toBe(true)
  })

  // A Supabase error names the constraint it hit, and the compile route already
  // turns its own failures into sentences. Those messages are the most specific
  // thing available and must reach the user unchanged.
  it('leaves a real error message alone', () => {
    expect(isNetworkFailure(new Error('duplicate key value violates unique constraint'))).toBe(
      false
    )
  })

  it('is not fooled by a TypeError from ordinary code', () => {
    expect(isNetworkFailure(new TypeError("Cannot read properties of undefined"))).toBe(false)
  })

  // The case the first version missed, and the only one that actually occurs
  // here: supabase-js catches the browser's TypeError and rethrows its own
  // class. Gating on `err.name === 'TypeError'` matched nothing in the wild.
  it('sees through an SDK wrapper class, which is how it really arrives', () => {
    class AuthRetryableFetchError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'AuthRetryableFetchError'
      }
    }
    expect(isNetworkFailure(new AuthRetryableFetchError('Failed to fetch'))).toBe(true)

    class StorageUnknownError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'StorageUnknownError'
      }
    }
    expect(isNetworkFailure(new StorageUnknownError('Failed to fetch'))).toBe(true)
  })

  it('survives a thrown non-Error, which is legal and happens', () => {
    expect(isNetworkFailure('Failed to fetch')).toBe(false)
    expect(isNetworkFailure(undefined)).toBe(false)
  })
})

describe('describeSubmitFailure', () => {
  it('never repeats the browser message back, because it says nothing', () => {
    for (const stage of STAGES) {
      const message = describeSubmitFailure(networkError('Failed to fetch'), stage)
      expect(message.toLowerCase()).not.toContain('failed to fetch')
      expect(message.length).toBeGreaterThan(40)
    }
  })

  // The first two calls go to Supabase, the third to this app's own route. A
  // single message for all three would send someone to check the wrong thing.
  it('names a different thing to check per stage', () => {
    const messages = STAGES.map((s) => describeSubmitFailure(networkError('Failed to fetch'), s))
    expect(new Set(messages).size).toBe(STAGES.length)
    expect(messages[0]).toContain('Supabase')
    expect(messages[2]).toContain('dev server')
  })

  it('says the answers are still there, because they are', () => {
    expect(describeSubmitFailure(networkError('Failed to fetch'), 'save')).toContain(
      'still on this page'
    )
  })

  it('passes a real message through, since it is the most specific thing available', () => {
    const msg = 'The Anthropic account is out of credit, so nothing could be written.'
    expect(describeSubmitFailure(new Error(msg), 'write')).toBe(msg)
  })

  it('falls back rather than rendering an empty string', () => {
    expect(describeSubmitFailure(new Error('   '), 'save')).toContain('could not be saved')
    expect(describeSubmitFailure(null, 'write')).toContain('could not be written')
  })

  // The wizard's standing copy rule reaches here too: an error is the easiest
  // place to accidentally blame the person for what went wrong.
  it('never phrases a failure as a judgement of the answer', () => {
    const all = STAGES.flatMap((s) => [
      describeSubmitFailure(networkError('Failed to fetch'), s),
      describeSubmitFailure(null, s),
    ])
    for (const message of all) {
      for (const word of DISCOURAGING_WORDS) {
        expect(message.toLowerCase()).not.toContain(word)
      }
    }
  })
})
