'use client'

import { ChoiceField } from '@/components/intake/ChoiceField'
import { FieldGroup } from '@/components/intake/FieldGroup'
import { Toggle } from '@/components/intake/Toggle'
import { ScreenSlot } from '@/components/wizard/AttachmentStep'
import {
  PROVENANCE_OPTIONS,
  fieldsForStep,
  type TextKey,
  type ToggleKey,
} from '@/lib/intake-fields'
import type { Attachment } from '@/lib/wizard-steps'
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
  isBusy: boolean
}

// The separation this step performs is the whole argument of the page. The old
// wizard asked one question — "what was wrong before?" — and got back whichever
// of the report, the diagnosis and the evidence the designer thought of first.
// §5.2 makes the reframe load-bearing, and one field cannot produce two halves
// of a distinction.
export function Step2Problem({
  text,
  onTextChange,
  toggles,
  onToggleChange,
  provenance,
  onProvenanceChange,
  attachments,
  onAttachmentsChange,
  isBusy,
}: Props) {
  const fields = fieldsForStep(2)
  const reported = fields.filter((f) => f.key === 'reported_problem')
  const rest = fields.filter((f) => f.key !== 'reported_problem')

  return (
    <div className="space-y-6">
      <div>
        <FieldGroup
          fields={reported}
          text={text}
          onTextChange={onTextChange}
          isBusy={isBusy}
        />
        {/* §8.5 may only quote wording the designer confirms is the client's,
            and §10.3 forbids reconstructing a quotation — including one they
            plausibly would have said. This toggle is the confirmation. */}
        <div className="mt-3 rounded-xl border border-line bg-canvas/40 px-4 py-3">
          <Toggle
            id="toggle-reported_verbatim"
            label="These are their exact words"
            helper="Only with this on will the page quote them. Off, it says the client reported it, in yours."
            checked={toggles.reported_verbatim === true}
            onChange={(v) => onToggleChange('reported_verbatim', v)}
            disabled={isBusy}
          />
        </div>
      </div>

      <FieldGroup
        fields={rest.filter((f) => f.key === 'diagnosis')}
        text={text}
        onTextChange={onTextChange}
        isBusy={isBusy}
      />

      <ChoiceField
        id="intake-diagnosis_provenance"
        legend="How did you find out?"
        name="diagnosis_provenance"
        options={PROVENANCE_OPTIONS}
        value={provenance}
        onChange={onProvenanceChange}
        disabled={isBusy}
      />
      <p className="-mt-3 text-xs text-ink-muted">
        Optional. It becomes one line saying where the finding came from, which is the
        cheapest credibility the page can buy.
      </p>

      <FieldGroup
        fields={rest.filter((f) => f.key === 'cost_to_client')}
        text={text}
        onTextChange={onTextChange}
        isBusy={isBusy}
      />

      {/* §5.4's exhibit. These belong to no decision — there are none yet — so
          their captions name the evidence rather than a choice. */}
      <div className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
        <ScreenSlot
          slot="problem"
          label="Screens showing the problem"
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          isBusy={isBusy}
        />
      </div>
    </div>
  )
}
