'use client'

import type { IntakeField } from '@/lib/intake-fields'
import { fieldElementId } from '@/lib/intake-fields'

type Props = {
  field: IntakeField
  value: string
  isBusy: boolean
  onChange: (v: string) => void
}

// One labelled answer. Lifted out of IntakeForm unchanged except for the
// error state, which went with the validation that used to block "next" —
// nothing about an answer is invalid any more, only short, and short is the
// review screen's business.
//
// The bordered wrapper owns the focus ring rather than the control, because
// app/globals.css strips the default outline from inputs and textareas.
export function FieldRow({ field, value, isBusy, onChange }: Props) {
  const id = fieldElementId(field.key)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {field.label}
        {!field.required && (
          <span className="ml-2 text-xs font-normal text-ink-muted">
            optional
          </span>
        )}
      </label>

      <div className="mt-2 rounded-xl border border-line bg-white transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
        {field.type === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            rows={field.rows ?? 3}
            disabled={isBusy}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full resize-none rounded-xl bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            disabled={isBusy}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
          />
        )}
      </div>

      {field.helper && (
        <p className="mt-1.5 text-xs text-ink-muted">{field.helper}</p>
      )}
    </div>
  )
}
