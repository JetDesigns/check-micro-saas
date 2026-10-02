'use client'

import { Button } from '@/components/studio/Button'
import { Disclosure } from '@/components/studio/Disclosure'
import { FieldGroup } from '@/components/studio/FieldGroup'
import { SelectionCard, BoxIcon, WrenchIcon } from '@/components/studio/SelectionCard'
import { Toggle } from '@/components/studio/Toggle'
import {
  PROJECT_TYPES,
  TONES,
  fieldsForStep,
  partitionByDisclosure,
  visibleFields,
  type TextKey,
  type ToggleKey,
} from '@/lib/intake-fields'
import {
  COLLABORATOR_FIELDS,
  DISCLOSURE,
  TOGGLE_COPY,
  WIZARD_COPY,
} from '@/lib/wizard-steps'
import type { Collaborator, ProjectType, Tone } from '@/types/database'

type Props = {
  projectType: ProjectType
  onProjectTypeChange: (t: ProjectType) => void
  tone: Tone
  onToneChange: (t: Tone) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  toggles: Partial<Record<ToggleKey, boolean>>
  onToggleChange: (key: ToggleKey, value: boolean) => void
  collaborators: Collaborator[]
  onCollaboratorsChange: (c: Collaborator[]) => void
  disabled: boolean
}

// Uploads used to lead this step. They are gone from it entirely — a file picked
// before any of the questions have been answered has nothing to be about, which
// is why the old step 4 existed to ask afterwards. Screens sit beside the problem
// in step 2 and beside each decision in step 3.
export function Step1Project(props: Props) {
  const {
    projectType,
    onProjectTypeChange,
    tone,
    onToneChange,
    text,
    onTextChange,
    toggles,
    onToggleChange,
    collaborators,
    onCollaboratorsChange,
    disabled,
  } = props

  const { open, collapsed } = partitionByDisclosure(visibleFields(fieldsForStep(1), toggles))

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="studio-h2 text-[var(--studio-text)]">Project type</legend>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {PROJECT_TYPES.map((t) => (
            <SelectionCard
              key={t.value}
              title={t.label}
              description={t.description}
              icon={t.value === 'focused_fix' ? <WrenchIcon /> : <BoxIcon />}
              selected={projectType === t.value}
              locked={t.comingSoon === true}
              lockedLabel={WIZARD_COPY.comingSoon}
              onClick={() => onProjectTypeChange(t.value)}
            />
          ))}
        </div>
      </fieldset>

      {/* Figma draws the tone row with the chip component, which is what this
          is. See the block above TONES in lib/intake-fields.ts for what the
          selection does and does not do. */}
      <fieldset>
        <legend className="studio-h2 text-[var(--studio-text)]">Tone</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <Button
              key={t.value}
              variant="chip"
              pressed={tone === t.value}
              disabled={disabled}
              onClick={() => onToneChange(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </fieldset>

      <FieldGroup fields={open} text={text} onTextChange={onTextChange} disabled={disabled} />

      <Disclosure label={DISCLOSURE.step1} disabled={disabled}>
        {/* Permission is a fact only the person has, so it is asked rather than
            defaulted — and it is off until they say otherwise. */}
        <div className="rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4">
          <Toggle
            id="toggle-client_may_be_named"
            label={TOGGLE_COPY.clientMayBeNamed.label}
            checked={toggles.client_may_be_named === true}
            onChange={(v) => onToggleChange('client_may_be_named', v)}
            disabled={disabled}
          />
        </div>

        <CollaboratorRows
          collaborators={collaborators}
          onChange={onCollaboratorsChange}
          disabled={disabled}
        />

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

// ---------------------------------------------------------------------------

// Names AND roles. The old field took one line of prose, and a credits line
// cannot be built from a list of names — nor can it be guessed, since it is a
// claim about real people.
//
// Starts as the add link alone. An empty row on arrival is a question nobody
// asked, and it is counted as a visible field by anyone looking at the step.
function CollaboratorRows({
  collaborators,
  onChange,
  disabled,
}: {
  collaborators: Collaborator[]
  onChange: (c: Collaborator[]) => void
  disabled: boolean
}) {
  const update = (i: number, patch: Partial<Collaborator>) =>
    onChange(collaborators.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  const input =
    'studio-small block w-full rounded-[var(--studio-r-md)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] p-2 text-[var(--studio-text)] placeholder:text-[var(--studio-text-soft)] disabled:opacity-60'

  return (
    <fieldset id="collaborators">
      <legend className="studio-h2 text-[var(--studio-text)]">
        {COLLABORATOR_FIELDS.legend}
      </legend>

      {collaborators.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {collaborators.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={c.name}
                  disabled={disabled}
                  aria-label={`${COLLABORATOR_FIELDS.name.label} ${i + 1}`}
                  placeholder={COLLABORATOR_FIELDS.name.placeholder}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className={input}
                />
                <input
                  type="text"
                  value={c.role}
                  disabled={disabled}
                  aria-label={`${COLLABORATOR_FIELDS.role.label} ${i + 1}`}
                  placeholder={COLLABORATOR_FIELDS.role.placeholder}
                  onChange={(e) => update(i, { role: e.target.value })}
                  className={input}
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(collaborators.filter((_, j) => j !== i))}
                disabled={disabled}
                className="studio-small mt-2 text-[var(--studio-text-soft)] underline-offset-4 hover:text-[var(--studio-text)] hover:underline disabled:opacity-40"
              >
                {WIZARD_COPY.removeDecision}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <Button
          variant="outline"
          full
          dashed
          disabled={disabled}
          onClick={() => onChange([...collaborators, { name: '', role: '' }])}
        >
          + {WIZARD_COPY.addCollaborator}
        </Button>
      </div>
    </fieldset>
  )
}
