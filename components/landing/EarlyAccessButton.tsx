'use client'

import { useState } from 'react'
import { EarlyAccessModal } from '@/components/landing/EarlyAccessModal'

// The one live action on the site, as a button that can be dropped anywhere.
//
// Lifted out of StartCta because the features page wants this on its own: the
// hero pairs it with "Watch demo", which is inert until DEMO_URL is set, and a
// closing call to action with a dead button beside it asks the reader to
// choose between one thing that works and one that does not.
export function EarlyAccessButton({ label = 'Get early access' }: { label?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
      >
        {label}
      </button>

      {isOpen && <EarlyAccessModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
