import { describe, expect, it } from 'vitest'
import {
  REGISTER_CHOICES,
  SECTIONS,
  validateFocusedFix,
  type ValidateContext,
} from './focused-fix-validate'
import { fixtureIntake } from '@/lib/fixtures/focused-fix-intake'

// What this guards: the mechanically checkable half of the spec's final checklist.
// Each rule has a test that breaks it and shows it being caught, on top of a
// baseline page that is known to pass everything — so a failure means "this
// mutation", never "the baseline was already wrong".

const intake = fixtureIntake('handover')
const ctx = (over: Partial<ValidateContext> = {}): ValidateContext => ({ intake, images: [], ...over })

const register = () =>
  REGISTER_CHOICES.map((choice) => ({
    choice,
    // `dominant_section` is checked against the page now, so the baseline has to
    // name the section the baseline page actually gives the most room to.
    value:
      choice === 'diagram_form'
        ? 'decision_flow'
        : choice === 'dominant_section'
          ? 'Solution'
          : 'a considered choice',
    driver: 'the specific fact in this project that decided it',
  }))

const MARKDOWN = `# Shift handover for a hospital ward

Repairing the handover screen that nurses photographed before every shift change.

- Client: A regional hospital group
- Role: Product designer

## Overview

A ward management system used by charge nurses and bedside nurses across three shifts a day.

## Problem

Nurses photographed the screen because it cleared itself, and escalated patients sat wherever their bed happened to be. Escalations were passed on out loud and skipped when a shift ran late.

> The handover screen looks cluttered and nurses find it confusing.

The report describes an experience. Handover ran fourteen minutes against a six-minute budget.

## Approach

The patient record system was off limits, so everything worked as a layer on top of it.

## Solution

### Patient Notes column

The note cleared on session timeout. It now freezes at shift change, so nurses photographed the screen because it cleared itself no longer.

### Handover list order

The list ran in room order. It now sorts by escalation, so escalated patients no longer sit wherever their bed happened to be.

### Escalation notes

Escalations were passed on out loud and skipped when a shift ran late. Now the note holds until acknowledged.

1. The outgoing nurse marks a patient escalated.
2. The note holds until the incoming nurse taps Acknowledge.

## Outcome

The photographs stopped within two weeks.

> "We stopped talking about the handover screen in the ops meeting."

## Credits

- Client: A regional hospital group
- Role: Product designer
`

// The floor form, built from the fixture's own three decisions: a name of three
// words each, in their order, with the second marked as departing — which is
// what the fixture says of it. No sentence anywhere; that is the whole point.
const diagram = () => ({
  form: 'decision_flow',
  items: [
    { name: 'Freeze the note', deviates: false },
    { name: 'Sort by escalation', deviates: true },
    { name: 'Hold escalated notes', deviates: false },
  ],
  text_equivalent:
    'Three decisions in the order they were taken; the second departs from a ward convention the others keep.',
})

function page(over: Record<string, unknown> = {}) {
  return {
    markdown: MARKDOWN,
    figures: [],
    variance_register: register(),
    branch: 'contribution',
    diagram: diagram(),
    ...over,
  }
}

const rules = (v: unknown, c = ctx()) => validateFocusedFix(v, c).issues.map((i) => i.rule)
const swap = (from: string, to: string) => MARKDOWN.replace(from, to)

describe('the baseline page', () => {
  it('passes every rule with no warnings, so any failure below is the mutation', () => {
    const v = validateFocusedFix(page(), ctx())
    expect(v.issues).toEqual([])
    expect(v.warnings).toEqual([])
    expect(v.page).not.toBeNull()
  })
})

describe('shape — the reply is whatever JSON.parse returned from a model', () => {
  it.each([null, undefined, 'a string', 42, [], true])('rejects %j without throwing', (bad) => {
    expect(rules(bad)).toEqual(['shape'])
  })

  it('names each missing field', () => {
    expect(rules({})).toEqual(['shape', 'shape', 'shape', 'shape'])
  })

  it('returns no page for a reply it could not read', () => {
    expect(validateFocusedFix({}, ctx()).page).toBeNull()
  })

  it('survives every field being the wrong type', () => {
    expect(() =>
      validateFocusedFix({ markdown: 5, figures: 'x', variance_register: {}, branch: [] }, ctx())
    ).not.toThrow()
  })
})

