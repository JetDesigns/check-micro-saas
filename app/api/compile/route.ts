// POST /api/compile
//
// Turns a submitted intake into the block document. Four things have to be
// true before a single token is spent, and each of them exists because it
// went wrong before:
//
//   1. The caller owns the case study.        (RLS, via the session client)
//   2. They are under the daily cap.          (rate_limit_compile)
//   3. Nobody else is already compiling it.   (claim_compile — migration 0012)
//   4. It has not already been compiled.      (claim_compile, same call)
//
// Point 3 is the one that is easy to miss. A compile takes minutes, `status`
// stays 'draft' for all of them, and a plain status check let a second request
// through to make its own model calls and overwrite the first result. Measured
// at the time, not theorised.

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runPipeline, type PipelineImage } from '@/lib/agents/pipeline'
import { GenerationFailed, runFocusedFixPipeline } from '@/lib/agents/focused-fix-pipeline'
import { isStructuringAlias, type StructuringAlias } from '@/lib/agents/client'
import { pageTitle } from '@/lib/markdown-lite'
import { blankInputs, compileBlockers } from '@/lib/wizard-steps'
import { isFocusedFixIntake } from '@/types/database'
import type { LegacyIntake, ProjectType, StoredIntake, Tone } from '@/types/database'

export const runtime = 'nodejs'

// Vercel Hobby caps this at 300s, which is also the default with Fluid
// compute. Up to three opus calls plus a vision pass has to fit inside it.
export const maxDuration = 300

const DAILY_COMPILE_LIMIT = 10
const STALE_CLAIM_AFTER = '10 minutes'

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMedia = (typeof ALLOWED_MEDIA)[number]

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const caseStudyId = extractCaseStudyId(body)
  const dev = devOptions(body)
  if (!caseStudyId) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'not_authenticated' }, { status: 401 })
  }

  // Rate limit before the claim: a user who is over their cap should not be
  // able to park a claim on a row either.
  const { error: rateError } = await supabase.rpc('rate_limit_compile', {
    p_max: DAILY_COMPILE_LIMIT,
  })
  if (rateError) {
    if (rateError.message.includes('rate_limit_exceeded')) {
      return Response.json(
        { error: 'rate_limited', message: `Limit is ${DAILY_COMPILE_LIMIT} case studies a day.` },
        { status: 429 }
      )
    }
    console.error('[/api/compile] rate limit rpc failed:', rateError)
    return Response.json({ error: 'server_error' }, { status: 500 })
  }

  const { data: claim, error: claimError } = await supabase.rpc('claim_compile', {
    p_case_study_id: caseStudyId,
    p_stale_after: STALE_CLAIM_AFTER,
  })
  if (claimError) {
    console.error('[/api/compile] claim rpc failed:', claimError)
    return Response.json({ error: 'server_error' }, { status: 500 })
  }
  if (claim === 'not_found') {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }
  if (claim === 'in_progress') {
    return Response.json({ error: 'in_progress' }, { status: 409 })
  }
  if (claim === 'already_done') {
    return Response.json({ ok: true, alreadyDone: true })
  }

  // Claimed. Everything past here must release the claim on the way out, or
  // the row is stuck until the stale window expires.
  const admin = createAdminClient()

  try {
    const { data: row, error: readError } = await admin
      .from('case_studies')
      .select('intake, project_type, tone')
      .eq('id', caseStudyId)
      .single()

    if (readError || !row?.intake) {
      throw new Error(`case study ${caseStudyId} has no intake to compile`)
    }

    // Fail in milliseconds rather than in four minutes. The UI already
    // refuses, but the UI is not the rule: an intake that cannot produce a
    // legal document would otherwise burn a vision pass over six images and
    // three opus calls before the validator said so — and the retry in
    // between would push the model to invent the decision that is missing.
    const intake = row.intake as StoredIntake

    const blockers = compileBlockers(intake)
    if (blockers.length > 0) {
      await admin
        .from('case_studies')
        .update({ compile_claimed_at: null })
        .eq('id', caseStudyId)
      return Response.json(
        { error: 'not_ready', message: blockers[0] },
        { status: 422 }
      )
    }

    // Routing on the stored shape, not on a flag. A row written by the rebuilt
    // wizard carries inputs the legacy prompt has no section for, and a row
    // written before it is missing inputs the specification requires — and a
    // prompt that lists what it did not get is an invitation to supply it
    // (§10.1). So a v2 intake is written from the specification, and only a v1
    // intake goes through the legacy prompt.
    if (isFocusedFixIntake(intake)) {
      const images = await loadImages(admin, caseStudyId)

      // Ablation: blank named inputs in memory, for this run only. The stored
      // intake is never written back, so one row can be regenerated repeatedly
      // with different fields removed.
      const runIntake = dev.blank.length > 0 ? blankInputs(intake, dev.blank) : intake

      const result = await runFocusedFixPipeline({
        caseStudyId,
        intake: runIntake,
        images,
        model: dev.model,
        blanked: dev.blank,
      })

      const { error: writeError } = await admin
        .from('case_studies')
        .update({
          generated: result.page,
          headline: pageTitle(result.page.markdown) ?? intake.title ?? null,
          status: 'preview',
          compile_claimed_at: null,
        })
        .eq('id', caseStudyId)

      if (writeError) throw writeError

      if (result.page.meta && result.page.meta.warnings.length > 0) {
        console.warn(
          `[/api/compile] ${caseStudyId} written with ${result.page.meta.warnings.length} warning(s):`,
          result.page.meta.warnings
        )
      }
      return Response.json({ ok: true, attempts: result.attempts, path: 'focused_fix' })
    }

    const images = await loadImages(admin, caseStudyId)

    const result = await runPipeline({
      caseStudyId,
      intake: intake as LegacyIntake,
      projectType: (row.project_type ?? 'focused_fix') as ProjectType,
      tone: (row.tone ?? 'professional') as Tone,
      images,
    })

    const { error: writeError } = await admin
      .from('case_studies')
      .update({
        document: result.doc,
        headline: result.headline,
        status: 'preview',
        compile_claimed_at: null,
      })
      .eq('id', caseStudyId)

    if (writeError) throw writeError

    if (result.remainingIssues.length > 0) {
      // Shipped with flags, per the spec's "max 2 retries, then ship with the
      // flagged items marked". Logged rather than returned: the reader does
      // not need to see the critic's homework.
      console.warn(
        `[/api/compile] ${caseStudyId} shipped with ${result.remainingIssues.length} QA note(s):`,
        result.remainingIssues
      )
    }

    return Response.json({ ok: true, attempts: result.attempts })
  } catch (err) {
    // Release the claim so a retry is possible immediately rather than after
    // the stale window.
    await admin
      .from('case_studies')
      .update({ compile_claimed_at: null })
      .eq('id', caseStudyId)

    console.error('[/api/compile] failed:', err)
    if (err instanceof GenerationFailed) {
      console.error('[/api/compile] last reply that failed validation:\n', err.lastReply.slice(0, 4000))
    }
    return Response.json(
      {
        error: 'compile_failed',
        message: readableFailure(err),
        // The reasons, outside production only. They name exactly which rule the
        // page broke, which is the difference between "try again" and a fix.
        ...(process.env.NODE_ENV !== 'production' && err instanceof GenerationFailed
          ? { issues: err.issues }
          : {}),
      },
      { status: 502 }
    )
  }
}

