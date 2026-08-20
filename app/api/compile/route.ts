// POST /api/compile
//
// Compiles the intake into the rich 8-section case-study narrative + a
// headline + a public-page meta grid, stores all three in the database, and
// returns {ok: true}. The paywalled body (`compiled_narrative`) never crosses
// the wire from this route — the free preview (Vision section only) is
// re-read server-side by /c/[id]. /api/unlock releases the rest after
// spend_credit succeeds.
//
// Guardrails:
//   • RLS gates ownership when we read the intake (via user session cookie).
//   • rate_limit_compile RPC caps how many compiles an anonymous user can
//     trigger per day, so a bad actor can't burn the Anthropic budget.
//   • The narrative UPDATE goes through the service-role client because
//     migration 0005 revoked the column-level SELECT — writes still work,
//     but centralising narrative access in server code makes the paywall
//     boundary explicit.

import Anthropic from '@anthropic-ai/sdk'
import type {
  CaseStudyMeta,
  CompiledNarrative,
  Intake,
  NarrativeCallout,
  NarrativeSection,
  ProjectType,
  Tone,
} from '@/types/database'
import { INTAKE_FIELDS } from '@/lib/intake-fields'
import { validateNarrative } from '@/lib/narrative'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// A real compile measured 2.5 minutes. Vercel's Hobby ceiling is 300s (default
// and maximum), so the normal path fits with room to spare — but the retry
// path below can run a second full Anthropic call, and two of those would sit
// exactly on that ceiling. State the requirement rather than inheriting a
// default that could change, or that depends on fluid compute being on.
export const maxDuration = 300

// How long a claim is honoured before another request may take it. Must be
// comfortably above the worst-case compile (two attempts, ~300s); the route
// clears the claim itself on failure, so this window only matters when a
// function is killed outright.
const STALE_CLAIM_AFTER = '10 minutes'

// Don't start a second attempt if there isn't time to finish it. Failing at
// ~150s with a real message beats a 504 at 300s with nothing saved.
const RETRY_BUDGET_MS = 120_000

// Locked per AGENTS.md — never downgrade to save cost.
const MODEL = 'claude-opus-5'

// Compiles per anonymous user per day. Free preview means every visitor
// triggers a paid Anthropic call; five is enough for genuine trial-and-error
// without inviting abuse.
const DAILY_COMPILE_LIMIT = 5

type AttachmentInfo = { id: string; filename: string; mime_type: string }

// The intake's project-type pill, spelled out. Without this the model gets a
// bare `focused_fix` string and every project type reads the same. The brief
// changes which beats the arc emphasises, not the section list.
const PROJECT_TYPE_BRIEFS: Record<ProjectType, string> = {
  focused_fix: `One specific thing was broken and it was costing them. The arc is: diagnosis → narrow intervention → measurable relief.

Emphasise SCOPING DISCIPLINE. The most persuasive thing about a focused fix is what the designer refused to touch. Name the adjacent work that was deliberately left alone and why leaving it alone was the right call. A prospect reading this should think "this person will not run up my bill".

De-emphasise: grand vision, process ceremony, exhaustive research. This was surgery, not a rebuild.`,

  zero_to_one: `Nothing existed before. The arc is: ambiguity → a frame that made the problem tractable → a first version → what it taught.

Emphasise DECISIONS MADE WITHOUT PRECEDENT. There was no existing system to test against and no baseline to improve on, so the interesting content is how the problem got bounded: what was ruled in, what was ruled out, and what the first version deliberately did badly in order to ship. A prospect should think "this person can start from nothing without freezing".

De-emphasise: before/after comparisons (there is no before), optimisation metrics.`,

  advisory: `The value was in the thinking, not in a deliverable. The arc is: a confused or contested situation → a clarified framing → a decision the client could actually act on.

Emphasise the DECISION THE CLIENT COULD THEN MAKE. Do not inflate artefacts (a workshop, a deck, an audit) into products. The output was clarity, and clarity is worth describing precisely: what they believed going in, what they understood coming out, what they did differently as a result. A prospect should think "this person will save me from an expensive wrong turn".

De-emphasise: screens, features, build detail.`,
}

