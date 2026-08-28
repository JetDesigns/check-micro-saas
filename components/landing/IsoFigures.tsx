// Isometric line figures for the feature cards.
//
// One projection, four compositions. Everything is drawn from tokens — the
// palette is the same warm neutral set the rest of the app uses, so these read
// as diagrams of this product rather than as stock illustration.
//
// The projection is the standard 2:1 isometric: x runs right-and-down, y runs
// left-and-down, z is straight up. Coordinates below are in grid units, which
// keeps the compositions readable as "a box at 0,0 that is 2 wide" instead of
// as a wall of hand-tuned path data.

const COS30 = 0.866
const ORIGIN_X = 100
const ORIGIN_Y = 96

function iso(x: number, y: number, z = 0): string {
  const sx = ORIGIN_X + (x - y) * COS30 * 14
  const sy = ORIGIN_Y + ((x + y) * 0.5 - z) * 14
  return `${sx.toFixed(1)},${sy.toFixed(1)}`
}

const STROKE = 'var(--color-ink-muted)'
const TOP = 'var(--color-surface)'
const LEFT = 'var(--color-line-soft)'
const RIGHT = 'var(--color-line)'

/** A box in grid units. Draws only the three faces an isometric view sees. */
function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  opacity = 1,
}: {
  x: number
  y: number
  z?: number
  w: number
  d: number
  h: number
  opacity?: number
}) {
  const top = [
    iso(x, y, z + h),
    iso(x + w, y, z + h),
    iso(x + w, y + d, z + h),
    iso(x, y + d, z + h),
  ].join(' ')

  const left = [
    iso(x, y + d, z),
    iso(x + w, y + d, z),
    iso(x + w, y + d, z + h),
    iso(x, y + d, z + h),
  ].join(' ')

  const right = [
    iso(x + w, y, z),
    iso(x + w, y + d, z),
    iso(x + w, y + d, z + h),
    iso(x + w, y, z + h),
  ].join(' ')

  return (
    <g opacity={opacity} strokeWidth="0.9" stroke={STROKE} strokeLinejoin="round">
      <polygon points={left} fill={LEFT} />
      <polygon points={right} fill={RIGHT} />
      <polygon points={top} fill={TOP} />
    </g>
  )
}

/** A flat plate — a box with no height. Used where a layer, not a volume. */
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
  const points = [
    iso(x, y, z),
    iso(x + w, y, z),
    iso(x + w, y + d, z),
    iso(x, y + d, z),
  ].join(' ')

  return (
    <polygon
      points={points}
      fill={dashed ? 'none' : TOP}
      stroke={STROKE}
      strokeWidth="0.9"
      strokeDasharray={dashed ? '2.5 2.5' : undefined}
      opacity={dashed ? 0.55 : 1}
    />
  )
}

function Guide({ from, to }: { from: string; to: string }) {
  const [x1, y1] = from.split(',')
  const [x2, y2] = to.split(',')
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
    <svg
      viewBox="0 0 200 150"
      className="h-full w-full"
      aria-hidden
      focusable={false}
    >
      {children}
    </svg>
  )
}

// --- 1. Three levels, mapped one to one -----------------------------------
// Finding, requirement, move as stacked plates with the mapping drawn between
// them. The vertical guides are the point: the levels line up.
export function IsoSpine() {
  return (
    <Figure>
      <Plate x={-2} y={-2} z={0} w={4} d={4} />
      <Plate x={-2} y={-2} z={2.2} w={4} d={4} />
      <Plate x={-2} y={-2} z={4.4} w={4} d={4} />
      <Guide from={iso(-2, -2, 0)} to={iso(-2, -2, 4.4)} />
      <Guide from={iso(2, -2, 0)} to={iso(2, -2, 4.4)} />
      <Guide from={iso(2, 2, 0)} to={iso(2, 2, 4.4)} />
      <Box x={-0.6} y={-0.6} z={4.4} w={1.2} d={1.2} h={1} />
    </Figure>
  )
}

// --- 2. Steps you can walk through ----------------------------------------
export function IsoSteps() {
  return (
    <Figure>
      <Plate x={-3} y={-2.4} z={0} w={6} d={4.8} dashed />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          x={-2.6 + i * 1.05}
          y={-1.2}
          w={0.85}
          d={2.4}
          h={0.5 + i * 0.55}
          opacity={i === 4 ? 1 : 0.92}
        />
      ))}
    </Figure>
  )
}

// --- 3. The slot left empty -----------------------------------------------
// Three solid blocks and one drawn as an outline. That gap is the product
// omitting a block rather than filling it with something plausible.
export function IsoOmitted() {
  return (
    <Figure>
      <Plate x={-2.6} y={-2.6} z={0} w={5.2} d={5.2} dashed />
      <Box x={-2.2} y={-2.2} w={1.9} d={1.9} h={1.5} />
      <Box x={0.3} y={-2.2} w={1.9} d={1.9} h={1.1} />
      <Box x={-2.2} y={0.3} w={1.9} d={1.9} h={0.9} />
      <Plate x={0.3} y={0.3} z={0} w={1.9} d={1.9} dashed />
      <Guide from={iso(0.3, 0.3, 0)} to={iso(0.3, 0.3, 1.6)} />
      <Guide from={iso(2.2, 2.2, 0)} to={iso(2.2, 2.2, 1.6)} />
    </Figure>
  )
}

// --- 4. One of these is not like the others -------------------------------
export function IsoVoice() {
  return (
    <Figure>
      <defs>
        <pattern
          id="iso-voice-hatch"
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <line x1="0" y1="0" x2="0" y2="3" stroke={STROKE} strokeWidth="0.7" />
        </pattern>
      </defs>

      <Plate x={-2.8} y={-2} z={0} w={5.6} d={4} dashed />
      <Box x={-2.4} y={-1.4} w={1.4} d={2.8} h={1} opacity={0.85} />
      <Box x={1} y={-1.4} w={1.4} d={2.8} h={1} opacity={0.85} />

      {/* The middle one carries the texture — same shape, different surface. */}
      <g strokeWidth="0.9" stroke={STROKE} strokeLinejoin="round">
        <polygon
          points={[
            iso(-0.7, 1.4, 0),
            iso(0.7, 1.4, 0),
            iso(0.7, 1.4, 1.7),
            iso(-0.7, 1.4, 1.7),
          ].join(' ')}
          fill={LEFT}
        />
        <polygon
          points={[
            iso(0.7, -1.4, 0),
            iso(0.7, 1.4, 0),
            iso(0.7, 1.4, 1.7),
            iso(0.7, -1.4, 1.7),
          ].join(' ')}
          fill={RIGHT}
        />
        <polygon
          points={[
            iso(-0.7, -1.4, 1.7),
            iso(0.7, -1.4, 1.7),
            iso(0.7, 1.4, 1.7),
            iso(-0.7, 1.4, 1.7),
          ].join(' ')}
          fill="url(#iso-voice-hatch)"
        />
      </g>
    </Figure>
  )
}
