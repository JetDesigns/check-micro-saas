'use client'

import { Button } from '@/components/studio/Button'
import { ChipInput } from '@/components/studio/ChipInput'
import { ChipRow } from '@/components/studio/ChipRow'
import { Disclosure } from '@/components/studio/Disclosure'
import { FieldGroup } from '@/components/studio/FieldGroup'
import { FormSelect } from '@/components/studio/FormSelect'
import { RepeatCard } from '@/components/studio/RepeatCard'
import {
  WORK_SHAPE_OPTIONS,
  fieldByKey,
  fieldsForShape,
  isChipField,
  partitionByDisclosure,
  type TextKey,
  type WorkShape,
} from '@/lib/intake-fields'
import {
  AREA_CHIPS,
  DISCLOSURE,
  FLOW_CHIPS,
  WIZARD_COPY,
  approachHint,
  RELATION_CHIPS,
  SECTION_CHIPS,
  SECTION_FATES,
  assignFate,
  reconcileFates,
  shownShape,
  toggleName,
  unattachedDecisions,
  type Chip,
} from '@/lib/wizard-steps'
import type { Decision, DecisionRelations, SectionFate } from '@/types/database'

type Props = {
  decisions: Decision[]
  onChange: (decisions: Decision[]) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  parts: Chip[]
  onPartsChange: (parts: Chip[]) => void
  pageSections: Chip[]
  onPageSectionsChange: (sections: Chip[]) => void
  flowSteps: Chip[]
  onFlowStepsChange: (steps: Chip[]) => void
  shape: WorkShape | null
  onShapeChange: (shape: WorkShape) => void
  sectionFates: Record<string, SectionFate>
  onSectionFatesChange: (fates: Record<string, SectionFate>) => void
  stepsRemoved: string[]
  onStepsRemovedChange: (removed: string[]) => void
  disabled: boolean
}

