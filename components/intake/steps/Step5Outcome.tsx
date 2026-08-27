'use client'

import { ChoiceField } from '@/components/intake/ChoiceField'
import { FieldRow } from '@/components/intake/FieldRow'
import { OUTCOME_OPTIONS, fieldsForStep, type TextKey } from '@/lib/intake-fields'
import type { OutcomeStatus } from '@/types/database'

type Props = {
  outcome: OutcomeStatus | null
  onOutcomeChange: (o: OutcomeStatus) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  isBusy: boolean
}

export function Step5Outcome({
  outcome,
  onOutcomeChange,
  text,
  onTextChange,
  isBusy,
}: Props) {
  return (
    <div className="space-y-5">
      <ChoiceField
        id="intake-outcome_status"
        legend="Did it ship?"
        name="outcome_status"
        options={OUTCOME_OPTIONS}
        value={outcome}
        onChange={onOutcomeChange}
        disabled={isBusy}
      />

      {fieldsForStep(5).map((field) => (
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
