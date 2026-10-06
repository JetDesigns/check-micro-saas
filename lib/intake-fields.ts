// The intake form: five steps and a review screen.
//
// Framing note: these questions ask the designer to account for their own
// decisions, because the reader of the output is someone deciding whether to
// hire them. An earlier version of this file asked about the client's business
// instead — that was the sales genre, and it is gone. See the genre banner in
// AGENTS.md.
//
// `key` matches a property on the `Intake` type and is stored inside
// `case_studies.intake`. Renaming a key orphans existing rows.
//
// EVERY FIELD CITES ITS INPUT ID from prompts/focused-fix-inputs.md § B, which
// names the rule in prompts/focused-fix-output.md that consumes it. A field with
// no consumer is a field the designer answers for nothing.
//
// THE COPY IS WRITTEN TO BE SPOKEN. Labels are questions someone would actually
// ask; a helper appears only where the answer would otherwise be wrong, and most
// fields have none. Placeholders are examples, never instructions. Nothing here
// mentions rules, sections, or what the generator needs — the person is talking
// about their project, not feeding a system.
//
// None of this copy reaches the model. `lib/agents/prompts.ts` imports nothing
// from this file and writes its own strings; that separation is deliberate and
// load-bearing (AGENTS.md § Intake labels are part of the prompt), and it is
// what makes a wording pass safe.
//
// Only the flat, one-string-per-answer fields live here. The repeated units —
// decisions, screens, collaborators, the relation chips — are arrays of objects,
// which a flat key/label registry cannot express. Their copy is in
// lib/wizard-steps.ts.

import type { Intake, OutcomeStatus, Provenance, ProjectType, Tone } from '@/types/database'

/**
 * Intake keys that are a single string the user types.
 *
 * `diagnosis_provenance` and `outcome_status` hold strings too, but they are
 * picked from a fixed list rather than typed. They are excluded by name because
 * a mapped type cannot tell them apart: a union of string literals extends
 * `string`, so the condition below admits them and every assignment into the
 * registry then has to satisfy the literal union as well.
 */
export type TextKey = Exclude<
  {
    [K in keyof Intake]-?: NonNullable<Intake[K]> extends string ? K : never
  }[keyof Intake],
  'diagnosis_provenance' | 'outcome_status'
>

/** Steps a registry-driven field can belong to. */
export type FieldStep = 1 | 2 | 3 | 4 | 5

/**
 * The boolean answers that reveal other fields.
 *
 * A revealed field is still in the registry when it is hidden — the review
 * screen and the prompt renderer both walk the registry, and a field that
 * vanished from it when a toggle was off would be invisible to them in a way
 * "the user left it blank" is not.
 */
export type ToggleKey = 'client_may_be_named' | 'reported_verbatim' | 'has_measurement'

/**
 * Step 4's fork: which shape the work had.
 *
 * NOT a `ProjectType`. Those three are a CHECK constraint on
 * `case_studies.project_type` (migration 0003), there is no page shape among
 * them, and this question is not about what the client bought.
 *
 * NOT ON THE INTAKE EITHER. It decides which questions step 4 asks, and the
 * answer is recorded by which arrays `buildIntake` writes — so there is no key
 * in the jsonb anybody has to interpret, and a row written before the fork
 * existed reads exactly as it always did.
 */
export type WorkShape = 'separate_parts' | 'single_page' | 'one_flow'

// Phrased as two kinds of project, never as two kinds of diagram. The person is
// describing their work; they are not picking a template, and they are never
// told one exists.
export const WORK_SHAPE_OPTIONS: ReadonlyArray<{ value: WorkShape; label: string }> = [
  { value: 'separate_parts', label: 'A product with separate parts' },
  { value: 'single_page', label: 'A single page' },
  { value: 'one_flow', label: 'One flow people walk through' },
] as const