describe('structure', () => {
  it.each(SECTIONS)('catches %s missing', (name) => {
    expect(rules(page({ markdown: swap(new RegExp(`## ${name}\\n[\\s\\S]*?(?=\\n## |$)`).exec(MARKDOWN)![0], '') }))).toContain('sections')
  })

  it('catches a renamed section', () => {
    expect(rules(page({ markdown: swap('## Outcome', '## Impact') }))).toContain('sections')
  })

  it('catches an added section', () => {
    expect(rules(page({ markdown: MARKDOWN + '\n## Learnings\n\nSomething.\n' }))).toContain('sections')
  })

  it('catches sections out of order', () => {
    expect(rules(page({ markdown: swap('## Problem', '## Approach').replace('## Approach\n\nThe patient', '## Problem\n\nThe patient') }))).toContain('sections')
  })

  it('catches a page that does not open on a title', () => {
    expect(rules(page({ markdown: MARKDOWN.replace(/^# .*\n/, '') }))).toContain('title')
  })

  it('catches a missing subtitle', () => {
    const noSub = MARKDOWN.replace(/^(# .*\n)\n.*\n/, '$1\n- Client: x\n')
    expect(rules(page({ markdown: noSub }))).toContain('subtitle')
  })

  it('catches a level-four heading', () => {
    expect(rules(page({ markdown: swap('### Handover list order', '#### Handover list order') }))).toContain('sections')
  })

  it('catches a fix heading outside Solution', () => {
    expect(rules(page({ markdown: swap('The patient record system', '### Not allowed here\n\nThe patient record system') }))).toContain('sections')
  })

  it('catches a heading with nothing under it', () => {
    expect(rules(page({ markdown: swap('The photographs stopped within two weeks.\n\n> "We stopped talking about the handover screen in the ops meeting."', '') }))).toContain('empty_section')
  })

  it('catches a fix block that is only a heading', () => {
    expect(rules(page({ markdown: swap('The list ran in room order. It now sorts by escalation, so escalated patients no longer sit wherever their bed happened to be.', '') }))).toContain('empty_section')
  })
})

describe('the number of fix blocks', () => {
  it('needs one per decision the designer gave', () => {
    const two = MARKDOWN.replace(/### Escalation notes[\s\S]*?(?=## Outcome)/, '')
    const v = validateFocusedFix(page({ markdown: two }), ctx())
    expect(v.issues.map((i) => i.rule)).toContain('fix_count')
    expect(v.issues.find((i) => i.rule === 'fix_count')!.message).toContain('3 decisions')
  })

  it('holds a hard ceiling of four whatever the designer gave', () => {
    const five = MARKDOWN.replace('## Outcome', '### Four\n\nx\n\n### Five\n\nx\n\n## Outcome')
    expect(rules(page({ markdown: five }))).toContain('fix_count')
  })
})

describe('voice and banned content', () => {
  it.each(['seamless', 'intuitive', 'beautiful', 'delightful', 'effortless', 'elegant'])(
    'catches the praise adjective %s',
    (word) => {
      expect(rules(page({ markdown: swap('It now freezes', `It now freezes in a ${word} way`) }))).toContain('praise')
    }
  )

  it('catches a reflection heading', () => {
    expect(rules(page({ markdown: MARKDOWN.replace('## Credits', '## Reflection\n\nWhat went well.\n\n## Credits') }))).toContain('reflection')
  })

  it.each([
    'In hindsight I would have started earlier.',
    'What I would do differently is sit through a night handover.',
    'The lessons learned were many.',
  ])('catches self-critique even as a single sentence: %s', (sentence) => {
    expect(rules(page({ markdown: swap('The photographs stopped within two weeks.', `The photographs stopped within two weeks. ${sentence}`) }))).toContain('reflection')
  })

  it('catches values joined by a middle dot', () => {
    expect(rules(page({ markdown: swap('- Role: Product designer\n\n## Overview', '- Role: Product designer · 2024\n\n## Overview') }))).toContain('middle_dot')
  })

  it.each([
    'No metrics were available for this project.',
    'Client feedback was not provided.',
    'A diagram was not generated.',
  ])('catches a narrated absence: %s', (sentence) => {
    expect(rules(page({ markdown: swap('The photographs stopped within two weeks.', `The photographs stopped within two weeks. ${sentence}`) }))).toContain('narrated_absence')
  })
})

describe('quotations', () => {
  // A reconstructed quotation is a fact about a real client that nobody said.
  it('catches a quotation that is in nothing the client said', () => {
    const v = validateFocusedFix(
      page({ markdown: swap('> "We stopped talking about the handover screen in the ops meeting."', '> "This was the best thing that ever happened to our wards."') }),
      ctx()
    )
    expect(v.issues.map((i) => i.rule)).toContain('invented_quote')
  })

  it('accepts a quotation found whole in the client’s words', () => {
    expect(rules(page())).not.toContain('invented_quote')
  })

  it('accepts an excerpt of the client’s words', () => {
    expect(rules(page({ markdown: swap('> The handover screen looks cluttered and nurses find it confusing.', '> The handover screen looks cluttered') }))).not.toContain('invented_quote')
  })

  it('does not let a report the designer did NOT mark as exact words be quoted', () => {
    const unmarked = { ...intake, reported_verbatim: undefined }
    expect(rules(page(), ctx({ intake: unmarked }))).toContain('invented_quote')
  })

  it('is indifferent to quote marks and case, which a copy will vary on', () => {
    expect(rules(page({ markdown: swap('> "We stopped talking about the handover screen in the ops meeting."', '> WE STOPPED TALKING about the handover screen in the ops meeting') }))).not.toContain('invented_quote')
  })
})

describe('credits', () => {
  it('must be label: value pairs, never a paragraph', () => {
    expect(rules(page({ markdown: swap('- Client: A regional hospital group\n- Role: Product designer\n', 'The work was done by a product designer for a regional hospital group.\n').replace('## Credits\n\n- Client: A regional hospital group\n- Role: Product designer\n', '## Credits\n\nThe work was done by a product designer.\n') }))).toContain('credits')
  })

  it('warns, but does not block, when the designer’s role is missing', () => {
    const md = MARKDOWN.replace(/(## Credits\n\n- Client: A regional hospital group\n)- Role: Product designer\n/, '$1')
    const v = validateFocusedFix(page({ markdown: md }), ctx())
    expect(v.issues.map((i) => i.rule)).not.toContain('credits')
    expect(v.warnings.map((w) => w.rule)).toContain('credits')
  })
})

describe('the branch', () => {
  it('is derived, so the model naming a different one is caught', () => {
    expect(rules(page({ branch: 'metric' }))).toContain('branch')
  })

  it('agrees with the metric fixture', () => {
    const measured = fixtureIntake('handover-measured')
    expect(rules(page({ branch: 'metric' }), ctx({ intake: measured }))).not.toContain('branch')
    expect(rules(page({ branch: 'contribution' }), ctx({ intake: measured }))).toContain('branch')
  })
})

describe('the variance register', () => {
  it.each(REGISTER_CHOICES)('needs an entry for %s', (choice) => {
    expect(rules(page({ variance_register: register().filter((r) => r.choice !== choice) }))).toContain('register')
  })

  // A choice that cannot cite a driver was taken by default — the exact failure
  // the register exists to expose.
  it('needs a driver on every entry', () => {
    const reg = register()
    reg[0].driver = ''
    expect(rules(page({ variance_register: reg }))).toContain('register')
  })

  it('treats a token driver as no driver', () => {
    const reg = register()
    reg[1].driver = 'because'
    expect(rules(page({ variance_register: reg }))).toContain('register')
  })

  it('rejects a choice that is not one of the six', () => {
    expect(rules(page({ variance_register: [...register(), { choice: 'vibes', value: 'x', driver: 'a long enough driver' }] }))).toContain('register')
  })

  it('rejects the same choice twice', () => {
    expect(rules(page({ variance_register: [...register(), register()[0]] }))).toContain('register')
  })

  it('holds diagram_form to "omitted", since none is produced', () => {
    const reg = register()
    reg[5].value = 'lanes'
    expect(rules(page({ variance_register: reg }))).toContain('register')
  })
})

describe('figures', () => {
  const images = [
    { id: 'img-problem', slot: 'problem' as const, notice: 'The Patient Notes column is empty after the reset' },
    { id: 'img-after', slot: 'after' as const, decisionId: 'fixture-dec-sort', notice: 'Escalated patients hold the top of the list' },
  ]
  const withFigures = (over: Record<string, unknown> = {}) => ({
    markdown: MARKDOWN.replace('Nurses photographed the screen because it cleared itself, and', 'Nurses photographed the screen because it cleared itself, and') +
      '',
    ...over,
  })

  const placed = MARKDOWN
    .replace('> The handover screen looks cluttered', '[[figure:img-problem]]\n\n> The handover screen looks cluttered')
    .replace('The list ran in room order.', '[[figure:img-after]]\n\nThe list ran in room order.')

  const figs = [
    { imageId: 'img-problem', caption: 'A Patient Notes column that resets with the session, leaving the record blank', alt: 'A ward board with an empty notes column' },
    { imageId: 'img-after', caption: 'Escalated patients hold the top of the list until someone acknowledges them', alt: 'A patient list with two flagged rows above the rest' },
  ]

  it('accepts placed images with a caption and a distinct alt', () => {
    expect(rules(page({ markdown: placed, figures: figs }), ctx({ images }))).toEqual([])
  })

  it('needs an entry for every marker and a marker for every entry', () => {
    expect(rules(page({ markdown: placed, figures: [figs[0]] }), ctx({ images }))).toContain('figure')
    expect(rules(page({ markdown: MARKDOWN, figures: [figs[0]] }), ctx({ images }))).toContain('figure')
  })

  it('rejects a marker for an image that was never uploaded', () => {
    const md = MARKDOWN.replace('## Approach', '[[figure:ghost]]\n\n## Approach')
    expect(rules(page({ markdown: md, figures: [{ imageId: 'ghost', caption: 'x', alt: 'y' }] }), ctx({ images }))).toContain('figure')
  })

  it('rejects the same image placed twice', () => {
    const md = placed.replace('## Approach', '[[figure:img-problem]]\n\n## Approach')
    expect(rules(page({ markdown: md, figures: figs }), ctx({ images }))).toContain('figure')
  })

  // §8.7: an image with nothing to point at is dropped — but one the designer
  // described has, by their own account, something to point at.
  it('requires an image the designer described to be placed', () => {
    expect(rules(page({ markdown: MARKDOWN, figures: [] }), ctx({ images }))).toContain('figure')
  })

  it('lets an image the designer said nothing about be dropped', () => {
    expect(rules(page({ markdown: MARKDOWN, figures: [] }), ctx({ images: [{ id: 'quiet', slot: 'problem' as const }] }))).toEqual([])
  })

  it('needs alt text that differs from the caption, since they are two jobs', () => {
    const same = [{ ...figs[0], alt: figs[0].caption }, figs[1]]
    expect(rules(page({ markdown: placed, figures: same }), ctx({ images }))).toContain('alt')
  })

  it('rejects alt text that describes a file rather than a screen', () => {
    const bad = [{ ...figs[0], alt: 'Screenshot of the ward board' }, figs[1]]
    expect(rules(page({ markdown: placed, figures: bad }), ctx({ images }))).toContain('alt')
  })

  it('rejects an empty caption', () => {
    expect(rules(page({ markdown: placed, figures: [{ ...figs[0], caption: '' }, figs[1]] }), ctx({ images }))).toContain('caption')
  })

  // A problem screen is evidence. No decision has been made at that point in the
  // page, so a caption naming one points at something the reader has not met.
  it('rejects a problem-screen caption that names a decision', () => {
    const named = [{ ...figs[0], caption: 'Where we chose to sort by escalation, not by room' }, figs[1]]
    expect(rules(page({ markdown: placed, figures: named }), ctx({ images }))).toContain('caption_slot')
  })

  it('rejects a problem-screen caption that only repeats the designer’s note', () => {
    const echo = [{ ...figs[0], caption: 'The Patient Notes column is empty after the reset' }, figs[1]]
    expect(rules(page({ markdown: placed, figures: echo }), ctx({ images }))).toContain('caption_slot')
  })

  it('does not apply that rule to an after screen, whose caption should name the decision', () => {
    const naming = [figs[0], { ...figs[1], caption: 'Sort by escalation, not by room — the escalated rows lead' }]
    expect(rules(page({ markdown: placed, figures: naming }), ctx({ images }))).not.toContain('caption_slot')
  })

  it('rejects two captions built from one mould', () => {
    const twins = [figs[0], { ...figs[1], caption: 'A Patient Notes column that keeps its state across the shift' }]
    expect(rules(page({ markdown: placed, figures: twins }), ctx({ images }))).toContain('caption_frame')
  })

  it('is unused when there are no screens', () => {
    expect(withFigures().markdown).toContain('Shift handover')
    expect(rules(page())).toEqual([])
  })
})

describe('warnings — heuristic, kept but never blocking', () => {
  it('flags a number that is in none of the answers', () => {
    const v = validateFocusedFix(page({ markdown: swap('The photographs stopped within two weeks.', 'The photographs stopped within two weeks, and support tickets fell by 38 percent.') }), ctx())
    expect(v.issues).toEqual([])
    expect(v.warnings.map((w) => w.message).join()).toContain('38')
  })

  it('accepts a number written as a word in the answers and as a digit on the page', () => {
    // "fourteen" in the answers, "14" on the page: a transformation, not an invention.
    const v = validateFocusedFix(page({ markdown: swap('fourteen minutes', '14 minutes') }), ctx())
    expect(v.warnings.filter((w) => w.rule === 'number')).toEqual([])
  })

  it('does not mistake the id digits in the intake for numbers the designer wrote', () => {
    const v = validateFocusedFix(page(), ctx())
    expect(v.warnings.filter((w) => w.rule === 'number')).toEqual([])
  })

  it('warns when a fix does not visibly tie back to its pain point', () => {
    const md = swap('so nurses photographed the screen because it cleared itself no longer.', 'so a nurse has one fewer thing to remember.')
    const v = validateFocusedFix(page({ markdown: md }), ctx())
    expect(v.warnings.map((w) => w.rule)).toContain('tieback')
  })

  it('reports what the writer flagged for confirmation', () => {
    const v = validateFocusedFix(page({ needs_confirmation: ['the reason nurses trusted the photograph'] }), ctx())
    expect(v.warnings.map((w) => w.rule)).toContain('needs_confirmation')
    expect(v.page?.needs_confirmation).toEqual(['the reason nurses trusted the photograph'])
  })
})

describe('reporting shape', () => {
  // The revision notes go back as a batch, so one retry can fix everything.
  it('returns every problem at once rather than stopping at the first', () => {
    const md = swap('## Outcome', '## Impact').replace('It now freezes', 'It now freezes seamlessly')
    const found = rules(page({ markdown: md, branch: 'metric' }))
    expect(found).toEqual(expect.arrayContaining(['sections', 'praise', 'branch']))
  })
})

describe('the register against the page', () => {
  // The register was taken on trust until a generated page claimed Problem carried
  // it while Solution ran nearly twice as long — three runs in a row. A driver
  // string of the right length is not evidence that a choice was made.
  it('rejects a dominance claim the page contradicts', () => {
    const claims = register().map((r) =>
      r.choice === 'dominant_section' ? { ...r, value: 'Problem' } : r
    )
    const found = rules(page({ variance_register: claims }))
    expect(found).toContain('dominance')
  })

  it('rejects a dominant section that names no section at all', () => {
    const claims = register().map((r) =>
      r.choice === 'dominant_section' ? { ...r, value: 'the fixes themselves' } : r
    )
    expect(rules(page({ variance_register: claims }))).toContain('dominance')
  })

  it('accepts the claim the page bears out', () => {
    expect(rules(page())).not.toContain('dominance')
  })
})

describe('one mould across the fix blocks', () => {
  const rewrite = (pairs: [string, string][]) =>
    pairs.reduce((md, [from, to]) => md.replace(from, to), MARKDOWN)

  it('rejects blocks that all open on the same construction', () => {
    const md = rewrite([
      ['The note cleared on session timeout.', 'This fix freezes the note. The note cleared on session timeout.'],
      ['The list ran in room order.', 'This fix sorts the list. The list ran in room order.'],
      [
        '### Escalation notes\n\nEscalations were passed on out loud',
        '### Escalation notes\n\nThis fix holds the note. Escalations were passed on out loud',
      ],
    ])
    expect(rules(page({ markdown: md }))).toContain('block_frame')
  })

  it('rejects blocks that all close on the same construction', () => {
    const md = rewrite([
      ['itself no longer.\n', 'itself no longer.\n\nI considered an autosave indicator.\n'],
      ['happened to be.\n', 'happened to be.\n\nI considered colour-coding the rows.\n'],
      ['taps Acknowledge.\n', 'taps Acknowledge.\n\nI considered a push notification.\n'],
    ])
    expect(rules(page({ markdown: md }))).toContain('block_frame')
  })

  // §6.3 fixes where the tie-back sits. Read as a wording rule it produces one
  // sentence per block with the nouns swapped, which is how the first generated
  // pages read.
  it('rejects tie-backs written to one frame', () => {
    const md = rewrite([
      [
        'It now freezes at shift change, so nurses photographed the screen because it cleared itself no longer.',
        'This is the photographing: nurses photographed the screen because it cleared itself, and the note now holds.',
      ],
      [
        'It now sorts by escalation, so escalated patients no longer sit wherever their bed happened to be.',
        'This is the scattering: escalated patients sat wherever their bed happened to be, and it now sorts by escalation.',
      ],
      [
        '### Escalation notes\n\nEscalations were passed on out loud and skipped when a shift ran late.',
        '### Escalation notes\n\nThis is the spoken handover: escalations were passed on out loud and skipped when a shift ran late.',
      ],
    ])
    expect(rules(page({ markdown: md }))).toContain('tieback_frame')
  })

  it('leaves tie-backs alone when each is written in its own terms', () => {
    expect(rules(page())).not.toContain('tieback_frame')
  })
})

describe('the page talking about itself', () => {
  it('rejects a sentence that points at another part of the page', () => {
    const md = swap(
      'It now freezes at shift change,',
      'This is the photographing described in Problem, and it now freezes at shift change,'
    )
    expect(rules(page({ markdown: md }))).toContain('cross_reference')
  })

  it('rejects "named above" as a tie-back', () => {
    const md = swap('The list ran in room order.', 'That is the second problem named above.')
    expect(rules(page({ markdown: md }))).toContain('cross_reference')
  })
})

describe('the specification staying off the page', () => {
  const SPEC = 'A reason is only a reason if it could have gone the other way, and a request explains why the work happened not why the design took this form.'

  it('rejects the specification own sentences arriving in the markdown', () => {
    const md = swap(
      'The report describes an experience.',
      'A request explains why the work happened not why the design took this form.'
    )
    expect(rules(page({ markdown: md }), ctx({ spec: SPEC }))).toContain('spec_echo')
  })

  it('does not run without a specification to compare against', () => {
    const md = swap(
      'The report describes an experience.',
      'A request explains why the work happened not why the design took this form.'
    )
    expect(rules(page({ markdown: md }))).not.toContain('spec_echo')
  })

  // The designer's own words always win. A phrase that is in their answers is
  // theirs, whatever else it is also in.
  it('leaves wording the designer supplied alone', () => {
    const own = 'Nurses photographed the screen before every handover, because they had learned it might not be there afterwards.'
    const md = swap('The report describes an experience.', own)
    expect(rules(page({ markdown: md }), ctx({ spec: `${SPEC} ${own}` }))).not.toContain('spec_echo')
  })
})

describe('the visual Approach carries', () => {
  // The pipeline used to REJECT any page whose register did not say "omitted",
  // so a specification calling the diagram load-bearing shipped a path that
  // could not produce one. These guard the opposite rule.
  it('accepts the floor form built from the decisions', () => {
    expect(rules(page())).not.toContain('diagram')
  })

  it('rejects a page with no visual at all', () => {
    expect(rules(page({ diagram: null }))).toContain('diagram')
  })

  it('rejects a form the renderer cannot draw', () => {
    expect(rules(page({ diagram: { ...diagram(), form: 'parallel_tracks' } }))).toContain('diagram')
  })

  it('rejects one item per decision being broken', () => {
    const d = diagram()
    expect(rules(page({ diagram: { ...d, items: d.items.slice(0, 2) } }))).toContain('diagram')
  })

  // An invented category is the fastest way to make a generated graphic look
  // generated (§9.5), so a name has to be the designer's own, shortened.
  it('rejects a name coined to tidy the set', () => {
    const d = diagram()
    const items = [{ ...d.items[0], name: 'Data integrity' }, ...d.items.slice(1)]
    expect(rules(page({ diagram: { ...d, items } }))).toContain('diagram')
  })

  // The budget. The first version of this carried a sentence per item, which put
  // the prose in a box beside the prose.
  it('rejects a name longer than three words', () => {
    const d = diagram()
    const items = [{ ...d.items[0], name: 'Freeze the note at shift change' }, ...d.items.slice(1)]
    expect(rules(page({ diagram: { ...d, items } }))).toContain('diagram')
  })

  it('rejects a name that reads as a statement', () => {
    const d = diagram()
    const items = [{ ...d.items[0], name: 'Note freeze, always' }, ...d.items.slice(1)]
    expect(rules(page({ diagram: { ...d, items } }))).toContain('diagram')
  })

  // An extra key is an explanation looking for somewhere to live.
  it('rejects an item carrying anything beyond a name and a state', () => {
    const d = diagram()
    const items = [{ ...d.items[0], answers: 'nurses photographed the screen' }, ...d.items.slice(1)]
    expect(rules(page({ diagram: { ...d, items } }))).toContain('diagram')
  })

  // The designer said which one departs; the writer does not get to decide.
  it('rejects marking a decision as departing when the answers do not say so', () => {
    const d = diagram()
    const items = [{ ...d.items[0], deviates: true }, ...d.items.slice(1)]
    expect(rules(page({ diagram: { ...d, items } }))).toContain('diagram')
  })

  // §9.3: the equivalent states the relationship. Handed only the names, a
  // reader who cannot see the diagram has the parts and not the shape.
  it('rejects a text equivalent that only repeats the names', () => {
    const d = diagram()
    const text = d.items.map((i) => i.name).join('. ')
    expect(rules(page({ diagram: { ...d, text_equivalent: text } }))).toContain('diagram')
  })

  it('rejects a register that disagrees with the diagram about the form', () => {
    const claims = register().map((r) =>
      r.choice === 'diagram_form' ? { ...r, value: 'omitted' } : r
    )
    expect(rules(page({ variance_register: claims }))).toContain('register')
  })

  it('carries the diagram onto the returned page', () => {
    const v = validateFocusedFix(page(), ctx())
    expect(v.page?.diagram?.items).toHaveLength(3)
    expect(v.page?.diagram?.items[1]).toEqual({ name: 'Sort by escalation', deviates: true })
  })
})
