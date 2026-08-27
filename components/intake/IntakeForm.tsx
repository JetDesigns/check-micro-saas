'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createCaseStudy, uploadAttachments } from '@/lib/case-studies'
import {
  DEFAULT_PROJECT_TYPE,
  DEFAULT_TONE,
  type TextKey,
} from '@/lib/intake-fields'
import {
  WIZARD_COPY,
  buildIntake,
  buildReview,
  compileBlockers,
  emptyWizardState,
  nextStep,
  prevStep,
  stepMeta,
  type StepId,
} from '@/lib/wizard-steps'
import type {
  Decision,
  OutcomeStatus,
  ProjectType,
  Tone,
} from '@/types/database'
import type { Attachment } from '@/components/wizard/AttachmentStep'
import { StepIndicator } from '@/components/intake/StepIndicator'
import { Step1Setup } from '@/components/intake/steps/Step1Setup'
import { Step2Problem } from '@/components/intake/steps/Step2Problem'
import { Step3Decisions } from '@/components/intake/steps/Step3Decisions'
import { Step4Screens, type ScreenNote } from '@/components/intake/steps/Step4Screens'
import { Step5Outcome } from '@/components/intake/steps/Step5Outcome'
import { ReviewScreen } from '@/components/intake/steps/ReviewScreen'

type Props = {
  /**
   * Called once the case study exists and attachments are uploaded, and
   * awaited — the compile it kicks off runs for a minute or more, and the
   * form stays busy for all of it. If it throws, the form comes back with
   * every answer still in place so the user can try again.
   */
  onCreated: (caseStudyId: string) => void | Promise<void>
}