export type IntakeField = {
  key: TextKey
  label: string
  placeholder: string
  /** At most one line, and only where the answer would otherwise be wrong. */
  helper?: string
  type: 'input' | 'textarea'
  /**
   * Drives the "optional" tag beside the label — and nothing else. Read in one
   * place, `components/studio/FieldGroup.tsx`. It has not gated navigation since
   * the wizard stopped blocking "next" (check-revision-prompt.md § Phase 2), and
   * the review screen's thin marker is computed from the answer's length, not
   * from this. Marking a field required is a statement about what the case study
   * needs, not a lock.
   */
  required: boolean
  rows?: number
  step: FieldStep
  /** Renders at half width beside the next field. Year/duration, before/after. */
  half?: boolean
  /** Hidden until this toggle is on. */
  revealedBy?: ToggleKey
  /**
   * Asked only on one side of step 4's fork.
   *
   * The close analogue of `revealedBy`, and it has to be its own property
   * rather than a reuse of it. `revealedBy` is typed `ToggleKey` and a toggle
   * is a boolean, so it can say "show when true" and not "one of two" — and a
   * boolean fork could not tell "never answered" from "answered the other way",
   * which is the distinction the omit-when-empty rule in `buildIntake` depends
   * on. `revealedBy` also reaches only registry fields, while half of what this
   * fork hides is the chip blocks in Step4Structure, which are not in the
   * registry at all.
   */
  branch?: WorkShape
  /**
   * A hard cap on what the control accepts, for the one answer whose length is
   * load-bearing downstream.
   *
   * `page_pattern` becomes the Approach diagram's caption, and PRD §4 gives the
   * caption a limit it REJECTS rather than truncates. Nothing regenerates a
   * sentence a designer typed, so without a cap here a long answer would drop
   * their diagram silently. Read in one place, `FieldGroup.tsx`.
   */
  maxChars?: number
  /**
   * Behind the step's disclosure link rather than on screen when the step opens.
   *
   * For optional answers most projects will not have. Nothing is removed — a
   * collapsed field is in the schema, in the review screen and in the prompt
   * exactly as before, and is submitted if filled. This only decides what a
   * person is looking at when they arrive.
   */
  collapsed?: boolean
}

