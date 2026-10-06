'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createCaseStudy, uploadAttachments } from '@/lib/case-studies'
import {
  clearDraft,
  deleteFile,
  loadFile,
  readDraft,
  saveFile,
  writeDraft,
} from '@/lib/draft-storage'
import { getFixture, isFixtureName } from '@/lib/fixtures/focused-fix-intake'
import {
  describeSubmitFailure,
  logSubmitFailure,
  type SubmitStage,
} from '@/lib/submit-failure'
import {
  DEFAULT_PROJECT_TYPE,
  DEFAULT_TONE,
  type TextKey,
  type ToggleKey,
  type WorkShape,
} from '@/lib/intake-fields'
import {
  WIZARD_COPY,
  buildIntake,
  buildReview,
  compileBlockers,
  reviewNotes,
  emptyWizardState,
  nextStep,
  prevStep,
  stepMeta,
  stepPosition,
  type Attachment,
  type StepId,
  type WizardState,
} from '@/lib/wizard-steps'
import {
  draftHasAnswers,
  fingerprintOf,
  toDraft,
  type Draft,
  type SavedRow,
} from '@/lib/wizard-draft'
import type {
  Collaborator,
  Decision,
  OutcomeStatus,
  ProjectType,
  Provenance,
  SectionFate,
  Tone,
} from '@/types/database'
import { BackButton, Button } from '@/components/studio/Button'
import { StepShell } from '@/components/studio/StepShell'
import { Step1Project } from '@/components/studio/steps/Step1Project'
import { Step2Problem } from '@/components/studio/steps/Step2Problem'
import { Step3Decisions } from '@/components/studio/steps/Step3Decisions'
import { Step4Structure } from '@/components/studio/steps/Step4Structure'
import { Step5Outcome } from '@/components/studio/steps/Step5Outcome'
import { Review } from '@/components/studio/steps/Review'

// Named in the console line so a dead project host is one glance away rather
// than three questions. It is a NEXT_PUBLIC_ value — already in the client
// bundle — so this exposes nothing that was not already there.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// How long typing has to pause before the draft is written. Short enough that a
// reload loses almost nothing, long enough not to serialise on every keystroke.
// The pagehide handler below covers the gap.
const SAVE_DELAY_MS = 250

