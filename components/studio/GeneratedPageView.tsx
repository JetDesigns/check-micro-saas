import { parseInline, parseMarkdown, splitSections, type Inline, type MdNode } from '@/lib/markdown-lite'
import type { GeneratedPage } from '@/types/database'

// The generated page, as a reading view.
//
// Deliberately plain. The output page has no design yet — the Figma file covers
// the wizard and nothing else — and inventing one here would be a design decision
// made by accident inside a debugging tool. This draws the parsed markdown in the
// studio's own tokens so it is readable, and so it takes nothing from the legacy
// case-study renderer's palette.
//
// It reads the page through the SAME parser the validator uses (lib/markdown-lite),
// so what was checked is what is drawn.
//
// The one piece of presentation it does carry is the frame around a visual asset
// (see `Figures`). A screenshot dropped straight onto a white page reads as part
// of the page rather than as a thing being shown; the nested frame is what makes
// it an exhibit. Every value in it is an existing studio token.
//
// NOTHING HERE IS SHARED WITH THE LEGACY RENDERER. `components/case-study/blocks.tsx`
// has its own `Visual`, reached only from /fixture, and the two must stay apart:
// /fixture is the comparison path, and a comparison whose appearance moves with the
// thing it is compared against measures nothing.

type Props = {
  page: GeneratedPage
  /** imageId → URL. A plain object: this may cross into a Client Component. */
  imageUrls?: Record<string, string>
}

export function GeneratedPageView({ page, imageUrls = {} }: Props) {
  const nodes = parseMarkdown(page.markdown)
  const figures = new Map(page.figures.map((f) => [f.imageId, f]))
  const sections = splitSections(nodes)
  const [preamble, ...rest] = sections

  const draw = (nodes: MdNode[], pairs: boolean) =>
    groupFigures(nodes).map((item, i) =>
      item.kind === 'figures' ? (
        <Figures key={i} ids={item.ids} figures={figures} imageUrls={imageUrls} />
      ) : (
        <Node key={i} node={item.node} pairs={pairs} />
      )
    )

  return (
    // Four times the 16px rhythm inside a section. The gap is the only thing
    // separating the six sections — there is no rule and no divider — so the
    // contrast between the two numbers is what makes each one read as a block.
    <article className="flex flex-col gap-16 text-[var(--studio-text)]">
      <header className="flex flex-col gap-3">{draw(preamble.nodes, true)}</header>

      {rest.map((s, i) => (
        <section key={s.title ?? i} className="flex flex-col gap-4">
          <h2 className="text-[20px] leading-tight font-medium tracking-[-0.02em]">{s.title}</h2>
          {draw(s.nodes, s.title === 'Credits')}
          {s.title === 'Approach' && page.diagram && <DecisionFlow diagram={page.diagram} />}
        </section>
      ))}
    </article>
  )
}

/**
 * Consecutive figure markers, collected into runs.
 *
 * Adjacency is all the renderer has to go on: the envelope carries
 * `{imageId, caption, alt}` and no slot, so "a before/after pair" is not something
 * this can know — only that two markers sit next to each other in the markdown.
 * Grouping happens here, at render time; the parser is untouched.
 */
type Item = { kind: 'figures'; ids: string[] } | { kind: 'node'; node: MdNode }

function groupFigures(nodes: MdNode[]): Item[] {
  const items: Item[] = []
  for (const node of nodes) {
    if (node.type !== 'figure') {
      items.push({ kind: 'node', node })
      continue
    }
    const last = items[items.length - 1]
    if (last?.kind === 'figures') last.ids.push(node.imageId)
    else items.push({ kind: 'figures', ids: [node.imageId] })
  }
  return items
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((x, i) =>
        x.kind === 'strong' ? (
          <strong key={i} className="font-medium">
            {x.text}
          </strong>
        ) : x.kind === 'em' ? (
          <em key={i}>{x.text}</em>
        ) : (
          <span key={i}>{x.text}</span>
        )
      )}
    </>
  )
}

function Node({
  node,
  pairs = false,
}: {
  node: MdNode
  /** Render `Label: value` list items as a two-column list (metadata, credits). */
  pairs?: boolean
}) {
  switch (node.type) {
    case 'heading':
      if (node.level === 1) {
        return <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.03em]">{node.text}</h1>
      }
      return <h3 className="pt-2 text-[16px] leading-snug font-medium">{node.text}</h3>

    case 'paragraph':
      return (
        <p className="text-[15px] leading-[1.65] text-[var(--studio-text)]">
          <Inlines inlines={node.inlines} />
        </p>
      )

    case 'quote':
      return (
        <blockquote className="border-l-2 border-[var(--studio-border-strong)] pl-4 text-[15px] leading-[1.65] text-[var(--studio-text-soft)] italic">
          <Inlines inlines={node.inlines} />
        </blockquote>
      )

    case 'list': {
      const asPairs = pairs && !node.ordered && node.items.every((it) => /^[^:]{1,40}:\s*\S/.test(it.raw))
      if (asPairs) {
        return (
          <dl className="grid grid-cols-[minmax(80px,140px)_1fr] gap-x-4 gap-y-1.5 text-[14px]">
            {node.items.map((it, i) => {
              const at = it.raw.indexOf(':')
              const value = it.raw.slice(at + 1).trim()
              return (
                <div key={i} className="contents">
                  <dt className="text-[var(--studio-text-soft)]">{it.raw.slice(0, at)}</dt>
                  <dd>
                    <Inlines inlines={parseInline(value)} />
                  </dd>
                </div>
              )
            })}
          </dl>
        )
      }
      const Tag = node.ordered ? 'ol' : 'ul'
      return (
        <Tag
          className={
            'flex flex-col gap-1.5 pl-5 text-[15px] leading-[1.6] ' +
            (node.ordered ? 'list-decimal' : 'list-disc')
          }
        >
          {node.items.map((it, i) => (
            <li key={i}>
              <Inlines inlines={it.inlines} />
            </li>
          ))}
        </Tag>
      )
    }

    // Figures never reach here: groupFigures collects them into runs before Node
    // is called, because a run of them shares one frame.
    case 'figure':
      return null
  }
}

