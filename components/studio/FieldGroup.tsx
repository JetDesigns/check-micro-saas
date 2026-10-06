'use client'

import { Field } from '@/components/studio/Field'
import { fieldElementId, type IntakeField, type TextKey } from '@/lib/intake-fields'

// Renders a run of registry fields, pairing the ones marked `half`.
//
// The pairing exists because two facts that used to share one string are now two
// fields — year and duration, and the before/after values with their periods.
// Splitting them was the point (§3.2 can only drop a field with no real value if
// each value is its own field), but stacking four short inputs full width reads
// as four times the work, which is how a split that cost nothing starts to feel
// like one.

export function FieldGroup({
  fields,
  text,
  onTextChange,
  disabled,
}: {
  fields: readonly IntakeField[]
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      {pairHalves(fields).map((row) =>
        row.length === 1 ? (
          <Row key={row[0].key} field={row[0]} text={text} onTextChange={onTextChange} disabled={disabled} />
        ) : (
          <div key={row[0].key} className="grid gap-4 sm:grid-cols-2">
            {row.map((field) => (
              <Row key={field.key} field={field} text={text} onTextChange={onTextChange} disabled={disabled} />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function Row({
  field,
  text,
  onTextChange,
  disabled,
}: {
  field: IntakeField
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  disabled: boolean
}) {
  return (
    <Field
      id={fieldElementId(field.key)}
      label={field.label}
      value={text[field.key] ?? ''}
      onChange={(v) => onTextChange(field.key, v)}
      placeholder={field.placeholder}
      helper={field.helper}
      optional={!field.required}
      rows={field.type === 'textarea' ? (field.rows ?? 3) : undefined}
      maxChars={field.maxChars}
      disabled={disabled}
    />
  )
}

/** Consecutive `half` fields go two to a row; everything else stands alone. */
function pairHalves(fields: readonly IntakeField[]): IntakeField[][] {
  const rows: IntakeField[][] = []
  for (const field of fields) {
    const last = rows[rows.length - 1]
    if (field.half && last?.length === 1 && last[0].half) last.push(field)
    else rows.push([field])
  }
  return rows
}
