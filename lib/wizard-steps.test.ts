import { describe, expect, it } from 'vitest'
import {
  DECISIONS_MAX,
  DECISIONS_MIN,
  COLLABORATOR_FIELDS,
  DECISION_FIELDS,
  DECISION_TOGGLE,
  DISCLOSURE,
  AREA_CHIPS,
  DISCOURAGING_WORDS,
  RELATION_CHIPS,
  SCREEN_FIELDS,
  FLOW_CHIPS,
  SECTION_CHIPS,
  SECTION_FATES,
  SLOT_ENTRY_LABELS,
  SLOT_LABELS,
  TOGGLE_COPY,
  WIZARD_COPY,
  WIZARD_STEPS,
  blankInputs,
  buildIntake,
  approachHint,
  parseAreas,
  addChip,
  chipsFromText,
  createChip,
  moveChip,
  partsDiagramState,
  removeChip,
  toggleChipDecision,
  toggleChipWorked,
  unattachedDecisions,
  assignFate,
  buildFlowSteps,
  buildPageSections,
  intakeShape,
  reconcileFates,
  shownShape,
  toggleName,
  buildReview,
  compileBlockers,
  reviewNotes,
  diagramNote,
  createDecision,
  emptyWizardState,
  isThin,
  nextStep,
  prevStep,
  reviewIntro,
  stepOrder,
  stepPosition,
  type Attachment,
  type WizardState,
} from './wizard-steps'
import {
  INTAKE_FIELDS,
  MEASUREMENT_KEYS,
  PROJECT_TYPES,
  WORK_SHAPE_OPTIONS,
  type TextKey,
  type WorkShape,
} from './intake-fields'
import { SECTION_MIN, PART_MAX, PART_MIN, STEP_MIN } from './approach-diagram'
import { SPINE_MAX, SPINE_MIN } from './case-study-blocks'
import type { ImageSlot, SectionFate } from '@/types/database'

// What this file guards, in order of how expensive the mistake would be:
//
// 1. buildIntake is the only writer of `case_studies.intake`, and what it
//    writes is what the prompt is built from. An answer stored as '' instead
//    of omitted becomes a blank line in the prompt, and a blank line in a
//    prompt is an invitation to fill it in — which is the one failure this
//    product cannot survive (§10.1).
// 2. Screens carry their slot and their decision. Position is the join key to
//    case_study_attachments, so an off-by-one here puts a caption under the
//    wrong image with nothing to detect it.
// 3. A revealed field whose toggle is off must not reach the row. The metric
//    branch reads seven of those, and a stale value left behind by a toggle
//    that was switched back off would route the page into a branch on evidence
//    the user withdrew.
// 4. The spec forbids telling anyone their answer is deficient. That is a copy
//    rule, which is exactly the kind of rule that rots, so it is asserted.

function attachment(
  id: string,
  slot: ImageSlot,
  notice = '',
  decisionId?: string
): Attachment {
  return {
    id,
    // Nothing in these tests reads the bytes; the File is here because the
    // upload path needs one and the type says so.
    file: new File([''], `${id}.png`, { type: 'image/png' }),
    slot,
    ...(decisionId ? { decisionId } : {}),
    notice,
  }
}

function validState(): WizardState {
  const state = emptyWizardState()
  state.text = {
    title: 'Rebuilding shift handover for a hospital ward',
    product_and_users:
      'A ward management system. Charge nurses and bedside nurses use it across three shifts a day.',
    client_type: 'A regional hospital group',
    reported_problem:
      'The handover screen looks cluttered and nurses find it confusing.',
  }
  state.decisions[0].decided = 'Freeze the note at shift change'
  state.decisions[0].why = 'Nurses photographed the screen because it might clear'
  state.decisions[0].rejected = 'An autosave indicator'
  state.decisions[1].decided = 'Sort by escalation, not by room'
  state.decisions[1].why = 'Deteriorating patients were scattered through the list'
  state.outcome = 'shipped'
  return state
}

describe('step order', () => {
  // The old step 4 asked about uploaded screens and dropped out of the walk
  // when there were none, in both directions. Uploads sit beside what they
  // show now, so there is no conditional step left — and the tests that
  // guarded the skip are gone with it rather than rewritten to assert nothing.
  it('walks all five steps and then the review screen, every time', () => {
    expect(stepOrder()).toEqual([1, 2, 3, 4, 5, 'review'])
  })

  it('stays put at both ends rather than falling off the array', () => {
    expect(prevStep(1)).toBe(1)
    expect(nextStep('review')).toBe('review')
  })

  it('counts five steps, so the indicator never shows a gap', () => {
    expect(stepPosition(1)).toEqual({ index: 0, total: 5 })
    expect(stepPosition(5)).toEqual({ index: 4, total: 5 })
  })
})

