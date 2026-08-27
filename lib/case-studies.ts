// Browser-side CRUD helpers for the intake → preview → unlock flow. All calls
// run under an authenticated (usually anonymous) session — RLS in Supabase
// enforces that a user can only touch their own rows and storage objects.
//
// Errors are thrown, not caught. Callers decide how to surface them.

import { createClient } from '@/lib/supabase/client'
import { ensureAnonymousSession } from '@/lib/supabase/anon'
import type {
  CaseStudyStatus,
  Intake,
  ProjectType,
  Tone,
} from '@/types/database'

const ATTACHMENT_BUCKET = 'case-attachments'

/**
 * Sign in anonymously if needed, then create a case_study carrying the whole
 * intake form. The form submits in one shot, so there is no per-field save.
 */
export async function createCaseStudy(params: {
  intake: Intake
  projectType: ProjectType
  tone: Tone
}): Promise<string> {
  const user = await ensureAnonymousSession()
  if (!user) throw new Error('Failed to obtain a Supabase session.')

  const supabase = createClient()
  const { data, error } = await supabase
    .from('case_studies')
    .insert({
      user_id: user.id,
      title: params.intake.title,
      client_type: params.intake.client_type,
      project_type: params.projectType,
      tone: params.tone,
      intake: params.intake,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/**
 * Upload files to the case-attachments bucket and register one row per file.
 * Uploaded sequentially so order_index matches the caller-supplied order.
 *
 * Object key convention: {caseStudyId}/{orderIndex}-{sanitizedFilename},
 * matching the storage.foldername(name)[1] check in the bucket RLS policy.
 */
export async function uploadAttachments(params: {
  caseStudyId: string
  files: File[]
}): Promise<void> {
  const { caseStudyId, files } = params
  if (files.length === 0) return

  const supabase = createClient()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const path = `${caseStudyId}/${i}-${sanitizeFilename(file.name)}`

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { error: insertError } = await supabase
      .from('case_study_attachments')
      .insert({
        case_study_id: caseStudyId,
        storage_path: path,
        order_index: i,
        mime_type: file.type,
        size_bytes: file.size,
      })

    if (insertError) {
      // Roll back the upload so we don't leak orphan objects.
      await supabase.storage.from(ATTACHMENT_BUCKET).remove([path])
      throw insertError
    }
  }
}

/**
 * Read case study status. Document content never travels through the browser
 * client: `compiled_narrative`'s column-level SELECT grant was revoked from
 * `authenticated` in migration 0005, and the block document that replaces it
 * will read the same way — through a server route that decides preview vs paid
 * (Phase 5/6 of check-revision-prompt.md). Use this helper for status polling
 * only.
 */
export async function getCaseStudy(
  caseStudyId: string
): Promise<{ status: CaseStudyStatus } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('case_studies')
    .select('status')
    .eq('id', caseStudyId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { status: data.status }
}

/** Current credit balance for the signed-in user. Zero if no session yet. */
export async function getCreditBalance(): Promise<number> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data?.credit_balance ?? 0
}

// ---------------------------------------------------------------------------

// Keep only characters that survive URL paths cleanly and avoid colliding with
// our path separator. Cap length so pathological filenames don't blow up the
// object key.
function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
  return cleaned.length > 0 ? cleaned : 'file'
}
