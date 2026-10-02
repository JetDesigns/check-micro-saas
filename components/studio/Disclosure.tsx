'use client'

import { useState, type ReactNode } from 'react'

// One quiet link per step, opening the answers most projects will not have.
//
// This is not a deletion and it is not a shortening of the form. Every field
// behind one of these is still in the schema, still on the review screen, still
// in the prompt, and still submitted if it was filled. What changes is how much
// a person is looking at when the step opens — which is the only part of "too
// many fields" that could be fixed without knowing yet which fields earn their
// place. That is what the ablation runs are for; until it has run, nothing goes.
//
// Deliberately a text link rather than a summary row or an accordion chevron:
// the whole point is that it should be easy to walk past.
//
// `defaultOpen` exists because of drafts. A reload restores the answers, and a
// filled-in answer sitting behind a closed link looks exactly like an answer that
// was lost — which is the failure drafts exist to prevent. Whoever renders this
// says whether anything behind it has content; it is only read on mount.

export function Disclosure({
  label,
  children,
  disabled = false,
  defaultOpen = false,
}: {
  label: string
  children: ReactNode
  disabled?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (open) return <div className="flex w-full flex-col gap-4">{children}</div>

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      disabled={disabled}
      className="studio-small self-start text-[var(--studio-text-soft)] underline-offset-4 transition-colors hover:text-[var(--studio-text)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
    >
      + {label}
    </button>
  )
}
