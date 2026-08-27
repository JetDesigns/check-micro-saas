import { describe, expect, it } from 'vitest'
import {
  type Block,
  type CaseStudy,
  type ValidateOptions,
  countWords,
  isImperativeTitle,
  validateCaseStudy,
} from './case-study-blocks'

// A document that passes every rule. Each test mutates one thing away from
// this baseline, so a failure points at the rule under test rather than at
// whatever else happened to be wrong.
function validDoc(): CaseStudy {
  return {
    spine: [
      { id: 's1', finding: 'People compared four options.', requirement: 'Comparison must survive scrolling.', move: 'Pin the filters' },
      { id: 's2', finding: 'Defaults were never changed.', requirement: 'The default must be the good one.', move: 'Surface the better default' },
    ],
    blocks: [
      {
        type: 'metadata_grid',
        items: [
          { label: 'Year', value: '2024 · 6 weeks' },
          { label: 'Role', value: 'Product Designer' },
          { label: 'Client', value: 'A logistics company' },
          { label: 'Team', value: 'Solo' },
        ],
      },
      { type: 'prose', paragraphs: ['Short opening paragraph.'] },
      {
        type: 'requirement_cards',
        cards: [
          { spineId: 's1', index: 1, title: 'Comparison survives scrolling', body: 'Filters cannot scroll away.' },
          { spineId: 's2', index: 2, title: 'The default is the good one', body: 'Most people never change it.' },
        ],
      },
      {
        type: 'move_section',
        spineId: 's1',
        eyebrow: 'MOVE 1 — FILTERS',
        title: 'Pin the filters to the side',
        body: ['One paragraph explaining the move.'],
        visuals: [{ type: 'annotated_visual', imageId: 'img-1', caption: 'Filters stay pinned because people compared four options.' }],
      },
      {
        type: 'move_section',
        spineId: 's2',
        eyebrow: 'MOVE 2 — DEFAULTS',
        title: 'Surface the better default',
        body: ['Another paragraph.'],
        visuals: [{ type: 'annotated_visual', imageId: 'img-2', caption: 'The good option is preselected because nobody changed it.' }],
      },
      { type: 'outcome_status', status: 'shipped', note: 'Shipped in March.' },
    ],
  }
}

const IMAGES = { uploadedImageIds: ['img-1', 'img-2'] }

function rules(doc: CaseStudy, opts: ValidateOptions = IMAGES): string[] {
  return validateCaseStudy(doc, opts).map((i) => i.rule)
}

describe('the baseline fixture', () => {
  it('passes every rule, so later failures mean the mutation not the fixture', () => {
    expect(validateCaseStudy(validDoc(), IMAGES)).toEqual([])
  })
})

describe('rule 1 — spine length', () => {
  it('rejects a spine shorter than two', () => {
    const doc = validDoc()
    doc.spine = [doc.spine[0]]
    doc.blocks = doc.blocks.filter((b) => !(b.type === 'move_section' && b.spineId === 's2'))
    expect(rules(doc, { uploadedImageIds: ['img-1'] })).toContain('spine_length')
  })

  it('rejects a spine longer than four', () => {
    const doc = validDoc()
    doc.spine = [1, 2, 3, 4, 5].map((n) => ({ id: `s${n}`, finding: 'f', requirement: 'r', move: 'm' }))
    expect(rules(doc)).toContain('spine_length')
  })

  it('accepts the boundaries, two and four', () => {
    for (const size of [2, 4]) {
      const doc: CaseStudy = {
        spine: Array.from({ length: size }, (_, i) => ({ id: `s${i}`, finding: 'f', requirement: 'r', move: 'm' })),
        blocks: Array.from({ length: size }, (_, i) => ({
          type: 'move_section' as const,
          spineId: `s${i}`,
          eyebrow: `MOVE ${i + 1}`,
          title: 'Pin the thing',
          body: ['One.'],
          visuals: [],
        })),
      }
      expect(rules(doc, {})).not.toContain('spine_length')
    }
  })
})

