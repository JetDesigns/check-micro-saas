// How a diagram contract is laid out for drawing. Presentation, not truth.
//
// Apart from lib/approach-diagram.ts on purpose. That file answers "what is true
// about this project"; this one answers "where does it go on screen". The split
// is why the contract carries labels whole and no row order: the designer's
// order is the fact, and reading order is a thing a renderer decides.
//
// MEDIUM FOLLOWS GEOMETRY. §6 step 5 said "renderer produces SVG", written when
// the target was a PNG export. set-exception is a grid of labelled boxes, which
// HTML and CSS draw better than SVG does: text truncates to the MEASURED box
// rather than to a character count, the grid reflows at a narrow column instead
// of scaling 12px type down to 7, the type is selectable and reachable by a
// screen reader with no extra markup, and the studio's own tokens apply without
// being copied into the drawing. SVG is for geometry that needs real drawing —
// sequence-collapse's connectors — and that is where it will be used.

import type {
  OrderOverlayDiagram,
  SetExceptionDiagram,
  SetExceptionItem,
} from '@/lib/approach-diagram'

/**
 * Reading order for the grid: every reused mark, then every exception.
 *
 * §5.1 — "Emit every `reused` item first, then every `new` item, so the
 * exceptions form one unbroken run. Scattered exceptions have to be counted; an
 * unbroken run is read as one mass." Each run keeps the designer's own order
 * inside it, so nothing is sorted beyond the one split the form argues from.
 */
export function setExceptionOrder(items: readonly SetExceptionItem[]): SetExceptionItem[] {
  return [
    ...items.filter((i) => i.status === 'reused'),
    ...items.filter((i) => i.status === 'new'),
  ]
}

/**
 * The caption, from §5.1's formula.
 *
 * Two deviations from the formula as written, both grammar and neither
 * changing what is claimed:
 *
 *   - It is pluralised. `new_count` is 1 on a large share of real projects —
 *     the gate's floor is 1 — and the formula reads "1 needed new ones from
 *     scratch" there, which is the most common output of the most common case.
 *   - "pattern" agrees with its count for the same reason.
 *
 * Nothing else is added. §5.1: "Never add framing clauses the diagram does not
 * show."
 */
export function setExceptionCaption(c: SetExceptionDiagram): string {
  const reused = c.total - c.new_count
  const followed =
    reused === 1 ? '1 followed an existing pattern' : `${reused} followed existing patterns`
  const fresh =
    c.new_count === 1
      ? '1 needed a new one from scratch'
      : `${c.new_count} needed new ones from scratch`

  const head = `${c.total} ${c.total === 1 ? 'area' : 'areas'}, ${followed}, ${fresh}`
  // `reason` is stated by the designer or it is null. Never inferred (PRD §8).
  return c.reason ? `${head.slice(0, -'from scratch'.length)}from scratch — ${c.reason}.` : `${head}.`
}

// ---------------------------------------------------------------------------
// order-overlay
// ---------------------------------------------------------------------------
//
// THE ENCODING §5.3 SPECIFIES CANNOT BE DRAWN, so this is the one that replaces
// it. §5.3 and §8.3 want a legend, three slot fills and a keyed strip; §9.3
// forbids all three — gate 1 "There are no legends", gate 3 "Direct labelling
// over keyed fills", gate 4 "Two fill states maximum" — and §12 items 24 and 25
// repeat two of them as hard gates. The PRD's own header says §9 wins on
// structure, so §9 is what this follows. Open item 5 is what it closes.
//
// What replaces it, and why each part is legal:
//
//   - TWO fill states, not three, and on the one split §9 gate 4 names as
//     self-evident without being named: "present against absent". A cut section
//     is absent; everything still on the page is present. §4's `receded` is
//     already defined as "marks something that is gone".
//   - The category word sits ON the row it describes, which is gate 3's
//     requirement, and is what removes the need for the key gate 1 forbids.
//   - No legend anywhere.
//
// The fill is not made redundant by the label. The label says what one row is;
// the fill is what lets the eye see WHERE the absent rows fall without reading
// anything — and where they fall is the whole of what the finding claims. Drop
// the fill and this becomes the table of contents §5.3 warns about.
//
// Page order is never touched. §5.3: "Never sort or group rows. Rearranging the
// order destroys the finding."

/** The category that reads as absence. The three are fixed, so this is safe. */
export const ABSENT_CATEGORY = 'Cut'

export type OverlayRow = {
  label: string
  /** Absent where the designer left the section unsorted. Empty is data (§5.3). */
  category?: string
  /** Drawn `receded` rather than `default`: this one is gone. */
  absent: boolean
}

/**
 * The rows to draw, in the page's own order.
 *
 * No sorting and no grouping — the array is the page, and its index is the only
 * axis the diagram has.
 */
export function orderOverlayRows(d: OrderOverlayDiagram): OverlayRow[] {
  return d.sections.map((s) => ({
    label: s.label,
    ...(s.category ? { category: s.category } : {}),
    absent: s.category === ABSENT_CATEGORY,
  }))
}

/**
 * The caption, which §5.3 says IS the finding — "States the pattern, never the
 * composition."
 *
 * Only sentence-cased here. The designer wrote it as an answer to "what did you
 * notice about where they sat?", so it arrives lowercase and unpunctuated more
 * often than not, and §8.3's own good example is a capitalised sentence with a
 * full stop. Nothing is added to it and nothing is rephrased: §5.3's bad example
 * is a caption that states the composition, and composing one is exactly what
 * this must not do.
 */
export function orderOverlayCaption(d: OrderOverlayDiagram): string {
  const t = d.finding.trim()
  if (t === '') return ''
  const opened = t[0].toUpperCase() + t.slice(1)
  return /[.!?]$/.test(opened) ? opened : `${opened}.`
}
