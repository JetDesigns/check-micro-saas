// Axonometric diagrams for the feature cards.
//
// Three rules hold these together, and each one replaced something that read
// as generic:
//
// 1. LONG LABELS ARE HORIZONTAL, on a leader. Skewing text into the drawing
//    plane looks technical only while the string is short — the reference does
//    it with "88K". Run "REQUIREMENT" down a 30° slope at 6px and it stops
//    being readable, which is a real cost for a decorative gain. Short numeric
//    tokens stay in-plane; words get a leader line, the way a drawing does it.
//
// 2. ONE THING IS EMPHASISED per figure, tinted with `accent`. Everything at
//    the same weight is the same as nothing being weighted: the eye has no
//    entry point and the drawing reads as texture.
//
// 3. THE FORM CARRIES THE MEANING. Boxes arranged in isometric are the stock
//    illustration cliché. A stack of equal slabs with one missing says
//    "omitted"; lines of type that are all the same length say "machine
//    -written". Those are drawings of the claim, not shapes beside it.
//
// Projection is standard 2:1 axonometric: x runs right-and-down, y runs
// left-and-down, z is up. Coordinates are grid units.

const K = 17
const COS30 = 0.866
const CX = 100
const CY = 82

function isoXY(x: number, y: number, z = 0): [number, number] {
  return [CX + (x - y) * COS30 * K, CY + ((x + y) * 0.5 - z) * K]
}

function iso(x: number, y: number, z = 0): string {
  const [sx, sy] = isoXY(x, y, z)
  return `${sx.toFixed(1)},${sy.toFixed(1)}`
}

const EDGE = 'var(--color-ink-muted)'
const FAINT = 'var(--color-ink-muted)'
const TOP = 'var(--color-surface)'
const SIDE_L = 'var(--color-line-soft)'
const SIDE_R = 'var(--color-line)'
const ACCENT = 'var(--color-accent)'

// Object edges and construction lines carry different weights on purpose —
// it is the cheapest hierarchy a line drawing has, and the previous version
// spent it on nothing by drawing everything at 0.9.
const W_EDGE = 0.9
const W_GUIDE = 0.6

type SlabProps = {
  x: number
  y: number
  z?: number
  w: number
  d: number
  h: number
  accent?: boolean
  ghost?: boolean
}

/** A solid, or its absence drawn as an outline. */
function Slab({ x, y, z = 0, w, d, h, accent = false, ghost = false }: SlabProps) {
  const pts = {
    top: [
      iso(x, y, z + h),
      iso(x + w, y, z + h),
      iso(x + w, y + d, z + h),
      iso(x, y + d, z + h),
    ].join(' '),
    left: [
      iso(x, y + d, z),
      iso(x + w, y + d, z),
      iso(x + w, y + d, z + h),
      iso(x, y + d, z + h),
    ].join(' '),
    right: [
      iso(x + w, y, z),
      iso(x + w, y + d, z),
      iso(x + w, y + d, z + h),
      iso(x + w, y, z + h),
    ].join(' '),
  }

  if (ghost) {
    return (
      <g
        fill="none"
        stroke={ACCENT}
        strokeWidth={W_GUIDE}
        strokeDasharray="2.4 2.2"
        opacity="0.7"
      >
        <polygon points={pts.top} />
        <polygon points={pts.left} />
        <polygon points={pts.right} />
      </g>
    )
  }

  return (
    <g stroke={EDGE} strokeWidth={W_EDGE} strokeLinejoin="round">
      <polygon points={pts.left} fill={accent ? ACCENT : SIDE_L} opacity={accent ? 0.16 : 1} />
      <polygon points={pts.right} fill={accent ? ACCENT : SIDE_R} opacity={accent ? 0.24 : 1} />
      <polygon points={pts.top} fill={accent ? ACCENT : TOP} opacity={accent ? 0.1 : 1} />
      {accent && (
        <>
          <polygon points={pts.left} fill="none" />
          <polygon points={pts.right} fill="none" />
          <polygon points={pts.top} fill="none" />
        </>
      )}
    </g>
  )
}

