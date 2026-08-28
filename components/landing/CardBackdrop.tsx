// Atmospheric wash behind the "how it works" cards.
//
// The technique is lifted from PainterlyBackdrop, which sat in this folder
// unrendered since the first commit: soft shapes under a heavy Gaussian blur,
// a broader wash for color bleed, fractal-noise grain over the top, and edge
// fades so the panel melts into the page rather than cutting against it.
//
// What is NOT lifted is its palette. That component paints a landscape —
// sage hills, lavender mountains, ochre foreground — none of which exist in
// @theme. Every color here comes from a token, because a card background is
// not the place to introduce a second palette to the product.
//
// Variation between the three cards is blur and crop only. Same hues, so the
// row reads as one material seen three times rather than three swatches.

type Props = {
  /** Softness of the shapes. Higher reads as further away. */
  blur?: number
  /** Horizontal crop offset, so no two cards show the same passage. */
  shift?: number
}

export function CardBackdrop({ blur = 18, shift = 0 }: Props) {
  // Filter ids must be unique per instance or the first one on the page wins
  // for every card — the failure looks like "the blur prop is being ignored".
  const uid = `cb-${blur}-${shift}`

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      viewBox={`${shift} 0 320 400`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable={false}
    >
      <defs>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="var(--color-surface)" />
          <stop offset="45%" stopColor="var(--color-canvas)" />
          <stop offset="100%" stopColor="var(--color-line)" />
        </linearGradient>

        {/* Cool depth, kept faint. accent-soft is the only non-neutral token
            in the set and it earns its place by stopping the card going flat
            beige at larger sizes. */}
        <radialGradient id={`${uid}-glow`} cx="0.75" cy="0.22" r="0.7">
          <stop offset="0%" stopColor="var(--color-accent-soft)" stopOpacity="0.9" />
          <stop offset="70%" stopColor="var(--color-accent-soft)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-accent-soft)" stopOpacity="0" />
        </radialGradient>

        <filter id={`${uid}-soft`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>

        <filter id={`${uid}-wash`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={blur * 2.2} />
        </filter>

        {/* Paper grain. Without it the gradients band visibly on wide gamut
            displays, which is what the original component's grain was for. */}
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={7 + shift}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.28
                    0 0 0 0 0.22
                    0 0 0 0 0.16
                    0 0 0 0.22 0"
          />
        </filter>

        <linearGradient id={`${uid}-fade`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-canvas)" stopOpacity="0.55" />
          <stop offset="55%" stopColor="var(--color-canvas)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={shift} width="320" height="400" fill={`url(#${uid}-ground)`} />
      <rect x={shift} width="320" height="400" fill={`url(#${uid}-glow)`} />

      {/* Two soft banks — the "hills" of the original, flattened into shapes
          that read as light rather than land.

          The far one is `accent` at a tenth opacity. The warm tokens sit
          within a few percent of each other in lightness, so a wash built
          only from them has almost no range and the card comes out flat
          white. A trace of the one cool token gives the depth the original
          got from its lavender mountains, and at this opacity over warm
          neutral it reads as haze rather than as blue. */}
      <path
        d={`M${shift - 40},245 Q${shift + 70},180 ${shift + 180},230 T${shift + 380},205 L${shift + 380},400 L${shift - 40},400 Z`}
        fill="var(--color-accent)"
        opacity="0.1"
        filter={`url(#${uid}-wash)`}
      />
      <path
        d={`M${shift - 40},295 Q${shift + 110},250 ${shift + 220},292 T${shift + 380},275 L${shift + 380},400 L${shift - 40},400 Z`}
        fill="var(--color-line)"
        opacity="0.95"
        filter={`url(#${uid}-soft)`}
      />

      <rect
        x={shift}
        width="320"
        height="400"
        fill={`url(#${uid}-fade)`}
      />
      <rect
        x={shift}
        width="320"
        height="400"
        filter={`url(#${uid}-grain)`}
        opacity="0.5"
      />
    </svg>
  )
}