// The intake's tone pill, spelled out. These change register only — never
// the facts. Each brief says what the tone DOES, what it AVOIDS, and shows
// the same sentence written in that register, because an abstract adjective
// ("warm") on its own produces no measurable difference in output.
const TONE_BRIEFS: Record<Tone, string> = {
  professional: `Measured and composed. The register of a written consultant's report that a CFO could read without wincing.

DO: complete arguments, precise nouns, a calm evidentiary rhythm. Let the reasoning carry the weight.
AVOID: slang, exclamation, rhetorical questions, jokes, and any sentence that sounds like it wants to be quoted.

Sample register: "The proposal stage was where deals stalled, and the delay was measurable in weeks rather than days. That timing problem, not the document design, was what the engagement had to solve."`,

  direct: `Blunt and fast. Conclusion first, support second.

DO: short sentences. Lead each paragraph with the finding, then justify it. Say the unflattering thing plainly — "it was broken", "that was the wrong request", "I said no".
AVOID: hedges ("somewhat", "fairly", "arguably", "in many ways"), throat-clearing preambles ("It's worth noting that"), and softening a criticism into vagueness.

Sample register: "Deals stalled at the proposal stage. Not for days — for weeks. The document design was not the problem, and rebuilding it would have wasted the budget."`,

  confident: `Takes positions and owns them. Confidence comes from specificity, never from adjectives.

DO: state the judgement call and stand behind it ("I scoped it to the public site and held that line"). Name the trade-off you chose and why the alternative was worse.
AVOID: boasting, superlatives about your own work ("world-class", "best-in-class"), and confidence-as-volume. A confident writer does not need to say the work was excellent; they show the reasoning and let the reader conclude it.

Sample register: "I scoped the engagement to the proposal stage and refused the CRM rebuild they asked for. The money was leaking in one place, and spreading a fixed budget across two problems would have half-solved both."`,

  data_driven: `Anchored to observable evidence in every claim.

DO: lead with the measurement where one exists. Attach numbers to their consequence, not just their magnitude. State the baseline alongside the result so the number means something.
AVOID — and this is the important one — substituting an adjective when no number exists. If a section has no measurement, say so explicitly ("this was not measured; what I can report is…") rather than reaching for "significant", "substantial", or "dramatic". Never estimate, extrapolate, or round a number the intake did not state.

Sample register: "Turnaround ran about six hours per proposal, three to four times a week. At that rate the team was spending roughly a day a week on formatting — which is the number that justified the engagement, not the visual quality of the output."`,

  warm: `Plain, human, unguarded. Written the way a good designer talks to a client they like.

DO: talk about people rather than "users" where the sentence allows. Short human asides are fine. Ordinary words beat impressive ones.
AVOID: sentimentality, gushing, exclamation marks, and warmth as a substitute for substance. Warm does not mean soft on the facts — the problems are still described honestly.

Sample register: "Their sales team was rewriting the same proposal three or four times a week, and every one of those rewrites took most of a morning. Nobody enjoyed it. It was the kind of task that quietly makes people avoid the work that earns the money."`,
}

