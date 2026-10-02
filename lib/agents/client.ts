import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractText } from '@/lib/agents/parse'

export { extractText }

// AGENTS.md locks claude-opus-5 for the writing pass: it is the artifact
// people pay for, and AI is ~3% of revenue. The spec names `claude-opus-4-8`
// for synthesis; that model does not exist in this generation.
export const MODELS = {
  extraction: 'claude-sonnet-5',
  synthesis: 'claude-opus-5',
  qa: 'claude-sonnet-5',
  // The Focused Fix path. `structuring` is the writing call; its model is chosen
  // per request (below), so the value here is only the default the log falls back
  // to. `gate` is the optional checklist critic and is off unless asked for.
  structuring: 'claude-sonnet-5-5',
  gate: 'claude-sonnet-5-5',
} as const

export type AgentName = keyof typeof MODELS

/**
 * Which model does the structuring call, chosen per request rather than fixed.
 *
 * `default` is what iteration runs on: cheaper, and what the ablation runs use so
 * that regenerating one input many times does not cost what a final page costs.
 * `strong` is for the comparison run on the SAME input, to see whether a
 * difference is the model or the prompt.
 *
 * Aliases rather than raw ids in the request, so a typo cannot quietly route a
 * paid call to a model nobody meant, and so the ids live in one place.
 *
 * claude-opus-5-5 is newer AND cheaper than the claude-opus-5 the legacy path
 * still pins ($4/$20 against $5/$25 per MTok), so the comparison arm is an
 * upgrade and a price cut at once.
 */
export const STRUCTURING_MODELS = {
  default: 'claude-sonnet-5-5',
  strong: 'claude-opus-5-5',
} as const

export type StructuringAlias = keyof typeof STRUCTURING_MODELS

export function isStructuringAlias(value: unknown): value is StructuringAlias {
  return typeof value === 'string' && value in STRUCTURING_MODELS
}

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set.')
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

export type AgentCallResult = {
  text: string
  inputTokens: number
  outputTokens: number
  /** Tokens read from the prompt cache. Zero on every call means it never hits. */
  cacheReadTokens: number
  cacheCreationTokens: number
  durationMs: number
  stopReason: string | null
  model: string
}

/**
 * One model call, recorded.
 *
 * Every call writes a row to agent_runs whether it succeeded or not — a
 * refusal and a truncation look identical in a token total, so the failures
 * are worth as much as the successes when working out what a compile costs.
 */
export async function callAgent(params: {
  agent: AgentName
  /**
   * The row to log against, or null for a dry run with no case study. A null id
   * skips the log entirely: agent_runs.case_study_id is a foreign key, so a run
   * with no row behind it has nowhere to be recorded.
   */
  caseStudyId: string | null
  attempt: number
  /**
   * A string, or blocks — the block form is how a `cache_control` breakpoint gets
   * attached. The Focused Fix system prompt is the whole specification, which is
   * byte-identical on every run, so it is worth caching.
   */
  system: string | Anthropic.TextBlockParam[]
  content: Anthropic.MessageParam['content']
  maxTokens: number
  /** Overrides MODELS[agent] for this call. */
  model?: string
  /**
   * Set explicitly on the structuring call. The two models' defaults differ
   * (medium on Opus 5.5, high on Sonnet 5.5), so leaving it unset would make a
   * model comparison change two variables and measure neither.
   */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  /**
   * Stream the reply and assemble it, instead of waiting for the whole message.
   *
   * Not a progress feature — nothing here shows a partial page to anyone. It is
   * what lifts the non-streaming ceiling the SDK enforces at around 21k tokens,
   * which a writing call with reasoning turned up runs into: the thinking is
   * billed as output and spends the same budget the page does.
   */
  stream?: boolean
}): Promise<AgentCallResult> {
  const { agent, caseStudyId, attempt, system, content, maxTokens, effort } = params
  const model = params.model ?? MODELS[agent]
  const started = Date.now()

  try {
    const request: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
      ...(effort ? { output_config: { effort } } : {}),
    }
    const response = params.stream
      ? await getClient().messages.stream(request).finalMessage()
      : await getClient().messages.create(request)

    const result: AgentCallResult = {
      text: extractText(response.content),
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      durationMs: Date.now() - started,
      stopReason: response.stop_reason,
      model,
    }

    await logRun({
      caseStudyId,
      agent,
      model,
      attempt,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      cacheCreationTokens: result.cacheCreationTokens,
      durationMs: result.durationMs,
      ok: true,
      // `max_tokens` as a stop reason is the truncation case, and it is worth
      // recording even on an otherwise successful call.
      error: response.stop_reason === 'max_tokens' ? 'stop_reason=max_tokens' : null,
    })

    return result
  } catch (err) {
    await logRun({
      caseStudyId,
      agent,
      model,
      attempt,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - started,
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 500) : 'unknown error',
    })
    throw err
  }
}

async function logRun(row: {
  caseStudyId: string | null
  agent: string
  model: string
  attempt: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  durationMs: number
  ok: boolean
  error: string | null
}) {
  // A dry run has no row to log against.
  if (!row.caseStudyId) return

  try {
    await createAdminClient()
      .from('agent_runs')
      .insert({
        case_study_id: row.caseStudyId,
        agent: row.agent,
        model: row.model,
        attempt: row.attempt,
        input_tokens: row.inputTokens,
        output_tokens: row.outputTokens,
        // Only when there is something to say. These columns arrived with
        // migration 0015; the legacy path never caches, and leaving the keys off
        // for it means a database that has not run 0015 yet still records every
        // legacy call instead of losing the whole row to an unknown column.
        ...(row.cacheReadTokens || row.cacheCreationTokens
          ? {
              cache_read_input_tokens: row.cacheReadTokens ?? 0,
              cache_creation_input_tokens: row.cacheCreationTokens ?? 0,
            }
          : {}),
        duration_ms: row.durationMs,
        ok: row.ok,
        error: row.error,
      })
  } catch (err) {
    // Accounting must never take down a compile the user is paying for.
    console.error('[agent_runs] failed to log run:', err)
  }
}
