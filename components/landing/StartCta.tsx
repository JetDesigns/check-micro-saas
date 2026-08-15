'use client'

// Client-only so it can focus the wizard's first field on click. The wizard
// lives in a sibling column on desktop and below on mobile — either way,
// focusing the input also scrolls it into view (browsers do this for focus()
// by default).

export function StartCta() {
  const focusWizard = () => {
    // The wizard's first field. Falls back to the legacy textarea id so this
    // keeps working if the wizard markup is swapped out.
    const el =
      (document.getElementById('wizard-input') as HTMLElement | null) ??
      document.querySelector<HTMLElement>('form input[type="text"], form textarea')
    if (!el) return
    el.focus()
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
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
        onClick={focusWizard}
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
      >
        Start a case study
      </button>
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
