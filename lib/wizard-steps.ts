// Everything about the wizard that is a decision rather than a rendering.
//
// It lives here, apart from the components, for one blunt reason: this project
// has no DOM test environment (no jsdom, no testing-library), so anything left
// inside a React component cannot be tested at all. The precedent is
// pickActiveSection in components/case-study/CaseStudyDocument.tsx — pull the
// judgement out as a pure function, test that, and let the component stay
// markup. Step order, what gets written to the database, and what the review
// screen says are exactly the parts worth guarding.

import {
  CATEGORY_MIN,
  MIN_REDUCTION,
  PART_MAX,
  PART_MIN,
  SECTION_MAX,
  SECTION_MIN,
  STEP_MAX,
  STEP_MIN,
  SURVIVOR_MIN,
  buildApproachDiagram,
} from '@/lib/approach-diagram'
import { SPINE_MAX, SPINE_MIN, containsDigit, countWords } from '@/lib/case-study-blocks'
import {
  INTAKE_FIELDS,
  MEASUREMENT_KEYS,
  OUTCOME_OPTIONS,
  PROVENANCE_OPTIONS,
  fieldElementId,
  fieldsForShape,
  visibleFields,
  type FieldStep,
  type IntakeField,
  type TextKey,
  type ToggleKey,
  type WorkShape,
} from '@/lib/intake-fields'
import type {
  Collaborator,
  Decision,
  FlowStep,
  ImageNote,
  ImageSlot,
  Intake,
  OutcomeStatus,
  PageSection,
  ProductPart,
  Provenance,
  SectionFate,
  StoredIntake,
} from '@/types/database'
import { isFocusedFixIntake } from '@/types/database'

export type StepId = 1 | 2 | 3 | 4 | 5 | 'review'

// Derived from the schema, not restated. One fix block comes from one
// decision, so the wizard's limits and the spec's limits are the same numbers
// by necessity — and the spec's appendix (Q1) chose 2–4 deliberately to match
// this constant, so that the specification and the validator cannot drift.
export const DECISIONS_MIN = SPINE_MIN
export const DECISIONS_MAX = SPINE_MAX

// Under this, an answer gets a neutral marker on the review screen. It is
// deliberately crude — a word count, nothing more.
export const THIN_WORD_COUNT = 8

