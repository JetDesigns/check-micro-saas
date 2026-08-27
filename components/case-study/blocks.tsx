// Renderers for the block types in lib/case-study-blocks.ts.
//
// One component per block type, each responsible for nothing else. That is the
// payoff of structured output over prose: a block can be re-rendered, edited,
// or regenerated on its own, and the page is an ordered list rather than a
// wall of markdown.
//
// The visual language is inherited from the existing /c/[id] page on purpose —
// serif display type, the accent-bordered insight box, the uppercase eyebrow,
// the warm line colours. Those were already right; the revision is about
// structure, not a reskin.

import type { AnnotatedVisual, Block, SpineEntry } from '@/lib/case-study-blocks'

const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted'
const SERIF = 'font-[family-name:var(--font-serif)]'

// ---------------------------------------------------------------------------

export function MetadataGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className={EYEBROW}>{item.label}</p>
          <p className="mt-1.5 text-sm leading-snug text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

// The large metric block, kept from the current build. Sized down as the
// string grows so a long figure does not wrap into two ragged lines.
export function StatHeadline({ text }: { text: string }) {
  const size =
    text.length <= 40 ? 'text-3xl sm:text-4xl' : text.length <= 70 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
  return (
    <p className={`mt-10 ${SERIF} ${size} font-medium leading-[1.15] tracking-tight text-ink`}>
      {text}
    </p>
  )
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-6 space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[17px] leading-[1.7] text-ink-soft">
          {p}
        </p>
      ))}
    </div>
  )
}

export function PullQuote({ text, attribution }: { text: string; attribution?: string }) {
  return (
    <figure className="mt-10 border-l-4 border-accent bg-accent/5 px-6 py-5">
      <blockquote className={`${SERIF} text-xl leading-snug text-ink sm:text-2xl`}>
        “{text}”
      </blockquote>
      {attribution && (
        <figcaption className="mt-3 text-xs uppercase tracking-[0.15em] text-ink-muted">
          {attribution}
        </figcaption>
      )}
    </figure>
  )
}

export function RequirementCards({
  cards,
}: {
  cards: { spineId: string; index: number; title: string; body: string }[]
}) {
  return (
    <ol className="mt-8 grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <li key={card.spineId} className="rounded-xl border border-line bg-white px-5 py-5">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-accent">
            {String(card.index).padStart(2, '0')}
          </span>
          <h3 className="mt-3 text-[15px] font-medium leading-snug text-ink">{card.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.body}</p>
        </li>
      ))}
    </ol>
  )
}

// Caption sits directly beneath, in smaller lower-contrast type than the body,
// so it reads as annotation rather than as another paragraph.
//
// The placeholder is not scaffolding: a signed storage URL can expire or fail,
// and a labelled empty frame keeps the caption — the part that carries the
// argument — legible when the picture does not arrive.
export function Visual({ visual, src }: { visual: AnnotatedVisual; src?: string }) {
  return (
    <figure className="mt-8">
      <div className="overflow-hidden rounded-xl border border-line bg-canvas">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={visual.caption} className="block w-full" />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center">
            <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              {visual.imageId}
            </span>
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-ink-muted">
        {visual.caption}
      </figcaption>
    </figure>
  )
}

// The trade-off is the most persuasive block on the page — what someone
// refused to build says more than what they built — so it gets its own shape
// rather than being buried in a paragraph.
export function TradeOff({
  tradeoff,
}: {
  tradeoff: { chose: string; rejected: string; because: string }
}) {
  return (
    <div className="mt-8 rounded-xl border border-line bg-white px-5 py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Chose
        </span>
        <span className="text-[15px] font-medium text-ink">{tradeoff.chose}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Over
        </span>
        <span className="text-[15px] text-ink-soft line-through decoration-ink-muted/40">
          {tradeoff.rejected}
        </span>
      </div>
      <p className="mt-3.5 border-t border-line-soft pt-3.5 text-sm leading-relaxed text-ink-soft">
        {tradeoff.because}
      </p>
    </div>
  )
}

