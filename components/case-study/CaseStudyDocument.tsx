'use client'

import { useEffect, useState } from 'react'
import type { Block, CaseStudy } from '@/lib/case-study-blocks'
import {
  CycleDiagram,
  ImpactList,
  Learnings,
  MetadataGrid,
  MoveSection,
  OutcomeStatus,
  Prose,
  PullQuote,
  RequirementCards,
  SectionHeading,
  StatHeadline,
  Visual,
} from './blocks'

// Assembles the block list into the page shape the revision spec defines:
//
//   Opening · Context · What we found · What it needed to be · The approach ·
//   Where it landed · Learnings
//
// The blocks arrive as a flat ordered list, so this picks them out by type
// rather than expecting the agent to have grouped them. An agent that emits
// the right blocks in the wrong order still renders correctly; only the moves
// depend on order, and the validator already enforces that against the spine.
//
// Deliberately absent: a "Going further" or "Future features" section.
// Speculative unbuilt work is the weakest thing a reviewer can read, and the
// cheapest way to avoid shipping it is to give it nowhere to go.

type Props = {
  doc: CaseStudy
  title: string
  /** Resolves an imageId to a URL. Omit and visuals render as labelled frames. */
  imageSrc?: (id: string) => string | undefined
}

function pick<T extends Block['type']>(blocks: Block[], type: T) {
  return blocks.filter((b): b is Extract<Block, { type: T }> => b.type === type)
}