describe('buildIntake', () => {
  it('stamps the schema version, because the compile route routes on it', () => {
    expect(buildIntake(emptyWizardState()).schema_version).toBe(2)
  })

  it('omits empty text fields instead of storing empty strings, so absent stays distinguishable from blank', () => {
    const intake = buildIntake(emptyWizardState())
    expect('title' in intake).toBe(false)
    expect('diagnosis' in intake).toBe(false)
  })

  it('trims what it keeps, so a stray newline never becomes part of the answer', () => {
    const state = emptyWizardState()
    state.text.title = '  Rebuilding shift handover\n'
    expect(buildIntake(state).title).toBe('Rebuilding shift handover')
  })

  it('stores a toggle only when it is on, never as an explicit false', () => {
    const state = emptyWizardState()
    expect('client_may_be_named' in buildIntake(state)).toBe(false)
    state.toggles.client_may_be_named = true
    expect(buildIntake(state).client_may_be_named).toBe(true)
    state.toggles.client_may_be_named = false
    expect('client_may_be_named' in buildIntake(state)).toBe(false)
  })

  // The failure this prevents is quiet and expensive: someone fills the metric
  // block, thinks better of it, switches the toggle off — and the row still
  // carries a baseline the form is no longer showing them. The branch gate
  // reads exactly these fields.
  it('drops a revealed answer when its toggle is off, so a withdrawn answer is really withdrawn', () => {
    const state = emptyWizardState()
    state.toggles.has_measurement = true
    for (const key of MEASUREMENT_KEYS) state.text[key] = 'something'
    expect(buildIntake(state).measure).toBe('something')

    state.toggles.has_measurement = false
    const withdrawn = buildIntake(state)
    for (const key of MEASUREMENT_KEYS) expect(key in withdrawn).toBe(false)
  })

  it('keeps the client name only while naming is permitted', () => {
    const state = emptyWizardState()
    state.text.client_name = 'Northvale Health'
    expect('client_name' in buildIntake(state)).toBe(false)
    state.toggles.client_may_be_named = true
    expect(buildIntake(state).client_name).toBe('Northvale Health')
  })

  it('drops a decision card the user never typed into, so two visible cards do not mean two hollow fix blocks', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    expect(buildIntake(state).decisions).toHaveLength(1)
  })

  it('counts prior behaviour on its own as content, since a card can be started anywhere', () => {
    const state = emptyWizardState()
    state.decisions[0].prior_behaviour = 'The note cleared on session timeout'
    expect(buildIntake(state).decisions).toHaveLength(1)
  })

  // Two fields, not one. Merging them would repeat the fusion that made the
  // old `problem` field useless, and the half that goes missing is §6.1's
  // move 4 — the difference between a case study and a changelog.
  it('carries prior behaviour and consequence separately', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    state.decisions[0].prior_behaviour = 'The note cleared on session timeout'
    state.decisions[0].consequence = 'Nobody photographs the screen any more'
    const [d] = buildIntake(state).decisions
    expect(d.prior_behaviour).toBe('The note cleared on session timeout')
    expect(d.consequence).toBe('Nobody photographs the screen any more')
  })

  it('leaves `rejected` off entirely when nothing was rejected, rather than writing an empty one', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    const [d] = buildIntake(state).decisions
    expect('rejected' in d).toBe(false)
  })

  it('carries the decision id through untouched, because it is what ties a fix block to its tie-back', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    expect(buildIntake(state).decisions[0].id).toBe(state.decisions[0].id)
  })

  it('writes no relations object when no chip was picked, since none of them is the honest default', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    expect('relations' in buildIntake(state).decisions[0]).toBe(false)
  })

  it('keeps the three relation chips independent, because a fix can be all three at once', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    state.decisions[1].decided = 'Sort by escalation, not by room'
    state.decisions[0].relations = {
      breaks_pattern: 'Everything else opens in place',
      repeated_treatment: true,
      depends_on: state.decisions[1].id,
    }
    const [d] = buildIntake(state).decisions
    expect(d.relations).toEqual({
      breaks_pattern: 'Everything else opens in place',
      repeated_treatment: true,
      depends_on: state.decisions[1].id,
    })
  })

  it('numbers screens by final position, so removing one does not shift the notes off the others', () => {
    const state = validState()
    const keep = state.decisions[0].id
    state.attachments = [
      attachment('a', 'problem', 'The column is empty after the reset'),
      attachment('b', 'before', 'The old note', keep),
      attachment('c', 'after', 'The frozen note', keep),
    ]
    state.attachments = state.attachments.filter((a) => a.id !== 'b')

    expect(buildIntake(state).image_notes).toEqual([
      { orderIndex: 0, slot: 'problem', notice: 'The column is empty after the reset' },
      { orderIndex: 1, slot: 'after', decisionId: keep, notice: 'The frozen note' },
    ])
  })

  it('writes a screen with no note, because the file still has to be placed', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem')]
    expect(buildIntake(state).image_notes).toEqual([{ orderIndex: 0, slot: 'problem' }])
  })

  // A problem screen belongs to no decision — there are none at that point in
  // the page — so there is no id to carry, and inventing one would give the
  // caption a choice to point at that was never made.
  it('leaves a problem screen unlinked to any decision', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem', 'The empty column')]
    expect('decisionId' in buildIntake(state).image_notes[0]).toBe(false)
  })

  it('drops a screen link whose decision was deleted, rather than pointing at nothing', () => {
    const state = validState()
    state.attachments = [attachment('a', 'after', 'The frozen note', 'gone')]
    const [note] = buildIntake(state).image_notes
    expect(note.slot).toBe('after')
    expect('decisionId' in note).toBe(false)
  })

  it('records the outcome only once it is picked, since there is no sensible default for "did it ship"', () => {
    const state = emptyWizardState()
    expect('outcome_status' in buildIntake(state)).toBe(false)
    state.outcome = 'handed_off'
    expect(buildIntake(state).outcome_status).toBe('handed_off')
  })

  it('keeps a collaborator with a name but no role, because a half-filled row is still a real person', () => {
    const state = emptyWizardState()
    state.collaborators = [
      { name: 'Priya Raman', role: '' },
      { name: '', role: '' },
    ]
    expect(buildIntake(state).collaborators).toEqual([{ name: 'Priya Raman', role: '' }])
  })
})

describe('blankInputs', () => {
  // The ablation tooling. Its one hard requirement is that the stored row is
  // never touched, so the same intake can be run repeatedly with different
  // fields removed and the diffs compared against each other.
  it('clears a flat field without touching the original', () => {
    const intake = buildIntake(validState())
    const blanked = blankInputs(intake, ['reported_problem'])
    expect('reported_problem' in blanked).toBe(false)
    expect(intake.reported_problem).toBeTruthy()
  })

  it('clears a column across every decision', () => {
    const state = validState()
    for (const d of state.decisions) d.prior_behaviour = 'It cleared on timeout'
    const blanked = blankInputs(buildIntake(state), ['decisions[].prior_behaviour'])
    expect(blanked.decisions.every((d) => !('prior_behaviour' in d))).toBe(true)
  })

  it('clears one decision when the index says so, leaving its neighbours alone', () => {
    const state = validState()
    for (const d of state.decisions) d.consequence = 'Nobody photographs it now'
    const blanked = blankInputs(buildIntake(state), ['decisions[0].consequence'])
    expect('consequence' in blanked.decisions[0]).toBe(false)
    expect(blanked.decisions[1].consequence).toBe('Nobody photographs it now')
  })

  it('drops every screen at once, since asset scarcity is a single condition', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem', 'The empty column')]
    const blanked = blankInputs(buildIntake(state), ['image_notes'])
    expect(blanked.image_notes).toEqual([])
  })
})