// The step that replaced "Your screens".
//
// It exists because §6.2 selects a fix block's shape from three facts nothing was
// collecting — whether the decision breaks a pattern the others follow, whether
// it is one treatment repeated in many places, and whether it has to be read
// after another one. Without them every block falls through to the same default
// shape, which §3.4 names as a failure condition outright.
//
// Asked here rather than inside each decision card on purpose: "against the
// others" is not answerable one card at a time, and the whole set is visible on
// this screen at once.
//
// The chips are Figma's chip Button, which the file draws only as a SINGLE-select
// row. Three per decision here, independently toggleable — a fix can break the
// pattern, repeat across many places and depend on another at the same time, and
// none of them selected is the honest answer for most decisions, which is why
// there is no "none".
export function Step4Structure({
  decisions,
  onChange,
  text,
  onTextChange,
  parts,
  onPartsChange,
  pageSections,
  onPageSectionsChange,
  flowSteps,
  onFlowStepsChange,
  shape: shapeProp,
  onShapeChange,
  sectionFates,
  onSectionFatesChange,
  stepsRemoved,
  onStepsRemovedChange,
  disabled,
}: Props) {
  const named = decisions.filter((d) => d.decided.trim())

  // The chips ARE the list now, so nothing is parsed out of a textarea and
  // nothing is reconciled back against one. The page and flow branches still
  // keep their marking in a separate structure keyed by label, so those two are
  // reconciled against the chip labels on every render — the same discipline,
  // against the chips rather than against text.
  const shape = shownShape(shapeProp, text)

  const sections = pageSections.map((c) => c.label)
  const fates = reconcileFates(sections, sectionFates)

  const steps = flowSteps.map((c) => c.label)
  const removed = stepsRemoved.filter((n) => steps.includes(n))

  // The review screen says this too, after the step is behind you. Here it is
  // said while there is still something to do about it — which is what both
  // real projects needed and did not get.
  const hint = approachHint({
    shape: shapeProp,
    text,
    parts,
    pageSections,
    flowSteps,
    sectionFates,
    stepsRemoved,
  })

  // Named in step 3 and on no part. A note, never a blocker: plenty of work does
  // not land on one named area, and nothing downstream may invent a part to hang
  // it on — so the only honest move is to show which decisions the picture will
  // not mention and let the designer decide.
  const unattached = shape === 'separate_parts' ? unattachedDecisions(decisions, parts) : []

  // One filter, never a hand-written list beside it: a key named in both would
  // render its input twice, which reads as the field having broken. The three
  // list fields come out here because `ChipInput` draws them instead; their copy
  // is still read from the registry, by key, just below.
  const { open, collapsed } = partitionByDisclosure(
    fieldsForShape(shape).filter((f) => f.step === 4 && !isChipField(f))
  )

  const listField = (key: TextKey) => {
    const f = fieldByKey(key)
    return {
      legend: f?.label ?? '',
      helper: f?.helper,
      placeholder: f?.placeholder,
    }
  }

  const setRelations = (id: string, patch: Partial<DecisionRelations>) =>
    onChange(
      decisions.map((d) => (d.id === id ? { ...d, relations: { ...d.relations, ...patch } } : d))
    )

  const control =
    'studio-small mt-2 block w-full rounded-[var(--studio-r-md)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] p-2 text-[var(--studio-text)] placeholder:text-[var(--studio-text-soft)] disabled:opacity-60'

  return (
    <div className="flex flex-col gap-4">
      {/* The fork, and NOTHING IS PRESELECTED. It carried a default until two
          real projects went through on it unnoticed — a one-page website and a
          three-screen app, both filed as "a product with separate parts"
          because that was simply what was already ticked. An unanswered
          question has to look unanswered. */}
      <FormSelect
        legend={SECTION_CHIPS.fork}
        name="work_shape"
        options={WORK_SHAPE_OPTIONS}
        // One per row, the way step 2's provenance question already stacks:
        // two-up leaves about 201px of text per option, where these examples
        // need a line of their own, and three options in a two-column grid
        // strand the third in a ragged second row.
        columns={1}
        value={shape}
        onChange={onShapeChange}
        helper={SECTION_CHIPS.forkHelper}
        lockedLabel={WIZARD_COPY.comingSoon}
        disabled={disabled}
      />

      <FieldGroup fields={open} text={text} onTextChange={onTextChange} disabled={disabled} />

      {/* The whole list, the taps, and the attachments, in one control. Tapping a
          chip says "I worked on this"; a tapped chip opens to take the decisions
          that landed on it. Both are things the designer states — neither is read
          off the other, which is what the two separate chip rows here used to be
          protecting and what this keeps. */}
      {shape === 'separate_parts' && (
        <div className="flex flex-col gap-4">
          <ChipInput
            {...listField('product_areas')}
            chips={parts}
            onChange={onPartsChange}
            markable
            decisions={named.map((d) => ({ id: d.id, label: d.decided.trim() }))}
            disabled={disabled}
          />
          {parts.length > 0 && (
            <p className="studio-small text-[var(--studio-text-soft)]">{AREA_CHIPS.worked}</p>
          )}
        </div>
      )}

      {/* Entry and order only. The page branch keeps its three fates, which are
          what the overlay's categories are built from — a binary mark here would
          leave that diagram with nothing to group by. */}
      {shape === 'single_page' && (
        <ChipInput
          {...listField('page_sections')}
          chips={pageSections}
          onChange={onPageSectionsChange}
          disabled={disabled}
        />
      )}

      {/* One row per section, the three fates exclusive within it. Tapping the
          fate a section already carries clears it, and a section nobody sorted
          is a real answer rather than a missing one — so there is no "none"
          chip and nothing here nags about an empty row. */}
      {shape === 'single_page' && sections.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="studio-h2 text-[var(--studio-text)]">{SECTION_CHIPS.perSection}</p>
          {sections.map((name) => (
            <ChipRow
              key={name}
              legend={name}
              names={SECTION_FATES.map((f) => f.label)}
              pressed={(label) =>
                fates[name] === SECTION_FATES.find((f) => f.label === label)?.value
              }
              onToggle={(label) => {
                const fate = SECTION_FATES.find((f) => f.label === label)?.value
                if (fate) onSectionFatesChange(assignFate(fates, name, fate))
              }}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* One tap per step, binary: a step survived or it did not. §5.2 counts a
          step merged into another as removed, which is why the question asks
          what is gone rather than what was deleted. */}
      {/* Unreachable from the fork, which locks this branch (`locked` on
          WORK_SHAPE_OPTIONS). Built and kept wired because the branch itself —
          `buildSequenceCollapse` and its gates — is finished and passing, and an
          older draft or a fixture can still arrive carrying this shape. */}
      {shape === 'one_flow' && (
        <div className="flex flex-col gap-4">
          <ChipInput
            {...listField('flow_steps')}
            chips={flowSteps}
            onChange={onFlowStepsChange}
            disabled={disabled}
          />
          {steps.length > 0 && (
            <ChipRow
              legend={FLOW_CHIPS.removed}
              names={steps}
              pressed={(name) => removed.includes(name)}
              onToggle={(name) => onStepsRemovedChange(toggleName(removed, name))}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Same classes as the review screen's note, so the two read as one
          voice rather than as two systems talking. */}
      {hint && (
        <p className="studio-small rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[var(--studio-text-soft)]">
          {hint}
        </p>
      )}

      {/* Only once something has been tapped. Before that every decision is
          unattached, and saying so would be a complaint about a question nobody
          has reached yet. The decision text is the designer's own, so it is
          listed rather than described. */}
      {unattached.length > 0 && parts.some((c) => c.worked) && (
        <div className="studio-small rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[var(--studio-text-soft)]">
          <p>{WIZARD_COPY.noteUnattached}</p>
          <ul className="mt-1 list-disc pl-5">
            {unattached.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {named.length === 0 ? (
        <p className="studio-body rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[var(--studio-text-soft)]">
          Name a decision or two in step 3 and they will appear here, so you can say how
          they sit against each other.
        </p>
      ) : (
        named.map((d) => (
          <RepeatCard key={d.id}>
            <p className="studio-h2 text-[var(--studio-text)]">{d.decided.trim()}</p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="chip"
                pressed={d.relations?.breaks_pattern !== undefined}
                disabled={disabled}
                onClick={() =>
                  setRelations(d.id, {
                    breaks_pattern: d.relations?.breaks_pattern === undefined ? '' : undefined,
                  })
                }
              >
                {RELATION_CHIPS.breaksPattern.label}
              </Button>
              <Button
                variant="chip"
                pressed={d.relations?.repeated_treatment === true}
                disabled={disabled}
                onClick={() =>
                  setRelations(d.id, { repeated_treatment: !d.relations?.repeated_treatment })
                }
              >
                {RELATION_CHIPS.repeatedTreatment.label}
              </Button>
              <Button
                variant="chip"
                pressed={d.relations?.depends_on !== undefined}
                disabled={disabled || named.length < 2}
                title={named.length < 2 ? 'Needs a second named decision' : undefined}
                onClick={() =>
                  setRelations(d.id, {
                    depends_on:
                      d.relations?.depends_on === undefined
                        ? named.find((o) => o.id !== d.id)?.id
                        : undefined,
                  })
                }
              >
                {RELATION_CHIPS.dependsOn.label}
              </Button>
            </div>

            {d.relations?.breaks_pattern !== undefined && (
              <div>
                <label
                  htmlFor={`relation-${d.id}-pattern`}
                  className="studio-h2 text-[var(--studio-text)]"
                >
                  {RELATION_CHIPS.breaksPattern.revealLabel}
                </label>
                <input
                  id={`relation-${d.id}-pattern`}
                  type="text"
                  value={d.relations.breaks_pattern}
                  disabled={disabled}
                  placeholder={RELATION_CHIPS.breaksPattern.revealPlaceholder}
                  onChange={(e) => setRelations(d.id, { breaks_pattern: e.target.value })}
                  className={control}
                />
              </div>
            )}

            {d.relations?.depends_on !== undefined && (
              <div>
                <label
                  htmlFor={`relation-${d.id}-depends`}
                  className="studio-h2 text-[var(--studio-text)]"
                >
                  {RELATION_CHIPS.dependsOn.revealLabel}
                </label>
                <select
                  id={`relation-${d.id}-depends`}
                  value={d.relations.depends_on}
                  disabled={disabled}
                  onChange={(e) => setRelations(d.id, { depends_on: e.target.value })}
                  className={control}
                >
                  {named
                    .filter((o) => o.id !== d.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.decided.trim()}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </RepeatCard>
        ))
      )}

      {/* Three of step 4's flat fields stay collapsed. The product's parts is the
          fourth and opens with the step, because the Approach diagram is built
          from it and behind a link most people would never reach it. */}
      <Disclosure label={DISCLOSURE.step4} disabled={disabled}>
        <FieldGroup fields={collapsed} text={text} onTextChange={onTextChange} disabled={disabled} />
      </Disclosure>
    </div>
  )
}
