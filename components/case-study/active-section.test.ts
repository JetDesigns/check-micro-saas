import { describe, expect, it } from 'vitest'
import { pickActiveSection } from './CaseStudyDocument'

// The nav highlight is the one piece of this renderer with real logic in it,
// and the browser pane used for checking suppresses scroll events entirely
// (visibilityState "hidden" — rAF never runs and scroll never fires), so a
// test is the only way to actually prove the behaviour.
//
// The bug being guarded against: the first version used an IntersectionObserver
// with rootMargin '-72px 0px -60% 0px'. At 1280x860 that leaves a 272px band,
// and at the bottom of the document every section sits above or below it. The
// observer stopped firing and the nav silently lost its highlight.

const LINE = 96

describe('pickActiveSection', () => {
  it('picks the first section when the page is scrolled above everything', () => {
    const sections = [
      { id: 'context', top: 400 },
      { id: 'findings', top: 1200 },
      { id: 'learnings', top: 2000 },
    ]
    expect(pickActiveSection(sections, LINE)).toBe('context')
  })

  it('picks the last section that has passed the line', () => {
    const sections = [
      { id: 'context', top: -900 },
      { id: 'findings', top: -100 },
      { id: 'learnings', top: 700 },
    ]
    expect(pickActiveSection(sections, LINE)).toBe('findings')
  })

  it('still answers at the very bottom, where the band approach gave nothing', () => {
    // Every section above the viewport except the last, which sits below the
    // old 72–344px band. This is the exact shape measured at 1280x860.
    const sections = [
      { id: 'context', top: -6410 },
      { id: 'findings', top: -5575 },
      { id: 'outcome', top: -593 },
      { id: 'learnings', top: 425 },
    ]
    expect(pickActiveSection(sections, LINE)).toBe('outcome')
  })

  it('treats a section sitting exactly on the line as current', () => {
    const sections = [
      { id: 'a', top: -500 },
      { id: 'b', top: LINE },
      { id: 'c', top: 900 },
    ]
    expect(pickActiveSection(sections, LINE)).toBe('b')
  })

  it('never returns nothing while sections exist', () => {
    const positions = [-9000, -100, 0, 96, 97, 500, 5000]
    for (const top of positions) {
      const result = pickActiveSection([{ id: 'only', top }], LINE)
      expect(result).toBe('only')
    }
  })

  it('returns null only when there are no sections at all', () => {
    expect(pickActiveSection([], LINE)).toBeNull()
  })
})
