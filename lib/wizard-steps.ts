// Everything about the wizard that is a decision rather than a rendering.
//
// It lives here, apart from the components, for one blunt reason: this project
// has no DOM test environment (no jsdom, no testing-library), so anything left
// inside a React component cannot be tested at all. The precedent is
// pickActiveSection in components/case-study/CaseStudyDocument.tsx — pull the
// judgement out as a pure function, test that, and let the component stay
// markup. Step order, what gets written to the database, and what the review
// screen says are exactly the parts worth guarding.

import { SPINE_MAX, SPINE_MIN, countWords } from '@/lib/case-study-blocks'
import {
  INTAKE_FIELDS,
  OUTCOME_OPTIONS,
  fieldElementId,
  fieldsForStep,
  type FieldStep,
  type TextKey,
} from '@/lib/intake-fields'
import type { Decision, ImageNote, Intake, OutcomeStatus } from '@/types/database'

export type StepId = 1 | 2 | 3 | 4 | 5 | 'review'

// Derived from the schema, not restated. One spine entry comes from one
// decision, so the wizard's limits and the block schema's limits are the same
// numbers by necessity — writing 2 and 4 here again would let the schema
// change without the wizard noticing, and the mismatch would only surface as
// a failed compile four minutes and one vision pass later.
export const DECISIONS_MIN = SPINE_MIN
export const DECISIONS_MAX = SPINE_MAX

// Under this, an answer gets a neutral marker on the review screen. It is
// deliberately crude — a word count, nothing more. Phase 3's probing threshold
// is a different instrument for a different moment (it fires while you type,
// and it reads the answer for generic phrasing); do not merge the two.
export const THIN_WORD_COUNT = 8

// One place for the copy the spec pins down, so the "never say this" rule can
// be tested rather than trusted. check-revision-prompt.md § Phase 2 and
// § Copy rules.
export const WIZARD_COPY = {
  opening:
    "I'll ask a few things about your project. Answer what you can — you can always come back.",
  step3Intro: 'Two or three decisions is enough. Depth beats coverage here.',
  addDecision: 'Add another decision',
  removeDecision: 'Remove',
  reviewIntro:
    'Your case study is ready to write. These parts are still short — fill them in now, or go ahead and generate.',
  reviewIntroAllFilled: 'Your case study is ready to write.',
  reviewFill: 'Fill these in',
  reviewWrite: 'Write the case study',
  markerThin: 'Still short',
  markerEmpty: 'Not answered',
  earlyAccess: 'Not open yet — request early access to get in first',

  // Stated as what the structure needs, never as a judgement about the
  // answer. The forbidden-word rule applies here like everywhere else.
  blockerOneDecision:
    'A case study is built from at least two decisions — the structure maps each one to what you learned and what you designed. Add one more in step 3.',
  blockerNoDecisions:
    'Step 3 is where the case study comes from. Add at least two decisions before writing.',

  noteNoScreens:
    'No screens attached, so the case study will be text only. You can add up to six in step 1 — reviewers look at the work as well as the reasoning.',
  noteUnlabelledScreens:
    'Your screens have no notes yet. Step 4 asks what each one shows, and that is what makes a caption point at a decision instead of describing the layout.',
} as const

// The words the spec forbids on the review screen. Two are English and three
// are Indonesian because the spec is; the rule is the same either way — never
// tell someone their answer is deficient. Enforced by test over every string
// this module and the field registry expose.
export const DISCOURAGING_WORDS = [
  'kurang',
  'belum cukup',
  'dangkal',
  'incomplete',
  'weak',
] as const

