// Isometric line figures for the feature cards.
//
// One projection, four compositions, and each one draws the thing its card
// claims — swap any two and the page stops making sense. That is the bar: a
// figure here is a diagram, not decoration.
//
// The projection is the standard 2:1 isometric: x runs right-and-down, y runs
// left-and-down, z is straight up. Coordinates are in grid units, which keeps
// a composition readable as "a box at 0,0 that is two wide" instead of as a
// wall of hand-tuned path data.
//
// Labels sit ON the faces rather than floating over them. That is what makes
// the reference read as drawn rather than annotated, and it costs one matrix
// per face — derived from the projection's own partial derivatives, see
// FaceText.

const K = 14
const COS30 = 0.866
const ORIGIN_X = 100
const ORIGIN_Y = 92

function isoXY(x: number, y: number, z = 0): [number, number] {
  return [
    ORIGIN_X + (x - y) * COS30 * K,
    ORIGIN_Y + ((x + y) * 0.5 - z) * K,
  ]
}

function iso(x: number, y: number, z = 0): string {
  const [sx, sy] = isoXY(x, y, z)
  return `${sx.toFixed(1)},${sy.toFixed(1)}`
}

const STROKE = 'var(--color-ink-muted)'
const LABEL = 'var(--color-ink-muted)'
const TOP = 'var(--color-surface)'
const LEFT = 'var(--color-line-soft)'
const RIGHT = 'var(--color-line)'

// Text lying in one of the three visible planes.
//
// matrix(a,b,c,d,e,f) sends the glyph's own x-axis to (a,b) and its y-axis to
// (c,d). Feed those the projection's unit vectors and the type lands in the
// plane: ∂/∂x = (0.866, 0.5), ∂/∂y = (-0.866, 0.5), ∂/∂z = (0, -1). Columns
// stay unit length, so fontSize is still in grid-space units.
const FACE_MATRIX = {
  top: (x: number, y: number) => `matrix(0.866, 0.5, -0.866, 0.5, ${x}, ${y})`,
  left: (x: number, y: number) => `matrix(0.866, 0.5, 0, 1, ${x}, ${y})`,
  right: (x: number, y: number) => `matrix(0.866, -0.5, 0, 1, ${x}, ${y})`,
} as const

// SVG text hangs UP from its baseline, so an anchor placed near the top of a
// face pushes the glyphs out through the top edge. At these sizes the ascent
// is about 0.35 grid units — anchor that far below the top at least.
function FaceText({
  at,
  face = 'top',
  size = 5,
  children,
}: {
  at: [number, number, number]
  face?: keyof typeof FACE_MATRIX
  size?: number
  children: string
}) {
  const [sx, sy] = isoXY(at[0], at[1], at[2])
  return (
    <text
      transform={FACE_MATRIX[face](sx, sy)}
      fontSize={size}
      fill={LABEL}
      fontWeight={600}
      letterSpacing="0.1"
    >
      {children}
    </text>
  )
}

function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  topFill = TOP,
  opacity = 1,
}: {
  x: number
  y: number
  z?: number
  w: number
  d: number
  h: number
  topFill?: string
  opacity?: number
}) {
  const face = (pts: string[]) => pts.join(' ')
  return (
    <g opacity={opacity} strokeWidth="0.9" stroke={STROKE} strokeLinejoin="round">
      <polygon
        points={face([
          iso(x, y + d, z),
          iso(x + w, y + d, z),
          iso(x + w, y + d, z + h),
          iso(x, y + d, z + h),
        ])}
        fill={LEFT}
      />
      <polygon
        points={face([
          iso(x + w, y, z),
          iso(x + w, y + d, z),
          iso(x + w, y + d, z + h),
          iso(x + w, y, z + h),
        ])}
        fill={RIGHT}
      />
      <polygon
        points={face([
          iso(x, y, z + h),
          iso(x + w, y, z + h),
          iso(x + w, y + d, z + h),
          iso(x, y + d, z + h),
        ])}
        fill={topFill}
      />
    </g>
  )
}

function Plate({
  x,
  y,
  z,
  w,
  d,
  dashed = false,
}: {
  x: number
  y: number
  z: number
  w: number
  d: number
  dashed?: boolean
}) {
  return (
    <polygon
      points={[
        iso(x, y, z),
        iso(x + w, y, z),
        iso(x + w, y + d, z),
        iso(x, y + d, z),
      ].join(' ')}
      fill={dashed ? 'none' : TOP}
      stroke={STROKE}
      strokeWidth="0.9"
      strokeDasharray={dashed ? '2.5 2.5' : undefined}
      opacity={dashed ? 0.6 : 1}
    />
  )
}

function Guide({
  from,
  to,
}: {
  from: [number, number, number]
  to: [number, number, number]
}) {
  const [x1, y1] = isoXY(...from)
  const [x2, y2] = isoXY(...to)
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={STROKE}
      strokeWidth="0.7"
      strokeDasharray="2.5 2.5"
      opacity="0.5"
    />
  )
}

function Figure({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden focusable={false}>
      {children}
    </svg>
  )
}

