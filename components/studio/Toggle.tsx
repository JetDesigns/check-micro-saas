'use client'

// NOT IN THE FIGMA FILE. There is no toggle or switch anywhere in it, and four
// answers need one: whether the client may be named, whether a quote is the
// client's exact words, whether a thing existed before, and whether a number was
// measured. Built from the same tokens — a full-radius track, brand fill when
// on, border/strong when off.
//
// Each of these is a fact the spec needs and no amount of prose can imply, and
// each opens or closes a rule. That is why they are toggles and not inferences.
//
// A real checkbox under the paint, so the label, the space key and the screen
// reader all work without being reimplemented.

type Props = {
  id: string
  label: string
  helper?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ id, label, helper, checked, onChange, disabled = false }: Props) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={
          'flex items-center gap-3 ' + (disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')
        }
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden
          className={
            'relative flex h-5 w-9 shrink-0 items-center rounded-[var(--studio-r-full)] border transition-colors ' +
            (checked
              ? 'border-[var(--studio-brand)] bg-[var(--studio-brand)]'
              : 'border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)]')
          }
        >
          <span
            className={
              'absolute h-3.5 w-3.5 rounded-[var(--studio-r-full)] transition-all ' +
              (checked ? 'left-[18px] bg-white' : 'left-[3px] bg-[var(--studio-border-strong)]')
            }
          />
        </span>
        <span className="studio-h2 text-[var(--studio-text)]">{label}</span>
      </label>
      {helper && (
        <p className="studio-small mt-1.5 ml-12 text-[var(--studio-text-soft)]">{helper}</p>
      )}
    </div>
  )
}
