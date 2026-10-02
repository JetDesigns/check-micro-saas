'use client'

import { ChoiceField } from '@/components/intake/ChoiceField'
import { FieldGroup } from '@/components/intake/FieldGroup'
import { Toggle } from '@/components/intake/Toggle'
import {
  OUTCOME_OPTIONS,
  fieldsForStep,
  fieldsRevealedBy,
  visibleFields,
  type TextKey,
  type ToggleKey,
} from '@/lib/intake-fields'
import type { OutcomeStatus } from '@/types/database'

type Props = {
  outcome: OutcomeStatus | null
  onOutcomeChange: (o: OutcomeStatus) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  toggles: Partial<Record<ToggleKey, boolean>>
  onToggleChange: (key: ToggleKey, value: boolean) => void
  isBusy: boolean
}

export function Step5Outcome({
  outcome,
  onOutcomeChange,
  text,
  onTextChange,
  toggles,
  onToggleChange,
  isBusy,
}: Props) {
  const measurement = fieldsRevealedBy('has_measurement')
  const measurementKeys = new Set<string>(measurement.map((f) => f.key))
  const plain = visibleFields(fieldsForStep(5), toggles).filter(
    (f) => !measurementKeys.has(f.key)
  )

  return (
    <div className="space-y-6">
      <div>
        <ChoiceField
          id="intake-outcome_status"
          legend="Did it ship?"
          name="outcome_status"
          options={OUTCOME_OPTIONS}
          value={outcome}
          onChange={onOutcomeChange}
          disabled={isBusy}
        />
        {/* §10.5 and §4.5: this is metadata about shipping and never becomes
            the section's claim. Handed off and not launched cost the page
            nothing — what changed for the client is a separate question. */}
        <p className="mt-2 text-xs text-ink-muted">
          It sits in the metadata, not in the result. Handed off is as complete a story as
          shipped.
        </p>
      </div>

      {/* The metric block. One free-text "numbers that moved?" used to stand in
          for all seven of these, and the branch gate then routed on whether
          that answer contained a digit — putting the page into the branch that
          requires a baseline, a window, a source and an attribution limit it
          had no way of holding. */}
      <div className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
        <Toggle
          id="toggle-has_measurement"
          label="Do you have a measured number?"
          helper="Only if it was actually measured. A blank here costs the page nothing."
          checked={toggles.has_measurement === true}
          onChange={(v) => onToggleChange('has_measurement', v)}
          disabled={isBusy}
        />

        {toggles.has_measurement === true && (
          <div className="mt-5">
            <FieldGroup
              fields={measurement}
              text={text}
              onTextChange={onTextChange}
              isBusy={isBusy}
            />
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              All of it or none of it. A number without its period and its source cannot be
              printed — it invites a reader to check something that cannot be checked.
            </p>
          </div>
        )}
      </div>

      <FieldGroup
        fields={plain}
        text={text}
        onTextChange={onTextChange}
        isBusy={isBusy}
      />
    </div>
  )
}
