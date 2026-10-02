import { describe, expect, it } from 'vitest'
import { pageTitle, parseInline, parseMarkdown, splitSections } from './markdown-lite'

// The validator and the renderer both read a page through this. What these guard is
// that they read it the SAME way, and that nothing outside the spec's small set of
// constructs is quietly understood as something else.

describe('parseMarkdown', () => {
  it('reads each construct the spec produces', () => {
    const nodes = parseMarkdown(
      [
        '# Title',
        '',
        'A subtitle.',
        '',
        '## Problem',
        '',
        '> The client said this.',
        '',
        '- one',
        '- two',
        '',
        '1. first',
        '2. second',
        '',
        '[[figure:abc-123]]',
      ].join('\n')
    )

    expect(nodes.map((n) => n.type)).toEqual([
      'heading', 'paragraph', 'heading', 'quote', 'list', 'list', 'figure',
    ])
    expect(nodes[0]).toMatchObject({ level: 1, text: 'Title' })
    expect(nodes[4]).toMatchObject({ ordered: false })
    expect(nodes[5]).toMatchObject({ ordered: true })
    expect(nodes[6]).toEqual({ type: 'figure', imageId: 'abc-123' })
  })

  it('joins the lines of one paragraph, and starts a new one at a blank line', () => {
    const nodes = parseMarkdown('one\ntwo\n\nthree')
    expect(nodes).toHaveLength(2)
    expect(nodes[0]).toMatchObject({ type: 'paragraph', raw: 'one two' })
  })

  it('joins a multi-line quotation into one', () => {
    const [q] = parseMarkdown('> line one\n> line two')
    expect(q).toMatchObject({ type: 'quote', raw: 'line one line two' })
  })

  it('ends a paragraph at the next construct without needing a blank line', () => {
    const nodes = parseMarkdown('text\n## Heading\n- item')
    expect(nodes.map((n) => n.type)).toEqual(['paragraph', 'heading', 'list'])
  })

  // The point of writing a small parser rather than importing a general one. A
  // table is not something the spec produces, so it must not be rendered as one:
  // it shows up as the text it is, where a validator can see it.
  it('does not understand tables, and says so by leaving them as text', () => {
    const [n] = parseMarkdown('| a | b |\n| - | - |')
    expect(n.type).toBe('paragraph')
  })

  it('is not fooled by a hash that is not a heading', () => {
    expect(parseMarkdown('#hashtag')[0].type).toBe('paragraph')
    expect(parseMarkdown('####### seven')[0].type).toBe('paragraph')
  })

  it('handles Windows line endings and an empty document', () => {
    expect(parseMarkdown('# A\r\n\r\ntext')).toHaveLength(2)
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown('\n\n\n')).toEqual([])
  })

  it('reads a figure marker only on a line by itself', () => {
    expect(parseMarkdown('see [[figure:x]] here')[0].type).toBe('paragraph')
  })
})

describe('parseInline', () => {
  it('reads bold and italic and leaves the rest as text', () => {
    expect(parseInline('a **b** c *d* e')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', text: 'b' },
      { kind: 'text', text: ' c ' },
      { kind: 'em', text: 'd' },
      { kind: 'text', text: ' e' },
    ])
  })

  it('does not treat a lone asterisk as emphasis', () => {
    expect(parseInline('2 * 3 = 6')).toEqual([{ kind: 'text', text: '2 * 3 = 6' }])
  })
})

describe('splitSections', () => {
  it('splits at every level-two heading and keeps the opening on its own', () => {
    const sections = splitSections(parseMarkdown('# T\n\nsub\n\n## A\n\nx\n\n## B\n\ny'))
    expect(sections.map((s) => s.title)).toEqual([null, 'A', 'B'])
    expect(sections[0].nodes).toHaveLength(2)
  })

  it('leaves level-three headings inside their section', () => {
    const sections = splitSections(parseMarkdown('## Solution\n\n### one\n\ntext\n\n### two\n\ntext'))
    expect(sections[1].nodes.filter((n) => n.type === 'heading')).toHaveLength(2)
  })
})

describe('pageTitle', () => {
  it('is the first level-one heading', () => {
    expect(pageTitle('# The title\n\nbody')).toBe('The title')
  })
  it('is null when there is none', () => {
    expect(pageTitle('## Only a section')).toBeNull()
    expect(pageTitle('')).toBeNull()
  })
})
