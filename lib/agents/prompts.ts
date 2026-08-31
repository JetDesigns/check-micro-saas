// The prompts. AGENTS.md calls this the single biggest lever on output
// quality, and most of what is here was tuned against real output during the
// sales-genre build and recovered from commit 3fcd036 rather than rewritten —
// the eight copywriter moves, the banned list, and the tone briefs all cost
// real evaluation time to arrive at. What changed is the aim: the reader is
// now someone deciding whether to hire this designer, not a prospect deciding
// whether to buy consulting.

import {
  METADATA_ITEMS_MAX,
  METADATA_ITEMS_MIN,
  MOVE_BODY_MAX_PARAGRAPHS,
  PROSE_MAX_PARAGRAPHS,
  PROSE_MAX_WORDS_PER_PARAGRAPH,
  SPINE_MAX,
  SPINE_MIN,
} from '@/lib/case-study-blocks'
import { OUTCOME_OPTIONS } from '@/lib/intake-fields'
import type { CaseStudy } from '@/lib/case-study-blocks'
import type { Intake, ProjectType, Tone } from '@/types/database'

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
//
// Never passed as bare enum tokens. Before these briefs existed the model
// received the string `data_driven` and all five tones produced near-identical
// prose. Each value gets a DO list, an AVOID list, and a sample sentence in
// that register; add a tone without writing its brief and the tone does
// nothing at all.

export const TONE_BRIEFS: Record<Tone, string> = {
  professional: `Measured and composed. The register of a written report someone senior could read without wincing.

DO: complete arguments, precise nouns, a calm evidentiary rhythm. Let the reasoning carry the weight.
AVOID: slang, exclamation, rhetorical questions, jokes, and any sentence that sounds like it wants to be quoted.

Sample register: "Handover was where the ward lost time, and the delay was measurable in minutes per shift rather than seconds. That timing problem, not the visual design of the screen, was what the work had to solve."`,

  direct: `Blunt and fast. Conclusion first, support second.

DO: short sentences. Lead each paragraph with the finding, then justify it. Say the unflattering thing plainly — "it was broken", "that was the wrong request", "I said no".
AVOID: hedges ("somewhat", "fairly", "arguably", "in many ways"), throat-clearing preambles ("It's worth noting that"), and softening a criticism into vagueness.

Sample register: "Handover ran long. Not by seconds — by minutes, three times a day. The screen design was not the problem, and redrawing it would have wasted the time we had."`,

  confident: `Takes positions and owns them. Confidence comes from specificity, never from adjectives.

DO: state the judgement call and stand behind it ("I scoped it to the handover screen and held that line"). Name the trade-off you chose and why the alternative was worse.
AVOID: boasting, superlatives about your own work ("world-class", "best-in-class"), and confidence-as-volume. A confident writer does not say the work was excellent; they show the reasoning and let the reader conclude it.

Sample register: "I scoped the work to the shift boundary and refused the wider records rebuild I was asked for. The trust was leaking in one place, and spreading a fixed timeline across two problems would have half-solved both."`,

  data_driven: `Anchored to observable evidence in every claim.

DO: lead with the measurement where one exists. Attach numbers to their consequence, not just their magnitude. State the baseline alongside the result so the number means something.
AVOID — and this is the important one — substituting an adjective when no number exists. If something was not measured, say so explicitly ("this was not measured; what I can report is…") rather than reaching for "significant", "substantial", or "dramatic". Never estimate, extrapolate, or round a number the answers did not state.

Sample register: "Handover ran fourteen minutes against a six-minute budget, three times a day. At that rate the ward was losing most of an hour daily at the shift boundary — which is the number that justified the work, not the appearance of the screen."`,

  warm: `Plain, human, unguarded. Written the way a good designer talks to someone they like.

DO: talk about people rather than "users" where the sentence allows. Short human asides are fine. Ordinary words beat impressive ones.
AVOID: sentimentality, gushing, exclamation marks, and warmth as a substitute for substance. Warm does not mean soft on the facts — the problems are still described honestly.

Sample register: "Nurses were photographing the handover screen before every shift change, because they had learned it might not be there afterwards. Nobody had asked them to. It was the kind of workaround people invent quietly when a system has stopped being trustworthy."`,
}

