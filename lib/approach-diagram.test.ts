import { describe, expect, it } from 'vitest'
import {
  buildApproachDiagram,
  gateSetException,
  truncateLabel,
  type ApproachDiagram,
} from './approach-diagram'
import { fixtureIntake } from '@/lib/fixtures/focused-fix-intake'
import type { Intake } from '@/types/database'

// One test per gate, plus the PRD's own worked example, which is the only thing
// here that proves the thresholds were read rather than invented.

const contract = (over: Partial<ApproachDiagram> = {}): ApproachDiagram => ({
  template: 'set-exception',
  items: [
    { label: 'Reports', status: 'reused' },
    { label: 'Projects', status: 'reused' },
    { label: 'Lists', status: 'reused' },
    { label: 'Team', status: 'reused' },
    { label: 'Settings', status: 'reused' },
    { label: 'Canvassing', status: 'new' },
    { label: 'Messages', status: 'new' },
    { label: 'Data', status: 'new' },
  ],
  total: 8,
  new_count: 3,
  reason: null,
  text_equivalent: 'Eight parts were worked on; three had no precedent.',
  ...over,
})

const intake = (over: Partial<Intake> = {}): Intake => ({
  ...fixtureIntake('handover'),
  ...over,
})

describe("the PRD's worked example", () => {
  // APPROACH-VISUAL-PRD.md §8.1, item for item. If this fails, either the gates
  // drifted from the document or the document moved without the code following.
  it('passes every gate exactly as written', () => {
    expect(gateSetException(contract())).toEqual([])
  })

  it('fails when a required field is missing', () => {
    const missing = { ...contract(), items: [] } as ApproachDiagram
    expect(gateSetException(missing).length).toBeGreaterThan(0)
  })
})

describe('gates', () => {
  it('refuses a set of three', () => {
    const c = contract({ items: contract().items.slice(0, 3), total: 3, new_count: 1 })
    c.items[2].status = 'new'
    expect(gateSetException(c).join(' ')).toContain('4 to 8')
  })

  it('refuses a set of nine', () => {
    const items = [...contract().items, { label: 'Billing', status: 'reused' as const }]
    expect(gateSetException(contract({ items, total: 9 })).join(' ')).toContain('4 to 8')
  })

  it('refuses a set with no exception, because uniform data is not a finding', () => {
    const items = contract().items.map((i) => ({ ...i, status: 'reused' as const }))
    expect(gateSetException(contract({ items, new_count: 0 })).join(' ')).toContain('between 1')
  })

  // The upper bound is the argument of the form: when half the set is
  // exceptional the set has no rule left to break.
  it('refuses a set that is more than half exceptional', () => {
    const items = contract().items.map((i, n) => ({ ...i, status: n < 5 ? ('new' as const) : ('reused' as const) }))
    expect(gateSetException(contract({ items, new_count: 5 })).join(' ')).toContain('half of 8')
  })

  it('refuses a label that names the designer process', () => {
    const items = [...contract().items]
    items[0] = { label: 'Discovery', status: 'reused' }
    expect(gateSetException(contract({ items })).join(' ')).toContain('process')
  })

  it('catches a count that disagrees with the items', () => {
    expect(gateSetException(contract({ new_count: 2 })).join(' ')).toContain('disagree')
  })
})

describe('labels', () => {
  it('truncates past eighteen characters rather than refusing', () => {
    expect(truncateLabel('Campaign performance')).toBe('Campaign performa…')
    expect(truncateLabel('Orders')).toBe('Orders')
  })
})

describe('building from the intake', () => {
  it('builds from what the designer said they worked on', () => {
    const built = buildApproachDiagram(intake())
    expect(built?.template).toBe('set-exception')
    expect(built?.total).toBe(4)
    expect(built?.new_count).toBe(1)
    expect(built?.items.find((i) => i.status === 'new')?.label).toBe('Escalations')
  })

  // The set is the work's reach, not the whole product: eight parts were named
  // and four were worked on.
  it('leaves out parts that were named but not worked on', () => {
    const labels = buildApproachDiagram(intake())?.items.map((i) => i.label)
    expect(labels).not.toContain('Medication chart')
  })

  it('is null when nothing was marked', () => {
    expect(buildApproachDiagram(intake({ product_areas_worked: [] }))).toBeNull()
  })

  // Droppable, not retryable. A project below the gate simply has no diagram.
  it('is null when the set is too small, rather than raising anything', () => {
    const thin = intake({ product_areas_worked: ['Orders', 'Menu'], product_areas_new: ['Menu'] })
    expect(buildApproachDiagram(thin)).toBeNull()
  })

  it('never invents a reason', () => {
    expect(buildApproachDiagram(intake())?.reason).toBeNull()
  })

  it('ships a text equivalent that is not a list of the labels', () => {
    const text = buildApproachDiagram(intake())?.text_equivalent ?? ''
    expect(text).toContain('no precedent')
    expect(text.length).toBeGreaterThan(40)
  })
})
