'use client'

import { useCallback, useEffect, useState } from 'react'
import { AuthGateModal } from '@/components/auth/AuthGateModal'
import { createClient } from '@/lib/supabase/client'
import { ensureAnonymousSession } from '@/lib/supabase/anon'
import { getCreditBalance } from '@/lib/case-studies'
import { EARLY_ACCESS_MODE } from '@/lib/launch-mode'

// Landing-page top bar: wordmark left, nav + Buy credit right.
//
// Three session states, and only the third counts as "logged in":
//   • no session at all — first-time visitor who hasn't touched the form
//   • anonymous session — started the wizard; owns rows, but has no email
//   • email session      — signed up, and the only state where credits are
//                          durably theirs
//
// Buying requires a session because /api/checkout 401s without one, and it
// requires an EMAIL session because credits bought against a throwaway anon
// identity would be unrecoverable once cookies clear. Signed-out users get
// the auth modal first; the landing resumes into Stripe on the way back.

// Where to land after login when the user was trying to buy. The landing page
// picks `?checkout=1` up and continues into Stripe automatically.
const CHECKOUT_RETURN = '/?checkout=1'

type Session = 'unknown' | 'none' | 'anon' | 'email'

export function TopBar() {
  const [session, setSession] = useState<Session>('unknown')
  const [balance, setBalance] = useState<number | null>(null)
  const [modal, setModal] = useState<null | { returnTo: string; variant: 'buy' | 'signup' }>(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readSession = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSession('none')
        setBalance(null)
        return
      }
      if (!user.email) {
        setSession('anon')
        setBalance(null)
        return
      }
      setSession('email')

      // Balance is fetched in its own try: a failed lookup must not fall
      // through to the catch below and downgrade the session to 'none'. That
      // would show a signed-in user the signed-out bar and, worse, send them
      // to the login modal instead of straight to Stripe when they click Buy.
      // Losing the number is fine; losing the session is not.
      try {
        setBalance(await getCreditBalance())
      } catch {
        setBalance(null)
      }
    } catch {
      // Never let the bar break the page — fall back to the signed-out view.
      setSession('none')
      setBalance(null)
    }
  }, [])

  useEffect(() => {
    // readSession only setStates after `await supabase.auth.getUser()`, i.e.
    // from the promise callback — the pattern this rule exists to allow. The
    // rule walks into the callee without distinguishing pre- from post-await,
    // so it flags the call site regardless.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void readSession()
  }, [readSession])

  const startCheckout = async () => {
    if (isStartingCheckout) return
    setError(null)
    setIsStartingCheckout(true)
    try {
      // /api/checkout needs a user; an email session already has one, but
      // this is cheap insurance against a session that expired mid-visit.
      await ensureAnonymousSession()

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      const body = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
        message?: string
      }
      if (!res.ok || !body.url) {
        throw new Error(
          body.message || body.error || `Checkout failed (HTTP ${res.status})`
        )
      }
      window.location.href = body.url
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start checkout. Please try again.'
      )
      setIsStartingCheckout(false)
    }
  }

  const onBuyClick = () => {
    if (session === 'email') {
      void startCheckout()
      return
    }
    // No email on file — log in first, then the landing page resumes the
    // purchase via ?checkout=1. Mirror the intent into localStorage as well:
    // Supabase drops our `?next=` when /auth/callback isn't whitelisted, and
    // the query flag would go with it.
    try {
      window.localStorage.setItem('check.pendingCheckout', '1')
    } catch {
      // Private mode — the query-param path still covers the happy case.
    }
    setModal({ returnTo: CHECKOUT_RETURN, variant: 'buy' })
  }

  // Drives the whole control's shape, so it has to be one decision: either
  // there is a balance to show (wrapper + nested button) or there isn't
  // (bare button). Hiding just the number responsively would leave an empty
  // white pill padded around the button.
  //
  // `> 0`, not `!== null`: a "0 credits" pill sitting next to a Buy button
  // says the same thing twice. When the balance is empty the button alone is
  // the clearer message.
  const showBalance = session === 'email' && balance !== null && balance > 0

  return (
    <>
      <header className="flex items-center justify-between gap-6">
        {/* Wordmark is one text node so the flex gap only separates it from
            the glyph — otherwise the full stop drifts away from the "k". */}
        <span className="inline-flex items-center gap-2 text-[19px] font-semibold tracking-tight text-ink">
          <Mark />
          <span>Check.</span>
        </span>

        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Text links drop below sm — three items plus the button overflow
              a 375px bar. Buy credit is the one that has to survive. */}
          {/* TODO: these have no destination yet — no /features section or
              examples page exists. Wire them up when those ship. */}
          <span className="hidden items-center gap-1 sm:flex sm:gap-2">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#examples">Real examples</NavLink>
          </span>

          {/* Hidden entirely while the product is closed — balance pill and
              all. A greyed-out payment control asks the visitor a question
              this page does not want them holding ("is it broken, or am I not
              allowed?"), and a credit count means nothing when there is
              nothing to spend it on. The handlers stay wired below, so
              opening the product is one env var rather than a rewrite.

Balance + Buy as one floating control: a soft white pill holding
              a filled pill button. The nested button's own shape does the
              separating, so there's no divider rule — that's what keeps it
              from reading as two stacked chips.

              When there's no balance to show, the wrapper is dropped and the
              button stands alone; a lone filled pill inside an empty white
              pill just looks like a mistake. */}
          {!EARLY_ACCESS_MODE && (
            <div
              className={
                'ml-1 inline-flex items-center ' +
                // rounded-2xl (16px) = the button's 12px + the 4px padding.
                // Nested radii only look concentric when the outer one is the
                // inner one plus the gap between them.
                (showBalance
                  ? 'gap-2.5 rounded-2xl bg-white p-1 pl-4 shadow-[0_1px_2px_rgba(23,23,23,0.06),0_8px_24px_-10px_rgba(23,23,23,0.22)]'
                  : '')
              }
            >
              {showBalance && (
                <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap text-ink-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="font-semibold text-ink">{balance}</span>
                  credit{balance === 1 ? '' : 's'}
                </span>
              )}

              <button
                type="button"
                onClick={onBuyClick}
                disabled={isStartingCheckout || session === 'unknown'}
                className={
                  'rounded-xl bg-[linear-gradient(135deg,#41598e_0%,#2c3e64_100%)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ' +
                  // Standing alone it needs its own lift; nested, the wrapper
                  // already provides it.
                  (showBalance
                    ? ''
                    : 'shadow-[0_1px_2px_rgba(23,23,23,0.06),0_8px_24px_-10px_rgba(23,23,23,0.22)]')
                }
              >
                {isStartingCheckout ? 'Opening…' : 'Buy credit'}
              </button>
            </div>
          )}
        </nav>
      </header>

      {error && (
        <p role="alert" className="mt-2 text-right text-xs text-red-700">
          {error}
        </p>
      )}

      {modal && (
        <AuthGateModal
          returnTo={modal.returnTo}
          variant={modal.variant}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      {children}
    </a>
  )
}

// Wordmark glyph — a rounded square with a corner notch, echoing the "check
// a box" idea without spelling out a tick.
function Mark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className="translate-y-[0.5px]"
    >
      <rect
        x="1.1"
        y="1.1"
        width="19.8"
        height="19.8"
        rx="6"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M7 11.4 L10 14.2 L15.2 7.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
