// One feature card: label, dot glyph, description, isometric figure.
//
// Square corners and a plain rule. An earlier version chamfered the top-right
// corner, which took two stacked clip-paths to pull off — clip-path cuts
// through a CSS border, so the diagonal came out unstroked while the other
// four edges kept their line. With the notch gone the whole apparatus goes
// with it and this is a bordered div again.
//
// The type is the app's existing language: the same eyebrow the wizard and the
// document renderer use, warm neutral tokens, no third typeface. The
// reference's monospace label was deliberately not adopted.

type Props = {
  label: string
  body: string
  /** Which cells of the 4×4 corner glyph are filled. */
  glyph: number[]
  children: React.ReactNode
}

export function FeatureCard({ label, body, glyph, children }: Props) {
  return (
    <div className="flex h-full flex-col border border-line bg-surface p-5">
      {/* Two lines' worth of room whether the label needs it or not. Without
          it a one-line label pulls its description up and the four cards stop
          reading as a row. */}
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
