'use client'

import { Disclosure } from '@/components/studio/Disclosure'
import { FieldGroup } from '@/components/studio/FieldGroup'
import { FormSelect } from '@/components/studio/FormSelect'
import { Toggle } from '@/components/studio/Toggle'
import { UploadSlot } from '@/components/studio/UploadSlot'
import { PROVENANCE_OPTIONS, fieldsForStep, type TextKey, type ToggleKey } from '@/lib/intake-fields'
import { DISCLOSURE, SLOT_LABELS, TOGGLE_COPY, type Attachment } from '@/lib/wizard-steps'
import type { Provenance } from '@/types/database'

type Props = {
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  toggles: Partial<Record<ToggleKey, boolean>>
  onToggleChange: (key: ToggleKey, value: boolean) => void
  provenance: Provenance | null
  onProvenanceChange: (p: Provenance) => void
  attachments: Attachment[]
  onAttachmentsChange: (a: Attachment[]) => void
  disabled: boolean
}

// The separation this step performs is the whole argument of the page. The old
// wizard asked one question — "what was wrong before?" — and got back whichever
// of the report, the diagnosis and the evidence the designer thought of first.
// One field cannot produce two halves of a distinction.
export function Step2Problem({
  text,
  onTextChange,
  toggles,
  onToggleChange,
  provenance,
  onProvenanceChange,
  attachments,
  onAttachmentsChange,
  disabled,
}: Props) {
  const fields = fieldsForStep(2)
  const only = (key: string) => fields.filter((f) => f.key === key)

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup fields={only('reported_problem')} text={text} onTextChange={onTextChange} disabled={disabled} />

      {/* Nothing is quoted without this. A reconstructed quotation — even one
          the client plausibly would have said — is not a quotation. */}
      <div className="rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4">
        <Toggle
          id="toggle-reported_verbatim"
          label={TOGGLE_COPY.reportedVerbatim.label}
          checked={toggles.reported_verbatim === true}
          onChange={(v) => onToggleChange('reported_verbatim', v)}
          disabled={disabled}
        />
      </div>

      <FieldGroup fields={only('diagnosis')} text={text} onTextChange={onTextChange} disabled={disabled} />

      <FieldGroup fields={only('cost_to_client')} text={text} onTextChange={onTextChange} disabled={disabled} />

      {/* Evidence, belonging to no decision — there are none yet. */}
      <div className="rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4">
        <UploadSlot
          slot="problem"
          label={SLOT_LABELS.problem}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          disabled={disabled}
        />
      </div>

      <Disclosure label={DISCLOSURE.step2} disabled={disabled}>
        <FormSelect
          id="intake-diagnosis_provenance"
          legend={DISCLOSURE.step2}
          name="diagnosis_provenance"
          options={PROVENANCE_OPTIONS}
          value={provenance}
          onChange={onProvenanceChange}
          columns={1}
          disabled={disabled}
        />
      </Disclosure>
    </div>
  )
}