export const INTAKE_FIELDS: readonly IntakeField[] = [
  // --- Step 1 — about the project -----------------------------------------
  {
    // I52 (+ I3 partial). The subtitle is built from this, and a subtitle that
    // would fit any redesign of anything has failed — so the example names a
    // surface and a shape of work rather than a benefit.
    key: 'title',
    label: 'What was the project?',
    placeholder: "e.g. Rebuilding the order screen for a pizza chain's POS",
    type: 'input',
    required: true,
    step: 1,
  },
  {
    // I1 + I2. The helper earns its place: left to themselves people write
    // "users", and that is the one specific nothing downstream can recover.
    key: 'product_and_users',
    label: "What's the product, and who uses it?",
    placeholder:
      'e.g. A point-of-sale for a six-site pizza chain. Servers use it on the floor, and the kitchen reads it off a screen by the pass.',
    helper: "Their job, not 'users'.",
    type: 'textarea',
    required: true,
    rows: 2,
    step: 1,
  },
  {
    key: 'client_type', // I5
    label: 'Who was it for?',
    placeholder: 'e.g. A six-site pizza chain',
    type: 'input',
    required: true,
    step: 1,
  },
  {
    key: 'client_name', // I6 — behind the naming toggle
    label: 'What are they called?',
    placeholder: 'e.g. Forno',
    type: 'input',
    required: false,
    step: 1,
    revealedBy: 'client_may_be_named',
  },
  {
    // I19. Split from the old fused `year_duration`, whose placeholder was
    // literally "2024 · 9 weeks" — a metadata string joined by a middle dot,
    // which is a template tell. Two values also mean an empty one can be dropped
    // without taking the other with it.
    key: 'year',
    label: 'Year',
    placeholder: 'e.g. 2025',
    type: 'input',
    required: false,
    step: 1,
    half: true,
  },
  {
    key: 'duration', // I18
    label: 'How long?',
    placeholder: 'e.g. 7 weeks',
    type: 'input',
    required: false,
    step: 1,
    half: true,
  },
  {
    // I4. Optional by the owner's decision. The spec lists the designer's role
    // among both Overview's and Credits' required content, so leaving it blank
    // costs the page real content — but it was always possible to leave blank,
    // since nothing here gates anything.
    key: 'role',
    label: 'What was your role?',
    placeholder: 'e.g. Product designer',
    type: 'input',
    required: false,
    step: 1,
  },
  {
    key: 'agency', // I53
    label: 'Was there an agency in between?',
    placeholder: 'e.g. Northside Studio',
    type: 'input',
    required: false,
    step: 1,
    collapsed: true,
  },

  // --- Step 2 — what you walked into --------------------------------------
  {
    // I7. The helper is the whole point of the question: people translate the
    // complaint into their own vocabulary before writing it down, and the gap
    // between what was reported and what was found is what the page is built on.
    key: 'reported_problem',
    label: 'What did the client say was wrong?',
    placeholder: 'e.g. The servers keep saying the system is slow.',
    helper: 'In their words, even the parts that turned out to be wrong.',
    type: 'textarea',
    required: true,
    rows: 3,
    step: 2,
  },
  {
    // I8 + I9. One answer carrying both, because the evidence is what cashes the
    // diagnosis out — an abstraction here is indistinguishable from a guess.
    key: 'diagnosis',
    label: 'What was actually going on?',
    placeholder:
      'e.g. Adding one item took three taps and a keyboard search, so servers had memorised the codes for the eight things people order most. On Friday nights they wrote tables on a paper pad and typed them in after the rush. You can see it on the order screen and the modifiers sheet.',
    type: 'textarea',
    required: true,
    rows: 4,
    step: 2,
  },
  {
    // I11. Without the helper this comes back as frustration, which never leaves
    // the symptom.
    key: 'cost_to_client',
    label: 'What was it costing them?',
    placeholder:
      "e.g. About nine orders a night went in from paper after the rush, so the kitchen saw a table's food twenty minutes after its drinks.",
    helper: 'Time, money or risk — not how it felt.',
    type: 'textarea',
    required: true,
    rows: 3,
    step: 2,
  },

  // --- Step 4 — how the work fit together ---------------------------------
  {
    // I13. The strongest seniority signal when it is real and the fastest tell
    // when it is not, so nothing may generate a value here. The helper is there
    // to make leaving it blank feel normal, which it is.
    key: 'approach_framework',
    label: 'Is there one idea behind all of them?',
    placeholder: 'e.g. Type less during the rush, sort it out after',
    helper: "Most projects don't have one.",
    type: 'input',
    required: false,
    step: 4,
    collapsed: true,
  },
  {
    // §9.5 "Where the work sat inside the product", and PRD §5.1. No I-number:
    // the manifest was written before the diagram had an input, and §9.5's row
    // is prose rather than a numbered one. Cited explicitly because until this
    // comment existed the field passed the citation test only because I13, on
    // the answer above it, happened to fall inside the window the test reads.
    //
    // The source for the Approach diagram. Visible rather than collapsed: behind
    // a disclosure link most people would never open it, and the diagram fires
    // on nothing without it.
    key: 'product_areas',
    label: 'What are the main parts of the product?',
    placeholder: 'e.g. Orders, Menu, Payments, Reports, Staff, Tables, Kitchen, Shifts',
    type: 'textarea',
    required: false,
    rows: 2,
    step: 4,
    branch: 'separate_parts',
  },
  {
    // §9.5 and PRD §5.3, the same standing as `product_areas` above and with
    // no I-number for the same reason.
    //
    // The other side of the fork, and the source for the page diagram. Visible
    // for the same reason as the answer above it.
    //
    // The helper is the whole question: left to themselves people list sections
    // in the order they think matter most, and a ranking is the one thing this
    // answer must not be. It is the only place that can be said.
    key: 'page_sections',
    label: 'What were the sections of the page, top to bottom?',
    placeholder:
      'e.g. Headline, Plan prices, Feature grid, FAQ, What it replaces, Migration help, Clinic quotes, Book a demo',
    helper: 'In the order they appear, not in order of importance.',
    type: 'textarea',
    required: false,
    rows: 2,
    step: 4,
    branch: 'single_page',
  },
  {
    // §9.5 and PRD §5.3's `finding`, which §4 turns into the caption.
    //
    // The finding. Asked rather than derived: a sentence composed from the
    // grouping would state the composition, which is the example the PRD's
    // caption rule names as the bad one, and composing it at all is inference.
    key: 'page_pattern',
    label: 'What did you notice about where they sat?',
    placeholder:
      'e.g. The two sections nobody asked for sat between the price and the migration answer',
    helper: 'One short sentence. A repeat or a gap — not how many there were.',
    type: 'input',
    required: false,
    step: 4,
    branch: 'single_page',
    maxChars: 120,
  },
  {
    // §9.5 and PRD §5.2, the same standing as the two answers above.
    //
    // "Start to finish" rather than "in order", because a flow has a direction
    // and the one wrong answer here is a list of screens that do not follow one
    // another. The helper names the test: somebody walks it.
    key: 'flow_steps',
    label: 'What were the steps, start to finish?',
    placeholder: 'e.g. Basket, Sign in, Delivery address, Delivery time, Payment, Confirm, Receipt',
    helper: 'The path someone actually walks, in the order they walk it.',
    type: 'textarea',
    required: false,
    rows: 2,
    step: 4,
    branch: 'one_flow',
  },
  {
    key: 'constraints', // I14 + I15
    label: 'What were you working around?',
    placeholder:
      "e.g. The kitchen display system was another vendor's, so nothing could change on that side.",
    type: 'textarea',
    required: false,
    rows: 3,
    step: 4,
    collapsed: true,
  },
  {
    key: 'authority_split', // I17
    label: 'Did someone else own part of the call?',
    placeholder:
      'e.g. I owned the order screen. The head chef had the final say on anything that changed what the kitchen sees.',
    type: 'textarea',
    required: false,
    rows: 2,
    step: 4,
    collapsed: true,
  },

  // --- Step 5 — where it landed -------------------------------------------
  {
    key: 'measure', // I41
    label: 'What did you measure?',
    placeholder: 'e.g. Time from a server taking an order to the kitchen screen showing it',
    type: 'input',
    required: false,
    step: 5,
    revealedBy: 'has_measurement',
  },
  {
    key: 'baseline_value', // I42
    label: 'Before',
    placeholder: 'e.g. 20 minutes',
    type: 'input',
    required: false,
    step: 5,
    half: true,
    revealedBy: 'has_measurement',
  },
  {
    key: 'baseline_period', // I42
    label: 'Over what period?',
    placeholder: 'e.g. March, four Fridays',
    type: 'input',
    required: false,
    step: 5,
    half: true,
    revealedBy: 'has_measurement',
  },
  {
    key: 'after_value', // I44. The delta is derived from these two, never asked.
    label: 'After',
    placeholder: 'e.g. 2 minutes',
    type: 'input',
    required: false,
    step: 5,
    half: true,
    revealedBy: 'has_measurement',
  },
  {
    key: 'after_period', // I44
    label: 'Over what period?',
    placeholder: 'e.g. June, four Fridays',
    type: 'input',
    required: false,
    step: 5,
    half: true,
    revealedBy: 'has_measurement',
  },
  {
    // I43. Without a source the number cannot be used at all, which is why it
    // sits inside the block rather than beside it.
    key: 'baseline_source',
    label: 'Where did the number come from?',
    placeholder: "e.g. The POS's own order timestamps, pulled by their ops lead",
    type: 'input',
    required: false,
    step: 5,
    revealedBy: 'has_measurement',
  },
  {
    key: 'attribution_limit', // I45
    label: 'What else changed around the same time?',
    placeholder: 'e.g. They also put a second till on the floor in May.',
    type: 'textarea',
    required: false,
    rows: 2,
    step: 5,
    revealedBy: 'has_measurement',
  },
  {
    key: 'team_change', // I39
    label: 'What changed in how the team works?',
    placeholder: 'e.g. The paper pads went in the bin in the first week. Nobody asked the servers to stop.',
    type: 'textarea',
    required: true,
    rows: 3,
    step: 5,
  },
  {
    // I36 (+ I37). The helper exists because the instinct is to paraphrase, and
    // a tidied-up quote is not a quote.
    key: 'client_response',
    label: 'What did the client say afterwards?',
    placeholder: '"We stopped hearing about the POS in the Monday meeting."',
    helper: 'Their words, not tidied up.',
    type: 'textarea',
    required: false,
    rows: 3,
    step: 5,
    collapsed: true,
  },
] as const

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export type ProjectTypeOption = {
  value: ProjectType
  label: string
  description: string
  /** Visible, unselectable, and labelled. See below. */
  comingSoon?: boolean
}

