'use client'

import type { ReactNode } from 'react'

// Selection Card (49:124–126): 16px icon, title in Body, description in Body
// small, 12px pad, medium-1 radius.
//
// Figma draws both project-type cards in the same enabled state. The disabled
// one is not in the file (see the plan's gap list) and is built here from the
// same tokens: secondary fill, 60% opacity, and a "Coming soon" chip in the
// unselected chip style.
//
// Visible and refused rather than hidden, on purpose. Hiding build-from-nothing
// would let someone pick "focused fix" for a project §2.2 routes elsewhere, and
// the page would then argue from a prior state that never existed. There is no
// onClick at all on a locked card, rather than a guarded one.

type Props = {
  title: string
  description: string
  icon: ReactNode
  selected?: boolean
  locked?: boolean
  lockedLabel?: string
  onClick?: () => void
}

export function SelectionCard({
  title,
  description,
  icon,
  selected = false,
  locked = false,
  lockedLabel = 'Coming soon',
  onClick,
}: Props) {
  return (
    <button
      type="button"
      {...(locked
        ? { disabled: true, 'aria-disabled': true }
        : { onClick, 'aria-pressed': selected })}
      className={
        'flex min-w-0 flex-1 flex-col items-start gap-2 rounded-[var(--studio-r-md)] border p-3 text-left transition-colors ' +
        (locked
          ? 'cursor-not-allowed border-[var(--studio-border)] bg-[var(--studio-bg-secondary)] opacity-60'
          : selected
            ? 'border-[var(--studio-brand-hover)] bg-[var(--studio-bg-primary)]'
            : 'border-[var(--studio-border)] bg-[var(--studio-bg-primary)] hover:border-[var(--studio-border-strong)]')
      }
    >
      <span className="text-[var(--studio-text)]">{icon}</span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="studio-body text-[var(--studio-text)]">{title}</span>
        {locked && (
          <span className="studio-small rounded-[var(--studio-r-sm)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] px-2 py-0.5 text-[var(--studio-text-soft)]">
            {lockedLabel}
          </span>
        )}
      </span>
      <span className="studio-small text-[var(--studio-text-soft)]">{description}</span>
    </button>
  )
}

export function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a4 4 0 0 0 5 5L21 21H3l9.7-14.7Z" />
      <circle cx="16.5" cy="5.5" r="2" />
    </svg>
  )
}

export function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5Z" />
      <path d="m3.3 7.3 8.7 4.9 8.7-4.9" />
      <path d="M12 21.5v-9.3" />
    </svg>
  )
}
