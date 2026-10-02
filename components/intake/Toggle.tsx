'use client'

// A switch that reveals another question.
//
// Drawn rather than a native checkbox for the same reason ChoiceField draws its
// own radio dot: app/globals.css strips the default outline, and the OS accent
// colour fights the warm palette. It stays a real <input type="checkbox"> under
// the paint, so the label, the space key and the screen reader all work without
// anything being reimplemented.
//
// Every one of these is a fact the spec needs and no amount of prose can imply:
// whether the client may be named, whether an answer is their exact words,
// whether a thing existed before, whether a number was measured. Each is one
// click and each opens or closes a rule.

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
    <div>
      <label
        htmlFor={id}
        className={
          'flex cursor-pointer items-center gap-3 text-sm text-ink ' +
          (disabled ? 'cursor-not-allowed opacity-60' : '')
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
            'relative flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ' +
            (checked ? 'border-accent bg-accent' : 'border-line-soft bg-white')
          }
        >
          <span
            className={
              'absolute h-3.5 w-3.5 rounded-full transition-all ' +
              (checked ? 'left-[18px] bg-white' : 'left-[3px] bg-line-soft')
            }
          />
        </span>
        <span className="font-medium">{label}</span>
      </label>
      {helper && <p className="mt-1.5 ml-12 text-xs text-ink-muted">{helper}</p>}
    </div>
  )
}