// A failed attempt must not keep holding the claim. The stale window exists
// only to recover from a function that died mid-flight; every failure we can
// actually see should free the row immediately so the user can try again.
async function releaseCompileClaim(caseStudyId: string) {
  try {
    await createAdminClient()
      .from('case_studies')
      .update({ compile_claimed_at: null })
      .eq('id', caseStudyId)
  } catch (e) {
    console.error('[/api/compile] could not release compile claim:', e)
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey && process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'ai_disabled', message: 'ANTHROPIC_API_KEY not set on server.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const caseStudyId = extractCaseStudyId(body)
  if (!caseStudyId) {
    return Response.json({ error: 'missing_case_study_id' }, { status: 400 })
  }

  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 })
  }

  // RLS gates this to only the caller's own case study. compiled_narrative is
  // not readable from `authenticated` after migration 0005 — we don't need
  // its previous value here anyway.
  const { data: caseStudy, error: csError } = await supabase
    .from('case_studies')
    .select('id, status, intake, project_type, tone, client_type')
    .eq('id', caseStudyId)
    .single()

  if (csError || !caseStudy) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  if (!caseStudy.intake) {
    return Response.json({ error: 'no_intake' }, { status: 400 })
  }

  // Claim the compile before spending anything on it.
  //
  // The guard here used to check `status` and let anything still at 'draft'
  // through. A compile runs ~150 seconds and status stays 'draft' for every
  // one of them, so a second request inside that window — a refresh, a retry,
  // React strict-mode's double effect — made its own Anthropic call and
  // overwrote the first result. Aborting the client fetch does not stop the
  // server, which is why the double-fire was never harmless. claim_compile()
  // closes the window with an atomic update: only one caller can win it.
  const { data: claim, error: claimError } = await supabase.rpc(
    'claim_compile',
    { p_case_study_id: caseStudyId, p_stale_after: STALE_CLAIM_AFTER }
  )

  if (claimError) {
    console.error('[/api/compile] claim_compile failed:', claimError)
    return Response.json({ error: claimError.message }, { status: 500 })
  }

  if (claim === 'not_found') {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  // Already compiled — everything the client needs is saved. Same answer the
  // old guard gave, for the case the old guard actually handled correctly.
  if (claim === 'already_done') {
    return Response.json({ ok: true })
  }

  // Someone else is mid-compile. 202 rather than an error: the work is
  // happening, this caller just isn't the one doing it. The loader polls.
  if (claim === 'in_progress') {
    return Response.json({ ok: false, status: 'in_progress' }, { status: 202 })
  }

  // Rate limit counts only compiles we actually run — it sits after the claim
  // so a duplicate that lost the race doesn't burn a slot.
  //
  // The RPC keys the counter to auth.uid() itself — it deliberately takes no
  // user id (migration 0009). Passing one used to let any signed-in caller
  // burn a stranger's daily quota straight through PostgREST.
  const { error: rateError } = await supabase.rpc('rate_limit_compile', {
    p_max: DAILY_COMPILE_LIMIT,
  })
  if (rateError) {
    // We hold the claim at this point and are about to abandon it.
    await releaseCompileClaim(caseStudyId)
    if (rateError.message.includes('rate_limit_exceeded')) {
      return Response.json(
        {
          error: 'rate_limit',
          message: `Daily limit reached (${DAILY_COMPILE_LIMIT} compiles per day). Try again tomorrow.`,
        },
        { status: 429 }
      )
    }
    return Response.json({ error: rateError.message }, { status: 500 })
  }

  const intake = caseStudy.intake as Intake
  const projectType = (caseStudy.project_type ?? 'focused_fix') as ProjectType
  const tone = (caseStudy.tone ?? 'professional') as Tone
  const clientType =
    caseStudy.client_type ?? intake.client_type ?? '(unspecified)'

  // Attachments: only the id + a filename hint reach the model. Storage
  // paths look like `<caseStudyId>/<i>-<sanitizedName>` — everything after
  // the first dash is the original name. Model uses these to write a caption
  // per attachment, keyed by id, that the renderer will look up later.
  const { data: attachmentRows } = await supabase
    .from('case_study_attachments')
    .select('id, storage_path, mime_type')
    .eq('case_study_id', caseStudyId)
    .order('order_index', { ascending: true })

  const attachments: AttachmentInfo[] = (attachmentRows ?? []).map((row) => ({
    id: row.id,
    filename: filenameFromStoragePath(row.storage_path),
    mime_type: row.mime_type,
  }))

  let narrative: CompiledNarrative
  let headline: string | null = null
  let meta: CaseStudyMeta | null = null
  try {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set (dev fallback).')

    const prompt = buildPrompt({
      intake,
      projectType,
      tone,
      clientType,
      attachments,
    })
    const client = new Anthropic({ apiKey })

    // Model output is variable. One retry is enough to recover from the
    // occasional trailing-comma / single-quote quirk; anything worse is a
    // prompt problem, not a transient one.
    let lastRaw = ''
    let lastError: unknown = null
    let parsed: unknown = null
    const startedAt = Date.now()
    for (let attempt = 0; attempt < 2; attempt++) {
      // One attempt takes ~150s and maxDuration is 300s, so a blind retry can
      // run the function straight into a 504 that saves nothing. If the budget
      // is gone, stop and surface the parse error we already have.
      if (attempt > 0 && Date.now() - startedAt > RETRY_BUDGET_MS) {
        console.error(
          `[/api/compile] skipping retry — ${Math.round((Date.now() - startedAt) / 1000)}s already spent, not enough budget for a second attempt`
        )
        break
      }
      const response = await client.messages.create({
        model: MODEL,
        // Generous cap, not a target. max_tokens counts EVERY output token
        // including any reasoning the model emits before the text block, so
        // a budget sized to the JSON alone gets eaten from the front and the
        // response arrives truncated mid-string — which surfaces as a
        // JSON parse error, not as an obvious "too long" error.
        //
        // Billing is per token actually generated, so a high ceiling costs
        // nothing when the model finishes early. Do not tune this down to
        // "save cost"; it does not work that way.
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt }],
      })

      // Modern models can emit thinking or tool_use blocks before the text —
      // scan for the text block instead of trusting content[0].
      const textBlock = response.content.find((c) => c.type === 'text')
      const raw = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      lastRaw = raw
      if (raw.length === 0) {
        lastError = new Error(
          `Anthropic returned no text block (got ${response.content.length} blocks: ${response.content.map((c) => c.type).join(', ')})`
        )
        continue
      }

      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        // Strip trailing commas before `}` or `]` — the single most common
        // syntax slip. No-op on valid strict JSON.
        .replace(/,(\s*[}\]])/g, '$1')
        .trim()

      try {
        parsed = JSON.parse(cleaned)
        lastError = null
        break
      } catch (parseErr) {
        lastError = parseErr
      }
    }

    if (lastError) {
      // Log the raw model output so we can see the actual malformation next
      // time this happens instead of guessing from a bare SyntaxError.
      console.error(
        '[/api/compile] JSON parse failed after retry. Raw response head:',
        lastRaw.slice(0, 500)
      )
      console.error('[/api/compile] Raw response tail:', lastRaw.slice(-500))
      throw lastError
    }

    const parsedObj = (parsed ?? {}) as Record<string, unknown>

    const rawHeadline = parsedObj.headline
    if (typeof rawHeadline === 'string' && rawHeadline.trim().length > 0) {
      headline = rawHeadline.trim()
    }

    meta = validateMeta(parsedObj.meta, attachments)
    narrative = validateNarrative(parsedObj.sections)
  } catch (e) {
    // The dev stub exists for ONE case: working on the app without an
    // Anthropic key. It must not cover for a real failure — stub prose looks
    // plausible enough to be mistaken for model output, which once hid a
    // truncated-response bug for a whole eval run. If we had a key and the
    // call still failed, that is a genuine error and it gets surfaced in
    // every environment.
    if (!apiKey && process.env.NODE_ENV !== 'production') {
      console.warn(
        '[/api/compile] No ANTHROPIC_API_KEY — returning DEV STUB narrative.',
        e
      )
      narrative = buildDevStubNarrative({ intake, projectType, tone })
      meta = buildDevStubMeta({ intake, projectType, clientType, attachments })
    } else {
      console.error('[/api/compile] AI error:', e)
      await releaseCompileClaim(caseStudyId)
      return Response.json(
        {
          error: 'ai_failed',
          message: e instanceof Error ? e.message : 'Unknown AI failure.',
        },
        { status: 502 }
      )
    }
  }

  // Service role write. `compiled_narrative` is paywalled (migration 0005
  // revoked SELECT). `headline` (0007) and `meta` (0008) are anonymized
  // pre-paywall data; both selectable by authenticated. Ownership already
  // verified above via RLS on the read.
  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from('case_studies')
    .update({
      compiled_narrative: narrative,
      status: 'preview',
      ...(headline ? { headline } : {}),
      ...(meta ? { meta } : {}),
    })
    .eq('id', caseStudyId)

  if (updateError) {
    await releaseCompileClaim(caseStudyId)
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  // Paywall: no narrative body crosses the wire from this route. The client
  // only needs to know the compile succeeded — it navigates to /c/[id] which
  // re-fetches server-side (and applies the paywall on the way).
  return Response.json({ ok: true })
}