// --- 1. Shows how you think ------------------------------------------------
// The spine itself, named. Three levels of one idea with the mapping drawn
// between them: a finding holds up a requirement, which holds up a move.
export function IsoSpine() {
  const levels: Array<[number, string]> = [
    [0, 'FINDING'],
    [2.3, 'REQUIREMENT'],
    [4.6, 'MOVE'],
  ]

  return (
    <Figure>
      {levels.map(([z]) => (
        <Plate key={z} x={-2} y={-2} z={z} w={4} d={4} />
      ))}

      {/* The 1:1 mapping. Three corners tied through every level. */}
      <Guide from={[-2, -2, 0]} to={[-2, -2, 4.6]} />
      <Guide from={[2, -2, 0]} to={[2, -2, 4.6]} />
      <Guide from={[2, 2, 0]} to={[2, 2, 4.6]} />

      {levels.map(([z, label]) => (
        <FaceText key={label} at={[-1.65, 0.35, z]} size={6}>
          {label}
        </FaceText>
      ))}
    </Figure>
  )
}

// --- 2. Finished, not postponed -------------------------------------------
// Five steps, counted, on a base that shows how far there is to go from the
// start. Nothing between them to climb over.
export function IsoSteps() {
  const steps = ['01', '02', '03', '04', '05']

  return (
    <Figure>
      <Plate x={-3} y={-2.2} z={0} w={6} d={4.4} dashed />

      {/* Two passes, and the order is the whole reason the numbers are
          legible. Drawing each block with its own label interleaved put every
          label under the next block's polygons — the staircase ascends toward
          the viewer, so each step paints over the one behind it. Boxes first,
          then every label on top. */}
      {steps.map((n, i) => (
        <Box key={n} x={-2.7 + i * 1.12} y={-1.1} w={0.9} d={2.2} h={1 + i * 0.45} />
      ))}
      {steps.map((n, i) => (
        <FaceText
          key={n}
          at={[-2.7 + i * 1.12 + 0.18, 1.1, 1 + i * 0.45 - 0.5]}
          face="left"
          size={5.2}
        >
          {n}
        </FaceText>
      ))}
    </Figure>
  )
}

// --- 3. Nothing to walk back ----------------------------------------------
// Three blocks that came from an answer, and one slot left as an outline.
// That gap is the product declining to fill a block it has no number for —
// stat_headline must contain a digit or it is dropped, not invented.
export function IsoOmitted() {
  return (
    <Figure>
      <Plate x={-2.4} y={-2.4} z={0} w={4.8} d={4.8} dashed />

      <Box x={-2.1} y={-2.1} w={1.8} d={1.8} h={1.5} />
      <Box x={0.3} y={-2.1} w={1.8} d={1.8} h={1.05} />
      <Box x={-2.1} y={0.3} w={1.8} d={1.8} h={0.85} />

      <Plate x={0.3} y={0.3} z={0} w={1.8} d={1.8} dashed />
      <FaceText at={[0.45, 1.15, 0]} size={5.6}>
        OMITTED
      </FaceText>

      {/* Drafting-style callout, the way the reference points at a value. */}
      <line
        x1={isoXY(2.1, 2.1, 0)[0]}
        y1={isoXY(2.1, 2.1, 0)[1]}
        x2={168}
        y2={128}
        stroke={STROKE}
        strokeWidth="0.7"
        strokeDasharray="2.5 2.5"
        opacity="0.6"
      />
      <circle cx={isoXY(2.1, 2.1, 0)[0]} cy={isoXY(2.1, 2.1, 0)[1]} r="1.6" fill={STROKE} />
      <text x="166" y="137" fontSize="6" fill={LABEL} textAnchor="end" letterSpacing="0.1">
        no number given
      </text>
    </Figure>
  )
}

// --- 4. Still sounds like you ---------------------------------------------
// Two blocks, same footprint, different weight: the preset sits low and plain,
// the writer's own words sit taller and carry the texture. Which one wins is
// the whole point of the card.
export function IsoVoice() {
  return (
    <Figure>
      <defs>
        <pattern
          id="iso-voice-hatch"
          width="2.6"
          height="2.6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(28)"
        >
          <line x1="0" y1="0" x2="0" y2="2.6" stroke={STROKE} strokeWidth="0.6" />
        </pattern>
      </defs>

      <Plate x={-2.9} y={-2.9} z={0} w={5.8} d={5.8} dashed />

      {/* Separated along (x − y), which is the screen's horizontal axis in
          this projection. Offsetting in x alone looks like a gap in grid
          space and still overlaps on screen. */}
      <Box x={-2.6} y={0.2} w={2.2} d={2.2} h={0.9} />
      <FaceText at={[-2.4, 2.4, 0.4]} face="left" size={5}>
        PRESET
      </FaceText>

      <Box
        x={0.4}
        y={-2.4}
        w={2.2}
        d={2.2}
        h={2}
        topFill="url(#iso-voice-hatch)"
      />
      <FaceText at={[0.6, -0.2, 1.5]} face="left" size={5}>
        YOUR WORDS
      </FaceText>
    </Figure>
  )
}
