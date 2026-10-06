// The hospital-handover project, filled in completely, so that testing the
// Focused Fix path never means typing it again.
//
// One definition serves two uses:
//
//   - loaded INTO the wizard, at /studio?fixture=handover, to click through and
//     judge the form with real answers in it;
//   - run through generation directly, by `npm run fixture`, with no browser.
//
// Built from a WizardState and pushed through the same `buildIntake` the wizard
// uses, rather than written out as an Intake literal. That is the whole point of
// doing it this way: the fixture cannot drift from the field set. Change the
// registry and `tsc` points at this file; there is no second shape to keep in
// step by hand.
//
// EVERY FACT HERE IS INVENTED, deliberately and only here. It is test input —
// user input, in the product's terms — and nothing in it is a claim about a real
// client. The client is anonymised (`client_may_be_named` off) so the run also
// exercises the rule that an unnamed client is never named.

import { buildIntake, emptyWizardState, type WizardState } from '@/lib/wizard-steps'
import type { Decision, Intake, ProjectType, Tieback, Tone } from '@/types/database'

// Fixed ids, not randomUUID(): a fixture that changes shape on every load cannot
// be diffed against the run before it, and diffing two runs is what it is for.
const FREEZE = 'fixture-dec-freeze'
const SORT = 'fixture-dec-sort'
const ACK = 'fixture-dec-acknowledge'

const decisions: Decision[] = [
  {
    id: FREEZE,
    decided: 'Freeze the note at shift change',
    prior_behaviour: 'The note cleared on session timeout, with no warning',
    consequence: 'Nobody photographs the screen before handover any more',
    why: 'Nurses photographed the screen before every handover, because they had learned it might not be there afterwards.',
    rejected:
      'An autosave indicator. A reassuring spinner does not earn trust back once it is gone.',
    client_request: '"Can you make the handover screen less cluttered?"',
  },
  {
    id: SORT,
    decided: 'Sort by escalation, not by room',
    prior_behaviour: 'The list was ordered by room number',
    consequence: 'Deteriorating patients are read first, without hunting for them',
    why: 'Deteriorating patients were scattered through a list ordered by where their bed happened to be.',
    rejected: 'Colour-coding the rows. The eye still has to scan the whole list to find them.',
    relations: {
      breaks_pattern: 'Every other view on the ward lists patients by room',
    },
  },
  {
    id: ACK,
    decided: 'Hold escalated notes until someone acknowledges them',
    // A new thing: there is no before, so this is the walkthrough (I30) and the
    // block is the ordered-mechanic shape rather than a prior/new comparison.
    no_prior_version: true,
    prior_behaviour:
      'The outgoing nurse marks a patient escalated. The note stays pinned to the top of the incoming nurse’s list. It holds until the incoming nurse taps Acknowledge.',
    consequence:
      'The incoming nurse cannot miss an escalation, and the outgoing nurse no longer has to say it out loud twice.',
    why: 'Escalations were the one thing handed over verbally, and the verbal version was the one that got skipped when a shift ran late.',
    rejected: 'A push notification. Nurses already silence them on the ward.',
    relations: { depends_on: FREEZE },
  },
]

function baseState(): WizardState {
  const state = emptyWizardState()
  state.text = {
    title: 'Rebuilding shift handover for a hospital ward',
    product_and_users:
      'A ward management system. Charge nurses and bedside nurses use it across three shifts a day.',
    client_type: 'A regional hospital group',
    year: '2024',
    duration: '9 weeks',
    role: 'Product designer',

    reported_problem: 'The handover screen looks cluttered and nurses find it confusing.',
    diagnosis:
      'The screen cleared itself on session timeout, so nurses photographed the Ward Board before every handover. The Patient Notes column reset with it, and escalated patients sat wherever their bed happened to be in the list. Escalations were passed on out loud, and skipped whenever a shift ran late.',
    cost_to_client:
      'Handover ran fourteen minutes against a six-minute budget, three times a day, across eleven wards.',

    product_areas:
      'Ward Board, Patient Notes, Handover list, Escalations, Medication chart, Obs chart, Admissions, Discharge',

    constraints:
      'The patient record system was off limits, so everything had to work as a layer on top of it.',
    authority_split:
      'I owned the interface. The clinical lead had the final call on anything touching medication fields.',

    team_change: 'The photographs stopped within two weeks. Nobody was asked to stop.',
    client_response: '"We stopped talking about the handover screen in the ops meeting."',
  }
  state.toggles = { reported_verbatim: true }
  state.collaborators = [{ name: 'Priya Raman', role: 'Clinical lead' }]
  state.provenance = 'audit'
  state.outcome = 'shipped'
  // Four of the eight parts were worked on; only Escalations had nothing like it
  // already, which is decision 3's no_prior_version said as a product fact.
  state.areasWorked = ['Ward Board', 'Patient Notes', 'Handover list', 'Escalations']
  state.areasFromScratch = ['Escalations']
  state.decisions = decisions.map((d) => ({ ...d }))
  return state
}

/** The same project with a complete measured block, for the metric branch. */
function measuredState(): WizardState {
  const state = baseState()
  state.toggles = { ...state.toggles, has_measurement: true }
  state.text = {
    ...state.text,
    measure: 'Time from handover start to first patient reviewed',
    baseline_value: '14 minutes',
    baseline_period: 'March, four weeks',
    after_value: '7 minutes',
    after_period: 'June, four weeks',
    baseline_source: "The ward's own shift log, exported by their ops team",
    attribution_limit: 'They also added two float nurses to the night rota in April.',
  }
  return state
}

// Hand-written until the review screen infers them. Each is a pain point named in
// the Problem answer above, in its own words, which is what the tie-back rule
// needs to be able to point at.
const tiebacks: Tieback[] = [
  { decisionId: FREEZE, painPoint: 'nurses photographed the screen because it cleared itself' },
  { decisionId: SORT, painPoint: 'escalated patients sat wherever their bed happened to be' },
  { decisionId: ACK, painPoint: 'escalations were passed on out loud and skipped when a shift ran late' },
]

export type FixtureName = 'handover' | 'handover-measured'

export type Fixture = {
  name: FixtureName
  description: string
  state: WizardState
  projectType: ProjectType
  tone: Tone
  tiebacks: Tieback[]
}

const BUILDERS: Record<FixtureName, () => Omit<Fixture, 'name'>> = {
  handover: () => ({
    description: 'Contribution branch: no measured number. The reference project.',
    state: baseState(),
    projectType: 'focused_fix',
    tone: 'professional',
    tiebacks,
  }),
  'handover-measured': () => ({
    description:
      'Metric branch: a complete measured block. For the attribution-limit ablation.',
    state: measuredState(),
    projectType: 'focused_fix',
    tone: 'professional',
    tiebacks,
  }),
}

export const FIXTURE_NAMES = Object.keys(BUILDERS) as FixtureName[]

export function isFixtureName(value: unknown): value is FixtureName {
  return typeof value === 'string' && (FIXTURE_NAMES as string[]).includes(value)
}

/** A fresh copy every call, so one run mutating its state cannot leak into the next. */
export function getFixture(name: FixtureName): Fixture {
  return { name, ...BUILDERS[name]() }
}

/** The intake exactly as the wizard would submit it, tie-backs included. */
export function fixtureIntake(name: FixtureName): Intake {
  const f = getFixture(name)
  return { ...buildIntake(f.state), tiebacks: f.tiebacks }
}
