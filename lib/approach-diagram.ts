// The Approach diagram's contract, derived from the intake and gated in code.
//
// THE AGENT NEVER DRAWS, and in these templates it does not write either. Every
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
// TWO TEMPLATES, ONE FIXED RULE. `set-exception` covers multi-area app work;
// `order-overlay` covers page and landing work. Both are filled, both are
// gated, and set-exception is preferred among whichever passed — see
// `buildApproachDiagram`. `sequence-collapse` is specified and deferred: its
// input is the steps of one flow, which shares no pattern with either of these,
// and it has no wizard field.
//
// NEITHER IS DRAWN. There is no renderer for either template. See the blocker
// above the order-overlay half, and APPROACH-VISUAL-PRD.md open items 3 and 5.
//
// Thresholds come from APPROACH-VISUAL-PRD.md and nowhere else. Each one carries
// the section it was read from, because a number with no source is a number
// somebody will round.

import type { FlowStep, Intake, PageSection, SectionFate } from '@/types/database'

/** Carried by every template, whatever its shape. */
type DiagramTail = {
  /** Stated only. Never inferred, and `null` rather than absent (PRD §8). */
  reason: string | null
  /**
   * The relationship in words, for a reader who cannot see the diagram (§9.3).
   * The PRD omits accessibility; the repo does not.
   */
  text_equivalent: string
}

export type SetExceptionItem = {
  /** The part, exactly as the designer named it. */
  label: string
  /** `new` where they said it had no precedent; everything else is `reused`. */
  status: 'reused' | 'new'
}

export type SetExceptionDiagram = DiagramTail & {
  template: 'set-exception'
  items: SetExceptionItem[]
  total: number
  new_count: number
}

/** A section of one page. The array's index IS the page's real order. */
export type OrderOverlaySection = {
  label: string
  /** One of `categories`. Absent where the designer left it unsorted. */
  category?: string
}

export type OrderOverlayDiagram = DiagramTail & {
  template: 'order-overlay'
  sections: OrderOverlaySection[]
  /** The categories actually used, in canonical order. 2 or 3 of them. */
  categories: string[]
  /** The pattern, in the designer's words. It becomes the caption (PRD §4). */
  finding: string
}

/** One step of the flow as drawn. `note` is specified; nothing supplies it yet. */
export type SequenceStep = {
  label: string
  fate: 'kept' | 'removed'
  /** PRD §5.2: the user's own word, shortened. No wizard field collects one. */
  note?: string
}

export type SequenceCollapseDiagram = DiagramTail & {
  template: 'sequence-collapse'
  /** Every step, in flow order. */
  before: SequenceStep[]
  /** Derived: the labels of the steps that survived, in the same order. */
  after: string[]
}

export type ApproachDiagram =
  | SetExceptionDiagram
  | OrderOverlayDiagram
  | SequenceCollapseDiagram

// Guards rather than comparisons at the call site: an optional chain never
// narrows a union, so `page.diagram?.items` does not compile and reaching for a
// cast instead is how a third template would silently pass through. The
// renderer will switch on these when there is one.
export const isSetException = (d: ApproachDiagram): d is SetExceptionDiagram =>
  d.template === 'set-exception'
export const isOrderOverlay = (d: ApproachDiagram): d is OrderOverlayDiagram =>
  d.template === 'order-overlay'
export const isSequenceCollapse = (d: ApproachDiagram): d is SequenceCollapseDiagram =>
  d.template === 'sequence-collapse'

// PRD §5.1 — set-exception's gates.
export const SET_MIN = 4
export const SET_MAX = 8

// PRD §5.2 — sequence-collapse's gates.
export const STEP_MIN = 4
export const STEP_MAX = 8
export const SURVIVOR_MIN = 2
/** A single-step reduction does not read as a reduction (§5.2). */
export const MIN_REDUCTION = 2

// PRD §5.3 — order-overlay's gates.
export const SECTION_MIN = 5
export const SECTION_MAX = 8
export const CATEGORY_MIN = 2
export const CATEGORY_MAX = 3

/**
 * PRD §4's mark label limit is a SIZING FIGURE, not a rule anything applies.
 *
 * There is no constant and no truncation helper here any more, and that is the
 * finding rather than a tidy-up. The limit is really a box — 96px of text in a
 * set-exception mark — and CSS trims to that box, which a character count only
 * approximates. The first real render proved the gap: "Medication chart" is 16
 * characters and fits 96px with room, so a 14-character rule would have cut a
 * label that had none of the problem it was guarding against.
 *
 * 14 is therefore how to think about whether a label will fit when designing.
 * It is written in §4 and it is not enforced, because enforcing it would make
 * the page worse in exactly the cases it was meant to protect.
 *
 * Labels are carried whole, which is also what lets `text_equivalent` and the
 * mark's `title` hand a reader the full string.
 */

