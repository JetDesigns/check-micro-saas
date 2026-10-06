import {
  isDecisionSet,
  isOrderOverlay,
  isSetException,
  type ApproachDiagram as Contract,
} from '@/lib/approach-diagram'
import {
  MARK_HEIGHT,
  ROW_PITCH,
  columnHeight,
  decisionSetCaption,
  orderOverlayCaption,
  orderOverlayRows,
  sequenceCaption,
  sequenceConnectors,
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

  if (isOrderOverlay(diagram)) return <OrderOverlay diagram={diagram} />
  if (isDecisionSet(diagram)) return <DecisionSet diagram={diagram} />
  if (!isSetException(diagram)) return <SequenceCollapse diagram={diagram} />

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

// §4's `emphasised`: the only full-weight element in the frame (§5.2).
const EMPHASISED_MARK =
  'border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] text-[var(--studio-text)]'

const AXIS = 'text-[12px] leading-[1.2] tracking-[-0.12px] text-[var(--studio-text-soft)]'

/**
 * One flow before and after, with the steps that survived joined across.
 *
 * THE SLANT OF THE CONNECTORS IS THE COMPRESSION (§5.2), which is the whole
 * reason the right column starts at the same top as the left and simply ends
 * earlier: "The space below the shorter right column stays empty. Never centre
 * the columns against each other."
 *
 * The connectors are SVG because they are lines between two points, which is
 * the one thing in this system HTML cannot draw. Everything else stays HTML, so
 * the labels still truncate to their measured box and the columns still give
 * way at a narrow screen.
 *
 * The SVG stretches horizontally only — `preserveAspectRatio="none"` against a
 * viewBox 100 units wide — so the channel can be any width the layout leaves it
 * while the row centres stay in exact pixel step with the marks beside them.
 * §4's pitch of 36 is load-bearing here: a connector that misses a mark centre
 * is visible immediately, so both read it from `rowCentre`.
 */
function SequenceCollapse({
  diagram,
}: {
  diagram: Extract<Contract, { template: 'sequence-collapse' }>
}) {
  const connectors = sequenceConnectors(diagram)
  const height = columnHeight(diagram.before.length)

  return (
    <figure className={FRAME} aria-label={diagram.text_equivalent}>
      <div className="w-full max-w-[342px]" aria-hidden>
        {/* minmax(0,1fr) rather than 1fr: a bare 1fr carries an automatic
            min-content floor, so a long step name forces its column past its
            share and the pair overflows the frame — which is what happened at
            the 343 column before this. The floor has to be stated as 0 for the
            label to give way and truncate instead.

            At the 568 column the 342 cap leaves (342 - 84) / 2 = 129 per
            column, which is §5.2's figure exactly. */}
        <div className="grid grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] gap-0">
          <span className={AXIS}>Before</span>
          <span />
          <span className={AXIS}>After</span>
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] items-start">
          <div className="flex flex-col" style={{ gap: ROW_PITCH - MARK_HEIGHT }}>
            {diagram.before.map((step) => (
              <div
                key={step.label}
                title={step.label}
                className={`${MARK} ${step.fate === 'removed' ? RECEDED_MARK : DEFAULT_MARK}`}
              >
                <span className="overflow-hidden text-ellipsis">{step.label}</span>
              </div>
            ))}
          </div>

          <svg
            width="100%"
            height={height}
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {connectors.map((c) => (
              <line
                key={`${c.from}-${c.to}`}
                x1={0}
                y1={c.from}
                x2={100}
                y2={c.to}
                stroke="var(--studio-border-strong)"
                strokeWidth={1}
                strokeDasharray="1 3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Starts at the same top and ends earlier. The empty space below it
              is the reduction, and centring the two columns would delete it. */}
          <div className="flex flex-col" style={{ gap: ROW_PITCH - MARK_HEIGHT }}>
            {diagram.after.map((label) => (
              <div key={label} title={label} className={`${MARK} ${EMPHASISED_MARK}`}>
                <span className="overflow-hidden text-ellipsis">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="max-w-[340px] text-center text-[12px] leading-[1.3] text-[var(--studio-text-soft)]">
        {sequenceCaption(diagram)}
      </figcaption>
    </figure>
  )
}

// The floor form's mark. Everything the shared MARK has except the fixed
// 24 height and the single line, both of which it has to give up — see the
// note in `DecisionSet`.
const FLOOR_MARK =
  'box-border flex min-h-6 items-center rounded-[var(--studio-r-sm)] border px-3 py-1 text-[12px] leading-[1.3] tracking-[-0.12px]'

/**
 * The decisions themselves, with the ones that built something marked.
 *
 * The floor form. It draws only when none of the three real templates fired,
 * and what it costs is written out above `gateDecisionSet` in
 * lib/approach-diagram.ts rather than here.
 *
 * A column rather than set-exception's grid, because these labels are the
 * designer's own decision sentences and a 120px grid mark would show four
 * words of one.
 *
 * IT WRAPS TO TWO LINES, which is the one place any template departs from §4's
 * fixed 24 mark height, and the departure is the point. The other three label
 * marks with product nouns — "Patient Notes", "Plan prices" — which fit a line
 * with room. These are sentences, and a real page came back reading "I
 * redesign entire page and I wanted to make the page…", where the ellipsis
 * took the half that said anything. §12 item 25 forbids rewriting them — they
 * are the designer's own words — so the height gives way instead. Past two
 * lines it still clips, and the full sentence stays on the title and in the
 * text equivalent.
 *
 * Two fills AND a word, which §9 allows together: the fill shows the
 * exceptions as one mass, and the word is what names them, so no key is needed
 * (§9.3 gates 3 and 4).
 */
function DecisionSet({ diagram }: { diagram: Extract<Contract, { template: 'decision-set' }> }) {
  // Where nothing was built new the gutter is empty on every row, so it is not
  // drawn at all rather than reserved against a word that never comes.
  const hasGutter = diagram.new_count > 0

  return (
    <figure className={FRAME} aria-label={diagram.text_equivalent}>
      <div className="flex w-full max-w-[400px] flex-col gap-3" aria-hidden>
        {diagram.decisions.map((d) => (
          <div key={d.label} className="flex w-full items-start gap-3">
            <div
              title={d.label}
              className={`${FLOOR_MARK} min-w-0 flex-1 ${
                d.kind === 'new' ? EXCEPTION_MARK : DEFAULT_MARK
              }`}
            >
              <span className="line-clamp-2">{d.label}</span>
            </div>
            {hasGutter && (
              <span className="w-14 shrink-0 py-1 text-[12px] leading-[1.3] tracking-[-0.12px] text-[var(--studio-text-soft)]">
                {d.kind === 'new' ? 'New' : ''}
              </span>
            )}
          </div>
        ))}
      </div>

      <figcaption className="max-w-[340px] text-center text-[12px] leading-[1.3] text-[var(--studio-text-soft)]">
        {decisionSetCaption(diagram)}
      </figcaption>
    </figure>
  )
}
