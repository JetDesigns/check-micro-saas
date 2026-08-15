// POST /api/edit
//
// Saves owner edits to a published case study — the headline and the eight
// narrative sections, as edited in place on /c/[id].
//
// Guardrails:
//   • RLS gates ownership on the read: if the SELECT returns a row, the
//     caller owns it. No separate user_id comparison needed.
//   • Editing is paid-only. A locked case study shows seven skeleton
//     sections, so "editing" it would mean writing over content the owner
//     has never seen. Rejected with 403.
//   • The write goes through the service-role client because migration 0005
//     revoked `compiled_narrative` from `authenticated`.
//   • The posted narrative is re-validated with the same validator
//     /api/compile uses, so a tampered request can't put a shape into the
//     column that the renderer can't handle.

import { validateNarrative } from '@/lib/narrative'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// Generous but finite. The whole document is 8 sections of ~400 words; this
// caps a pathological paste without getting in a real editor's way.
const MAX_HEADLINE_CHARS = 200

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return Response.json({ error: 'invalid_body' }, { status: 400 })
  }
  const b = body as Record<string, unknown>

  const caseStudyId = typeof b.caseStudyId === 'string' ? b.caseStudyId : ''
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

  // RLS restricts this to the caller's own rows — a hit means ownership.
  const { data: caseStudy, error: csError } = await supabase
    .from('case_studies')
    .select('id, status')
    .eq('id', caseStudyId)
    .single()

  if (csError || !caseStudy) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  const isPaid =
    caseStudy.status === 'paid' || caseStudy.status === 'complete'
  if (!isPaid) {
    return Response.json(
      {
        error: 'locked',
        message: 'Unlock the case study before editing it.',
      },
      { status: 403 }
    )
  }

  let narrative
  try {
    narrative = validateNarrative(b.narrative)
  } catch (e) {
    return Response.json(
      {
        error: 'invalid_narrative',
        message: e instanceof Error ? e.message : 'Narrative failed validation.',
      },
      { status: 400 }
    )
  }

  // Headline is optional in the payload; when present it must be non-empty
  // (an empty H1 would leave the page without a title).
  let headline: string | null = null
  if (typeof b.headline === 'string') {
    const trimmed = b.headline.trim().slice(0, MAX_HEADLINE_CHARS)
    if (trimmed.length === 0) {
      return Response.json(
        { error: 'empty_headline', message: 'The headline cannot be empty.' },
        { status: 400 }
      )
    }
    headline = trimmed
  }

  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from('case_studies')
    .update({
      compiled_narrative: narrative,
      ...(headline ? { headline } : {}),
    })
    .eq('id', caseStudyId)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
