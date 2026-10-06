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

// ---------------------------------------------------------------------------
// A page project
// ---------------------------------------------------------------------------
//
// The other side of step 4's fork, and the only fixture that reaches the
// `order-overlay` diagram. It exists because the hospital project can never
// exercise that path: a page project answers the sections question and leaves
// the parts question unasked, which is what `buildIntake` writes and what
// `buildSetException` then finds nothing in.
//
// Every fact here is invented, on the same terms as the project above.

const PRICE_FIRST = 'fixture-dec-price-first'
const REPLACES = 'fixture-dec-replaces'
const MIGRATION = 'fixture-dec-migration'

const landingDecisions: Decision[] = [
  {
    id: PRICE_FIRST,
    decided: 'Put the plan prices above the feature grid',
    prior_behaviour: 'The price sat below two screens of feature copy',
    consequence: 'A manager sees what it costs without scrolling past anything',
    why: 'Every manager we sat with scrolled straight past the features looking for a number, and two of them left before they found it.',
    rejected:
      'A price link in the nav. It answers the question by sending someone somewhere else.',
    client_request: '"The pricing page is not converting and we think it is too long."',
  },
  {
    id: REPLACES,
    decided: 'Name the records system it replaces, on the page',
    prior_behaviour: 'Nothing on the site said what it replaced',
    consequence: 'Managers stop asking whether they would be running two systems',
    why: 'Managers were already running a records system and assumed this sat on top of it, so the question was always whether they would be paying for both.',
    rejected:
      'A comparison table. It invites a feature argument, and the question was not about features.',
    relations: {
      breaks_pattern: 'Every other page on the site avoids naming a competitor',
    },
  },
  {
    id: MIGRATION,
    decided: 'Answer the migration question in its own section, not in the FAQ',
    prior_behaviour: 'Who does the data migration was a footnote under the FAQ',
    consequence: 'Nobody has to open an accordion to find out who moves their records',
    why: 'It was the third question on every call and the last thing on the page, and a clinic that has typed in six years of records does not treat it as a detail.',
    rejected:
      'Promoting the FAQ entry to the top of the accordion. It is still a question someone has to go looking for.',
    relations: { depends_on: PRICE_FIRST },
  },
]

function landingState(): WizardState {
  const state = emptyWizardState()
  state.text = {
    title: 'Rewriting the pricing page for a veterinary practice tool',
    product_and_users:
      'Practice-management software for small animal clinics. Practice managers compare it against two competitors before they book a demo.',
    client_type: 'A veterinary software company',
    year: '2025',
    duration: '5 weeks',
    role: 'Product designer',

    reported_problem: 'The pricing page is not converting and we think it is too long.',
    diagnosis:
      'Managers arrived with three questions: what it costs per vet, whether it replaces the records system they already run, and who does the data migration. The page answered the last one in a footnote under the FAQ, and two blocks of feature copy sat between the price and the first clinic that had migrated.',
    cost_to_client:
      'Sales answered the same three questions on every demo call, about eleven calls a week.',

    page_sections:
      'Headline, Plan prices, Feature grid, FAQ, What it replaces, Migration help, Clinic quotes, Book a demo',
    page_pattern:
      'the two sections nobody asked for sat between the price and the migration answer',

    constraints:
      'The marketing site ran on a template the team would not change, so every section had to be one of its existing blocks.',

    team_change:
      'The three questions stopped coming up on calls. Sales sends the page now instead of talking through it.',
    client_response: '"We send the pricing page now instead of walking people through it."',
  }
  state.shape = 'single_page'
  // Two sections are left unmarked on purpose. That gap is half of what the
  // overlay can show, and the finding above is a claim about where it sits.
  state.sectionFates = {
    'Plan prices': 'kept',
    'Feature grid': 'cut',
    FAQ: 'cut',
    'What it replaces': 'added',
    'Migration help': 'added',
    'Clinic quotes': 'kept',
  }
  state.collaborators = [{ name: 'Marco Ilves', role: 'Sales lead' }]
  state.provenance = 'user_research'
  state.outcome = 'shipped'
  state.decisions = landingDecisions.map((d) => ({ ...d }))
  return state
}

const landingTiebacks: Tieback[] = [
  { decisionId: PRICE_FIRST, painPoint: 'two blocks of feature copy sat between the price and the clinics' },
  { decisionId: REPLACES, painPoint: 'managers did not know whether it replaced the records system they ran' },
  { decisionId: MIGRATION, painPoint: 'who does the data migration was answered in a footnote under the FAQ' },
]

export type FixtureName = 'handover' | 'handover-measured' | 'landing-rewrite'

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
  // `focused_fix` because the three project types are a CHECK constraint and
  // none of them is a page. The fork in step 4 is what makes this a page
  // project, not the type the client bought.
  'landing-rewrite': () => ({
    description: 'The page branch of step 4: the only fixture that reaches order-overlay.',
    state: landingState(),
    projectType: 'focused_fix',
    tone: 'professional',
    tiebacks: landingTiebacks,
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
