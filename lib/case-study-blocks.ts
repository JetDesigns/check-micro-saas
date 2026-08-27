// The content contract between the synthesis agent and the renderer.
//
// The agent emits structured blocks, never markdown or freeform prose. That is
// what makes per-block editing and per-block regeneration possible, and it is
// what lets the rules below be enforced in code instead of hoped for in a
// prompt.
//
// THE SPINE is the reason this file exists. A case study reads as senior when
// one idea is restated at three levels of resolution with a 1:1 mapping:
//
//   finding (what you learned) → requirement (what it demanded) → move (what
//   you designed)
//
// Generic case studies fail because those are three unrelated lists. The
// wizard does not ask for three lists; it asks for a repeated decision unit
// (what you decided / what made you decide it / what you rejected) and derives
// all three levels from it. People can recall decisions. They cannot recall
// "requirements".

export type SpineEntry = {
  id: string
  finding: string
  requirement: string
  move: string
}

export type AnnotatedVisual = {
  type: 'annotated_visual'
  imageId: string
  caption: string
  pins?: { x: number; y: number; text: string }[]
}

export type Block =
  | { type: 'metadata_grid'; items: { label: string; value: string }[] }
  | { type: 'stat_headline'; text: string }
  | { type: 'prose'; paragraphs: string[] }
  | { type: 'pullquote'; text: string; attribution?: string }
  | {
      type: 'requirement_cards'
      cards: { spineId: string; index: number; title: string; body: string }[]
    }
  | {
      type: 'move_section'
      // Which spine entry this section realises. The spec described tracing
      // through the eyebrow string ("MOVE 1 — DEFAULTS"), but recovering an id
      // by regex out of display copy is exactly the "hope the model got it
      // right" this schema exists to remove. An explicit id makes the 1:1
      // mapping checkable; the eyebrow stays free to be whatever reads best.
      spineId: string
      eyebrow: string
      title: string
      body: string[]
      tradeoff?: { chose: string; rejected: string; because: string }
      visuals: AnnotatedVisual[]
    }
  | AnnotatedVisual
  | {
      type: 'cycle_diagram'
      nodes: { label: string; sublabel: string }[]
      caption: string
    }
  | { type: 'impact_list'; items: { title: string; body: string }[] }
  | {
      type: 'outcome_status'
      status: 'shipped' | 'proof_of_concept' | 'not_launched' | 'handed_off'
      note: string
    }
  | { type: 'learnings'; paragraphs: string[] }

export type CaseStudy = {
  spine: SpineEntry[]
  blocks: Block[]
}

// ---------------------------------------------------------------------------
// Limits, named so the prompt and the validator cannot drift apart.
// ---------------------------------------------------------------------------

export const SPINE_MIN = 2
export const SPINE_MAX = 4
export const PROSE_MAX_PARAGRAPHS = 3
export const PROSE_MAX_WORDS_PER_PARAGRAPH = 60
export const MOVE_BODY_MAX_PARAGRAPHS = 2
export const CYCLE_NODES_MIN = 3
export const CYCLE_NODES_MAX = 5
export const METADATA_ITEMS_MIN = 4
export const METADATA_ITEMS_MAX = 6

// A move title has to be an instruction, not a label. "Surface the better
// default" says what was done; "The New Dashboard" names a thing and could sit
// on any case study ever written.
//
// This is a heuristic, deliberately. Real part-of-speech tagging is not worth
// shipping here, and a verb allowlist would reject every title we did not
// think of. Instead it rejects the openings that reliably signal a noun
// phrase — determiners, possessives, and the adjectives people reach for when
// naming a feature. The QA agent catches what slips through; this catches the
// common case for free and never blocks a legitimate imperative.
const NOUN_PHRASE_OPENERS = new Set([
  'the', 'a', 'an',
  'this', 'that', 'these', 'those',
  'our', 'my', 'their', 'its', 'his', 'her', 'your',
  'new', 'improved', 'redesigned', 'updated', 'revamped', 'better',
])

export function isImperativeTitle(title: string): boolean {
  const first = title.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  if (!first) return false
  return !NOUN_PHRASE_OPENERS.has(first)
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
}