// ---------------------------------------------------------------------------

function extractCaseStudyId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const id = b.caseStudyId
  return typeof id === 'string' && id.length > 0 ? id : null
}

// Storage paths are `<caseStudyId>/<i>-<sanitizedName>`. Strip the leading
// `<i>-` so the filename hint reads naturally in the prompt.
function filenameFromStoragePath(path: string): string {
  const last = path.split('/').pop() ?? path
  return last.replace(/^\d+-/, '')
}

function buildPrompt(params: {
  intake: Intake
  projectType: ProjectType
  tone: Tone
  clientType: string
  attachments: AttachmentInfo[]
}): string {
  const { intake, projectType, tone, clientType, attachments } = params

  const intakeBlock = INTAKE_FIELDS.map((f) => {
    const raw = intake[f.key]
    const value =
      typeof raw === 'string' && raw.trim().length > 0
        ? raw.trim()
        : '(not provided)'
    return `[${f.key}] ${f.label}\n${value}`
  }).join('\n\n')

  const attachmentBlock =
    attachments.length === 0
      ? '(none)'
      : attachments
          .map((a) => `- id=${a.id} · filename="${a.filename}" · mime=${a.mime_type}`)
          .join('\n')

  return `You are writing a public case-study document for a freelance / small-agency designer. It will live on a public page a prospect visits to decide whether to hire this designer. Voice: first-person, prospect-facing. Substance: business outcomes and design judgement, not portfolio brag.

The reference format is a magazine-style case study document, single column, eight numbered sections. Each section has a fixed NAME plus a SHORT ANGLE SUBTITLE you write, plus 2–4 paragraphs of prose, plus (optionally) a single rich callout — either a highlight box, a set of big-number stats, or a numbered process list. The reader can jump to any section via a top-of-page contents nav.

Client type: ${clientType}

—————————————————————————
VOICE
—————————————————————————

Write in FIRST PERSON from the designer's point of view, speaking directly to the next prospect. Not portfolio-brag first-person ("As a Lead Product Designer at [Company], I set out to..."), but consultant-explaining-value first-person: "The team came to me knowing they had a problem. What they didn't realize was that the real cost wasn't the problem itself — it was..."

You are the designer showing a prospect how you think, not a candidate showing an interviewer how much process you can invoke.

Use "I" for decisions you owned and judgement you exercised. Use "we" for work done with the client's team. Do not use "we" as a corporate plural for one person.

—————————————————————————
PROJECT TYPE — ${projectType}
—————————————————————————

${PROJECT_TYPE_BRIEFS[projectType]}

—————————————————————————
TONE — ${tone}
—————————————————————————

${TONE_BRIEFS[tone]}

The tone controls SENTENCE-LEVEL register only. It never changes the facts, never licenses invention, and never overrides the craft rules below.

—————————————————————————
CRAFT — HOW TO WRITE, NOT WHAT TO WRITE
—————————————————————————

1. SYNTHESIZE, DON'T PARAPHRASE. Do not restate the intake in different words. Interpret, connect, draw insight from what's stated. Bridge fields: the problem implies the cost, the cost motivates the decision, the decision shapes the work, the work produces results.

2. LENGTH per section body: 2–4 paragraphs, roughly 250–400 words. Real paragraphs, not bullets. Each section has a small arc (setup → observation → insight → action). Sentences with real verbs and specific nouns.

3. FRAMING CHECK, applied to every sentence: does this help the next prospect decide whether to hire me? If it's showing off process, cut it. If it's making the business case, keep it.

4. NEVER FABRICATE:
   ALLOWED: reframe stated facts, draw inferences, add analytical reasoning about implications, use domain knowledge to add context.
   NOT ALLOWED: invent client names, invent numbers, invent quotes, invent specific benchmarks, invent client feelings not implied.

5. IF DATA IS THIN in a section: keep it short and honest, still analytical. Do not repeat "(not provided)". Frame the shape of what's known and stop.

6. PROSE, NOT MARKETING. No puffery ("cutting-edge", "seamless", "delightful", "leveraged"). No adjective stacking. Reads like a good business essay, not a landing page.

7. ANTI-REPEAT: each section makes a distinct argument. Do not restate the previous section. Vision sets the goal, Discovery finds what's actually true, Signal identifies the bet, Design describes what got made, Testing describes how it was checked, Launch describes how it shipped, Growth reports what changed after, Reflection tells a similar prospect what's worth doing.

—————————————————————————
WRITE LIKE A SENIOR COPYWRITER — EIGHT MOVES
—————————————————————————

These are the habits that separate a case study written by a person from one that reads as generated. Apply them throughout.

1. OPEN ON A FACT, NOT A THESIS. Start a section with something concrete — a number, a scene, a thing someone did. Never open with an abstract statement of importance.
   NO:  "User experience is critical to conversion in e-commerce."
   YES: "Their sales team was rewriting the same proposal three or four times a week."

2. VARY SENTENCE LENGTH DELIBERATELY. Follow a long, qualified sentence with a short flat one. The short sentence is where the point lands. Uniform sentence length is the single loudest signal of machine writing.
   YES: "They were buying traffic twice. Once through paid search, and then again through the hours agents spent manually rescuing the people that traffic delivered."

3. THE REFRAME — your sharpest tool, and it must be rationed. State what the problem was NOT, then what it actually was. Use it AT MOST TWICE in the whole document, at the two genuine turning points. Overused it becomes a tic, which is worse than not using it at all.
   YES: "Nobody was afraid of the drone. They were afraid of crashing it."
   YES: "Early alignment wasn't process theatre; it was insurance against the rework that kills tight timelines."

4. NAME THINGS. Coin a short, plain term for the central idea of the case and reuse it across sections. A named idea is what a reader repeats to a colleague. Keep it concrete and unpretentious — "the thumb zone", "the confidence gap", "the front door". Never invent a name for a metric, a framework, or a research artefact that did not exist.

5. SPECIFICS LIVE IN THE PROSE, not only in callouts. Real nouns, real quantities, real constraints: "a six-person sales team", "a fixed fee and seven weeks", "three or four times a week". Vague scale ("many", "a lot of", "significantly") is where credibility drains out.

6. NAME WHAT WAS REJECTED. Every good engagement has a road not taken. Say what you declined to build and why declining was correct. This does more to earn a prospect's trust than any description of what you did build.

7. ADMIT THE LIMITS. Where the work was untested, the scope was narrow, or the evidence is thin, say so in plain words. A case study that concedes something is believed; one that concedes nothing reads as marketing. This is not a disclaimer at the end — it belongs inside the argument.

8. EVERY PARAGRAPH MOVES. Each paragraph must advance the argument: an observation leads to an implication leads to a decision. Never end a paragraph with a sentence that restates the paragraph. Cut summary sentences.

—————————————————————————
BANNED — THESE MAKE COPY READ AS MACHINE-WRITTEN
—————————————————————————

VOCABULARY, banned outright: delve, leverage (as a verb), robust, seamless, holistic, elevate, unlock (figurative), streamline, empower, foster, landscape (figurative), realm, tapestry, journey (figurative), "testament to", "game-changer", "best-in-class", "world-class", "cutting-edge", "state-of-the-art", "at the end of the day", "in today's fast-paced world", "it's worth noting that", "needless to say".

CONSTRUCTIONS, banned:
- "Not only … but also"
- "This isn't just X — it's Y" used as a formula rather than an earned reframe
- Three-item lists as a default rhythm ("faster, simpler, and more intuitive"). Use two items, or four, or one.
- Opening consecutive sentences with participial phrases ("Leveraging X…", "Recognising Y…", "Having identified Z…")
- Rhetorical questions used as transitions ("So what changed?")
- A closing sentence that restates the section in different words
- Hedges as filler: "arguably", "in many ways", "to some extent", "somewhat", "quite"
- Praising your own output with adjectives ("elegant solution", "powerful result"). Describe what it did instead.

RHYTHM: do not write every sentence at the same length, do not begin more than two paragraphs in the whole document with "The", and do not use an em-dash aside in more than about a quarter of paragraphs.

—————————————————————————
STRUCTURE — 8 SECTIONS
—————————————————————————

Each section is: {SUBTITLE you write} + {BODY prose} + {optional CALLOUT}. The subtitle is 2–5 words, muscular and angle-specific — NOT generic. It reads after the fixed section name: "The Vision: {your subtitle}". Good subtitle examples from the reference PDF: "Designing for Dignity", "Observing the Real World", "The WhatsApp Paradigm", "Designing Confidence", "Validating with Seniors", "Shipping the Ecosystem", "Measuring Impact", "Designing for Vulnerability". Bad subtitles: "The Story So Far", "Some Insights", "The Approach" — too generic.

01 · vision — "The Vision: {subtitle}"
    What the client (or team) was aiming at, framed as I encountered it. Sets the stakes. Draws primarily on intake.problem + intake.business_impact.
    ALLOWED CALLOUT: insight (or null).

02 · discovery — "The Discovery: {subtitle}"
    What I found when I looked closely. Draws inferences from intake.problem. If research method isn't explicit, describe the SHAPE of investigation without inventing artifacts.
    ALLOWED CALLOUT: insight OR process (or null).

03 · signal — "Finding Signal: {subtitle}"
    The design idea, principle, or bet that emerged. Anchored in intake but can extend to design-thinking rationale.
    ALLOWED CALLOUT: process (or null). Process here is recommended when intake.solution supports 3–4 steps.

04 · design — "The Design: {subtitle}"
    What I made, in plain language a non-designer prospect can act on. Draws on intake.solution.
    ALLOWED CALLOUT: insight (or null).

05 · testing — "Building & Testing: {subtitle}"
    How I checked the work. If usability testing wasn't done, describe the check that WAS done (dogfooding, stakeholder review). Honest.
    ALLOWED CALLOUT: stat (or null). Stat items MUST come from intake.metrics. If metrics is empty, callout = null.

06 · launch — "Launch & Validation: {subtitle}"
    How it shipped and reached its audience. Timeline + scope from intake.timeline_investment + intake.solution.
    ALLOWED CALLOUT: insight (or null).

07 · growth — "Traction & Growth: {subtitle}"
    What changed after. Numbers verbatim from intake.metrics. If no metrics, qualitative signals from intake.client_reaction.
    ALLOWED CALLOUT: stat (or null). Recommended if intake.metrics has 1–2 clear numbers.

08 · reflection — "The Reflection: {subtitle}"
    What I'd tell a similar prospect thinking about a similar project. Not a lessons-learned list — an argument for what kind of work is worth doing. End on something a next prospect can act on.
    ALLOWED CALLOUT: insight (or null). Recommended as a closing beat.

—————————————————————————
CALLOUT SHAPES
—————————————————————————

Each callout MUST be one of exactly these three shapes, or null:

  { "kind": "insight", "label": "<≤4 words, e.g. 'Core Insight' or 'Design Insight' or 'The Bet'>", "text": "<1–2 sentence highlight, ≤180 characters>" }

  { "kind": "stat", "items": [ { "value": "<short, e.g. '40%', '3.5x', '85%', '30 min'>", "label": "<3–6 words UPPERCASE-friendly caption>" } ] }
  // items: 1 or 2 entries. Values MUST come from intake.metrics — do not invent.

  { "kind": "process", "steps": [ { "n": 1, "title": "<2–4 words>", "text": "<one sentence ≤120 chars>" } ] }
  // steps: 3 or 4 entries. n starts at 1 and increments. Draw from intake.problem + intake.solution.

If a section's allowed callout has thin source data, emit "callout": null. Empty is fine. Do NOT invent to fill space.

—————————————————————————
META GRID (page cover)
—————————————————————————

Also output a meta object rendered under the H1:

  meta.role      — my role. Default "Product design lead". Anonymize.
  meta.client    — anonymized client descriptor from intake.client_type. Examples: "Seed-stage healthtech", "30-person B2B SaaS", "Solo founder, marketing tools".
  meta.audience  — one-line end-user description inferred from intake.solution + intake.client_type. Examples: "Marketing teams at growth-stage SaaS", "Independent seniors and their adult children".
  meta.platform  — from intake.solution. Concise: "Web", "iOS", "Android", "Chrome extension", "iOS + Web dashboard", etc.

—————————————————————————
IMAGE CAPTIONS
—————————————————————————

Attachments (screenshots the designer uploaded) are listed below. Write a caption for EACH by id. Captions are ≤80 characters, grounded in intake.solution, in the style of the reference PDF ("Marketplace and Joy TV", "Booking and Real-Time Tracking", "Growth Dashboard"). If the filename gives a hint, use it. Do NOT describe every pixel — a short scene label.

Return them under meta.image_captions as { "<attachment_id>": "<caption>", ... }. If attachments is (none), return meta.image_captions as an empty object {}.

Attachments:
${attachmentBlock}

—————————————————————————
HEADLINE
—————————————————————————

A short compact H1 for the case-study page — 6–10 words, sentence case, angle- or outcome-driven. NOT the intake's raw title. Anonymize by default. Examples: "Turning a generic real-estate site into a discovery engine", "A pricing page that stopped costing sales time", "Cutting the tool-switching tax on a ten-person team".

—————————————————————————
INTAKE
—————————————————————————

${intakeBlock}

—————————————————————————
OUTPUT — STRICT JSON, NO PROSE, NO MARKDOWN FENCES
—————————————————————————

{
  "headline": "<6–10 words>",
  "meta": {
    "role": "<...>",
    "client": "<...>",
    "audience": "<...>",
    "platform": "<...>",
    "image_captions": { "<attachment_id>": "<caption>", ... }
  },
  "sections": {
    "vision":     { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "discovery":  { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "signal":     { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "design":     { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "testing":    { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "launch":     { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "growth":     { "subtitle": "<...>", "body": "<...>", "callout": {...} | null },
    "reflection": { "subtitle": "<...>", "body": "<...>", "callout": {...} | null }
  }
}

CRITICAL: Valid JSON only. No trailing commas. All keys double-quoted. No comments. No markdown fences. Body paragraphs separated with \\n\\n inside the string.`
}

