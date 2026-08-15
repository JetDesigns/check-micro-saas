// GET /c/[id]
//
// Public, link-shareable case-study page. Owner sees the same content plus a
// small action bar (Copy link case study). Prospects reach it via the URL the
// owner shares after unlocking.
//
// Access rules:
//   • paid    → anyone with the link can read.
//   • preview → only the owner sees it (with an unlock CTA). Non-owners get a
//     404 so we don't leak the existence of an unpaid draft.
//
// Fetching goes through the service-role client because migration 0005 revoked
// `compiled_narrative` SELECT from `authenticated` — this route is the
// paywall boundary on the read side.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type {
  CaseStudyMeta,
  CaseStudyStatus,
  CompiledNarrative,
  NarrativeSection,
  ProjectType,
  Tone,
} from '@/types/database'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CaseStudyView, type CaseStudyAttachment } from './CaseStudyView'

export const runtime = 'nodejs'

// Bucket that holds the intake attachments. Signed URLs live for an hour —
// long enough for the reader to open the page and see the images without
// exposing the raw storage path publicly.
const ATTACHMENT_BUCKET = 'case-attachments'
const SIGNED_URL_TTL_SECONDS = 60 * 60

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    welcome?: string
    login?: string
    purchased?: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: cs } = await admin
    .from('case_studies')
    .select('title, headline, status')
    .eq('id', id)
    .maybeSingle()

  // Prefer the AI-generated headline; fall back to the raw intake title for
  // old rows compiled before migration 0007.
  const displayTitle = cs?.headline ?? cs?.title ?? null
  const title = displayTitle ? `${displayTitle} · Check` : 'Case study · Check'
  return {
    title,
    description:
      'A business-framed case study written for the next paying client.',
    // Preview drafts should not be indexed even if guessed.
    robots: cs?.status === 'paid' ? undefined : { index: false, follow: false },
  }
}

export default async function CaseStudyPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { welcome, login, purchased } = await searchParams

  const admin = createAdminClient()
  const { data: cs, error } = await admin
    .from('case_studies')
    .select(
      'id, user_id, status, title, headline, meta, client_type, project_type, tone, compiled_narrative, created_at'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !cs) notFound()

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = !!user && user.id === cs.user_id

  // Owner's current credit balance — drives the sticky CTA copy on the
  // locked view ("Unlock now" vs "Buy 5 credits"). Non-owners never see the
  // CTA so their balance is irrelevant.
  let ownerBalance = 0
  if (isOwner && user) {
    const { data: userRow } = await admin
      .from('users')
      .select('credit_balance')
      .eq('id', user.id)
      .maybeSingle()
    ownerBalance = userRow?.credit_balance ?? 0
  }

  const status = cs.status as CaseStudyStatus
  const isPaid = status === 'paid' || status === 'complete'

  // Don't leak the existence of a draft to non-owners.
  if (!isPaid && !isOwner) notFound()

  const narrative = cs.compiled_narrative as CompiledNarrative | null
  const meta = (cs.meta as CaseStudyMeta | null) ?? null

  // Free preview: only the Vision section crosses to the browser. The other
  // seven live server-side until /api/unlock spends a credit.
  const visionSection: NarrativeSection | null =
    !isPaid && narrative ? narrative.vision ?? null : null

  // Attachments: fetch rows, then batch-sign the storage paths. Signed URLs
  // are cheap; even with several attachments this is one round-trip.
  const attachments: CaseStudyAttachment[] = []
  const { data: attachmentRows } = await admin
    .from('case_study_attachments')
    .select('id, storage_path')
    .eq('case_study_id', id)
    .order('order_index', { ascending: true })

  if (attachmentRows && attachmentRows.length > 0) {
    const paths = attachmentRows.map((r) => r.storage_path)
    const { data: signed } = await admin.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)

    // createSignedUrls returns results in the same order as the paths given.
    // Zip back onto attachment rows so id → url stays aligned even if a
    // single row failed to sign (we skip nulls).
    for (let i = 0; i < attachmentRows.length; i++) {
      const row = attachmentRows[i]
      const s = signed?.[i]
      if (!s || !s.signedUrl) continue
      attachments.push({
        id: row.id,
        url: s.signedUrl,
        caption: meta?.image_captions?.[row.id] ?? null,
      })
    }
  }

  return (
    <CaseStudyView
      caseStudyId={cs.id}
      title={cs.title ?? 'Untitled case study'}
      headline={cs.headline ?? null}
      meta={meta}
      clientType={cs.client_type ?? null}
      projectType={(cs.project_type ?? null) as ProjectType | null}
      tone={(cs.tone ?? null) as Tone | null}
      createdAtISO={cs.created_at}
      isPaid={isPaid}
      isOwner={isOwner}
      narrative={isPaid ? narrative : null}
      visionSection={visionSection}
      attachments={attachments}
      welcome={welcome === '1'}
      login={login === '1'}
      purchased={purchased === '1'}
      ownerBalance={ownerBalance}
    />
  )
}
