'use client'

import { EarlyAccessButton } from '@/components/landing/EarlyAccessButton'
import { DEMO_URL } from '@/lib/launch-mode'

// Hero call to action. The primary button opens the early-access form as an
// overlay rather than scrolling anywhere: the whole point of asking is to
// catch someone as they land, and anything below the fold does not get seen.
//
// The modal itself portals to <body>, so it is unaffected by this component
// sitting inside the landing's sticky left column.

// Shared so the live link and the inert placeholder stay the same shape — if
// they drift, the hero visibly reflows on the day the URL is set.
const DEMO_BUTTON_CLASS =
  'inline-flex items-center gap-2.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink-soft'

export function StartCta() {
  return (
    <div className="flex flex-wrap items-center gap-3">
        {/* Always present, in one of two states.

            With NEXT_PUBLIC_DEMO_URL set it is a real anchor, opening in a
            new tab so someone who leaves to watch does not lose the
            early-access page they came for. Without it, the same control
            renders inert: the pre-launch hero keeps its secondary weight
            beside the primary button, and a visitor can see a demo is on the
            way rather than wondering whether there is anything to see.

            Both states share one class string apart from the interactive
            bits, so the button does not move or resize when the URL lands. */}
        {DEMO_URL ? (
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={DEMO_BUTTON_CLASS + ' transition-colors hover:border-ink-soft/40 hover:text-ink'}
          >
            <PlayIcon />
            Watch demo
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Demo coming soon"
            className={DEMO_BUTTON_CLASS + ' opacity-60'}
          >
            <PlayIcon />
            Watch demo
          </button>
        )}
      <EarlyAccessButton />
    </div>
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
