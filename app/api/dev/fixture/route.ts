// POST /api/dev/fixture
//
// Runs a fixture through generation with no browser and no form. This is what
// `npm run fixture` calls, and it exists because the alternative — typing the
// hospital-handover project into the wizard to find out whether generation works —
// is exactly the loop it was built to end.
//
// DEV ONLY, and it answers 404 in production rather than 403: it inserts rows and
// spends model credit with no login, so in production it should not appear to
// exist.
//
// Two modes:
//
//   persist (default)  inserts a case_studies row for a dedicated dev user, runs
//                      the pipeline against it, writes `generated`. Exercises the
//                      same path a real submission takes, database included.
//   dry                runs the pipeline with no row at all and writes the result to
//                      .dev/generated/<fixture>.json. Needs no database, so it can
//                      prove the model half when the database half is in doubt.
//
// Both return a URL under /studio/read/ that renders what came out.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isStructuringAlias, type StructuringAlias } from '@/lib/agents/client'
import { GenerationFailed, runFocusedFixPipeline } from '@/lib/agents/focused-fix-pipeline'
import { fixtureIntake, getFixture, isFixtureName } from '@/lib/fixtures/focused-fix-intake'
import { pageTitle } from '@/lib/markdown-lite'
import { createAdminClient } from '@/lib/supabase/admin'
import { blankInputs } from '@/lib/wizard-steps'

export const runtime = 'nodejs'
export const maxDuration = 300

// A real address on a reserved domain: nothing is ever sent to it (the account is
// created already confirmed), and it can never belong to a person.
const DEV_EMAIL = 'dev-fixture@example.com'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as {
    fixture?: unknown
    dry?: unknown
    model?: unknown
    blank?: unknown
  }

  const name = body.fixture ?? 'handover'
  if (!isFixtureName(name)) {
    return Response.json({ error: 'unknown_fixture', message: `No fixture called "${String(name)}".` }, { status: 400 })
  }
  const model: StructuringAlias | undefined = isStructuringAlias(body.model) ? body.model : undefined
  const blank = Array.isArray(body.blank) ? body.blank.filter((x): x is string => typeof x === 'string') : []
  const dry = body.dry === true

  const intake = blank.length > 0 ? blankInputs(fixtureIntake(name), blank) : fixtureIntake(name)
  const fixture = getFixture(name)

  try {
    if (dry) {
      const result = await runFocusedFixPipeline({ caseStudyId: null, intake, images: [], model, blanked: blank })

      const dir = join(process.cwd(), '.dev', 'generated')
      await mkdir(dir, { recursive: true })
      await writeFile(join(dir, `${name}.json`), JSON.stringify(result.page, null, 2))

      return Response.json({
        ok: true,
        mode: 'dry',
        fixture: name,
        url: `/studio/read/local-${name}`,
        attempts: result.attempts,
        page: result.page,
      })
    }

    const admin = createAdminClient()
    const userId = await devUserId(admin)

    // The same columns the browser's createCaseStudy writes. `tone` is stored and
    // never sent to the model.
    const { data: row, error: insertError } = await admin
      .from('case_studies')
      .insert({
        user_id: userId,
        title: intake.title,
        client_type: intake.client_type,
        project_type: fixture.projectType,
        tone: fixture.tone,
        intake,
      })
      .select('id')
      .single()
    if (insertError || !row) throw insertError ?? new Error('insert returned no row')

    const result = await runFocusedFixPipeline({
      caseStudyId: row.id,
      intake,
      images: [],
      model,
      blanked: blank,
    })

    const { error: writeError } = await admin
      .from('case_studies')
      .update({
        generated: result.page,
        headline: pageTitle(result.page.markdown) ?? intake.title ?? null,
        status: 'preview',
      })
      .eq('id', row.id)
    if (writeError) throw writeError

    return Response.json({
      ok: true,
      mode: 'persist',
      fixture: name,
      id: row.id,
      url: `/studio/read/${row.id}`,
      attempts: result.attempts,
      page: result.page,
    })
  } catch (err) {
    console.error('[/api/dev/fixture] failed:', err)
    if (err instanceof GenerationFailed) {
      return Response.json(
        {
          ok: false,
          error: 'generation_failed',
          message: err.message,
          attempts: err.attempts,
          issues: err.issues,
          lastReply: err.lastReply.slice(0, 6000),
        },
        { status: 502 }
      )
    }
    return Response.json(
      {
        ok: false,
        error: 'failed',
        // The real message, not a translation of it: this route is for the person
        // who needs to know what broke.
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

/** The one user every fixture row belongs to, created on first use. */
async function devUserId(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listError) throw listError
  const existing = list.users.find((u) => u.email === DEV_EMAIL)
  if (existing) return existing.id

  const { data: created, error } = await admin.auth.admin.createUser({
    email: DEV_EMAIL,
    email_confirm: true,
  })
  if (error || !created.user) throw error ?? new Error('could not create the dev user')
  return created.user.id
}
