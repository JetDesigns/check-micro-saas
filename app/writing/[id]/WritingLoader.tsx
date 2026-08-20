'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Full-page loader for the Anthropic compile, which a real run measured at
// about 150 seconds. Two things run in parallel:
//   1. A cosmetic phase animation (label + progress bar + rotating copy)
//      spread across the measured duration. This is UX theatre — the real
//      compile is a single API call — but it makes the wait feel deliberate
//      and gives the user something to read. The phase pacing is derived from
//      COMPILE_MS: when the animation was sized for 20s the bar reached 92%
//      and then sat there for two full minutes, which reads as broken.
//   2. The actual POST /api/compile fetch. When it resolves, we skip the
//      remaining phases, snap the progress bar to 100%, and push to /c/[id].
//
// On error we show a small state with Try again + Back to form buttons.

type Props = {
  caseStudyId: string
}

type Phase = {
  label: string
  copy: string
}

const PHASES: readonly Phase[] = [
  {
    label: 'Reading your intake',
    copy: 'Prospects skim before they read — the opening line has to earn the next thirty seconds.',
  },
  {
    label: 'Framing the situation',
    copy: "We put your client's problem in their language, not designer jargon.",
  },
  {
    label: 'Working out the cost',
    copy: 'Every problem left alone costs the client something — this is where we name it.',
  },
  {
    label: 'Drafting the decision',
    copy: 'Why this route, and what got rejected, matters more than what got built.',
  },
  {
    label: 'Writing the work',
    copy: 'Plain language a prospect can act on — not a process breakdown for reviewers.',
  },
  {
    label: 'Landing the results',
    copy: 'Numbers verbatim from you. Never invented. Never padded.',
  },
  {
    label: 'Sharpening the CTA',
    copy: 'The last line should filter the wrong prospects out and invite the right one in.',
  },
  {
    label: 'Polishing',
    copy: 'Almost there.',
  },
] as const

// Measured end-to-end on a real compile (server log: 2.5min). The animation
// is paced off this rather than the other way round.
const COMPILE_MS = 150_000
const PHASE_MS = Math.round(COMPILE_MS / PHASES.length) // ~19s per phase
const EXPECTED_MS = COMPILE_MS

// How often to re-check the row when another request already owns the compile.
const POLL_MS = 3000

type Status = 'loading' | 'redirecting' | 'error'

export function WritingLoader({ caseStudyId }: Props) {
  const router = useRouter()
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // No dev-mode guard: React strict-mode's double-effect fires /api/compile
  // twice. That used to mean two Anthropic calls — this comment previously
  // claimed the second one found status='preview' and returned early, which
  // is only true once the first compile has FINISHED. For the ~150s it is
  // running the row is still 'draft', so both calls went through and the
  // second overwrote the first. The route now claims the compile atomically
  // and answers 202 to the loser, which is what `in_progress` below handles.
  // Guarding here with a ref caused the first mount's cleanup to tear down
  // timers that never got recreated.
  useEffect(() => {
    // Kick off the cosmetic phase cycle.
    const phaseTimer = window.setInterval(() => {
      setPhaseIdx((p) => (p < PHASES.length - 1 ? p + 1 : p))
    }, PHASE_MS)

    // Drive the progress bar via requestAnimationFrame so the fill is smooth.
    const startTime = performance.now()
    let rafId = 0
    const tick = () => {
      const elapsed = performance.now() - startTime
      // Cap at 92% while the fetch is still in flight — we jump to 100% on
      // success. If the fetch takes longer than EXPECTED_MS, holding at 92
      // feels honest (still working) instead of stuck at a random number.
      const pct = Math.min(92, (elapsed / EXPECTED_MS) * 92)
      setProgress(pct)
      if (status === 'loading') rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    // Fire the real compile.
    const controller = new AbortController()
    fetch('/api/compile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseStudyId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          status?: string
          error?: string
          message?: string
        }

        // 202: another request already owns this compile — a refresh, or
        // strict-mode's second effect. Nothing is wrong and nothing needs
        // starting; wait for the row the other call is going to write. This
        // is what makes refreshing mid-compile safe instead of destructive.
        if (res.status === 202 || body.status === 'in_progress') {
          await waitForCompile(caseStudyId, controller.signal)
        } else if (!res.ok || !body.ok) {
          throw new Error(
            body.message || body.error || `Compile failed (HTTP ${res.status})`
          )
        }

        // Success — snap phase to the last one, snap progress to 100%, then
        // hand off to the shareable page.
        setPhaseIdx(PHASES.length - 1)
        setProgress(100)
        setStatus('redirecting')
        // Small delay so the 100% state is perceptible before the route change.
        window.setTimeout(() => {
          router.push(`/c/${caseStudyId}`)
        }, 500)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setStatus('error')
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Something went wrong while writing your case study.'
        )
      })

    return () => {
      window.clearInterval(phaseTimer)
      cancelAnimationFrame(rafId)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseStudyId])

  const phase = PHASES[phaseIdx]

  return (
    <div className="min-h-screen bg-gradient-to-b from-canvas via-surface to-canvas">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-[family-name:var(--font-serif)] text-2xl font-medium text-ink">
          Check<span className="text-accent">.</span>
        </p>

        {status === 'error' ? (
          <div className="mt-12 w-full">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-700">
              Compile failed
            </p>
            <h1 className="mt-3 text-2xl font-medium leading-snug text-ink">
              Something interrupted the write.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {errorMessage}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                Back to form
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1
              className="mt-12 text-2xl font-medium leading-snug text-ink sm:text-3xl"
              aria-live="polite"
            >
              {phase.label}
            </h1>

            <div
              className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-ink/8"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Writing progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent via-accent to-accent/70 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
              Step {phaseIdx + 1} of {PHASES.length}
            </p>

            <p className="mt-8 text-sm leading-relaxed text-ink-soft">
              {phase.copy}
            </p>
          </>
        )}
      </div>
    </div>
  )
}


// Waits for whoever owns the compile to finish it.
//
// Reads `status` through the browser client, so RLS applies and this can only
// ever see the caller's own row. compiled_narrative stays unreadable here —
// migration 0005 revoked that column from `authenticated`, and the paywall
// depends on it staying that way. Status alone is all we need: once it leaves
// 'draft' the narrative has been written.
async function waitForCompile(caseStudyId: string, signal: AbortSignal) {
  const supabase = createClient()
  // Generous: the compile itself is ~150s and the server allows up to 300s.
  const deadline = Date.now() + 320_000

  while (Date.now() < deadline) {
    if (signal.aborted) return

    const { data, error } = await supabase
      .from('case_studies')
      .select('status')
      .eq('id', caseStudyId)
      .single()

    if (error) throw new Error(error.message)
    if (data && data.status !== 'draft') return

    await new Promise((resolve) => window.setTimeout(resolve, POLL_MS))
  }

  throw new Error(
    'This case study is taking longer than expected. Refresh to check on it.'
  )
}
