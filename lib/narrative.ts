// Shape validation for the compiled narrative.
//
// Shared by /api/compile (validating model output) and /api/edit (validating
// user edits posted back from the case-study page). Both paths write to the
// same `compiled_narrative` column, so they must agree on what a valid
// narrative is — hence one module, not two copies.

import { NARRATIVE_SECTIONS } from '@/types/database'
import type { CompiledNarrative, NarrativeCallout } from '@/types/database'

export type NarrativeKey = keyof CompiledNarrative

export const NARRATIVE_KEYS: readonly NarrativeKey[] = NARRATIVE_SECTIONS.map(
  (s) => s.key
)

// Allowed callout kinds per section — mirrors the prompt's per-section table.
// A callout whose kind isn't listed for its section is dropped, not thrown:
// losing one callout beats failing a whole compile or edit.
export const CALLOUT_ALLOWLIST: Record<
  NarrativeKey,
  ReadonlyArray<NarrativeCallout['kind']>
> = {
  vision: ['insight'],
  discovery: ['insight', 'process'],
  signal: ['process'],
  design: ['insight'],
  testing: ['stat'],
  launch: ['insight'],
  growth: ['stat'],
  reflection: ['insight'],
}

export function validateCallout(
  input: unknown,
  section: NarrativeKey
): NarrativeCallout | null {
  if (input === null || input === undefined) return null
  if (typeof input !== 'object') return null

  const c = input as Record<string, unknown>
  const kind = c.kind
  if (typeof kind !== 'string') return null

  const allowed = CALLOUT_ALLOWLIST[section]
  if (!allowed.includes(kind as NarrativeCallout['kind'])) return null

  if (kind === 'insight') {
    const label = typeof c.label === 'string' ? c.label.trim() : ''
    const text = typeof c.text === 'string' ? c.text.trim() : ''
    if (label.length === 0 || text.length === 0) return null
    return { kind: 'insight', label, text }
  }

  if (kind === 'stat') {
    const rawItems = Array.isArray(c.items) ? c.items : []
    const items: Array<{ value: string; label: string }> = []
    for (const it of rawItems.slice(0, 2)) {
      if (typeof it !== 'object' || it === null) continue
      const o = it as Record<string, unknown>
      const value = typeof o.value === 'string' ? o.value.trim() : ''
      const label = typeof o.label === 'string' ? o.label.trim() : ''
      if (value.length === 0 || label.length === 0) continue
      items.push({ value, label })
    }
    if (items.length === 0) return null
    return { kind: 'stat', items }
  }

  if (kind === 'process') {
    const rawSteps = Array.isArray(c.steps) ? c.steps : []
    const steps: Array<{ n: number; title: string; text: string }> = []
    for (const st of rawSteps.slice(0, 4)) {
      if (typeof st !== 'object' || st === null) continue
      const o = st as Record<string, unknown>
      const n =
        typeof o.n === 'number'
          ? o.n
          : typeof o.n === 'string'
            ? Number(o.n)
            : NaN
      const title = typeof o.title === 'string' ? o.title.trim() : ''
      const text = typeof o.text === 'string' ? o.text.trim() : ''
      if (!Number.isFinite(n) || title.length === 0 || text.length === 0) continue
      steps.push({ n: Math.trunc(n), title, text })
    }
    if (steps.length < 3) return null
    return { kind: 'process', steps }
  }

  return null
}

// Validate a full 8-section narrative. Every key must be present with a
// non-empty subtitle and body; callouts are optional and individually
// validated. Throws on a missing or empty section — callers decide whether
// that means "retry the model" (compile) or "reject the request" (edit).
export function validateNarrative(input: unknown): CompiledNarrative {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Narrative missing or non-object.')
  }
  const record = input as Record<string, unknown>
  const out: Partial<CompiledNarrative> = {}
  for (const key of NARRATIVE_KEYS) {
    const raw = record[key]
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`Section missing: ${key}`)
    }
    const s = raw as Record<string, unknown>

    const subtitle = typeof s.subtitle === 'string' ? s.subtitle.trim() : ''
    const body = typeof s.body === 'string' ? s.body.trim() : ''
    if (subtitle.length === 0) {
      throw new Error(`Section "${key}" missing subtitle`)
    }
    if (body.length === 0) {
      throw new Error(`Section "${key}" missing body`)
    }

    out[key] = { subtitle, body, callout: validateCallout(s.callout, key) }
  }
  return out as CompiledNarrative
}