// Two cards, not three. `advisory` is still in the ProjectType union and still
// passes the CHECK constraint from migration 0003 — it is out of the SELECTOR,
// not out of the schema, so no existing row is orphaned.
//
// Build-from-nothing stays visible on purpose. Its spec does not exist yet, and
// hiding it would let someone pick "focused fix" for a project that is not one —
// which produces a page arguing from a prior state that never existed. Visible
// and refused is the honest state.
export const PROJECT_TYPES: readonly ProjectTypeOption[] = [
  {
    value: 'focused_fix',
    label: 'Focused fix',
    description: 'A product already existed. You repaired parts of it.',
  },
  {
    value: 'zero_to_one',
    label: 'Build from nothing',
    description: "You made something that didn't exist before.",
    comingSoon: true,
  },
] as const

/**
 * Tone presets.
 *
 * RE-ADDED BY THE OWNER, AND NON-FUNCTIONAL. The output specification fixes one
 * flat declarative register for every page, and no rule in it reads a tone — so
 * the selection is stored and never sent to the model. `createCaseStudy` writes
 * it to `case_studies.tone`, which is a column rather than a key inside
 * `intake`: the prompt renderer walks the intake, so keeping tone out of that
 * object is what makes "never sent" structural instead of a promise somebody has
 * to remember.
 *
 * This says nothing either way about the register-sample question the input
 * manifest leaves open, and no output rule is added on its account.
 *
 * Not labelled as non-functional in the UI — that is a deliberate choice, and
 * this comment is where it is recorded.
 */