// The frame, in tokens: outer tray #f6f6f6 / 16px / 20px padding, inner card white
// / 8px / hairline + the card shadow. The inner radius is smaller than the outer
// and the asset never reaches the outer edge — the padding is what makes it read
// as something being held up rather than as part of the page.
const OUTER = 'rounded-[var(--studio-r-xl)] bg-[var(--studio-bg-secondary)] p-5'
const INNER =
  'studio-card-shadow block w-full rounded-[var(--studio-r-md)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)]'
const CAPTION = 'text-[13px] leading-snug text-[var(--studio-text-soft)]'

/**
 * One visual asset, or a run of adjacent ones.
 *
 * The caption sits inside the tray, directly under the frame it belongs to,
 * whether there is one asset or several. It was below the tray for a single asset
 * and inside it for a run, which meant the same caption moved depending on what
 * happened to sit next to it — and left two shapes here where one does the job.
 */
function Figures({
  ids,
  figures,
  imageUrls,
}: {
  ids: string[]
  figures: Map<string, GeneratedPage['figures'][number]>
  imageUrls: Record<string, string>
}) {
  return (
    <div className={`flex flex-col gap-5 ${OUTER}`}>
      {ids.map((id) => {
        const fig = figures.get(id)
        return (
          <figure key={id} className="flex flex-col gap-2">
            <Asset id={id} fig={fig} url={imageUrls[id]} />
            {fig && <figcaption className={CAPTION}>{fig.caption}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}

const ROW =
  'flex gap-3 rounded-[var(--studio-r-md)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] p-3'

/**
 * The floor form (§9.2b): the decisions, in the designer's order, each against
 * the pain point it answers.
 *
 * Drawn here rather than by the model, which is what keeps §9.3's gates true by
 * construction. Order is position. The one that departs carries a mark. There are
 * no fills and no legend, so the rules banning them cannot be broken.
 *
 * AN INDEX, NOT PROSE. Each item is a name of three words at most. The first
 * version gave every item a sentence — the pain point it answered, the pattern it
 * broke — which was the prose in a box beside the prose. Those belong to Solution's
 * tie-backs, and a reader does not need them twice.
 *
 * The mark's words belong to this file, not to the model. A bare glyph would need
 * a key, which §9.3 gate 1 forbids; three fixed words on the item it describes
 * explain themselves and cannot grow into a sentence.
 *
 * The text equivalent is a figcaption that is visually hidden on purpose: §9.3
 * requires one for a reader who cannot see the diagram, and gate 2 forbids a
 * caption that carries the finding. Hidden satisfies both — it reaches the people
 * who need it without becoming the explanation the graphic should not need.
 */
function DecisionFlow({ diagram }: { diagram: NonNullable<GeneratedPage['diagram']> }) {
  return (
    <figure className={OUTER}>
      <ol className="flex flex-col gap-2">
        {diagram.items.map((item, i) => (
          <li key={i} className={`${ROW} items-center`}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--studio-r-full)] border border-[var(--studio-border-strong)] text-[11px] text-[var(--studio-text-soft)]">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-[14px] leading-snug font-medium">{item.name}</span>
            {item.deviates && (
              <span className="shrink-0 rounded-[var(--studio-r-sm)] border border-[var(--studio-border-strong)] px-1.5 py-0.5 text-[11px] text-[var(--studio-text-soft)]">
                breaks the pattern
              </span>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">{diagram.text_equivalent}</figcaption>
    </figure>
  )
}

function Asset({
  id,
  fig,
  url,
}: {
  id: string
  fig?: GeneratedPage['figures'][number]
  url?: string
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={fig?.alt ?? ''} className={INNER} />
  }
  // The bytes are not available here (a dry run has no storage). Show the slot
  // rather than nothing, so the caption and alt are still readable and a missing
  // image is not mistaken for a missing figure. Framed like a real one, so a dry
  // run and a stored page are laid out alike.
  return (
    <div
      role="img"
      aria-label={fig?.alt ?? ''}
      className={`${INNER} flex aspect-[4/3] items-center justify-center p-4 text-center text-[12px] text-[var(--studio-text-soft)]`}
    >
      {fig?.alt || id}
    </div>
  )
}
