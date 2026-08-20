'use client'

import { useState } from 'react'
import { EarlyAccessModal } from '@/components/landing/EarlyAccessModal'
import { DEMO_URL } from '@/lib/launch-mode'

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
        {/* Appears the moment NEXT_PUBLIC_DEMO_URL is set, and not before.
            A disabled button advertising a video that does not exist spends
            the visitor's attention on a dead end; until the recording is up,
            the hero carries one live action and nothing else.

            A real anchor rather than a button, because it goes somewhere —
            and in a new tab, so someone who leaves to watch does not lose the
            early-access page they came for. */}
        {DEMO_URL && (
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft/40 hover:text-ink"
          >
            <PlayIcon />
            Watch demo
          </a>
        )}
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