/**
 * §4's table gives `finding` the caption's limit, "because it becomes the
 * caption" — and the caption REJECTS rather than truncating. Nothing in this
 * system regenerates a sentence a designer typed, so rejecting means the
 * diagram is dropped. That is why the field is capped at the input instead
 * (`maxChars` in lib/intake-fields.ts), which makes this gate unreachable from
 * the wizard and leaves it guarding only a hand-built intake.
 */
export const FINDING_MAX_CHARS = 120

/**
 * The three fates and the words they are drawn with.
 *
 * Listed in the order PRD §8.3's worked example lists them, so `categories`
 * is canonical rather than whatever order the designer happened to tap. All
 * three are inside §4's 10-character legend limit by construction, which is
 * why no gate checks it.
 */
export const FATE_CATEGORIES: ReadonlyArray<{ fate: SectionFate; category: string }> = [
  { fate: 'added', category: 'Added' },
  { fate: 'cut', category: 'Cut' },
  { fate: 'kept', category: 'Kept' },
] as const

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
export function gateSetException(c: SetExceptionDiagram): string[] {
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

// ---------------------------------------------------------------------------
// sequence-collapse
// ---------------------------------------------------------------------------
//
// One flow, by its steps, where the flow got shorter. The only template whose
// claim is a quantity — how much of a path people actually walk was taken out —
// which is why its gates are about the SIZE of the reduction rather than about
// the shape of the data.
//
// §5.2 names two refusals this cannot enforce, both recorded rather than faked:
// "the flow was reordered but not shortened" is caught by the reduction gate
// below only when nothing was removed, and a reorder with a removal is
// indistinguishable here from a plain removal — the wizard asks for the steps
// as they were, not as they became. "The steps are phases of the designer's
// process" is guarded by `isProcessWord`, which DOES apply here: a flow is the
// one place where "Discovery, Research, Handoff" is a plausible wrong answer,
// because a process is itself a sequence and reads as one.

export function gateSequenceCollapse(c: SequenceCollapseDiagram): string[] {
  const failed: string[] = []

  if (c.before.length < STEP_MIN || c.before.length > STEP_MAX) {
    failed.push(
      `there are ${c.before.length} steps; the flow has to hold ${STEP_MIN} to ${STEP_MAX}`
    )
  }

  const survivors = c.before.filter((s) => s.fate === 'kept')
  if (c.after.length !== survivors.length) {
    failed.push(`after has ${c.after.length} steps and ${survivors.length} survived`)
  }
  if (c.after.length < SURVIVOR_MIN) {
    failed.push(
      `${c.after.length} steps are left; a flow needs ${SURVIVOR_MIN} to still be a flow`
    )
  }

  // §5.2's whole argument: a single-step reduction does not read as a reduction.
  const cut = c.before.length - c.after.length
  if (cut < MIN_REDUCTION) {
    failed.push(
      `${cut} ${cut === 1 ? 'step was' : 'steps were'} removed; it takes ${MIN_REDUCTION} before a flow reads as shorter`
    )
  }

  for (const step of c.before) {
    if (step.label.trim() === '') failed.push('a step has no label')
    else if (isProcessWord(step.label)) {
      failed.push(`"${step.label}" names a phase of the designer's process, not a step of the flow`)
    }
  }

  return failed
}

/**
 * The sequence-collapse contract this project supports, or null.
 *
 * `after` is DERIVED and never asked. §5.2 defines it as "the labels of the
 * steps that survived", so asking would be asking the same question twice and
 * inviting the two answers to disagree.
 */
function buildSequenceCollapse(intake: Intake): SequenceCollapseDiagram | null {
  const rows: FlowStep[] = intake.flow_steps_ordered ?? []
  if (rows.length === 0) return null

  const before: SequenceStep[] = rows.map((r) => ({
    label: r.label,
    fate: r.removed ? 'removed' : 'kept',
  }))
  const after = before.filter((s) => s.fate === 'kept').map((s) => s.label)
  const removed = before.filter((s) => s.fate === 'removed').map((s) => s.label)

  const contract: SequenceCollapseDiagram = {
    template: 'sequence-collapse',
    before,
    after,
    // No field supplies a reason and the PRD forbids inferring one.
    reason: null,
    text_equivalent:
      `A flow of ${before.length} steps became ${after.length}. ` +
      `The steps that remain: ${after.join(', ')}. ` +
      `${removed.join(', ')} ${removed.length === 1 ? 'was' : 'were'} removed.`,
  }

  return gateSequenceCollapse(contract).length === 0 ? contract : null
}

// ---------------------------------------------------------------------------
// order-overlay
// ---------------------------------------------------------------------------
//
// BLOCKER — NO RENDERER MAY BE BUILT FOR THIS TEMPLATE YET. Its encoding has no
// legal form. PRD §5.3 and §8.3 require a legend, three slot fills and a keyed
// strip in place of direct labels; prompts/focused-fix-output.md §9.3 forbids all
// three — gate 1 ("There are no legends"), gate 3 ("Direct labelling over keyed
// fills") and gate 4 ("Two fill states maximum") — and §12 items 24 and 25 repeat
// two of them as hard gates. The PRD's own header says §9 wins where the two
// disagree about structure, so as specified the template cannot be drawn at all.
//
// The contract, the gates, the wizard input and the selection rule ship without
// one, which is what this round is. Recorded as open item 5 in
// APPROACH-VISUAL-PRD.md, and it blocks the renderer jointly with open item 3
// (every §4 and §5 dimension is unverified since the face became Inter).
//
// Two things §5.3 asks for that nothing here enforces, both deliberate:
//
//   - "the grouping is predictable from the labels alone (FAQ -> questions),
//     which means the overlay carries no judgement". That is the swap test, and
//     only a person can run it.
//   - "the parts are steps a user walks -> sequence-collapse". That template is
//     deferred, so there is nowhere to send them. Step 4's fork question stands
//     in for it by asking what shape the work had before either is attempted.
//
// And one tightening NOT applied: `isProcessWord` guards set-exception's labels
// and does not guard these. `launch` and `audit` are both on that list, and a
// real landing page with a Launch section being silently refused a diagram is
// the exact coverage failure this round exists to fix. §5.3 does not restate
// §5.1's product-noun gate, so leaving it off is reading the specification
// rather than loosening it. The guard that replaces it is the question's own
// wording: "the sections of the page, top to bottom" is far harder to answer
// with a process than "the main parts of the product" was.

export function gateOrderOverlay(c: OrderOverlayDiagram): string[] {
  const failed: string[] = []

  if (c.sections.length < SECTION_MIN || c.sections.length > SECTION_MAX) {
    failed.push(
      `there are ${c.sections.length} sections; the page has to hold ${SECTION_MIN} to ${SECTION_MAX}`
    )
  }
  if (c.categories.length < CATEGORY_MIN || c.categories.length > CATEGORY_MAX) {
    failed.push(
      `there are ${c.categories.length} categories; there have to be ${CATEGORY_MIN} to ${CATEGORY_MAX} of them`
    )
  }

  for (const s of c.sections) {
    if (s.label.trim() === '') failed.push('a section has no label')
    if (s.category !== undefined && !c.categories.includes(s.category)) {
      failed.push(`"${s.category}" is on a section and not in categories`)
    }
  }

  // §8.3's wrong-render table: "Legend swatches that do not appear on the
  // canvas. The legend promises a key the diagram does not use."
  for (const category of c.categories) {
    if (!c.sections.some((s) => s.category === category)) {
      failed.push(`"${category}" is in categories and on no section`)
    }
  }

  // §5.3's third gate, and the whole argument of the form. One colour per row
  // with nothing repeated and nothing left out is a table of contents: the
  // strip has no shape, so there is no pattern for the caption to be about.
  //
  // It can only ever fire alongside the section-count gate above, because five
  // or more sections across at most three categories always repeats one, by
  // pigeonhole. Kept anyway: §5.3 states it, and it is the only thing guarding
  // a contract built by hand rather than by `buildOrderOverlay`.
  const repeats = c.categories.some(
    (category) => c.sections.filter((s) => s.category === category).length >= 2
  )
  const gap = c.sections.some((s) => s.category === undefined)
  if (!repeats && !gap) {
    failed.push(
      'no category covers two sections and none was left out; with no repeat and no gap there is no pattern to see'
    )
  }

  if (c.finding.trim() === '') {
    failed.push('there is no finding; the caption IS the finding and nothing infers one')
  } else if (c.finding.length > FINDING_MAX_CHARS) {
    failed.push(
      `the finding is ${c.finding.length} characters; the caption holds ${FINDING_MAX_CHARS} and is rejected rather than cut`
    )
  }

  return failed
}


/**
 * The set-exception contract this project supports, or null.
 *
 * The set is what the designer said they WORKED ON, not everything the product
 * has. The full list exists so that "which did you work on" has something to
 * choose from, and so nobody lists only what they touched and calls it the
 * product — but the diagram is about the work's reach, so the work is the set.
 */
function buildSetException(intake: Intake): SetExceptionDiagram | null {
  const worked = intake.product_areas_worked ?? []
  const fromScratch = intake.product_areas_new ?? []
  if (worked.length === 0) return null

  // Whole, never trimmed. What fits is the renderer's problem.
  const items: SetExceptionItem[] = worked.map((label) => ({
    label,
    status: fromScratch.includes(label) ? 'new' : 'reused',
  }))

  const newOnes = items.filter((i) => i.status === 'new')
  const reused = items.filter((i) => i.status === 'reused')

  const contract: SetExceptionDiagram = {
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

/** The page's order and its categories, in words, for a reader who cannot see it. */
function orderOverlayText(
  sections: OrderOverlaySection[],
  categories: string[],
  finding: string
): string {
  const inOrder = sections.map((s) => s.label).join(', ')
  const grouped = categories
    .map(
      (category) =>
        `${category}: ${sections
          .filter((s) => s.category === category)
          .map((s) => s.label)
          .join(', ')}`
    )
    .join('. ')
  const unsorted = sections.filter((s) => s.category === undefined).map((s) => s.label)
  const gap =
    unsorted.length === 0
      ? ''
      : ` ${unsorted.join(' and ')} ${unsorted.length === 1 ? 'sits' : 'sit'} in no category.`

  return (
    `The page runs ${sections.length} sections in this order: ${inOrder}. ` +
    `${grouped}.${gap} The pattern: ${finding}.`
  )
}

/**
 * The order-overlay contract this project supports, or null.
 *
 * The categories are derived from the fates actually used rather than from the
 * three the form offers: a page where nothing was cut has two categories, not
 * three with one empty, and an empty one would promise a key the strip never
 * uses. A section the designer left unmarked carries no category at all, and
 * that gap is data — §5.3 forbids inventing one to fill it.
 */
function buildOrderOverlay(intake: Intake): OrderOverlayDiagram | null {
  const rows: PageSection[] = intake.page_sections_ordered ?? []
  const finding = (intake.page_pattern ?? '').trim()
  if (rows.length === 0 || finding === '') return null

  const word = new Map(FATE_CATEGORIES.map((f) => [f.fate, f.category]))
  const categories = FATE_CATEGORIES.filter((f) => rows.some((r) => r.fate === f.fate)).map(
    (f) => f.category
  )

  const sections: OrderOverlaySection[] = rows.map((row) => {
    const category = row.fate ? word.get(row.fate) : undefined
    return { label: row.label, ...(category ? { category } : {}) }
  })

  const contract: OrderOverlayDiagram = {
    template: 'order-overlay',
    sections,
    categories,
    // §5.3's caption is the finding, and no field supplies anything else.
    reason: null,
    finding,
    text_equivalent: orderOverlayText(sections, categories, finding),
  }

  return gateOrderOverlay(contract).length === 0 ? contract : null
}

/**
 * The diagram this project supports, or null.
 *
 * Null is an ordinary outcome and the common one: a project that renders no
 * diagram renders Approach as prose with no trace of the absence (§9.7). There
 * is no fallback form and no placeholder — the floor form that guaranteed one
 * was deleted for drawing a near-identical picture for two unrelated projects.
 *
 * EVERY contract is filled and EVERY one is gated, and §6's fixed priority —
 * sequence-collapse, then set-exception, then order-overlay — picks among
 * whichever passed. That is a deliberate deviation from PRD §6 steps 3 and 4,
 * which select on completeness and then gate only the winner: under that order
 * a project with four named areas and no exception loses to nothing — its
 * set-exception contract is the only complete one, so it is selected, and only
 * then does the gate drop it, with the overlay it could have had never
 * attempted. The priority itself has not moved; only the point at which the
 * gates run. The PRD step is amended to match, and a test pins the case.
 *
 * In practice the fork in step 4 decides which template a wizard project gets,
 * because `buildIntake` writes only the branch it asked. The preference below
 * covers hand-built intakes, fixtures, and rows written before the fork existed.
 */
export function buildApproachDiagram(intake: Intake): ApproachDiagram | null {
  // §6's fixed order, B then A then C, applied to whichever passed its gates.
  const sequence = buildSequenceCollapse(intake)
  const set = buildSetException(intake)
  const overlay = buildOrderOverlay(intake)
  return sequence ?? set ?? overlay
}
