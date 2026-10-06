import { describe, expect, it } from 'vitest'
import { validateCaseStudy } from '@/lib/case-study-blocks'
import { CASE_STUDY_FIXTURE, FIXTURE_IMAGE_IDS } from './case-study-fixture'

// The renderer is judged against this fixture, so the fixture has to be legal.
// A layout that only looks right on a document the validator would reject
// proves nothing about what the agent will actually produce.
describe('the hand-written fixture', () => {
  it('satisfies every schema rule', () => {
    expect(
      validateCaseStudy(CASE_STUDY_FIXTURE, { uploadedImageIds: FIXTURE_IMAGE_IDS })
    ).toEqual([])
  })

  it('exercises the cases worth testing a layout against', () => {
    const types = CASE_STUDY_FIXTURE.blocks.map((b) => b.type)
    expect(CASE_STUDY_FIXTURE.spine.length).toBe(3)
    expect(types).toContain('stat_headline')
    expect(types).toContain('pullquote')
    // Every move carries a trade-off; that block is the most likely to break a
    // layout and the easiest to forget to design.
    const moves = CASE_STUDY_FIXTURE.blocks.filter((b) => b.type === 'move_section')
    expect(moves.every((m) => m.tradeoff)).toBe(true)
  })
})
