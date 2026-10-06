import { describe, expect, it } from 'vitest'
import {
  buildApproachDiagram,
  gateOrderOverlay,
  gateSetException,
  isOrderOverlay,
  isSetException,
  truncateLabel,
  type ApproachDiagram,
  type OrderOverlayDiagram,
  type SetExceptionDiagram,
} from './approach-diagram'
import { fixtureIntake } from '@/lib/fixtures/focused-fix-intake'
import type { Intake, PageSection } from '@/types/database'

// One test per gate, plus each template's own worked example from the PRD,
// which is the only thing here that proves the thresholds were read rather than
// invented.

const contract = (over: Partial<SetExceptionDiagram> = {}): SetExceptionDiagram => ({
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

// APPROACH-VISUAL-PRD.md §8.3's worked example, the seven-section landing page.
const overlay = (over: Partial<OrderOverlayDiagram> = {}): OrderOverlayDiagram => ({
  template: 'order-overlay',
  sections: [
    { label: 'Nav', category: 'Kept' },
    { label: 'Hero', category: 'Added' },
    { label: 'Social proof', category: 'Added' },
    { label: 'Comparison table', category: 'Cut' },
    { label: 'Testimonials', category: 'Cut' },
    { label: 'FAQ', category: 'Kept' },
    { label: 'Closing CTA', category: 'Added' },
  ],
  categories: ['Added', 'Cut', 'Kept'],
  finding: 'everything cut sat in the middle of the page',
  reason: null,
  text_equivalent: 'Seven sections, and the two that were cut sat in the middle.',
  ...over,
})

const intake = (over: Partial<Intake> = {}): Intake => ({
  ...fixtureIntake('handover'),
  ...over,
})

// The same seven sections as intake data rather than as a contract, so the
// builder is exercised over what the wizard actually stores.
const PAGE: PageSection[] = [
  { label: 'Nav', fate: 'kept' },
  { label: 'Hero', fate: 'added' },
  { label: 'Social proof', fate: 'added' },
  { label: 'Comparison table', fate: 'cut' },
  { label: 'Testimonials', fate: 'cut' },
  { label: 'FAQ', fate: 'kept' },
  { label: 'Closing CTA', fate: 'added' },
]

/** A page project: the parts question was never asked, so its keys are absent. */
const pageIntake = (over: Partial<Intake> = {}): Intake => ({
  ...fixtureIntake('handover'),
  product_areas: undefined,
  product_areas_worked: undefined,
  product_areas_new: undefined,
  page_sections_ordered: PAGE,
  page_pattern: 'everything cut sat in the middle of the page',
  ...over,
})

// Narrowing helpers. An optional chain never narrows a union, and a cast would
// let a future third template through silently.
function asSetException(d: ApproachDiagram | null): SetExceptionDiagram {
  if (!d || !isSetException(d)) throw new Error(`expected set-exception, got ${d?.template ?? 'null'}`)
  return d
}
function asOrderOverlay(d: ApproachDiagram | null): OrderOverlayDiagram {
  if (!d || !isOrderOverlay(d)) throw new Error(`expected order-overlay, got ${d?.template ?? 'null'}`)
  return d
}

describe("the PRD's worked examples", () => {
  // APPROACH-VISUAL-PRD.md §8.1, item for item. If this fails, either the gates
  // drifted from the document or the document moved without the code following.
  it('passes every set-exception gate exactly as written', () => {
    expect(gateSetException(contract())).toEqual([])
  })

  // §8.3, the same way: seven sections, three categories, "Added" across three.
  it('passes every order-overlay gate exactly as written', () => {
    expect(gateOrderOverlay(overlay())).toEqual([])
  })

  it('fails when a required field is missing', () => {
    expect(gateSetException(contract({ items: [] })).length).toBeGreaterThan(0)
    expect(gateOrderOverlay(overlay({ sections: [] })).length).toBeGreaterThan(0)
  })
})

describe('set-exception gates', () => {
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

describe('order-overlay gates', () => {
  it('refuses a page of four sections', () => {
    const sections = overlay().sections.slice(0, 4)
    expect(gateOrderOverlay(overlay({ sections })).join(' ')).toContain('the page has to hold 5 to 8')
  })

  it('refuses a page of nine sections', () => {
    const sections = [...overlay().sections, { label: 'Footer', category: 'Kept' }, { label: 'Banner', category: 'Kept' }]
    expect(gateOrderOverlay(overlay({ sections })).join(' ')).toContain('the page has to hold 5 to 8')
  })

  it('refuses one category, because one colour down the page says nothing', () => {
    const sections = overlay().sections.map((s) => ({ ...s, category: 'Kept' }))
    expect(gateOrderOverlay(overlay({ sections, categories: ['Kept'] })).join(' ')).toContain(
      'there have to be 2 to 3 of them'
    )
  })

  it('refuses a section with no label', () => {
    const sections = [...overlay().sections]
    sections[0] = { label: '  ', category: 'Kept' }
    expect(gateOrderOverlay(overlay({ sections })).join(' ')).toContain('a section has no label')
  })

  it('refuses a category on a section that is not in the list', () => {
    const sections = [...overlay().sections]
    sections[0] = { label: 'Nav', category: 'Moved' }
    expect(gateOrderOverlay(overlay({ sections })).join(' ')).toContain('and not in categories')
  })

  // §8.3's wrong-render table: a legend promising a key the strip never uses.
  it('refuses a category that no section carries', () => {
    const sections = overlay().sections.map((s) => (s.category === 'Cut' ? { ...s, category: 'Kept' } : s))
    expect(gateOrderOverlay(overlay({ sections })).join(' ')).toContain('is in categories and on no section')
  })

  // Reachable only alongside the section-count gate: five or more sections
  // across at most three categories always repeats one, by pigeonhole. It is
  // kept because §5.3 states it and because it guards a hand-built contract.
  it('refuses a strip with no repeat and no gap, which is a table of contents', () => {
    const sections = [
      { label: 'Nav', category: 'Kept' },
      { label: 'Hero', category: 'Added' },
      { label: 'Testimonials', category: 'Cut' },
    ]
    expect(gateOrderOverlay(overlay({ sections })).join(' ')).toContain('no pattern to see')
  })

  it('accepts a gap instead of a repeat, because an unsorted section is data', () => {
    const sections = [
      { label: 'Nav', category: 'Kept' },
      { label: 'Hero', category: 'Added' },
      { label: 'Social proof' },
      { label: 'Testimonials' },
      { label: 'Closing CTA' },
    ]
    expect(gateOrderOverlay(overlay({ sections, categories: ['Added', 'Kept'] }))).toEqual([])
  })

  it('refuses a contract with no finding, because the caption is the finding', () => {
    expect(gateOrderOverlay(overlay({ finding: '   ' })).join(' ')).toContain('there is no finding')
  })

  it('refuses a finding past the caption limit rather than cutting it', () => {
    expect(gateOrderOverlay(overlay({ finding: 'x'.repeat(121) })).join(' ')).toContain(
      'rejected rather than cut'
    )
  })
})

describe('labels', () => {
  it('truncates past eighteen characters rather than refusing', () => {
    expect(truncateLabel('Campaign performance')).toBe('Campaign performa…')
    expect(truncateLabel('Orders')).toBe('Orders')
  })
})

describe('building set-exception from the intake', () => {
  it('builds from what the designer said they worked on', () => {
    const built = asSetException(buildApproachDiagram(intake()))
    expect(built.total).toBe(4)
    expect(built.new_count).toBe(1)
    expect(built.items.find((i) => i.status === 'new')?.label).toBe('Escalations')
  })

  // The set is the work's reach, not the whole product: eight parts were named
  // and four were worked on.
  it('leaves out parts that were named but not worked on', () => {
    const labels = asSetException(buildApproachDiagram(intake())).items.map((i) => i.label)
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

describe('building order-overlay from the intake', () => {
  it('keeps the page order the designer typed, never a ranking', () => {
    const built = asOrderOverlay(buildApproachDiagram(pageIntake()))
    expect(built.sections.map((s) => s.label)).toEqual([
      'Nav',
      'Hero',
      'Social proof',
      'Comparison table',
      'Testimonials',
      'FAQ',
      'Closing CTA',
    ])
  })

  // Derived from the fates used, not from the three the form offers: an empty
  // category would promise a key the strip never uses.
  it('names only the categories that a section actually carries', () => {
    const kept = PAGE.map((s) => (s.fate === 'cut' ? { label: s.label, fate: 'kept' as const } : s))
    const built = asOrderOverlay(buildApproachDiagram(pageIntake({ page_sections_ordered: kept })))
    expect(built.categories).toEqual(['Added', 'Kept'])
  })

  it('carries no category for a section left unmarked, because the gap is data', () => {
    const withGap = PAGE.map((s) => (s.label === 'Nav' ? { label: 'Nav' } : s))
    const built = asOrderOverlay(buildApproachDiagram(pageIntake({ page_sections_ordered: withGap })))
    expect(built.sections[0]).toEqual({ label: 'Nav' })
  })

  it('takes the finding from the answer and never invents one', () => {
    expect(buildApproachDiagram(pageIntake({ page_pattern: '  ' }))).toBeNull()
    expect(asOrderOverlay(buildApproachDiagram(pageIntake())).finding).toBe(
      'everything cut sat in the middle of the page'
    )
  })

  it('ships a text equivalent carrying the order and the pattern', () => {
    const text = asOrderOverlay(buildApproachDiagram(pageIntake())).text_equivalent
    expect(text).toContain('Nav, Hero, Social proof')
    expect(text).toContain('the middle of the page')
  })

  it('is null when the page has too few sections, rather than raising anything', () => {
    const thin = pageIntake({ page_sections_ordered: PAGE.slice(0, 4) })
    expect(buildApproachDiagram(thin)).toBeNull()
  })
})

describe('choosing between the two', () => {
  it('prefers set-exception when both contracts pass', () => {
    const both = pageIntake({
      product_areas_worked: ['Ward Board', 'Patient Notes', 'Handover list', 'Escalations'],
      product_areas_new: ['Escalations'],
    })
    expect(asSetException(buildApproachDiagram(both)).template).toBe('set-exception')
  })

  // The case this round exists for. Under PRD §6 steps 3 and 4 as originally
  // written, set-exception is the only COMPLETE contract, so it is selected and
  // only then gated — and the overlay that would have drawn is never attempted.
  // Gating both and preferring among the survivors is what makes this a diagram
  // instead of nothing.
  it('falls through to order-overlay when the set-exception gate fails', () => {
    const failing = pageIntake({
      product_areas_worked: ['Orders', 'Menu'],
      product_areas_new: ['Menu'],
    })
    expect(asOrderOverlay(buildApproachDiagram(failing)).template).toBe('order-overlay')
  })

  it('is null when neither passes, with no fallback form', () => {
    const neither = pageIntake({
      product_areas_worked: ['Orders', 'Menu'],
      product_areas_new: ['Menu'],
      page_sections_ordered: PAGE.slice(0, 3),
    })
    expect(buildApproachDiagram(neither)).toBeNull()
  })
})
