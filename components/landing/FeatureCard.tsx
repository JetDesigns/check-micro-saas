// The notched card from the reference layout.
//
// The chamfered top-right corner is two stacked clip-paths, not a border.
// clip-path cuts through a CSS border, so the diagonal comes out unstroked
// while the other four edges keep their line — the card looks broken at
// exactly one corner. Drawing the outline as a filled shape underneath and
// insetting the surface by a pixel gives a rule that follows the notch all the
// way round.
//
// Everything else is the app's existing language: the same eyebrow the wizard
// and the document renderer use, warm neutral tokens, no third typeface. The
// reference's monospace label was deliberately not adopted.

const NOTCH = 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)'

type Props = {
  label: string
  body: string
  /** Which cells of the 4×4 corner glyph are filled. */
  glyph: number[]
  children: React.ReactNode
}

export function FeatureCard({ label, body, glyph, children }: Props) {
  return (
    <div className="bg-line p-px" style={{ clipPath: NOTCH }}>
      <div
        className="flex h-full flex-col bg-surface p-5"
        style={{ clipPath: NOTCH }}
      >
        {/* Two lines' worth of room whether the label needs it or not.
            Without it a one-line label pulls its description up and the four
            cards stop reading as a row. */}
        <div className="flex min-h-[2.9em] items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.2em] text-ink">
            {label}
          </p>
          <DotGlyph cells={glyph} />
        </div>

        <p className="mt-7 text-sm leading-relaxed text-ink-soft">{body}</p>

        <div className="mt-auto" />

        <div className="mt-6 aspect-[4/3] overflow-hidden border border-line-soft bg-canvas/40">
          {children}
        </div>
      </div>
    </div>
  )
}

// Small 4×4 dot matrix, filled per card so no two corners repeat. Sits where
// the reference puts its glyph; it is decoration, so it is hidden from
// assistive tech rather than described.
function DotGlyph({ cells }: { cells: number[] }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden focusable={false}>
      {Array.from({ length: 16 }, (_, i) => {
        const on = cells.includes(i)
        return (
          <circle
            key={i}
            cx={3 + (i % 4) * 5.3}
            cy={3 + Math.floor(i / 4) * 5.3}
            r="1.15"
            fill="var(--color-ink-muted)"
            opacity={on ? 0.55 : 0.15}
          />
        )
      })}
    </svg>
  )
}
