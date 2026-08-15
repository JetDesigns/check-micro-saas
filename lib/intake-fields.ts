// The intake form: two-step card, eight fields, plus two selectors.
//
// Framing note: every label asks about the client's business, not about the
// designer's craft. That is the whole difference between this and a portfolio
// tool — the reader of the output is the next paying client, so the input has
// to be gathered in their terms.
//
// `key` matches a property on the `Intake` type and is stored inside
// `case_studies.intake`. Renaming a key orphans existing rows.
//
// `step` splits the form so the user isn't scrolling a wall of textareas.
// Step 1 = attachments + choices + two short inputs (fast). Step 2 = the
// long-form story. See AGENTS.md § Locked product decisions.

import type { Intake, ProjectType, Tone } from '@/types/database'

export type IntakeField = {
  key: keyof Intake
  label: string
  placeholder: string
  helper?: string
  type: 'input' | 'textarea'
  required: boolean
  rows?: number
  step: 1 | 2
}

export const INTAKE_FIELDS: readonly IntakeField[] = [
  {
    key: 'title',
    label: 'What did you work on?',
    placeholder: 'e.g. Pricing page rewrite for a niche SaaS',
    helper: 'Short. One sentence, no setup.',
    type: 'input',
    required: true,
    step: 1,
  },
  {
    key: 'client_type',
    label: 'Who was it for?',
    placeholder: 'e.g. 30-person B2B software company',
    helper: 'Their industry + rough size. No names needed.',
    type: 'input',
    required: true,
    step: 1,
  },
  {
    key: 'problem',
    label: 'What was wrong before?',
    placeholder:
      'e.g. Their sales team rewrote the same proposal 3–4 times a week, losing about 6 hours each time to formatting.',
    helper: 'A specific example or number beats a vague description.',
    type: 'textarea',
    required: true,
    rows: 4,
    step: 2,
  },
  {
    key: 'solution',
    label: 'What did you change?',
    placeholder:
      'e.g. A template-driven builder on top of the catalog they already had. A full CRM rebuild was rejected — they needed something live in 4 weeks.',
    helper: 'The route matters as much as the deliverable.',
    type: 'textarea',
    required: true,
    rows: 4,
    step: 2,
  },
  {
    key: 'business_impact',
    label: 'What was it costing them?',
    placeholder:
      'e.g. Deals were stalling in the proposal stage, and two worth around $80k had gone cold waiting.',
    helper: 'Cost of leaving it broken. Deadline. Business pressure.',
    type: 'textarea',
    required: true,
    rows: 3,
    step: 2,
  },
  {
    key: 'metrics',
    label: "Numbers that moved (or didn't)?",
    placeholder:
      'e.g. Proposal turnaround dropped from ~6 hours to under 20 minutes.',
    helper: 'Optional. Real numbers only — no guessing.',
    type: 'textarea',
    required: false,
    rows: 3,
    step: 2,
  },
  {
    key: 'timeline_investment',
    label: 'Rough scope — how long, how much?',
    placeholder: 'e.g. 5 weeks, $18k fixed fee',
    helper: 'Optional. Ballpark is fine.',
    type: 'input',
    required: false,
    step: 2,
  },
  {
    key: 'client_reaction',
    label: 'Anything they told you afterward?',
    placeholder:
      'e.g. Their head of sales said the team stopped avoiding warm leads.',
    helper: 'Optional. Verbatim quote beats paraphrase.',
    type: 'textarea',
    required: false,
    rows: 3,
    step: 2,
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
    description: 'You improved one specific thing that was costing them.',
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

export const TONES: ReadonlyArray<{ value: Tone; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'direct', label: 'Direct' },
  { value: 'confident', label: 'Confident' },
  { value: 'data_driven', label: 'Data-driven' },
  { value: 'warm', label: 'Warm' },
] as const

export const DEFAULT_PROJECT_TYPE: ProjectType = 'focused_fix'
export const DEFAULT_TONE: Tone = 'professional'

export const STEP_1_FIELDS = INTAKE_FIELDS.filter((f) => f.step === 1)
export const STEP_2_FIELDS = INTAKE_FIELDS.filter((f) => f.step === 2)

/** Field keys that must be filled before the form can be submitted. */
export const REQUIRED_KEYS = INTAKE_FIELDS.filter((f) => f.required).map(
  (f) => f.key
)

/** Required field keys per step — used to gate Next / Submit. */
export const REQUIRED_KEYS_STEP_1 = STEP_1_FIELDS.filter((f) => f.required).map(
  (f) => f.key
)
export const REQUIRED_KEYS_STEP_2 = STEP_2_FIELDS.filter((f) => f.required).map(
  (f) => f.key
)
