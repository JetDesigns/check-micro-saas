'use client'

import { Button } from '@/components/studio/Button'
import { ChipRow } from '@/components/studio/ChipRow'
import { Disclosure } from '@/components/studio/Disclosure'
import { FieldGroup } from '@/components/studio/FieldGroup'
import { FormSelect } from '@/components/studio/FormSelect'
import { RepeatCard } from '@/components/studio/RepeatCard'
import {
  WORK_SHAPE_OPTIONS,
  fieldsForShape,
  partitionByDisclosure,
  type TextKey,
  type WorkShape,
} from '@/lib/intake-fields'
import {
  AREA_CHIPS,
  DISCLOSURE,
  FLOW_CHIPS,
  approachHint,
  RELATION_CHIPS,
  SECTION_CHIPS,
  SECTION_FATES,
  assignFate,
  parseAreas,
  reconcileAreas,
  reconcileFates,
  shownShape,
  toggleName,
} from '@/lib/wizard-steps'
import type { Decision, DecisionRelations, SectionFate } from '@/types/database'

type Props = {
  decisions: Decision[]
  onChange: (decisions: Decision[]) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  areasWorked: string[]
  areasFromScratch: string[]
  onAreasChange: (worked: string[], fromScratch: string[]) => void
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
  areasWorked,
  areasFromScratch,
  onAreasChange,
  shape: shapeProp,
  onShapeChange,
  sectionFates,
  onSectionFatesChange,
  stepsRemoved,
  onStepsRemovedChange,
  disabled,
}: Props) {
  const named = decisions.filter((d) => d.decided.trim())

  // Chips are generated from the answer above them, and both selections are
  // reconciled against it on every render rather than in an effect. Editing the
  // list is the common case — someone types eight parts, taps four, then renames
  // one — and a selection pointing at a name that is no longer on screen is a
  // claim nobody made.
  const shape = shownShape(shapeProp, text)

  const areas = parseAreas(text.product_areas)
  const { worked, fromScratch } = reconcileAreas(areas, areasWorked, areasFromScratch)

  const sections = parseAreas(text.page_sections)
  const fates = reconcileFates(sections, sectionFates)

  const steps = parseAreas(text.flow_steps)
  const removed = stepsRemoved.filter((n) => steps.includes(n))

  // The review screen says this too, after the step is behind you. Here it is
  // said while there is still something to do about it — which is what both
  // real projects needed and did not get.
  const hint = approachHint({ shape: shapeProp, text, areasWorked, areasFromScratch, sectionFates, stepsRemoved })

  // One filter, never a hand-written list beside it: a key named in both would
  // render its input twice, which reads as the field having broken.
  const { open, collapsed } = partitionByDisclosure(
    fieldsForShape(shape).filter((f) => f.step === 4)
  )

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
        disabled={disabled}
      />

      <FieldGroup fields={open} text={text} onTextChange={onTextChange} disabled={disabled} />

      {shape === 'separate_parts' && areas.length > 0 && (
        <div className="flex flex-col gap-4">
          <ChipRow
            legend={AREA_CHIPS.worked}
            names={areas}
            pressed={(name) => worked.includes(name)}
            onToggle={(name) => {
              const next = toggleName(worked, name)
              onAreasChange(next, fromScratch.filter((n) => next.includes(n)))
            }}
            disabled={disabled}
          />

          {/* Only over what was worked on. Which parts were touched is a coverage
              map; which of those were built from scratch is a different claim, and
              it is the one the Approach diagram makes. */}
          {worked.length > 0 && (
            <ChipRow
              legend={AREA_CHIPS.fromScratch}
              names={worked}
              pressed={(name) => fromScratch.includes(name)}
              onToggle={(name) => onAreasChange(worked, toggleName(fromScratch, name))}
              disabled={disabled}
            />
          )}
        </div>
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
      {shape === 'one_flow' && steps.length > 0 && (
        <ChipRow
          legend={FLOW_CHIPS.removed}
          names={steps}
          pressed={(name) => removed.includes(name)}
          onToggle={(name) => onStepsRemovedChange(toggleName(removed, name))}
          disabled={disabled}
        />
      )}

      {/* Same classes as the review screen's note, so the two read as one
          voice rather than as two systems talking. */}
      {hint && (
        <p className="studio-small rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[var(--studio-text-soft)]">
          {hint}
        </p>
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
