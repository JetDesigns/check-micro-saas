'use client'

type Props<T extends string> = {
  legend: string
  /** Radio group name — must be unique within the form. */
  name: string
  options: readonly { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
  id?: string
  columns?: 1 | 2
  /**
   * The early-access survey requires an answer, so it can say so. The wizard
   * never does — it never blocks anything — and leaves this off.
   */
  showError?: boolean
}

// Radio inputs rather than the aria-pressed buttons used for tone and project
// type. Same look, but this is a single-choice answer inside a submitted form,
// so the native grouping — arrow keys, one tab stop, screen-reader "2 of 4" —
// is worth having instead of reimplementing.
//
// Shared by the early-access modal and the wizard's "Did it ship?" step; it
// lived privately in the modal until the wizard needed the same control.
export function ChoiceField<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
  id,
  columns = 2,
  showError = false,
}: Props<T>) {
  return (
    <fieldset id={id}>
      <legend className="text-sm font-medium leading-relaxed text-ink">
        {legend}
      </legend>
      <div
        className={
          'mt-3 grid gap-2 ' + (columns === 2 ? 'sm:grid-cols-2' : '')
        }
      >
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
