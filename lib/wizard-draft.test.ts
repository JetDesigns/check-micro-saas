import { describe, expect, it } from 'vitest'
import {
  DRAFT_KEY,
  DRAFT_VERSION,
  draftHasAnswers,
  fingerprintOf,
  parseDraft,
  toDraft,
  type DraftInput,
} from './wizard-draft'
import { emptyWizardState, type Attachment } from './wizard-steps'

// What this guards is a real loss: a filled-in form thrown away by a reload, a
// dev-server restart, or a hot reload that remounted the component. Answers lived
// only in React state, so every one of those emptied the form. These tests cover
// the half of the fix that can be covered without a browser — what a draft IS,
// and that a bad one can never stop the wizard opening.

function input(over: Partial<DraftInput> = {}): DraftInput {
  const s = emptyWizardState()
  return {
    step: 3,
    projectType: 'focused_fix',
    tone: 'professional',
    text: { title: 'Rebuilding shift handover for a hospital ward' },
    toggles: { reported_verbatim: true },
    decisions: s.decisions,
    collaborators: [{ name: 'Priya Raman', role: 'Clinical lead' }],
    provenance: 'audit',
    outcome: 'shipped',
    areasWorked: [],
    areasFromScratch: [],
    shape: null,
    sectionFates: {},
    attachments: [],
    saved: null,
    ...over,
  }
}

function attachment(id: string, over: Partial<Attachment> = {}): Attachment {
  return {
    id,
    file: new File(['png'], `${id}.png`, { type: 'image/png', lastModified: 1_700_000_000_000 }),
    slot: 'problem',
    notice: 'The Patient Notes column is empty after the reset',
    ...over,
  }
}

describe('a draft round-trips', () => {
  it('comes back exactly as it went in', () => {
    const draft = toDraft(input(), 123)
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft)
  })

  it('keeps where the person was, so a reload lands back on the same step', () => {
    for (const step of [1, 2, 3, 4, 5, 'review'] as const) {
      const round = parseDraft(JSON.stringify(toDraft(input({ step }))))
      expect(round?.step).toBe(step)
    }
  })

  // The bytes go to IndexedDB. What the JSON keeps is everything needed to put
  // the attachment back together once they are read: which slot, which decision,
  // what was said about it, and the file's own name and type.
  it('keeps each screen’s slot, decision link and note, but never its bytes', () => {
    const a = attachment('a', { slot: 'after', decisionId: 'dec-1' })
    const json = JSON.stringify(toDraft(input({ attachments: [a] })))
    const [stored] = parseDraft(json)!.attachments

    expect(stored).toMatchObject({
      id: 'a',
      slot: 'after',
      decisionId: 'dec-1',
      notice: a.notice,
      name: 'a.png',
      type: 'image/png',
    })
    expect(json).not.toContain('"file"')
  })

  it('leaves the decision link off a problem screen, which belongs to none', () => {
    const [stored] = toDraft(input({ attachments: [attachment('p')] })).attachments
    expect('decisionId' in stored).toBe(false)
  })
})