describe('rule 2 — one move_section per spine entry, in order', () => {
  it('rejects a missing move', () => {
    const doc = validDoc()
    doc.blocks = doc.blocks.filter((b) => !(b.type === 'move_section' && b.spineId === 's2'))
    expect(rules(doc)).toContain('move_per_spine')
  })

  it('rejects moves that run out of spine order', () => {
    const doc = validDoc()
    const moves = doc.blocks.filter((b) => b.type === 'move_section')
    const rest = doc.blocks.filter((b) => b.type !== 'move_section')
    doc.blocks = [...rest, moves[1], moves[0]]
    expect(rules(doc)).toContain('move_spine_order')
  })
})

describe('rule 3 — traceability to the spine', () => {
  it('rejects a move pointing at a spine entry that does not exist', () => {
    const doc = validDoc()
    const move = doc.blocks.find((b) => b.type === 'move_section') as Extract<Block, { type: 'move_section' }>
    move.spineId = 'ghost'
    expect(rules(doc)).toContain('move_traces_to_spine')
  })

  it('rejects a requirement card pointing at a spine entry that does not exist', () => {
    const doc = validDoc()
    const cards = doc.blocks.find((b) => b.type === 'requirement_cards') as Extract<Block, { type: 'requirement_cards' }>
    cards.cards[0].spineId = 'ghost'
    expect(rules(doc)).toContain('requirement_traces_to_spine')
  })

  it('rejects duplicate spine ids, which would make tracing ambiguous', () => {
    const doc = validDoc()
    doc.spine[1].id = 's1'
    expect(rules(doc)).toContain('spine_ids_unique')
  })
})

describe('rule 4 — move titles are imperative', () => {
  it('accepts a verb phrase and rejects a feature name', () => {
    expect(isImperativeTitle('Surface the better default')).toBe(true)
    expect(isImperativeTitle('The New Dashboard')).toBe(false)
  })

  it.each(['The dashboard', 'A better flow', 'Our new filters', 'New settings page', 'Improved onboarding'])(
    'rejects the noun phrase %s',
    (title) => {
      expect(isImperativeTitle(title)).toBe(false)
    }
  )

  it.each(['Pin the filters', 'Remove the account gate', 'Collapse the sidebar'])(
    'accepts the imperative %s',
    (title) => {
      expect(isImperativeTitle(title)).toBe(true)
    }
  )

  it('flags a non-imperative title during validation', () => {
    const doc = validDoc()
    const move = doc.blocks.find((b) => b.type === 'move_section') as Extract<Block, { type: 'move_section' }>
    move.title = 'The New Dashboard'
    expect(rules(doc)).toContain('move_title_imperative')
  })
})

describe('rule 5 — prose caps', () => {
  it('rejects a prose block over three paragraphs', () => {
    const doc = validDoc()
    doc.blocks.push({ type: 'prose', paragraphs: ['a', 'b', 'c', 'd'] })
    expect(rules(doc)).toContain('prose_paragraph_cap')
  })

  it('rejects a paragraph over sixty words', () => {
    const doc = validDoc()
    doc.blocks.push({ type: 'prose', paragraphs: [Array(61).fill('word').join(' ')] })
    expect(rules(doc)).toContain('prose_word_cap')
  })

  it('accepts exactly sixty words, so the cap is not off by one', () => {
    const doc = validDoc()
    doc.blocks.push({ type: 'prose', paragraphs: [Array(60).fill('word').join(' ')] })
    expect(rules(doc)).not.toContain('prose_word_cap')
    expect(countWords(Array(60).fill('word').join(' '))).toBe(60)
  })

  it('rejects a move body over two paragraphs', () => {
    const doc = validDoc()
    const move = doc.blocks.find((b) => b.type === 'move_section') as Extract<Block, { type: 'move_section' }>
    move.body = ['a', 'b', 'c']
    expect(rules(doc)).toContain('move_body_cap')
  })
})

describe('rule 6 — a stat headline must carry a real number', () => {
  it('rejects a headline with no digit', () => {
    const doc = validDoc()
    doc.blocks.push({ type: 'stat_headline', text: 'Most of the traffic left early' })
    expect(rules(doc)).toContain('stat_has_digit')
  })

  it('accepts one with a digit', () => {
    const doc = validDoc()
    doc.blocks.push({ type: 'stat_headline', text: '70% left before opening a listing' })
    expect(rules(doc)).not.toContain('stat_has_digit')
  })

  it('is satisfied by omitting the block entirely', () => {
    expect(rules(validDoc())).not.toContain('stat_has_digit')
  })
})