// Dev-only stub. Echoes the intake into the rich narrative shape so the rest
// of the flow can be exercised without a working Anthropic key.
function buildDevStubNarrative(params: {
  intake: Intake
  projectType: ProjectType
  tone: Tone
}): CompiledNarrative {
  const { intake, projectType, tone } = params
  const clip = (s: string | undefined, fallback: string) =>
    (s?.trim() || fallback).slice(0, 800)

  const meta = `[dev stub · ${projectType} · ${tone}] `

  const section = (
    subtitle: string,
    body: string,
    callout: NarrativeCallout | null = null
  ): NarrativeSection => ({ subtitle, body, callout })

  return {
    vision: section(
      'Designing for Momentum',
      clip(intake.problem, meta + '(no problem provided in intake)')
    ),
    discovery: section(
      'Observing the Real World',
      clip(intake.business_impact, meta + '(no business_impact provided in intake)')
    ),
    signal: section(
      'The Bet',
      clip(intake.solution, meta + '(no solution rationale provided in intake)')
    ),
    design: section(
      'Confidence in the Craft',
      clip(intake.solution, meta + '(no work summary in intake)')
    ),
    testing: section(
      'Validating the Work',
      clip(intake.timeline_investment, meta + '(no timeline/investment provided in intake)')
    ),
    launch: section(
      'Shipping the Change',
      meta +
        `Rolled out to ${intake.client_type || 'the team'} with the deliverables described in the intake.`
    ),
    growth: section(
      'Measuring Impact',
      clip(intake.metrics, meta + '(no metrics provided in intake)')
    ),
    reflection: section(
      'A Note to the Next Prospect',
      clip(intake.client_reaction, meta + '(no client reaction provided in intake)')
    ),
  }
}

