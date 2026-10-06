// Code checks for a generated Focused Fix page.
//
// The mechanically checkable half of the specification's final validation list
// (§12). It is code, so it is free and deterministic and runs on every attempt.
// The argument-level half — is the reframe actually present, is a reason really a
// reason — needs a reader, which is what the optional gate agent is for. This is
// what makes that agent optional: nothing below needs a model.
//
// Two tiers, deliberately.
//
//   ISSUES block. A page with one is not returned; its reasons go back to the
//   model as revision notes. These are the rules that are unambiguous enough that
//   failing one is a fact, not a judgement: the six sections, a quotation that
//   does not appear in anything the client said, a caption that names a decision
//   under a problem screen.
//
//   WARNINGS do not block. They are for checks that are heuristic — a number that
//   is not in the answers might be an invention or might be arithmetic on ones
//   that are — where blocking would spend retries on false alarms. They are stored
//   with the page so they are read, not lost.
//
// Returns EVERY problem at once, not the first, because the revision notes are
// sent back as a batch: one retry can fix everything, where finding faults one
// round trip at a time costs a model call each.

import { nodeText, parseMarkdown, splitSections, type MdNode } from '@/lib/markdown-lite'
import { evidenceBranch } from '@/lib/wizard-steps'
import type { GeneratedPage, ImageSlot, Intake } from '@/types/database'

export type Issue = { rule: string; message: string }

export type Validation = {
  issues: Issue[]
  warnings: Issue[]
  /** The reply, typed, when it had the right shape to be read at all. */
  page: Omit<GeneratedPage, 'meta'> | null
}

export const SECTIONS = ['Overview', 'Problem', 'Approach', 'Solution', 'Outcome', 'Credits'] as const

/** The six page-level choices, in the order the register must list them (§6.4). */
export const REGISTER_CHOICES = [
  'dominant_section',
  'section_length_pattern',
  'page_opening_move',
  'problem_opening',
  'fix_block_shape_sequence',
  'diagram_form',
] as const

