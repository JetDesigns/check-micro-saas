'use client'

import type { ReactNode } from 'react'

// The card shell (908:1105) and the step header (908:1107).
//
// Outer frame in background/secondary with a border/default hairline, 5px pad
// and a large radius; the white card inside it at 32px pad with the card
// shadow, stacking its content on a 16px gap.
//
// The header is text only. Figma draws the step position as a line of Body type
// pinned right — there is no progress bar and no pill row in the design, and the
// legacy indicator's three-state dots are not carried across.

export function StepShell({
  heading,
  subhead,
  position,
  children,
  footer,
}: {
  heading: string
  subhead?: string
  /** "Step 3 of 5", or "Review". */
  position: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="rounded-[var(--studio-r-xl)] border border-[var(--studio-border)] bg-[var(--studio-bg-secondary)] p-[5px]">
      <div className="studio-card-shadow flex flex-col gap-4 rounded-[var(--studio-r-xl)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] p-5 sm:p-8">
        <header className="flex w-full items-start gap-1">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="studio-h1 text-[var(--studio-text)]">{heading}</h1>
            {subhead && (
              <p className="studio-body text-[var(--studio-text-soft)]">{subhead}</p>
            )}
          </div>
          <p className="studio-body shrink-0 whitespace-nowrap text-[var(--studio-text)]">
            {position}
          </p>
        </header>

        {children}

        {footer}
      </div>
    </div>
  )
}
