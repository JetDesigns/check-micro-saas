import { describe, expect, it } from 'vitest'
import {
  orderOverlayCaption,
  orderOverlayRows,
  columnHeight,
  decisionSetCaption,
  rowCentre,
  sequenceCaption,
  sequenceConnectors,
  setExceptionCaption,
  setExceptionOrder,
} from './approach-layout'
import type {
  DecisionSetDiagram,
  OrderOverlayDiagram,
  SequenceCollapseDiagram,
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

// APPROACH-VISUAL-PRD.md §8.2's worked example, step for step.
const sequence = (over: Partial<SequenceCollapseDiagram> = {}): SequenceCollapseDiagram => {
  const before: SequenceCollapseDiagram['before'] = [
    { label: 'Select plan', fate: 'kept' },
    { label: 'Billing address', fate: 'kept' },
    { label: 'Card details', fate: 'kept' },
    { label: 'Review order', fate: 'removed' },
    { label: 'Confirm email', fate: 'removed' },
    { label: 'Place order', fate: 'kept' },
  ]
  return {
    template: 'sequence-collapse',
    before,
    after: before.filter((s) => s.fate === 'kept').map((s) => s.label),
    reason: null,
    text_equivalent: '',
    ...over,
  }
}

describe('sequence geometry', () => {
  // §5.2: "Pitch 36 in both columns, identical. This number is load-bearing:
  // connectors land on mark centres and any drift is visible immediately." The
  // PRD states its positions from the frame's top, which is 82 above the first
  // row; these are from the column's own top, so the two differ by that 82 and
  // by nothing else.
  it("lands on the row centres §8.2 lists, offset by the column's top", () => {
    const FRAME_TOP = 82
    expect([0, 1, 2, 3, 4, 5].map((i) => rowCentre(i) + FRAME_TOP)).toEqual([
      94, 130, 166, 202, 238, 274,
    ])
  })

  it('gives a column of six rows the height six marks and five gaps need', () => {
    expect(columnHeight(6)).toBe(5 * 36 + 24)
    expect(columnHeight(1)).toBe(24)
    expect(columnHeight(0)).toBe(0)
  })

  // §8.2: "three horizontal at y 94 / 130 / 166, one slanting from y 274 up to
  // y 202. The slant is the compression."
  it('draws one connector per survivor, three level and one slanting', () => {
    const FRAME_TOP = 82
    const drawn = sequenceConnectors(sequence()).map((c) => ({
      from: c.from + FRAME_TOP,
      to: c.to + FRAME_TOP,
    }))
    expect(drawn).toEqual([
      { from: 94, to: 94 },
      { from: 130, to: 130 },
      { from: 166, to: 166 },
      { from: 274, to: 202 },
    ])
    expect(drawn.filter((c) => c.from !== c.to)).toHaveLength(1)
  })

  it('draws nothing for a removed step', () => {
    expect(sequenceConnectors(sequence())).toHaveLength(4)
  })
})

describe('sequence caption', () => {
  // §5.2's formula, with its numerals and the designer's own capitalisation.
  // §8.2 renders the same caption as prose — "Six steps became four — review
  // order and…" — and the formula is what binds: spelling the counts out is
  // presentation, but lowercasing the labels would be editing what was typed.
  it('follows the formula and leaves the labels as they were typed', () => {
    expect(sequenceCaption(sequence())).toBe(
      '6 steps became 4 — Review order and Confirm email were removed entirely.'
    )
  })

  it('agrees with its count when only one step went', () => {
    const before = sequence().before.map((s, i) =>
      i === 4 ? { ...s, fate: 'kept' as const } : s
    )
    const one = sequence({ before, after: before.filter((s) => s.fate === 'kept').map((s) => s.label) })
    expect(sequenceCaption(one)).toContain('Review order was removed')
  })

  it("carries the designer's reason in place of the closing word", () => {
    expect(sequenceCaption(sequence({ reason: 'the card screen was the provider\'s' }))).toBe(
      "6 steps became 4 — Review order and Confirm email were removed because the card screen was the provider's."
    )
  })
})

describe('floor form caption', () => {
  const floor = (over: Partial<DecisionSetDiagram> = {}): DecisionSetDiagram => ({
    template: 'decision-set',
    decisions: [
      { label: 'Freeze the note at shift change', kind: 'change' },
      { label: 'Sort by escalation, not by room', kind: 'change' },
      { label: 'Hold escalated notes until acknowledged', kind: 'new' },
    ],
    new_count: 1,
    reason: null,
    text_equivalent: '',
    ...over,
  })

  it('names how many decisions built something that was not there', () => {
    expect(decisionSetCaption(floor())).toBe(
      '3 decisions, one of them building something that was not there before.'
    )
  })

  // A set with no exception has no rule to break. Saying so beats implying one.
  it('claims no exception where the designer marked none', () => {
    const none = floor({
      decisions: floor().decisions.map((d) => ({ ...d, kind: 'change' as const })),
      new_count: 0,
    })
    expect(decisionSetCaption(none)).toBe(
      '3 decisions, each a change to something that already existed.'
    )
    expect(decisionSetCaption(none)).not.toContain('not there')
  })

  it('reads as a plural when more than one was built', () => {
    expect(decisionSetCaption(floor({ new_count: 2 }))).toContain('2 of them building')
  })
})
