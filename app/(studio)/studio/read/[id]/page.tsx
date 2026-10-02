import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { notFound } from 'next/navigation'
import { GeneratedPageView } from '@/components/studio/GeneratedPageView'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GeneratedPage } from '@/types/database'

// The generated page, read back.
//
// The dev guard is the studio layout's, so it covers this route without being
// repeated here. It reads through the service role and applies no paywall
// whatsoever, which is the reason it must never exist in production — the same
// reason /fixture is dev-only.
//
// Two kinds of id:
//   - a uuid, read from case_studies.generated;
//   - "local-<fixture>", read from .dev/generated/<fixture>.json, which is where a
//     dry run writes. A dry run has no database row, and being able to read the
//     page it produced is the point of doing one.

const LOCAL = /^local-([a-z0-9-]+)$/

type Loaded = { page: GeneratedPage; title: string; imageUrls: Record<string, string> }

async function load(id: string): Promise<Loaded | null> {
  const local = LOCAL.exec(id)
  if (local) {
    try {
      const file = join(process.cwd(), '.dev', 'generated', `${local[1]}.json`)
      const page = JSON.parse(await readFile(file, 'utf8')) as GeneratedPage
      return { page, title: `${local[1]} (dry run)`, imageUrls: {} }
    } catch {
      return null
    }
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('case_studies')
    .select('generated, headline, title')
    .eq('id', id)
    .maybeSingle()
  if (!data?.generated) return null

  const { data: attachments } = await admin
    .from('case_study_attachments')
    .select('id, storage_path')
    .eq('case_study_id', id)

  // Signed URLs because the bucket is private. A plain object, not a Map or a
  // resolver function: it may cross into a Client Component, and React accepts
  // neither.
  const imageUrls: Record<string, string> = {}
  for (const a of attachments ?? []) {
    const { data: signed } = await admin.storage
      .from('case-attachments')
      .createSignedUrl(a.storage_path, 3600)
    if (signed?.signedUrl) imageUrls[a.id] = signed.signedUrl
  }

  return {
    page: data.generated,
    title: data.headline ?? data.title ?? 'Untitled',
    imageUrls,
  }
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ raw?: string }>
}) {
  const { id } = await params
  const { raw } = await searchParams

  const loaded = await load(id)
  if (!loaded) notFound()
  const { page, imageUrls } = loaded
  const meta = page.meta

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between text-[12px] text-[var(--studio-text-soft)]">
        <a href="/studio" className="underline-offset-4 hover:text-[var(--studio-text)] hover:underline">
          ← Back to the wizard
        </a>
        <a
          href={raw ? `?` : `?raw=1`}
          className="underline-offset-4 hover:text-[var(--studio-text)] hover:underline"
        >
          {raw ? 'Show the page' : 'Show the raw markdown'}
        </a>
      </div>

      {raw ? (
        <pre className="overflow-x-auto rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[12px] leading-relaxed whitespace-pre-wrap">
          {page.markdown}
        </pre>
      ) : (
        <GeneratedPageView page={page} imageUrls={imageUrls} />
      )}

      {/* What made this page, and what the code checks still had to say. Kept on
          the page because ablation compares pages, and a comparison only reads if
          each one says which model wrote it and what was left flagged. */}
      <details className="rounded-[var(--studio-r-md)] bg-[var(--studio-bg-secondary)] p-4 text-[12px] leading-relaxed">
        <summary className="cursor-pointer text-[var(--studio-text-soft)]">How this page was made</summary>
        <div className="mt-3 flex flex-col gap-3">
          {meta && (
            <p>
              {meta.model} · {meta.attempts} attempt{meta.attempts === 1 ? '' : 's'} ·{' '}
              {(meta.durationMs / 1000).toFixed(1)}s · {meta.inputTokens} in · {meta.outputTokens} out ·{' '}
              {meta.cacheReadTokens} cache-read
              {meta.blanked.length > 0 && <> · blanked: {meta.blanked.join(', ')}</>}
            </p>
          )}
          <p>Branch: {page.branch}</p>

          {meta && meta.warnings.length > 0 && (
            <div>
              <p className="font-medium">Warnings</p>
              <ul className="list-disc pl-5">
                {meta.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {page.needs_confirmation && page.needs_confirmation.length > 0 && (
            <div>
              <p className="font-medium">Flagged by the writer for confirmation</p>
              <ul className="list-disc pl-5">
                {page.needs_confirmation.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="font-medium">Variance register</p>
            <table className="mt-1 w-full text-left">
              <tbody>
                {page.variance_register.map((r) => (
                  <tr key={r.choice} className="align-top">
                    <td className="py-1 pr-3 text-[var(--studio-text-soft)]">{r.choice}</td>
                    <td className="py-1 pr-3 font-medium">{r.value}</td>
                    <td className="py-1">{r.driver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  )
}