describe('a bad draft is never allowed to stop the wizard opening', () => {
  const good = JSON.stringify(toDraft(input()))

  it.each([
    ['nothing stored', null],
    ['an empty string', ''],
    ['text that is not JSON', 'not json {'],
    ['JSON that is not an object', '[1,2,3]'],
    ['a truncated write (the disk was full)', good.slice(0, good.length - 40)],
  ])('treats %s as no draft', (_label, raw) => {
    expect(parseDraft(raw)).toBeNull()
  })

  // A draft written by an earlier version of this code, against a different field
  // set. Reading it through the current one would put answers under the wrong
  // questions, which is worse than starting empty.
  it('discards a draft from another version rather than half-reading it', () => {
    const old = { ...JSON.parse(good), version: DRAFT_VERSION - 1 }
    expect(parseDraft(JSON.stringify(old))).toBeNull()
  })

  it('rejects an unknown step', () => {
    expect(parseDraft(JSON.stringify({ ...JSON.parse(good), step: 9 }))).toBeNull()
  })

  it('rejects a decision with no id, since the id is what ties it to everything else', () => {
    const bad = JSON.parse(good)
    bad.decisions = [{ decided: 'x', why: 'y' }]
    expect(parseDraft(JSON.stringify(bad))).toBeNull()
  })

  it('rejects a screen in a slot that does not exist', () => {
    const bad = JSON.parse(good)
    bad.attachments = [{ id: 'a', slot: 'sideways', notice: '', name: 'a.png', type: 'image/png', lastModified: 0 }]
    expect(parseDraft(JSON.stringify(bad))).toBeNull()
  })

  // The precedent the area lists set: a draft written before a field existed is
  // still the person's work, so it is defaulted rather than thrown away. The
  // version is NOT bumped for an additive field, and these pin that choice.
  it('accepts a draft written before step 4 had a fork, and reads it as the old screen', () => {
    const before = JSON.parse(good)
    delete before.shape
    delete before.sectionFates
    const restored = parseDraft(JSON.stringify(before))
    expect(restored?.shape).toBeNull()
    expect(restored?.sectionFates).toEqual({})
    expect(restored?.text.title).toBe('Rebuilding shift handover for a hospital ward')
  })

  it('drops one unrecognised fate instead of taking the draft with it', () => {
    const bad = JSON.parse(good)
    bad.sectionFates = { Hero: 'added', Nav: 'sideways', FAQ: 'cut' }
    expect(parseDraft(JSON.stringify(bad))?.sectionFates).toEqual({ Hero: 'added', FAQ: 'cut' })
  })

  it('reads an unknown fork answer as unanswered', () => {
    const bad = JSON.parse(good)
    bad.shape = 'whole_company'
    expect(parseDraft(JSON.stringify(bad))?.shape).toBeNull()
  })

  it('never throws, whatever it is handed', () => {
    for (const raw of ['null', 'true', '42', '"str"', '{}', '{"version":1}', '{"version":1,"step":1}']) {
      expect(() => parseDraft(raw)).not.toThrow()
    }
  })
})

describe('draftHasAnswers', () => {
  const empty = () => {
    const s = emptyWizardState()
    return {
      text: s.text,
      toggles: s.toggles,
      decisions: s.decisions,
      collaborators: s.collaborators,
      provenance: s.provenance,
      outcome: s.outcome,
      shape: s.shape,
      attachments: [] as unknown[],
    }
  }

  // A fresh wizard already has two empty decision cards; none of that is work, and
  // offering to "start over" on it would be offering to delete nothing.
  it('is false for a wizard nobody has touched', () => {
    expect(draftHasAnswers(empty())).toBe(false)
  })

  it('is false for whitespace, which is not an answer', () => {
    expect(draftHasAnswers({ ...empty(), text: { title: '   ' } })).toBe(false)
  })

  it.each([
    ['a typed answer', { text: { title: 'x' } }],
    ['a toggle', { toggles: { has_measurement: true } }],
    ['a collaborator', { collaborators: [{ name: 'P', role: '' }] }],
    ['a picked option', { outcome: 'shipped' as const }],
    ['a picked branch of step 4', { shape: 'single_page' as const }],
    ['a screen', { attachments: [{}] }],
  ])('is true for %s', (_label, patch) => {
    expect(draftHasAnswers({ ...empty(), ...patch })).toBe(true)
  })

  it('is true for a decision that has only its reason', () => {
    const e = empty()
    e.decisions[0].why = 'Because nurses photographed the screen'
    expect(draftHasAnswers(e)).toBe(true)
  })
})

describe('fingerprintOf', () => {
  const base = {
    intake: { title: 'x', decisions: [] },
    projectType: 'focused_fix' as const,
    tone: 'professional' as const,
    attachments: [{ id: 'a', size: 10 }],
  }

  // The fingerprint is what makes reusing a saved row safe. If it matched after
  // an edit, a retry would generate from answers the person had since changed.
  it('is stable for identical answers', () => {
    expect(fingerprintOf(base)).toBe(fingerprintOf({ ...base }))
  })

  it.each([
    ['an answer changes', { intake: { title: 'y', decisions: [] } }],
    ['a screen is added', { attachments: [...base.attachments, { id: 'b', size: 5 }] }],
    ['a screen is swapped', { attachments: [{ id: 'a', size: 11 }] }],
    ['the project type changes', { projectType: 'zero_to_one' as const }],
  ])('changes when %s', (_label, patch) => {
    expect(fingerprintOf({ ...base, ...patch })).not.toBe(fingerprintOf(base))
  })
})

describe('the draft key', () => {
  it('is namespaced, so it cannot collide with the legacy wizard’s storage', () => {
    expect(DRAFT_KEY.startsWith('check.')).toBe(true)
  })
})