// One place for the copy the spec pins down, so the "never say this" rule can
// be tested rather than trusted.
export const WIZARD_COPY = {
  opening: 'A few quick things, then we get into the story.',
  step3Intro: 'Two or three is plenty — go deep rather than wide.',
  addDecision: 'Add another decision',
  removeDecision: 'Remove',
  addCollaborator: 'Add someone',
  comingSoon: 'Coming soon',
  reviewIntro:
    'Ready to write. You can add to any of these first, or go straight ahead.',
  reviewIntroAllFilled: 'Ready to write.',
  reviewFill: 'Fill these in',
  reviewWrite: 'Write the case study',
  generate: 'Generate',
  markerThin: 'Room to add',
  markerEmpty: 'Not answered yet',
  earlyAccess: 'Not open yet — request early access to get in first',

  // Drafts. The wizard keeps what has been typed across reloads, so it needs a
  // way to let go of it that is not "reload and hope".
  startOver: 'Start over',
  startOverConfirm: 'Clear everything you have typed so far?',
  savedHeading: 'Written',
  savedBody: 'Your answers are saved, and so is the page.',
  openPage: 'Open the page',
  backToAnswers: 'Back to my answers',

  // Stated as what the case study needs, never as a judgement about the
  // answer. The forbidden-word rule applies here like everywhere else.
  blockerOneDecision:
    'Two decisions give the story something to compare. Add one more in step 3.',
  blockerNoDecisions:
    'Step 3 is where the case study comes from. Add two decisions before writing.',

  // What step 4 buys, said as what the page gains rather than as anything
  // about the answer. The person is told the picture will be built either way
  // — they are choosing between two true pictures, not being told one is
  // deficient, and the discouraging-word rule covers these like everything
  // else here.
  //
  // THE NUMBERS COME FROM THE GATES, never from English. Every one of these
  // spelled them out — "four or more parts", "five or more sections" — which
  // left the copy free to drift from `lib/approach-diagram.ts` the moment a
  // threshold moved. They are interpolated now, and a test asserts one of them
  // against its constant.
  noteDiagramUnforked:
    'Approach will carry a picture of your decisions. Step 4 asks what shape the work had — several areas of a product, one page, or one flow — and answering it draws the work itself instead.',
  noteDiagramParts:
    `Approach will carry a picture of your decisions. To draw how far the work reached, step 4 wants ${PART_MIN} or more areas, some of them tapped as worked on, and a decision sitting on at least one of those.`,
  noteDiagramPage:
    `Approach will carry a picture of your decisions. To draw the page's own shape, step 4 wants ${SECTION_MIN} or more sections in scroll order, each marked added, cut or kept, and one line on what the order showed.`,
  noteDiagramFlow:
    `Approach will carry a picture of your decisions. To draw how much the flow lost, step 4 wants ${STEP_MIN} or more steps, with at least ${MIN_REDUCTION} of them cut or merged.`,

  // The inline version, shown inside step 4 while there is still something to
  // do about it. Two states per branch — a list typed but nothing tapped, which
  // is how both real projects ended up on the floor form, and a branch short of
  // its gate — then one shared line when it is satisfied, so the step reads as
  // progress rather than as a standing complaint.
  hintPartsTap: 'Tap the areas you worked on. The picture is those against the rest.',
  hintPartsShort: `${PART_MIN} or more areas draws how far the work reached.`,
  // The two new conditions. Both are said as what the picture needs to have
  // something to show, never as anything about the answer — the same rule the
  // four notes above follow, and the discouraging-word test covers these too.
  hintPartsAllMarked:
    'Every area is tapped, so there is nothing for the work to stand against. Leave the ones you did not touch alone.',
  hintPartsAttach: 'Put a decision on an area you worked on. That is what the picture points at.',

  // The chip list itself.
  chipAdd: 'Add',
  chipRemove: 'Remove',
  chipCap: `${PART_MAX} is as many as the picture holds.`,
  chipAttachLabel: 'Which decisions landed here?',
  chipNoDecisions: 'Name a decision in step 3 and it will be offered here.',
  chipDragHint: 'Drag to reorder.',
  noteUnattached:
    'These are not on any area yet, so the picture will leave them out. You can carry on either way.',
  hintPageMark: 'Mark each section Added, Cut or Kept. The picture is where those land in the order.',
  hintPageShort: `${SECTION_MIN} or more sections, ${CATEGORY_MIN} kinds or more between them, and a line on what the order showed.`,
  hintFlowTap: 'Tap the steps that are gone. The picture is the difference between the two columns.',
  hintFlowShort: `${STEP_MIN} or more steps, at least ${MIN_REDUCTION} of them cut or merged, and ${SURVIVOR_MIN} still standing.`,
  hintDraws: 'This draws the work itself.',

  noteNoScreens:
    'No screens yet, so this will be words only. You can add them beside the problem in step 2, and beside each decision in step 3.',
  noteUnlabelledScreens:
    'Some screens have no note yet. A line about what to look at goes a long way.',
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

// Step 3 is an array of objects rather than flat keys, so its fields cannot
// live in the intake registry. Their copy lives here instead of inside the
// components, so the "never discourage" rule above can be tested over it like
// everything else.
export const DECISION_FIELDS = {
  decided: {
    label: 'What did you decide?',
    helper: '',
    placeholder: 'e.g. Put the eight most-ordered items on the first screen',
  },
  // I23. Without this a block can only describe what exists now, which reads as
  // a changelog entry rather than a decision.
  priorBehaviour: {
    label: 'What did it do before?',
    helper: 'What someone had to do, not how it looked.',
    placeholder: 'e.g. Every item took three taps and a keyboard search',
  },
  // I30. The same column asked differently when there is no before to compare
  // against, which is also what makes the ordered-mechanic shape reachable.
  walkthrough: {
    label: 'How does it work, step by step?',
    helper: '',
    placeholder:
      'e.g. The server taps a course, it lands on the kitchen screen straight away, and the rest of the table stays open',
  },
  // I24. The move nobody writes unless they are asked for it, and the one that
  // separates a case study from a list of edits.
  consequence: {
    label: 'What can people do now, or stop doing?',
    helper: '',
    placeholder: 'e.g. Nobody writes orders on paper during the rush any more',
  },
  why: {
    label: 'What made you decide it?',
    helper: '',
    placeholder:
      'e.g. Servers had memorised the codes for the eight items that cover most of a Friday night.',
  },
  rejected: {
    label: 'What did you consider instead?',
    helper: '',
    placeholder:
      'e.g. A faster search box. It still starts with a server deciding to type.',
  },
  // I32. Collapsed, because most fixes were not requested.
  clientRequest: {
    label: 'Did the client ask for this?',
    helper: '',
    placeholder: 'e.g. "Can you make the order screen quicker?"',
  },
} as const

export const DECISION_TOGGLE = {
  noPriorVersion: {
    label: "This didn't exist before",
    helper: '',
  },
} as const

// I27, I28, I29. Three independent chips, asked once per decision on step 4
// where the whole set is visible at once — which is the only place the
// question "against the others" can honestly be answered.
export const RELATION_CHIPS = {
  breaksPattern: {
    label: 'Breaks a pattern the others follow',
    revealLabel: 'Which pattern?',
    revealPlaceholder: 'e.g. Every other screen lists items the way the printed menu does',
  },
  repeatedTreatment: {
    label: 'The same change in a lot of places',
  },
  dependsOn: {
    // The reveal is phrased as the question rather than as the relationship, so
    // it needs no line underneath explaining what "depends" means here.
    label: 'Depends on another decision',
    revealLabel: 'Which one comes first?',
  },
} as const

export const SCREEN_FIELDS = {
  notice: {
    label: 'What should someone notice here?',
    // Two jobs. A problem screen is evidence and has no decision to point at
    // yet; a before or after screen sits with the decision it belongs to.
    helperEvidence: '',
    helperDecision: '',
    placeholderEvidence: 'e.g. The search field is empty and the item list is still alphabetical',
    placeholderDecision:
      'e.g. The eight items sit on the first screen, no search needed',
  },
} as const

/**
 * The four toggles, and the disclosure links.
 *
 * They live here rather than inline in the components for one reason: the
 * discouraging-word test walks this module, and copy written inside a component
 * is copy the test cannot see. Every meta-explanation that used to sit beside
 * these — what the page would do with the answer, what it costs to leave one
 * blank — was written inline, and none of it was ever checked.
 */
export const TOGGLE_COPY = {
  clientMayBeNamed: { label: "It's fine to name the client", helper: '' },
  reportedVerbatim: { label: 'Those were their exact words', helper: '' },
  hasMeasurement: {
    label: 'Do you have a number?',
    helper: 'Only if you actually measured it.',
  },
} as const

/**
 * One quiet link per step, opening the answers most projects will not have.
 *
 * A link names the topic where what it opens is a question of its own — "More
 * about who was involved" leads to "Who else worked on it?", rather than asking
 * it twice a click apart. Where the disclosure holds a single question, the link
 * is that question and becomes its heading on expand (step 2).
 */
export const DISCLOSURE = {
  step1: 'More about who was involved',
  step2: 'How did you find out?',
  step4: 'More about how you worked',
  step5: 'What the client said afterwards',
} as const

// Two labels per slot, because they sit in two places and one phrase cannot do
// both jobs: the uploader heads a group of screens, the review screen names one.
// "Screens showing the problem 1" was the first attempt at sharing them.
export const SLOT_LABELS: Record<ImageSlot, string> = {
  problem: 'Screens showing the problem',
  before: 'Before',
  after: 'After',
}

export const SLOT_ENTRY_LABELS: Record<ImageSlot, string> = {
  problem: 'Problem screen',
  before: 'Before',
  after: 'After',
}

/**
 * The tap under "What are the product's main areas?".
 *
 * One question where there were two. The second used to be "which of those did
 * you build from scratch", and what it marked is now marked by the designer
 * attaching one of their own decisions to the part instead — a thing they said
 * rather than a second thing to classify. Both stay claims they made; neither is
 * read off the other, which is the property that mattered.
 *
 * The whole list still has to be asked for, and the field's helper still says
 * so. The picture is the worked parts against the rest, and without the rest
 * there is no reach to show.
 */
export const AREA_CHIPS = {
  worked: 'Which of these did you work on?',
} as const

/**
 * The other side of step 4's fork: page work rather than a product's parts.
 *
 * The fork is phrased as a question about the project, and its helper says
 * plainly that it changes the next question — a fork whose consequence is
 * invisible reads as a setting, and someone will wonder what they lost by
 * picking the other one.
 *
 * The section list is parsed by `parseAreas`, the same function the parts
 * answer uses. Its case-insensitive de-dup is right here too: two rows reading
 * "CTA" and "cta" cannot be told apart once they are drawn, so collapsing them
 * is the honest outcome rather than a loss.
 */
export const SECTION_CHIPS = {
  fork: 'Which is closer to what you worked on?',
  // Was "It changes the next question and nothing else." That stopped being
  // true once the answer started deciding which picture Approach carries, and
  // the review screen now says what that picture would be — so the helper only
  // has to make the question answerable.
  forkHelper: 'It decides what the rest of this step asks.',
  perSection: 'What happened to each section?',
} as const

/**
 * The third side of the fork: one flow, by its steps.
 *
 * One tap per step and it is binary, where the page question is a tri-state —
 * a step either survived or it did not. Phrased as what is GONE rather than
 * what was deleted, because §5.2 counts a step merged into another as removed
 * and "deleted" would read as excluding it.
 */
export const FLOW_CHIPS = {
  // "Cut or merge" rather than "removed": §5.2 counts a step merged into
  // another as gone, and a designer who merged two screens does not read
  // "removed" as covering it.
  removed: 'Which of these did you cut or merge?',
} as const

/** Added, kept or cut, in the order the diagram's categories list them. */
export const SECTION_FATES: ReadonlyArray<{ value: SectionFate; label: string }> = [
  { value: 'added', label: 'Added' },
  { value: 'cut', label: 'Cut' },
  { value: 'kept', label: 'Kept' },
] as const

export const COLLABORATOR_FIELDS = {
  legend: 'Who else worked on it?',
  name: { label: 'Name', placeholder: 'e.g. Dani Okafor' },
  role: { label: 'Role', placeholder: 'e.g. Operations lead' },
} as const

export const WIZARD_STEPS: ReadonlyArray<{
  id: StepId
  /** Short label for the step indicator. */
  name: string
  heading: string
  subhead: string
}> = [
  {
    id: 1,
    name: 'The project',
    heading: 'About the project',
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
    name: 'How it fit',
    heading: 'How the work fit together',
    subhead: 'Anything that shaped how you worked.',
  },
  {
    id: 5,
    name: 'Where it landed',
    heading: 'Where it landed',
    subhead: 'However it ended. Handed off or shipped is still a story.',
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
// Five steps, every time. The old step 4 asked what each uploaded screen
// showed and dropped out of the order when nothing had been uploaded, because
// an empty step reads as a bug. Uploads now sit beside the thing they show, so
// there is no step left whose entire content is conditional: the new step 4
// asks how the decisions relate, and there are always at least two of those.

export function stepOrder(): StepId[] {
  return [1, 2, 3, 4, 5, 'review']
}

export function nextStep(current: StepId): StepId {
  const order = stepOrder()
  const i = order.indexOf(current)
  if (i === -1 || i === order.length - 1) return current
  return order[i + 1]
}

export function prevStep(current: StepId): StepId {
  const order = stepOrder()
  const i = order.indexOf(current)
  if (i <= 0) return current
  return order[i - 1]
}

/** Position for the indicator: 1-based. */
export function stepPosition(current: StepId): { index: number; total: number } {
  const order: StepId[] = stepOrder().filter((s) => s !== 'review')
  const i = order.indexOf(current)
  return { index: i === -1 ? order.length : i, total: order.length }
}

// ---------------------------------------------------------------------------
// Building the intake
// ---------------------------------------------------------------------------

/**
 * A picked file, its slot, and what it shows.
 *
 * The id exists because the note and the slot have to survive a removal:
 * identity used to be positional, and removing the second screen after
 * annotating the third slid every note onto the wrong image. The database id
 * would do, but it is not generated until upload, which happens after the whole
 * form is submitted.
 *
 * The note now travels ON the attachment rather than in a map keyed by its id.
 * That is what the move to per-slot uploads bought: a file is picked into the
 * slot that explains it, so there is no second structure to keep in step.
 */
/**
 * The product's parts, out of one comma-separated answer.
 *
 * Commas and newlines both separate, because people do both. Duplicates are
 * dropped case-insensitively while keeping the first spelling — the chips are
 * generated from this, and two chips reading "Orders" and "orders" is a bug the
 * user cannot fix from the form.
 *
 * Nothing is capped here. How many parts make a diagram worth drawing is the
 * diagram's gate to decide, not the form's.
 */
export function parseAreas(raw: string | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of (raw ?? '').split(/[,\n]/)) {
    const name = part.trim()
    if (name === '') continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

/**
 * One entry in a step-4 list: a part, a section, or a step of a flow.
 *
 * THE ID IS THE WHOLE POINT. Marks and attachments used to be separate arrays of
 * names, reconciled back against the typed answer on every render, which meant a
 * rename silently dropped a tap and two parts spelled alike were one part. Chips
 * are now dragged and deleted as well, so matching by position would be worse
 * still: the first drag would slide a decision onto a neighbour with nothing
 * saying so. Everything about a chip hangs off `id`, and nothing is ever matched
 * by label or by index.
 *
 * `worked` and `decisions` are `separate_parts` only. The page and flow branches
 * use a chip for entry and ordering and keep their own marking — three fates for
 * a section, gone-or-not for a step — because those are not the same question.
 */
export type Chip = {
  id: string
  label: string
  /** separate_parts only. Absent, never false, where it was not tapped. */
  worked?: true
  /** separate_parts only. `Decision.id`s, never labels and never positions. */
  decisions?: string[]
}

/**
 * How many chips one list holds.
 *
 * The brief asked for 10. It is `PART_MAX` so that the form's cap and the
 * diagram's reach are the same number — a cap above the grid's limit lets
 * someone fill nine chips against no resistance and then get no picture, with
 * the form having encouraged every one of them.
 */
export const CHIP_MAX = PART_MAX

export function createChip(label: string): Chip {
  return { id: crypto.randomUUID(), label }
}

/**
 * A chip per name, for a list that only ever existed as text.
 *
 * Used on restore: a draft written before chips carries the person's typed
 * answer and no chips, and their list is still their work. The taps are gone —
 * they were stored by name and there is no honest way to reattach them to ids
 * that did not exist — so the list comes back unmarked rather than guessed at.
 */
export function chipsFromText(raw: string | undefined): Chip[] {
  return parseAreas(raw).slice(0, CHIP_MAX).map(createChip)
}

/** The labels, in chip order. What `buildIntake` writes back as the raw answer. */
export function chipText(chips: readonly Chip[]): string {
  return chips.map((c) => c.label).join(', ')
}

/**
 * Add, unless the label is blank, already taken, or the list is full.
 *
 * Case-insensitive on the duplicate check, matching `parseAreas`: two chips
 * reading "Orders" and "orders" cannot be told apart once they are drawn.
 */
export function addChip(chips: readonly Chip[], label: string): Chip[] {
  const name = label.trim()
  if (name === '' || chips.length >= CHIP_MAX) return [...chips]
  if (chips.some((c) => c.label.toLowerCase() === name.toLowerCase())) return [...chips]
  return [...chips, createChip(name)]
}

export function removeChip(chips: readonly Chip[], id: string): Chip[] {
  return chips.filter((c) => c.id !== id)
}

/** Move the chip at `from` to `to`, keeping every other chip's relative order. */
export function moveChip(chips: readonly Chip[], from: number, to: number): Chip[] {
  if (from === to || from < 0 || to < 0 || from >= chips.length || to >= chips.length) {
    return [...chips]
  }
  const next = [...chips]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Tap to mark, tap again to clear — and clearing takes the attachments with it.
 *
 * An unworked part carrying decisions is a state the diagram would have to
 * decide what to do with, so the form never produces one.
 */
export function toggleChipWorked(chips: readonly Chip[], id: string): Chip[] {
  return chips.map((c) => {
    if (c.id !== id) return c
    // Rebuilt rather than spread-minus-keys: a chip is exactly these four
    // fields, and naming the two that survive is clearer than naming the two
    // that go.
    if (c.worked) return { id: c.id, label: c.label }
    return { ...c, worked: true as const }
  })
}

/** Attach a decision to a chip, or detach it. Only a worked chip can carry one. */
export function toggleChipDecision(
  chips: readonly Chip[],
  id: string,
  decisionId: string
): Chip[] {
  return chips.map((c) => {
    if (c.id !== id || !c.worked) return c
    const held = c.decisions ?? []
    const next = held.includes(decisionId)
      ? held.filter((d) => d !== decisionId)
      : [...held, decisionId]
    // Guarded above: this chip is worked, so the mark survives and only the
    // now-empty attachment list goes.
    if (next.length === 0) return { id: c.id, label: c.label, worked: true }
    return { ...c, decisions: next }
  })
}

/**
 * Drops attachments pointing at decisions that no longer exist.
 *
 * A decision deleted in step 3 leaves its id behind on whatever chips held it.
 * Run on the way into the intake rather than on every keystroke in step 3, for
 * the same reason the image notes are: a decision being retyped is not a
 * decision being removed.
 */
export function pruneChipDecisions(chips: readonly Chip[], liveIds: ReadonlySet<string>): Chip[] {
  return chips.map((c) => {
    if (!c.decisions) return c
    const kept = c.decisions.filter((d) => liveIds.has(d))
    if (kept.length === c.decisions.length) return c
    if (kept.length === 0) {
      return c.worked ? { id: c.id, label: c.label, worked: true } : { id: c.id, label: c.label }
    }
    return { ...c, decisions: kept }
  })
}

/**
 * Which block step 4 shows, or null where the fork has not been answered.
 *
 * IT USED TO DEFAULT TO `separate_parts`, AND THAT WAS THE BUG. A default made
 * the fork look like a question somebody had already answered, so it read as a
 * setting rather than a choice and was skipped — and skipping it quietly
 * decided the project was a product with separate parts. Two real projects
 * went through that way: a one-page website and a three-screen app, both of
 * which had a better branch available and neither of which was ever offered
 * it. Nothing is chosen for the person now.
 *
 * The one exception is back-compat, and it is narrow: a draft written before
 * the fork existed has answers under the parts question and no way to have
 * picked anything, so a filled `product_areas` still resolves to that branch.
 * A draft written before these existed is still the person's work.
 *
 * One definition, used by the form and by `buildIntake`, so what is on screen
 * and what is stored cannot disagree about which question was asked.
 */
export function shownShape(
  shape: WorkShape | null,
  text: Partial<Record<TextKey, string>>
): WorkShape | null {
  if (shape) return shape
  return (text.product_areas ?? '').trim() !== '' ? 'separate_parts' : null
}

/** Lifted out of Step4Structure, where no test could reach it. */
export function toggleName(list: readonly string[], name: string): string[] {
  return list.includes(name) ? list.filter((n) => n !== name) : [...list, name]
}

/**
 * One fate per section, and tapping the one it already has clears it.
 *
 * Exclusive, because a section sits in one place on the page. The fourth state
 * is no fate at all, and it is DELETED rather than stored as a blank: a
 * section nobody sorted is data the overlay draws as a gap (PRD §5.3), and ''
 * would travel as a fate whose name happens to be empty.
 */
export function assignFate(
  current: Record<string, SectionFate>,
  section: string,
  fate: SectionFate
): Record<string, SectionFate> {
  const next = { ...current }
  if (next[section] === fate) delete next[section]
  else next[section] = fate
  return next
}

/**
 * Keeps the fates honest against the answer they were chosen from.
 *
 * Same reason as `reconcileAreas`: someone lists eight sections, sorts them,
 * then renames one — and a fate pointing at a section no longer on screen is a
 * claim nobody made. It is also what makes the diagram's "not in categories"
 * gate unreachable from the form.
 */
export function reconcileFates(
  sections: readonly string[],
  assigned: Record<string, SectionFate>
): Record<string, SectionFate> {
  const out: Record<string, SectionFate> = {}
  for (const name of sections) {
    const fate = assigned[name]
    if (fate) out[name] = fate
  }
  return out
}

/**
 * The ordered array that lands in the jsonb. The index IS the page's order.
 *
 * Built from the section list rather than from the fate map, because the map
 * has no order to give and the page's order is the only axis the diagram has.
 */
/**
 * The ordered array that lands in the jsonb. Index is the flow's order.
 *
 * Binary rather than a fate map: a step survived or it did not, and `removed`
 * is absent rather than false so the two states cannot be half-read.
 */
export function buildFlowSteps(
  steps: readonly string[],
  removed: readonly string[]
): FlowStep[] {
  return steps.map((label) => (removed.includes(label) ? { label, removed: true } : { label }))
}

export function buildPageSections(
  sections: readonly string[],
  assigned: Record<string, SectionFate>
): PageSection[] {
  return sections.map((label) => {
    const fate = assigned[label]
    return fate ? { label, fate } : { label }
  })
}

export type Attachment = {
  id: string
  file: File
  slot: ImageSlot
  /** A Decision.id. Set for 'before' and 'after', absent for 'problem'. */
  decisionId?: string
  notice: string
}

export type WizardState = {
  text: Partial<Record<TextKey, string>>
  toggles: Partial<Record<ToggleKey, boolean>>
  decisions: Decision[]
  collaborators: Collaborator[]
  provenance: Provenance | null
  outcome: OutcomeStatus | null
  /**
   * The product's parts, in the designer's order, each carrying its own mark and
   * attachments. The source of truth for the list — `text.product_areas` is
   * composed from it, not parsed into it.
   */
  parts: Chip[]
  /** The page's sections, in scroll order. Marking stays in `sectionFates`. */
  pageSections: Chip[]
  /** The flow's steps, in walking order. Marking stays in `stepsRemoved`. */
  flowSteps: Chip[]
  /**
   * Which side of step 4's fork is being asked. Null is the screen as it was
   * before the fork existed, which is what a restored older draft reads as.
   */
  shape: WorkShape | null
  /**
   * What happened to each named section of the page, at most one each.
   *
   * A record here and an ORDERED ARRAY on the intake. The page's order is
   * re-derived from the answer on every render, which is the discipline step 4
   * already follows for the parts chips, so this never has to carry it — and
   * `buildIntake` is the one place the two meet.
   */
  sectionFates: Record<string, SectionFate>
  /** Steps of the flow that are gone. Always a subset of what the answer holds. */
  stepsRemoved: string[]
  /** In final order. Index here becomes case_study_attachments.order_index. */
  attachments: Attachment[]
}

// NOTE ON TONE. It is deliberately NOT on WizardState and NOT in `Intake`.
// `createCaseStudy` takes it beside `projectType` and writes it to the
// `case_studies.tone` column, so it never enters the object the prompt renderer
// walks. That is what keeps "stored, never sent" true by construction rather
// than by anyone remembering — see the block above TONES in lib/intake-fields.ts.

// NOTE ON TONE. It is deliberately NOT on WizardState and NOT in `Intake`.
// `createCaseStudy` takes it beside `projectType` and writes it to the
// `case_studies.tone` column, so it never enters the object the prompt renderer
// walks. That is what keeps "stored, never sent" true by construction rather
// than by anyone remembering — see the block above TONES in lib/intake-fields.ts.

export function createDecision(): Decision {
  return { id: crypto.randomUUID(), decided: '', why: '' }
}

export function emptyWizardState(): WizardState {
  return {
    text: {},
    toggles: {},
    decisions: Array.from({ length: DECISIONS_MIN }, createDecision),
    collaborators: [],
    provenance: null,
    outcome: null,
    parts: [],
    pageSections: [],
    flowSteps: [],
    shape: null,
    sectionFates: {},
    stepsRemoved: [],
    attachments: [],
  }
}

/**
 * The one writer of the shape that lands in `case_studies.intake`.
 *
 * Everything optional is omitted rather than stored as '' or false, so "never
 * answered" stays distinguishable from "answered with nothing" — which is the
 * distinction the prompt renderer depends on to leave a question out rather
 * than print it blank, and a blank prompt is an invitation to fill it (§10.1).
 */
export function buildIntake(state: WizardState): Intake {
  const intake: Intake = { schema_version: 2, decisions: [], image_notes: [] }
  const shape = shownShape(state.shape, state.text)

  for (const field of INTAKE_FIELDS) {
    // A revealed field whose toggle is off was never asked. Storing whatever
    // was typed before the toggle was turned back off would put an answer on
    // the row that the form is not currently showing anyone.
    if (field.revealedBy && state.toggles[field.revealedBy] !== true) continue
    // A field from the branch step 4 did not show was never asked either, for
    // exactly the reason above. It is also what records the fork's answer: the
    // branch is readable off which keys the row carries, so the fork itself
    // needs no key of its own.
    if (field.branch && field.branch !== shape) continue
    const value = state.text[field.key]?.trim()
    if (value) intake[field.key] = value
  }

  for (const toggle of ['client_may_be_named', 'reported_verbatim', 'has_measurement'] as const) {
    if (state.toggles[toggle]) intake[toggle] = true
  }

  if (state.provenance) intake.diagnosis_provenance = state.provenance
  if (state.outcome) intake.outcome_status = state.outcome

  const collaborators = state.collaborators
    .map((c) => ({ name: c.name.trim(), role: c.role.trim() }))
    .filter((c) => c.name || c.role)
  if (collaborators.length > 0) intake.collaborators = collaborators

  intake.decisions = state.decisions
    // A block the user never typed into is not a decision. Two visible blocks
    // is an invitation, not a promise of two fix blocks.
    .filter((d) => decisionHasContent(d))
    .map((d) => {
      const kept: Decision = {
        id: d.id,
        decided: d.decided.trim(),
        why: d.why.trim(),
      }
      if (d.no_prior_version) kept.no_prior_version = true
      const prior = d.prior_behaviour?.trim()
      if (prior) kept.prior_behaviour = prior
      const consequence = d.consequence?.trim()
      if (consequence) kept.consequence = consequence
      const rejected = d.rejected?.trim()
      if (rejected) kept.rejected = rejected
      const request = d.client_request?.trim()
      if (request) kept.client_request = request

      const relations: NonNullable<Decision['relations']> = {}
      const pattern = d.relations?.breaks_pattern?.trim()
      if (pattern) relations.breaks_pattern = pattern
      if (d.relations?.repeated_treatment) relations.repeated_treatment = true
      if (d.relations?.depends_on) relations.depends_on = d.relations.depends_on
      if (Object.keys(relations).length > 0) kept.relations = relations

      return kept
    })

  const liveDecisionIds = new Set(intake.decisions.map((d) => d.id))

  // Where the work sat, down whichever side of the fork was asked. Both are
  // reconciled against the text they were chosen from, so an edited answer
  // cannot leave a selection pointing at a name that is gone.
  //
  // Only one side is ever written, which is what makes the fork's answer
  // recoverable from the row without storing it — see `intakeShape`.
  //
  // The raw text answer is COMPOSED from the chips rather than parsed into them.
  // The registry loop above may have written an older draft's typed string under
  // the same key, so each branch overwrites it from what is actually on screen.
  if (shape === null) {
    // The fork was never answered, so neither branch was ever on screen and
    // nothing from either belongs on the row.
    delete intake.product_areas
    delete intake.page_sections
    delete intake.flow_steps
  } else if (shape === 'separate_parts') {
    delete intake.page_sections
    delete intake.flow_steps
    // `shownShape` resolves a pre-chip draft to this branch off the typed answer
    // alone, so the same answer has to produce chips here. The form seeds them
    // on restore; this makes the fallback true of the data rather than true only
    // of the one caller that remembers to do it.
    const parts = pruneChipDecisions(
      state.parts.length > 0 ? state.parts : chipsFromText(state.text.product_areas),
      liveDecisionIds
    )
    if (parts.length > 0) {
      intake.product_areas = chipText(parts)
      intake.product_parts = parts.map((c): ProductPart => {
        const part: ProductPart = { label: c.label }
        if (c.worked) part.worked = true
        // Only a worked part carries decisions. The form cannot produce an
        // unworked one holding any, and the row must not either.
        if (c.worked && c.decisions && c.decisions.length > 0) part.decisions = c.decisions
        return part
      })
    } else {
      delete intake.product_areas
    }
  } else if (shape === 'single_page') {
    delete intake.product_areas
    delete intake.flow_steps
    const chips =
      state.pageSections.length > 0 ? state.pageSections : chipsFromText(state.text.page_sections)
    const sections = chips.map((c) => c.label)
    if (sections.length > 0) {
      intake.page_sections = chipText(chips)
      intake.page_sections_ordered = buildPageSections(
        sections,
        reconcileFates(sections, state.sectionFates)
      )
    } else {
      delete intake.page_sections
    }
  } else {
    delete intake.product_areas
    delete intake.page_sections
    const chips = state.flowSteps.length > 0 ? state.flowSteps : chipsFromText(state.text.flow_steps)
    const steps = chips.map((c) => c.label)
    if (steps.length > 0) {
      intake.flow_steps = chipText(chips)
      // Reconciled against the chips the taps were made from, like the two
      // branches above: a step renamed after it was tapped is a claim nobody made.
      intake.flow_steps_ordered = buildFlowSteps(
        steps,
        state.stepsRemoved.filter((n) => steps.includes(n))
      )
    } else {
      delete intake.flow_steps
    }
  }

  intake.image_notes = state.attachments.map((a, orderIndex): ImageNote => {
    const note: ImageNote = { orderIndex, slot: a.slot }
    // A screen whose decision was deleted keeps its file and loses its link.
    // Dropping the note instead would leave an uploaded image with nothing
    // said about it, which §8.7 answers by dropping the ASSET — a call for the
    // generator to make against the whole set, not for this function.
    if (a.decisionId && liveDecisionIds.has(a.decisionId)) {
      note.decisionId = a.decisionId
    }
    const notice = a.notice.trim()
    if (notice) note.notice = notice
    return note
  })

  return intake
}

function decisionHasContent(d: Decision): boolean {
  return Boolean(
    d.decided.trim() ||
      d.why.trim() ||
      d.prior_behaviour?.trim() ||
      d.consequence?.trim() ||
      d.rejected?.trim() ||
      d.client_request?.trim()
  )
}

/**
 * Blank named inputs at generation time, without touching the stored row.
 *
 * Dev-only ablation tooling: the point is to ask what the output loses when a
 * field is missing, which only means anything if the same row can be run
 * repeatedly with different fields removed. Paths are `key`,
 * `decisions[].key` to clear a column across every decision, `decisions[2].key`
 * for one, or `image_notes` for the lot.
 */
export function blankInputs(intake: Intake, paths: readonly string[]): Intake {
  const next: Intake = {
    ...intake,
    decisions: intake.decisions.map((d) => ({ ...d })),
    image_notes: intake.image_notes.map((n) => ({ ...n })),
  }

  for (const path of paths) {
    const perDecision = /^decisions\[(\d*)\]\.(\w+)$/.exec(path)
    if (perDecision) {
      const [, index, key] = perDecision
      next.decisions.forEach((d, i) => {
        if (index !== '' && Number(index) !== i) return
        delete (d as Record<string, unknown>)[key]
      })
      continue
    }
    if (path === 'image_notes') {
      next.image_notes = []
      continue
    }
    delete (next as Record<string, unknown>)[path]
  }

  return next
}

// ---------------------------------------------------------------------------
// The review screen
// ---------------------------------------------------------------------------

/**
 * Reasons the case study cannot be written yet.
 *
 * This is NOT the "never block next" rule being walked back. Navigation stays
 * unblocked all the way to the review screen. This is about not letting
 * someone buy a guaranteed failure: §3.4 requires between two and four fix
 * blocks and the wizard derives one per decision, so a single decision cannot
 * produce a legal document no matter how good the writing is.
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
export function compileBlockers(intake: { decisions: Decision[] }): string[] {
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
 */
/**
 * The four skip conditions, each named, against the chips as they stand.
 *
 * Returned as a shape rather than a boolean so the step can decide what to do
 * with it. **It warns today and blocks nothing** — that is the current call, not
 * a property of this function, and flipping it later means reading `draws` at
 * the Next button instead of adding anything here.
 *
 * It is the one place the conditions are evaluated against wizard state, and it
 * mirrors `gateSetException` deliberately: the gate runs over a built contract
 * at generation time, this runs over chips while someone is still typing, and
 * the two disagreeing would be the form promising a picture the page then drops.
 */
export function partsDiagramState(parts: readonly Chip[]): {
  tooFew: boolean
  noneWorked: boolean
  allWorked: boolean
  noneAttached: boolean
  draws: boolean
} {
  const worked = parts.filter((c) => c.worked)
  const attached = worked.filter((c) => (c.decisions ?? []).length > 0)

  const tooFew = parts.length < PART_MIN
  const noneWorked = worked.length === 0
  const allWorked = parts.length > 0 && worked.length === parts.length
  const noneAttached = attached.length === 0

  return {
    tooFew,
    noneWorked,
    allWorked,
    noneAttached,
    draws: !tooFew && !noneWorked && !allWorked && !noneAttached,
  }
}

/**
 * Named decisions that no chip claims, in the designer's own words.
 *
 * Surfaced on the step as a note and never as a blocker. An unattached decision
 * is not an error — plenty of work does not land on one named part — and the
 * reason it is said out loud is the opposite: nothing downstream may invent a
 * part to hang it on, so the only honest move is to show the designer which
 * decisions the picture will not mention and let them decide.
 */
export function unattachedDecisions(
  decisions: readonly Decision[],
  parts: readonly Chip[]
): string[] {
  const claimed = new Set(parts.filter((c) => c.worked).flatMap((c) => c.decisions ?? []))
  return decisions
    .filter((d) => d.decided.trim() !== '' && !claimed.has(d.id))
    .map((d) => d.decided.trim())
}

/**
 * What step 4 is still short of, said while there is something to do about it.
 *
 * The review screen's note arrives after the step is behind you; this is the
 * same thing said on the step itself. Null means nothing to say — either the
 * fork is unanswered, and visibly so, or the list is empty and the placeholder
 * is already doing the work, or the branch is satisfied and says so instead.
 *
 * Takes what `Step4Structure` holds rather than a whole `WizardState`, and reads
 * the chips themselves, so the hint cannot disagree with what is beside it.
 */
export function approachHint(a: {
  shape: WorkShape | null
  text: Partial<Record<TextKey, string>>
  parts: readonly Chip[]
  pageSections: readonly Chip[]
  flowSteps: readonly Chip[]
  sectionFates: Record<string, SectionFate>
  stepsRemoved: readonly string[]
}): string | null {
  const shape = shownShape(a.shape, a.text)
  if (shape === null) return null

  if (shape === 'separate_parts') {
    if (a.parts.length === 0) return null
    const state = partsDiagramState(a.parts)
    if (!state.draws) {
      // One line per failed condition, in the order that leaves the most
      // actionable thing on screen: add parts, tap some, leave some untapped,
      // then attach a decision.
      if (state.tooFew) return WIZARD_COPY.hintPartsShort
      if (state.noneWorked) return WIZARD_COPY.hintPartsTap
      if (state.allWorked) return WIZARD_COPY.hintPartsAllMarked
      return WIZARD_COPY.hintPartsAttach
    }
    return WIZARD_COPY.hintDraws
  }

  if (shape === 'single_page') {
    const sections = a.pageSections.map((c) => c.label)
    if (sections.length === 0) return null
    const fates = reconcileFates(sections, a.sectionFates)
    const marked = Object.values(fates)
    if (marked.length === 0) return WIZARD_COPY.hintPageMark
    const kinds = new Set(marked).size
    const ok =
      sections.length >= SECTION_MIN &&
      sections.length <= SECTION_MAX &&
      kinds >= CATEGORY_MIN &&
      (a.text.page_pattern ?? '').trim() !== ''
    return ok ? WIZARD_COPY.hintDraws : WIZARD_COPY.hintPageShort
  }

  const steps = a.flowSteps.map((c) => c.label)
  if (steps.length === 0) return null
  const removed = a.stepsRemoved.filter((n) => steps.includes(n))
  if (removed.length === 0) return WIZARD_COPY.hintFlowTap
  const ok =
    steps.length >= STEP_MIN &&
    steps.length <= STEP_MAX &&
    removed.length >= MIN_REDUCTION &&
    steps.length - removed.length >= SURVIVOR_MIN
  return ok ? WIZARD_COPY.hintDraws : WIZARD_COPY.hintFlowShort
}

/**
 * What step 4 would have to hold for Approach to draw the work.
 *
 * Null when one of the three real templates already fired. Otherwise the page
 * is going to carry the floor form — a picture of the decisions — and this
 * says what the branch in question is short of.
 *
 * It exists because two real projects shipped on the floor form without anyone
 * noticing a better picture was a tap away. Nothing here is a judgement about
 * the answers: a visual is drawn either way, and this is the difference between
 * two true pictures.
 */
export function diagramNote(intake: Intake, shape: WorkShape | null = null): string | null {
  const diagram = buildApproachDiagram(intake)
  if (!diagram || diagram.template !== 'decision-set') return null

  // `shape` comes from the form, where it is known outright. The intake cannot
  // always say: a branch that was picked and then left blank writes no key at
  // all, so inferring from the row alone tells someone to answer a question
  // they have already answered. Inference is the fallback, for a stored row
  // being reviewed without the form's state beside it.
  switch (shape ?? intakeShapeOrNull(intake)) {
    case 'single_page':
      return WIZARD_COPY.noteDiagramPage
    case 'one_flow':
      return WIZARD_COPY.noteDiagramFlow
    case 'separate_parts':
      return WIZARD_COPY.noteDiagramParts
    default:
      return WIZARD_COPY.noteDiagramUnforked
  }
}

/** Which branch a stored row was asked, or null when it carries no sign of one. */
function intakeShapeOrNull(intake: Intake): WorkShape | null {
  if (intake.page_sections || intake.page_pattern) return 'single_page'
  if (intake.flow_steps) return 'one_flow'
  if (intake.product_areas) return 'separate_parts'
  return null
}

export function reviewNotes(intake: Intake, shape: WorkShape | null = null): string[] {
  const notes: string[] = []

  const diagram = diagramNote(intake, shape)
  if (diagram) notes.push(diagram)

  if (intake.image_notes.length === 0) {
    notes.push(WIZARD_COPY.noteNoScreens)
  } else if (intake.image_notes.every((n) => !n.notice)) {
    // Uploaded, and nothing said about any of them. The captions would be
    // guessed from the vision pass alone, which is exactly the "describes the
    // UI" failure §8.6 exists to prevent.
    notes.push(WIZARD_COPY.noteUnlabelledScreens)
  }

  return notes
}

/**
 * Which branch this project is on: whether it can carry a measurement, or has to
 * make its case without one.
 *
 * THE RULE IS COMPLETENESS, NOT THE PRESENCE OF A DIGIT. This used to answer "the
 * metrics field contains a digit anywhere", which routed a project into the
 * metric branch on the strength of a date, a version number or a count of
 * screens. That branch then requires six things — the measure, its baseline
 * value, the period it covers, where the number came from, the after value and
 * what else changed — and the free-text field never collected any of them. The
 * page ended up in the stricter branch with none of the material the branch
 * exists to handle, and because an absence is never narrated on the page, the
 * failure was silent.
 *
 * All seven must be present, and the two value fields must actually hold a
 * number. `has_measurement` off, or any component missing, is the contribution
 * branch: a partly-measured project does not get a half-built metric page, it
 * gets the contribution page (see `mixedFigure` for the one figure that can still
 * appear).
 *
 * Derived, never asked and never stored. Every input is already on the row, so
 * persisting the answer would only create a second copy that goes stale the
 * moment this rule changes.
 *
 * Shipping status deliberately does not enter into it. Shipped with nothing
 * measured is still the contribution branch: "it launched" is not evidence that
 * anything moved.
 */
export type EvidenceBranch = 'metric' | 'contribution'

export function evidenceBranch(intake: StoredIntake): EvidenceBranch {
  // A row written before the rebuild collected one free-text answer, none of the
  // seven components. By the same rule it cannot be on the metric branch: a
  // person who says there are numbers but cannot name the measure, the baseline,
  // the window and the source is on the contribution branch.
  if (!isFocusedFixIntake(intake)) return 'contribution'
  if (!intake.has_measurement) return 'contribution'

  const complete = MEASUREMENT_KEYS.every((key) => (intake[key] ?? '').trim() !== '')
  if (!complete) return 'contribution'

  // The digit check survives, but as a check that the two fields meant to hold a
  // value do — not as the gate. Same definition of "a number" the stat-headline
  // rule uses.
  return containsDigit(intake.baseline_value ?? '') && containsDigit(intake.after_value ?? '')
    ? 'metric'
    : 'contribution'
}

export type MixedFigure = {
  measure: string
  value: string
  period?: string
  source: string
}

/**
 * The single figure a partly-measured project may still state.
 *
 * A weak or partial number is handled as the contribution branch carrying ONE
 * figure with its source inline — never as a headline, never in the metadata
 * strip, because one unreliable number in a prominent position discredits
 * everything around it. Without a source there is no figure at all: a number
 * whose source cannot be named invites a reader to check something that cannot be
 * checked.
 *
 * Null on the metric branch (the full block handles it), and null when there is
 * nothing usable.
 */
export function mixedFigure(intake: Intake): MixedFigure | null {
  if (evidenceBranch(intake) === 'metric') return null
  if (!intake.has_measurement) return null

  const measure = (intake.measure ?? '').trim()
  const source = (intake.baseline_source ?? '').trim()
  if (!measure || !source) return null

  const after = (intake.after_value ?? '').trim()
  const before = (intake.baseline_value ?? '').trim()
  const value = after || before
  if (!value || !containsDigit(value)) return null

  const period = (after ? intake.after_period : intake.baseline_period)?.trim()
  return { measure, value, ...(period ? { period } : {}), source }
}

/**
 * The letters the legacy renderer still speaks.
 *
 * CaseStudyDocument's `evidenceType` prop takes 'A' | 'B' and decides whether the
 * results lead the page or close it. The output specification calls contribution
 * evidence "Branch A" and hard metrics "Branch B"; this code has always returned
 * 'A' for hard metrics. The two conventions are inverted (§7.1 records it), so
 * the words are used everywhere new and the letters stop here, at the one
 * consumer that still takes them.
 */
export type EvidenceType = 'A' | 'B'

export function evidenceType(intake: StoredIntake): EvidenceType {
  return evidenceBranch(intake) === 'metric' ? 'A' : 'B'
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
  /**
   * Identity, separate from `step`.
   *
   * They used to be the same value, and the screens section broke that: it
   * sends its Edit links to step 2 or step 3 depending on the slot, so it
   * carries step 2 and collided with the step-2 section — two React children
   * with the same key, which is unsupported and silently drops one.
   */
  id: string
  step: StepId
  heading: string
  entries: ReviewEntry[]
  /** True only when every entry in the section is thin. */
  thin: boolean
}

export function decisionElementId(decisionId: string): string {
  return `decision-${decisionId}-decided`
}

export function screenElementId(attachmentId: string): string {
  return `screen-${attachmentId}-notice`
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

function section(step: StepId, entries: ReviewEntry[]): ReviewSection {
  return {
    id: `step-${String(step)}`,
    step,
    heading: stepMeta(step).heading,
    entries,
    // Every entry, not any: one short answer beside three full ones is not a
    // section that needs attention, and marking it would be nagging.
    thin: entries.length > 0 && entries.every((e) => e.thin),
  }
}

/**
 * Which side of step 4's fork this row was asked, read off what it holds.
 *
 * Derived, never asked and never stored — the `evidenceBranch` shape. It is
 * correct precisely because `buildIntake` writes only the branch that was
 * shown: a row carrying any page answer was asked the page question, and
 * everything else was asked the one that came before the fork.
 */
export function intakeShape(intake: Intake): WorkShape {
  if (intake.flow_steps || intake.flow_steps_ordered) return 'one_flow'
  if (intake.page_sections || intake.page_pattern || intake.page_sections_ordered) {
    return 'single_page'
  }
  return 'separate_parts'
}

function textEntries(step: FieldStep, intake: Intake): ReviewEntry[] {
  // Two filters, and both are necessary: a toggle that is off and a branch that
  // was not shown are both answers nobody was asked for, and printing either as
  // an empty row invites someone to go and fill in a question they never saw.
  const onThisSide = fieldsForShape(intakeShape(intake)).filter((f) => f.step === step)
  const fields: IntakeField[] = visibleFields(onThisSide, intake)
  return fields.map((f) =>
    entry(f.label, intake[f.key], fieldElementId(f.key), step)
  )
}

export function buildReview(
  intake: Intake,
  attachments: readonly Attachment[] = []
): ReviewSection[] {
  const collaborators = (intake.collaborators ?? [])
    .map((c) => [c.name, c.role].filter(Boolean).join(' — '))
    .join(', ')

  const provenance = PROVENANCE_OPTIONS.find(
    (p) => p.value === intake.diagnosis_provenance
  )

  const sections: ReviewSection[] = [
    section(1, [
      ...textEntries(1, intake),
      // A credits line is a claim about real people, so an empty one is worth
      // seeing on this screen rather than discovering as an absence later.
      {
        label: 'Who else worked on this',
        value: collaborators,
        anchor: 'collaborators',
        step: 1 as StepId,
        empty: collaborators === '',
        // Two names is a complete answer however few words it is.
        thin: collaborators === '',
      },
    ]),
    section(2, [
      ...textEntries(2, intake),
      {
        label: 'How you found out',
        value: provenance?.label ?? '',
        anchor: 'intake-diagnosis_provenance',
        step: 2 as StepId,
        empty: !provenance,
        thin: !provenance,
      },
    ]),
    section(3, [
      // A decision is not judged by the length of what it decided — a fix
      // block title is meant to be short. What makes a decision thin is having
      // nothing behind it: `why` is the reason the block has to pass §6.1's
      // three tests with, and without one the fix is suspended in mid-air.
      ...intake.decisions.map((d, i) => ({
        label: `Decision ${i + 1}`,
        value: d.decided.trim(),
        anchor: decisionElementId(d.id),
        step: 3 as StepId,
        empty: d.decided.trim() === '',
        thin: d.decided.trim() === '' || isThin(d.why),
      })),
    ]),
    section(4, textEntries(4, intake)),
  ]

  if (attachments.length > 0) {
    sections.push({
      id: 'screens',
      step: 2,
      heading: 'Your screens',
      entries: attachments.map((a, i) =>
        entry(
          `${SLOT_ENTRY_LABELS[a.slot]} ${i + 1}`,
          intake.image_notes.find((n) => n.orderIndex === i)?.notice,
          screenElementId(a.id),
          a.slot === 'problem' ? 2 : 3
        )
      ),
      thin: false,
    })
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
