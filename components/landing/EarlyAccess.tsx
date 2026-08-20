'use client'

import { useState } from 'react'
import {
  PAIN_FREQUENCY_OPTIONS,
  PAIN_FREQUENCY_QUESTION,
  PRICE_WILLINGNESS_OPTIONS,
  PRICE_WILLINGNESS_QUESTION,
  type PainFrequency,
  type PriceWillingness,
} from '@/lib/waitlist'

// Early-access capture, below the hero. Everything happens in place: no
// redirect to a form service, no modal, and on success the form is replaced
// by the confirmation rather than sitting there next to it.
//
// It cannot live inside the hero column. That column is sticky and its height
// is pinned to the viewport (see the comment in app/page.tsx) — anything
// added there stops the pinning, which is a regression the layout has already
// hit once. So this is a full-width band under the two-column grid.

export function EarlyAccess() {
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

  return (
    <section
      id="early-access"
      className="mx-auto w-full max-w-[1500px] px-6 pb-16 lg:px-10 lg:pb-24"
    >
      <div className="mx-auto max-w-2xl rounded-[28px] bg-canvas p-6 sm:p-10">
        {isDone ? (
          // role="status" so the swap is announced — a sighted user sees the
          // form vanish, everyone else needs telling.
          <p
            role="status"
            className="py-8 text-center text-lg font-medium text-ink"
          >
            You&apos;re in. We&apos;ll reach out soon.
          </p>
        ) : (
          <>
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-ink sm:text-3xl">
              Want early access?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              Answer two quick questions and leave your email. First testers get
              full access free.
            </p>

            <form onSubmit={onSubmit} className="mt-8" noValidate>
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? 'Sending…' : 'Request early access'}
              </button>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

type ChoiceFieldProps<T extends string> = {
  legend: string
  name: string
  options: readonly { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
  disabled: boolean
  showError: boolean
}

// Radio inputs rather than the aria-pressed buttons the intake wizard uses.
// Same look, but these are a required single-choice answer in a submitted
// form, so the native grouping — arrow keys, one tab stop, screen-reader
// "2 of 4" — is worth having instead of reimplementing.
function ChoiceField<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled,
  showError,
}: ChoiceFieldProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-medium leading-relaxed text-ink">
        {legend}
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.value
          return (
            <label
              key={o.value}
              className={
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ' +
                (active
                  ? 'border-accent bg-accent/5 text-ink'
                  : 'border-line bg-white text-ink-soft hover:border-ink-soft/40 hover:text-ink') +
                (disabled ? ' cursor-not-allowed opacity-60' : '')
              }
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {/* Drawn rather than a native dot so the control matches the
                  warm palette instead of the OS accent colour. */}
              <span
                aria-hidden
                className={
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ' +
                  (active ? 'border-accent' : 'border-line-soft bg-white')
                }
              >
                {active && <span className="h-2 w-2 rounded-full bg-accent" />}
              </span>
              {o.label}
            </label>
          )
        })}
      </div>
      {showError && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          Pick one to continue.
        </p>
      )}
    </fieldset>
  )
}
