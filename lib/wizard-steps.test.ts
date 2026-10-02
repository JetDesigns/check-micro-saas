import { describe, expect, it } from 'vitest'
import {
  DECISIONS_MAX,
  DECISIONS_MIN,
  COLLABORATOR_FIELDS,
  DECISION_FIELDS,
  DECISION_TOGGLE,
  DISCLOSURE,
  DISCOURAGING_WORDS,
  RELATION_CHIPS,
  SCREEN_FIELDS,
  SLOT_ENTRY_LABELS,
  SLOT_LABELS,
  TOGGLE_COPY,
  WIZARD_COPY,
  WIZARD_STEPS,
  blankInputs,
  buildIntake,
  buildReview,
  compileBlockers,
  reviewNotes,
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
import { INTAKE_FIELDS, MEASUREMENT_KEYS } from './intake-fields'
import { SPINE_MAX, SPINE_MIN } from './case-study-blocks'
import type { ImageSlot } from '@/types/database'

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
  it('cites an input id beside every field in the registry source', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync('lib/intake-fields.ts', 'utf8')
    )
    for (const field of INTAKE_FIELDS) {
      const at = source.indexOf(`key: '${field.key}'`)
      expect(at, `${field.key} is not in the registry source`).toBeGreaterThan(-1)
      // The id sits in the comment block above the field or on its own line.
      const window = source.slice(Math.max(0, at - 900), at + 200)
      expect(window, `${field.key} cites no input id`).toMatch(/\bI\d{1,2}\b/)
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
    expect(notes[0]).toContain('text only')
  })

  it('says so when screens were uploaded and none was described', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem')]
    const notes = reviewNotes(buildIntake(state))
    expect(notes).toHaveLength(1)
    expect(notes[0]).toContain('no note yet')
  })

  it('stays quiet once a screen has been described', () => {
    const state = validState()
    state.attachments = [attachment('a', 'problem', 'The column is empty after the reset')]
    expect(reviewNotes(buildIntake(state))).toEqual([])
  })

  it('never phrases a note as a judgement of the answer', () => {
    for (const note of reviewNotes(buildIntake(emptyWizardState()))) {
      for (const word of DISCOURAGING_WORDS) {
        expect(note.toLowerCase()).not.toContain(word)
      }
    }
  })
})
