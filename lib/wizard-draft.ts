// The wizard's answers, kept somewhere that survives the page.
//
// Until this existed every answer lived in React state and nowhere else, so a
// reload, a dev-server restart, a hot-reload that reset the form component, or
// navigating away threw away a filled-in form. A person had typed for twenty
// minutes and lost all of it to something that had nothing to do with what they
// wrote. That is the failure this file exists to remove.
//
// Split in two on purpose. The pure half below — what a draft is, how to build
// one, how to read one back without trusting it — is tested. The storage half
// (localStorage for the text, IndexedDB for the files) lives in
// lib/draft-storage.ts and is thin enough that there is little left in it to be
// wrong.
//
// A draft is READ DEFENSIVELY. It was written by an earlier version of this
// code, possibly by a different field set, and possibly truncated by a full disk.
// A corrupt draft must never be able to stop the wizard opening: anything that
// does not parse to exactly the shape expected is treated as no draft at all.

import type { TextKey, ToggleKey, WorkShape } from '@/lib/intake-fields'
import type { Attachment, StepId } from '@/lib/wizard-steps'
import type {
  Collaborator,
  Decision,
  ImageSlot,
  OutcomeStatus,
  ProjectType,
  Provenance,
  SectionFate,
  Tone,
} from '@/types/database'

export const DRAFT_KEY = 'check.studio.draft'

/**
 * Bump when the shape changes incompatibly. An older draft is then discarded
 * rather than half-read, which is the safe direction: the person re-types, and
 * nothing is ever interpreted through a field set it was not written for.
 */
export const DRAFT_VERSION = 1

/** Everything about an attachment except the bytes, which live in IndexedDB. */
export type DraftAttachment = {
  id: string
  slot: ImageSlot
  decisionId?: string
  notice: string
  name: string
  type: string
  lastModified: number
}

/**
 * A case study row that was already created for exactly these answers.
 *
 * Kept so a retry after a failed write does not create a second row and upload
 * every screen a second time. `fingerprint` is what makes reusing it safe: if
 * the answers changed since, the fingerprint no longer matches and a fresh row
 * is made.
 */
export type SavedRow = { id: string; fingerprint: string }

export type Draft = {
  version: typeof DRAFT_VERSION
  savedAt: number
  step: StepId
  projectType: ProjectType
  tone: Tone
  text: Partial<Record<TextKey, string>>
  toggles: Partial<Record<ToggleKey, boolean>>
  decisions: Decision[]
  collaborators: Collaborator[]
  provenance: Provenance | null
  outcome: OutcomeStatus | null
  areasWorked: string[]
  areasFromScratch: string[]
  shape: WorkShape | null
  sectionFates: Record<string, SectionFate>
  attachments: DraftAttachment[]
  saved: SavedRow | null
}

export type DraftInput = Omit<Draft, 'version' | 'savedAt' | 'attachments'> & {
  attachments: Attachment[]
}

export function toDraft(input: DraftInput, now: number = Date.now()): Draft {
  return {
    ...input,
    version: DRAFT_VERSION,
    savedAt: now,
    attachments: input.attachments.map((a) => ({
      id: a.id,
      slot: a.slot,
      ...(a.decisionId ? { decisionId: a.decisionId } : {}),
      notice: a.notice,
      name: a.file.name,
      type: a.file.type,
      lastModified: a.file.lastModified,
    })),
  }
}

const STEPS: readonly unknown[] = [1, 2, 3, 4, 5, 'review']
const SLOTS: readonly unknown[] = ['problem', 'before', 'after']
const SHAPES: readonly unknown[] = ['separate_parts', 'single_page']
const FATES: readonly unknown[] = ['added', 'kept', 'cut']

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * A draft from whatever was in storage, or null.
 *
 * Null covers every way this can go wrong — nothing stored, not JSON, wrong
 * version, wrong shape — because the caller's only sensible response to all of
 * them is the same: start empty.
 */
