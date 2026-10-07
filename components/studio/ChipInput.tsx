'use client'

import { useState } from 'react'
import { Button } from '@/components/studio/Button'
import { WIZARD_COPY, addChip, moveChip, removeChip, toggleChipDecision, toggleChipWorked, type Chip } from '@/lib/wizard-steps'
import { PART_MAX } from '@/lib/approach-diagram'

// The step-4 list: type a name, get a chip, drag the chips into the order you
// mean, and — on the parts branch only — tap one to say you worked on it and
// hang your own decisions off it.
//
// NOT IN THE FIGMA FILE. Built from the tokens the file does draw: the chip
// Button for every tap, the studio's own border and radius for the row, and the
// soft text colour for anything that is not a label someone typed.
//
// A VERTICAL LIST RATHER THAN A WRAPPED ROW, for all three branches. Two of them
// are ordered answers — a page's sections in scroll order, a flow's steps in
// walking order — so the order is the data and a row that reflows at a narrow
// column hides it. Dragging is also far easier to aim at down one column, and a
// marked chip has to open underneath itself without pushing its neighbours
// sideways.
//
// Identity is `chip.id` everywhere: the key, the drag target, the mark, the
// attachments. Never the index, which changes under a drag, and never the label,
// which changes under a rename. That is the whole reason this component exists
// rather than another pair of string arrays.

type Props = {
  legend: string
  helper?: string
  placeholder?: string
  chips: Chip[]
  onChange: (chips: Chip[]) => void
  /**
   * Parts branch only: tapping a chip marks it as worked on, and a marked chip
   * opens to carry decisions. The page and flow branches use this component for
   * entry and ordering alone — their marking is a different question and keeps
   * its own chips underneath.
   */
  markable?: boolean
  /** Named step-3 decisions, read live. Only used when `markable`. */
  decisions?: { id: string; label: string }[]
  disabled: boolean
}

export function ChipInput({
  legend,
  helper,
  placeholder,
  chips,
  onChange,
  markable = false,
  decisions = [],
  disabled,
}: Props) {
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)

  const full = chips.length >= PART_MAX

  const commit = (raw: string) => {
    // A pasted "Orders, Menu, Payments" commits three chips rather than one with
    // commas in it. `addChip` drops blanks, duplicates and anything past the cap,
    // so the fold needs no guard of its own.
    const next = raw.split(',').reduce<Chip[]>((acc, part) => addChip(acc, part), chips)
    if (next.length !== chips.length) onChange(next)
    setDraft('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter inside a wizard must never reach the form: the step would submit.
      e.preventDefault()
      commit(draft)
      return
    }
    // Backspace on an empty box takes the last chip back, which is the one
    // gesture people try without being told it exists.
    if (e.key === 'Backspace' && draft === '' && chips.length > 0) {
      e.preventDefault()
      onChange(chips.slice(0, -1))
    }
  }

  const drop = (targetId: string) => {
    if (!dragging || dragging === targetId) return
    const from = chips.findIndex((c) => c.id === dragging)
    const to = chips.findIndex((c) => c.id === targetId)
    if (from !== -1 && to !== -1) onChange(moveChip(chips, from, to))
    setDragging(null)
  }

  return (
    <fieldset className="w-full">
      <legend className="studio-h2 text-[var(--studio-text)]">{legend}</legend>
      {helper && <p className="studio-small mt-1 text-[var(--studio-text-soft)]">{helper}</p>}

      {chips.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {chips.map((chip) => (
            <li
              key={chip.id}
              draggable={!disabled}
              onDragStart={() => setDragging(chip.id)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(chip.id)}
              className={
                'flex flex-col gap-2 rounded-[var(--studio-r-md)] border p-2 transition-colors ' +
                (dragging === chip.id
                  ? 'border-[var(--studio-brand)] opacity-60'
                  : 'border-[var(--studio-border)]') +
                (disabled ? '' : ' cursor-grab')
              }
            >
              <div className="flex items-center justify-between gap-2">
                {markable ? (
                  <Button
                    variant="chip"
                    pressed={chip.worked === true}
                    disabled={disabled}
                    onClick={() => onChange(toggleChipWorked(chips, chip.id))}
                  >
                    {chip.label}
                  </Button>
                ) : (
                  <span className="studio-body min-w-0 truncate text-[var(--studio-text)]">
                    {chip.label}
                  </span>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(removeChip(chips, chip.id))}
                  className="studio-small shrink-0 text-[var(--studio-text-soft)] underline-offset-4 hover:text-[var(--studio-text)] hover:underline disabled:opacity-40"
                >
                  {WIZARD_COPY.chipRemove}
                </button>
              </div>

              {/* Open only once the chip is marked. An unworked part carrying
                  decisions is a state the diagram would have to interpret, so
                  the form never offers one — and `toggleChipWorked` drops the
                  attachments when the mark comes off. */}
              {markable && chip.worked && (
                <div className="flex flex-col gap-2 border-t border-[var(--studio-border)] pt-2">
                  <p className="studio-small text-[var(--studio-text-soft)]">
                    {WIZARD_COPY.chipAttachLabel}
                  </p>
                  {decisions.length === 0 ? (
                    // Said in the chip rather than as an empty list, which would
                    // read as a list that failed to load.
                    <p className="studio-small text-[var(--studio-text-soft)]">
                      {WIZARD_COPY.chipNoDecisions}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {decisions.map((d) => (
                        <Button
                          key={d.id}
                          variant="chip"
                          pressed={(chip.decisions ?? []).includes(d.id)}
                          disabled={disabled}
                          onClick={() => onChange(toggleChipDecision(chips, chip.id, d.id))}
                        >
                          {d.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={draft}
          disabled={disabled || full}
          placeholder={full ? undefined : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          // Whatever is still in the box when focus leaves is a chip the person
          // typed and did not press Enter on. Losing it silently is the one
          // failure this box can have.
          onBlur={() => commit(draft)}
          className="studio-small min-w-0 flex-1 rounded-[var(--studio-r-md)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] p-2 text-[var(--studio-text)] placeholder:text-[var(--studio-text-soft)] disabled:opacity-60"
        />
        <Button variant="outline" disabled={disabled || full || draft.trim() === ''} onClick={() => commit(draft)}>
          {WIZARD_COPY.chipAdd}
        </Button>
      </div>

      {/* Why the box stopped taking input, never left to be guessed at. */}
      {full && <p className="studio-small mt-2 text-[var(--studio-text-soft)]">{WIZARD_COPY.chipCap}</p>}
      {chips.length > 1 && !full && (
        <p className="studio-small mt-2 text-[var(--studio-text-soft)]">{WIZARD_COPY.chipDragHint}</p>
      )}
    </fieldset>
  )
}
