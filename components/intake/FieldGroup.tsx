'use client'

import { FieldRow } from '@/components/intake/FieldRow'
import type { IntakeField, TextKey } from '@/lib/intake-fields'

// Renders a run of registry fields, pairing the ones marked `half`.
//
// The pairing exists because two facts that used to share one string are now
// two fields — year and duration, and the before/after values with their
// periods. Splitting them was the point (§3.2 can only drop a field with no
// real value if each value is its own field), but stacking four short inputs
// full width reads as four times the work, which is how a split that cost
// nothing starts to feel like one.

type Props = {
  fields: readonly IntakeField[]
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  isBusy: boolean
}

export function FieldGroup({ fields, text, onTextChange, isBusy }: Props) {
  return (
    <div className="space-y-5">
      {pairHalves(fields).map((row) =>
        row.length === 1 ? (
          <FieldRow
            key={row[0].key}
            field={row[0]}
            value={text[row[0].key] ?? ''}
            isBusy={isBusy}
            onChange={(v) => onTextChange(row[0].key, v)}
          />
        ) : (
          <div key={row[0].key} className="grid gap-4 sm:grid-cols-2">
            {row.map((field) => (
              <FieldRow
                key={field.key}
                field={field}
                value={text[field.key] ?? ''}
                isBusy={isBusy}
                onChange={(v) => onTextChange(field.key, v)}
              />
            ))}
          </div>
        )
      )}
    </div>
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
