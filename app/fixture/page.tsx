import { notFound } from 'next/navigation'
import { CaseStudyDocument } from '@/components/case-study/CaseStudyDocument'
import { CASE_STUDY_FIXTURE, FIXTURE_TITLE } from '@/lib/fixtures/case-study-fixture'
import { validateCaseStudy, type CaseStudy } from '@/lib/case-study-blocks'
import { createAdminClient } from '@/lib/supabase/admin'

// Renders the hand-written fixture so the layout can be judged before any
// agent exists — the revision spec puts this second in the build order because
// a page proven on content we control tells us whether the output is good
// enough before a single token is spent.
//
// With `?id=` it renders a REAL compiled document instead. That is the only
// way to look at what the pipeline actually produced: the paid read route is
// Phase 6, and a document nobody can see has only been verified as far as
// "the validator liked it".
//
// Dev only, both modes. It reads through the service role and applies no
// paywall whatsoever, which is exactly why it must never exist in production.
export default async function FixturePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { id } = await searchParams
  if (!id) {
    return (
      <main className="min-h-screen bg-canvas">
        <CaseStudyDocument doc={CASE_STUDY_FIXTURE} title={FIXTURE_TITLE} />
      </main>
    )
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('case_studies')
    .select('document, headline, title')
    .eq('id', id)
    .maybeSingle()

  if (!data?.document) notFound()

  const doc = data.document as CaseStudy
  const issues = validateCaseStudy(doc)

  const { data: attachments } = await admin
    .from('case_study_attachments')
    .select('id, storage_path')
    .eq('case_study_id', id)

  // Signed URLs because the bucket is private. An hour is plenty for looking
  // at a page in development. A plain object, not a Map or a resolver
  // function: this crosses into a Client Component, and React accepts neither.
  const imageUrls: Record<string, string> = {}
  for (const a of attachments ?? []) {
    const { data: signed } = await admin.storage
      .from('case-attachments')
      .createSignedUrl(a.storage_path, 3600)
    if (signed?.signedUrl) imageUrls[a.id] = signed.signedUrl
  }

  return (
    <main className="min-h-screen bg-canvas">
      {issues.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 pt-8">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            Stored document fails validation: {issues.map((i) => i.rule).join(', ')}.
            The pipeline should never have written this.
          </p>
        </div>
      )}
      <CaseStudyDocument
        doc={doc}
        title={data.headline ?? data.title ?? 'Untitled'}
        imageUrls={imageUrls}
      />
    </main>
  )
}
