import 'server-only'
import { STRUCTURING_MODELS, callAgent, type StructuringAlias } from '@/lib/agents/client'
import {
  buildFocusedFixSystem,
  buildFocusedFixUser,
  loadSpec,
  pairImages,
} from '@/lib/agents/focused-fix-prompts'
import { parseJsonObject } from '@/lib/agents/parse'
import { runExtraction, type PipelineImage } from '@/lib/agents/pipeline'
import { buildApproachDiagram } from '@/lib/approach-diagram'
import { validateFocusedFix, type Issue } from '@/lib/focused-fix-validate'
import type { GeneratedPage, Intake } from '@/types/database'

// The Focused Fix pipeline: the specification as the system prompt, one writing
// call, code checks, and a retry that carries the failures back as notes.
//
// What is NOT here, on purpose:
//
//   - No QA agent. The legacy path ran a critic whose rules contradict the spec
//     (it demands imperative move titles, which §8.3 forbids). The mechanical half
//     of the spec's own checklist is `validateFocusedFix` — code, free, on every
//     attempt. The argument-level half needs a reader and is the optional gate
//     agent, which is a flag that is OFF by default and is not built yet.
//   - No tone. §8.1 fixes one register; nothing in the answers changes it.
//   - No spine. That is the legacy document shape.

export const MAX_ATTEMPTS = 3

// Sized for the reasoning, not for the page, because `max_tokens` counts both and
// the reasoning is the larger half: a ~1,000-word page is about 1,400 tokens of
// markdown, and the first run to truncate here spent the other 14,600 of a 16,000
// budget thinking at effort 'high'. The call streams, which is what lifts the
// SDK's non-streaming ceiling of around 21k; billing is per token generated, so a
// ceiling that is never reached costs nothing.
const MAX_TOKENS = 32_000

// What a truncation retry gets. Raising the budget is the fix for a reply that was
// cut off; telling the model to write less is how a retry makes the page worse,
// which is exactly what the previous note did.
const TRUNCATION_RELIEF = 1.5

export type FocusedFixResult = {
  page: GeneratedPage
  attempts: number
}

/**
 * What a failed generation carries with it.
 *
 * Thrown rather than returned so a caller cannot forget to check, but with the
 * last attempt's reasons and raw reply attached — "it failed" is not something
 * anyone can act on, and the reply that failed is the only evidence of why.
 */
export class GenerationFailed extends Error {
  constructor(
    message: string,
    readonly attempts: number,
    readonly issues: Issue[],
    readonly lastReply: string
  ) {
    super(message)
    this.name = 'GenerationFailed'
  }
}

export async function runFocusedFixPipeline(params: {
  /** The row to log against, or null for a dry run. */
  caseStudyId: string | null
  intake: Intake
  images: PipelineImage[]
  model?: StructuringAlias
  /** Field paths blanked for this run. Recorded on the page; the caller applies them. */
  blanked?: string[]
}): Promise<FocusedFixResult> {
  const { caseStudyId, intake, images } = params
  const modelId = STRUCTURING_MODELS[params.model ?? 'default']

  const promptImages = pairImages(intake, images.map((i) => i.id))
  // Read once and passed to both: the system prompt needs it, and so does the
  // check that the specification's own sentences stay off the page.
  const spec = loadSpec()
  const system = buildFocusedFixSystem(spec)

  // Alt text needs to know what is on the screen; nothing else does. A failed
  // vision pass costs alt text, not the page, and runExtraction already treats it
  // that way.
  const extraction = images.length > 0 ? await runExtraction(caseStudyId, images) : null

  let notes: string[] = []
  let issues: Issue[] = []
  let lastReply = ''
  let lastFailure = 'no attempt produced a usable page'
  let budget = MAX_TOKENS
  const attemptLog: string[] = []

  const started = Date.now()
  let inputTokens = 0
  let outputTokens = 0
  let cacheReadTokens = 0
  let cacheCreationTokens = 0

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await callAgent({
      agent: 'structuring',
      caseStudyId,
      attempt,
      system,
      content: buildFocusedFixUser({ intake, images: promptImages, extraction, notes }),
      maxTokens: budget,
      model: modelId,
      effort: 'high',
      stream: true,
    })

    inputTokens += result.inputTokens
    outputTokens += result.outputTokens
    cacheReadTokens += result.cacheReadTokens
    cacheCreationTokens += result.cacheCreationTokens
    lastReply = result.text

    const parsed = parseJsonObject<unknown>(result.text)
    if (!parsed.ok) {
      // Two different failures wearing the same clothes. A reply that was cut off
      // is a budget problem and the answer is a bigger budget; a reply that is
      // malformed is a format problem. Telling the model to be more compact fixes
      // neither, and costs the page its argument.
      const truncated = result.stopReason === 'max_tokens' || parsed.truncated
      if (truncated) {
        lastFailure = `the reply was cut off at ${budget} output tokens before it finished`
        attemptLog.push(`attempt ${attempt + 1}: cut off at ${budget} output tokens`)
        notes = [
          'Your previous reply stopped before the JSON was finished. Return the complete object this time. ' +
            'The budget has been raised, so do NOT shorten the page or thin its argument to make it fit — ' +
            'the reply was cut off, it was not too long.',
        ]
        budget = Math.round(budget * TRUNCATION_RELIEF)
      } else {
        lastFailure = `the reply could not be parsed: ${parsed.error}`
        attemptLog.push(`attempt ${attempt + 1}: unparseable — ${parsed.error}`)
        notes = [
          `Your previous reply could not be parsed as JSON: ${parsed.error}. Return one JSON object and nothing else.`,
        ]
      }
      issues = [{ rule: truncated ? 'truncated' : 'parse', message: lastFailure }]
      continue
    }

    const checked = validateFocusedFix(parsed.value, { intake, images: promptImages, spec })
    if (checked.issues.length > 0 || !checked.page) {
      issues = checked.issues
      const rules = [...new Set(checked.issues.map((i) => i.rule))].join(', ')
      lastFailure = `failed validation: ${rules}`
      attemptLog.push(`attempt ${attempt + 1}: rejected — ${rules}`)
      notes = checked.issues.map((i) => `${i.rule}: ${i.message}`)
      continue
    }

    return {
      attempts: attempt + 1,
      page: {
        ...checked.page,
        // Derived from the answers, not from the reply. A project whose material
        // does not support one gets null, and Approach reads as prose with no
        // trace of the absence (§9.7).
        diagram: buildApproachDiagram(intake),
        meta: {
          model: result.model,
          attempts: attempt + 1,
          warnings: checked.warnings.map((w) => `${w.rule}: ${w.message}`),
          durationMs: Date.now() - started,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheCreationTokens,
          attemptLog,
          blanked: params.blanked ?? [],
        },
      },
    }
  }

  throw new GenerationFailed(
    `Generation failed after ${MAX_ATTEMPTS} attempts — ${lastFailure}`,
    MAX_ATTEMPTS,
    issues,
    lastReply
  )
}