export function MoveSection({
  block,
  index,
  imageUrls,
}: {
  block: Extract<Block, { type: 'move_section' }>
  index: number
  imageUrls?: Record<string, string>
}) {
  return (
    <section
      id={`move-${block.spineId}`}
      className="mt-20 scroll-mt-24 border-t border-line-soft pt-14"
    >
      <p className={EYEBROW}>{block.eyebrow}</p>
      {/* The heading is the designer's own decision, phrased as an
          instruction. This is the whole reason the decorative section names
          were dropped: "The Vision" could head any case study ever written,
          and so it says nothing about this one. */}
      <h2 className={`mt-3 ${SERIF} text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl`}>
        {block.title}
      </h2>

      <div className="mt-6 space-y-4">
        {block.body.map((p, i) => (
          <p key={i} className="text-[17px] leading-[1.7] text-ink-soft">
            {p}
          </p>
        ))}
      </div>

      {block.tradeoff && <TradeOff tradeoff={block.tradeoff} />}

      {block.visuals.map((v) => (
        <Visual key={v.imageId} visual={v} src={imageUrls?.[v.imageId]} />
      ))}

      <span className="sr-only">{`Move ${index + 1}`}</span>
    </section>
  )
}

export function ImpactList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="mt-8 space-y-5">
      {items.map((item) => (
        <li key={item.title} className="border-l-2 border-accent pl-5">
          <h3 className="text-[17px] font-medium leading-snug text-ink">{item.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{item.body}</p>
        </li>
      ))}
    </ul>
  )
}

const STATUS_LABEL: Record<
  Extract<Block, { type: 'outcome_status' }>['status'],
  string
> = {
  shipped: 'Shipped',
  proof_of_concept: 'Proof of concept',
  not_launched: 'Not launched',
  handed_off: 'Handed off',
}

// "Not launched" is stated plainly rather than softened. A case study that
// admits where the work stopped is believed; one that implies everything
// shipped invites the reader to check.
export function OutcomeStatus({
  status,
  note,
}: {
  status: Extract<Block, { type: 'outcome_status' }>['status']
  note: string
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
        {STATUS_LABEL[status]}
      </span>
      <p className="text-[15px] leading-relaxed text-ink-soft">{note}</p>
    </div>
  )
}

export function Learnings({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-6 space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[17px] leading-[1.7] text-ink-soft">
          {p}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cycle diagram — one template, generated from data.
//
// Deliberately not a general-purpose diagram generator. A flexible one would
// scope-creep and still look worse than none; a single ring that is only
// emitted when the decisions actually describe a loop is the whole feature.

export function CycleDiagram({
  nodes,
  caption,
}: {
  nodes: { label: string; sublabel: string }[]
  caption: string
}) {
  const size = 460
  const c = size / 2
  const ringR = 150
  const cardW = 132
  const cardH = 54

  const points = nodes.map((node, i) => {
    // Start at the top and go clockwise, which is how a process is read.
    const angle = (-90 + (360 / nodes.length) * i) * (Math.PI / 180)
    return { ...node, x: c + ringR * Math.cos(angle), y: c + ringR * Math.sin(angle), angle }
  })

  return (
    <figure className="mt-10">
      <div className="overflow-x-auto rounded-xl border border-line bg-white py-4">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto block h-auto w-full max-w-[420px]"
          role="img"
          aria-label={caption}
        >
          <defs>
            <marker
              id="cycle-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent)" />
            </marker>
          </defs>

          {/* Arcs run between adjacent nodes, trimmed at both ends so they
              start and stop clear of the cards rather than under them. */}
          {points.map((p, i) => {
            const next = points[(i + 1) % points.length]
            const pad = 0.34
            const a1 = p.angle + pad
            const a2 = next.angle - pad
            const x1 = c + ringR * Math.cos(a1)
            const y1 = c + ringR * Math.sin(a1)
            const x2 = c + ringR * Math.cos(a2)
            const y2 = c + ringR * Math.sin(a2)
            return (
              <path
                key={`arc-${i}`}
                d={`M ${x1} ${y1} A ${ringR} ${ringR} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="var(--color-accent)"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                markerEnd="url(#cycle-arrow)"
              />
            )
          })}

          {points.map((p) => (
            <g key={p.label}>
              <rect
                x={p.x - cardW / 2}
                y={p.y - cardH / 2}
                width={cardW}
                height={cardH}
                rx="10"
                fill="var(--color-canvas)"
                stroke="var(--color-line)"
              />
              <text
                x={p.x}
                y={p.y - 6}
                textAnchor="middle"
                className="fill-[var(--color-ink)] text-[13px] font-medium"
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={p.y + 12}
                textAnchor="middle"
                className="fill-[var(--color-ink-muted)] text-[10px]"
              >
                {p.sublabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-ink-muted">
        {caption}
      </figcaption>
    </figure>
  )
}

// ---------------------------------------------------------------------------

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className={EYEBROW}>{eyebrow}</p>
      <h2 className={`mt-3 ${SERIF} text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl`}>
        {title}
      </h2>
    </>
  )
}

export type { SpineEntry }
