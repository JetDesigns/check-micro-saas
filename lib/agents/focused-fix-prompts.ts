// The prompts for the Focused Fix path.
//
// The system prompt is THE SPECIFICATION, loaded verbatim, followed by a short
// contract for the envelope it travels in and the one anti-invention rule that
// already existed. It is not the legacy prompt with the tone briefs taken out.
// That prompt was written for a different output — a {spine, blocks} document —
// and four of its instructions directly contradict the spec: it requires a
// "learnings" block whose content the spec bans, it tells the model to admit the
// limits of the work (the spec prohibits self-critique "not as a paragraph, not
// as a closing sentence"), it demands an imperative title where the spec wants a
// noun phrase, and it admits a headline figure on any digit. Aligning it would
// have meant rewriting all four and would still have left a prompt whose shape is
// the wrong document. So it is bypassed, and left in lib/agents/prompts.ts for
// the dev flag that generates from it on the same input.
//
// THIS FILE READS THE DISK. That is what makes it cheap to iterate on the spec:
// editing prompts/focused-fix-output.md changes the next generation with no
// rebuild, which is what ablation and prompt work both need. It is why the file
// is server-side only, and why next.config.ts must name the spec so it ships with
// the function.
//
// NOTHING HERE READS THE WIZARD'S LABELS. AGENTS.md records what happened when
// the prompt did: renaming a field's label in the UI silently rewrote what the
// model was told that field meant, with no code change at all. Every string that
// reaches the model is written out below, and the wording pass on the wizard
// cannot touch it.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ANTI_FABRICATION } from '@/lib/agents/prompts'
import { evidenceBranch, mixedFigure } from '@/lib/wizard-steps'
import type { ImageSlot, Intake, Provenance } from '@/types/database'

const SPEC_PATH = 'prompts/focused-fix-output.md'

let cachedSpec: string | null = null

/**
 * The output specification, from disk, once per process.
 *
 * Cached for the life of the server, not per request — but a dev server restart
 * picks up an edited spec, and `resetSpecCache` exists for the tests and for a
 * long-running process that wants it re-read.
 */
export function loadSpec(): string {
  if (cachedSpec === null) {
    try {
      cachedSpec = readFileSync(join(process.cwd(), SPEC_PATH), 'utf8')
    } catch (err) {
      // Named, because the failure this most often is — the file not being traced
      // into a deployed function — looks like a bare ENOENT from three layers down.
      throw new Error(
        `Could not read ${SPEC_PATH} (cwd ${process.cwd()}). It has to ship with the ` +
          `function; see outputFileTracingIncludes in next.config.ts. ` +
          (err instanceof Error ? err.message : String(err))
      )
    }
  }
  return cachedSpec
}

