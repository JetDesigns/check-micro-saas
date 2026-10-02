'use client'

import { RepeatCard } from '@/components/studio/RepeatCard'
import { WIZARD_COPY, reviewIntro, type ReviewSection, type StepId } from '@/lib/wizard-steps'

type Props = {
  sections: ReviewSection[]
  /** Reasons the case study cannot be written yet. Usually empty. */
  blockers: string[]
  /** Worth knowing before writing, but never a reason to stop. */
  notes: string[]
  onJump: (step: StepId, anchor: string) => void
}

// NOT IN THE FIGMA FILE AT ALL — no summary list, no thin or empty markers, no
// Edit links. Built from the same tokens: the repeated-item card per section,
// each row a label in Body small over its value in Body, with a text Edit button
// right-aligned, and the markers as chips in the unselected style.
//
// Its job is to make what is thin visible without making it a verdict: a neutral
// marker, a link to the answer, and two buttons of equal weight. No score, no
// meter, no percentage — a visible number makes people game the number and write
// long empty answers.
export function Review({ sections, blockers, notes, onJump }: Props) {
  const firstThin = sections.flatMap((s) => s.entries).find((e) => e.thin)

  return (
    <div className="flex flex-col gap-4">
      <p className="studio-body text-[var(--studio-text-soft)]">
        {blockers.length > 0 ? blockers[0] : reviewIntro(sections)}
      </p>

      {blockers.length > 0 && (
        <button
          type="button"
          onClick={() => onJump(3, 'decisions-step')}
          className="studio-button self-start rounded-[var(--studio-r-md)] bg-[var(--studio-brand)] px-4 py-2 text-[var(--studio-text-inverse)] hover:bg-[var(--studio-brand-hover)]"
        >
          Go to the decisions
        </button>
      )}

      {notes.map((note) => (
        <p
          key={note}
          className="studio-small rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[var(--studio-text-soft)]"
        >
          {note}
        </p>
      ))}

      {sections.map((section) => (
        // Keyed on id, not step: the screens section sends its Edit links to
        // step 2 or step 3 depending on the slot, so it carries step 2 — and
        // keying on that made it collide with the step-2 section. React drops
        // one of two children sharing a key, silently.
        <RepeatCard key={section.id} eyebrow={section.heading}>
          <ul className="flex flex-col divide-y divide-[var(--studio-border)]">
            {section.entries.map((e) => (
              <li key={e.anchor} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="studio-small text-[var(--studio-text-soft)]">{e.label}</p>
                  {e.value ? (
                    <p className="studio-body mt-0.5 truncate text-[var(--studio-text)]">
                      {e.value}
                    </p>
                  ) : (
                    <p className="studio-body mt-0.5 text-[var(--studio-text-soft)] italic">
                      {WIZARD_COPY.markerEmpty}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {e.thin && !e.empty && (
                    <span className="studio-small rounded-[var(--studio-r-sm)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] px-2 py-0.5 text-[var(--studio-text-soft)]">
                      {WIZARD_COPY.markerThin}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onJump(e.step, e.anchor)}
                    className="studio-small text-[var(--studio-text-soft)] underline-offset-4 hover:text-[var(--studio-text)] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </RepeatCard>
      ))}

      {firstThin && (
        <button
          type="button"
          onClick={() => onJump(firstThin.step, firstThin.anchor)}
          className="studio-button self-start rounded-[var(--studio-r-md)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] px-4 py-2 text-[var(--studio-text)] hover:border-[var(--studio-border-strong)]"
        >
          {WIZARD_COPY.reviewFill}
        </button>
      )}
    </div>
  )
}