describe('thinness', () => {
  it('treats a one-word answer as thin but never as invalid, because next is never blocked', () => {
    expect(isThin('Yes')).toBe(true)
    expect(isThin('')).toBe(true)
    expect(isThin(undefined)).toBe(true)
  })

  it('accepts an answer that is short but specific, so the marker means "brief" not "bad"', () => {
    expect(
      isThin('Nurses photographed the screen because it sometimes cleared itself')
    ).toBe(false)
  })
})

describe('review screen', () => {
  it('counts a section as thin when every answer in it is thin, not when any one is', () => {
    const sections = buildReview(buildIntake(validState()))
    const project = sections.find((s) => s.step === 1)
    expect(project?.entries.some((e) => e.thin)).toBe(true)
    expect(project?.thin).toBe(false)
  })

  it('does not call a decision short because its title is, since a fix block title is meant to be six words', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    state.decisions[0].why =
      'Nurses photographed the screen every shift because it sometimes cleared itself'

    const decisions = buildReview(buildIntake(state)).find((s) => s.step === 3)
    const first = decisions?.entries.find((e) => e.label === 'Decision 1')
    expect(first?.value).toBe('Freeze the note at shift change')
    expect(first?.thin).toBe(false)
  })

  it('calls a decision short when nothing explains it, because a fix with no reason cannot pass any of the three tests', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'

    const decisions = buildReview(buildIntake(state)).find((s) => s.step === 3)
    const first = decisions?.entries.find((e) => e.label === 'Decision 1')
    expect(first?.thin).toBe(true)
    expect(first?.empty).toBe(false)
  })

  it('leaves the screens section out when there are no screens', () => {
    const intake = buildIntake(validState())
    expect(buildReview(intake).some((s) => s.heading === 'Your screens')).toBe(false)
    expect(
      buildReview(intake, [attachment('a', 'problem')]).some(
        (s) => s.heading === 'Your screens'
      )
    ).toBe(true)
  })

  // A screen's Edit link has to land on the step that holds its slot, which is
  // step 2 for the problem exhibit and step 3 for a before or after.
  it('sends each screen back to the step its slot lives on', () => {
    const state = validState()
    const id = state.decisions[0].id
    const attachments = [attachment('a', 'problem'), attachment('b', 'after', '', id)]
    state.attachments = attachments
    const screens = buildReview(buildIntake(state), attachments).find(
      (s) => s.heading === 'Your screens'
    )
    expect(screens?.entries.map((e) => e.step)).toEqual([2, 3])
  })

  // React drops one of two children sharing a key, silently. The screens
  // section sends its Edit links to step 2 or step 3 depending on the slot, so
  // it carries step 2 — and keying on the step made it collide with the step-2
  // section, which is how a whole section disappeared from the summary.
  it('gives every section its own id, since two of them can point at the same step', () => {
    const state = validState()
    const attachments = [attachment('a', 'problem')]
    state.attachments = attachments
    const ids = buildReview(buildIntake(state), attachments).map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hides a revealed field from the summary until its toggle is on, matching what the form showed', () => {
    const state = validState()
    const labels = () =>
      buildReview(buildIntake(state))
        .flatMap((s) => s.entries)
        .map((e) => e.label)

    expect(labels()).not.toContain('What did you measure?')
    state.toggles.has_measurement = true
    expect(labels()).toContain('What did you measure?')
  })

  it('treats a picked outcome as answered however few words it is', () => {
    const outcome = buildReview(buildIntake(validState()))
      .find((s) => s.step === 5)
      ?.entries[0]
    expect(outcome?.value).toBe('Shipped')
    expect(outcome?.thin).toBe(false)
  })

  it('drops the "these parts are still short" clause when nothing is short, so the line stays true', () => {
    const full = emptyWizardState()
    for (const field of INTAKE_FIELDS) {
      full.text[field.key] =
        'A full answer that carries well past the threshold this module uses for short.'
    }
    full.toggles = {
      client_may_be_named: true,
      reported_verbatim: true,
      has_measurement: true,
    }
    full.collaborators = [{ name: 'Priya Raman', role: 'Clinical lead' }]
    full.provenance = 'audit'
    for (const d of full.decisions) {
      d.decided = 'Freeze the note at shift change'
      d.why = 'Nurses photographed the screen every shift because it sometimes cleared'
    }
    full.outcome = 'shipped'

    expect(reviewIntro(buildReview(buildIntake(full)))).toBe(
      WIZARD_COPY.reviewIntroAllFilled
    )
    expect(reviewIntro(buildReview(buildIntake(validState())))).toBe(
      WIZARD_COPY.reviewIntro
    )
  })
})

