// POST /api/unlock
//
// Spends one credit against a case study and flips its status to 'paid'. All
// of the risky work (ownership check, balance check, decrement, status flip)
// happens inside the spend_credit RPC in a single transaction with row locks,
// so two tabs can't double-unlock on one credit.
//
// It used to return the unlocked document as well. That half went with the
// sales-genre product: the 8-section narrative no longer exists, and the
// replacement is a subset of blocks decided by the read side (Phase 5/6 of
// check-revision-prompt.md). Spending the credit is the part worth keeping
// intact — it is the only piece of this flow that can lose someone money if
// it goes wrong.

import { createClient as createServerClient } from '@/lib/supabase/server'

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

  // The credit is spent and the row is now 'paid'. The caller re-reads the
  // document through the read side, which is where the paid/preview decision
  // belongs — this route never puts document content on the wire.
  return Response.json({ ok: true, newBalance })
}

function extractCaseStudyId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const id = b.caseStudyId
  return typeof id === 'string' && id.length > 0 ? id : null
}