export type ValidateContext = {
  intake: Intake
  images: { id: string; slot: ImageSlot; decisionId?: string; notice?: string }[]
  /**
   * The specification, as the system prompt received it.
   *
   * Passed in rather than read here: this module is a pure function with a test
   * file that never touches the filesystem, and it stays that way. Absent, the
   * spec-echo check does not run.
   */
  spec?: string
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Praise adjectives of the seamless/intuitive/beautiful/delightful family (§8.8).
// Unfalsifiable and the wrong register. Quotations are exempt: the client may have
// said it, and a quote is theirs, copied whole.
const PRAISE = /\b(seamless(?:ly)?|intuitive(?:ly)?|beautiful(?:ly)?|delightful(?:ly)?|effortless(?:ly)?|elegant(?:ly)?)\b/i

// Reflection, self-critique, lessons learned (§3.3). Prohibited as a section, a
// paragraph or a closing sentence — even when the designer supplied such material.
const REFLECTION_HEADING = /\b(reflection|lessons?|takeaways?|retrospective|what i(?:'d| would) do differently|looking back)\b/i
const REFLECTION_BODY =
  /\b(what i would do differently|in hindsight|lessons? (?:i )?learned|if i (?:did|were to do|had to do) (?:it|this) again|i would have)\b/i

// Narrating an absence (§10.2): saying that something was unavailable, unmeasured,
// not provided or not generated. Absence is handled by removal. Narrow on purpose —
// "was not measured" appears legitimately inside a designer's own sentence.
const ABSENCE = [
  /\b(?:metrics|numbers|figures|measurements|feedback|research|data)\s+(?:was|were|is|are)\s+(?:not|unavailable|n't)\b/i,
  /\b(?:no|without any)\s+(?:metrics|measurements|figures|quantitative data|client feedback)\s+(?:was|were|is|are|has|have)\s+(?:available|provided|collected|captured|recorded)\b/i,
  /\b(?:diagram|figure|screenshot|image)s?\s+(?:was|were|is|are)\s+not\s+(?:generated|included|provided)\b/i,
]

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
}

/** Every string the designer wrote, ids excluded — digits in a uuid are not numbers. */
function collectStrings(value: unknown, out: string[] = [], skipKey = false): string[] {
  if (typeof value === 'string') {
    if (!skipKey) out.push(value)
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out, skipKey)
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      collectStrings(v, out, k === 'id' || k === 'decisionId' || k === 'depends_on' || k === 'schema_version')
    }
  }
  return out
}

function numbersIn(text: string): Set<string> {
  const found = new Set<string>()
  for (const m of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) found.add(m[0].replace(/,/g, ''))
  for (const w of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (w in WORD_NUMBERS) found.add(String(WORD_NUMBERS[w]))
  }
  return found
}

const STOP = new Set([
  'that', 'this', 'with', 'from', 'were', 'have', 'into', 'their', 'there', 'than', 'then', 'when',
  'what', 'which', 'would', 'about', 'because', 'before', 'after', 'until', 'while', 'where',
])

function significantWords(text: string): string[] {
  return [...new Set(norm(text).split(' ').filter((w) => w.length >= 5 && !STOP.has(w)))]
}

/** The first two significant words, which is the cheapest reliable print of a construction. */
function openingFrame(text: string): string {
  return norm(text).split(' ').filter(Boolean).slice(0, 2).join(' ')
}

/**
 * The opening frame ALL of these share, or null.
 *
 * Different from the pairwise check the captions use. A caption rule is "no two
 * alike"; a block rule is "not every one alike", because §6.2 permits two blocks
 * to genuinely take the same shape and only forbids the whole section running to
 * one mould.
 */
function sharedFrame(texts: string[]): string | null {
  if (texts.length < 2) return null
  const frames = texts.map(openingFrame)
  if (frames.some((f) => f === '')) return null
  return frames.every((f) => f === frames[0]) ? frames[0] : null
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])[\s\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function wordsIn(nodes: MdNode[]): number {
  return nodes
    .filter((n) => n.type !== 'heading')
    .map(nodeText)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}

/** The five sections that can carry the page. Credits is a label list and never dominates. */
const CONTENT_SECTIONS = ['Overview', 'Problem', 'Approach', 'Solution', 'Outcome'] as const

// The page navigating itself — "described in Problem", "the second problem named
// above". These are directions to a reader who is already reading, and they stand
// where the argument should be. Anchored to the page's own section names and to
// above/earlier so that an ordinary sentence about something described in a log
// does not match.
const CROSS_REFERENCE = [
  /\b(?:described|named|mentioned|stated|set out|listed)\s+(?:above|earlier)\b/i,
  /\b(?:described|named|mentioned|stated|set out|listed)\s+in\s+(?:the\s+)?(?:Overview|Problem|Approach|Solution|Outcome|Credits)\b/i,
  /\b(?:first|second|third|fourth|last)\s+problem\s+named\b/i,
  /\bin\s+the\s+(?:Overview|Problem|Approach|Solution|Outcome)\s+section\b/i,
]

/**
 * How many consecutive words make an echo rather than a coincidence.
 *
 * Eight is chosen to be precise rather than thorough: it catches the
 * specification's sentences arriving on the page intact, and lets a paraphrase
 * through. A looser window would start flagging ordinary English.
 */
const SPEC_ECHO_WINDOW = 8

export function validateFocusedFix(value: unknown, ctx: ValidateContext): Validation {
  const issues: Issue[] = []
  const warnings: Issue[] = []
  const issue = (rule: string, message: string) => issues.push({ rule, message })
  const warn = (rule: string, message: string) => warnings.push({ rule, message })

  // ---- 1. Shape -------------------------------------------------------------
  // The reply is whatever JSON.parse returned from a model, so every field is
  // reached defensively. A validator that throws on malformed input has failed at
  // its one job — that is a lesson this codebase has already paid for once.
  if (!isObject(value)) {
    issue('shape', 'the reply is not a JSON object')
    return { issues, warnings, page: null }
  }
  const markdown = typeof value.markdown === 'string' ? value.markdown : ''
  const rawFigures = Array.isArray(value.figures) ? value.figures : null
  const rawRegister = Array.isArray(value.variance_register) ? value.variance_register : null
  const branch = value.branch

  if (markdown.trim() === '') issue('shape', '"markdown" is missing or empty')
  if (!rawFigures) issue('shape', '"figures" must be an array (an empty one when there are no screens)')
  if (!rawRegister) issue('shape', '"variance_register" must be an array')
  if (branch !== 'metric' && branch !== 'contribution') {
    issue('shape', '"branch" must be "metric" or "contribution"')
  }
  if (issues.length > 0) return { issues, warnings, page: null }

  const figures = (rawFigures as unknown[]).map((f) => (isObject(f) ? f : {}))
  const register = (rawRegister as unknown[]).map((r) => (isObject(r) ? r : {}))

  // ---- 2. Branch ------------------------------------------------------------
  const expected = evidenceBranch(ctx.intake)
  if (branch !== expected) {
    issue(
      'branch',
      `"branch" is "${String(branch)}" but the answers put this project on the ${expected} branch; it is derived, not chosen`
    )
  }

  // ---- 3. Structure ---------------------------------------------------------
  const nodes = parseMarkdown(markdown)
  const headings = nodes.filter((n): n is Extract<MdNode, { type: 'heading' }> => n.type === 'heading')

  const first = nodes[0]
  if (!first || first.type !== 'heading' || first.level !== 1) {
    issue('title', 'the page must open with a level-one "# " heading holding the project title')
  }
  if (headings.filter((h) => h.level === 1).length > 1) {
    issue('title', 'there is more than one level-one heading; the title appears once')
  }
  if (first?.type === 'heading' && first.level === 1) {
    const subtitle = nodes[1]
    if (!subtitle || subtitle.type !== 'paragraph' || nodeText(subtitle).trim() === '') {
      issue('subtitle', 'the title must be followed by a one-line subtitle paragraph (§3.2)')
    }
  }

  const h2 = headings.filter((h) => h.level === 2).map((h) => h.text)
  if (h2.join('|') !== SECTIONS.join('|')) {
    issue(
      'sections',
      `the level-two headings must be exactly ${SECTIONS.join(', ')} in that order (no additions, no renaming); got: ${h2.join(', ') || 'none'}`
    )
  }
  if (headings.some((h) => h.level >= 4)) {
    issue('sections', 'nothing deeper than a level-three heading may appear (§3.1)')
  }

  const sections = splitSections(nodes)

  for (const s of sections) {
    if (s.title !== 'Solution' && s.nodes.some((n) => n.type === 'heading' && n.level === 3)) {
      issue('sections', `a level-three heading appears inside "${s.title ?? 'the opening'}"; fix blocks live only in Solution`)
    }
    // No empty labelled slot, and no heading with nothing under it (§12 item 4).
    if (s.title && s.nodes.filter((n) => n.type !== 'heading').length === 0) {
      issue('empty_section', `"${s.title}" has a heading and nothing under it; a section with no material is shorter, not empty`)
    }
  }

  const solution = sections.find((s) => s.title === 'Solution')
  const fixBlocks: MdNode[][] = []
  for (const n of solution?.nodes ?? []) {
    if (n.type === 'heading' && n.level === 3) fixBlocks.push([n])
    else if (fixBlocks.length > 0) fixBlocks[fixBlocks.length - 1].push(n)
  }
  const wanted = ctx.intake.decisions.length
  if (fixBlocks.length < 2 || fixBlocks.length > 4) {
    issue('fix_count', `Solution has ${fixBlocks.length} fix blocks; it must have between two and four (§3.4)`)
  } else if (fixBlocks.length !== wanted) {
    issue(
      'fix_count',
      `Solution has ${fixBlocks.length} fix blocks but the designer gave ${wanted} decisions; every decision gets exactly one block, in their order`
    )
  }
  fixBlocks.forEach((block, i) => {
    if (block.filter((n) => n.type !== 'heading' && n.type !== 'figure').length === 0) {
      issue('empty_section', `fix block ${i + 1} ("${nodeText(block[0])}") is a heading with no argument under it`)
    }
  })

  // The preamble: title, subtitle, and the metadata strip.
  const preamble = sections[0]?.nodes ?? []
  for (const n of preamble.slice(2)) {
    if (n.type !== 'list' || n.ordered) {
      issue('metadata', 'between the subtitle and Overview only the metadata strip (a bulleted list) may appear')
    }
  }

  const credits = sections.find((s) => s.title === 'Credits')
  for (const n of credits?.nodes ?? []) {
    if (n.type !== 'list' || n.ordered) {
      issue('credits', 'Credits is label: value pairs in a bulleted list and nothing else — never a paragraph (§4.6)')
      break
    }
    for (const item of n.items) {
      if (!/^[^:]{1,40}:\s*\S/.test(item.raw)) {
        issue('credits', `the Credits line "${item.raw}" is not a "Label: value" pair`)
      }
    }
  }
  if (ctx.intake.role && credits && !norm(credits.nodes.map(nodeText).join(' ')).includes(norm(ctx.intake.role))) {
    warn('credits', `the designer's role ("${ctx.intake.role}") is missing from Credits`)
  }

  // ---- 4. Voice and banned content -----------------------------------------
  const prose = nodes.filter((n) => n.type !== 'quote')
  for (const n of prose) {
    const text = nodeText(n)
    const praise = PRAISE.exec(text)
    if (praise) issue('praise', `"${praise[0]}" is a praise adjective (§8.8); describe what the thing did instead`)
    if (text.includes(' · ')) issue('middle_dot', `"${text.slice(0, 60)}" joins values with a middle dot (§8.8)`)
    for (const pattern of ABSENCE) {
      const hit = pattern.exec(text)
      if (hit) issue('narrated_absence', `"${hit[0]}" narrates an absence; leave the thing out and say nothing (§10.2)`)
    }
  }
  for (const h of headings) {
    if (h.level >= 2 && REFLECTION_HEADING.test(h.text)) {
      issue('reflection', `the heading "${h.text}" is reflection or self-critique, which is prohibited anywhere on the page (§3.3)`)
    }
  }
  for (const n of prose) {
    if (n.type === 'heading') continue
    const hit = REFLECTION_BODY.exec(nodeText(n))
    if (hit) issue('reflection', `"${hit[0]}" is self-critique, which is prohibited even as a single sentence (§3.3)`)
  }

  // The page is read on its own, by someone who has not been told it has sections
  // called things. A sentence that points at another part of it is navigation
  // standing where an argument belongs — and it is what a tie-back collapses into
  // when nothing stops it.
  for (const n of prose) {
    if (n.type === 'heading') continue
    const text = nodeText(n)
    for (const pattern of CROSS_REFERENCE) {
      const hit = pattern.exec(text)
      if (hit) {
        issue(
          'cross_reference',
          `"${hit[0]}" points at another part of the page instead of making the argument; carry the connection in its own terms`
        )
        break
      }
    }
  }

  // The specification is instructions. Its sentences arriving on the page is the
  // most reliable sameness tell there is, because it is the one thing every page
  // generated from it has in common. A window that also appears in the designer's
  // own answers is theirs, not the spec's, and is left alone.
  if (ctx.spec) {
    const specWords = ` ${norm(ctx.spec)} `
    const ownWords = ` ${norm(collectStrings(ctx.intake).join(' '))} `
    for (const n of prose) {
      if (n.type === 'heading') continue
      const words = norm(nodeText(n)).split(' ').filter(Boolean)
      for (let i = 0; i + SPEC_ECHO_WINDOW <= words.length; i++) {
        const window = words.slice(i, i + SPEC_ECHO_WINDOW).join(' ')
        if (specWords.includes(` ${window} `) && !ownWords.includes(` ${window} `)) {
          issue(
            'spec_echo',
            `"${window}" is the specification's own wording; it is instructions to you, not material for the page`
          )
          break
        }
      }
    }
  }

  // ---- 5. Quotations --------------------------------------------------------
  // The most serious thing this can catch. A reconstructed quotation is a fact
  // about a real client that nobody said, and §10.3 forbids it even when the
  // client plausibly would have. Every blockquote has to be found, whole, inside
  // wording the designer marked as the client's own.
  const clientWords = [
    ctx.intake.reported_verbatim ? ctx.intake.reported_problem : undefined,
    ctx.intake.client_response,
    ...ctx.intake.decisions.map((d) => d.client_request),
  ]
    .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
    .map(norm)

  for (const n of nodes) {
    if (n.type !== 'quote') continue
    const quoted = norm(n.raw)
    if (quoted === '') continue
    if (!clientWords.some((w) => w.includes(quoted))) {
      issue(
        'invented_quote',
        `the quotation "${n.raw.slice(0, 80)}" is not found in anything the client said; quote only wording the designer marked as their exact words, copied exactly`
      )
    }
  }

  // ---- 6. Figures and captions ---------------------------------------------
  const markers = nodes.filter((n): n is Extract<MdNode, { type: 'figure' }> => n.type === 'figure').map((n) => n.imageId)
  const known = new Map(ctx.images.map((i) => [i.id, i]))

  for (const id of new Set(markers)) {
    if (!known.has(id)) issue('figure', `[[figure:${id}]] refers to an image that was not uploaded`)
    if (markers.filter((m) => m === id).length > 1) issue('figure', `[[figure:${id}]] appears more than once; each image is placed at most once`)
  }
  const figureIds = figures.map((f) => String(f.imageId ?? ''))
  for (const id of new Set(markers)) {
    if (!figureIds.includes(id)) issue('figure', `[[figure:${id}]] has no entry in "figures"`)
  }
  for (const id of figureIds) {
    if (!markers.includes(id)) issue('figure', `"figures" has an entry for ${id} that the markdown never places`)
  }
  // An image the designer described is an image with something to point at (§8.7).
  // One with nothing said may be dropped; one they described may not.
  for (const img of ctx.images) {
    if (img.notice?.trim() && !markers.includes(img.id)) {
      issue('figure', `image ${img.id} has a note ("${img.notice.slice(0, 60)}") but is never placed; the designer said what to notice, so it has a point to make`)
    }
  }

  const decided = ctx.intake.decisions.map((d) => norm(d.decided)).filter(Boolean)
  const frames = new Map<string, string>()
  for (const f of figures) {
    const id = String(f.imageId ?? '')
    const caption = typeof f.caption === 'string' ? f.caption.trim() : ''
    const alt = typeof f.alt === 'string' ? f.alt.trim() : ''

    if (caption === '') issue('caption', `the figure ${id} has an empty caption`)
    if (alt === '') issue('alt', `the figure ${id} has no alt text`)
    if (caption && alt && norm(caption) === norm(alt)) {
      issue('alt', `the figure ${id} has the same caption and alt text; they do different jobs (§8.6)`)
    }
    if (/^(screenshot|image|picture|photo) of\b/i.test(alt)) {
      issue('alt', `the alt text for ${id} describes a file ("${alt.slice(0, 40)}…"), not a screen (§8.8)`)
    }

    const img = known.get(id)
    if (img?.slot === 'problem' && caption) {
      // A problem screen is evidence. No decision has been made at that point in
      // the page, so a caption that names one is pointing at something the reader
      // has not met.
      const c = norm(caption)
      if (decided.some((d) => d.length >= 12 && c.includes(d))) {
        issue('caption_slot', `the caption for problem screen ${id} names a decision; it must name the evidence and what it indicates about the prior state`)
      }
      if (img.notice && norm(img.notice) === c) {
        issue('caption_slot', `the caption for problem screen ${id} only repeats the designer's note; say what the evidence indicates`)
      }
    }

    // No two captions may share a syntactic frame (§8.6); the opening two words
    // are the cheapest reliable signal of one.
    const frame = openingFrame(caption)
    if (frame && frames.has(frame)) {
      issue('caption_frame', `the captions for ${frames.get(frame)} and ${id} both open "${frame}"; captions built from one mould read as generated`)
    } else if (frame) {
      frames.set(frame, id)
    }
  }

  // ---- 7. The variance register --------------------------------------------
  const choices = register.map((r) => String(r.choice ?? ''))
  for (const choice of REGISTER_CHOICES) {
    const entry = register.find((r) => r.choice === choice)
    if (!entry) {
      issue('register', `the variance register has no "${choice}" entry`)
      continue
    }
    if (typeof entry.value !== 'string' || entry.value.trim() === '') {
      issue('register', `"${choice}" has no value`)
    }
    // A choice that cannot cite a driver was taken by default (§6.4), and that is
    // the failure this register exists to expose.
    if (typeof entry.driver !== 'string' || entry.driver.trim().length < 12) {
      issue('register', `"${choice}" cites no driver from this project's material; a choice with no driver was taken by default`)
    }
  }
  for (const c of new Set(choices)) {
    if (!(REGISTER_CHOICES as readonly string[]).includes(c)) issue('register', `"${c}" is not one of the six register choices`)
    if (choices.filter((x) => x === c).length > 1) issue('register', `"${c}" appears more than once in the register`)
  }
  // The writer produces no diagram: Approach's visual is derived from the intake
  // in lib/approach-diagram.ts and attached after this runs, so from the model's
  // side the page genuinely has none. Round 4 removed this check because the
  // model was being asked for a diagram; it is back because it no longer is.
  const diagram = register.find((r) => r.choice === 'diagram_form')
  if (diagram && diagram.value !== 'omitted') {
    issue('register', 'diagram_form must be "omitted"; the page you write carries no diagram')
  }

  // Until this check existed the register was taken on trust: a driver was
  // measured for length and never against the page. The first register this
  // pipeline ever produced claimed Problem carried the page, three runs in a row,
  // on a page whose Solution was nearly twice as long. §6.4a says dominance is
  // expressed in length and detail density; a claim the page contradicts is worse
  // than no claim, because it reports that the choice was derived when it was not.
  const dominant = register.find((r) => r.choice === 'dominant_section')
  if (dominant && typeof dominant.value === 'string' && dominant.value.trim() !== '') {
    const counts = CONTENT_SECTIONS.map(
      (name) => [name, wordsIn(sections.find((x) => x.title === name)?.nodes ?? [])] as const
    )
    const claimedValue = norm(dominant.value)
    const claimed = counts.find(([name]) => claimedValue.includes(norm(name)))

    if (!claimed) {
      issue(
        'dominance',
        `"dominant_section" is "${dominant.value}", which names none of ${CONTENT_SECTIONS.join(', ')}`
      )
    } else {
      const ranked = [...counts].sort((a, b) => b[1] - a[1])
      const [topName, topWords] = ranked[0]
      const [claimedName, claimedWords] = claimed
      // A near-tie is not a lie: either section can be said to carry the page.
      if (claimedName !== topName && claimedWords < topWords * 0.95) {
        issue(
          'dominance',
          `the register says ${claimedName} dominates, but ${topName} is the longest section (${topWords} words against ${claimedWords}); dominance is carried in length and detail, not asserted (§6.4a)`
        )
      } else {
        const runnerUp = ranked.find(([name]) => name !== claimedName)
        if (runnerUp && claimedWords < runnerUp[1] * 1.1) {
          warn(
            'dominance',
            `${claimedName} is named as the dominant section but leads ${runnerUp[0]} by less than a tenth (${claimedWords} against ${runnerUp[1]}); no section clearly carries this page`
          )
        }
      }
    }
  }

  // ---- 8. One mould across the fix blocks ----------------------------------
  // §8.6 bans captions built from one mould, and §11.2 treats page-level sameness
  // as severely as invention — but both were enforced only where captions exist.
  // The loudest tell in the pages this pipeline has produced was neither: three
  // blocks whose tie-back and whose closing sentence were the same construction
  // with the nouns swapped, under three different shape labels in the register.
  // The labels said the blocks differed. The sentences said otherwise, and
  // nothing read the sentences.
  const blockProse = fixBlocks.map((block) =>
    block.filter((n) => n.type === 'paragraph' || n.type === 'list')
  )
  const blockSentences = blockProse.map((body) => sentences(body.map(nodeText).join(' ')))

  if (blockSentences.length >= 2 && blockSentences.every((ss) => ss.length > 0)) {
    const opening = sharedFrame(blockSentences.map((ss) => ss[0]))
    if (opening) {
      issue(
        'block_frame',
        `every fix block opens "${opening}"; §6.2 says the opening move is chosen per block from its own material, and blocks built from one mould read as generated whatever shape they are labelled`
      )
    }
    const closing = sharedFrame(blockSentences.map((ss) => ss[ss.length - 1]))
    if (closing) {
      issue(
        'block_frame',
        `every fix block closes on "${closing}"; the move a block ends on is part of its shape, and repeating it collapses the variance §6.2 asks for`
      )
    }
  }

  const tiebacks = new Map((ctx.intake.tiebacks ?? []).map((t) => [t.decisionId, t.painPoint]))

  // §6.3 fixes WHERE the tie-back sits, not how it is worded. Read as a wording
  // rule it produces "This is the X described in Problem" once per block, which
  // is how the first generated pages read.
  const tiebackSentences: string[] = []
  ctx.intake.decisions.forEach((d, i) => {
    const pain = tiebacks.get(d.id)
    const said = blockSentences[i]
    if (!pain || !said?.length) return
    const words = significantWords(pain)
    if (words.length === 0) return

    let best = ''
    let bestScore = 0
    for (const sentence of said) {
      const text = norm(sentence)
      const score = words.filter((w) => text.includes(w)).length
      if (score > bestScore) {
        bestScore = score
        best = sentence
      }
    }
    if (bestScore > 0) tiebackSentences.push(best)
  })
  if (tiebackSentences.length === fixBlocks.length) {
    const shared = sharedFrame(tiebackSentences)
    if (shared) {
      issue(
        'tieback_frame',
        `every fix ties back with a sentence opening "${shared}"; §6.3 fixes where the tie-back sits, not how it is worded — write each one in the terms of the pain point it answers`
      )
    }
  }

  // ---- Warnings: heuristic, kept but not blocking --------------------------
  // A number on the page that is nowhere in the answers might be an invention or
  // might be arithmetic on numbers that are. Either way someone should look.
  const allowed = numbersIn(collectStrings(ctx.intake).join(' '))
  const flagged = new Set<string>()
  for (const n of prose) {
    if (n.type === 'heading') continue
    for (const m of nodeText(n).matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
      const num = m[0].replace(/,/g, '')
      if (!allowed.has(num)) flagged.add(num)
    }
  }
  for (const num of flagged) {
    warn('number', `${num} appears on the page but in none of the answers — an invention, or arithmetic on numbers that are there`)
  }

  const problemText = norm((sections.find((s) => s.title === 'Problem')?.nodes ?? []).map(nodeText).join(' '))
  ctx.intake.decisions.forEach((d, i) => {
    const pain = tiebacks.get(d.id)
    const block = fixBlocks[i]
    if (!pain || !block) return
    const words = significantWords(pain)
    if (words.length === 0) return
    const inBlock = norm(block.map(nodeText).join(' '))
    const hitBlock = words.filter((w) => inBlock.includes(w)).length / words.length
    const hitProblem = words.filter((w) => problemText.includes(w)).length / words.length
    if (hitBlock < 0.4) warn('tieback', `fix ${i + 1} does not visibly tie back to "${pain}"`)
    if (hitProblem < 0.4) warn('tieback', `"${pain}" (the pain point fix ${i + 1} answers) is not named in Problem`)
  })

  const flags = Array.isArray(value.needs_confirmation) ? value.needs_confirmation.filter((s) => typeof s === 'string') : []
  if (flags.length > 0) warn('needs_confirmation', `the writer flagged ${flags.length} passage(s) it could not confirm from the answers`)

  const page: Validation['page'] = {
    markdown,
    figures: figures.map((f) => ({
      imageId: String(f.imageId ?? ''),
      caption: String(f.caption ?? ''),
      alt: String(f.alt ?? ''),
    })),
    variance_register: register.map((r) => ({
      choice: String(r.choice ?? ''),
      value: String(r.value ?? ''),
      driver: String(r.driver ?? ''),
    })),
    branch: branch as 'metric' | 'contribution',
    // Attached by the pipeline from the intake, never read off the reply.
    diagram: null,
    ...(flags.length > 0 ? { needs_confirmation: flags as string[] } : {}),
  }

  return { issues, warnings, page }
}