// Five steps and a review screen. All state lives here and the step components
// are presentational, which is why going back never loses an answer: nothing is
// stored inside the step that renders it.
//
// It ALSO lives in storage now (see lib/wizard-draft.ts), which is the other half
// of "never loses an answer". Component state survives a step change and a failed
// request; it does not survive a reload, a dev-server restart, or the form
// component being remounted by a hot reload. Until drafts existed, every one of
// those threw a filled-in form away.
//
// Nothing blocks "next". Empty answers are allowed all the way through to submit
// — the review screen points at what is thin, and that is the only pressure the
// wizard applies.
export function StudioForm() {
  const [step, setStep] = useState<StepId>(1)
  const [text, setText] = useState<Partial<Record<TextKey, string>>>({})
  const [toggles, setToggles] = useState<Partial<Record<ToggleKey, boolean>>>({})
  // Lazy, so the two starting decision cards get their ids once rather than on
  // every render.
  const [decisions, setDecisions] = useState<Decision[]>(() => emptyWizardState().decisions)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [projectType, setProjectType] = useState<ProjectType>(DEFAULT_PROJECT_TYPE)
  // Held beside projectType rather than inside the wizard state, because it is
  // not part of the intake — see the note above WizardState in lib/wizard-steps.ts.
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE)
  const [provenance, setProvenance] = useState<Provenance | null>(null)
  const [outcome, setOutcome] = useState<OutcomeStatus | null>(null)
  const [areasWorked, setAreasWorked] = useState<string[]>([])
  const [areasFromScratch, setAreasFromScratch] = useState<string[]>([])
  const [shape, setShape] = useState<WorkShape | null>(null)
  const [sectionFates, setSectionFates] = useState<Record<string, SectionFate>>({})
  const [stepsRemoved, setStepsRemoved] = useState<string[]>([])
  const [saved, setSaved] = useState<SavedRow | null>(null)

  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  // False until the stored draft has been read. Nothing is written, and nothing
  // is rendered, before then: writing first would overwrite the draft with the
  // empty defaults it was about to be restored over.
  const [hydrated, setHydrated] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)

  const state: WizardState = {
    text,
    toggles,
    decisions,
    collaborators,
    provenance,
    outcome,
    areasWorked,
    areasFromScratch,
    shape,
    sectionFates,
    stepsRemoved,
    attachments,
  }

  // ---------------------------------------------------------------------------
  // Drafts
  // ---------------------------------------------------------------------------

  // Which attachment ids are already in IndexedDB, so a change only writes or
  // deletes the difference rather than re-storing twelve images per keystroke.
  const storedFiles = useRef(new Set<string>())

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const params = new URLSearchParams(window.location.search)
      const fixtureName = params.get('fixture')

      // A fixture REPLACES the draft. It is how the same project is loaded again
      // to test the same thing, so it has to win over whatever was typed last.
      if (fixtureName !== null) {
        if (isFixtureName(fixtureName)) {
          const f = getFixture(fixtureName)
          const requested = params.get('step')
          const target: StepId =
            requested === 'review'
              ? 'review'
              : ['1', '2', '3', '4', '5'].includes(requested ?? '')
                ? (Number(requested) as StepId)
                : 'review'

          // Drop stored files first, then say so; nothing here can fail loudly.
          clearDraft()
          if (cancelled) return
          storedFiles.current.clear()

          setStep(target)
          setText(f.state.text)
          setToggles(f.state.toggles)
          setDecisions(f.state.decisions)
          setCollaborators(f.state.collaborators)
          setProvenance(f.state.provenance)
          setOutcome(f.state.outcome)
          setAreasWorked(f.state.areasWorked)
          setAreasFromScratch(f.state.areasFromScratch)
          setShape(f.state.shape)
          setSectionFates(f.state.sectionFates)
          setStepsRemoved(f.state.stepsRemoved)
          setAttachments([])
          setProjectType(f.projectType)
          setTone(f.tone)
          setSaved(null)
          setHydrated(true)

          // Out of the URL, so a reload afterwards restores the draft — which is
          // now the fixture plus whatever was changed — instead of resetting it.
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
        console.warn(`[studio] unknown fixture "${fixtureName}" — opening the saved draft instead`)
      }

      const draft = readDraft()
      let files: (File | null)[] = []
      if (draft) files = await Promise.all(draft.attachments.map((a) => loadFile(a.id)))
      if (cancelled) return

      if (draft) {
        const restored: Attachment[] = []
        draft.attachments.forEach((a, i) => {
          const file = files[i]
          // Bytes evicted from IndexedDB (storage pressure, "clear site data"):
          // the note is useless without its picture, and a placeholder file
          // would upload as a corrupt image. Say so rather than fake it.
          if (!file) {
            console.warn(`[studio] screen "${a.name}" could not be restored and was dropped`)
            return
          }
          restored.push({
            id: a.id,
            file,
            slot: a.slot,
            ...(a.decisionId ? { decisionId: a.decisionId } : {}),
            notice: a.notice,
          })
        })

        setStep(draft.step)
        setText(draft.text)
        setToggles(draft.toggles)
        setDecisions(draft.decisions.length > 0 ? draft.decisions : emptyWizardState().decisions)
        setCollaborators(draft.collaborators)
        setProvenance(draft.provenance)
        setOutcome(draft.outcome)
        setAreasWorked(draft.areasWorked)
        setAreasFromScratch(draft.areasFromScratch)
        setShape(draft.shape)
        setSectionFates(draft.sectionFates)
        setStepsRemoved(draft.stepsRemoved)
        setProjectType(draft.projectType)
        setTone(draft.tone)
        setAttachments(restored)
        setSaved(draft.saved)
        storedFiles.current = new Set(restored.map((a) => a.id))
      }
      setHydrated(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // The draft as it stands now, kept where the pagehide handler can reach it. An
  // effect with no dependency list, not an assignment during render: reading a
  // ref that render wrote is exactly what the hooks lint rule exists to stop.
  const latest = useRef<Draft | null>(null)
  useEffect(() => {
    latest.current = toDraft({
      step,
      projectType,
      tone,
      text,
      toggles,
      decisions,
      collaborators,
      provenance,
      outcome,
      areasWorked,
      areasFromScratch,
      shape,
      sectionFates,
      stepsRemoved,
      attachments,
      saved,
    })
  })

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => {
      if (latest.current) writeDraft(latest.current)
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [hydrated, step, projectType, tone, text, toggles, decisions, collaborators, provenance, outcome, attachments, saved])

  // Whatever is still inside the debounce window when the page goes away. Without
  // it the last quarter-second of typing is lost on every reload.
  useEffect(() => {
    if (!hydrated) return
    const flush = () => {
      if (latest.current) writeDraft(latest.current)
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [hydrated])

  // Screenshots, in IndexedDB, kept in step with the list.
  useEffect(() => {
    if (!hydrated) return
    const ids = new Set(attachments.map((a) => a.id))
    for (const a of attachments) {
      if (!storedFiles.current.has(a.id)) {
        storedFiles.current.add(a.id)
        void saveFile(a.id, a.file)
      }
    }
    for (const id of [...storedFiles.current]) {
      if (!ids.has(id)) {
        storedFiles.current.delete(id)
        void deleteFile(id)
      }
    }
  }, [hydrated, attachments])

  const startOver = () => {
    if (!window.confirm(WIZARD_COPY.startOverConfirm)) return
    clearDraft()
    storedFiles.current.clear()
    setStep(1)
    setText({})
    setToggles({})
    setDecisions(emptyWizardState().decisions)
    setCollaborators([])
    setProvenance(null)
    setOutcome(null)
    setAreasWorked([])
    setAreasFromScratch([])
    setAttachments([])
    setProjectType(DEFAULT_PROJECT_TYPE)
    setTone(DEFAULT_TONE)
    setSaved(null)
    setError(null)
    setDone(null)
  }

  // ---------------------------------------------------------------------------

  const setTextValue = (key: TextKey, value: string) =>
    setText((prev) => ({ ...prev, [key]: value }))

  const setToggleValue = (key: ToggleKey, value: boolean) =>
    setToggles((prev) => ({ ...prev, [key]: value }))

  const goTo = useCallback((target: StepId) => {
    setStep(target)
    rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  // Jumping out of the review screen has to wait for the target step to mount
  // before the element it wants exists. An effect is the right wait:
  // requestAnimationFrame also works in a real browser, but it never runs at all
  // in a hidden tab — including the preview pane this gets verified in, where the
  // focus silently did nothing and looked correct in the DOM.
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

  const intake = buildIntake(state)
  const blockers = compileBlockers(intake)

  const write = async () => {
    if (step !== 'review' || isBusy) return
    // Nothing that cannot produce a legal document is allowed to spend a vision
    // pass and three model calls arriving at that conclusion.
    if (blockers.length > 0) return

    setIsBusy(true)
    setError(null)

    // Which call is in flight. Submitting makes three and they fail for
    // different reasons — the first two talk to Supabase from the browser, the
    // third to this app's own route — and a network-level failure carries
    // nothing in its message to tell them apart. Tracking the stage is what
    // makes "Failed to fetch" into a sentence someone can act on.
    let stage: SubmitStage = 'save'
    try {
      const fingerprint = fingerprintOf({
        intake,
        projectType,
        tone,
        attachments: attachments.map((a) => ({ id: a.id, size: a.file.size })),
      })

      let id: string
      if (saved && saved.fingerprint === fingerprint) {
        // The row for exactly these answers already exists, and its screens are
        // uploaded — only the write failed last time. Making another would leave
        // a duplicate row and upload every screenshot a second time on each
        // retry, which is what a flaky model call would otherwise cost.
        id = saved.id
      } else {
        id = await createCaseStudy({ intake, projectType, tone })

        if (attachments.length > 0) {
          stage = 'upload'
          // Same array, same order: buildIntake numbered image_notes from these
          // indices and uploadAttachments writes order_index from them too. They
          // are the join, so they cannot be built from two different lists.
          await uploadAttachments({ caseStudyId: id, files: attachments.map((a) => a.file) })
        }
        // Only now: a row whose upload failed halfway must not be reused, because
        // a retry would collide with the objects that did make it.
        setSaved({ id, fingerprint })
      }

      stage = 'write'
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStudyId: id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        // The route already turns its own failures into readable sentences;
        // this keeps the status so the console says which one it was.
        throw new Error(body?.message ?? `The case study could not be written (HTTP ${res.status}).`)
      }

      setDone(id)
    } catch (err) {
      logSubmitFailure(err, stage, stage === 'write' ? '/api/compile' : SUPABASE_URL)
      setError(describeSubmitFailure(err, stage))
    } finally {
      setIsBusy(false)
    }
  }

  // Nothing renders until the draft has been read. Showing the empty defaults for
  // a frame and then swapping in step 4 with twenty answers is worse than a
  // moment of blank, and it would mount every step component twice.
  if (!hydrated) return <div ref={rootRef} aria-busy="true" />

  if (done) {
    return (
      <StepShell heading={WIZARD_COPY.savedHeading} position="Done">
        <p className="studio-body text-[var(--studio-text-soft)]">{WIZARD_COPY.savedBody}</p>
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setDone(null)}>
            {WIZARD_COPY.backToAnswers}
          </Button>
          <a
            href={`/studio/read/${done}`}
            className="studio-button rounded-[var(--studio-r-md)] bg-[var(--studio-brand)] px-4 py-2 text-[var(--studio-text-inverse)] hover:bg-[var(--studio-brand-hover)]"
          >
            {WIZARD_COPY.openPage}
          </a>
        </div>
      </StepShell>
    )
  }

  const meta = stepMeta(step)
  const { index, total } = stepPosition(step)
  const position = step === 'review' ? 'Review' : `Step ${index + 1} of ${total}`
  const hasAnswers = draftHasAnswers({ text, decisions, collaborators, attachments, provenance, outcome, toggles, shape })

  return (
    <div ref={rootRef}>
      <StepShell
        heading={meta.heading}
        subhead={meta.subhead || undefined}
        position={position}
        footer={
          <>
            <footer className="mt-2 flex items-center justify-between gap-3">
              {step === 1 ? (
                hasAnswers ? (
                  <button
                    type="button"
                    onClick={startOver}
                    disabled={isBusy}
                    className="studio-small text-[var(--studio-text-soft)] underline-offset-4 hover:text-[var(--studio-text)] hover:underline disabled:opacity-40"
                  >
                    {WIZARD_COPY.startOver}
                  </button>
                ) : (
                  <span />
                )
              ) : (
                <BackButton onClick={() => goTo(prevStep(step))} disabled={isBusy} />
              )}

              {step === 'review' ? (
                <Button onClick={() => void write()} disabled={isBusy || blockers.length > 0}>
                  {isBusy
                    ? attachments.length > 0
                      ? 'Uploading…'
                      : 'Working…'
                    : WIZARD_COPY.reviewWrite}
                </Button>
              ) : (
                <Button onClick={() => goTo(nextStep(step))} disabled={isBusy}>
                  {step === 5 ? WIZARD_COPY.generate : 'Next'}
                </Button>
              )}
            </footer>

            {error && (
              <p
                role="alert"
                className="studio-small rounded-[var(--studio-r-sm)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-secondary)] px-3 py-2 text-[var(--studio-text)]"
              >
                {error}
              </p>
            )}
          </>
        }
      >
        {step === 1 && (
          <Step1Project
            projectType={projectType}
            onProjectTypeChange={setProjectType}
            tone={tone}
            onToneChange={setTone}
            text={text}
            onTextChange={setTextValue}
            toggles={toggles}
            onToggleChange={setToggleValue}
            collaborators={collaborators}
            onCollaboratorsChange={setCollaborators}
            disabled={isBusy}
          />
        )}
        {step === 2 && (
          <Step2Problem
            text={text}
            onTextChange={setTextValue}
            toggles={toggles}
            onToggleChange={setToggleValue}
            provenance={provenance}
            onProvenanceChange={setProvenance}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={isBusy}
          />
        )}
        {step === 3 && (
          <Step3Decisions
            decisions={decisions}
            onChange={setDecisions}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={isBusy}
          />
        )}
        {step === 4 && (
          <Step4Structure
            decisions={decisions}
            onChange={setDecisions}
            areasWorked={areasWorked}
            areasFromScratch={areasFromScratch}
            onAreasChange={(worked, fromScratch) => {
              setAreasWorked(worked)
              setAreasFromScratch(fromScratch)
            }}
            shape={shape}
            onShapeChange={setShape}
            sectionFates={sectionFates}
            onSectionFatesChange={setSectionFates}
            stepsRemoved={stepsRemoved}
            onStepsRemovedChange={setStepsRemoved}
            text={text}
            onTextChange={setTextValue}
            disabled={isBusy}
          />
        )}
        {step === 5 && (
          <Step5Outcome
            outcome={outcome}
            onOutcomeChange={setOutcome}
            text={text}
            onTextChange={setTextValue}
            toggles={toggles}
            onToggleChange={setToggleValue}
            disabled={isBusy}
          />
        )}
        {step === 'review' && (
          <Review
            sections={buildReview(intake, attachments)}
            blockers={blockers}
            notes={reviewNotes(intake, shape)}
            onJump={jumpTo}
          />
        )}
      </StepShell>
    </div>
  )
}
