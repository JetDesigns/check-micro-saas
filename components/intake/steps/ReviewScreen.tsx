'use client'

import { WIZARD_COPY, reviewIntro, type ReviewSection, type StepId } from '@/lib/wizard-steps'

type Props = {
  sections: ReviewSection[]
  /** Reasons the case study cannot be written yet. Usually empty. */
  blockers: string[]
  onJump: (step: StepId, anchor: string) => void
}

// The last screen before anything is written. Its job is to make what is thin
// visible without making it a verdict: a neutral marker, a link to the answer,
// and two buttons of equal weight. No score, no meter, no percentage — a
// visible number makes people game the number and write long empty answers.
export function ReviewScreen({ sections, blockers, onJump }: Props) {
  const firstThin = sections
    .flatMap((s) => s.entries)
    .find((e) => e.thin)

  return (
    <div>
      <p className="text-sm leading-relaxed text-ink-soft">
        {blockers.length > 0 ? blockers[0] : reviewIntro(sections)}
      </p>

      {blockers.length > 0 && (
        <button
          type="button"
          onClick={() => onJump(3, 'decisions-step')}
          className="mt-4 w-full rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black sm:w-auto"
        >
          Go to the decisions
        </button>
      )}

      <div className="mt-6 space-y-5">
        {sections.map((section) => (
          <section key={String(section.step)}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {section.heading}
            </h3>
            <ul className="mt-2 divide-y divide-line-soft rounded-xl border border-line bg-white">
              {section.entries.map((e) => (
                <li
                  key={e.anchor}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-ink-muted">{e.label}</p>
                    {e.value ? (
                      <p className="mt-0.5 truncate text-sm text-ink">
                        {e.value}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm italic text-ink-muted">
                        {WIZARD_COPY.markerEmpty}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {e.thin && !e.empty && (
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-muted">
                        {WIZARD_COPY.markerThin}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onJump(e.step, e.anchor)}
                      className="text-xs font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {firstThin && (
        <button
          type="button"
          onClick={() => onJump(firstThin.step, firstThin.anchor)}
          className="mt-6 w-full rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-soft/40 sm:w-auto"
        >
          {WIZARD_COPY.reviewFill}
        </button>
      )}
    </div>
  )
}
