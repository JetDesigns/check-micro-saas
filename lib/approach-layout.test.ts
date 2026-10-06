import { describe, expect, it } from 'vitest'
import {
  orderOverlayCaption,
  orderOverlayRows,
  setExceptionCaption,
  setExceptionOrder,
} from './approach-layout'
import type {
  OrderOverlayDiagram,
  SetExceptionDiagram,
  SetExceptionItem,
} from './approach-diagram'

const items = (...spec: [string, 'reused' | 'new'][]): SetExceptionItem[] =>
  spec.map(([label, status]) => ({ label, status }))

const contract = (over: Partial<SetExceptionDiagram> = {}): SetExceptionDiagram => ({
  template: 'set-exception',
  items: items(['Orders', 'reused'], ['Menu', 'reused'], ['Kitchen', 'reused'], ['Shifts', 'new']),
  total: 4,
  new_count: 1,
  reason: null,
  text_equivalent: '',
  ...over,
})

describe('grid order', () => {
  // Scattered exceptions have to be counted; an unbroken run is read as one mass.
  it('puts every exception after every reused mark', () => {
    const mixed = items(
      ['Orders', 'reused'], ['Shifts', 'new'], ['Menu', 'reused'], ['Tables', 'new']
    )
    expect(setExceptionOrder(mixed).map((i) => i.status)).toEqual([
      'reused', 'reused', 'new', 'new',
    ])
  })

  // Only the one split the form argues from. Nothing else is sorted.
  it("keeps the designer's own order inside each run", () => {
    const mixed = items(
      ['Zebra', 'reused'], ['Shifts', 'new'], ['Apple', 'reused'], ['Tables', 'new']
    )
    expect(setExceptionOrder(mixed).map((i) => i.label)).toEqual([
      'Zebra', 'Apple', 'Shifts', 'Tables',
    ])
  })

  it('keeps every mark, dropping none', () => {
    expect(setExceptionOrder(contract().items)).toHaveLength(4)
  })
})

describe('caption', () => {
  // The gate's floor for new_count is 1, so this is the commonest page on the
  // product and the formula as written reads "1 needed new ones" there.
  it('agrees with its count when exactly one part had no precedent', () => {
    expect(setExceptionCaption(contract())).toBe(
      '4 areas, 3 followed existing patterns, 1 needed a new one from scratch.'
    )
  })

  it('reads as a plural when more than one did', () => {
    expect(setExceptionCaption(contract({ new_count: 2 }))).toBe(
      '4 areas, 2 followed existing patterns, 2 needed new ones from scratch.'
    )
  })

  it('agrees when exactly one part followed what was there', () => {
    expect(setExceptionCaption(contract({ total: 2, new_count: 1 }))).toContain(
      '1 followed an existing pattern'
    )
  })

  // Stated by the designer or absent. The caption never invents one.
  it("carries the designer's reason when there is one", () => {
    expect(setExceptionCaption(contract({ reason: 'the kitchen screen was another vendor' }))).toBe(
      '4 areas, 3 followed existing patterns, 1 needed a new one from scratch — the kitchen screen was another vendor.'
    )
  })

  it('adds no framing clause when there is none', () => {
    expect(setExceptionCaption(contract())).not.toContain('—')
  })
})

const overlay = (over: Partial<OrderOverlayDiagram> = {}): OrderOverlayDiagram => ({
  template: 'order-overlay',
  sections: [
    { label: 'Headline' },
    { label: 'Plan prices', category: 'Kept' },
    { label: 'Feature grid', category: 'Cut' },
    { label: 'FAQ', category: 'Cut' },
    { label: 'Book a demo' },
  ],
  categories: ['Cut', 'Kept'],
  finding: 'the two sections nobody asked for sat in the middle',
  reason: null,
  text_equivalent: '',
  ...over,
})

describe('overlay rows', () => {
  // "Never sort or group rows. Rearranging the order destroys the finding."
  it('keeps the page order exactly as given', () => {
    expect(orderOverlayRows(overlay()).map((r) => r.label)).toEqual([
      'Headline', 'Plan prices', 'Feature grid', 'FAQ', 'Book a demo',
    ])
  })

  // Two fill states, on the one split §9 gate 4 calls self-evident: a cut
  // section is absent, everything still on the page is present.
  it('marks only the cut sections absent', () => {
    expect(orderOverlayRows(overlay()).map((r) => r.absent)).toEqual([
      false, false, true, true, false,
    ])
  })

  it('carries no category for a section the designer left unsorted', () => {
    const rows = orderOverlayRows(overlay())
    expect(rows[0].category).toBeUndefined()
    expect(rows[0].absent).toBe(false)
  })
})

describe('overlay caption', () => {
  it('is the finding, opened as a sentence and closed with a stop', () => {
    expect(orderOverlayCaption(overlay())).toBe(
      'The two sections nobody asked for sat in the middle.'
    )
  })

  it('leaves punctuation the designer already wrote', () => {
    expect(orderOverlayCaption(overlay({ finding: 'Everything cut sat in the middle.' }))).toBe(
      'Everything cut sat in the middle.'
    )
  })

  // §5.3's bad example is a caption that states the composition. Composing one
  // is the thing this must never do, so nothing is added to what was typed.
  it('adds no words of its own', () => {
    const out = orderOverlayCaption(overlay())
    expect(out.toLowerCase()).toContain(overlay().finding.toLowerCase())
    expect(out).not.toMatch(/\d/)
  })
})
