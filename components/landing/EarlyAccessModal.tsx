'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PAIN_FREQUENCY_OPTIONS,
  PAIN_FREQUENCY_QUESTION,
  PRICE_WILLINGNESS_OPTIONS,
  PRICE_WILLINGNESS_QUESTION,
  type PainFrequency,
  type PriceWillingness,
} from '@/lib/waitlist'
import { ChoiceField } from '@/components/intake/ChoiceField'

// Early-access capture, opened from the hero's primary CTA.
//
// This was a full-width section under the two-column grid first, which put the
// one thing the landing is currently trying to measure below the fold. As an
// overlay it is reachable the moment someone lands, with no scrolling.
//
// Portalled to <body> for the same reason AuthGateModal is: the landing's left
// column is `position: sticky`, a sticky element creates a stacking context,
// and a modal rendered inside it has its z-50 confined there — the wizard
// column, a later sibling, paints straight over it. The symptom is invisible
// to getBoundingClientRect; document.elementFromPoint is what exposes it.

export function EarlyAccessModal({ onClose }: { onClose: () => void }) {
  const [painFrequency, setPainFrequency] = useState<PainFrequency | null>(null)
  const [priceWillingness, setPriceWillingness] =
    useState<PriceWillingness | null>(null)
  const [email, setEmail] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Errors stay hidden until a submit has been attempted, so the form does
  // not scold someone who is still filling it in.
  const [showErrors, setShowErrors] = useState(false)

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setShowErrors(true)
    setError(null)

    if (!painFrequency || !priceWillingness || !emailLooksValid) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), painFrequency, priceWillingness }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(
          body.error === 'invalid_field'
            ? 'Please check your answers and try again.'
            : 'Could not save that. Please try again.'
        )
      }
      setIsDone(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save that. Please try again.'
      )
      setIsSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-access-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Taller than the auth modal by a long way — two four-option questions
          stack to one column below sm. Without the height cap and its own
          scroller the submit button ends up off-screen on a phone. */}
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-[0_1px_2px_rgba(23,23,23,0.05),0_12px_32px_-8px_rgba(23,23,23,0.16),0_32px_80px_-20px_rgba(74,59,41,0.24)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {isDone ? (
          <div>
            {/* role="status" so the swap is announced — a sighted user watches
                the form vanish, everyone else needs telling. */}
            <p
              role="status"
              id="early-access-title"
              className="py-4 text-center text-lg font-medium text-ink"
            >
              You&apos;re in. We&apos;ll reach out soon.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-soft/40"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2
              id="early-access-title"
              className="text-2xl font-medium tracking-[-0.02em] text-ink"
            >
              Want early access?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              Answer two quick questions and leave your email.
            </p>

            <form onSubmit={onSubmit} className="mt-7" noValidate>
              <ChoiceField
                legend={PAIN_FREQUENCY_QUESTION}
                name="pain_frequency"
                options={PAIN_FREQUENCY_OPTIONS}
                value={painFrequency}
                onChange={setPainFrequency}
                disabled={isSubmitting}
                showError={showErrors && !painFrequency}
              />

              <div className="mt-7">
                <ChoiceField
                  legend={PRICE_WILLINGNESS_QUESTION}
                  name="price_willingness"
                  options={PRICE_WILLINGNESS_OPTIONS}
                  value={priceWillingness}
                  onChange={setPriceWillingness}
                  disabled={isSubmitting}
                  showError={showErrors && !priceWillingness}
                />
              </div>

              <div className="mt-7">
                <label
                  htmlFor="early-access-email"
                  className="block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <div
                  className={
                    'mt-2 rounded-xl border bg-white transition-shadow focus-within:ring-2 focus-within:ring-accent/15 ' +
                    (showErrors && !emailLooksValid
                      ? 'border-red-300 focus-within:border-red-400'
                      : 'border-line focus-within:border-accent')
                  }
                >
                  <input
                    id="early-access-email"
                    type="email"
                    value={email}
                    disabled={isSubmitting}
                    placeholder="your@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={(showErrors && !emailLooksValid) || undefined}
                    aria-describedby="early-access-email-help"
                    className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
                  />
                </div>
                <p
                  id="early-access-email-help"
                  className="mt-2 text-xs text-ink-muted"
                >
                  We&apos;ll reach out personally when your spot is ready. No
                  newsletters.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Not now
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink"
                >
                  {isSubmitting ? 'Sending…' : 'Request early access'}
                </button>
              </div>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
