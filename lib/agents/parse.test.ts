import { describe, expect, it } from 'vitest'
import { extractText, findJsonObject, parseJsonObject } from './parse'

// Both functions here guard a failure that has already cost this project real
// time, and neither failure announces itself.
//
// extractText: opus returns a `thinking` block first, so content[0] is a
// reasoning block whose `text` is undefined. Reading position 0 — the obvious
// thing to write — yields nothing and looks like an empty response from the
// model. Confirmed against the live API before this was written.
//
// parseJsonObject: `max_tokens` counts reasoning tokens as well as output, so
// a budget sized to the expected document gets eaten from the front and the
// JSON stops mid-string. It surfaces as "Unterminated string in JSON", never
// as anything resembling a length problem, and it once hid behind a dev stub
// for an entire eval run.

describe('extractText', () => {
  it('skips the thinking block opus puts first, which is where content[0] lies', () => {
    const content = [
      { type: 'thinking', thinking: 'weighing it up', signature: 'abc' },
      { type: 'text', text: '{"ok":true}' },
    ]
    expect(extractText(content)).toBe('{"ok":true}')
  })

  it('joins several text blocks rather than taking only the first', () => {
    expect(
      extractText([
        { type: 'text', text: '{"a":1,' },
        { type: 'text', text: '"b":2}' },
      ])
    ).toBe('{"a":1,"b":2}')
  })

  it('returns empty rather than throwing when there is no text at all', () => {
    expect(extractText([{ type: 'thinking' }])).toBe('')
  })
})

describe('findJsonObject', () => {
  it('ignores braces inside strings, so a caption containing one cannot end the object early', () => {
    const text = '{"caption":"the { in this label is not structure","n":1}'
    expect(findJsonObject(text)).toBe(text)
  })

  it('is not fooled by an escaped quote, which would otherwise flip it out of the string', () => {
    const text = '{"quote":"they said \\"it clears itself\\" every shift","n":2}'
    expect(findJsonObject(text)).toBe(text)
  })

  it('finds the object when the model talks first', () => {
    expect(findJsonObject('Here is the document:\n{"a":1}')).toBe('{"a":1}')
  })

  it('returns null when the object never closes, which is what truncation looks like', () => {
    expect(findJsonObject('{"a":1,"b":"unterminated')).toBeNull()
  })
})

describe('parseJsonObject', () => {
  it('reads through a ```json fence', () => {
    const r = parseJsonObject<{ a: number }>('```json\n{"a":1}\n```')
    expect(r.ok && r.value.a).toBe(1)
  })

  it('names truncation as truncation, because the fix is a bigger budget not a better prompt', () => {
    const r = parseJsonObject('{"spine":[{"finding":"they photographed the scr')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.truncated).toBe(true)
    expect(r.error).toContain('max_tokens')
  })

  it('does not call an empty response truncated, since nothing was cut off', () => {
    const r = parseJsonObject('I am unable to help with that.')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.truncated).toBe(false)
  })

  it('reports a real syntax error as itself rather than as truncation', () => {
    const r = parseJsonObject('{"a":1,,}')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.truncated).toBe(false)
  })
})
