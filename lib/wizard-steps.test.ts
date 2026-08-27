import { describe, expect, it } from 'vitest'
import {
  DECISION_FIELDS,
  DISCOURAGING_WORDS,
  SCREEN_FIELDS,
  WIZARD_COPY,
  WIZARD_STEPS,
  buildIntake,
  buildReview,
  createDecision,
  emptyWizardState,
  isThin,
  nextStep,
  prevStep,
  reviewIntro,
  stepOrder,
  stepPosition,
  type WizardState,
} from './wizard-steps'
import { INTAKE_FIELDS } from './intake-fields'

// What this file guards, in order of how expensive the mistake would be:
//
// 1. buildIntake is the only writer of `case_studies.intake`. The code it
//    replaces filtered empty answers out of an object and then asserted
//    `as unknown as Intake` — a required-property lie with no compile-time or
//    runtime complaint. Nothing downstream reads that column yet, so a bad
//    shape would sit in the database unnoticed until Phase 4 tried to use it.
// 2. Step 4 is skipped when there are no uploads. Skipping forwards is easy to
//    get right and skipping backwards is easy to get wrong, so both directions
//    are tested.
// 3. Image notes are carried by attachment id and flattened to positions only
//    at submit. Remove a screen after annotating a later one and, done wrong,
//    every note slides onto the wrong image — silently, since nothing renders
//    them yet.
// 4. The spec forbids telling anyone their answer is deficient. That is a copy
//    rule, which is exactly the kind of rule that rots, so it is asserted.

function validState(): WizardState {
  const state = emptyWizardState()
  state.text = {
    title: 'Rebuilding shift handover for a hospital ward',
    client_type: 'A regional hospital group',
    problem:
      'The handover screen cleared itself sometimes, so nurses photographed it before every shift change.',
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
  it('skips step 4 entirely when nobody uploaded a screen, because an empty step reads as a bug', () => {
    expect(stepOrder(false)).toEqual([1, 2, 3, 5, 'review'])
    expect(nextStep(3, false)).toBe(5)
  })

  it('keeps step 4 in the walk once a screen exists', () => {
    expect(stepOrder(true)).toEqual([1, 2, 3, 4, 5, 'review'])
    expect(nextStep(3, true)).toBe(4)
  })

  it('walks back out of the review screen into step 5, not step 4, when there are no images', () => {
    expect(prevStep('review', false)).toBe(5)
    expect(prevStep(5, false)).toBe(3)
  })

  it('stays put at both ends rather than falling off the array', () => {
    expect(prevStep(1, true)).toBe(1)
    expect(nextStep('review', true)).toBe('review')
  })

  it('counts five steps with images and four without, so the indicator never shows a gap', () => {
    expect(stepPosition(5, true)).toEqual({ index: 4, total: 5 })
    expect(stepPosition(5, false)).toEqual({ index: 3, total: 4 })
  })
})