export function CaseStudyDocument({ doc, title, imageSrc }: Props) {
  const { spine, blocks } = doc

  const metadata = pick(blocks, 'metadata_grid')[0]
  const stat = pick(blocks, 'stat_headline')[0]
  const quote = pick(blocks, 'pullquote')[0]
  const requirements = pick(blocks, 'requirement_cards')[0]
  const cycle = pick(blocks, 'cycle_diagram')[0]
  const outcome = pick(blocks, 'outcome_status')[0]
  const impact = pick(blocks, 'impact_list')[0]
  const learnings = pick(blocks, 'learnings')[0]
  const moves = pick(blocks, 'move_section')

  const proseBlocks = pick(blocks, 'prose')
  const [intro, findingsProse] = [proseBlocks[0], proseBlocks[1]]

  // Standalone visuals — the ones not owned by a move. First is the hero.
  const looseVisuals = pick(blocks, 'annotated_visual')
  const hero = looseVisuals[0]
  const supporting = looseVisuals.slice(1)

  const sections = [
    { id: 'context', label: 'Context' },
    { id: 'findings', label: 'What we found' },
    { id: 'requirements', label: 'What it needed' },
    ...moves.map((m) => ({ id: `move-${m.spineId}`, label: m.title })),
    { id: 'outcome', label: 'Where it landed' },
    { id: 'learnings', label: 'Learnings' },
  ]

  const activeId = useActiveSection(sections.map((s) => s.id))

  return (
    <article className="mx-auto w-full max-w-3xl px-6 pb-32 pt-12 lg:px-0">
      {/* ---- Opening ---- */}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Case study
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-serif)] text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {intro && <Prose paragraphs={intro.paragraphs} />}
        {metadata && <MetadataGrid items={metadata.items} />}
      </header>

      <StickyNav sections={sections} activeId={activeId} />

      {/* ---- Context ---- */}
      <section id="context" className="mt-14 scroll-mt-24">
        {stat && <StatHeadline text={stat.text} />}
        {quote && <PullQuote text={quote.text} attribution={quote.attribution} />}
        {hero && <Visual visual={hero} src={imageSrc?.(hero.imageId)} />}
      </section>

      {/* ---- What we found ---- */}
      <section id="findings" className="mt-20 scroll-mt-24 border-t border-line-soft pt-14">
        <SectionHeading eyebrow="What we found" title="The problem underneath" />
        {findingsProse && <Prose paragraphs={findingsProse.paragraphs} />}
        <ul className="mt-8 space-y-4">
          {spine.map((entry, i) => (
            <li key={entry.id} className="flex gap-4">
              <span className="mt-0.5 shrink-0 text-[11px] font-semibold tracking-[0.2em] text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-[15px] leading-relaxed text-ink-soft">{entry.finding}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- What it needed to be ---- */}
      {requirements && (
        <section id="requirements" className="mt-20 scroll-mt-24 border-t border-line-soft pt-14">
          <SectionHeading eyebrow="What it needed to be" title="Three requirements" />
          <RequirementCards cards={requirements.cards} />
        </section>
      )}

      {/* ---- The approach ---- */}
      {cycle && (
        <section className="mt-20 border-t border-line-soft pt-14">
          <SectionHeading eyebrow="The approach" title="How the loop closes" />
          <CycleDiagram nodes={cycle.nodes} caption={cycle.caption} />
        </section>
      )}

      {moves.map((move, i) => (
        <MoveSection key={move.spineId} block={move} index={i} imageSrc={imageSrc} />
      ))}

      {/* ---- Where it landed ---- */}
      <section id="outcome" className="mt-20 scroll-mt-24 border-t border-line-soft pt-14">
        <SectionHeading eyebrow="Where it landed" title="What changed" />
        {outcome && <OutcomeStatus status={outcome.status} note={outcome.note} />}
        {impact && <ImpactList items={impact.items} />}
        {supporting.map((v) => (
          <Visual key={v.imageId} visual={v} src={imageSrc?.(v.imageId)} />
        ))}
      </section>

      {/* ---- Learnings ---- */}
      {learnings && (
        <section id="learnings" className="mt-20 scroll-mt-24 border-t border-line-soft pt-14">
          <SectionHeading eyebrow="Learnings" title="What I would do differently" />
          <Learnings paragraphs={learnings.paragraphs} />
        </section>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------

function StickyNav({
  sections,
  activeId,
}: {
  sections: { id: string; label: string }[]
  activeId: string | null
}) {
  return (
    <nav className="sticky top-0 z-30 -mx-6 mt-12 border-y border-line bg-canvas/85 px-6 backdrop-blur lg:mx-0 lg:px-0">
      <div className="flex gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={
              'flex-none truncate rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ' +
              // Move labels are the designer's own sentences, so they can run
              // long. Truncating keeps the bar one line high; the anchor still
              // works and the heading below carries the full text.
              'max-w-[11rem] ' +
              (activeId === s.id
                ? 'bg-ink text-white'
                : 'text-ink-muted hover:bg-white hover:text-ink')
            }
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

/** Just below the sticky bar: a section becomes current once its heading has
 *  slid under the nav, not when it first peeks into view. */
export const ACTIVE_SECTION_LINE = 96

/**
 * Which section the reader is in: the last one whose top has passed the line,
 * falling back to the first when the page is scrolled above all of them.
 *
 * Pure, and separated from the DOM, because this is the part that was actually
 * wrong and the browser pane used for checking suppresses scroll events — so
 * the only honest way to verify it is a unit test.
 */
export function pickActiveSection(
  sections: { id: string; top: number }[],
  line: number
): string | null {
  let current = sections[0]?.id ?? null
  for (const section of sections) {
    if (section.top <= line) current = section.id
  }
  return current
}

// Marks the last section whose top has passed under the sticky bar.
//
// Written as a scroll read rather than an IntersectionObserver on purpose. The
// obvious observer version uses a rootMargin band — something like
// '-72px 0px -60% 0px' — and that band can hold nothing at all: at the bottom
// of the document every section is either above it or below it, so the
// callback stops firing and the nav silently loses its highlight. Measured
// here at 1280x860, where the band was 272px tall and the final section sat
// clear underneath it.
//
// Comparing tops against one line always yields exactly one answer, at every
// scroll position including the very end.
function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    const sectionIds = key.split('|')

    const update = () => {
      const tops = sectionIds
        .map((id) => {
          const el = document.getElementById(id)
          return el ? { id, top: el.getBoundingClientRect().top } : null
        })
        .filter((s): s is { id: string; top: number } => s !== null)

      setActiveId(pickActiveSection(tops, ACTIVE_SECTION_LINE))
    }

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [key])

  return activeId
}
