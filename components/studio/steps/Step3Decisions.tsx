'use client'

import { useState } from 'react'
import { Button } from '@/components/studio/Button'
import { Field } from '@/components/studio/Field'
import { RepeatCard } from '@/components/studio/RepeatCard'
import { Toggle } from '@/components/studio/Toggle'
import { UploadSlot } from '@/components/studio/UploadSlot'
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
  disabled: boolean
}

// The core of the product. Everything else in the wizard is context; this is
// where the fix blocks come from — one decision per card, and §6.1 argues each
// one with four moves that this card collects in order: what it did before, what
// it does now, what someone no longer has to do, and why.
//
// Two cards are visible from the start because §3.4 needs at least two fix
// blocks. Nothing enforces that here: an empty card is dropped at submit, not
// blocked at the door.
export function Step3Decisions({
  decisions,
  onChange,
  attachments,
  onAttachmentsChange,
  disabled,
}: Props) {
  const remove = (id: string) => {
    onChange(decisions.filter((d) => d.id !== id))
    // The screens go with it. A before/after slot only means anything beside the
    // decision it belongs to, and leaving the files behind would put unexplained
    // images into a set the generator is told to place exactly once.
    onAttachmentsChange(attachments.filter((a) => a.decisionId !== id))
  }

  return (
    <div id="decisions-step" className="flex flex-col gap-4">
      {decisions.map((d, i) => (
        <DecisionCard
          key={d.id}
          decision={d}
          index={i}
          canRemove={decisions.length > DECISIONS_MIN}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          onUpdate={(patch) =>
            onChange(decisions.map((x) => (x.id === d.id ? { ...x, ...patch } : x)))
          }
          onRemove={() => remove(d.id)}
          disabled={disabled}
        />
      ))}

      {decisions.length < DECISIONS_MAX && (
        <Button
          variant="outline"
          full
          dashed
          disabled={disabled}
          onClick={() => onChange([...decisions, createDecision()])}
        >
          + {WIZARD_COPY.addDecision}
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function DecisionCard({
  decision: d,
  index,
  canRemove,
  attachments,
  onAttachmentsChange,
  onUpdate,
  onRemove,
  disabled,
}: {
  decision: Decision
  index: number
  canRemove: boolean
  attachments: Attachment[]
  onAttachmentsChange: (a: Attachment[]) => void
  onUpdate: (patch: Partial<Decision>) => void
  onRemove: () => void
  disabled: boolean
}) {
  const isNew = d.no_prior_version === true
  const [requestOpen, setRequestOpen] = useState(Boolean(d.client_request))

  return (
    <RepeatCard
      eyebrow={`Decision ${index + 1}`}
      action={
        canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="studio-small text-[var(--studio-text-soft)] underline-offset-4 hover:text-[var(--studio-text)] hover:underline disabled:opacity-40"
          >
            {WIZARD_COPY.removeDecision}
          </button>
        ) : undefined
      }
    >
      <Field
        id={decisionElementId(d.id)}
        label={DECISION_FIELDS.decided.label}
        helper={DECISION_FIELDS.decided.helper}
        placeholder={DECISION_FIELDS.decided.placeholder}
        value={d.decided}
        onChange={(v) => onUpdate({ decided: v })}
        disabled={disabled}
      />

      {/* §6.2's first selection rule. It also decides which question the field
          below asks, and whether a Before slot exists at all — there is nothing
          to show a before of. */}
      <div className="rounded-[var(--studio-r-md)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] p-3">
        <Toggle
          id={`decision-${d.id}-no-prior`}
          label={DECISION_TOGGLE.noPriorVersion.label}
          helper={DECISION_TOGGLE.noPriorVersion.helper}
          checked={isNew}
          onChange={(v) => onUpdate({ no_prior_version: v })}
          disabled={disabled}
        />
      </div>

      <Field
        id={`decision-${d.id}-prior`}
        {...(isNew ? DECISION_FIELDS.walkthrough : DECISION_FIELDS.priorBehaviour)}
        rows={isNew ? 3 : undefined}
        value={d.prior_behaviour ?? ''}
        onChange={(v) => onUpdate({ prior_behaviour: v })}
        disabled={disabled}
      />

      <Field
        id={`decision-${d.id}-consequence`}
        {...DECISION_FIELDS.consequence}
        value={d.consequence ?? ''}
        onChange={(v) => onUpdate({ consequence: v })}
        disabled={disabled}
      />

      <Field
        id={`decision-${d.id}-why`}
        {...DECISION_FIELDS.why}
        rows={3}
        value={d.why}
        onChange={(v) => onUpdate({ why: v })}
        disabled={disabled}
      />

      <Field
        id={`decision-${d.id}-rejected`}
        {...DECISION_FIELDS.rejected}
        rows={3}
        optional
        value={d.rejected ?? ''}
        onChange={(v) => onUpdate({ rejected: v })}
        disabled={disabled}
      />

      {/* Slot position sets the state and the decision link, so there is no
          dropdown and no per-screen toggle. A new thing has no before. */}
      <div className={'grid gap-4 ' + (isNew ? '' : 'sm:grid-cols-2')}>
        {!isNew && (
          <UploadSlot
            slot="before"
            decisionId={d.id}
            label={SLOT_LABELS.before}
            single
            attachments={attachments}
            onAttachmentsChange={onAttachmentsChange}
            disabled={disabled}
          />
        )}
        <UploadSlot
          slot="after"
          decisionId={d.id}
          label={SLOT_LABELS.after}
          single
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          disabled={disabled}
        />
      </div>

      {/* Collapsed, because most fixes were not requested. Where one was, it
          gives this block an opening §6.2 otherwise cannot reach. */}
      {requestOpen ? (
        <Field
          id={`decision-${d.id}-request`}
          {...DECISION_FIELDS.clientRequest}
          rows={2}
          optional
          value={d.client_request ?? ''}
          onChange={(v) => onUpdate({ client_request: v })}
          disabled={disabled}
        />
      ) : (
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          disabled={disabled}
          className="studio-small self-start text-[var(--studio-text-soft)] underline-offset-4 hover:text-[var(--studio-text)] hover:underline disabled:opacity-40"
        >
          + {DECISION_FIELDS.clientRequest.label}
        </button>
      )}
    </RepeatCard>
  )
}