export function resetSpecCache(): void {
  cachedSpec = null
}

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const OUTPUT_CONTRACT = `=== HOW TO HAND THE PAGE BACK ===

The specification above describes the page. This section describes the envelope it travels in, and where the two disagree about FORMAT, this section wins.

Return ONE JSON object and nothing else — no prose before it or after it, no code fence:

{
  "markdown": "…",
  "figures": [ { "imageId": "…", "caption": "…", "alt": "…" } ],
  "variance_register": [ { "choice": "…", "value": "…", "driver": "…" } ],
  "branch": "contribution" | "metric",
  "needs_confirmation": [ "…" ]
}

THE MARKDOWN

- Line one is "# " and the project title (§3.2). Straight after it, one plain paragraph: the subtitle (§3.2).
- Then, if anything qualifies, the metadata strip: a bulleted list of "- Label: value" lines using only facts the answers give (Client, Role, Year, Duration, Status). Never join two values with a middle dot. Leave the strip out entirely if nothing qualifies.
- Then exactly these six sections, each opened by a level-two heading, in this order, spelled exactly like this: "## Overview", "## Problem", "## Approach", "## Solution", "## Outcome", "## Credits". No other level-two heading. Nothing deeper than level three.
- Inside "## Solution", each fix opens with a level-three heading ("### ") that names the artifact it worked on (§8.3) — one per decision, in the order the designer gave them unless §4.4 requires moving one. Level-three headings appear nowhere else on the page.
- Paragraphs run one to four sentences. Plain sentences only: no HTML, no tables, no images by URL, no nested lists.
- The designer's own decisions are written in the first person; the client's decisions never are (§8.4).
- Client wording the designer marked as their exact words is set apart as a blockquote (lines starting "> ") and copied character for character. Quote nothing else. Never tidy a quotation, never shorten it into a claim, never invent one. Where the report was NOT marked as exact words, it is an attributed report, in your own sentences.
- Numbered steps ("1. ") are only for the ordered beats of a fix that did not exist before.
- "## Credits" is a bulleted list of "- Label: value" lines and nothing else. Never a paragraph.
- A screen goes immediately after the sentence that needs it, as a line by itself reading [[figure:<imageId>]]. Each image appears at most once, and only an image that has a decision or a piece of evidence to point at appears at all (§8.7).

THE TIE-BACK

Every fix is tied back to a pain point named in "## Problem" (§6.3). The answers give you, per decision, the pain point it answers in the designer's own words. Carry the tie-back inside that fix's prose, in the same POSITION in every block — §6.3 fixes where the tie-back sits, not how it is worded. Write each one in the terms of the pain point itself, naming the thing that was going wrong, and never as a direction to another part of the page: "described in Problem", "named above" and the like are navigation, not argument. No two tie-backs may open with the same two words. Make sure each pain point is actually named in "## Problem".

THE FIGURES

- One entry for every [[figure:…]] marker, and no entry without one.
- "caption" and "alt" do two different jobs and are never the same string.
- alt: what is on the screen, for a reader who cannot see it. Take it from the description of the screens you are given. Never start "Screenshot of" or "Image of".
- caption, for a screen marked BEFORE or AFTER: it names the decision the screen shows and what to look for (§8.6).
- caption, for a screen marked PROBLEM: it names the EVIDENCE the screen shows and what that evidence indicates about the prior state — the screen, control, column or label the diagnosis turned on. It never names a decision, because none has been made at that point in the page, and it never describes the layout. The three tests in §8.6 still apply, read against the evidence.
- No two captions open with the same two words.

THE VARIANCE REGISTER

Exactly six entries, one for each of these choices, in this order: dominant_section, section_length_pattern, page_opening_move, problem_opening, fix_block_shape_sequence, diagram_form.

For each one, "value" is what you chose and "driver" is the specific fact in THIS project's answers that decided it (§6.4). If you cannot point at the fact, you chose by default — choose again.

The register is CHECKED AGAINST THE PAGE, not taken on trust. "dominant_section" must name the section you actually gave the most room to — count it before you answer. Saying Problem dominates while Solution runs twice as long is rejected. If the fixes carry the page, say Solution: a true report of an ordinary shape is worth more than a claim the page contradicts.

For diagram_form the value is "omitted". No diagram is produced in this pipeline, so "## Approach" carries the structure in prose (§9.7) and the page says nothing about it.

EVERYTHING ELSE

- "branch" is the evidence branch stated in the answers. You do not choose it.
- Where the answers give no material for something, leave it out and say nothing about the leaving out (§10.2). Never write that something was unavailable, unmeasured, not provided, or not generated.
- "needs_confirmation" lists, word for word, any passage where you reasoned your way to a rationale the designer never stated (§7.4). Empty is normal and preferred: write only what the answers support.
- The register is fixed by §8.1. Nothing in the answers changes it.
- The specification is instructions to you. It is not material for the page: never reproduce its sentences or its phrasing in the markdown. Write about this project in your own words.`

/**
 * The system prompt as blocks, with the cache breakpoint at the end.
 *
 * The specification is byte-identical on every run, and the contract after it
 * never changes either, so the whole prefix is cached and only the answers pay
 * full price. Anything volatile — a timestamp, a run id, the intake — would
 * invalidate that prefix silently, which is why none of it is allowed above the
 * breakpoint. `agent_runs.cache_read_input_tokens` is how a silent invalidator
 * shows up: reads that stay at zero across repeated runs.
 */
export function buildFocusedFixSystem(spec: string = loadSpec()): {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}[] {
  return [
    {
      type: 'text',
      text:
        'You are writing a portfolio case study for a designer, from the answers they gave you. ' +
        'The reader is deciding whether to hire them.\n\n' +
        'The specification below is the authority on structure, argument, evidence and style. ' +
        'Follow it exactly. It is long on purpose.\n\n' +
        '<specification>\n' +
        spec +
        '\n</specification>',
    },
    {
      type: 'text',
      text: `${OUTPUT_CONTRACT}\n\n${ANTI_FABRICATION}`,
      cache_control: { type: 'ephemeral' },
    },
  ]
}

// ---------------------------------------------------------------------------
// The answers
// ---------------------------------------------------------------------------

// Owned here, not derived from the wizard's option labels. Four of these are also
// what a UI wording pass would most plausibly touch.
const PROVENANCE: Record<Provenance, string> = {
  audit: 'By going through the product themselves',
  user_research: 'By talking to the people who use it',
  analytics: 'From analytics',
  testing: 'From testing',
  client_told_me: 'The client told them',
}

