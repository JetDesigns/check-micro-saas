'use client'

import { useState } from 'react'
import { Toggle } from '@/components/intake/Toggle'
import { ScreenSlot } from '@/components/wizard/AttachmentStep'
import {
  DECISIONS_MAX,
  DECISIONS_MIN,
  DECISION_FIELDS,
  DECISION_TOGGLE,
  SLOT_LABELS,
  WIZARD_COPY,
  createDecision,
  decisionElementId,
  type Attachment,
} from '@/lib/wizard-steps'
import type { Decision } from '@/types/database'

type Props = {
  decisions: Decision[]
  onChange: (decisions: Decision[]) => void
  attachments: Attachment[]
  onAttachmentsChange: (a: Attachment[]) => void
  isBusy: boolean
}

// The core of the product. Everything else in the wizard is context; this is
// where the fix blocks come from — one decision per card, and §6.1 argues each
// one with four moves that this card collects in order: what it did before,
// what it does now, what someone no longer has to do, and why.
//
// Two cards are visible from the start because §3.4 needs at least two fix
// blocks. Nothing enforces that here: an empty card is dropped at submit, not
// blocked at the door.
export function Step3Decisions({
  decisions,
  onChange,
  attachments,
  onAttachmentsChange,
  isBusy,
}: Props) {
  const update = (id: string, patch: Partial<Decision>) =>
    onChange(decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const remove = (id: string) => {
    onChange(decisions.filter((d) => d.id !== id))
    // The screens go with it. A before/after slot only means anything beside
    // the decision it belongs to, and leaving the files behind would put two
    // unexplained images into a set the generator is told to place exactly once.
    onAttachmentsChange(attachments.filter((a) => a.decisionId !== id))
  }

  return (
    <div id="decisions-step" className="space-y-6">
      {decisions.map((d, i) => (
        <DecisionCard
          key={d.id}
          decision={d}
          index={i}
          canRemove={decisions.length > DECISIONS_MIN}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          onUpdate={(patch) => update(d.id, patch)}
          onRemove={() => remove(d.id)}
          isBusy={isBusy}
        />
      ))}

      {decisions.length < DECISIONS_MAX && (
        <button
          type="button"
          onClick={() => onChange([...decisions, createDecision()])}
          disabled={isBusy}
          className="w-full rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          + {WIZARD_COPY.addDecision}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function DecisionCard({
  decision,
  index,
  canRemove,
  attachments,
  onAttachmentsChange,
  onUpdate,
  onRemove,
  isBusy,
}: {
  decision: Decision
  index: number
  canRemove: boolean
  attachments: Attachment[]
  onAttachmentsChange: (a: Attachment[]) => void
  onUpdate: (patch: Partial<Decision>) => void
  onRemove: () => void
  isBusy: boolean
}) {
  const d = decision
  const isNew = d.no_prior_version === true
  const [requestOpen, setRequestOpen] = useState(Boolean(d.client_request))

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          Decision {index + 1}
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
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
          onChange={(v) => onUpdate({ decided: v })}
        />

        {/* §6.2's first selection rule. It also decides which question the
            field below asks, and whether a Before slot exists at all — there
            is nothing to show a before of. */}
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <Toggle
            id={`decision-${d.id}-no-prior`}
            label={DECISION_TOGGLE.noPriorVersion.label}
            helper={DECISION_TOGGLE.noPriorVersion.helper}
            checked={isNew}
            onChange={(v) => onUpdate({ no_prior_version: v })}
            disabled={isBusy}
          />
        </div>

        <DecisionField
          id={`decision-${d.id}-prior`}
          copy={isNew ? DECISION_FIELDS.walkthrough : DECISION_FIELDS.priorBehaviour}
          value={d.prior_behaviour ?? ''}
          rows={isNew ? 3 : undefined}
          isBusy={isBusy}
          onChange={(v) => onUpdate({ prior_behaviour: v })}
        />

        <DecisionField
          id={`decision-${d.id}-consequence`}
          copy={DECISION_FIELDS.consequence}
          value={d.consequence ?? ''}
          isBusy={isBusy}
          onChange={(v) => onUpdate({ consequence: v })}
        />

        <DecisionField
          id={`decision-${d.id}-why`}
          copy={DECISION_FIELDS.why}
          value={d.why}
          rows={3}
          isBusy={isBusy}
          onChange={(v) => onUpdate({ why: v })}
        />

        <DecisionField
          id={`decision-${d.id}-rejected`}
          copy={DECISION_FIELDS.rejected}
          value={d.rejected ?? ''}
          rows={3}
          optional
          isBusy={isBusy}
          onChange={(v) => onUpdate({ rejected: v })}
        />

        {/* Slot position sets the state and the decision link, so there is no
            dropdown and no per-screen toggle. A new thing has no before. */}
        <div className={'grid gap-4 ' + (isNew ? '' : 'sm:grid-cols-2')}>
          {!isNew && (
            <ScreenSlot
              slot="before"
              decisionId={d.id}
              label={SLOT_LABELS.before}
              single
              attachments={attachments}
              onAttachmentsChange={onAttachmentsChange}
              isBusy={isBusy}
            />
          )}
          <ScreenSlot
            slot="after"
            decisionId={d.id}
            label={SLOT_LABELS.after}
            single
            attachments={attachments}
            onAttachmentsChange={onAttachmentsChange}
            isBusy={isBusy}
          />
        </div>

        {/* Collapsed, because most fixes were not requested. Where one was, it
            gives this block an opening §6.2 otherwise cannot reach. */}
        {requestOpen ? (
          <DecisionField
            id={`decision-${d.id}-request`}
            copy={DECISION_FIELDS.clientRequest}
            value={d.client_request ?? ''}
            rows={2}
            optional
            isBusy={isBusy}
            onChange={(v) => onUpdate({ client_request: v })}
          />
        ) : (
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            disabled={isBusy}
            className="text-xs font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
          >
            + {DECISION_FIELDS.clientRequest.label}
          </button>
        )}
      </div>
    </div>
  )
}

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
          <span className="ml-2 text-xs font-normal text-ink-muted">optional</span>
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