/** Dashed footprint. Gives every figure the same ground so the four align. */
function Ground({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  return (
    <polygon
      points={[iso(x, y), iso(x + w, y), iso(x + w, y + d), iso(x, y + d)].join(' ')}
      fill="none"
      stroke={FAINT}
      strokeWidth={W_GUIDE}
      strokeDasharray="2.4 2.4"
      opacity="0.45"
    />
  )
}

/**
 * A horizontal label on a leader, the way a drawing annotates a part.
 *
 * `from` is a point on the figure in grid space, `at` is where the type sits
 * in screen space. Horizontal, because that is the whole point.
 */
function Callout({
  from,
  at,
  children,
  anchor = 'start',
  size = 6,
  emphasis = false,
}: {
  from: [number, number, number]
  at: [number, number]
  children: string
  anchor?: 'start' | 'end'
  size?: number
  emphasis?: boolean
}) {
  const [fx, fy] = isoXY(...from)
  const [tx, ty] = at

  return (
    <g>
      <line
        x1={fx}
        y1={fy}
        x2={anchor === 'end' ? tx + 3 : tx - 3}
        y2={ty - 2}
        stroke={emphasis ? ACCENT : FAINT}
        strokeWidth={W_GUIDE}
        opacity={emphasis ? 0.8 : 0.55}
      />
      <circle cx={fx} cy={fy} r="1.3" fill={emphasis ? ACCENT : FAINT} opacity={emphasis ? 0.9 : 0.6} />
      <text
        x={tx}
        y={ty}
        fontSize={size}
        textAnchor={anchor}
        fill={emphasis ? ACCENT : FAINT}
        fontWeight={600}
        letterSpacing="0.55"
      >
        {children}
      </text>
    </g>
  )
}

/** In-plane text, reserved for tokens short enough to survive the skew. */
function TopLabel({
  at,
  children,
  size = 5.4,
}: {
  at: [number, number, number]
  children: string
  size?: number
}) {
  const [sx, sy] = isoXY(...at)
  return (
    <text
      transform={`matrix(0.866, 0.5, -0.866, 0.5, ${sx}, ${sy})`}
      fontSize={size}
      fill={FAINT}
      fontWeight={600}
      letterSpacing="0.3"
    >
      {children}
    </text>
  )
}

function Figure({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden focusable={false}>
      {children}
    </svg>
  )
}

// --- 1. Shows how you think -----------------------------------------------
// An exploded stack: one idea at three resolutions, threaded together. The
// thread is the claim — the levels are tied, not merely piled — so it is the
// element drawn in accent.
export function IsoSpine() {
  const levels: Array<{ z: number; label: string }> = [
    { z: 0, label: 'FINDING' },
    { z: 1.55, label: 'REQUIREMENT' },
    { z: 3.1, label: 'MOVE' },
  ]

  return (
    <Figure>
      {/* Shifted right so the leader column has room. "REQUIREMENT" is the
          longest string in the set and it ran off the left edge at x = -1.7 —
          measured, not eyeballed. */}
      <g transform="translate(15, 2)">
      <Ground x={-1.6} y={-1.6} w={3.2} d={3.2} />

      {/* The thread, behind the slabs so it reads as passing through them. */}
      <line
        x1={isoXY(0, 0, -0.5)[0]}
        y1={isoXY(0, 0, -0.5)[1]}
        x2={isoXY(0, 0, 3.8)[0]}
        y2={isoXY(0, 0, 3.8)[1]}
        stroke={ACCENT}
        strokeWidth={W_GUIDE}
        opacity="0.55"
      />

      {levels.map(({ z }) => (
        <Slab key={z} x={-1.6} y={-1.6} z={z} w={3.2} d={3.2} h={0.26} />
      ))}

      {levels.map(({ z, label }) => (
        <Callout
          key={label}
          from={[-1.6, 1.6, z + 0.26]}
          at={[isoXY(-1.6, 1.6, z + 0.26)[0] - 8, isoXY(-1.6, 1.6, z + 0.26)[1] + 2]}
          anchor="end"
          size={5.6}
        >
          {label}
        </Callout>
      ))}
      </g>
    </Figure>
  )
}

// --- 2. Finished, not postponed -------------------------------------------
// Five equal cards in a row with a thread running through them — a sequence,
// not a bar chart. Equal heights matter: ascending blocks would say "more",
// and the claim is "all five, then done".
export function IsoSteps() {
  const xs = [-2.7, -1.35, 0, 1.35, 2.7]

  return (
    <Figure>
      <Ground x={-3.4} y={-1.3} w={6.8} d={2.6} />

      <line
        x1={isoXY(-3.4, 0)[0]}
        y1={isoXY(-3.4, 0)[1]}
        x2={isoXY(3.4, 0)[0]}
        y2={isoXY(3.4, 0)[1]}
        stroke={FAINT}
        strokeWidth={W_GUIDE}
        strokeDasharray="2.4 2.4"
        opacity="0.5"
      />

      {xs.map((x, i) => (
        <Slab
          key={x}
          x={x - 0.58}
          y={-1}
          w={1.16}
          d={2}
          h={0.34}
          accent={i === xs.length - 1}
        />
      ))}

      {/* Two characters survive the skew where a word would not. */}
      {xs.map((x, i) => (
        <TopLabel key={x} at={[x - 0.42, 0.42, 0.34]} size={5.6}>
          {`0${i + 1}`}
        </TopLabel>
      ))}

    </Figure>
  )
}

// --- 3. Nothing to walk back ----------------------------------------------
// Four equal slots, three filled, one left as an outline. Equal footprints are
// what make the gap unmistakable — the earlier version varied the heights and
// the absence just looked like another shape.
export function IsoOmitted() {
  const slots: Array<[number, number]> = [
    [-1.7, -1.7],
    [0.1, -1.7],
    [-1.7, 0.1],
  ]

  return (
    <Figure>
      <Ground x={-2} y={-2} w={4} d={4} />

      {slots.map(([x, y]) => (
        <Slab key={`${x}${y}`} x={x} y={y} w={1.6} d={1.6} h={0.95} />
      ))}

      <Slab x={0.1} y={0.1} w={1.6} d={1.6} h={0.95} ghost />

      <Callout from={[1.7, 1.7, 0]} at={[186, 138]} anchor="end" size={5.4} emphasis>
        NO NUMBER GIVEN
      </Callout>
    </Figure>
  )
}

// --- 4. Still sounds like you ---------------------------------------------
// Two pages of type seen from above. The preset's lines are all one length;
// yours are not. Uniform sentence length is the loudest signal of machine
// writing — AGENTS.md says so in the prompt rules — so drawing that is drawing
// the difference, where a hatched cube only said "this one is different".
export function IsoVoice() {
  const preset = [1.25, 1.25, 1.25, 1.25]
  const yours = [1.5, 0.6, 1.35, 0.85]

  const page = (
    ox: number,
    oy: number,
    lines: number[],
    accent: boolean
  ) => (
    <g>
      <Slab x={ox} y={oy} w={1.9} d={2.3} h={0.22} accent={accent} />
      {lines.map((len, i) => (
        <line
          key={i}
          x1={isoXY(ox + 0.24, oy + 0.42 + i * 0.5, 0.22)[0]}
          y1={isoXY(ox + 0.24, oy + 0.42 + i * 0.5, 0.22)[1]}
          x2={isoXY(ox + 0.24 + len, oy + 0.42 + i * 0.5, 0.22)[0]}
          y2={isoXY(ox + 0.24 + len, oy + 0.42 + i * 0.5, 0.22)[1]}
          stroke={accent ? ACCENT : EDGE}
          strokeWidth={0.8}
          opacity={accent ? 0.85 : 0.45}
        />
      ))}
    </g>
  )

  return (
    <Figure>
      <Ground x={-2.5} y={-2.5} w={5} d={5} />

      {page(-2.2, 0.2, preset, false)}
      {page(0.3, -2.3, yours, true)}

      <Callout from={[-2.2, 2.5, 0.22]} at={[48, 136]} anchor="end" size={5.4}>
        PRESET
      </Callout>
      <Callout from={[2.2, -2.3, 0.22]} at={[188, 34]} anchor="end" size={5.4} emphasis>
        YOUR WORDS
      </Callout>
    </Figure>
  )
}
