'use client'

import { stepOrder, stepPosition, type StepId } from '@/lib/wizard-steps'

type Props = {
  current: StepId
  hasImages: boolean
}

// Three states, not two. The old indicator had a done pill and a current pill
// and nothing else, which works for two steps and falls apart at five: a
// future step needs to look different from a finished one, or the bar reads
// as progress you have already made.
export function StepIndicator({ current, hasImages }: Props) {
  const steps = stepOrder(hasImages).filter((s) => s !== 'review')
  const { index, total } = stepPosition(current, hasImages)
  const onReview = current === 'review'

  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
        {onReview ? 'Review' : `Step ${index + 1} of ${total}`}
      </p>
      <div className="flex items-center gap-1.5" aria-hidden>
        {steps.map((s, i) => {
          const state = onReview || i < index ? 'done' : i === index ? 'current' : 'todo'
          return (
            <span
              key={String(s)}
              className={
                'h-1.5 w-5 rounded-full transition-colors ' +
                (state === 'current'
                  ? 'bg-accent'
                  : state === 'done'
                    ? 'bg-accent/30'
                    : 'bg-line')
              }
            />
          )
        })}
      </div>
    </div>
  )
}
