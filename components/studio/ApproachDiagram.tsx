import { isSetException, type ApproachDiagram as Contract } from '@/lib/approach-diagram'
import {
  orderOverlayCaption,
  orderOverlayRows,
  setExceptionCaption,
  setExceptionOrder,
} from '@/lib/approach-layout'

// The Approach diagram, drawn from the contract the pipeline attached.
//
// Nothing here decides anything. The contract is derived from the designer's own
// answers in lib/approach-diagram.ts and gated there; this draws what survived,
// or nothing. A project whose material supports no diagram renders Approach as
// prose with no trace of the absence (§9.7) — no placeholder, no empty frame, no
// caption without a graphic.
//
// HTML AND CSS, NOT SVG, and for this geometry that is the better medium rather
// than the lazier one — the argument is at the top of lib/approach-layout.ts.
// Two things it buys that are specified behaviour rather than conveniences:
// labels truncate to the MEASURED box (PRD §4's limit is a character floor, and
// 14 wide characters are not 14 narrow ones), and the grid reflows at a narrow
// column instead of scaling 12px type down to 7.
//
// Marks are a fixed 120 wide and the row wraps, which is what produces §5.1's
// "four per row, centred" at the 568 column and two per row at 343 — without a
// media query, because the arithmetic is the same arithmetic.
//
// 120 and not 121: the frame's own 1px border is inside its 568, so the content
// box is 568 − 2 − 48 = 518, and four marks with three 12px gaps have 482 to
// share. 121 was the exact-fit figure against 520 and it wrapped 3 + 1 on the
// first render — a layout that depends on an exact equality has no tolerance
// for the rounding underneath it. The 14-character limit is unchanged: the text
// box goes from 97 to 96, and 96 ÷ 6.64 is still 14.

const FRAME =
  'flex flex-col items-center gap-8 rounded-[var(--studio-r-lg)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] px-6 py-8'

// Height 24 and radius 4 from §4. box-border so the 1px border is inside the 24
// and every mark measures the same whether or not its border is visible.
const MARK =
  'box-border flex h-6 items-center overflow-hidden rounded-[var(--studio-r-sm)] border px-3 text-[12px] leading-[1.2] tracking-[-0.12px] whitespace-nowrap'

const DEFAULT_MARK =
  'border-[var(--studio-border)] bg-[var(--studio-bg-primary)] text-[var(--studio-text)]'

// §4's `receded`, which the spec defines as marking something that is gone, and
// warns must stay LIGHTER than what surrounds it: "a solid grey fill gives
// absence more visual mass than presence and inverts the reading". So the fill
// does not change — the ink does.
const RECEDED_MARK =
  'border-[var(--studio-border)] bg-[var(--studio-bg-primary)] text-[var(--studio-text-soft)]'

// The exception's border is its own fill rather than none, so it occupies the
// same 121 × 24 as everything else. §4 gives it no border; a missing one would
// make the mark a pixel smaller in each direction and break the row.
const EXCEPTION_MARK =
  'border-[var(--studio-brand)] bg-[var(--studio-brand)] text-[var(--studio-text-inverse)]'

export function ApproachDiagram({ diagram }: { diagram: Contract | null }) {
  if (!diagram) return null

  if (!isSetException(diagram)) return <OrderOverlay diagram={diagram} />

  const marks = setExceptionOrder(diagram.items)

  return (
    <figure className={FRAME} aria-label={diagram.text_equivalent}>
      {/* Gap 12 between marks, and 12 between rows: with a 24 mark that is
          §5.1's pitch of 36. */}
      <div className="flex w-full flex-wrap justify-center gap-3" aria-hidden>
        {marks.map((item) => (
          <div
            key={item.label}
            title={item.label}
            className={`${MARK} w-[120px] justify-center ${
              item.status === 'new' ? EXCEPTION_MARK : DEFAULT_MARK
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* §4: width 340, centred, Text/Secondary, Body small, leading 1.3. The
          only sentence in the frame. */}
      <figcaption className="max-w-[340px] text-center text-[12px] leading-[1.3] text-[var(--studio-text-soft)]">
        {setExceptionCaption(diagram)}
      </figcaption>
    </figure>
  )
}

/**
 * A page's sections in their own order, with what happened to each.
 *
 * ONE MARK PER ROW AND THE ORDER NEVER MOVES — §5.3: "Never sort or group rows.
 * Rearranging the order destroys the finding." The row's index is the page's
 * position, which is the only axis this geometry has.
 *
 * Two fill states and a word on every row, which is §9's encoding rather than
 * §5.3's. The reasoning is at the bottom of lib/approach-layout.ts; in short,
 * the strip's fill shows WHERE the removed sections fall without anything being
 * read, and the word on each row removes the need for the key that §9 gate 1
 * forbids.
 *
 * Marks run the full width rather than sizing to their label: §4 rule 6 keeps
 * mark size uniform, and a ragged right edge down a single column would read as
 * a second axis — length standing for something — which rule 4 forbids.
 */
function OrderOverlay({ diagram }: { diagram: Extract<Contract, { template: 'order-overlay' }> }) {
  const rows = orderOverlayRows(diagram)

  return (
    <figure className={FRAME} aria-label={diagram.text_equivalent}>
      {/* 400 is the strip plus its gutter: §5.3's 332 mark, a 12 gap and a 56
          gutter. It is a MAX rather than a fixed width, so the mark gives way at
          a narrow column instead of running off the left edge — which a fixed
          332 did, silently, because content overflowing to the left of the
          viewport never produces a scrollbar to notice it by. */}
      <div className="flex w-full max-w-[400px] flex-col gap-3" aria-hidden>
        {rows.map((row) => (
          // The mark and the gutter are both constrained, so the strip's left
          // and right edges run straight all the way down. Centring each pair
          // instead would let every row shift by the width of its own category
          // word, and a strip whose edges wander cannot be read for where
          // anything falls — which is the only thing it is for.
          <div key={row.label} className="flex w-full items-center gap-3">
            <div
              title={row.label}
              className={`${MARK} min-w-0 flex-1 ${row.absent ? RECEDED_MARK : DEFAULT_MARK}`}
            >
              <span className="overflow-hidden text-ellipsis">{row.label}</span>
            </div>
            {/* Outside the mark, not inside it. §5.3 puts what happened to a
                section beside the section rather than in it, and Text/Secondary
                keeps one thing at full ink per row (§4 rule 1). */}
            <span className="w-14 shrink-0 text-[12px] leading-[1.2] tracking-[-0.12px] text-[var(--studio-text-soft)]">
              {row.category}
            </span>
          </div>
        ))}
      </div>

      <figcaption className="max-w-[340px] text-center text-[12px] leading-[1.3] text-[var(--studio-text-soft)]">
        {orderOverlayCaption(diagram)}
      </figcaption>
    </figure>
  )
}
