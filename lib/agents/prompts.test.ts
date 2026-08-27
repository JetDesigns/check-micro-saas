import { describe, expect, it } from 'vitest'
import { PROJECT_TYPE_BRIEFS, TONE_BRIEFS, renderIntake } from './prompts'
import { TONES, PROJECT_TYPES } from '../intake-fields'
import type { Intake } from '@/types/database'

// renderIntake is the whole of what the writing model knows about the project.
// Two properties matter more than the wording:
//
//   - An unanswered question must not appear. Since the wizard stopped
//     blocking "next", blank answers are ordinary, and a list of empty labels
//     reads to a model as a set of gaps to fill — which is the exact failure
//     the anti-fabrication rule exists to prevent.
//   - The spine ids must survive into the prompt, because the document is
//     required to reuse them and the validator checks that it did.

function intake(over: Partial<Intake> = {}): Intake {
  return {
    title: 'Rebuilding shift handover for a hospital ward',
    problem: 'The screen cleared itself and nurses photographed it.',
    decisions: [
      {
        id: 'dec-one',
        decided: 'Freeze the note at shift change',
        why: 'Nurses photographed the screen because it might clear',
        rejected: 'An autosave indicator',
      },
    ],
    image_notes: [],
    ...over,
  }
}

describe('renderIntake', () => {
  it('omits a question nobody answered instead of printing an empty label', () => {
    const text = renderIntake(intake(), 'focused_fix', 'direct')
    expect(text).not.toContain('Why it mattered')
    expect(text).not.toContain('Numbers that moved')
    expect(text).toContain('What was wrong before')
  })

  it('carries every spine id through, since the document must reuse them', () => {
    const text = renderIntake(intake(), 'focused_fix', 'direct')
    expect(text).toContain('spine id: dec-one')
  })

  it('quarantines the voice sample as style, never as something that happened', () => {
    const text = renderIntake(
      intake({ voice_sample: 'Honestly the screen was never the problem.' }),
      'focused_fix',
      'warm'
    )
    expect(text).toContain('STYLE anchor only')
    expect(text).toContain('Nothing in it is a project fact')
    expect(text).toContain('OVERRIDES the tone preset')
  })

  it('says so plainly when there are no decisions, rather than leaving a blank section', () => {
    const text = renderIntake(intake({ decisions: [] }), 'advisory', 'warm')
    expect(text).toContain('(none given)')
  })

  it('spells the outcome out in words, because the stored value is a slug', () => {
    const text = renderIntake(intake({ outcome_status: 'proof_of_concept' }), 'zero_to_one', 'direct')
    expect(text).toContain('Proof of concept')
  })
})

describe('briefs', () => {
  // A tone with no brief does nothing at all: before these existed the model
  // received the bare token `data_driven` and all five tones produced
  // near-identical prose. This is the check that a new option cannot be added
  // to the wizard without one.
  it('gives every tone in the wizard a brief with a DO, an AVOID and a sample', () => {
    for (const { value } of TONES) {
      const brief = TONE_BRIEFS[value]
      expect(brief, `tone ${value}`).toBeTruthy()
      expect(brief, `tone ${value}`).toContain('DO:')
      expect(brief, `tone ${value}`).toContain('AVOID')
      expect(brief.toLowerCase(), `tone ${value}`).toContain('sample register')
    }
  })

  it('gives every project type in the wizard a brief', () => {
    for (const { value } of PROJECT_TYPES) {
      expect(PROJECT_TYPE_BRIEFS[value], `project type ${value}`).toBeTruthy()
    }
  })
})
