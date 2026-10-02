'use client'

import type { ReactNode } from 'react'

// The decision card (908:1179), which is the container pattern every repeated
// unit in the wizard uses: secondary fill, NO border, 16px pad, medium-1 radius,
// 20px gap, an eyebrow at the top.
//
// It is generalised here because Figma only draws it for decisions, and the
// same shape is what the relation rows, the measurement block and the review
// sections need. One container, one place to change it.

export function RepeatCard({
  eyebrow,
  action,
  children,
}: {
  eyebrow?: string
  /** Right-aligned control on the eyebrow row — "Remove", usually. */
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4">
      {(eyebrow || action) && (
        <div className="flex items-center justify-between gap-4">
          {eyebrow && (
            <p className="studio-eyebrow text-[var(--studio-text-soft)]">{eyebrow}</p>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
