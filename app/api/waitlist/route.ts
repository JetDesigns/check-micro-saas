// POST /api/waitlist
//
// Landing-page early-access signup. Body:
//   { email, painFrequency, priceWillingness }
//
// Unauthenticated on purpose — the whole point is to hear from people who
// have not started anything yet, so there is no session to read.
//
// The table has RLS on with zero policies, so the browser cannot reach it
// directly in either direction; this route on the service role is the only
// way in, and it validates both answers against the allowlist in
// lib/waitlist.ts before writing. A public form must never become a public
// dump of everyone else's email.

import { createAdminClient } from '@/lib/supabase/admin'
import { SURVEY_VERSION, parseWaitlistSubmission } from '@/lib/waitlist'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = parseWaitlistSubmission(body)
  if (!parsed.ok) {
    return Response.json(
      { error: 'invalid_field', field: parsed.field },
      { status: 400 }
    )
  }

  const { email, painFrequency, priceWillingness } = parsed.value

  const admin = createAdminClient()

  // Upsert, not insert: submitting again revises the answers instead of
  // erroring at the visitor or leaving two rows that disagree. Also makes a
  // double-clicked button a no-op. parseWaitlistSubmission has already
  // lowercased the address, which is what makes the plain-column unique
  // index case-insensitive in practice.
  const { error } = await admin.from('waitlist').upsert(
    {
      email,
      pain_frequency: painFrequency,
      price_willingness: priceWillingness,
      // Stamped server-side, never taken from the request: the client has no
      // business telling us which questions it thinks it asked.
      survey_version: SURVEY_VERSION,
    },
    { onConflict: 'email' }
  )

  if (error) {
    console.error('[/api/waitlist] insert failed:', error)
    return Response.json({ error: 'save_failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