describe('copy rules', () => {
  it('never uses a discouraging word anywhere the user can read', () => {
    const strings = [
      ...Object.values(WIZARD_COPY),
      ...WIZARD_STEPS.flatMap((s) => [s.name, s.heading, s.subhead]),
      ...INTAKE_FIELDS.flatMap((f) => [f.label, f.placeholder, f.helper ?? '']),
      ...Object.values(DECISION_FIELDS).flatMap((f) => Object.values(f)),
      ...Object.values(DECISION_TOGGLE).flatMap((f) => Object.values(f)),
      ...Object.values(RELATION_CHIPS).flatMap((f) => Object.values(f)),
      ...Object.values(SCREEN_FIELDS).flatMap((f) => Object.values(f)),
      ...Object.values(SLOT_LABELS),
      ...Object.values(SLOT_ENTRY_LABELS),
      // Step 4's fork and the chips on both sides of it.
      ...Object.values(AREA_CHIPS),
      ...Object.values(SECTION_CHIPS),
      ...Object.values(FLOW_CHIPS),
      ...SECTION_FATES.map((f) => f.label),
      ...WORK_SHAPE_OPTIONS.flatMap((o) => [o.label, o.example]),
      // PROJECT_TYPES carries a per-option description and was in no copy test
      // at all — a second string on an option is exactly the shape that slips
      // past a list projecting one property, which is how it got here.
      ...PROJECT_TYPES.flatMap((t) => [t.label, t.description]),
      // These three moved out of the step components during the copy pass.
      // They were unreachable from here before, which is how the wizard
      // accumulated a set of explanations nobody had ever run this rule over.
      ...Object.values(TOGGLE_COPY).flatMap((f) => Object.values(f)),
      ...Object.values(DISCLOSURE),
      COLLABORATOR_FIELDS.legend,
      ...Object.values(COLLABORATOR_FIELDS.name),
      ...Object.values(COLLABORATOR_FIELDS.role),
    ]

    const offenders = strings.filter((s) =>
      DISCOURAGING_WORDS.some((w) => s.toLowerCase().includes(w))
    )
    expect(offenders).toEqual([])
  })

  // The copy pass is only durable if the components stop carrying copy. A
  // helper written inline is a helper the rule above cannot see, and every
  // meta-explanation cut in this pass had been written that way.
  it('keeps user-facing copy out of the step components', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const dir = 'components/studio/steps'
    const offenders: string[] = []

    for (const file of readdirSync(dir)) {
      const source = readFileSync(`${dir}/${file}`, 'utf8')
      // A literal helper= or label= on a component, rather than a reference.
      for (const m of source.matchAll(/\b(helper|label|placeholder)="([^"]{16,})"/g)) {
        offenders.push(`${file}: ${m[1]}="${m[2]}"`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('keeps the two review buttons equal in weight, which means neither label hedges', () => {
    expect(WIZARD_COPY.reviewFill).toBe('Fill these in')
    expect(WIZARD_COPY.reviewWrite).toBe('Write the case study')
  })

  // The mock these steps were drawn from carried "Step 1 0f 5", "One
  // decisions", "(optional", "each ones shows" and "spesific". None of them
  // ever reached the code — but the labels were rewritten wholesale here, and
  // a typo introduced now would read as the product's own.
  it('spells the step labels and helpers correctly', () => {
    const strings = [
      ...WIZARD_STEPS.flatMap((s) => [s.name, s.heading, s.subhead]),
      ...INTAKE_FIELDS.flatMap((f) => [f.label, f.helper ?? '']),
      ...Object.values(DECISION_FIELDS).flatMap((f) => Object.values(f)),
    ].join(' ')

    for (const typo of [' 0f ', 'One decisions', 'each ones', 'spesific', "did'nt", 'acutally']) {
      expect(strings).not.toContain(typo)
    }
  })

  // Every question has to earn its answer. Three fields left in this rebuild
  // because no rule read them; the way to stop a fourth arriving is to make
  // the absence of a citation visible here rather than in a review months on.
  //
  // An I-number OR a § section, because the three diagram fields have no
  // I-number: the manifest predates the diagram having an input at all, and
  // §9.5's row for it is prose rather than a numbered one. Accepting a section
  // TIGHTENS this rather than loosening it — `product_areas` used to pass only
  // because I13, on the answer above it, fell inside the window below, which is
  // not a citation of anything. Each of the three now names its consumer.
  it('cites what consumes every field in the registry source', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync('lib/intake-fields.ts', 'utf8')
    )
    for (const field of INTAKE_FIELDS) {
      const at = source.indexOf(`key: '${field.key}'`)
      expect(at, `${field.key} is not in the registry source`).toBeGreaterThan(-1)
      // The citation sits in the comment block above the field or on its own line.
      const window = source.slice(Math.max(0, at - 900), at + 200)
      expect(window, `${field.key} cites no input id and no section`).toMatch(
        /\bI\d{1,2}\b|§\d/
      )
    }
  })
})

describe('compileBlockers', () => {
  // Found in production, not in review. Someone filled one decision, the
  // wizard let them through because it never blocks "next", and the schema
  // then rejected the one-entry document. The retry told the model to fix it —
  // which it can only do by inventing a decision the designer never made, and
  // on one attempt it did exactly that. Four minutes and a vision pass over
  // six screens spent reaching nothing.
  it('refuses a single decision, because one fix block is not an argument', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Group the settings by intent'
    expect(compileBlockers(buildIntake(state))).toHaveLength(1)
  })

  it('refuses an empty step 3 outright', () => {
    expect(compileBlockers(buildIntake(emptyWizardState()))).toHaveLength(1)
  })

  it('allows the minimum, so the check gates nothing it should not', () => {
    const state = emptyWizardState()
    for (const d of state.decisions) d.decided = 'Freeze the note at shift change'
    expect(state.decisions).toHaveLength(DECISIONS_MIN)
    expect(compileBlockers(buildIntake(state))).toEqual([])
  })

  it('counts only decisions that say what was decided, not cards that were opened', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Group the settings by intent'
    state.decisions[1].why = 'I typed a reason but never named the decision'
    expect(compileBlockers(buildIntake(state))).toHaveLength(1)
  })

  it('never phrases the blocker as a judgement of the answer', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Group the settings by intent'
    const [blocker] = compileBlockers(buildIntake(state))
    for (const word of DISCOURAGING_WORDS) {
      expect(blocker.toLowerCase()).not.toContain(word)
    }
  })
})

describe('wizard limits track the schema', () => {
  it('keeps DECISIONS_MIN equal to the fix-block minimum, since one decision makes one block', () => {
    expect(DECISIONS_MIN).toBe(SPINE_MIN)
    expect(DECISIONS_MAX).toBe(SPINE_MAX)
  })

  it('starts with the minimum showing, as an invitation rather than a promise', () => {
    expect(emptyWizardState().decisions).toHaveLength(DECISIONS_MIN)
    expect(createDecision().id).not.toBe(createDecision().id)
  })
})

