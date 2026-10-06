import { describe, expect, it } from 'vitest'
import { setExceptionCaption, setExceptionOrder } from './approach-layout'
import type { SetExceptionDiagram, SetExceptionItem } from './approach-diagram'

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