export const TONES: ReadonlyArray<{ value: Tone; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'direct', label: 'Direct' },
  { value: 'confident', label: 'Confident' },
  { value: 'data_driven', label: 'Data-driven' },
  { value: 'warm', label: 'Warm' },
] as const

export const OUTCOME_OPTIONS: ReadonlyArray<{
  value: OutcomeStatus
  label: string
}> = [
  { value: 'shipped', label: 'Shipped' },
  { value: 'proof_of_concept', label: 'Proof of concept' },
  { value: 'not_launched', label: 'Not launched' },
  { value: 'handed_off', label: 'Handed off' },
] as const

// I12. Written as answers to the question rather than as categories, because
// that is how someone would say it out loud. "The client told me" is on the list
// because it is a real answer, not a failure.
export const PROVENANCE_OPTIONS: ReadonlyArray<{
  value: Provenance
  label: string
}> = [
  { value: 'audit', label: 'I went through the product' },
  { value: 'user_research', label: 'I talked to the people using it' },
  { value: 'analytics', label: 'The analytics' },
  { value: 'testing', label: 'Testing' },
  { value: 'client_told_me', label: 'The client told me' },
] as const

export const DEFAULT_PROJECT_TYPE: ProjectType = 'focused_fix'
export const DEFAULT_TONE: Tone = 'professional'

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------
//
// ONE constant for the cap, because uploads are no longer one step. They sit
// beside the problem in step 2 and beside each decision in step 3, and every one
// of those slots counts against the same total — a per-slot cap would let nine
// slots hold twelve files each.
//
// The bucket enforces size and MIME independently (migration 0002); this is the
// client half, and it is deliberately narrower. WEBP was accepted before and is
// not now: the assets here are screenshots, and two accepted formats is one
// fewer thing for the vision pass to choke on.
export const MAX_ATTACHMENTS = 12
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const ACCEPTED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png'] as const
export const ACCEPTED_ATTACHMENT_HINT = 'JPG, PNG'