/**
 * A sentence a person can act on, instead of the provider's raw JSON.
 *
 * The SDK puts the whole error body in `message`, so returning it verbatim
 * printed a JSON blob complete with request_id into the page. The full object
 * is already in the server log; this is the half the reader needs.
 */
function readableFailure(err: unknown): string {
  const raw = err instanceof Error ? err.message : ''

  if (raw.includes('credit balance is too low')) {
    return 'The Anthropic account is out of credit, so nothing could be written. Top it up and try again — your answers are still here.'
  }
  if (raw.includes('rate_limit') || raw.includes('429')) {
    return 'The model is rate limited right now. Wait a moment and try again.'
  }
  if (raw.includes('ANTHROPIC_API_KEY')) {
    return 'No Anthropic API key is configured on the server.'
  }
  if (raw.startsWith('Generation failed after')) {
    return 'The page came back unusable three times running. Your answers are saved — try again, and if it keeps happening the reasons are in the server log.'
  }
  if (raw.startsWith('Synthesis failed after')) {
    return 'The case study came back unusable three times running. Your answers are still here — try again, and if it keeps happening the prompt needs a look.'
  }
  return 'The case study could not be written. Please try again.'
}

async function loadImages(
  admin: ReturnType<typeof createAdminClient>,
  caseStudyId: string
): Promise<PipelineImage[]> {
  const { data: attachments } = await admin
    .from('case_study_attachments')
    .select('id, storage_path, mime_type')
    .eq('case_study_id', caseStudyId)
    .order('order_index', { ascending: true })

  if (!attachments?.length) return []

  const images: PipelineImage[] = []
  for (const a of attachments) {
    if (!ALLOWED_MEDIA.includes(a.mime_type as AllowedMedia)) continue

    const { data, error } = await admin.storage
      .from('case-attachments')
      .download(a.storage_path)

    if (error || !data) {
      // One unreadable file should not cost the whole compile.
      console.error('[/api/compile] could not download', a.storage_path, error)
      continue
    }

    images.push({
      id: a.id,
      mediaType: a.mime_type as AllowedMedia,
      base64: Buffer.from(await data.arrayBuffer()).toString('base64'),
    })
  }

  return images
}

/**
 * Request fields that only exist outside production.
 *
 * Choosing the model, blanking an input, and (later) turning the gate on are all
 * ways to spend money or to see behaviour the product does not expose, and a
 * public route must not offer them. In production every one of these is ignored
 * whatever the caller sends.
 */
function devOptions(body: unknown): { model?: StructuringAlias; blank: string[] } {
  if (process.env.NODE_ENV === 'production') return { blank: [] }
  if (typeof body !== 'object' || body === null) return { blank: [] }
  const b = body as { model?: unknown; blank?: unknown }
  return {
    ...(isStructuringAlias(b.model) ? { model: b.model } : {}),
    blank: Array.isArray(b.blank) ? b.blank.filter((x): x is string => typeof x === 'string') : [],
  }
}

function extractCaseStudyId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const id = (body as { caseStudyId?: unknown }).caseStudyId
  return typeof id === 'string' && id.length > 0 ? id : null
}
