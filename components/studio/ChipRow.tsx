'use client'

import { Button } from '@/components/studio/Button'

// A legend and a row of chips generated from an answer above it.
//
// Extracted from Step4Structure, which had drawn this three times over by the
// time step 4 grew a second branch. It serves both sides of the fork: the
// product's parts, where chips multi-select, and a page's sections, where the
// three fates are exclusive per row.
//
// WHICH IS WHY `pressed` IS A PREDICATE RATHER THAN A LIST. Multi-select and
// exclusive-single differ only in what the caller's `onToggle` does with the
// name it is handed, so nothing about exclusivity needs to live in here. A
// `selected: string[]` prop would have forced one of the two models on both.
//
// Presentational and nothing else: no state, no reconciliation, no copy of its
// own. The caller reconciles its selection against the text on every render —
// see the note at the top of Step4Structure — and owns every string.

type Props = {
  legend: string
  /** The names to draw, in the order they should read. */
  names: readonly string[]
  pressed: (name: string) => boolean
  onToggle: (name: string) => void
  disabled: boolean
}

export function ChipRow({ legend, names, pressed, onToggle, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="studio-h2 text-[var(--studio-text)]">{legend}</p>
      <div className="flex flex-wrap gap-2">
        {names.map((name) => (
          <Button
            key={name}
            variant="chip"
            pressed={pressed(name)}
            disabled={disabled}
            onClick={() => onToggle(name)}
          >
            {name}
          </Button>
        ))}
      </div>
    </div>
  )
}
