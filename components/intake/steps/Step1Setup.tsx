'use client'

import { FieldGroup } from '@/components/intake/FieldGroup'
import { Toggle } from '@/components/intake/Toggle'
import {
  PROJECT_TYPES,
  fieldsForStep,
  visibleFields,
  type TextKey,
  type ToggleKey,
} from '@/lib/intake-fields'
import { COLLABORATOR_FIELDS, WIZARD_COPY } from '@/lib/wizard-steps'
import type { Collaborator, ProjectType } from '@/types/database'

type Props = {
  projectType: ProjectType
  onProjectTypeChange: (t: ProjectType) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  toggles: Partial<Record<ToggleKey, boolean>>
  onToggleChange: (key: ToggleKey, value: boolean) => void
  collaborators: Collaborator[]
  onCollaboratorsChange: (c: Collaborator[]) => void
  isBusy: boolean
}

// Uploads used to lead this step. They are gone from it entirely — a file
// picked before any of the questions have been answered has nothing to be
// about, which is why the old step 4 existed to ask afterwards. Screens now sit
// beside the problem in step 2 and beside each decision in step 3.
export function Step1Setup(props: Props) {
  const {
    projectType,
    onProjectTypeChange,
    text,
    onTextChange,
    toggles,
    onToggleChange,
    collaborators,
    onCollaboratorsChange,
    isBusy,
  } = props

  const fields = visibleFields(fieldsForStep(1), toggles)
  const before = fields.filter((f) => f.key !== 'agency')
  const agency = fields.filter((f) => f.key === 'agency')

  return (
    <div>
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          Project type
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PROJECT_TYPES.map((t) => {
            const active = projectType === t.value
            const locked = t.comingSoon === true
            return (
              <button
                key={t.value}
                type="button"
                // Visible and refused, not hidden. Hiding it would let someone
                // pick "focused fix" for a project §2.2 routes elsewhere, and
                // the page would then argue from a prior state that never
                // existed. No onClick at all rather than a guarded one.
                {...(locked
                  ? { disabled: true, 'aria-disabled': true }
                  : { onClick: () => onProjectTypeChange(t.value), 'aria-pressed': active })}
                className={
                  'rounded-xl border p-3 text-left transition-colors ' +
                  (locked
                    ? 'cursor-not-allowed border-line bg-canvas/60 opacity-60'
                    : active
                      ? 'border-accent bg-accent/5'
                      : 'border-line bg-white hover:border-ink-soft/40')
                }
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{t.label}</span>
                  {locked && (
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                      {WIZARD_COPY.comingSoon}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-snug text-ink-muted">
                  {t.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <FieldGroup
          fields={before}
          text={text}
          onTextChange={onTextChange}
          isBusy={isBusy}
        />
      </div>

      {/* Sits directly under the client fields it governs. §4.6 and the spec's
          appendix make this an explicit user choice rather than a default the
          generator picks, because permission is a fact only the user holds. */}
      <div className="mt-4 rounded-xl border border-line bg-canvas/40 px-4 py-3">
        <Toggle
          id="toggle-client_may_be_named"
          label="The client may be named"
          helper="Off by default. Left off, nothing on the page names them — not the credits, not a caption."
          checked={toggles.client_may_be_named === true}
          onChange={(v) => onToggleChange('client_may_be_named', v)}
          disabled={isBusy}
        />
      </div>

      <div className="mt-6">
        <CollaboratorRows
          collaborators={collaborators}
          onChange={onCollaboratorsChange}
          isBusy={isBusy}
        />
      </div>

      <div className="mt-6">
        <FieldGroup
          fields={agency}
          text={text}
          onTextChange={onTextChange}
          isBusy={isBusy}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

// Names AND roles. The old field took one line of prose and Credits could not
// be built from it: §4.6 needs a role beside every name, and §4.3's ownership
// move needs to know who held what before it may say authority was split. A
// guessed credits line is a fabricated claim about a real person.
function CollaboratorRows({
  collaborators,
  onChange,
  isBusy,
}: {
  collaborators: Collaborator[]
  onChange: (c: Collaborator[]) => void
  isBusy: boolean
}) {
  const update = (i: number, patch: Partial<Collaborator>) =>
    onChange(collaborators.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  return (
    <fieldset id="collaborators">
      <legend className="block text-sm font-medium text-ink">
        Who else worked on this?
        <span className="ml-2 text-xs font-normal text-ink-muted">optional</span>
      </legend>

      {collaborators.length > 0 && (
        <ul className="mt-3 space-y-3">
          {collaborators.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={c.name}
                  disabled={isBusy}
                  aria-label={`${COLLABORATOR_FIELDS.name.label} ${i + 1}`}
                  placeholder={COLLABORATOR_FIELDS.name.placeholder}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink transition-shadow placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic focus-within:border-accent disabled:opacity-60"
                />
                <input
                  type="text"
                  value={c.role}
                  disabled={isBusy}
                  aria-label={`${COLLABORATOR_FIELDS.role.label} ${i + 1}`}
                  placeholder={COLLABORATOR_FIELDS.role.placeholder}
                  onChange={(e) => update(i, { role: e.target.value })}
                  className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink transition-shadow placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic focus-within:border-accent disabled:opacity-60"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(collaborators.filter((_, j) => j !== i))}
                disabled={isBusy}
                className="mt-3 text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
              >
                {WIZARD_COPY.removeDecision}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onChange([...collaborators, { name: '', role: '' }])}
        disabled={isBusy}
        className="mt-3 w-full rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        + {WIZARD_COPY.addCollaborator}
      </button>
      <p className="mt-1.5 text-xs text-ink-muted">
        Their role as well as their name — the credits need both, and neither can be guessed.
      </p>
    </fieldset>
  )
}
