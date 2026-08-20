'use client'

import { useState } from 'react'
import { createCaseStudy, uploadAttachments } from '@/lib/case-studies'
import {
  DEFAULT_PROJECT_TYPE,
  DEFAULT_TONE,
  INTAKE_FIELDS,
  PROJECT_TYPES,
  REQUIRED_KEYS_STEP_1,
  REQUIRED_KEYS_STEP_2,
  STEP_1_FIELDS,
  STEP_2_FIELDS,
  TONES,
  type IntakeField,
} from '@/lib/intake-fields'
import type { Intake, ProjectType, Tone } from '@/types/database'
import { AttachmentStep } from '@/components/wizard/AttachmentStep'

type Values = Partial<Record<keyof Intake, string>>
type Step = 1 | 2

type Props = {
  /** Called once the case study exists and attachments are uploaded. */
  onCreated: (caseStudyId: string) => void
}

export function IntakeForm({ onCreated }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [values, setValues] = useState<Values>({})
  const [projectType, setProjectType] =
    useState<ProjectType>(DEFAULT_PROJECT_TYPE)
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE)
  const [files, setFiles] = useState<File[]>([])

  // Two independent "tried" flags so validation errors show on the step
  // the user actually attempted to leave — not on the other one.
  const [nextTried, setNextTried] = useState(false)
  const [submitTried, setSubmitTried] = useState(false)

  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missingStep1 = REQUIRED_KEYS_STEP_1.filter((k) => !values[k]?.trim())
  const missingStep2 = REQUIRED_KEYS_STEP_2.filter((k) => !values[k]?.trim())
  const canAdvance = missingStep1.length === 0
  const canSubmit = canAdvance && missingStep2.length === 0

  const set = (key: keyof Intake, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const handleNext = () => {
    setNextTried(true)
    if (!canAdvance) return
    setStep(2)
    // Scroll to top of form so the user starts step 2 at the heading rather
    // than mid-viewport (the form is often taller than the viewport).
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setStep(1)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitTried(true)
    if (!canSubmit || isBusy) return

    setIsBusy(true)
    setError(null)
    try {
      const intake = Object.fromEntries(
        INTAKE_FIELDS.map((f) => [f.key, values[f.key]?.trim() ?? '']).filter(
          ([, v]) => v !== ''
        )
      ) as unknown as Intake

      const id = await createCaseStudy({ intake, projectType, tone })
      if (files.length > 0) {
        await uploadAttachments({ caseStudyId: id, files })
      }
      onCreated(id)
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
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-white/70 bg-surface/95 p-6 shadow-[0_1px_2px_rgba(23,23,23,0.05),0_12px_32px_-8px_rgba(23,23,23,0.16),0_32px_80px_-20px_rgba(74,59,41,0.24)] backdrop-blur-sm sm:p-8"
    >
      <StepIndicator step={step} />

      {step === 1 ? (
        <Step1
          files={files}
          onFilesChange={setFiles}
          projectType={projectType}
          onProjectTypeChange={setProjectType}
          tone={tone}
          onToneChange={setTone}
          values={values}
          onValueChange={set}
          isBusy={isBusy}
          nextTried={nextTried}
          onNext={handleNext}
          missingCount={missingStep1.length}
        />
      ) : (
        <Step2
          values={values}
          onValueChange={set}
          isBusy={isBusy}
          submitTried={submitTried}
          onBack={handleBack}
          hasFiles={files.length > 0}
          missingCount={missingStep2.length}
        />
      )}

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

// ---------------------------------------------------------------------------

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
        Step {step} of 2
      </p>
      <div className="flex items-center gap-1.5" aria-hidden>
        <span
          className={
            'h-1.5 w-6 rounded-full ' +
            (step === 1 ? 'bg-accent' : 'bg-accent/30')
          }
        />
        <span
          className={
            'h-1.5 w-6 rounded-full ' +
            (step === 2 ? 'bg-accent' : 'bg-line')
          }
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

type Step1Props = {
  files: File[]
  onFilesChange: (files: File[]) => void
  projectType: ProjectType
  onProjectTypeChange: (t: ProjectType) => void
  tone: Tone
  onToneChange: (t: Tone) => void
  values: Values
  onValueChange: (k: keyof Intake, v: string) => void
  isBusy: boolean
  nextTried: boolean
  onNext: () => void
  missingCount: number
}

function Step1(props: Step1Props) {
  const {
    files,
    onFilesChange,
    projectType,
    onProjectTypeChange,
    tone,
    onToneChange,
    values,
    onValueChange,
    isBusy,
    nextTried,
    onNext,
    missingCount,
  } = props

  return (
    <div>
      <h2 className="mt-3 text-xl font-medium leading-snug text-ink sm:text-2xl">
        Quick setup
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        A few quick choices, then we go into the story.
      </p>

      {/* Attachments — top of step 1, per the intake flow order. */}
      <div className="mt-6">
        <AttachmentStep
          files={files}
          onFilesChange={onFilesChange}
          isBusy={isBusy}
          variant="inline"
        />
      </div>

      {/* Project type */}
      <fieldset className="mt-6">
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          What kind of project was it?
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PROJECT_TYPES.map((t) => {
            const active = projectType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onProjectTypeChange(t.value)}
                aria-pressed={active}
                className={
                  'rounded-xl border p-3 text-left transition-colors ' +
                  (active
                    ? 'border-accent bg-accent/5'
                    : 'border-line bg-white hover:border-ink-soft/40')
                }
              >
                <span className="block text-sm font-medium text-ink">
                  {t.label}
                </span>
                <span className="mt-1 block text-xs leading-snug text-ink-muted">
                  {t.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Tone */}
      <fieldset className="mt-6">
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          Tone
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => {
            const active = tone === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onToneChange(t.value)}
                aria-pressed={active}
                className={
                  'rounded-lg border px-3.5 py-1.5 text-sm transition-colors ' +
                  (active
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-white text-ink-soft hover:border-ink-soft/40 hover:text-ink')
                }
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Step 1 short inputs */}
      <div className="mt-6 space-y-5">
        {STEP_1_FIELDS.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            isBusy={isBusy}
            showError={
              nextTried && field.required && !values[field.key]?.trim()
            }
            onChange={(v) => onValueChange(field.key, v)}
          />
        ))}
      </div>

      <footer className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted sm:max-w-[60%]">
          Free to write. You only pay to unlock the full result.
        </p>
        {/* Disabled for the early-access phase. The wizard stays fillable so
            visitors can see what the product asks for, but nothing is written
            yet — the landing's one live action is the early-access form.

            Sealing this one button seals the whole wizard: `step` starts at 1
            and handleNext is the only thing that ever sets it to 2, so step 2
            and handleSubmit are both unreachable while this is off. */}
        <button
          type="button"
          onClick={onNext}
          disabled
          title="Not open yet — request early access to get in first"
          className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink sm:px-7"
        >
          Next: write the story
        </button>
      </footer>

      {nextTried && missingCount > 0 && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {missingCount} required{' '}
          {missingCount === 1 ? 'answer is' : 'answers are'} still empty.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

type Step2Props = {
  values: Values
  onValueChange: (k: keyof Intake, v: string) => void
  isBusy: boolean
  submitTried: boolean
  onBack: () => void
  hasFiles: boolean
  missingCount: number
}

function Step2(props: Step2Props) {
  const {
    values,
    onValueChange,
    isBusy,
    submitTried,
    onBack,
    hasFiles,
    missingCount,
  } = props

  return (
    <div>
      <h2 className="mt-3 text-xl font-medium leading-snug text-ink sm:text-2xl">
        The story of the project
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        Plain answers in the client&apos;s terms. Rough numbers are fine — leave
        optional ones blank rather than guess.
      </p>

      <div className="mt-6 space-y-5">
        {STEP_2_FIELDS.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            isBusy={isBusy}
            showError={
              submitTried && field.required && !values[field.key]?.trim()
            }
            onChange={(v) => onValueChange(field.key, v)}
          />
        ))}
      </div>

      <footer className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40 sm:self-center"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink sm:px-7"
        >
          {isBusy
            ? hasFiles
              ? 'Uploading…'
              : 'Working…'
            : 'Write the case study'}
        </button>
      </footer>

      {submitTried && missingCount > 0 && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {missingCount} required{' '}
          {missingCount === 1 ? 'answer is' : 'answers are'} still empty.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

type FieldRowProps = {
  field: IntakeField
  value: string
  isBusy: boolean
  showError: boolean
  onChange: (v: string) => void
}

function FieldRow({ field, value, isBusy, showError, onChange }: FieldRowProps) {
  const id = `intake-${field.key}`

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {field.label}
        {!field.required && (
          <span className="ml-2 text-xs font-normal text-ink-muted">
            optional
          </span>
        )}
      </label>

      <div
        className={
          'mt-2 rounded-xl border bg-white transition-shadow focus-within:ring-2 focus-within:ring-accent/15 ' +
          (showError
            ? 'border-red-300 focus-within:border-red-400'
            : 'border-line focus-within:border-accent')
        }
      >
        {field.type === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            rows={field.rows ?? 3}
            disabled={isBusy}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={showError || undefined}
            className="block w-full resize-none rounded-xl bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            disabled={isBusy}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={showError || undefined}
            className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
          />
        )}
      </div>

      {showError ? (
        <p role="alert" className="mt-1.5 text-xs text-red-700">
          This one is needed to write the case study.
        </p>
      ) : (
        field.helper && (
          <p className="mt-1.5 text-xs text-ink-muted">{field.helper}</p>
        )
      )}
    </div>
  )
}
