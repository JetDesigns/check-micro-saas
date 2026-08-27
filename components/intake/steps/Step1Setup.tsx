'use client'

import { AttachmentStep, type Attachment } from '@/components/wizard/AttachmentStep'
import { FieldRow } from '@/components/intake/FieldRow'
import { PROJECT_TYPES, TONES, fieldsForStep, type TextKey } from '@/lib/intake-fields'
import type { ProjectType, Tone } from '@/types/database'

type Props = {
  attachments: Attachment[]
  onAttachmentsChange: (a: Attachment[]) => void
  projectType: ProjectType
  onProjectTypeChange: (t: ProjectType) => void
  tone: Tone
  onToneChange: (t: Tone) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  isBusy: boolean
}

export function Step1Setup(props: Props) {
  const {
    attachments,
    onAttachmentsChange,
    projectType,
    onProjectTypeChange,
    tone,
    onToneChange,
    text,
    onTextChange,
    isBusy,
  } = props

  return (
    <div>
      <AttachmentStep
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
        isBusy={isBusy}
      />

      <fieldset className="mt-6">
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          What kind of project was it?
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PROJECT_TYPES.map((t) => {
            const active = projectType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onProjectTypeChange(t.value)}
                aria-pressed={active}
                className={
                  'rounded-xl border p-3 text-left transition-colors ' +
                  (active
                    ? 'border-accent bg-accent/5'
                    : 'border-line bg-white hover:border-ink-soft/40')
                }
              >
                <span className="block text-sm font-medium text-ink">
                  {t.label}
                </span>
                <span className="mt-1 block text-xs leading-snug text-ink-muted">
                  {t.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          Tone
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => {
            const active = tone === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onToneChange(t.value)}
                aria-pressed={active}
                className={
                  'rounded-lg border px-3.5 py-1.5 text-sm transition-colors ' +
                  (active
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-white text-ink-soft hover:border-ink-soft/40 hover:text-ink')
                }
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6 space-y-5">
        {fieldsForStep(1).map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={text[field.key] ?? ''}
            isBusy={isBusy}
            onChange={(v) => onTextChange(field.key, v)}
          />
        ))}
      </div>
    </div>
  )
}
