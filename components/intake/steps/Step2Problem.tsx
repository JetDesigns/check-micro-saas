'use client'

import { FieldRow } from '@/components/intake/FieldRow'
import { fieldsForStep, type TextKey } from '@/lib/intake-fields'

type Props = {
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  isBusy: boolean
}

export function Step2Problem({ text, onTextChange, isBusy }: Props) {
  return (
    <div className="space-y-5">
      {fieldsForStep(2).map((field) => (
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
}
