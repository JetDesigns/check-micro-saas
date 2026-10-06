// The Approach diagram's contract, derived from the intake and gated in code.
//
// THE AGENT NEVER DRAWS, and in this template it does not write either. Every
// field below is derived from answers the designer gave, so "never infer a
// product structure the user did not supply" is true by construction rather than
// by instruction — there is no path by which an invented area name reaches the
// page. The model is told nothing about the diagram, which is also why adding it
// costs no extra model call.
//
// DROPPABLE, NOT RETRYABLE. A failed gate returns null and the page is finished
// without a diagram. It can never reach `validateFocusedFix`'s issue list,
// because it never travels through the model's reply at all — that list is fed
// back as revision notes, and a failed gate would spend one of three attempts
// repairing something that should simply not exist. Same shape as the
// `stat_headline` precedent: omitted rather than filled in.
//
// Thresholds come from APPROACH-VISUAL-PRD.md and nowhere else. Each one carries
// the section it was read from, because a number with no source is a number
// somebody will round.

import type { Intake } from '@/types/database'

export type SetExceptionItem = {
  /** The part, exactly as the designer named it. */
  label: string
  /** `new` where they said it had no precedent; everything else is `reused`. */
  status: 'reused' | 'new'
}

export type ApproachDiagram = {
  template: 'set-exception'
  items: SetExceptionItem[]
  total: number
  new_count: number
  /** Stated only. Never inferred, and `null` rather than absent (PRD §8). */
  reason: string | null
  /**
   * The relationship in words, for a reader who cannot see the diagram (§9.3).
   * The PRD omits accessibility; the repo does not.
   */
  text_equivalent: string
}

// PRD §5.1 — gates.
export const SET_MIN = 4
export const SET_MAX = 8

// PRD §4 — text limits.
export const LABEL_MAX_CHARS = 18

/**
 * Labels name the product, never the designer's process.
 *
 * Every designer's process is the same, so a diagram drawn from it is the same
 * diagram on every project — which is the failure the whole system exists to
 * prevent. A label from this list makes the template refuse rather than render
 * something true of nobody in particular.
 */
export const PROCESS_WORDS: readonly string[] = [
  'discovery',
  'research',
  'iteration',
  'iterations',
  'wireframing',
  'wireframes',
  'prototyping',
  'prototype',
  'testing',
  'handoff',
  'launch',
  'ideation',
  'audit',
  'kickoff',
  'workshop',
  'alignment',
  'qa',
]

function isProcessWord(label: string): boolean {
  const words = label.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  return words.some((w) => PROCESS_WORDS.includes(w))
}

/**
 * Why this contract cannot be drawn, or an empty list.
 *
 * Returns every failure rather than the first: these are read by a person
 * deciding whether the gate is right, not by a retry loop.
 */
export function gateSetException(c: ApproachDiagram): string[] {
  const failed: string[] = []

  if (c.total < SET_MIN || c.total > SET_MAX) {
    failed.push(`total is ${c.total}; the set has to hold ${SET_MIN} to ${SET_MAX} parts`)
  }
  if (c.items.length !== c.total) {
    failed.push(`total says ${c.total} and there are ${c.items.length} items`)
  }
  if (c.new_count !== c.items.filter((i) => i.status === 'new').length) {
    failed.push(`new_count says ${c.new_count} and the items disagree`)
  }

  // The upper bound is deliberate and is the whole argument of the form: when
  // half the set is exceptional the set has no rule left to break, and the
  // diagram claims nothing.
  if (c.new_count < 1 || c.new_count > c.total / 2) {
    failed.push(`new_count is ${c.new_count}; it has to be between 1 and half of ${c.total}`)
  }

  for (const item of c.items) {
    if (item.label.trim() === '') failed.push('an item has no label')
    else if (isProcessWord(item.label)) {
      failed.push(`"${item.label}" names a phase of the designer's process, not a part of the product`)
    }
  }

  return failed
}

/** PRD §4: over the limit truncates with an ellipsis rather than refusing. */
export function truncateLabel(label: string): string {
  const trimmed = label.trim()
  return trimmed.length <= LABEL_MAX_CHARS ? trimmed : `${trimmed.slice(0, LABEL_MAX_CHARS - 1)}…`
}

/**
 * The diagram this project supports, or null.
 *
 * Null is an ordinary outcome and the common one: most projects will not have
 * named four parts and separated some of them, and a project that renders no
 * diagram renders Approach as prose with no trace of the absence (§9.7).
 *
 * The set is what the designer said they WORKED ON, not everything the product
 * has. The full list exists so that "which did you work on" has something to
 * choose from, and so nobody lists only what they touched and calls it the
 * product — but the diagram is about the work's reach, so the work is the set.
 */
export function buildApproachDiagram(intake: Intake): ApproachDiagram | null {
  const worked = intake.product_areas_worked ?? []
  const fromScratch = intake.product_areas_new ?? []
  if (worked.length === 0) return null

  const items: SetExceptionItem[] = worked.map((label) => ({
    label: truncateLabel(label),
    status: fromScratch.includes(label) ? 'new' : 'reused',
  }))

  const newOnes = items.filter((i) => i.status === 'new')
  const reused = items.filter((i) => i.status === 'reused')

  const contract: ApproachDiagram = {
    template: 'set-exception',
    items,
    total: items.length,
    new_count: newOnes.length,
    // No field supplies a reason and the PRD forbids inferring one.
    reason: null,
    text_equivalent:
      `${items.length} parts of the product were worked on: ` +
      `${reused.map((i) => i.label).join(', ')} followed what was already there, and ` +
      `${newOnes.map((i) => i.label).join(', ')} had no precedent.`,
  }

  return gateSetException(contract).length === 0 ? contract : null
}
