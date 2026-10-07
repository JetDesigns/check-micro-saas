'use client'

// Form select (230:536 / 230:540) with its Radio (230:521 / 230:523).
//
// Selected is carried by the border going to brand/hover and the radio filling
// to a 5px ring — not by a background change, which is what keeps a row of four
// from looking like four buttons.
//
// Figma draws these two to a row. `columns={1}` stacks them instead, which the
// provenance question needs: five labels of that length do not fit two-up.

type Props<T extends string> = {
  legend: string
  /** Radio group name — must be unique within the form. */
  name: string
  /**
   * `example` is a second line under the label, naming the kinds of project the
   * option covers. Optional and structural, so the lists that do not carry one
   * render exactly as they did before.
   */
  options: readonly { value: T; label: string; example?: string }[]
  value: T | null
  onChange: (value: T) => void
  columns?: 1 | 2
  helper?: string
  disabled?: boolean
  id?: string
}

export function FormSelect<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  columns = 2,
  helper,
  disabled = false,
  id,
}: Props<T>) {
  return (
    <fieldset id={id} className="w-full">
      <legend className="studio-h2 text-[var(--studio-text)]">{legend}</legend>
      <div className={'mt-3 grid gap-3 ' + (columns === 2 ? 'sm:grid-cols-2' : '')}>
        {options.map((o) => {
          const active = value === o.value
          return (
            <label
              key={o.value}
              className={
                // items-start, not items-center: with an example underneath, a
                // centred radio floats between the two lines instead of
                // belonging to the label it selects.
                'flex items-start gap-2 rounded-[var(--studio-r-md)] border bg-[var(--studio-bg-primary)] p-2 transition-colors ' +
                (active
                  ? 'border-[var(--studio-brand-hover)]'
                  : 'border-[var(--studio-border-strong)]') +
                (disabled ? ' cursor-not-allowed opacity-60' : ' cursor-pointer')
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
              <span
                aria-hidden
                className={
                  // mt-px sits the ring on the first line's optical centre:
                  // the radio is 16px and the line box is 14.4px.
                  'mt-px block size-4 shrink-0 rounded-[var(--studio-r-full)] bg-[var(--studio-bg-primary)] ' +
                  (active
                    ? 'border-[5px] border-[var(--studio-brand-hover)]'
                    : 'border border-[var(--studio-border-strong)]')
                }
              />
              {/* The label alone carries the selected state. The example stays
                  Text/Secondary either way: it is what the option covers, not a
                  second thing that lights up, and selection is carried by the
                  border and the ring — see the note at the top of this file. */}
              <span className="flex flex-col gap-1">
                <span
                  className={
                    'studio-small ' +
                    (active ? 'text-[var(--studio-text)]' : 'text-[var(--studio-text-soft)]')
                  }
                >
                  {o.label}
                </span>
                {o.example && (
                  <span className="studio-small text-[var(--studio-text-soft)]">{o.example}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      {helper && (
        <p className="studio-small mt-2 text-[var(--studio-text-soft)]">{helper}</p>
      )}
    </fieldset>
  )
}