// Step 3 and step 4 are arrays of objects rather than flat keys, so their
// fields cannot live in the intake registry. Their copy lives here instead of
// inside the components, so the "never discourage" rule below can be tested
// over it like everything else.
export const DECISION_FIELDS = {
  decided: {
    label: 'What did you decide?',
    helper: "One decision. e.g. 'Put the filters in a persistent sidebar.'",
    placeholder: 'e.g. Freeze the note at shift change',
  },
  why: {
    label: 'What made you decide it?',
    helper: 'What you saw, heard, or tested that pointed here.',
    placeholder:
      'e.g. Nurses photographed the screen before every handover, because they had learned it might not be there afterwards.',
  },
  rejected: {
    label: 'What did you consider instead?',
    helper:
      'The option you rejected — and why. This is usually the most interesting part.',
    placeholder:
      'e.g. An autosave indicator. A reassuring spinner does not earn trust back once it is gone.',
  },
} as const

export const SCREEN_FIELDS = {
  shows: {
    label: 'Which decision does this show?',
    unset: 'Pick one',
  },
  notice: {
    label: 'What should someone notice here?',
    helper: 'Point at the choice, not the layout.',
    placeholder: 'e.g. Escalated patients hold the top of the list until acknowledged',
  },
} as const

export const IMAGE_SLOT_LABELS: Record<string, string> = {
  hero: 'Overview / hero',
  supporting: 'Supporting',
}

export const WIZARD_STEPS: ReadonlyArray<{
  id: StepId
  /** Short label for the step indicator. */
  name: string
  heading: string
  subhead: string
}> = [
  {
    id: 1,
    name: 'Setup',
    heading: 'Quick setup',
    subhead: WIZARD_COPY.opening,
  },
  {
    id: 2,
    name: 'The problem',
    heading: 'What you walked into',
    subhead: 'The situation before you touched anything.',
  },
  {
    id: 3,
    name: 'The decisions',
    heading: 'The decisions you made',
    subhead: WIZARD_COPY.step3Intro,
  },
  {
    id: 4,
    name: 'Your screens',
    heading: 'Your screens',
    subhead: 'Say what each one shows, so the captions point at a choice.',
  },
  {
    id: 5,
    name: 'Where it landed',
    heading: 'Where it landed',
    subhead: 'However it ended. Handed off and never shipped is still a story.',
  },
  {
    id: 'review',
    name: 'Review',
    heading: 'Before we write it',
    subhead: '',
  },
] as const