// ---------------------------------------------------------------------------

/** Every field on a step, revealed or not, collapsed or not. */
export function fieldsForStep(step: FieldStep): IntakeField[] {
  return INTAKE_FIELDS.filter((f) => f.step === step)
}

/**
 * Fields whose toggle is on, or which have no toggle.
 *
 * Reveal only — a collapsed field is still visible to this, because the review
 * screen has to show every answer the person gave regardless of which
 * disclosure it was typed into.
 */
export function visibleFields(
  fields: readonly IntakeField[],
  toggles: Partial<Record<ToggleKey, boolean>>
): IntakeField[] {
  return fields.filter((f) => !f.revealedBy || toggles[f.revealedBy] === true)
}

/** What a step shows on arrival, and what waits behind its disclosure link. */
export function partitionByDisclosure(fields: readonly IntakeField[]): {
  open: IntakeField[]
  collapsed: IntakeField[]
} {
  return {
    open: fields.filter((f) => !f.collapsed),
    collapsed: fields.filter((f) => f.collapsed),
  }
}

/**
 * Whether any of these fields has an answer.
 *
 * What a disclosure asks before deciding to start open: a link that is closed
 * over a filled-in answer reads as a lost answer.
 */
export function anyAnswered(
  text: Partial<Record<TextKey, string>>,
  fields: readonly IntakeField[]
): boolean {
  return fields.some((f) => (text[f.key] ?? '').trim() !== '')
}

/**
 * Fields on this side of step 4's fork, plus everything that has no side.
 *
 * Derived rather than hand-listed, the `MEASUREMENT_KEYS` precedent: a field
 * added to a branch cannot then be missed by the thing that renders it, and
 * there is no second list to keep in step. It is also the ONLY filter — a step
 * that both ran this and hand-named its branch keys would render one of them
 * twice, which reads as the input having broken.
 */
export function fieldsForShape(shape: WorkShape | null): IntakeField[] {
  // `null` is the fork unanswered, and then NO branch field belongs: a question
  // nobody has been asked yet is not a question somebody left blank.
  return INTAKE_FIELDS.filter((f) => !f.branch || f.branch === shape)
}

export function fieldsRevealedBy(toggle: ToggleKey): IntakeField[] {
  return INTAKE_FIELDS.filter((f) => f.revealedBy === toggle)
}

/**
 * The seven components the metric branch requires.
 *
 * Derived from the registry rather than listed again, so a field added to the
 * metric block cannot be missed by the branch gate that reads it — which is the
 * class of drift that produced the digit-detection bug in the first place.
 */
export const MEASUREMENT_KEYS: readonly TextKey[] = fieldsRevealedBy('has_measurement').map(
  (f) => f.key
)

/** DOM id for a field, shared by the input and the review screen's jump links. */
export function fieldElementId(key: TextKey): string {
  return `intake-${key}`
}
