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
} as const

export type AgentName = keyof typeof MODELS

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
  durationMs: number
  stopReason: string | null
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
  caseStudyId: string
  attempt: number
  system: string
  content: Anthropic.MessageParam['content']
  maxTokens: number
}): Promise<AgentCallResult> {
  const { agent, caseStudyId, attempt, system, content, maxTokens } = params
  const model = MODELS[agent]
  const started = Date.now()

  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    })

    const result: AgentCallResult = {
      text: extractText(response.content),
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      durationMs: Date.now() - started,
      stopReason: response.stop_reason,
    }

    await logRun({
      caseStudyId,
      agent,
      model,
      attempt,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
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
  caseStudyId: string
  agent: string
  model: string
  attempt: number
  inputTokens: number
  outputTokens: number
  durationMs: number
  ok: boolean
  error: string | null
}) {
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
        duration_ms: row.durationMs,
        ok: row.ok,
        error: row.error,
      })
  } catch (err) {
    // Accounting must never take down a compile the user is paying for.
    console.error('[agent_runs] failed to log run:', err)
  }
}