function buildDevStubMeta(params: {
  intake: Intake
  projectType: ProjectType
  clientType: string
  attachments: AttachmentInfo[]
}): CaseStudyMeta {
  const { intake, projectType, clientType, attachments } = params
  const image_captions: Record<string, string> = {}
  for (const a of attachments) {
    image_captions[a.id] = `[dev stub] ${a.filename}`
  }
  return {
    role: 'Product design lead',
    client: clientType,
    audience: intake.client_type || '(unspecified audience)',
    platform: `[dev stub · ${projectType}]`,
    image_captions,
  }
}

// Validate the model's meta object. Falls back to sensible defaults for any
// missing field so the meta grid always has something to render.
function validateMeta(
  input: unknown,
  attachments: AttachmentInfo[]
): CaseStudyMeta {
  const record =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}

  const str = (v: unknown, fallback: string): string =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : fallback

  const rawCaptions = record.image_captions
  const image_captions: Record<string, string> = {}
  if (typeof rawCaptions === 'object' && rawCaptions !== null) {
    for (const a of attachments) {
      const cap = (rawCaptions as Record<string, unknown>)[a.id]
      if (typeof cap === 'string' && cap.trim().length > 0) {
        image_captions[a.id] = cap.trim().slice(0, 120)
      }
    }
  }

  return {
    role: str(record.role, 'Product design lead'),
    client: str(record.client, '(unspecified)'),
    audience: str(record.audience, '(unspecified)'),
    platform: str(record.platform, '(unspecified)'),
    image_captions,
  }
}
