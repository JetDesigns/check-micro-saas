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

import type { SetExceptionDiagram, SetExceptionItem } from '@/lib/approach-diagram'

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
