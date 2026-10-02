'use client'

// Input (29:327–330) and Text area (55:611–614). One component, because in
// Figma they are the same three parts — label, field, optional helper — and the
// only difference is the height of the control and its right padding.
//
// The label is H2 and the helper is Body small in text/secondary; the field is
// white on border/strong at medium-1 radius with an 8px pad. The focus ring is
// not in the design at all (see the plan's gap list) — it comes from the
// .studio *:focus-visible rule, on the control itself rather than on a wrapper,
// because the control is what receives focus.

type Props = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  helper?: string
  optional?: boolean
  /** Renders a textarea at this many rows. Omit for a single-line input. */
  rows?: number
  disabled?: boolean
}

const CONTROL =
  'studio-small block w-full rounded-[var(--studio-r-md)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] p-2 text-[var(--studio-text)] placeholder:text-[var(--studio-text-soft)] disabled:opacity-60'

export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  helper,
  optional = false,
  rows,
  disabled = false,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="studio-h2 text-[var(--studio-text)]">
        {label}
        {optional && (
          <span className="studio-small ml-2 text-[var(--studio-text-soft)]">optional</span>
        )}
      </label>

      {rows ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          // pr-5 rather than p-2 on the right: Figma's text area is padded
          // 8px 20px 8px 8px, which keeps the last word clear of the resize grip.
          className={`${CONTROL} resize-none pr-5 leading-[1.35]`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={CONTROL}
        />
      )}

      {helper && <p className="studio-small text-[var(--studio-text-soft)]">{helper}</p>}
    </div>
  )
}