describe('reviewNotes', () => {
  // Six uploads were lost to a page reload and the absence only became visible
  // in the finished case study.
  it('says so when there are no screens at all', () => {
    const notes = reviewNotes(buildIntake(emptyWizardState()))
    expect(notes).toHaveLength(1)
    // Against the constant, not a phrase from it: what this guards is that the
    // note fires at all, and pinning the wording makes every copy pass a test
    // failure.
    expect(notes[0]).toBe(WIZARD_COPY.noteNoScreens)
  })

  it('says so when screens were uploaded and none was described', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem')]
    const notes = reviewNotes(buildIntake(state))
    expect(notes.some((n) => n.includes('no note yet'))).toBe(true)
  })

  it('stays quiet about screens once one has been described', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem', 'The column is empty after the reset')]
    const notes = reviewNotes(buildIntake(state))
    expect(notes.some((n) => n.includes('no note yet'))).toBe(false)
  })

  // Two real projects shipped on the floor form without anyone noticing that a
  // better picture was a tap away in step 4. This is what would have said so.
  describe('the diagram note', () => {
    it('names the fork when no branch was answered at all', () => {
      expect(diagramNote(buildIntake(validState()))).toBe(WIZARD_COPY.noteDiagramUnforked)
    })

    it('names what the parts branch is short of', () => {
      const state = validState()
      state.shape = 'separate_parts'
      state.parts = [{ id: 'p0', label: 'Homepage' }]
      expect(diagramNote(buildIntake(state))).toBe(WIZARD_COPY.noteDiagramParts)
    })

    it('names what the page branch is short of', () => {
      const state = validState()
      state.shape = 'single_page'
      state.pageSections = [
        { id: 's0', label: 'Hero' },
        { id: 's1', label: 'Pricing' },
      ]
      expect(diagramNote(buildIntake(state))).toBe(WIZARD_COPY.noteDiagramPage)
    })

    // A branch picked and then left blank writes no key at all, so the row
    // cannot say which one it was. Telling that person to answer the fork
    // sends them back to a question they have already answered.
    it('trusts the form over the row when a branch was picked and left blank', () => {
      const state = validState()
      state.shape = 'single_page'
      const intake = buildIntake(state)
      expect(intake.page_sections).toBeUndefined()
      expect(diagramNote(intake, 'single_page')).toBe(WIZARD_COPY.noteDiagramPage)
      expect(diagramNote(intake)).toBe(WIZARD_COPY.noteDiagramUnforked)
    })

    it('names what the flow branch is short of', () => {
      const state = validState()
      state.shape = 'one_flow'
      state.flowSteps = [
        { id: 'f0', label: 'Basket' },
        { id: 'f1', label: 'Pay' },
      ]
      expect(diagramNote(buildIntake(state))).toBe(WIZARD_COPY.noteDiagramFlow)
    })

    // Quiet when a real template fired: there is nothing to improve, and a note
    // that always showed would stop being read.
    it('says nothing once a real template draws', () => {
      const state = validState()
      state.shape = 'separate_parts'
      // Attached to a decision that is actually on the state, because an
      // attachment pointing at a deleted decision is pruned on the way in — and
      // the fourth condition then fails, which is the behaviour it should.
      state.parts = partChips().map((c, i) =>
        i === 0 ? { ...c, decisions: [state.decisions[0].id] } : c
      )
      expect(diagramNote(buildIntake(state))).toBeNull()
    })

    it('never phrases any of them as a judgement of the answer', () => {
      const all = [
        WIZARD_COPY.noteDiagramUnforked,
        WIZARD_COPY.noteDiagramParts,
        WIZARD_COPY.noteDiagramPage,
        WIZARD_COPY.noteDiagramFlow,
      ]
      for (const note of all) {
        for (const word of DISCOURAGING_WORDS) {
          expect(note.toLowerCase()).not.toContain(word)
        }
      }
    })
  })

  it('never phrases a note as a judgement of the answer', () => {
    for (const note of reviewNotes(buildIntake(emptyWizardState()))) {
      for (const word of DISCOURAGING_WORDS) {
        expect(note.toLowerCase()).not.toContain(word)
      }
    }
  })
})


/** Four chips, the first two worked, the first carrying a decision. */
const partChips = (labels: string[] = ['Orders', 'Menu', 'Payments', 'Reports']) =>
  labels.map((label, i) => ({
    id: `c${i}`,
    label,
    ...(i < 2 ? { worked: true as const } : {}),
    ...(i === 0 ? { decisions: ['d1'] } : {}),
  }))

