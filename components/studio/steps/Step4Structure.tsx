'use client'

import { Button } from '@/components/studio/Button'
import { Disclosure } from '@/components/studio/Disclosure'
import { FieldGroup } from '@/components/studio/FieldGroup'
import { RepeatCard } from '@/components/studio/RepeatCard'
import { fieldsForStep, partitionByDisclosure, type TextKey } from '@/lib/intake-fields'
import { AREA_CHIPS, DISCLOSURE, RELATION_CHIPS, parseAreas, reconcileAreas } from '@/lib/wizard-steps'
import type { Decision, DecisionRelations } from '@/types/database'

type Props = {
  decisions: Decision[]
  onChange: (decisions: Decision[]) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  areasWorked: string[]
  areasFromScratch: string[]
  onAreasChange: (worked: string[], fromScratch: string[]) => void
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
  disabled,
}: Props) {
  const named = decisions.filter((d) => d.decided.trim())

  // Chips are generated from the answer above them, and both selections are
  // reconciled against it on every render rather than in an effect. Editing the
  // list is the common case — someone types eight parts, taps four, then renames
  // one — and a selection pointing at a name that is no longer on screen is a
  // claim nobody made.
  const areas = parseAreas(text.product_areas)
  const { worked, fromScratch } = reconcileAreas(areas, areasWorked, areasFromScratch)

  const toggle = (list: string[], name: string) =>
    list.includes(name) ? list.filter((n) => n !== name) : [...list, name]

  const { open, collapsed } = partitionByDisclosure(fieldsForStep(4))

  const setRelations = (id: string, patch: Partial<DecisionRelations>) =>
    onChange(
      decisions.map((d) => (d.id === id ? { ...d, relations: { ...d.relations, ...patch } } : d))
    )

  const control =
    'studio-small mt-2 block w-full rounded-[var(--studio-r-md)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] p-2 text-[var(--studio-text)] placeholder:text-[var(--studio-text-soft)] disabled:opacity-60'

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup fields={open} text={text} onTextChange={onTextChange} disabled={disabled} />

      {areas.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="studio-h2 text-[var(--studio-text)]">{AREA_CHIPS.worked}</p>
            <div className="flex flex-wrap gap-2">
              {areas.map((name) => (
                <Button
                  key={name}
                  variant="chip"
                  pressed={worked.includes(name)}
                  disabled={disabled}
                  onClick={() => {
                    const next = toggle(worked, name)
                    onAreasChange(next, fromScratch.filter((n) => next.includes(n)))
                  }}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Only over what was worked on. Which parts were touched is a coverage
              map; which of those were built from scratch is a different claim, and
              it is the one the Approach diagram makes. */}
          {worked.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="studio-h2 text-[var(--studio-text)]">{AREA_CHIPS.fromScratch}</p>
              <div className="flex flex-wrap gap-2">
                {worked.map((name) => (
                  <Button
                    key={name}
                    variant="chip"
                    pressed={fromScratch.includes(name)}
                    disabled={disabled}
                    onClick={() => onAreasChange(worked, toggle(fromScratch, name))}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          )}
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
