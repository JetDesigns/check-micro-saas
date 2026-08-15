'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

// Login modal used across the landing page (sign up, buy credits).
//
// Two identity paths, and the difference between them is the whole reason this
// component is careful:
//
//   • Email — supabase.auth.updateUser({email}), NOT signInWithOtp. That
//     upgrades the CURRENT anonymous session in place: same user_id, now with
//     a verified email, so any case studies and credits it already owns come
//     with it. A fresh signInWithOtp would mint a separate user and orphan
//     them.
//
//   • Google — same problem, same shape of answer. signInWithOAuth creates a
//     new user and discards the anon session, so we only use it when there is
//     no session to lose. When an anonymous session exists we call
//     linkIdentity() instead, which attaches the Google identity to the
//     existing user_id. linkIdentity requires "Manual linking" to be enabled
//     in Supabase Auth settings.
//
// The Google button is gated behind NEXT_PUBLIC_GOOGLE_AUTH_ENABLED so this
// ships before the Google Cloud / Supabase provider setup is done, without
// showing users a button that errors.

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

type Stage =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'redirecting' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string }

/** Which job the modal is doing. Changes the pitch copy only — every variant
 *  runs the same auth. */
export type AuthVariant = 'export' | 'buy' | 'signup'

const COPY: Record<
  AuthVariant,
  { eyebrow: string; title: string; body: React.ReactNode }
> = {
  export: {
    eyebrow: 'Free credit inside',
    title: 'Log in to export your case study.',
    body: (
      <>
        We&apos;ll send a one-click link to your email. Confirm it and
        you&apos;ll unlock export
        <span className="text-ink">
          {' '}
          — plus <span className="font-medium">1 free credit</span> on the house.
        </span>
      </>
    ),
  },
  buy: {
    eyebrow: 'One step first',
    title: 'Log in to buy credits.',
    body: (
      <>
        Credits live in your account, so we need somewhere to put them. Log in
        and we&apos;ll take you straight to checkout
        <span className="text-ink">
          {' '}
          — with <span className="font-medium">1 free credit</span> already
          waiting.
        </span>
      </>
    ),
  },
  signup: {
    eyebrow: 'Free credit inside',
    title: 'Create your account.',
    body: (
      <>
        No password, no newsletter. Signing up saves your case studies and comes
        with
        <span className="text-ink">
          {' '}
          <span className="font-medium">1 free credit</span> — enough to open
          one in full.
        </span>
      </>
    ),
  },
}

type Props = {
  /** Path (with leading slash) the user should return to after logging in.
   *  `?login=1` is appended by /auth/callback. */
  returnTo: string
  /** Pitch copy to show. Defaults to the export gate for back-compat. */
  variant?: AuthVariant
  onClose: () => void
}

export function AuthGateModal({ returnTo, variant = 'export', onClose }: Props) {
  const [email, setEmail] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })

  const busy = stage.kind === 'sending' || stage.kind === 'redirecting'
  const copy = COPY[variant]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Persist the return target BEFORE any redirect. If Supabase's Redirect URLs
  // whitelist doesn't include /auth/callback it silently falls back to the
  // Site URL and drops our `?next=…`; the landing page recovers using this.
  const rememberReturn = () => {
    try {
      window.localStorage.setItem('check.pendingAuthReturn', returnTo)
    } catch {
      // localStorage blocked (private mode) — the happy path still works when
      // the Supabase whitelist is correct.
    }
  }

  const continueWithGoogle = async () => {
    if (busy) return
    setStage({ kind: 'redirecting' })
    rememberReturn()

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`

      // An anonymous session may already own case studies and credits. Link
      // rather than sign in, so user_id survives.
      const { error } = user?.is_anonymous
        ? await supabase.auth.linkIdentity({
            provider: 'google',
            options: { redirectTo },
          })
        : await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
          })

      if (error) throw error
      // On success the browser is navigating to Google; nothing more to do.
    } catch (err) {
      setStage({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not start Google sign-in. Please try again.',
      })
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return

    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStage({ kind: 'error', message: 'Please enter a valid email.' })
      return
    }

    setStage({ kind: 'sending' })
    rememberReturn()

    try {
      const supabase = createClient()
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`
      const { error } = await supabase.auth.updateUser(
        { email: trimmed },
        { emailRedirectTo }
      )
      if (error) throw error
      setStage({ kind: 'sent', email: trimmed })
    } catch (err) {
      setStage({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not send the login link. Please try again.',
      })
    }
  }

  // Portalled to <body> rather than rendered in place. The landing's left
  // column is `position: sticky`, and a sticky element creates a stacking
  // context — so a modal rendered inside it has its z-50 confined to that
  // context and gets painted over by the wizard column, which is a later
  // sibling. Escaping to body also makes this immune to any future ancestor
  // with transform/filter, which would break `position: fixed` outright.
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-[0_1px_2px_rgba(23,23,23,0.05),0_12px_32px_-8px_rgba(23,23,23,0.16),0_32px_80px_-20px_rgba(74,59,41,0.24)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {stage.kind !== 'sent' ? (
          <form onSubmit={submit} noValidate>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {copy.eyebrow}
            </p>
            <h2
              id="auth-gate-title"
              className="mt-2 text-xl font-medium leading-snug text-ink sm:text-2xl"
            >
              {copy.title}
            </h2>
            <p className="mt-3 text-sm text-ink-soft">{copy.body}</p>

            {/* Google + divider render as one unit, or not at all — no
                orphaned separator when the provider isn't configured yet. */}
            {GOOGLE_ENABLED && (
              <>
                <button
                  type="button"
                  onClick={continueWithGoogle}
                  disabled={busy}
                  className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-soft/40 hover:bg-canvas/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GoogleIcon />
                  {stage.kind === 'redirecting'
                    ? 'Opening Google…'
                    : 'Continue with Google'}
                </button>

                <div className="mt-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs text-ink-muted">or</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}

            <label
              htmlFor="auth-gate-email"
              className={
                'block text-sm font-medium text-ink ' +
                (GOOGLE_ENABLED ? 'mt-5' : 'mt-6')
              }
            >
              Email
            </label>
            <div
              className={
                'mt-2 rounded-xl border bg-white transition-shadow focus-within:ring-2 focus-within:ring-accent/15 ' +
                (stage.kind === 'error'
                  ? 'border-red-300 focus-within:border-red-400'
                  : 'border-line focus-within:border-accent')
              }
            >
              <input
                id="auth-gate-email"
                type="email"
                autoFocus={!GOOGLE_ENABLED}
                required
                value={email}
                disabled={busy}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (stage.kind === 'error') setStage({ kind: 'idle' })
                }}
                placeholder="you@company.com"
                className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
              />
            </div>

            {stage.kind === 'error' && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {stage.message}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                Not now
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink"
              >
                {stage.kind === 'sending' ? 'Sending…' : 'Send magic link'}
              </button>
            </div>

            <p className="mt-4 text-xs text-ink-muted">
              We use your email to sign you in. No password. No newsletter.
            </p>
          </form>
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              Check your inbox
            </p>
            <h2 className="mt-2 text-xl font-medium leading-snug text-ink sm:text-2xl">
              Sent to {stage.email}.
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              Click the link in the email to finish signing in. The link expires
              in about an hour. You can close this window — your work is safe.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-soft/40"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------

// Google's four-colour mark, inline so there's no external asset request.
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
