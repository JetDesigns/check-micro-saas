// GET /writing/[id]
//
// The full-page loading screen shown after "Write my case study" is
// submitted. Server-side we do a fast ownership + status check:
//   • Not the owner → 404 (don't leak the draft's existence).
//   • Already compiled (status past 'draft') → redirect straight to /c/[id];
//     no need to sit through the loader.
// Otherwise render the client-side <WritingLoader> which fires /api/compile
// and drives the phase animation.

import { notFound, redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CaseStudyStatus } from '@/types/database'
import { WritingLoader } from './WritingLoader'

export const runtime = 'nodejs'

type PageProps = {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Writing your case study… · Check',
  robots: { index: false, follow: false },
}

export default async function WritingPage({ params }: PageProps) {
  const { id } = await params

  const admin = createAdminClient()
  const { data: cs, error } = await admin
    .from('case_studies')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle()

  if (error || !cs) notFound()

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isOwner = !!user && user.id === cs.user_id
  if (!isOwner) notFound()

  const status = cs.status as CaseStudyStatus
  if (status !== 'draft') {
    // Compile already completed on a previous visit — go straight to the page.
    redirect(`/c/${id}`)
  }

  return <WritingLoader caseStudyId={id} />
}