const STATUS: Record<string, string> = {
  shipped: 'Shipped',
  proof_of_concept: 'Proof of concept',
  not_launched: 'Not launched',
  handed_off: 'Handed off',
}

export type PromptImage = {
  id: string
  slot: ImageSlot
  /** A Decision.id; absent for a problem screen. */
  decisionId?: string
  notice?: string
}

/**
 * Pairs each uploaded image with what the designer said about it.
 *
 * `image_notes` is keyed by position (the join to case_study_attachments'
 * order_index) and the pipeline's images arrive in that same order, so index i in
 * one is index i in the other. An image with no note still appears — as a problem
 * screen with nothing said — because dropping it here would decide, out of the
 * model's sight, that it has nothing to point at.
 */
export function pairImages(intake: Intake, imageIds: string[]): PromptImage[] {
  return imageIds.map((id, i) => {
    const note = intake.image_notes.find((n) => n.orderIndex === i)
    return {
      id,
      slot: note?.slot ?? 'problem',
      ...(note?.decisionId ? { decisionId: note.decisionId } : {}),
      ...(note?.notice ? { notice: note.notice } : {}),
    }
  })
}

/**
 * The designer's answers as text for the model.
 *
 * An unanswered question is left out entirely rather than printed as an empty
 * label. A list of blank prompts reads to a model as a set of gaps to fill, which
 * is the exact failure the anti-invention rule exists to prevent — and since the
 * wizard never blocks "next", blank answers are ordinary.
 */
export function renderFocusedFixIntake(intake: Intake): string {
  const lines: string[] = []
  const add = (label: string, value: string | undefined, indent = '') => {
    const v = value?.trim()
    if (v) lines.push(`${indent}${label}: ${v}`)
  }
  const say = (line: string) => lines.push(line)

  const branch = evidenceBranch(intake)
  const named = intake.client_may_be_named === true && Boolean(intake.client_name?.trim())

  say('=== THE PROJECT ===')
  add('What the project was', intake.title)
  add('The product, and who uses it', intake.product_and_users)
  add('Who it was for (industry and rough size)', intake.client_type)
  if (named) {
    add('The client, who MAY be named', intake.client_name)
  } else {
    say(
      'Naming: the client may NOT be named. Do not name them anywhere — not on the page, not in a caption, not in the credits. Describe them as given above.'
    )
  }
  add('Year', intake.year)
  add('Duration', intake.duration)
  add('The designer’s role', intake.role)
  add('An agency between the designer and the client', intake.agency)
  if (intake.collaborators?.length) {
    say('Who else worked on it:')
    for (const c of intake.collaborators) {
      const person = [c.name.trim(), c.role.trim() && `(${c.role.trim()})`].filter(Boolean).join(' ')
      if (person) say(`  - ${person}`)
    }
  }
  if (intake.outcome_status) {
    say(
      `Shipping status: ${STATUS[intake.outcome_status] ?? intake.outcome_status} — metadata only. It is never the claim Outcome makes.`
    )
  }

  say('', )
  say('=== THE PROBLEM ===')
  if (intake.reported_problem?.trim()) {
    if (intake.reported_verbatim) {
      add('What the client said was wrong — THEIR EXACT WORDS, quote them', intake.reported_problem)
    } else {
      add(
        'What the client said was wrong — an attributed report, NOT their exact words, do not quote it',
        intake.reported_problem
      )
    }
  }
  add('What was actually going on, and where it could be seen', intake.diagnosis)
  if (intake.diagnosis_provenance) {
    say(`How the diagnosis was reached: ${PROVENANCE[intake.diagnosis_provenance]}`)
  }
  add('What it was costing the client', intake.cost_to_client)

  say('')
  say('=== THE DECISIONS (in the order the designer gave them) ===')
  const number = new Map(intake.decisions.map((d, i) => [d.id, i + 1]))
  const tieback = new Map((intake.tiebacks ?? []).map((t) => [t.decisionId, t.painPoint]))

  intake.decisions.forEach((d, i) => {
    say('')
    say(`DECISION ${i + 1}`)
    add('Decided', d.decided, '  ')
    if (d.no_prior_version) {
      say('  This did not exist before. There is no prior version to compare against.')
      add('How it works, step by step', d.prior_behaviour, '  ')
    } else {
      add('What it did before', d.prior_behaviour, '  ')
    }
    add('What people can do now, or no longer have to do', d.consequence, '  ')
    add('What made the designer decide it', d.why, '  ')
    add('What they considered instead', d.rejected, '  ')
    add('The client asked for this — THEIR EXACT WORDS, quote them', d.client_request, '  ')

    const r = d.relations
    if (r?.breaks_pattern !== undefined) {
      const pattern = r.breaks_pattern.trim()
      say(
        pattern
          ? `  This breaks a pattern the other decisions follow. The pattern: ${pattern}`
          : '  This breaks a pattern the other decisions follow.'
      )
    }
    if (r?.repeated_treatment) {
      say('  This is one treatment repeated in many places.')
    }
    if (r?.depends_on && number.get(r.depends_on)) {
      say(`  This cannot be understood without decision ${number.get(r.depends_on)} first.`)
    }
    const pain = tieback.get(d.id)
    if (pain) add('The pain point this answers, in the designer’s words', pain, '  ')
  })

  const shape: [string, string | undefined][] = [
    ['The overall model or approach the designer named themselves', intake.approach_framework],
    ['What they were working around', intake.constraints],
    ['Whether decision authority was split, and how', intake.authority_split],
  ]
  if (shape.some(([, v]) => v?.trim())) {
    say('')
    say('=== HOW THE WORK FIT TOGETHER ===')
    for (const [label, value] of shape) add(label, value)
  }
  if (!intake.approach_framework?.trim()) {
    say(
      'The designer named no overall model. Do not invent or coin one — no "the X method". Write the reasoning plainly.'
    )
  }

  say('')
  say('=== WHERE IT LANDED ===')
  say(`Evidence branch: ${branch}`)
  if (branch === 'metric') {
    add('What was measured', intake.measure)
    add('Before', [intake.baseline_value, intake.baseline_period && `(${intake.baseline_period})`].filter(Boolean).join(' '))
    add('After', [intake.after_value, intake.after_period && `(${intake.after_period})`].filter(Boolean).join(' '))
    add('Where the number came from', intake.baseline_source)
    add('What else changed in the same period (state this once, as a fact about the measurement)', intake.attribution_limit)
  } else {
    const one = mixedFigure(intake)
    if (one) {
      say(
        `One figure may be stated, in the body of the page only — never in the subtitle, never as a headline, never in the metadata: ${one.measure}: ${one.value}${one.period ? ` (${one.period})` : ''}. Source: ${one.source}.`
      )
    } else {
      say(
        'No measured figure exists: derive none, and state or imply no measurement of your own. ' +
          'A cost the designer stated themselves is theirs — carry it as they gave it, in the Problem ' +
          'section, as what the trouble was costing them. Never restate it as a result, and never put ' +
          'it in the subtitle or the metadata strip.'
      )
    }
  }
  add('What changed in how the team works', intake.team_change)
  add('What the client said afterwards — THEIR WORDS, quote them', intake.client_response)

  return lines.join('\n')
}

