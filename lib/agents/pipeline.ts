import 'server-only'
import {
  validateCaseStudy,
  type CaseStudy,
  type ValidationIssue,
} from '@/lib/case-study-blocks'
import { callAgent } from '@/lib/agents/client'
import { parseJsonObject } from '@/lib/agents/parse'
import {
  EXTRACTION_SYSTEM,
  QA_SYSTEM,
  buildQaUser,
  buildSynthesisSystem,
  buildSynthesisUser,
  renderIntake,
} from '@/lib/agents/prompts'
import type { Intake, ProjectType, Tone } from '@/types/database'

// Separate calls, deliberately. Merging visual grounding into the writing call
// is what produces invented claims: a model asked to describe a screen and
// argue for a designer in one breath will describe screens it wishes it had
// seen. The vision pass reports what is visible and nothing else.

export const MAX_SYNTHESIS_ATTEMPTS = 3 // first attempt plus the spec's two retries

// Generous on purpose. `max_tokens` counts reasoning tokens as well as output,
// so a budget sized to the expected JSON gets eaten from the front and the
// response arrives truncated mid-string. Billing is per token *generated*, so
// a high ceiling costs nothing when the model finishes early.
const MAX_TOKENS = {
  extraction: 8_000,
  synthesis: 16_000,
  qa: 4_000,
} as const

export type PipelineImage = {
  /** The id the document must reference. */
  id: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
  base64: string
}

export type PipelineResult = {
  doc: CaseStudy
  headline: string
  /** QA notes still standing after the last attempt. Empty means it passed. */
  remainingIssues: string[]
  attempts: number
}

type SynthesisPayload = CaseStudy & { headline?: string }

export async function runPipeline(params: {
  caseStudyId: string
  intake: Intake
  projectType: ProjectType
  tone: Tone
  images: PipelineImage[]
}): Promise<PipelineResult> {
  const { caseStudyId, intake, projectType, tone, images } = params

  const intakeText = renderIntake(intake, projectType, tone)
  const imageIds = images.map((i) => i.id)

  const extraction = images.length > 0 ? await runExtraction(caseStudyId, images) : null

  const system = buildSynthesisSystem(tone, projectType)
  let notes: string[] = []
  let lastFailure = 'synthesis never produced a usable document'

  // The best document seen so far: one that passed every validation rule,
  // even if QA still had opinions about the prose. Kept because a later
  // attempt can come back WORSE — observed in the wild, where attempt 1 was
  // legal and attempt 2 regressed, and the whole compile was thrown away with
  // a valid document already in hand.
  let bestValid: { doc: CaseStudy; headline: string; issues: string[] } | null =
    null

  for (let attempt = 0; attempt < MAX_SYNTHESIS_ATTEMPTS; attempt++) {
    const { text } = await callAgent({
      agent: 'synthesis',
      caseStudyId,
      attempt,
      system,
      content: buildSynthesisUser({
        intakeText,
        extraction,
        imageIds,
        qaNotes: notes,
      }),
      maxTokens: MAX_TOKENS.synthesis,
    })

    const parsed = parseJsonObject<SynthesisPayload>(text)
    if (!parsed.ok) {
      lastFailure = parsed.error
      notes = [`The previous response could not be parsed: ${parsed.error}`]
      continue
    }

    const doc: CaseStudy = { spine: parsed.value.spine, blocks: parsed.value.blocks }

    // The schema is the contract, so it is checked before spending a QA call.
    // A document that breaks it cannot render, and no amount of critique on
    // the prose would fix a missing move section.
    const invalid = validateCaseStudy(doc, { uploadedImageIds: imageIds })
    if (invalid.length > 0) {
      lastFailure = `failed validation: ${invalid.map((i) => i.rule).join(', ')}`
      notes = invalid.map(describeIssue)
      continue
    }

    const headline = (parsed.value.headline ?? '').trim() || fallbackHeadline(intake)
    const issues = await runQa(caseStudyId, attempt, doc, headline, intakeText)

    if (issues.length === 0) {
      return { doc, headline, remainingIssues: [], attempts: attempt + 1 }
    }

    // Valid, but the critic still has notes. Hold on to it — fewer notes wins
    // if a later attempt is also valid, and having ANY valid document beats
    // whatever the next attempt does.
    if (!bestValid || issues.length < bestValid.issues.length) {
      bestValid = { doc, headline, issues }
    }

    // Last time round: ship it with the flags rather than burning another
    // call. The document is valid, and QA notes are opinions about prose.
    if (attempt === MAX_SYNTHESIS_ATTEMPTS - 1) {
      return { doc, headline, remainingIssues: issues, attempts: attempt + 1 }
    }

    notes = issues
  }

  // The last attempt was unusable — but an earlier one may not have been.
  if (bestValid) {
    return {
      doc: bestValid.doc,
      headline: bestValid.headline,
      remainingIssues: bestValid.issues,
      attempts: MAX_SYNTHESIS_ATTEMPTS,
    }
  }

  // Nothing legal was produced at any point. Fail loudly rather than store a
  // document the renderer cannot draw.
  throw new Error(
    `Synthesis failed after ${MAX_SYNTHESIS_ATTEMPTS} attempts — ${lastFailure}`
  )
}

async function runExtraction(
  caseStudyId: string,
  images: PipelineImage[]
): Promise<string | null> {
  // One batched call for every image, not one call per image. Cheaper, and it
  // lets the model see the set as a set — which screen is the overview and
  // which is a detail is only answerable in context.
  const content = [
    ...images.map((img, i) => [
      { type: 'text' as const, text: `Image index ${i}:` },
      {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mediaType,
          data: img.base64,
        },
      },
    ]).flat(),
    {
      type: 'text' as const,
      text: `Describe all ${images.length} image(s) as JSON, in the order given.`,
    },
  ]

  try {
    const { text } = await callAgent({
      agent: 'extraction',
      caseStudyId,
      attempt: 0,
      system: EXTRACTION_SYSTEM,
      content,
      maxTokens: MAX_TOKENS.extraction,
    })
    return text || null
  } catch (err) {
    // A failed vision pass costs grounded captions, not the document. Writing
    // is still possible from the answers alone, and losing the whole compile
    // over the images would be the worse trade.
    console.error('[pipeline] extraction failed, continuing without it:', err)
    return null
  }
}

async function runQa(
  caseStudyId: string,
  attempt: number,
  doc: CaseStudy,
  headline: string,
  intakeText: string
): Promise<string[]> {
  try {
    const { text } = await callAgent({
      agent: 'qa',
      caseStudyId,
      attempt,
      system: QA_SYSTEM,
      content: buildQaUser(doc, headline, intakeText),
      maxTokens: MAX_TOKENS.qa,
    })

    const parsed = parseJsonObject<{ issues?: unknown }>(text)
    if (!parsed.ok || !Array.isArray(parsed.value.issues)) return []

    return parsed.value.issues
      .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
      .slice(0, 20)
  } catch (err) {
    // QA is a quality gate, not a gatekeeper. If the critic is unavailable the
    // document is still valid against the schema, and shipping it unflagged
    // beats failing a compile the user is waiting on.
    console.error('[pipeline] QA failed, shipping unflagged:', err)
    return []
  }
}

function describeIssue(issue: ValidationIssue): string {
  return `${issue.rule}: ${issue.message}`
}

function fallbackHeadline(intake: Intake): string {
  return intake.title?.trim() || 'Untitled case study'
}