export function containsDigit(text: string): boolean {
  return /\d/.test(text)
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
//
// Returns every problem rather than throwing on the first. The pipeline feeds
// the whole list back to the synthesis agent as notes, so one retry can fix
// everything at once instead of surfacing faults one round trip at a time.

export type ValidationIssue = { rule: string; message: string }

export type ValidateOptions = {
  /** Ids of images the user uploaded. Every one must be placed, exactly once. */
  uploadedImageIds?: string[]
}

export function validateCaseStudy(
  doc: CaseStudy,
  options: ValidateOptions = {}
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (rule: string, message: string) => issues.push({ rule, message })

  const spine = doc.spine ?? []
  const blocks = doc.blocks ?? []

  // 1 — spine length.
  if (spine.length < SPINE_MIN || spine.length > SPINE_MAX) {
    add(
      'spine_length',
      `spine has ${spine.length} entries; must be between ${SPINE_MIN} and ${SPINE_MAX}`
    )
  }

  const spineIds = spine.map((s) => s.id)
  const duplicateIds = spineIds.filter((id, i) => spineIds.indexOf(id) !== i)
  if (duplicateIds.length > 0) {
    add('spine_ids_unique', `duplicate spine id(s): ${[...new Set(duplicateIds)].join(', ')}`)
  }

  const moveSections = blocks.filter(
    (b): b is Extract<Block, { type: 'move_section' }> => b.type === 'move_section'
  )

  // 2 — exactly one move_section per spine entry, in spine order.
  if (moveSections.length !== spine.length) {
    add(
      'move_per_spine',
      `${moveSections.length} move_section blocks for ${spine.length} spine entries; must be one each`
    )
  } else {
    const moveOrder = moveSections.map((m) => m.spineId)
    if (moveOrder.join('|') !== spineIds.join('|')) {
      add(
        'move_spine_order',
        `move_section order [${moveOrder.join(', ')}] does not match spine order [${spineIds.join(', ')}]`
      )
    }
  }

  // 3 — every move and requirement card traces to a real spine entry.
  for (const move of moveSections) {
    if (!spineIds.includes(move.spineId)) {
      add('move_traces_to_spine', `move_section references unknown spineId "${move.spineId}"`)
    }
  }
  for (const block of blocks) {
    if (block.type !== 'requirement_cards') continue
    for (const card of block.cards) {
      if (!spineIds.includes(card.spineId)) {
        add(
          'requirement_traces_to_spine',
          `requirement card "${card.title}" references unknown spineId "${card.spineId}"`
        )
      }
    }
  }

  // 4 — move titles are imperative.
  for (const move of moveSections) {
    if (!isImperativeTitle(move.title)) {
      add(
        'move_title_imperative',
        `move_section title "${move.title}" reads as a noun phrase; it must start with a verb`
      )
    }
  }

  // 5 — prose caps.
  for (const block of blocks) {
    if (block.type === 'prose') {
      if (block.paragraphs.length > PROSE_MAX_PARAGRAPHS) {
        add(
          'prose_paragraph_cap',
          `prose block has ${block.paragraphs.length} paragraphs; max ${PROSE_MAX_PARAGRAPHS}`
        )
      }
      block.paragraphs.forEach((p, i) => {
        const words = countWords(p)
        if (words > PROSE_MAX_WORDS_PER_PARAGRAPH) {
          add(
            'prose_word_cap',
            `prose paragraph ${i + 1} has ${words} words; max ${PROSE_MAX_WORDS_PER_PARAGRAPH}`
          )
        }
      })
    }
    if (block.type === 'move_section' && block.body.length > MOVE_BODY_MAX_PARAGRAPHS) {
      add(
        'move_body_cap',
        `move_section "${block.title}" has ${block.body.length} body paragraphs; max ${MOVE_BODY_MAX_PARAGRAPHS}`
      )
    }
  }

  // 6 — a stat headline without a number is an invented number waiting to
  // happen. The block is optional; a fabricated figure is not recoverable.
  for (const block of blocks) {
    if (block.type === 'stat_headline' && !containsDigit(block.text)) {
      add(
        'stat_has_digit',
        `stat_headline "${block.text}" contains no digit; omit the block rather than inventing one`
      )
    }
  }

  // 7 — every uploaded image placed exactly once, with a caption.
  const visuals: AnnotatedVisual[] = []
  for (const block of blocks) {
    if (block.type === 'annotated_visual') visuals.push(block)
    if (block.type === 'move_section') visuals.push(...block.visuals)
  }

  for (const visual of visuals) {
    if (visual.caption.trim().length === 0) {
      add('visual_caption_required', `annotated_visual "${visual.imageId}" has an empty caption`)
    }
  }

  const uploaded = options.uploadedImageIds ?? []
  if (uploaded.length > 0) {
    const placed = visuals.map((v) => v.imageId)
    for (const id of uploaded) {
      const count = placed.filter((p) => p === id).length
      if (count === 0) add('image_placed_once', `uploaded image "${id}" never appears`)
      if (count > 1) add('image_placed_once', `uploaded image "${id}" appears ${count} times; must be exactly once`)
    }
    for (const id of new Set(placed)) {
      if (!uploaded.includes(id)) {
        add('image_known', `annotated_visual references unknown image "${id}"`)
      }
    }
  }

  // 8 — a forced cycle diagram looks worse than none, so it is allowed only
  // where it can actually be true: a spine long enough to form a loop.
  const cycles = blocks.filter(
    (b): b is Extract<Block, { type: 'cycle_diagram' }> => b.type === 'cycle_diagram'
  )
  for (const cycle of cycles) {
    if (spine.length < 3) {
      add(
        'cycle_requires_long_spine',
        `cycle_diagram present with a ${spine.length}-entry spine; only allowed at 3 or 4`
      )
    }
    if (cycle.nodes.length < CYCLE_NODES_MIN || cycle.nodes.length > CYCLE_NODES_MAX) {
      add(
        'cycle_node_count',
        `cycle_diagram has ${cycle.nodes.length} nodes; must be ${CYCLE_NODES_MIN}–${CYCLE_NODES_MAX}`
      )
    }
  }
  if (cycles.length > 1) {
    add('cycle_single', `${cycles.length} cycle_diagram blocks; at most one`)
  }

  // Metadata grid size, from the wizard's four short fields plus optionals.
  for (const block of blocks) {
    if (block.type !== 'metadata_grid') continue
    if (block.items.length < METADATA_ITEMS_MIN || block.items.length > METADATA_ITEMS_MAX) {
      add(
        'metadata_item_count',
        `metadata_grid has ${block.items.length} items; must be ${METADATA_ITEMS_MIN}–${METADATA_ITEMS_MAX}`
      )
    }
  }

  return issues
}

export function isValidCaseStudy(doc: CaseStudy, options: ValidateOptions = {}): boolean {
  return validateCaseStudy(doc, options).length === 0
}
