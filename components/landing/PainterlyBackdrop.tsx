// Hand-composed SVG landscape used as the warm painterly backdrop behind the
// wizard card. Atmospheric perspective (far layers blurred + desaturated),
// warm earth palette, canvas grain on top, soft fades at left/top edges so it
// blends into the page canvas rather than cutting hard.
//
// No external assets. To swap for a real painting, replace this component
// with an <img> that fills its parent — the layout doesn't need to change.

export function PainterlyBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      viewBox="0 0 800 1100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable={false}
    >
      <defs>
        {/* Sky: warm cream fading down into pale ochre. */}
        <linearGradient id="pb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3E9D2" />
          <stop offset="55%" stopColor="#EDDCB6" />
          <stop offset="100%" stopColor="#D9C08E" />
        </linearGradient>

        {/* Sun/atmosphere glow, upper-right. */}
        <radialGradient
          id="pb-glow"
          cx="0.72"
          cy="0.28"
          r="0.55"
          fx="0.72"
          fy="0.28"
        >
          <stop offset="0%" stopColor="#FBEDC6" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#FBEDC6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FBEDC6" stopOpacity="0" />
        </radialGradient>

        {/* Far mountains: dusty lavender-gray. */}
        <linearGradient id="pb-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B0A6A6" />
          <stop offset="100%" stopColor="#8F8385" />
        </linearGradient>

        {/* Mid hills: muted sage. */}
        <linearGradient id="pb-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A9679" />
          <stop offset="100%" stopColor="#68765A" />
        </linearGradient>

        {/* Foreground: warm ochre / dry grass. */}
        <linearGradient id="pb-fore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B99567" />
          <stop offset="100%" stopColor="#8E6C42" />
        </linearGradient>

        {/* Painterly softness on landscape shapes. */}
        <filter id="pb-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Broader painterly wash for color bleed across the horizon. */}
        <filter id="pb-wash" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="30" />
        </filter>

        {/* Canvas/paper grain overlay. */}
        <filter id="pb-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="7"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.28
                    0 0 0 0 0.22
                    0 0 0 0 0.16
                    0 0 0 0.35 0"
          />
        </filter>

        {/* Edge fades so the SVG blends into the page canvas instead of
            cutting hard against the flat cream page. */}
        <linearGradient id="pb-fade-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6F3EE" stopOpacity="1" />
          <stop offset="100%" stopColor="#F6F3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pb-fade-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F6F3EE" stopOpacity="1" />
          <stop offset="100%" stopColor="#F6F3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pb-fade-bottom" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#F6F3EE" stopOpacity="1" />
          <stop offset="100%" stopColor="#F6F3EE" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sky base */}
      <rect width="800" height="1100" fill="url(#pb-sky)" />

      {/* Sun glow */}
      <rect width="800" height="1100" fill="url(#pb-glow)" />

      {/* Far mountains (two overlapping ranges for atmospheric depth) */}
      <path
        d="M0,560 Q120,470 220,510 T430,485 T640,510 T820,495 L820,720 L0,720 Z"
        fill="url(#pb-far)"
        opacity="0.5"
        filter="url(#pb-blur)"
      />
      <path
        d="M0,600 Q140,540 280,570 T510,555 T760,580 T820,570 L820,720 L0,720 Z"
        fill="url(#pb-far)"
        opacity="0.7"
        filter="url(#pb-blur)"
      />

      {/* Mid hills */}
      <path
        d="M0,700 Q140,620 320,670 T580,650 T820,690 L820,880 L0,880 Z"
        fill="url(#pb-mid)"
        opacity="0.9"
        filter="url(#pb-blur)"
      />

      {/* Foreground ridge */}
      <path
        d="M0,850 Q180,780 400,830 T760,810 T820,820 L820,1100 L0,1100 Z"
        fill="url(#pb-fore)"
        filter="url(#pb-blur)"
      />

      {/* Warm color wash across the horizon — plein-air style color bleed */}
      <ellipse
        cx="500"
        cy="640"
        rx="380"
        ry="80"
        fill="#D9B387"
        opacity="0.28"
        filter="url(#pb-wash)"
      />

      {/* Canvas grain — kept subtle */}
      <rect width="800" height="1100" filter="url(#pb-grain)" opacity="0.45" />

      {/* Edge fades — order matters: top first, then left, then bottom.
          These blend the painterly area into the flat page canvas. */}
      <rect x="0" y="0" width="800" height="180" fill="url(#pb-fade-top)" />
      <rect x="0" y="0" width="200" height="1100" fill="url(#pb-fade-left)" />
      <rect
        x="0"
        y="900"
        width="800"
        height="200"
        fill="url(#pb-fade-bottom)"
      />
    </svg>
  )
}
