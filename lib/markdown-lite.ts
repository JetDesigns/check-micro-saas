// A parser for exactly the markdown the Focused Fix specification produces, and
// nothing more.
//
// Headings, paragraphs, blockquotes for the client's own words, bulleted and
// numbered lists, and one extension: `[[figure:<imageId>]]` on a line by itself,
// which is where an uploaded screen sits.
//
// Deliberately NOT a general markdown library. Pulling one in would render a
// superset — tables, raw HTML, images by URL, nested lists — and every construct
// the spec does not use is a construct the model could produce that nothing would
// notice. A parser that refuses what it does not know turns "the model drifted
// into a table" into a validation failure instead of a rendering surprise.
//
// The validator and the renderer BOTH read the page through this, on purpose. Two
// readings of the same markdown would drift, and a page that validates on one
// reading and renders on the other is the failure this avoids.

export type Inline = { kind: 'text' | 'strong' | 'em'; text: string }

export type MdNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'paragraph'; raw: string; inlines: Inline[] }
  | { type: 'quote'; raw: string; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: { raw: string; inlines: Inline[] }[] }
  | { type: 'figure'; imageId: string }

const HEADING = /^(#{1,6})\s+(.*\S)\s*$/
const FIGURE = /^\[\[figure:([^\]\s]+)\]\]\s*$/
const BULLET = /^\s*[-*]\s+(.*\S)\s*$/
const NUMBERED = /^\s*\d+[.)]\s+(.*\S)\s*$/
const QUOTE = /^\s*>\s?(.*)$/

/** `**bold**`, `*italic*` and `_italic_`; everything else is text. */
export function parseInline(raw: string): Inline[] {
  const out: Inline[] = []
  const pattern = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = pattern.exec(raw)) !== null) {
    if (m.index > last) out.push({ kind: 'text', text: raw.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ kind: 'strong', text: m[1] })
    else out.push({ kind: 'em', text: (m[2] ?? m[3]) as string })
    last = m.index + m[0].length
  }
  if (last < raw.length) out.push({ kind: 'text', text: raw.slice(last) })
  return out
}

export function parseMarkdown(markdown: string): MdNode[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const nodes: MdNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      nodes.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2].trim(),
      })
      i++
      continue
    }

    const figure = FIGURE.exec(line)
    if (figure) {
      nodes.push({ type: 'figure', imageId: figure[1] })
      i++
      continue
    }

    if (QUOTE.test(line)) {
      const parts: string[] = []
      while (i < lines.length && QUOTE.test(lines[i])) {
        parts.push((QUOTE.exec(lines[i]) as RegExpExecArray)[1].trim())
        i++
      }
      const raw = parts.join(' ').replace(/\s+/g, ' ').trim()
      nodes.push({ type: 'quote', raw, inlines: parseInline(raw) })
      continue
    }

    const ordered = NUMBERED.test(line)
    if (ordered || BULLET.test(line)) {
      const matcher = ordered ? NUMBERED : BULLET
      const items: { raw: string; inlines: Inline[] }[] = []
      while (i < lines.length && matcher.test(lines[i])) {
        const raw = (matcher.exec(lines[i]) as RegExpExecArray)[1].trim()
        items.push({ raw, inlines: parseInline(raw) })
        i++
      }
      nodes.push({ type: 'list', ordered, items })
      continue
    }

    // A paragraph runs until the next blank line or the next construct.
    const parts: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HEADING.test(lines[i]) &&
      !FIGURE.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i])
    ) {
      parts.push(lines[i].trim())
      i++
    }
    const raw = parts.join(' ')
    nodes.push({ type: 'paragraph', raw, inlines: parseInline(raw) })
  }

  return nodes
}

/** The text of a node, flattened, for the checks that only care what it says. */
export function nodeText(node: MdNode): string {
  switch (node.type) {
    case 'heading':
      return node.text
    case 'paragraph':
    case 'quote':
      return node.raw
    case 'list':
      return node.items.map((it) => it.raw).join('\n')
    case 'figure':
      return ''
  }
}

export type Section = {
  /** The `##` heading, or null for what comes before the first one. */
  title: string | null
  nodes: MdNode[]
}

/** Splits at every level-2 heading. Content before the first one is its own section. */
export function splitSections(nodes: MdNode[]): Section[] {
  const sections: Section[] = [{ title: null, nodes: [] }]
  for (const node of nodes) {
    if (node.type === 'heading' && node.level === 2) {
      sections.push({ title: node.text, nodes: [] })
    } else {
      sections[sections.length - 1].nodes.push(node)
    }
  }
  return sections
}

/** The page title: the text of the first level-one heading, or null. */
export function pageTitle(markdown: string): string | null {
  const first = parseMarkdown(markdown).find((n) => n.type === 'heading' && n.level === 1)
  return first && first.type === 'heading' ? first.text : null
}
