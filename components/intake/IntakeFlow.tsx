'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IntakeForm } from '@/components/intake/IntakeForm'

// After we moved the ~20-second compile out to /writing/[id], the unlocked
// view out to /c/[id], and the credit balance up into the landing top bar,
// IntakeFlow's remaining job is:
//   • render the form
//   • push into /writing/[id] once a case study row exists
//   • handle the landing-page redirects: magic-link recovery, post-login
//     checkout resume, and the two post-Stripe returns
// There's no local narrative or balance state left to hold.

export function IntakeFlow() {
  const router = useRouter()
  const [purchaseFlash, setPurchaseFlash] = useState<string | null>(null)

  // Resume a purchase the user started from the top bar before logging in.
  // Same endpoint the top bar calls directly for already-signed-in users.
  // Every setState here sits after an await, so calling this from an effect
  // doesn't trip react-hooks/set-state-in-effect.
  const startCheckout = useCallback(async () => {
    try {
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
      // Login already succeeded and the bonus credit landed — say so, and
      // leave the top bar's Buy button as the retry path.
      setPurchaseFlash(
        err instanceof Error
          ? `Signed in, but checkout didn't open: ${err.message}`
          : "Signed in, but checkout didn't open. Try Buy credits again."
      )
    }
  }, [])

  // On mount: handle Stripe redirects AND magic-link recovery. Two
  // magic-link failure modes we can rescue here:
  //   (a) `?code=…` present — Supabase's Site-URL fallback fired instead
  //       of our /auth/callback. Forward the code to our callback along
  //       with the persisted returnTo so it can exchange, grant the bonus,
  //       and redirect to /c/[id].
  //   (b) `?login=1` present — our callback ran but its `next` was empty,
  //       so it fell back to `/`. We still have the returnTo in storage,
  //       so send the user there with the flash flag preserved.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const login = params.get('login') === '1'
    const purchased = params.get('purchased') === '1'
    const cancelled = params.get('purchase_cancelled') === '1'
    const returnedCaseStudyId = params.get('cs')

    // (a) Magic-link fell back to landing WITH a code — forward to our
    //     callback so the exchange + bonus still happen.
    if (code) {
      let pending: string | null = null
      try {
        pending = window.localStorage.getItem('check.pendingAuthReturn')
      } catch {}
      const next = pending || '/'
      router.replace(
        `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      )
      return
    }

    // (c) The user logged in *in order to buy*. Resume the purchase without
    //     making them press Buy again. Checked BEFORE the generic ?login=1
    //     branch, because that branch redirects away on a stored returnTo and
    //     would strip the checkout intent on the way.
    //
    //     The localStorage half is the fallback for when Supabase drops our
    //     `?next=` (same failure mode as pendingAuthReturn above).
    let wantsCheckout = params.get('checkout') === '1'
    if (!wantsCheckout) {
      try {
        wantsCheckout =
          window.localStorage.getItem('check.pendingCheckout') === '1'
      } catch {}
    }
    if (wantsCheckout) {
      try {
        window.localStorage.removeItem('check.pendingCheckout')
        window.localStorage.removeItem('check.pendingAuthReturn')
      } catch {}
      // Drop the flags from the URL first: if checkout fails we don't want a
      // reload to re-fire it.
      window.history.replaceState(null, '', window.location.pathname)
      // No "opening checkout" flash on purpose: setting state synchronously
      // here is exactly the cascading-render pattern react-hooks warns about,
      // and the Stripe redirect lands in about a second. The failure path
      // inside startCheckout still reports itself — that's the case worth
      // interrupting for, and it only setStates after `await fetch`.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void startCheckout()
      return
    }

    // (b) Callback fired, redirected to landing with ?login=1. If we know
    //     where the user was, take them there so CaseStudyView shows the
    //     "1 free credit added" flash + Unlock CTA.
    if (login) {
      let pending: string | null = null
      try {
        pending = window.localStorage.getItem('check.pendingAuthReturn')
        window.localStorage.removeItem('check.pendingAuthReturn')
      } catch {}
      if (pending) {
        const sep = pending.includes('?') ? '&' : '?'
        router.replace(`${pending}${sep}login=1`)
        return
      }
      // No returnTo stored — user still got the bonus, just show a note.
      setPurchaseFlash('Signed in. 1 free credit added.')
      const clean = window.location.pathname
      window.history.replaceState(null, '', clean)
      return
    }

    if (purchased && returnedCaseStudyId) {
      router.replace(`/c/${returnedCaseStudyId}?purchased=1`)
      return
    }

    if (purchased) {
      setPurchaseFlash('5 credits added to your account.')
    } else if (cancelled) {
      setPurchaseFlash('Purchase cancelled — no charge made.')
    }

    if (purchased || cancelled) {
      const clean = window.location.pathname
      window.history.replaceState(null, '', clean)
    }
  }, [router, startCheckout])

  // The finished intake goes to the pipeline. There is still nowhere to send
  // the reader afterwards — the paid read route is Phase 6 — so this reports
  // the outcome in place rather than navigating. In development it offers the
  // fixture viewer, which is the only thing that can draw a document today.
  const [compileState, setCompileState] = useState<
    { status: 'idle' } | { status: 'done'; id: string }
  >({ status: 'idle' })

  const handleCreated = useCallback(async (caseStudyId: string) => {
    const res = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseStudyId }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      // Thrown rather than handled here, so IntakeForm's own catch restores
      // the form with the answers intact. A dead end that keeps saying
      // "Working…" is the worst of both.
      throw new Error(body?.message ?? 'The case study could not be written.')
    }
    setCompileState({ status: 'done', id: caseStudyId })
  }, [])

  return (
    <div>
      {/* Balance lives in the top bar now — showing it here too rendered the
          same pill twice on one screen. This row keeps only the transient
          purchase/login flash, which is contextual to the form. */}
      {purchaseFlash && (
        <div className="mb-3 flex items-center justify-end">
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {purchaseFlash}
          </span>
        </div>
      )}

      {compileState.status === 'done' ? (
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-medium text-ink">Your case study is written.</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            There is nowhere to read it yet — the published page is still being
            built. It is saved against this case study.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <a
              href={`/fixture?id=${compileState.id}`}
              className="mt-4 inline-block rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Open it in the fixture viewer
            </a>
          )}
        </div>
      ) : (
        <IntakeForm onCreated={handleCreated} />
      )}
    </div>
  )
}