describe('the product\'s parts', () => {
  // One answer, two taps. The chips are generated from the text, so the text is
  // the only place a name exists and the two selections point into it.
  it('reads parts from one comma-separated answer', () => {
    expect(parseAreas('Orders, Menu , Payments')).toEqual(['Orders', 'Menu', 'Payments'])
  })

  it('accepts newlines as separators too, because people use both', () => {
    expect(parseAreas('Orders\nMenu, Payments')).toEqual(['Orders', 'Menu', 'Payments'])
  })

  // Two chips reading "Orders" and "orders" is a bug nobody can fix from the form.
  it('drops a repeat case-insensitively and keeps the first spelling', () => {
    expect(parseAreas('Orders, orders, ORDERS')).toEqual(['Orders'])
  })

  it('is empty for an empty answer', () => {
    expect(parseAreas(undefined)).toEqual([])
    expect(parseAreas('  ,  , ')).toEqual([])
  })

  it('caps nothing — how many parts earn a diagram is the diagram\'s question', () => {
    expect(parseAreas('a,b,c,d,e,f,g,h,i,j,k,l')).toHaveLength(12)
  })

  // THE BUG THE IDS EXIST TO PREVENT. A mark matched by name went missing on a
  // rename; a mark matched by position went onto a neighbour on a drag. Neither
  // can happen to a flag that lives on the chip itself.
  it('keeps a mark on its chip across a reorder', () => {
    const moved = moveChip(partChips(), 0, 3)
    expect(moved.map((c) => c.label)).toEqual(['Menu', 'Payments', 'Reports', 'Orders'])
    expect(moved.find((c) => c.label === 'Orders')?.decisions).toEqual(['d1'])
    expect(moved.find((c) => c.label === 'Payments')?.worked).toBeUndefined()
  })

  it('keeps a mark on its chip across a delete', () => {
    const chips = partChips()
    const left = removeChip(chips, chips[1].id)
    expect(left.find((c) => c.label === 'Orders')?.decisions).toEqual(['d1'])
  })

  it('refuses a duplicate label case-insensitively, like the old parser did', () => {
    const once = addChip([], 'Orders')
    expect(addChip(once, 'ORDERS')).toHaveLength(1)
  })

  it('caps the list, because the form and the grid hold the same number', () => {
    const full = Array.from({ length: 20 }, (_, i) => String(i)).reduce(addChip, [] as ReturnType<typeof createChip>[])
    expect(full).toHaveLength(PART_MAX)
  })

  // Clearing the mark takes the attachments with it: an unworked part carrying
  // decisions is a state the diagram would have to interpret.
  it('drops the attachments when the mark comes off', () => {
    const chips = partChips()
    const off = toggleChipWorked(chips, chips[0].id)
    expect(off[0].worked).toBeUndefined()
    expect(off[0].decisions).toBeUndefined()
  })

  it('attaches and detaches a decision by id', () => {
    const chips = partChips()
    const on = toggleChipDecision(chips, chips[1].id, 'd2')
    expect(on[1].decisions).toEqual(['d2'])
    expect(toggleChipDecision(on, chips[1].id, 'd2')[1].decisions).toBeUndefined()
  })

  it('refuses to attach to a chip nobody marked', () => {
    const chips = partChips()
    expect(toggleChipDecision(chips, chips[3].id, 'd2')[3].decisions).toBeUndefined()
  })

  it('seeds chips from a draft that only ever had the typed answer', () => {
    expect(chipsFromText('Orders, Menu').map((c) => c.label)).toEqual(['Orders', 'Menu'])
    expect(chipsFromText('Orders, Menu').every((c) => c.worked === undefined)).toBe(true)
  })

  it('carries the parts onto the intake, marks and attachments included', () => {
    const state = emptyWizardState()
    state.shape = 'separate_parts'
    state.parts = partChips()
    state.decisions = [{ id: 'd1', decided: 'Froze the board', why: 'because' }]
    const intake = buildIntake(state)
    expect(intake.product_parts).toEqual([
      { label: 'Orders', worked: true, decisions: ['d1'] },
      { label: 'Menu', worked: true },
      { label: 'Payments' },
      { label: 'Reports' },
    ])
  })

  // The raw answer is composed from the chips now, not parsed into them, so the
  // stored row still carries the list a reader of the row would expect.
  it('writes the raw answer back from the chip labels', () => {
    const state = emptyWizardState()
    state.shape = 'separate_parts'
    state.parts = partChips()
    expect(buildIntake(state).product_areas).toBe('Orders, Menu, Payments, Reports')
  })

  // A decision deleted in step 3 leaves its id on whatever chips held it.
  it('drops an attachment pointing at a decision that no longer exists', () => {
    const state = emptyWizardState()
    state.shape = 'separate_parts'
    state.parts = partChips()
    state.decisions = []
    expect(buildIntake(state).product_parts?.[0].decisions).toBeUndefined()
  })

  it('writes nothing when there are no chips', () => {
    const state = emptyWizardState()
    state.shape = 'separate_parts'
    expect(buildIntake(state).product_parts).toBeUndefined()
    expect(buildIntake(state).product_areas).toBeUndefined()
  })
})

describe('the four skip conditions', () => {
  // One test per condition, against the same helper the step reads. These and
  // `gateSetException` have to agree: the form promising a picture the page then
  // drops is the failure this pair exists to prevent.
  it('draws when all four are satisfied', () => {
    expect(partsDiagramState(partChips()).draws).toBe(true)
  })

  it('refuses fewer than four chips', () => {
    const s = partsDiagramState(partChips(['Orders', 'Menu', 'Payments']))
    expect(s.tooFew).toBe(true)
    expect(s.draws).toBe(false)
  })

  it('refuses nothing marked', () => {
    const bare = partChips().map((c) => ({ id: c.id, label: c.label }))
    expect(partsDiagramState(bare).noneWorked).toBe(true)
  })

  it('refuses everything marked, because there is no contrast', () => {
    const all = partChips().map((c) => ({ ...c, worked: true as const }))
    expect(partsDiagramState(all).allWorked).toBe(true)
  })

  it('refuses nothing attached', () => {
    const none = partChips().map((c) => ({ id: c.id, label: c.label, worked: c.worked }))
    expect(partsDiagramState(none).noneAttached).toBe(true)
  })

  // Named and on no part. A note, never a blocker — nothing downstream may
  // invent a part to hang it on, so the designer is told instead.
  it('names the decisions no part claims', () => {
    const decisions = [
      { id: 'd1', decided: 'Froze the board', why: '' },
      { id: 'd2', decided: 'Sorted by escalation', why: '' },
      { id: 'd3', decided: '', why: '' },
    ]
    expect(unattachedDecisions(decisions, partChips())).toEqual(['Sorted by escalation'])
  })
})

describe("the fork's examples", () => {
  // Every one is its template's own "Typical projects" line in the PRD. The
  // form naming different projects from the specification is the drift this
  // guards: a reader picks a branch by its examples, and the gates behind it
  // were written for the document's.
  it.each([
    ['separate_parts', '§5.1', ['Multi-area redesign', 'audit and fix', 'consistency pass']],
    ['single_page', '§5.3', ['Landing page', 'pricing page', 'homepage']],
    ['one_flow', '§5.2', ['Checkout', 'signup', 'onboarding', 'booking']],
  ])('%s names the projects %s lists', (value, _section, expected) => {
    const option = WORK_SHAPE_OPTIONS.find((o) => o.value === value)
    for (const project of expected) {
      expect(option?.example).toContain(project)
    }
  })

  it('gives every option one, since a missing one reads as a shorter answer', () => {
    for (const option of WORK_SHAPE_OPTIONS) {
      expect(option.example.trim()).not.toBe('')
    }
  })
})

