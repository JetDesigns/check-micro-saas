'use client'

import { FieldGroup } from '@/components/intake/FieldGroup'
import { fieldsForStep, type TextKey } from '@/lib/intake-fields'
import { RELATION_CHIPS } from '@/lib/wizard-steps'
import type { Decision, DecisionRelations } from '@/types/database'

type Props = {
  decisions: Decision[]
  onChange: (decisions: Decision[]) => void
  text: Partial<Record<TextKey, string>>
  onTextChange: (key: TextKey, value: string) => void
  isBusy: boolean
}

// The step that replaced "Your screens".
//
// It exists because §6.2 selects a fix block's shape from three facts nothing
// was collecting — whether the decision breaks a pattern the others follow,
// whether it is one treatment repeated in many places, and whether it has to be
// read after another one. Without them every block falls through to the same
// default shape, which §3.4 names as a failure condition outright.
//
// Asked here rather than inside each decision card on purpose: "against the
// others" is not answerable one card at a time, and the whole set is visible on
// this screen at once.
export function Step4Structure({
  decisions,
  onChange,
  text,
  onTextChange,
  isBusy,
}: Props) {
  const named = decisions.filter((d) => d.decided.trim())

  const setRelations = (id: string, patch: Partial<DecisionRelations>) =>
    onChange(
      decisions.map((d) =>
        d.id === id ? { ...d, relations: { ...d.relations, ...patch } } : d
      )
    )

  return (
    <div className="space-y-6">
      {named.length === 0 ? (
        <p className="rounded-xl border border-line bg-canvas/60 px-4 py-3 text-sm leading-relaxed text-ink-soft">
          Name a decision or two in step 3 and they will appear here, so you can say how
          they sit against each other.
        </p>
      ) : (
        <ul className="space-y-3">
          {named.map((d) => (
            <li key={d.id} className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
              <p className="text-sm font-medium text-ink">{d.decided.trim()}</p>

              {/* Three independent chips, not a single choice. A fix can break
                  the pattern, repeat across many places, and depend on another
                  at the same time — and none of them selected is the honest
                  answer for most decisions, which is why there is no "none". */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip
                  label={RELATION_CHIPS.breaksPattern.label}
                  active={d.relations?.breaks_pattern !== undefined}
                  disabled={isBusy}
                  onClick={() =>
                    setRelations(d.id, {
                      breaks_pattern:
                        d.relations?.breaks_pattern === undefined ? '' : undefined,
                    })
                  }
                />
                <Chip
                  label={RELATION_CHIPS.repeatedTreatment.label}
                  active={d.relations?.repeated_treatment === true}
                  disabled={isBusy}
                  onClick={() =>
                    setRelations(d.id, {
                      repeated_treatment: !d.relations?.repeated_treatment,
                    })
                  }
                />
                <Chip
                  label={RELATION_CHIPS.dependsOn.label}
                  active={d.relations?.depends_on !== undefined}
                  disabled={isBusy || named.length < 2}
                  onClick={() =>
                    setRelations(d.id, {
                      depends_on:
                        d.relations?.depends_on === undefined
                          ? (named.find((o) => o.id !== d.id)?.id ?? undefined)
                          : undefined,
                    })
                  }
                />
              </div>

              {d.relations?.breaks_pattern !== undefined && (
                <div className="mt-4">
                  <label
                    htmlFor={`relation-${d.id}-pattern`}
                    className="block text-sm font-medium text-ink"
                  >
                    {RELATION_CHIPS.breaksPattern.revealLabel}
                  </label>
                  <input
                    id={`relation-${d.id}-pattern`}
                    type="text"
                    value={d.relations.breaks_pattern}
                    disabled={isBusy}
                    placeholder={RELATION_CHIPS.breaksPattern.revealPlaceholder}
                    onChange={(e) =>
                      setRelations(d.id, { breaks_pattern: e.target.value })
                    }
                    className="mt-2 block w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic focus-within:border-accent disabled:opacity-60"
                  />
                  {/* §5.6: an exception that cannot name what consistency would
                      have cost is not an exception, it is an inconsistency. */}
                  <p className="mt-1.5 text-xs text-ink-muted">
                    The rule the rest of the work follows, so the page can say what
                    following it would have cost.
                  </p>
                </div>
              )}

              {d.relations?.depends_on !== undefined && (
                <div className="mt-4">
                  <label
                    htmlFor={`relation-${d.id}-depends`}
                    className="block text-sm font-medium text-ink"
                  >
                    {RELATION_CHIPS.dependsOn.revealLabel}
                  </label>
                  <select
                    id={`relation-${d.id}-depends`}
                    value={d.relations.depends_on}
                    disabled={isBusy}
                    onChange={(e) => setRelations(d.id, { depends_on: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink focus-within:border-accent disabled:opacity-60"
                  >
                    {named
                      .filter((o) => o.id !== d.id)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.decided.trim()}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    Only where this one cannot be understood without reading that one
                    first. Otherwise your order is kept as you gave it.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <FieldGroup
        fields={fieldsForStep(4)}
        text={text}
        onTextChange={onTextChange}
        isBusy={isBusy}
      />
    </div>
  )
}

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={
        'rounded-lg border px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' +
        (active
          ? 'border-accent bg-accent text-white'
          : 'border-line bg-white text-ink-soft hover:border-ink-soft/40 hover:text-ink')
      }
    >
      {label}
    </button>
  )
}