export function parseDraft(raw: string | null | undefined): Draft | null {
  if (!raw) return null

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isObject(value) || value.version !== DRAFT_VERSION) return null
  if (!STEPS.includes(value.step)) return null
  if (!isObject(value.text) || !isObject(value.toggles)) return null
  if (!Array.isArray(value.decisions) || !Array.isArray(value.collaborators)) return null
  if (!Array.isArray(value.attachments)) return null

  for (const d of value.decisions) {
    if (!isObject(d) || typeof d.id !== 'string') return null
    if (typeof d.decided !== 'string' || typeof d.why !== 'string') return null
  }
  for (const a of value.attachments) {
    if (!isObject(a) || typeof a.id !== 'string' || typeof a.name !== 'string') return null
    if (!SLOTS.includes(a.slot) || typeof a.notice !== 'string') return null
  }
  for (const c of value.collaborators) {
    if (!isObject(c) || typeof c.name !== 'string' || typeof c.role !== 'string') return null
  }

  const saved = value.saved
  if (saved !== null && saved !== undefined) {
    if (!isObject(saved) || typeof saved.id !== 'string' || typeof saved.fingerprint !== 'string') {
      return null
    }
  }

  // Defaulted rather than demanded: a draft written before these existed is
  // still the person's work, and bumping the version to reject it would throw
  // away a part-filled form to gain nothing.
  //
  // EVERY ONE OF THESE NEEDS ITS LINE BELOW, not just a property on `Draft`.
  // The spread is an unchecked cast, so a field named only in the type arrives
  // `undefined` from an older draft with nothing complaining, and the form then
  // sets `undefined` into state that is typed as holding neither.
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

  // One unrecognised fate drops out instead of taking the whole draft with it.
  const fates = (v: unknown): Record<string, SectionFate> =>
    isObject(v)
      ? (Object.fromEntries(
          Object.entries(v).filter(([, fate]) => FATES.includes(fate))
        ) as Record<string, SectionFate>)
      : {}

  return {
    ...(value as unknown as Draft),
    areasWorked: strings(value.areasWorked),
    areasFromScratch: strings(value.areasFromScratch),
    shape: SHAPES.includes(value.shape) ? (value.shape as WorkShape) : null,
    sectionFates: fates(value.sectionFates),
    saved: (saved as SavedRow | null | undefined) ?? null,
  }
}

/**
 * Whether there is anything worth offering to clear.
 *
 * Deliberately generous about "nothing": a fresh wizard already has two empty
 * decision cards and a default tone, and none of that is the person's work.
 */
export function draftHasAnswers(
  d: Pick<
    Draft,
    'text' | 'decisions' | 'collaborators' | 'provenance' | 'outcome' | 'toggles' | 'shape'
  > & {
    /** Only the count matters, so a live Attachment[] and a stored one both fit. */
    attachments: readonly unknown[]
  }
): boolean {
  const anyText = Object.values(d.text).some((v) => typeof v === 'string' && v.trim() !== '')
  const anyDecision = d.decisions.some(
    (x) =>
      x.decided.trim() !== '' ||
      x.why.trim() !== '' ||
      (x.prior_behaviour ?? '').trim() !== '' ||
      (x.consequence ?? '').trim() !== ''
  )
  const anyToggle = Object.values(d.toggles).some(Boolean)
  return (
    anyText ||
    anyDecision ||
    anyToggle ||
    d.collaborators.some((c) => c.name.trim() !== '' || c.role.trim() !== '') ||
    d.attachments.length > 0 ||
    d.provenance !== null ||
    d.outcome !== null ||
    // A picked option is an answer, the same as provenance and outcome above.
    // `sectionFates` is left out for the reason the area lists are: nobody can
    // have sorted a section without typing it first, which `anyText` covers.
    d.shape !== null
  )
}

/**
 * What identifies "these exact answers and these exact files".
 *
 * Compared against SavedRow.fingerprint before a retry reuses a row that
 * already exists. Attachment size stands in for content: it is enough to notice
 * a swapped file at the cost of reading nothing, and a same-size swap under the
 * same id cannot happen because a new pick mints a new id.
 */
export function fingerprintOf(input: {
  intake: unknown
  projectType: ProjectType
  tone: Tone
  attachments: { id: string; size: number }[]
}): string {
  return JSON.stringify([input.intake, input.projectType, input.tone, input.attachments])
}