export function stepMeta(id: StepId) {
  const found = WIZARD_STEPS.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown wizard step: ${String(id)}`)
  return found
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
//
// Step 4 asks what each uploaded screen shows. With no uploads it has nothing
// to ask, and an empty step reads as a bug, so it drops out of the order
// entirely — including on the way back, which is the direction that is easy to
// get wrong.

export function stepOrder(hasImages: boolean): StepId[] {
  return hasImages
    ? [1, 2, 3, 4, 5, 'review']
    : [1, 2, 3, 5, 'review']
}

export function nextStep(current: StepId, hasImages: boolean): StepId {
  const order = stepOrder(hasImages)
  const i = order.indexOf(current)
  if (i === -1 || i === order.length - 1) return current
  return order[i + 1]
}

export function prevStep(current: StepId, hasImages: boolean): StepId {
  const order = stepOrder(hasImages)
  const i = order.indexOf(current)
  if (i <= 0) return current
  return order[i - 1]
}

/** Position for the indicator: 1-based, and stable when step 4 is skipped. */
export function stepPosition(
  current: StepId,
  hasImages: boolean
): { index: number; total: number } {
  const order: StepId[] = stepOrder(hasImages).filter((s) => s !== 'review')
  const i = order.indexOf(current)
  return { index: i === -1 ? order.length : i, total: order.length }
}

// ---------------------------------------------------------------------------
// Building the intake
// ---------------------------------------------------------------------------

export type WizardState = {
  text: Partial<Record<TextKey, string>>
  decisions: Decision[]
  /** In final order. Index here becomes case_study_attachments.order_index. */
  attachmentIds: string[]
  /** Keyed by attachment id, not by position — see ImageNote in types/database.ts. */
  imageNotes: Record<string, { shows: string; notice: string }>
  outcome: OutcomeStatus | null
}

export function createDecision(): Decision {
  return { id: crypto.randomUUID(), decided: '', why: '', rejected: '' }
}

export function emptyWizardState(): WizardState {
  return {
    text: {},
    decisions: Array.from({ length: DECISIONS_MIN }, createDecision),
    attachmentIds: [],
    imageNotes: {},
    outcome: null,
  }
}

/**
 * The one writer of the shape that lands in `case_studies.intake`.
 *
 * Replaces a cast (`as unknown as Intake`) that claimed required properties
 * existed while filtering them out one line above. Everything optional is
 * omitted rather than stored as '', so "never answered" stays distinguishable
 * from "answered with nothing" for whoever reads this in Phase 4.
 */
export function buildIntake(state: WizardState): Intake {
  const intake: Intake = { decisions: [], image_notes: [] }

  for (const field of INTAKE_FIELDS) {
    const value = state.text[field.key]?.trim()
    if (value) intake[field.key] = value
  }

  intake.decisions = state.decisions
    .map((d) => ({
      id: d.id,
      decided: d.decided.trim(),
      why: d.why.trim(),
      rejected: d.rejected?.trim() ?? '',
    }))
    // A block the user never typed into is not a decision. Two visible blocks
    // is an invitation, not a promise of two spine entries.
    .filter((d) => d.decided || d.why || d.rejected)
    .map((d) => {
      const kept: Decision = { id: d.id, decided: d.decided, why: d.why }
      if (d.rejected) kept.rejected = d.rejected
      return kept
    })

  intake.image_notes = state.attachmentIds
    .map((id, orderIndex): ImageNote | null => {
      const note = state.imageNotes[id]
      if (!note) return null
      const shows = note.shows.trim()
      const notice = note.notice.trim()
      if (!shows && !notice) return null
      const built: ImageNote = { orderIndex, shows }
      if (notice) built.notice = notice
      return built
    })
    .filter((n): n is ImageNote => n !== null)

  if (state.outcome) intake.outcome_status = state.outcome

  return intake
}

// ---------------------------------------------------------------------------
// The review screen
// ---------------------------------------------------------------------------

/**
 * Reasons the case study cannot be written yet.
 *
 * This is NOT the "never block next" rule being walked back. Navigation stays
 * unblocked all the way to the review screen. This is about not letting
 * someone buy a guaranteed failure: the block schema requires a spine of
 * DECISIONS_MIN–DECISIONS_MAX entries and the wizard derives one per
 * decision, so a single decision cannot produce a legal document no matter how
 * good the writing is.
 *
 * Found the hard way. Someone submitted with one decision; synthesis emitted
 * one spine entry, validation rejected it, and the retry then pressured the
 * model to INVENT a second decision to satisfy the minimum — which it did
 * once, in direct violation of the anti-fabrication rule that is the whole
 * point of this product. Four minutes and a vision pass over six images were
 * spent arriving at nothing.
 *
 * Better to say it in the review screen, in advance, for free.
 */
export function compileBlockers(intake: Intake): string[] {
  const blockers: string[] = []
  const decisions = intake.decisions.filter((d) => d.decided.trim())

  if (decisions.length < DECISIONS_MIN) {
    blockers.push(
      decisions.length === 0
        ? WIZARD_COPY.blockerNoDecisions
        : WIZARD_COPY.blockerOneDecision
    )
  }

  return blockers
}

/**
 * Things worth saying before writing, none of which stop it.
 *
 * The first one exists because someone lost six uploads to a page reload and
 * only found out by reading a finished case study with no pictures in it.
 * Step 4 removes itself when there are no screens — correct, an empty step
 * reads as a bug — but that left nothing anywhere in the wizard mentioning
 * images, so their absence was invisible right up to the output.
 */
export function reviewNotes(
  intake: Intake,
  attachmentIds: string[] = []
): string[] {
  const notes: string[] = []

  if (attachmentIds.length === 0) {
    notes.push(WIZARD_COPY.noteNoScreens)
  } else if (intake.image_notes.length === 0) {
    // Uploaded, but step 4 was walked straight past. The captions will be
    // guessed from the vision pass alone, which is exactly the "describes the
    // UI" failure the caption rule exists to prevent.
    notes.push(WIZARD_COPY.noteUnlabelledScreens)
  }

  return notes
}

export function isThin(answer: string | undefined): boolean {
  const trimmed = answer?.trim() ?? ''
  if (!trimmed) return true
  return countWords(trimmed) < THIN_WORD_COUNT
}

export type ReviewEntry = {
  label: string
  value: string
  /** Element to focus after jumping. */
  anchor: string
  step: StepId
  empty: boolean
  thin: boolean
}

export type ReviewSection = {
  step: StepId
  heading: string
  entries: ReviewEntry[]
  /** True only when every entry in the section is thin. */
  thin: boolean
}

export function decisionElementId(decisionId: string): string {
  return `decision-${decisionId}-decided`
}

export function imageNoteElementId(attachmentId: string): string {
  return `image-${attachmentId}-notice`
}

function entry(
  label: string,
  value: string | undefined,
  anchor: string,
  step: StepId
): ReviewEntry {
  const trimmed = value?.trim() ?? ''
  return {
    label,
    value: trimmed,
    anchor,
    step,
    empty: trimmed === '',
    thin: isThin(trimmed),
  }
}

function section(
  step: StepId,
  entries: ReviewEntry[]
): ReviewSection {
  return {
    step,
    heading: stepMeta(step).heading,
    entries,
    // Every entry, not any: one short answer beside three full ones is not a
    // section that needs attention, and marking it would be nagging.
    thin: entries.length > 0 && entries.every((e) => e.thin),
  }
}

function textEntries(step: FieldStep, intake: Intake): ReviewEntry[] {
  return fieldsForStep(step).map((f) =>
    entry(f.label, intake[f.key], fieldElementId(f.key), step)
  )
}

export function buildReview(
  intake: Intake,
  attachmentIds: string[] = []
): ReviewSection[] {
  const sections: ReviewSection[] = [
    section(1, textEntries(1, intake)),
    section(2, textEntries(2, intake)),
    section(
      3,
      // A decision is not judged by the length of what it decided. A move
      // title is meant to be a short imperative — "Freeze the note at shift
      // change" is six words and is exactly right — so measuring it would flag
      // the best answers in the form. What makes a decision thin is having
      // nothing behind it: `why` is what becomes the finding, and without one
      // the spine has a move suspended in mid-air.
      intake.decisions.map((d, i) => ({
        label: `Decision ${i + 1}`,
        value: d.decided.trim(),
        anchor: decisionElementId(d.id),
        step: 3 as StepId,
        empty: d.decided.trim() === '',
        thin: d.decided.trim() === '' || isThin(d.why),
      }))
    ),
  ]

  if (attachmentIds.length > 0) {
    sections.push(
      section(
        4,
        attachmentIds.map((id, i) => {
          const note = intake.image_notes.find((n) => n.orderIndex === i)
          return entry(
            `Screen ${i + 1}`,
            note?.notice,
            imageNoteElementId(id),
            4
          )
        })
      )
    )
  }

  const outcome = OUTCOME_OPTIONS.find((o) => o.value === intake.outcome_status)
  sections.push(
    section(5, [
      {
        label: 'Did it ship?',
        value: outcome?.label ?? '',
        anchor: 'intake-outcome_status',
        step: 5,
        empty: !outcome,
        // A picked option is an answer, however few words it is.
        thin: !outcome,
      },
      ...textEntries(5, intake),
    ])
  )

  return sections
}

export function reviewIntro(sections: ReviewSection[]): string {
  const anythingThin = sections.some((s) => s.entries.some((e) => e.thin))
  return anythingThin
    ? WIZARD_COPY.reviewIntro
    : WIZARD_COPY.reviewIntroAllFilled
}