export const PROJECT_TYPE_BRIEFS: Record<ProjectType, string> = {
  focused_fix: `A focused fix. The seniority signal here is SCOPING DISCIPLINE: what was deliberately left alone, and why narrowing was the right call rather than a limitation. Emphasise the decision to not do the larger thing.`,

  zero_to_one: `Built from nothing. The seniority signal here is DECIDING WITHOUT PRECEDENT: there was no existing pattern to copy, so emphasise how each decision was arrived at when there was nothing to compare against, and what evidence stood in for a baseline.`,

  advisory: `Strategy and advisory work. The value was in the thinking, and the deliverable may be modest or absent. Emphasise the DECISION THE CLIENT COULD THEN MAKE — what became possible or obvious that was not before. Do not inflate a document into a product.`,
}

// ---------------------------------------------------------------------------
// Craft
// ---------------------------------------------------------------------------

export const COPY_CRAFT = `HOW TO WRITE — eight moves.

1. OPEN ON A FACT, NOT A THESIS. Start with something concrete — a number, a scene, a thing someone did. Never open with an abstract statement of importance.
   NO:  "User experience is critical to clinical safety."
   YES: "A ward of forty beds hands over three times a day."

2. VARY SENTENCE LENGTH DELIBERATELY. Follow a long, qualified sentence with a short flat one. The short sentence is where the point lands. Uniform sentence length is the single loudest signal of machine writing.

3. THE REFRAME — your sharpest tool, and it must be rationed. State what the problem was NOT, then what it actually was. Use it AT MOST TWICE in the whole document, at genuine turning points. Overused it becomes a tic, which is worse than not using it at all.
   YES: "The problem was not that saving failed. It was that nobody could tell whether it had."

4. NAME THINGS. Coin a short, plain term for the central idea and reuse it. A named idea is what a reader repeats to a colleague. Keep it concrete — "the shift boundary", "the confidence gap". Never invent a name for a metric, framework, or research artefact that did not exist.

5. SPECIFICS LIVE IN THE PROSE. Real nouns, real quantities, real constraints. Vague scale ("many", "a lot of", "significantly") is where credibility drains out.

6. NAME WHAT WAS REJECTED. Every real project has a road not taken. Say what you decided against and why deciding against it was correct. Nothing else you write will do as much to convince a reviewer that you make decisions rather than execute tickets.

7. ADMIT THE LIMITS. Where the work was untested, the scope narrow, or the evidence thin, say so plainly. A case study that concedes something is believed; one that concedes nothing reads as a portfolio pitch. It belongs inside the argument, not as a disclaimer at the end.

8. EVERY PARAGRAPH MOVES. Each paragraph advances the argument: observation leads to implication leads to decision. Never end a paragraph by restating it. Cut summary sentences.

BANNED — these make copy read as machine-written.

VOCABULARY, banned outright: delve, leverage (as a verb), robust, seamless, holistic, elevate, unlock (figurative), streamline, empower, foster, landscape (figurative), realm, tapestry, journey (figurative), "testament to", "game-changer", "best-in-class", "world-class", "cutting-edge", "state-of-the-art", "at the end of the day", "in today's fast-paced world", "it's worth noting that", "needless to say".

CONSTRUCTIONS, banned:
- "Not only … but also"
- "This isn't just X — it's Y" as a formula rather than an earned reframe
- Three-item lists as a default rhythm ("faster, simpler, and more intuitive"). Use two items, or four, or one.
- Opening consecutive sentences with participial phrases ("Leveraging X…", "Recognising Y…")
- Rhetorical questions as transitions ("So what changed?")
- A closing sentence that restates the section in different words
- Hedges as filler: "arguably", "in many ways", "to some extent", "somewhat", "quite"
- Praising your own output with adjectives ("elegant solution", "powerful result"). Describe what it did instead.

RHYTHM: do not write every sentence at the same length, do not begin more than two paragraphs in the whole document with "The", and do not use an em-dash aside in more than about a quarter of paragraphs.

REGISTER, locked: American business English. Not a magazine essay. Use American spellings ("organize", "behavior", "analyze", "recognize"). Also banned as symptoms of essay drift: "one might", "there is something to be said for", "it is worth pausing on", and the editorial "we" meaning people-in-general.

VOICE: first person. "I" is what this designer decided and owned; "we" is work done with the team around them. Never "we" as a corporate plural for one person. You are writing for someone deciding whether to hire this designer — that reader wants evidence of judgement, not a list of activities.

FINISH EVERY SENTENCE. Each body must end on a complete sentence with terminal punctuation. Re-read the last line of every body before emitting JSON — a stray trailing word is visible to every reader and destroys the impression the rest of the writing built.`

