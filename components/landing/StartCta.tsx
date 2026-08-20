'use client'

import { useState } from 'react'
import { EarlyAccessModal } from '@/components/landing/EarlyAccessModal'

// Hero call to action. The primary button opens the early-access form as an
// overlay rather than scrolling anywhere: the whole point of asking is to
// catch someone as they land, and anything below the fold does not get seen.
//
// The modal itself portals to <body>, so it is unaffected by this component
// sitting inside the landing's sticky left column.

export function StartCta() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* TODO: no demo recording exists yet — disabled until one does. */}
        <button
          type="button"
          disabled
          title="Demo coming soon"
          className="inline-flex items-center gap-2.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink-soft opacity-60"
        >
          <PlayIcon />
          Watch demo
        </button>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
        >
          Get early access
        </button>
      </div>

      {isModalOpen && (
        <EarlyAccessModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.4 1.9 11.6 7 3.4 12.1 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
