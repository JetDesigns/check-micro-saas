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
  options: readonly { value: T; label: string }[]
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
                'flex items-center gap-2 rounded-[var(--studio-r-md)] border bg-[var(--studio-bg-primary)] p-2 transition-colors ' +
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
                  'block size-4 shrink-0 rounded-[var(--studio-r-full)] bg-[var(--studio-bg-primary)] ' +
                  (active
                    ? 'border-[5px] border-[var(--studio-brand-hover)]'
                    : 'border border-[var(--studio-border-strong)]')
                }
              />
              <span
                className={
                  'studio-small ' +
                  (active ? 'text-[var(--studio-text)]' : 'text-[var(--studio-text-soft)]')
                }
              >
                {o.label}
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