/** Screens the designer uploaded, and what they said each one is for. */
export function renderScreens(images: PromptImage[], intake: Intake): string {
  if (images.length === 0) return ''

  const number = new Map(intake.decisions.map((d, i) => [d.id, i + 1]))
  const out: string[] = ['', '=== THE SCREENS ===']
  for (const img of images) {
    const where =
      img.slot === 'problem'
        ? 'PROBLEM (evidence of the prior state; belongs to no decision)'
        : `${img.slot.toUpperCase()} of decision ${number.get(img.decisionId ?? '') ?? '?'}`
    out.push(
      `- imageId: ${img.id}\n  Slot: ${where}\n  What the designer said to notice: ${img.notice?.trim() || '(nothing said)'}`
    )
  }
  return out.join('\n')
}

export function buildFocusedFixUser(params: {
  intake: Intake
  images: PromptImage[]
  /** The vision pass's description of what is on the screens, or null. */
  extraction: string | null
  /** Why the previous attempt was rejected. */
  notes?: string[]
}): string {
  const parts = [renderFocusedFixIntake(params.intake), renderScreens(params.images, params.intake)]

  if (params.images.length > 0 && params.extraction) {
    parts.push(
      '',
      '=== WHAT IS ON THE SCREENS ===',
      'A vision pass describing what is visible, in the order the images were given. Use it for "alt" only. ' +
        'It describes what is there; it says nothing about the project and it is not where captions come from.',
      'Image index → imageId: ' +
        params.images.map((img, i) => `${i} → ${img.id}`).join(', '),
      params.extraction
    )
  }

  if (params.images.length === 0) {
    parts.push('', 'There are no screens. "figures" is an empty array and the markdown holds no [[figure:…]] marker.')
  }

  if (params.notes?.length) {
    parts.push(
      '',
      '=== REVISION REQUIRED ===',
      'Your previous reply was rejected for the reasons below. Fix every one and keep what was not criticised — do not rewrite the page from scratch.',
      ...params.notes.map((n) => `- ${n}`)
    )
  }

  parts.push('', 'Return the JSON object now.')
  return parts.filter((p) => p !== undefined).join('\n')
}
