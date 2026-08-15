// POST /api/unlock
//
// Spends one credit against a case study, flipping its status to 'paid' and
// returning the full 8-section narrative. All of the risky work (ownership
// check, balance check, decrement, status flip) happens inside the
// spend_credit RPC in a single transaction with row locks, so two tabs can't
// double-unlock on one credit.
//
// Narrative retrieval uses the service role because migration 0005 revoked
// `compiled_narrative` SELECT from `authenticated` — server routes are the
// only path to the locked sections.

import type { CompiledNarrative } from '@/types/database'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
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

  // Atomic: ownership, balance ≥ 1, decrement, status flip, ledger insert.
  const { data: newBalance, error: rpcError } = await supabase.rpc(
    'spend_credit',
    { p_case_study_id: caseStudyId }
  )

  if (rpcError) {
    const msg = rpcError.message
    if (msg.includes('insufficient_credits')) {
      return Response.json(
        {
          error: 'insufficient_credits',
          message: 'Not enough credits. Buy a pack to continue.',
        },
        { status: 402 }
      )
    }
    if (msg.includes('already_unlocked')) {
      return Response.json({ error: 'already_unlocked' }, { status: 409 })
    }
    if (msg.includes('not_owner')) {
      return Response.json({ error: 'not_owner' }, { status: 403 })
    }
    if (msg.includes('case_study_not_found')) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }
    console.error('[/api/unlock] spend_credit failed:', rpcError)
    return Response.json(
      { error: 'rpc_failed', message: msg },
      { status: 500 }
    )
  }

  // Credit is spent — now hand back the full narrative. Service role because
  // `authenticated` has no SELECT on this column post-migration-0005.
  const admin = createAdminClient()
  const { data, error: fetchError } = await admin
    .from('case_studies')
    .select('compiled_narrative')
    .eq('id', caseStudyId)
    .single()

  if (fetchError || !data?.compiled_narrative) {
    // The credit is gone but the narrative isn't loadable. Log loudly so we
    // can refund manually — the user shouldn't be charged and shown nothing.
    console.error(
      '[/api/unlock] credit spent but narrative missing:',
      caseStudyId,
      fetchError
    )
    return Response.json(
      {
        error: 'narrative_missing',
        message:
          'Credit spent but narrative could not be loaded. Contact support.',
      },
      { status: 500 }
    )
  }

  return Response.json({
    ok: true,
    newBalance,
    narrative: data.compiled_narrative as CompiledNarrative,
  })
}

function extractCaseStudyId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const id = b.caseStudyId
  return typeof id === 'string' && id.length > 0 ? id : null
}
