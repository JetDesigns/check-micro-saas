import { describe, expect, it } from 'vitest'
import { FIXTURE_NAMES, fixtureIntake, getFixture, isFixtureName } from './focused-fix-intake'
import { compileBlockers, evidenceBranch, mixedFigure } from '@/lib/wizard-steps'
import type { Intake } from '@/types/database'

// The fixture is the thing every later test stands on, so the properties it has
// to keep are pinned here — and the ones the two generation paths depend on most.

describe.each(FIXTURE_NAMES)('fixture "%s"', (name) => {
  const intake = fixtureIntake(name)

  it('is a v2 intake that clears the compile gate', () => {
    expect(intake.schema_version).toBe(2)
    expect(compileBlockers(intake)).toEqual([])
    expect(intake.decisions.length).toBeGreaterThanOrEqual(2)
    expect(intake.decisions.length).toBeLessThanOrEqual(4)
  })

  // A tie-back per fix is what the spec requires and refuses to accept as one
  // statement for the section. Hand-written here until the review screen infers
  // them, so a gap in the fixture would be a gap in every test built on it.
  it('has a tie-back for every decision and none for a decision that is not there', () => {
    const ids = intake.decisions.map((d) => d.id)
    expect((intake.tiebacks ?? []).map((t) => t.decisionId).sort()).toEqual([...ids].sort())
  })

  it('only depends on a decision that exists', () => {
    const ids = new Set(intake.decisions.map((d) => d.id))
    for (const d of intake.decisions) {
      if (d.relations?.depends_on) expect(ids.has(d.relations.depends_on)).toBe(true)
    }
  })

  // Ids are fixed on purpose. A fixture that changes shape on every load cannot be
  // diffed against the run before it, and diffing two runs is what it exists for.
  it('is identical every time it is built', () => {
    expect(fixtureIntake(name)).toEqual(intake)
  })

  // Tone is stored on the row, not in the intake, so it cannot reach the prompt by
  // being overlooked.
  it('carries no tone, which is not part of the intake', () => {
    expect('tone' in intake).toBe(false)
  })

  it('keeps the client unnamed', () => {
    expect(intake.client_may_be_named).toBeUndefined()
    expect(intake.client_name).toBeUndefined()
  })
})

describe('the two branches', () => {
  it('"handover" is the contribution branch', () => {
    expect(evidenceBranch(fixtureIntake('handover'))).toBe('contribution')
  })

  it('"handover-measured" is the metric branch, with every component present', () => {
    expect(evidenceBranch(fixtureIntake('handover-measured'))).toBe('metric')
  })
})

describe('getFixture', () => {
  it('hands out a fresh copy, so one run mutating its state cannot leak into the next', () => {
    const a = getFixture('handover')
    a.state.text.title = 'CHANGED'
    a.state.decisions[0].decided = 'CHANGED'
    const b = getFixture('handover')
    expect(b.state.text.title).not.toBe('CHANGED')
    expect(b.state.decisions[0].decided).not.toBe('CHANGED')
  })

  it('recognises only its own names', () => {
    expect(isFixtureName('handover')).toBe(true)
    expect(isFixtureName('nope')).toBe(false)
    expect(isFixtureName(null)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// The branch gate, exercised against the case that was actually wrong.
// ---------------------------------------------------------------------------

describe('evidenceBranch', () => {
  const measured = (): Intake => fixtureIntake('handover-measured')

  it('routes on completeness, so a digit anywhere is no longer enough', () => {
    // The bug: any digit in the metrics answer put a project on the metric branch,
    // which then required six things the answer never contained. Here the answer
    // is FULL of digits and still incomplete — it has no source.
    const partial: Intake = { ...measured() }
    delete partial.baseline_source
    expect(evidenceBranch(partial)).toBe('contribution')
  })

  it.each(['measure', 'baseline_value', 'baseline_period', 'after_value', 'after_period', 'baseline_source', 'attribution_limit'] as const)(
    'drops to the contribution branch when %s is missing',
    (key) => {
      const i = measured()
      delete i[key]
      expect(evidenceBranch(i)).toBe('contribution')
    }
  )

  it('needs the two value fields to actually hold a number', () => {
    expect(evidenceBranch({ ...measured(), baseline_value: 'a lot' })).toBe('contribution')
    expect(evidenceBranch({ ...measured(), after_value: 'much less' })).toBe('contribution')
  })

  it('stays on the contribution branch when the toggle is off, whatever else is filled', () => {
    const i = measured()
    delete i.has_measurement
    expect(evidenceBranch(i)).toBe('contribution')
  })

  it('does not let shipping status decide it', () => {
    expect(evidenceBranch({ ...fixtureIntake('handover'), outcome_status: 'shipped' })).toBe('contribution')
  })

  // A row from before the rebuild collected one free-text answer and none of the
  // components. It cannot be complete, so it cannot be on the metric branch.
  it('puts a legacy row on the contribution branch, digits or not', () => {
    expect(
      evidenceBranch({ decisions: [], image_notes: [], metrics: 'Handover fell from 14 minutes to 7.' })
    ).toBe('contribution')
  })
})

describe('mixedFigure', () => {
  it('is null on the full metric branch, which handles the block itself', () => {
    expect(mixedFigure(fixtureIntake('handover-measured'))).toBeNull()
  })

  it('states one figure with its source when the block is partial', () => {
    const i = { ...fixtureIntake('handover-measured') }
    delete i.attribution_limit
    expect(mixedFigure(i)).toEqual({
      measure: 'Time from handover start to first patient reviewed',
      value: '7 minutes',
      period: 'June, four weeks',
      source: "The ward's own shift log, exported by their ops team",
    })
  })

  // A number whose source cannot be named invites a reader to check something that
  // cannot be checked, so it does not appear at all.
  it('is null without a source', () => {
    const i = { ...fixtureIntake('handover-measured') }
    delete i.attribution_limit
    delete i.baseline_source
    expect(mixedFigure(i)).toBeNull()
  })

  it('is null when there is no number to state', () => {
    const i = { ...fixtureIntake('handover-measured') }
    delete i.attribution_limit
    i.after_value = 'much less'
    i.baseline_value = 'a lot'
    expect(mixedFigure(i)).toBeNull()
  })

  it('is null when nothing was measured', () => {
    expect(mixedFigure(fixtureIntake('handover'))).toBeNull()
  })
})
