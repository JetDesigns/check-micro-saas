'use client'

import {
  DECISIONS_MAX,
  DECISIONS_MIN,
  DECISION_FIELDS,
  WIZARD_COPY,
  createDecision,
  decisionElementId,
} from '@/lib/wizard-steps'
import type { Decision } from '@/types/database'

type Props = {
  decisions: Decision[]
  onChange: (decisions: Decision[]) => void
  isBusy: boolean
}

// The core of the product. Everything else in the wizard is context; this is
// where the spine comes from — one decision unit per block, and the renderer
// turns each into a move section with a finding behind it and, where the user
// gave one, the trade-off that justifies it.
//
// Two blocks are visible from the start because the spine needs at least two
// entries to be a spine at all. Nothing enforces that here: an empty block is
// dropped at submit, not blocked at the door.
export function Step3Decisions({ decisions, onChange, isBusy }: Props) {
  const update = (id: string, patch: Partial<Decision>) =>
    onChange(decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const remove = (id: string) => onChange(decisions.filter((d) => d.id !== id))

  return (
    <div>
      <div className="space-y-6">
        {decisions.map((d, i) => (
          <div
            key={d.id}
            className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Decision {i + 1}
              </p>
              {decisions.length > DECISIONS_MIN && (
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  disabled={isBusy}
                  className="text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
                >
                  {WIZARD_COPY.removeDecision}
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <DecisionField
                id={decisionElementId(d.id)}
                copy={DECISION_FIELDS.decided}
                value={d.decided}
                isBusy={isBusy}
                onChange={(v) => update(d.id, { decided: v })}
              />
              <DecisionField
                id={`decision-${d.id}-why`}
                copy={DECISION_FIELDS.why}
                value={d.why}
                rows={3}
                isBusy={isBusy}
                onChange={(v) => update(d.id, { why: v })}
              />
              <DecisionField
                id={`decision-${d.id}-rejected`}
                copy={DECISION_FIELDS.rejected}
                value={d.rejected ?? ''}
                rows={3}
                optional
                isBusy={isBusy}
                onChange={(v) => update(d.id, { rejected: v })}
              />
            </div>
          </div>
        ))}
      </div>

      {decisions.length < DECISIONS_MAX && (
        <button
          type="button"
          onClick={() => onChange([...decisions, createDecision()])}
          disabled={isBusy}
          className="mt-4 w-full rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          + {WIZARD_COPY.addDecision}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function DecisionField({
  id,
  copy,
  value,
  rows,
  optional = false,
  isBusy,
  onChange,
}: {
  id: string
  copy: { label: string; helper: string; placeholder: string }
  value: string
  rows?: number
  optional?: boolean
  isBusy: boolean
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {copy.label}
        {optional && (
          <span className="ml-2 text-xs font-normal text-ink-muted">
            optional
          </span>
        )}
      </label>
      <div className="mt-2 rounded-xl border border-line bg-white transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
        {rows ? (
          <textarea
            id={id}
            value={value}
            rows={rows}
            disabled={isBusy}
            placeholder={copy.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full resize-none rounded-xl bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            disabled={isBusy}
            placeholder={copy.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
          />
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">{copy.helper}</p>
    </div>
  )
}