describe('buildIntake', () => {
  it('omits empty text fields instead of storing empty strings, so absent stays distinguishable from blank', () => {
    const intake = buildIntake(emptyWizardState())
    expect(intake.title).toBeUndefined()
    expect('title' in intake).toBe(false)
    expect(intake.decisions).toEqual([])
    expect(intake.image_notes).toEqual([])
  })

  it('trims what it keeps, so a stray newline never becomes part of the answer', () => {
    const state = emptyWizardState()
    state.text.title = '  Shift handover  '
    expect(buildIntake(state).title).toBe('Shift handover')
  })

  it('drops a decision block the user never typed into, so two visible blocks do not mean two hollow spine entries', () => {
    const state = validState()
    state.decisions.push(createDecision())
    expect(state.decisions).toHaveLength(3)
    expect(buildIntake(state).decisions).toHaveLength(2)
  })

  it('keeps a decision that has only "what you decided", because half a decision still carries a move', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    const kept = buildIntake(state).decisions
    expect(kept).toHaveLength(1)
    expect(kept[0].decided).toBe('Freeze the note at shift change')
    expect(kept[0].why).toBe('')
  })

  it('leaves `rejected` off entirely when nothing was rejected, rather than writing an empty one', () => {
    const state = validState()
    expect(buildIntake(state).decisions[0].rejected).toBe('An autosave indicator')
    expect('rejected' in buildIntake(state).decisions[1]).toBe(false)
  })

  it('carries the decision id through untouched, because it is what ties a move back to its spine entry', () => {
    const state = validState()
    const id = state.decisions[0].id
    expect(buildIntake(state).decisions[0].id).toBe(id)
  })

  it('numbers image notes by final position, so removing a screen does not shift the notes off the ones they describe', () => {
    const state = validState()
    state.attachmentIds = ['img-a', 'img-b', 'img-c']
    state.imageNotes = {
      'img-a': { shows: 'hero', notice: 'The board after the rebuild' },
      'img-c': { shows: state.decisions[1].id, notice: 'Escalations hold the top' },
    }

    // The user goes back and removes the middle screen.
    state.attachmentIds = ['img-a', 'img-c']

    const notes = buildIntake(state).image_notes
    expect(notes).toHaveLength(2)
    expect(notes[1]).toEqual({
      orderIndex: 1,
      shows: state.decisions[1].id,
      notice: 'Escalations hold the top',
    })
  })

  it('writes no note for a screen nobody said anything about, rather than inventing a slot for it', () => {
    const state = validState()
    state.attachmentIds = ['img-a']
    state.imageNotes = { 'img-a': { shows: '', notice: '' } }
    expect(buildIntake(state).image_notes).toEqual([])
  })

  it('records the outcome only once it is picked, since there is no sensible default for "did it ship"', () => {
    const state = emptyWizardState()
    expect(buildIntake(state).outcome_status).toBeUndefined()
    state.outcome = 'handed_off'
    expect(buildIntake(state).outcome_status).toBe('handed_off')
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
    const intake = buildIntake(validState())
    const sections = buildReview(intake)

    const problem = sections.find((s) => s.step === 2)
    expect(problem?.entries.some((e) => e.thin)).toBe(true)
    expect(problem?.thin).toBe(false)

    const decisions = sections.find((s) => s.step === 3)
    expect(decisions?.thin).toBe(false)
  })

  it('does not call a decision short because its title is, since an imperative move title is meant to be six words', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'
    state.decisions[0].why =
      'Nurses photographed the screen every shift because it sometimes cleared itself'

    const decisions = buildReview(buildIntake(state)).find((s) => s.step === 3)
    expect(decisions?.entries[0].value).toBe('Freeze the note at shift change')
    expect(decisions?.entries[0].thin).toBe(false)
  })

  it('calls a decision short when nothing explains it, because a move with no finding leaves the spine hanging', () => {
    const state = emptyWizardState()
    state.decisions[0].decided = 'Freeze the note at shift change'

    const decisions = buildReview(buildIntake(state)).find((s) => s.step === 3)
    expect(decisions?.entries[0].thin).toBe(true)
    expect(decisions?.entries[0].empty).toBe(false)
  })

  it('leaves the screens section out when there are no screens, matching the step it links to', () => {
    const intake = buildIntake(validState())
    expect(buildReview(intake).some((s) => s.step === 4)).toBe(false)
    expect(buildReview(intake, ['img-a']).some((s) => s.step === 4)).toBe(true)
  })

  it('treats a picked outcome as answered however few words it is', () => {
    const intake = buildIntake(validState())
    const outcome = buildReview(intake)
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
    for (const d of full.decisions) {
      d.decided = 'Freeze the note at shift change'
      d.why =
        'Nurses photographed the screen every shift because it sometimes cleared itself'
    }
    full.outcome = 'shipped'

    expect(reviewIntro(buildReview(buildIntake(full)))).toBe(
      WIZARD_COPY.reviewIntroAllFilled
    )
    expect(reviewIntro(buildReview(buildIntake(validState())))).toBe(
      WIZARD_COPY.reviewIntro
    )
  })

  it('points every entry at an element id, because a jump link with nothing to focus is a dead button', () => {
    const intake = buildIntake(validState())
    for (const s of buildReview(intake, ['img-a'])) {
      for (const e of s.entries) {
        expect(e.anchor.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('copy rules', () => {
  it('never uses a discouraging word anywhere the user can read', () => {
    const strings = [
      ...Object.values(WIZARD_COPY),
      ...WIZARD_STEPS.flatMap((s) => [s.name, s.heading, s.subhead]),
      ...INTAKE_FIELDS.flatMap((f) => [f.label, f.placeholder, f.helper ?? '']),
      ...Object.values(DECISION_FIELDS).flatMap((f) => Object.values(f)),
      ...Object.values(SCREEN_FIELDS).flatMap((f) => Object.values(f)),
    ]

    const offenders = strings.filter((s) =>
      DISCOURAGING_WORDS.some((w) => s.toLowerCase().includes(w))
    )
    expect(offenders).toEqual([])
  })

  it('keeps the two review buttons equal in weight, which means neither label hedges', () => {
    expect(WIZARD_COPY.reviewFill).toBe('Fill these in')
    expect(WIZARD_COPY.reviewWrite).toBe('Write the case study')
  })
})