describe('the step 4 hint', () => {
  const base = {
    shape: null as WorkShape | null,
    text: {} as Partial<Record<TextKey, string>>,
    parts: [] as ReturnType<typeof partChips>,
    pageSections: [] as ReturnType<typeof partChips>,
    flowSteps: [] as ReturnType<typeof partChips>,
    sectionFates: {} as Record<string, SectionFate>,
    stepsRemoved: [] as string[],
  }
  const hint = (over: Partial<typeof base>) => approachHint({ ...base, ...over })
  /** Unmarked chips, for the branches whose marking lives elsewhere. */
  const plain = (...labels: string[]) => labels.map((label, i) => ({ id: `h${i}`, label }))

  // The fork sits right there unanswered; saying so twice is noise.
  it('says nothing while the fork is unanswered', () => {
    expect(hint({})).toBeNull()
  })

  it('says nothing before anything is typed', () => {
    expect(hint({ shape: 'separate_parts' })).toBeNull()
    expect(hint({ shape: 'single_page' })).toBeNull()
    expect(hint({ shape: 'one_flow' })).toBeNull()
  })

  // Both real projects typed the list and tapped nothing, which is how they
  // ended up on the floor form.
  it('asks for a tap once a list is typed and nothing is marked', () => {
    expect(
      hint({ shape: 'separate_parts', parts: plain('Orders', 'Menu', 'Payments', 'Reports') })
    ).toBe(WIZARD_COPY.hintPartsTap)
    expect(hint({ shape: 'single_page', pageSections: plain('Hero', 'Pricing') })).toBe(
      WIZARD_COPY.hintPageMark
    )
    expect(hint({ shape: 'one_flow', flowSteps: plain('Basket', 'Pay') })).toBe(
      WIZARD_COPY.hintFlowTap
    )
  })

  it('names what each branch is short of once something is marked', () => {
    expect(hint({ shape: 'separate_parts', parts: partChips(['Orders', 'Menu']) })).toBe(
      WIZARD_COPY.hintPartsShort
    )
    expect(
      hint({
        shape: 'single_page',
        pageSections: plain('Hero', 'Pricing'),
        sectionFates: { Hero: 'added' },
      })
    ).toBe(WIZARD_COPY.hintPageShort)
    expect(
      hint({ shape: 'one_flow', flowSteps: plain('Basket', 'Pay'), stepsRemoved: ['Pay'] })
    ).toBe(WIZARD_COPY.hintFlowShort)
  })

  it('confirms once a branch would draw the work', () => {
    expect(
      hint({ shape: 'separate_parts', parts: partChips() })
    ).toBe(WIZARD_COPY.hintDraws)
    expect(
      hint({
        shape: 'single_page',
        text: { page_pattern: 'the cut ones sat in the middle' },
        pageSections: plain('Hero', 'Pricing', 'Features', 'FAQ', 'Footer'),
        sectionFates: { Hero: 'added', Pricing: 'kept', Features: 'cut', FAQ: 'cut' },
      })
    ).toBe(WIZARD_COPY.hintDraws)
    expect(
      hint({
        shape: 'one_flow',
        flowSteps: plain('Basket', 'Sign up', 'Address', 'Billing', 'Pay', 'Confirm'),
        stepsRemoved: ['Sign up', 'Billing'],
      })
    ).toBe(WIZARD_COPY.hintDraws)
  })

  // The numbers in the copy are the gates' own. Spelled in English they were
  // free to drift the moment a threshold moved.
  it('takes its numbers from the gates rather than from English', () => {
    expect(WIZARD_COPY.hintPartsShort).toContain(String(PART_MIN))
    expect(WIZARD_COPY.hintPageShort).toContain(String(SECTION_MIN))
    expect(WIZARD_COPY.noteDiagramFlow).toContain(String(STEP_MIN))
  })

  // The two conditions the old "from scratch" question could not express. Both
  // are the form saying what the picture needs in order to show anything, never
  // anything about the answer.
  it('asks for an untapped area once every one is tapped', () => {
    const all = partChips().map((c) => ({ ...c, worked: true as const }))
    expect(hint({ shape: 'separate_parts', parts: all })).toBe(WIZARD_COPY.hintPartsAllMarked)
  })

  it('asks for a decision once the marks are right and nothing is attached', () => {
    const none = partChips().map((c) => ({ id: c.id, label: c.label, worked: c.worked }))
    expect(hint({ shape: 'separate_parts', parts: none })).toBe(WIZARD_COPY.hintPartsAttach)
  })
})

describe("the flow's steps", () => {
  const flow = (): ReturnType<typeof emptyWizardState> => {
    const state = emptyWizardState()
    state.shape = 'one_flow'
    state.flowSteps = ['Basket', 'Sign up', 'Address', 'Payment', 'Confirm'].map((label, i) => ({
      id: `f${i}`,
      label,
    }))
    state.stepsRemoved = ['Sign up']
    return state
  }

  it('keeps the walking order, with the gone ones flagged in place', () => {
    expect(buildFlowSteps(['A', 'B', 'C'], ['B'])).toEqual([
      { label: 'A' }, { label: 'B', removed: true }, { label: 'C' },
    ])
  })

  // Absent rather than false, so the two states cannot be half-read.
  it('writes no key at all for a step that survived', () => {
    expect(buildFlowSteps(['A'], [])).toEqual([{ label: 'A' }])
  })

  it('carries the steps onto the intake and leaves the other branches alone', () => {
    const intake = buildIntake(flow())
    expect(intake.flow_steps_ordered?.map((x) => x.label)).toEqual([
      'Basket', 'Sign up', 'Address', 'Payment', 'Confirm',
    ])
    expect(intake.flow_steps_ordered?.filter((x) => x.removed)).toHaveLength(1)
    expect(intake.product_parts).toBeUndefined()
    expect(intake.page_sections_ordered).toBeUndefined()
  })

  it('drops a tap whose step is no longer in the answer', () => {
    const state = flow()
    state.stepsRemoved = ['Sign up', 'Gift wrap']
    expect(buildIntake(state).flow_steps_ordered?.filter((x) => x.removed)).toHaveLength(1)
  })

  it('reads the flow branch back off the row', () => {
    expect(intakeShape(buildIntake(flow()))).toBe('one_flow')
  })
})