describe('rule 7 — every uploaded image placed exactly once, captioned', () => {
  it('rejects an image that never appears', () => {
    expect(rules(validDoc(), { uploadedImageIds: ['img-1', 'img-2', 'img-3'] })).toContain('image_placed_once')
  })

  it('rejects an image used twice', () => {
    const doc = validDoc()
    const move = doc.blocks.find((b) => b.type === 'move_section') as Extract<Block, { type: 'move_section' }>
    move.visuals.push({ type: 'annotated_visual', imageId: 'img-2', caption: 'Second use.' })
    expect(rules(doc)).toContain('image_placed_once')
  })

  it('rejects a visual referencing an image the user never uploaded', () => {
    const doc = validDoc()
    doc.blocks.push({ type: 'annotated_visual', imageId: 'img-99', caption: 'From nowhere.' })
    expect(rules(doc)).toContain('image_known')
  })

  it('rejects an empty caption', () => {
    const doc = validDoc()
    const move = doc.blocks.find((b) => b.type === 'move_section') as Extract<Block, { type: 'move_section' }>
    move.visuals[0].caption = '   '
    expect(rules(doc)).toContain('visual_caption_required')
  })
})

describe('rule 8 — the cycle diagram is earned, not decorative', () => {
  it('rejects a cycle on a two-entry spine', () => {
    const doc = validDoc()
    doc.blocks.push({
      type: 'cycle_diagram',
      nodes: [
        { label: 'One', sublabel: 'a' },
        { label: 'Two', sublabel: 'b' },
        { label: 'Three', sublabel: 'c' },
      ],
      caption: 'A loop.',
    })
    expect(rules(doc)).toContain('cycle_requires_long_spine')
  })

  it('allows one on a three-entry spine', () => {
    const doc = validDoc()
    doc.spine.push({ id: 's3', finding: 'f', requirement: 'r', move: 'm' })
    doc.blocks.push({
      type: 'move_section',
      spineId: 's3',
      eyebrow: 'MOVE 3',
      title: 'Close the loop',
      body: ['Third.'],
      visuals: [],
    })
    doc.blocks.push({
      type: 'cycle_diagram',
      nodes: [
        { label: 'One', sublabel: 'a' },
        { label: 'Two', sublabel: 'b' },
        { label: 'Three', sublabel: 'c' },
      ],
      caption: 'A loop.',
    })
    const found = rules(doc)
    expect(found).not.toContain('cycle_requires_long_spine')
    expect(found).not.toContain('cycle_node_count')
  })

  it('rejects a node count outside three to five', () => {
    const doc = validDoc()
    doc.spine.push({ id: 's3', finding: 'f', requirement: 'r', move: 'm' })
    doc.blocks.push({ type: 'move_section', spineId: 's3', eyebrow: 'MOVE 3', title: 'Close the loop', body: ['x'], visuals: [] })
    doc.blocks.push({ type: 'cycle_diagram', nodes: [{ label: 'One', sublabel: 'a' }, { label: 'Two', sublabel: 'b' }], caption: 'Too few.' })
    expect(rules(doc)).toContain('cycle_node_count')
  })
})

describe('metadata grid size', () => {
  it('rejects fewer than four items', () => {
    const doc = validDoc()
    const grid = doc.blocks.find((b) => b.type === 'metadata_grid') as Extract<Block, { type: 'metadata_grid' }>
    grid.items = grid.items.slice(0, 3)
    expect(rules(doc)).toContain('metadata_item_count')
  })
})

describe('reporting shape', () => {
  it('returns every problem at once, so one retry can fix them all', () => {
    const doc = validDoc()
    doc.spine = [doc.spine[0]]
    const move = doc.blocks.find((b) => b.type === 'move_section') as Extract<Block, { type: 'move_section' }>
    move.title = 'The New Dashboard'
    move.body = ['a', 'b', 'c']

    const found = rules(doc, { uploadedImageIds: ['img-1'] })
    expect(found).toContain('spine_length')
    expect(found).toContain('move_title_imperative')
    expect(found).toContain('move_body_cap')
    expect(found.length).toBeGreaterThan(2)
  })
})
