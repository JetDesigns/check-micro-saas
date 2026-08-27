// Getting a JSON object back out of a model response.
//
// Two things go wrong here, and both have bitten this project before.
//
// First, the text is not always only JSON. Models wrap it in ```json fences,
// or put a sentence in front of it, and both are easy to tolerate.
//
// Second, and far more dangerous: a response can be TRUNCATED. `max_tokens`
// counts reasoning tokens as well as output, so a budget sized to the expected
// document gets eaten from the front and the JSON stops mid-string. That
// surfaces as `SyntaxError: Unterminated string in JSON` — never as anything
// resembling a length error — and it once masked itself for a whole eval run.
// So truncation is detected and named here rather than left to look like a
// malformed response.

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; truncated: boolean }

/**
 * Finds the outermost JSON object in a string.
 *
 * Brace counting has to ignore braces inside string literals, or a caption
 * containing "{" ends the object early. Escapes are tracked for the same
 * reason: a string ending in \" is not ending.
 */
export function findJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      if (inString) escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  // Ran out of text with the object still open — truncated.
  return null
}

export function parseJsonObject<T>(text: string): ParseResult<T> {
  const stripped = stripFences(text)
  const json = findJsonObject(stripped)

  if (json === null) {
    const opened = stripped.indexOf('{') !== -1
    return {
      ok: false,
      // An object that opens and never closes is a truncated response, not a
      // malformed one, and the fix is a bigger token budget rather than a
      // better prompt. Saying which saves an hour.
      error: opened
        ? 'Response ended before the JSON object closed — almost certainly truncated by max_tokens.'
        : 'No JSON object found in the response.',
      truncated: opened,
    }
  }

  try {
    return { ok: true, value: JSON.parse(json) as T }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'JSON.parse failed',
      truncated: false,
    }
  }
}

function stripFences(text: string): string {
  return text.replace(/```(?:json)?/gi, '')
}

/**
 * The text of a response, ignoring everything that is not text.
 *
 * Opus returns a `thinking` block first, so `content[0]` is a reasoning block
 * with an empty `text` field and a signature — verified against the live API,
 * not assumed. Anything indexing position 0 gets nothing back and reports it
 * as an empty response.
 */
export function extractText(
  content: Array<{ type: string; text?: string }>
): string {
  return content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('')
    .trim()
}