describe("the page's sections", () => {
  const page = (): ReturnType<typeof emptyWizardState> => {
    const state = emptyWizardState()
    state.shape = 'single_page'
    state.pageSections = [
      'Headline',
      'Plan prices',
      'Feature grid',
      'FAQ',
      'Book a demo',
    ].map((label, i) => ({ id: `s${i}`, label }))
    state.text.page_pattern = 'the two nobody asked for sat in the middle'
    state.sectionFates = { 'Plan prices': 'kept', 'Feature grid': 'cut', FAQ: 'cut' }
    return state
  }

  // A section sits in one place on the page, so the three are exclusive.
  it('assigns one fate per section', () => {
    expect(assignFate({}, 'Hero', 'added')).toEqual({ Hero: 'added' })
    expect(assignFate({ Hero: 'added' }, 'Hero', 'cut')).toEqual({ Hero: 'cut' })
  })

  // Deleted rather than blanked: a section nobody sorted is a real answer, and
  // '' would travel as a fate whose name happens to be empty.
  it('clears the fate when the same chip is tapped again', () => {
    expect(assignFate({ Hero: 'added' }, 'Hero', 'added')).toEqual({})
  })

  it('drops a fate whose section is no longer in the answer', () => {
    expect(reconcileFates(['Hero', 'FAQ'], { Hero: 'added', Nav: 'cut' })).toEqual({ Hero: 'added' })
  })

  // The page's order is the diagram's only axis, so it comes from the answer
  // and never from the fate map, which has no order to give.
  it('keeps the page order even where the fates were tapped in another one', () => {
    const built = buildPageSections(['Nav', 'Hero', 'FAQ'], { FAQ: 'cut', Nav: 'kept' })
    expect(built).toEqual([{ label: 'Nav', fate: 'kept' }, { label: 'Hero' }, { label: 'FAQ', fate: 'cut' }])
  })

  it('carries no fate key at all for an unmarked section', () => {
    expect(buildPageSections(['Hero'], {})).toEqual([{ label: 'Hero' }])
  })

  it('carries the sections onto the intake and leaves the parts branch alone', () => {
    const intake = buildIntake(page())
    expect(intake.page_sections_ordered?.map((x) => x.label)).toEqual([
      'Headline',
      'Plan prices',
      'Feature grid',
      'FAQ',
      'Book a demo',
    ])
    expect(intake.product_parts).toBeUndefined()
    expect(intake.product_areas).toBeUndefined()
  })

  // The fork's answer is recorded by which keys the row carries, which is only
  // true because the branch that was not shown writes nothing at all.
  it('writes no page answer when the parts branch was the one asked', () => {
    const state = page()
    state.shape = 'separate_parts'
    const intake = buildIntake(state)
    expect(intake.page_sections).toBeUndefined()
    expect(intake.page_pattern).toBeUndefined()
    expect(intake.page_sections_ordered).toBeUndefined()
  })

  // The default was the bug. Two real projects — a one-page website and a
  // three-screen app — went through filed as "a product with separate parts"
  // because that was simply what was already ticked, and neither was ever
  // offered the branch that suited it.
  it('leaves an unanswered fork unanswered, choosing nothing for the person', () => {
    expect(shownShape(null, {})).toBeNull()
    const state = page()
    state.shape = null
    state.pageSections = []
    const intake = buildIntake(state)
    expect(intake.product_parts).toBeUndefined()
    expect(intake.page_sections_ordered).toBeUndefined()
  })

  // The one exception, and it is narrow: a draft written before the fork
  // existed has answers under the parts question and no way to have picked
  // anything. That work is still the person's.
  it('still reads a pre-fork draft as the parts branch', () => {
    expect(shownShape(null, { product_areas: 'Orders, Menu' })).toBe('separate_parts')
    const state = emptyWizardState()
    state.shape = null
    state.text.product_areas = 'Orders, Menu'
    // Seeded the way the form seeds it on restore: the typed list comes back as
    // chips, unmarked, because the taps were stored by name.
    state.parts = chipsFromText(state.text.product_areas)
    expect(buildIntake(state).product_parts?.map((x) => x.label)).toEqual(['Orders', 'Menu'])
  })

  it('reads the branch back off the row, so nothing has to store it', () => {
    expect(intakeShape(buildIntake(page()))).toBe('single_page')
    expect(intakeShape(buildIntake(emptyWizardState()))).toBe('separate_parts')
  })

  it('toggles a name in and out of a list', () => {
    expect(toggleName(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleName(['a', 'b'], 'a')).toEqual(['b'])
  })

  // The review screen shows what was asked. A branch that never appeared would
  // otherwise read as a question somebody skipped.
  // Against the registry, never against the words. This pinned both labels as
  // raw strings and broke on a copy pass that had nothing to do with branch
  // filtering, which is what it is actually guarding.
  it('keeps the branch that was not asked off the review screen', () => {
    const labelOf = (key: string) =>
      INTAKE_FIELDS.find((f) => f.key === key)?.label ?? `missing: ${key}`
    const sections = buildReview(buildIntake(page()))
    const step4 = sections.find((x) => x.step === 4)
    const labels = (step4?.entries ?? []).map((e) => e.label)
    expect(labels).toContain(labelOf('page_sections'))
    expect(labels).not.toContain(labelOf('product_areas'))
  })
})
