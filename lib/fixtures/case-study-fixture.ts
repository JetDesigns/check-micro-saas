// A hand-written case study, used to judge the renderer before any agent
// exists.
//
// The point of building this first: if the page does not hold up next to a
// case study a designer wrote by hand, no amount of prompt work will save it.
// Prompt problems are cheap to fix and layout problems are not, so the layout
// gets tested with content we control.
//
// Written to exercise the awkward cases on purpose — a three-entry spine so
// the cycle diagram is allowed, a trade-off on every move, a stat headline
// with a real number, and captions that name a decision rather than describing
// the screen.

import type { CaseStudy } from '@/lib/case-study-blocks'

export const FIXTURE_IMAGE_IDS = [
  'img-hero',
  'img-move-1',
  'img-move-2',
  'img-move-3',
  'img-support-1',
]

export const FIXTURE_TITLE = 'Rebuilding shift handover for a hospital ward'

export const CASE_STUDY_FIXTURE: CaseStudy = {
  spine: [
    {
      id: 'freeze',
      finding:
        'Nurses photographed the handover screen before every shift change, because they had learned it might not be there afterwards.',
      requirement: 'The note has to survive the shift boundary.',
      move: 'Freeze the note at shift change',
    },
    {
      id: 'sort',
      finding:
        'The list sorted by room number, so the three patients who had deteriorated overnight were scattered through it.',
      requirement: 'Urgency has to outrank room order.',
      move: 'Sort by escalation, not by room',
    },
    {
      id: 'split',
      finding:
        'Everything lived in one free-text box, so what changed in the last twelve hours sat in the same paragraph as a patient history nobody needed to reread.',
      requirement: 'What changed must be separable from what is merely true.',
      move: 'Separate what changed from what is context',
    },
  ],
  blocks: [
    {
      type: 'metadata_grid',
      items: [
        { label: 'Year', value: '2024 · 9 weeks' },
        { label: 'Role', value: 'Product Designer' },
        { label: 'Client', value: 'A regional hospital group' },
        { label: 'Team', value: 'One engineer, one clinical lead' },
      ],
    },
    {
      type: 'prose',
      paragraphs: [
        'A ward of forty beds hands over three times a day. The outgoing nurse tells the incoming nurse what changed, and the system is supposed to hold that. It did not, so people worked around it with their phones.',
      ],
    },
    {
      type: 'stat_headline',
      text: 'Handover ran 14 minutes. The ward had budgeted 6.',
    },
    {
      type: 'pullquote',
      text: 'We photograph the screen because sometimes it just clears. Nobody knows why.',
      attribution: 'Night shift nurse, first observation session',
    },
    {
      type: 'annotated_visual',
      imageId: 'img-hero',
      caption:
        'The handover board after the rebuild — escalated patients first, changes separated from history.',
    },
    {
      type: 'prose',
      paragraphs: [
        'I sat through six handovers before drawing anything. Two things showed up every time: people did not trust the screen to persist, and they read it in a different order than it was written.',
        'Both were treated internally as training problems. Neither was.',
      ],
    },
    {
      type: 'requirement_cards',
      cards: [
        {
          spineId: 'freeze',
          index: 1,
          title: 'The note survives the shift boundary',
          body: 'If a nurse cannot rely on it being there in ten minutes, they will photograph it, and the photo becomes the real record.',
        },
        {
          spineId: 'sort',
          index: 2,
          title: 'Urgency outranks room order',
          body: 'Room number is how the ward is laid out, not how risk is distributed. The first three patients read are the ones that matter.',
        },
        {
          spineId: 'split',
          index: 3,
          title: 'What changed is separable from what is true',
          body: 'A handover answers one question: what is different since I last saw this patient. Everything else is reference.',
        },
      ],
    },
    {
      type: 'cycle_diagram',
      caption:
        'Each shift receives the frozen note, verifies it at the bedside, acts, and records into the next one. The loop only closes if the note persists.',
      nodes: [
        { label: 'Receive', sublabel: 'Frozen at shift change' },
        { label: 'Verify', sublabel: 'Checked at the bedside' },
        { label: 'Act', sublabel: 'Escalations first' },
        { label: 'Record', sublabel: 'Writes the next note' },
      ],
    },
    {
      type: 'move_section',
      spineId: 'freeze',
      eyebrow: 'MOVE 1 — PERSISTENCE',
      title: 'Freeze the note at shift change',
      body: [
        'At the shift boundary the note stops being editable and becomes a record. The incoming nurse gets a copy they can add to; the outgoing one can no longer overwrite what they handed over.',
        'The photographs stopped within two weeks. Nobody was asked to stop.',
      ],
      tradeoff: {
        chose: 'Freezing at the boundary',
        rejected: 'An autosave indicator',
        because:
          'The problem was not that saving failed. It was that nurses could not tell whether it had, and a reassuring spinner does not earn trust back once it is gone.',
      },
      visuals: [
        {
          type: 'annotated_visual',
          imageId: 'img-move-1',
          caption:
            'The frozen state is visibly different from the editable one, because trust needed a shape rather than a promise.',
        },
      ],
    },
    {
      type: 'move_section',
      spineId: 'sort',
      eyebrow: 'MOVE 2 — ORDER',
      title: 'Sort by escalation, not by room',
      body: [
        'Patients whose observations crossed a threshold in the last twelve hours move to the top and stay there until acknowledged. Room order survives underneath as a secondary sort.',
      ],
      tradeoff: {
        chose: 'One list, reordered',
        rejected: 'A separate "urgent" panel',
        because:
          'A second panel would have been read as a second list, and the failure mode of a second list is that people read one of them.',
      },
      visuals: [
        {
          type: 'annotated_visual',
          imageId: 'img-move-2',
          caption:
            'Escalated patients hold the top of the list until acknowledged, so urgency cannot scroll away.',
        },
      ],
    },
    {
      type: 'move_section',
      spineId: 'split',
      eyebrow: 'MOVE 3 — STRUCTURE',
      title: 'Separate what changed from what is context',
      body: [
        'The note splits into two fields. The top one takes only what is different since the last handover; the lower one holds standing context and collapses by default.',
        'Handover reading time fell because people stopped rereading history they already knew.',
      ],
      tradeoff: {
        chose: 'Two fields, one collapsed',
        rejected: 'A structured form with fixed clinical categories',
        because:
          'Categories would have been more analysable and would have been filled in wrong. Nurses write in prose under time pressure; the design had to take that as given.',
      },
      visuals: [
        {
          type: 'annotated_visual',
          imageId: 'img-move-3',
          caption:
            'Context collapses by default because rereading it was the largest single cost in the old flow.',
        },
      ],
    },
    {
      type: 'outcome_status',
      status: 'shipped',
      note: 'Rolled out to four wards over six weeks, starting with the ward that had complained loudest.',
    },
    {
      type: 'impact_list',
      items: [
        {
          title: 'Handover time came down to about 7 minutes',
          body: 'Measured across three wards over a month, against a 14-minute baseline the client had already recorded before I arrived.',
        },
        {
          title: 'The photographs stopped',
          body: 'The clearest signal, and not one anybody set out to measure. It was how we learned the trust problem was real rather than anecdotal.',
        },
      ],
    },
    {
      type: 'annotated_visual',
      imageId: 'img-support-1',
      caption:
        'The acknowledgement step, added late, because an escalation that nobody claims is still an open loop.',
    },
    {
      type: 'learnings',
      paragraphs: [
        'The workaround was the specification. Six handovers of watching people photograph a screen told me more than the requirements document did, and it cost nothing but attention.',
        'I would push harder on the acknowledgement step next time. It went in late, after the first ward had already been trained, and retraining people on something you added is more expensive than shipping it a week later would have been.',
      ],
    },
  ],
}
