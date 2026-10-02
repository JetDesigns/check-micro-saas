'use client'

import { Disclosure } from '@/components/studio/Disclosure'
import { FieldGroup } from '@/components/studio/FieldGroup'
import { FormSelect } from '@/components/studio/FormSelect'
import { RepeatCard } from '@/components/studio/RepeatCard'
import { Toggle } from '@/components/studio/Toggle'
import {
  OUTCOME_OPTIONS,
  fieldsForStep,
  fieldsRevealedBy,
  partitionByDisclosure,
  visibleFields,
  type TextKey,
  type ToggleKey,
} from '@/lib/intake-fields'
import { DISCLOSURE, TOGGLE_COPY } from '@/lib/wizard-steps'
import type { OutcomeStatus } from '@/types/database'

type Props = {
  outcome: OutcomeStatus | null
  onOutcomeChange: (o: OutcomeStatus) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  toggles: Partial<Record<ToggleKey, boolean>>
  onToggleChange: (key: ToggleKey, value: boolean) => void
  disabled: boolean
}

export function Step5Outcome({
  outcome,
  onOutcomeChange,
  text,
  onTextChange,
  toggles,
  onToggleChange,
  disabled,
}: Props) {
  const measurement = fieldsRevealedBy('has_measurement')
  const measurementKeys = new Set<string>(measurement.map((f) => f.key))
  const { open, collapsed } = partitionByDisclosure(
    visibleFields(fieldsForStep(5), toggles).filter((f) => !measurementKeys.has(f.key))
  )

  return (
    <div className="flex flex-col gap-4">
      <FormSelect
        id="intake-outcome_status"
        legend="Did it ship?"
        name="outcome_status"
        options={OUTCOME_OPTIONS}
        value={outcome}
        onChange={onOutcomeChange}
        disabled={disabled}
      />

      {/* One free-text "numbers that moved?" used to stand in for all seven of
          these, and the branch gate then routed on whether that answer happened
          to contain a digit. */}
      <RepeatCard>
        <Toggle
          id="toggle-has_measurement"
          label={TOGGLE_COPY.hasMeasurement.label}
          helper={TOGGLE_COPY.hasMeasurement.helper}
          checked={toggles.has_measurement === true}
          onChange={(v) => onToggleChange('has_measurement', v)}
          disabled={disabled}
        />

        {toggles.has_measurement === true && (
          <FieldGroup
            fields={measurement}
            text={text}
            onTextChange={onTextChange}
            disabled={disabled}
          />
        )}
      </RepeatCard>

      <FieldGroup fields={open} text={text} onTextChange={onTextChange} disabled={disabled} />

      <Disclosure label={DISCLOSURE.step5} disabled={disabled}>
        <FieldGroup
          fields={collapsed}
          text={text}
          onTextChange={onTextChange}
          disabled={disabled}
        />
      </Disclosure>
    </div>
  )
}