// Five steps and a review screen. All state lives here and the step
// components are presentational, which is why going back never loses an
// answer: nothing is stored inside the step that renders it.
//
// Nothing blocks "next". Empty answers are allowed all the way through to
// submit — the review screen points at what is thin, and that is the only
// pressure the wizard applies. See check-revision-prompt.md § Phase 2.
export function IntakeForm({ onCreated }: Props) {
  const [step, setStep] = useState<StepId>(1)
  const [text, setText] = useState<Partial<Record<TextKey, string>>>({})
  // Lazy, so the two starting decision blocks get their ids once rather than
  // on every render.
  const [decisions, setDecisions] = useState<Decision[]>(
    () => emptyWizardState().decisions
  )
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [imageNotes, setImageNotes] = useState<Record<string, ScreenNote>>({})
  const [projectType, setProjectType] = useState<ProjectType>(DEFAULT_PROJECT_TYPE)
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE)
  const [outcome, setOutcome] = useState<OutcomeStatus | null>(null)

  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const hasImages = attachments.length > 0
  const meta = stepMeta(step)

  const state = {
    text,
    decisions,
    attachmentIds: attachments.map((a) => a.id),
    imageNotes,
    outcome,
  }

  const setTextValue = (key: TextKey, value: string) =>
    setText((prev) => ({ ...prev, [key]: value }))

  const setNote = (id: string, patch: Partial<ScreenNote>) =>
    setImageNotes((prev) => {
      const current = prev[id] ?? { shows: '', notice: '' }
      return { ...prev, [id]: { ...current, ...patch } }
    })

  // Scrolls the form itself rather than the window. On lg the wizard sits
  // inside an overflow-y-auto column, so window.scrollTo — what this used to
  // do — moved nothing at all on desktop.
  const goTo = useCallback((target: StepId) => {
    setStep(target)
    formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  // Jumping out of the review screen has to wait for the target step to
  // mount before the element it wants exists. An effect is the right wait:
  // requestAnimationFrame also works in a real browser, but it never runs at
  // all in a hidden tab — including the preview pane this gets verified in,
  // where the focus silently did nothing and looked correct in the DOM.
  const pendingFocus = useRef<string | null>(null)
  const [focusTick, setFocusTick] = useState(0)

  useEffect(() => {
    const anchor = pendingFocus.current
    if (!anchor) return
    pendingFocus.current = null

    const el = document.getElementById(anchor)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    if (el instanceof HTMLElement) el.focus({ preventScroll: true })
  }, [focusTick])

  const jumpTo = useCallback((target: StepId, anchor: string) => {
    pendingFocus.current = anchor
    setStep(target)
    setFocusTick((t) => t + 1)
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // WIZARD DELIBERATELY UNGATED. Writing a case study used to stop here
    // when EARLY_ACCESS_MODE was on. It no longer does: that flag now means
    // "we are not selling yet", which is a different question from "may this
    // person generate". Compiling spends our own Anthropic credit, not the
    // visitor's money, so it is safe to leave open while nothing is deployed.
    //
    // BEFORE DEPLOYING, decide whether to re-gate. Anonymous auth means every
    // visitor is a user, and rate_limit_compile allows each of them 10
    // compiles a day — that is the only remaining backstop on a public URL.
    //
    // The guard below closes implicit submission: one form wraps every step,
    // and a form with exactly one text input submits on Enter. Several steps
    // here have exactly one.
    if (step !== 'review') return
    if (isBusy) return
    // Nothing that cannot produce a legal document is allowed to spend a
    // vision pass and three opus calls arriving at that conclusion.
    if (compileBlockers(buildIntake(state)).length > 0) return

    setIsBusy(true)
    setError(null)
    try {
      const id = await createCaseStudy({
        intake: buildIntake(state),
        projectType,
        tone,
      })
      if (attachments.length > 0) {
        await uploadAttachments({
          caseStudyId: id,
          files: attachments.map((a) => a.file),
        })
      }
      await onCreated(id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
      setIsBusy(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-white/70 bg-surface/95 p-6 shadow-[0_1px_2px_rgba(23,23,23,0.05),0_12px_32px_-8px_rgba(23,23,23,0.16),0_32px_80px_-20px_rgba(74,59,41,0.24)] backdrop-blur-sm sm:p-8"
    >
      <StepIndicator current={step} hasImages={hasImages} />

      <h2 className="mt-3 text-xl font-medium leading-snug text-ink sm:text-2xl">
        {meta.heading}
      </h2>
      {meta.subhead && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {meta.subhead}
        </p>
      )}

      <div className="mt-6">
        {step === 1 && (
          <Step1Setup
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            projectType={projectType}
            onProjectTypeChange={setProjectType}
            tone={tone}
            onToneChange={setTone}
            text={text}
            onTextChange={setTextValue}
            isBusy={isBusy}
          />
        )}
        {step === 2 && (
          <Step2Problem
            text={text}
            onTextChange={setTextValue}
            isBusy={isBusy}
          />
        )}
        {step === 3 && (
          <Step3Decisions
            decisions={decisions}
            onChange={setDecisions}
            isBusy={isBusy}
          />
        )}
        {step === 4 && (
          <Step4Screens
            attachments={attachments}
            decisions={decisions}
            notes={imageNotes}
            onNoteChange={setNote}
            isBusy={isBusy}
          />
        )}
        {step === 5 && (
          <Step5Outcome
            outcome={outcome}
            onOutcomeChange={setOutcome}
            text={text}
            onTextChange={setTextValue}
            isBusy={isBusy}
          />
        )}
        {step === 'review' && (
          <ReviewScreen
            sections={buildReview(
              buildIntake(state),
              attachments.map((a) => a.id)
            )}
            blockers={compileBlockers(buildIntake(state))}
            onJump={jumpTo}
          />
        )}
      </div>

      <footer className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step === 1 ? (
          <p className="text-xs text-ink-muted sm:max-w-[60%]">
            Free to write. You only pay to unlock the full result.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => goTo(prevStep(step, hasImages))}
            disabled={isBusy}
            className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40 sm:self-center"
          >
            ← Back
          </button>
        )}

        {/* Both branches are type="button", and the keys keep them as two
            separate DOM nodes.

            A type="submit" here fired a real submit the moment the user
            arrived at the review screen, without anyone pressing it. React
            reuses one DOM node for both branches and patches the attribute in
            place; the patch lands during the click that advances the step,
            and the browser then reads the button's *current* type to pick its
            default action — by which point it says submit. The step guard in
            handleSubmit cannot catch that, because the step really is
            'review' by then. Writing is an explicit onClick instead. */}
        {step === 'review' ? (
          <button
            key="write"
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isBusy || compileBlockers(buildIntake(state)).length > 0}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink sm:px-7"
          >
            {isBusy
              ? hasImages
                ? 'Uploading…'
                : 'Working…'
              : WIZARD_COPY.reviewWrite}
          </button>
        ) : (
          <button
            key="next"
            type="button"
            onClick={() => goTo(nextStep(step, hasImages))}
            disabled={isBusy}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink sm:px-7"
          >
            Next
          </button>
        )}
      </footer>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200/60 bg-red-50/60 px-3 py-2 text-xs text-red-800"
        >
          {error}
        </p>
      )}
    </form>
  )
}