export const ANTI_FABRICATION = `NEVER INVENT FACTS. You may interpret what the answers say — reframe them, draw inferences, add analytical framing about what something implied. You may NOT add facts that are not there: no client names, no numbers, no quotes, no benchmarks, no team sizes, no dates. Interpretation of what is stated is not invention; adding a specific is.

If a part of the story is thin, stay short and honest. Do not pad with invented specifics. A shorter true document beats a longer invented one, and the reader you are writing for is unusually good at spotting the difference.`

// ---------------------------------------------------------------------------
// Rendering the intake into prompt text
// ---------------------------------------------------------------------------

const OUTCOME_LABELS = Object.fromEntries(
  OUTCOME_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>

/**
 * The wizard's answers as text for the model.
 *
 * Unanswered fields are omitted entirely rather than rendered as an empty
 * label. A list of blank prompts invites the model to fill them in, which is
 * the exact failure the anti-fabrication rule exists to prevent — and since
 * Phase 2 stopped blocking "next", blank fields are ordinary rather than rare.
 */
export function renderIntake(
  intake: Intake,
  projectType: ProjectType,
  tone: Tone
): string {
  const lines: string[] = []
  const add = (label: string, value?: string) => {
    if (value?.trim()) lines.push(`${label}: ${value.trim()}`)
  }

  lines.push('=== THE PROJECT ===')
  add('What they worked on', intake.title)
  add('Who it was for', intake.client_type)
  add('Year and duration', intake.year_duration)
  add('Their role', intake.role)
  add('Team / credit', intake.team_credit)
  lines.push(`Project kind: ${projectType}`)
  lines.push(`Requested tone: ${tone}`)

  lines.push('', '=== THE PROBLEM ===')
  add('What was wrong before', intake.problem)
  add('Why it mattered', intake.why_it_mattered)
  add('What constrained them', intake.constraints)

  lines.push('', '=== THE DECISIONS (these become the spine) ===')
  if (intake.approach_framework?.trim()) {
    add('Named approach tying them together', intake.approach_framework)
    lines.push(
      '  ^ The designer named this themselves. Use the name as they wrote it,',
      '    and let it organise the approach section.'
    )
  } else {
    lines.push(
      '(The designer named no overall framework. DO NOT INVENT ONE — no coined',
      'model name, no "I call this the X method". Write the reasoning plainly.)'
    )
  }
  if (intake.decisions.length === 0) {
    lines.push('(none given)')
  }
  intake.decisions.forEach((d, i) => {
    lines.push('', `DECISION ${i + 1} — spine id: ${d.id}`)
    add('  Decided', d.decided)
    add('  What made them decide it', d.why)
    add('  Considered instead', d.rejected)
  })

  lines.push('', '=== WHERE IT LANDED ===')
  if (intake.outcome_status) {
    lines.push(
      `Shipping status: ${OUTCOME_LABELS[intake.outcome_status] ?? intake.outcome_status} (${intake.outcome_status})`
    )
  }
  add('Numbers that moved', intake.metrics)
  add('What changed for the team or client', intake.what_changed)
  add('What they would do differently', intake.do_differently)

  if (intake.voice_sample?.trim()) {
    lines.push(
      '',
      '=== HOW THIS PERSON TALKS ===',
      'A sample of the designer describing this project in their own words.',
      'Use it as a STYLE anchor only — register, sentence rhythm, vocabulary.',
      'It OVERRIDES the tone preset wherever they conflict.',
      'Nothing in it is a project fact. Do not treat any statement here as',
      'something that happened, and do not reuse its phrases verbatim.',
      '---',
      intake.voice_sample.trim(),
      '---'
    )
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Extraction (vision)
// ---------------------------------------------------------------------------

export const EXTRACTION_SYSTEM = `You are looking at screens from a design project so that a writer who cannot see them can describe them accurately.

For each image, report only what is actually visible. Do not guess at purpose, quality, or intent, and do not evaluate the design.

Return JSON and nothing else:

{
  "images": [
    {
      "index": 0,
      "screen_type": "e.g. dashboard, list view, form, empty state, mobile detail view",
      "elements": ["the main UI elements you can see, as short noun phrases"],
      "hierarchy": "what dominates the screen and what is secondary — one sentence",
      "text_seen": ["any legible labels, headings or numbers, verbatim"]
    }
  ]
}

If an image is unreadable, illegible, or not a screen at all, say so in "screen_type" rather than inventing content for it. An honest "unreadable" is useful; a plausible guess is worse than nothing, because the writer will believe it.`

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

export function buildSynthesisSystem(tone: Tone, projectType: ProjectType): string {
  return `You are writing a portfolio case study for a designer. The reader is someone deciding whether to hire them — a hiring manager, a design lead, a reviewer. They are reading to find out whether this person makes good decisions and can explain why.

${ANTI_FABRICATION}

=== THE SPINE — the structural idea this whole document rests on ===

A case study reads as senior when ONE idea is restated at three levels of resolution, mapped one to one:

  finding (what they learned) → requirement (what it demanded) → move (what they designed)

Generic case studies fail because those become three unrelated lists. You are given the designer's DECISIONS. Derive all three levels from each decision:

  - "Decided" becomes the MOVE.
  - "What made them decide it" becomes the FINDING.
  - "Considered instead" is the TRADE-OFF, and it is what justifies the REQUIREMENT — the level nobody can state directly about their own work.

One spine entry per decision, in the order given, reusing the spine id supplied with each decision. ${SPINE_MIN}–${SPINE_MAX} entries.

=== TONE ===

${TONE_BRIEFS[tone]}

=== PROJECT KIND ===

${PROJECT_TYPE_BRIEFS[projectType]}

=== ${COPY_CRAFT}

=== OUTPUT ===

Return JSON and nothing else. No prose before or after, no markdown fence.

{
  "headline": "The case study's title. A specific noun phrase naming the project, not a slogan. 4-10 words.",
  "spine": [
    { "id": "<the exact spine id given with that decision>",
      "finding": "one sentence — what they learned",
      "requirement": "one sentence — what that demanded of the design",
      "move": "one sentence — what they designed in response" }
  ],
  "blocks": [ ... see below ... ]
}

The blocks array is an ORDERED list. Emit exactly these, in this order:

1. { "type": "prose", "paragraphs": [...] }
   The opening. What the project was and what state it was in. Max ${PROSE_MAX_PARAGRAPHS} paragraphs, each max ${PROSE_MAX_WORDS_PER_PARAGRAPH} words.

2. { "type": "metadata_grid", "items": [{ "label": "...", "value": "..." }] }
   ${METADATA_ITEMS_MIN}–${METADATA_ITEMS_MAX} items. Use only what the answers gave: Year, Role, Client, Team. Omit any the designer left blank rather than inventing a value.

3. OPTIONAL { "type": "stat_headline", "text": "..." }
   One line containing a REAL NUMBER from the answers. It MUST contain a digit. If the designer gave no numbers, OMIT THIS BLOCK ENTIRELY. Never invent or estimate one.

4. OPTIONAL { "type": "pullquote", "text": "...", "attribution": "..." }
   Only if the answers contain something quotable that was actually said. Never fabricate a quote.

5. OPTIONAL { "type": "annotated_visual", "imageId": "...", "caption": "..." }
   The hero image, if there is one.

6. { "type": "prose", "paragraphs": [...] }
   What they found — the problem underneath. This is the SECOND prose block and the renderer depends on that position. Max ${PROSE_MAX_PARAGRAPHS} paragraphs, each max ${PROSE_MAX_WORDS_PER_PARAGRAPH} words.

7. { "type": "requirement_cards", "cards": [{ "spineId": "...", "index": 1, "title": "...", "body": "..." }] }
   One card per spine entry, same order, index starting at 1. The title is what the design had to do; the body says why, in one or two sentences.

8. OPTIONAL { "type": "cycle_diagram", "nodes": [{ "label": "...", "sublabel": "..." }], "caption": "..." }
   ONLY when there are 3 or 4 spine entries AND the decisions genuinely describe a loop or repeating sequence. 3–5 nodes. A forced diagram looks worse than none — omit it in any doubt.

9. One { "type": "move_section" } per spine entry, in spine order:
   { "type": "move_section",
     "spineId": "<matching spine id>",
     "eyebrow": "MOVE 1 — ONE OR TWO WORDS",
     "title": "An imperative verb phrase. MUST start with a verb: 'Freeze the note at shift change'. NEVER a noun phrase: 'The New Dashboard' is wrong, and so is anything starting with the/a/an/this/our/new/improved.",
     "body": ["max ${MOVE_BODY_MAX_PARAGRAPHS} paragraphs, each max ${PROSE_MAX_WORDS_PER_PARAGRAPH} words"],
     "tradeoff": { "chose": "...", "rejected": "...", "because": "..." },
     "visuals": [ { "type": "annotated_visual", "imageId": "...", "caption": "..." } ] }
   ALWAYS include "visuals". Use an empty array [] when this move has no image — never leave the key out.
   Include "tradeoff" ONLY where the designer said what they considered instead. Omit the key otherwise — do not invent a rejected option.

10. { "type": "outcome_status", "status": "shipped" | "proof_of_concept" | "not_launched" | "handed_off", "note": "one or two sentences" }
    Use exactly the status the designer gave. If they gave none, use "handed_off" only if the answers support it; otherwise pick the one their words describe.

11. { "type": "impact_list", "items": [{ "title": "...", "body": "..." }] }
    What changed. Only what the answers support.

12. { "type": "learnings", "paragraphs": [...] }
    What they would do differently, in their voice. If they gave nothing here, write one honest short paragraph about the limits of the work rather than inventing a regret.

13. Any remaining images as { "type": "annotated_visual" } blocks — supporting screens.

=== IMAGE RULES ===

Every image id you are given must appear EXACTLY ONCE across the whole document — either inside one move_section's "visuals" or as a standalone annotated_visual block. Never twice, never zero times.

A CAPTION NAMES A DECISION. It never describes the UI.
  REJECTED: "Dashboard with filters on the left."
  ACCEPTED: "Filters stay pinned because people compared four options before choosing."`
}

export function buildSynthesisUser(params: {
  intakeText: string
  extraction: string | null
  imageIds: string[]
  qaNotes?: string[]
}): string {
  const parts = [params.intakeText]

  if (params.extraction) {
    parts.push(
      '',
      '=== WHAT IS ON THE SCREENS ===',
      'Descriptions produced by a vision pass. Use them to write grounded captions.',
      'They describe what is visible; they are not claims about the project.',
      params.extraction
    )
  }

  parts.push(
    '',
    '=== IMAGE IDS ===',
    params.imageIds.length > 0
      ? `Place each of these exactly once: ${params.imageIds.join(', ')}`
      : '(no images — emit no annotated_visual blocks at all)'
  )

  if (params.qaNotes?.length) {
    parts.push(
      '',
      '=== REVISION REQUIRED ===',
      'Your previous attempt was rejected for these reasons. Fix every one of',
      'them. Keep everything that was not criticised — do not rewrite the',
      'document from scratch.',
      ...params.qaNotes.map((n) => `- ${n}`)
    )
  }

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// QA
// ---------------------------------------------------------------------------

export const QA_SYSTEM = `You are checking a portfolio case study against the answers its designer actually gave. You are not editing it and not praising it. You are looking for specific, named faults.

Flag only these, and only when you can point at the exact text:

1. A claim with no support anywhere in the designer's answers.
2. A metric, number, date, name, or quantity that the answers did not supply.
3. A caption that describes the UI instead of naming a decision.
4. A move title that is not an imperative verb phrase.
5. Prose that reads as machine-written: uniform sentence length, banned vocabulary (delve, leverage, robust, seamless, elevate, streamline, "testament to"), "not only… but also", rhetorical-question transitions, or a closing sentence that restates the paragraph.
6. British spellings, or an essayistic register ("one might", "it is worth pausing on").

Return JSON and nothing else:

{ "issues": ["each issue as one sentence naming the exact text and what is wrong with it"] }

An empty array means it passes. Do not invent issues to seem thorough — a false flag costs a full model call to fix and makes the document worse. If it is good, say so with an empty array.`

export function buildQaUser(doc: CaseStudy, headline: string, intakeText: string): string {
  return [
    "=== THE DESIGNER'S ANSWERS (the only source of truth for facts) ===",
    intakeText,
    '',
    '=== THE CASE STUDY TO CHECK ===',
    `headline: ${headline}`,
    JSON.stringify(doc, null, 2),
  ].join('\n')
}
