// The intake form: five steps and a review screen, plus two selectors.
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
// Only steps 1, 2 and 5 live here. Step 3 (the repeated decision unit) and
// step 4 (one block per uploaded screen) are arrays of objects, which a flat
// key/label registry cannot express — they have their own components and their
// copy lives in lib/wizard-steps.ts.

import type { Intake, OutcomeStatus, ProjectType, Tone } from '@/types/database'

/** Intake keys that are a single string the user types. */
export type TextKey = Exclude<
  keyof Intake,
  'decisions' | 'image_notes' | 'outcome_status'
>

/** Steps a registry-driven field can belong to. */
export type FieldStep = 1 | 2 | 5

export type IntakeField = {
  key: TextKey
  label: string
  placeholder: string
  helper?: string
  type: 'input' | 'textarea'
  /**
   * Drives the "optional" tag and the review screen's neutral marker — and
   * nothing else. It has not gated navigation since the wizard stopped
   * blocking "next" (check-revision-prompt.md § Phase 2). Marking a field
   * required is a statement about what the case study needs, not a lock.
   */
  required: boolean
  rows?: number
  step: FieldStep
}

export const INTAKE_FIELDS: readonly IntakeField[] = [
  // --- Step 1 — setup -----------------------------------------------------
  {
    key: 'title',
    label: 'What did you work on?',
    placeholder: 'e.g. Rebuilding shift handover for a hospital ward',
    helper: 'Short. One sentence, no setup.',
    type: 'input',
    required: true,
    step: 1,
  },
  {
    key: 'client_type',
    label: 'Who was it for?',
    placeholder: 'e.g. A regional hospital group',
    // This one is printed on the page, in the metadata grid under the title.
    helper: 'Their industry + rough size. No names needed — this one shows.',
    type: 'input',
    required: true,
    step: 1,
  },
  {
    key: 'year_duration',
    label: 'Year & duration',
    placeholder: 'e.g. 2024 · 9 weeks',
    helper: 'Both in one line. Rough is fine.',
    type: 'input',
    required: false,
    step: 1,
  },
  {
    key: 'role',
    label: 'Your role',
    placeholder: 'e.g. Product Designer',
    helper: 'What you were called on this project.',
    type: 'input',
    required: false,
    step: 1,
  },
  {
    key: 'team_credit',
    label: 'Team / credit',
    placeholder: 'e.g. One engineer, one clinical lead',
    helper: 'Who else was on it. Naming them reads as confidence, not dilution.',
    type: 'input',
    required: false,
    step: 1,
  },
  {
    // The only field that is about HOW the writing should sound rather than
    // what happened. Five tone presets are a guess at a register; this is the
    // writer's actual register, which is the only thing that can make the
    // output sound like them. The label is written to tell the model that too
    // — labels have been rendered into the prompt before, so this one has a
    // job beyond the form.
    key: 'voice_sample',
    label: 'In your own words, how would you explain this project out loud?',
    placeholder:
      "e.g. Honestly the screen wasn't the problem, the handover was. Nobody trusted it to still be there, so they photographed it. We fixed the trust part first and the rest got easier.",
    helper:
      "Optional — but it's what makes the writing sound like you instead of like a template. Three or four sentences, however you'd actually say it.",
    type: 'textarea',
    required: false,
    rows: 3,
    step: 1,
  },

  // --- Step 2 — the problem -----------------------------------------------
  {
    key: 'problem',
    label: 'What was wrong before?',
    placeholder:
      'e.g. The handover screen cleared itself sometimes, so nurses photographed it before every shift change.',
    helper: 'A specific example or number beats a vague description.',
    type: 'textarea',
    required: true,
    rows: 4,
    step: 2,
  },
  {
    key: 'why_it_mattered',
    label: 'Why did it matter?',
    placeholder:
      'e.g. Handover ran 14 minutes against a 6-minute budget, and the photo on someone’s phone had become the real record.',
    helper: 'What was at risk if it stayed broken.',
    type: 'textarea',
    required: true,
    rows: 3,
    step: 2,
  },
  {
    key: 'constraints',
    label: 'What constrained you?',
    placeholder:
      'e.g. The patient record system was off limits, so everything had to work as a layer on top of it.',
    helper:
      "A deadline, a system you couldn't touch, data you didn't have. Anything that changed the shape of the solution.",
    type: 'textarea',
    required: true,
    rows: 3,
    step: 2,
  },

  // --- Step 5 — where it landed -------------------------------------------
  {
    key: 'metrics',
    label: 'Numbers that moved?',
    placeholder: 'e.g. Handover reading time fell from 14 minutes to 7.',
    helper: 'Real numbers only. Blank is better than a guess.',
    type: 'textarea',
    required: false,
    rows: 3,
    step: 5,
  },
  {
    key: 'what_changed',
    label: 'What changed for the team or client?',
    placeholder:
      'e.g. The photographs stopped within two weeks. Nobody was asked to stop.',
    helper: 'What people did differently afterwards.',
    type: 'textarea',
    required: false,
    rows: 3,
    step: 5,
  },
  {
    key: 'do_differently',
    label: 'What would you do differently?',
    placeholder:
      'e.g. I would have sat through a night handover earlier — the day shift told a much tidier story than the ward actually had.',
    helper: 'The part a reviewer trusts most, because nobody fakes it.',
    type: 'textarea',
    required: false,
    rows: 3,
    step: 5,
  },
] as const

export const PROJECT_TYPES: ReadonlyArray<{
  value: ProjectType
  label: string
  description: string
}> = [
  {
    value: 'focused_fix',
    label: 'Focused fix',
    description: 'You improved one specific thing that was going wrong.',
  },
  {
    value: 'zero_to_one',
    label: 'Built from nothing',
    description: "You made something that didn't exist before.",
  },
  {
    value: 'advisory',
    label: 'Strategy & advisory',
    description: 'The value was in the thinking, not only the deliverable.',
  },
] as const

// Still five. The spec collapses these to Direct / Warm / Analytical, but
// `analytical` is not in the CHECK constraint on case_studies.tone (migration
// 0003), so the collapse needs a migration and was deliberately deferred out
// of the wizard restructure. See AGENTS.md § Tone + project type.
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

export const DEFAULT_PROJECT_TYPE: ProjectType = 'focused_fix'
export const DEFAULT_TONE: Tone = 'professional'

export function fieldsForStep(step: FieldStep): IntakeField[] {
  return INTAKE_FIELDS.filter((f) => f.step === step)
}

/** DOM id for a field, shared by the input and the review screen's jump links. */
export function fieldElementId(key: TextKey): string {
  return `intake-${key}`
}
