'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ACCEPTED_ATTACHMENT_HINT,
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
} from '@/lib/intake-fields'
import { SCREEN_FIELDS, type Attachment } from '@/lib/wizard-steps'
import type { ImageSlot } from '@/types/database'

// File upload (55:655), plus a compact variant that is NOT in the Figma file —
// it draws one full-width 478px dashed block and nothing smaller, while the
// per-decision before/after slots need two side by side. Same dashed border and
// same gradient pill, at 20px pad instead of 30 with one line of copy.
//
// Uploads used to be one step at the top of the wizard, and what each screen was
// for had to be reconstructed afterwards on a step of its own — a dropdown
// asking which decision it belonged to. A file is picked INTO the slot that
// explains it now, so position carries the decision link and the prior/new state
// that §6.2's asset veto and §8.6's after-only caption rule both needed and
// neither could get (I35).
//
// THE CAP IS GLOBAL AND MEASURED AGAINST THE WHOLE LIST. The single-slot branch
// used to take its one file regardless of remaining room, so a nine-slot project
// walked past a twelve-file cap one decision at a time. Found by filling the
// problem slot to the cap and then dropping a before screen onto a decision,
// which was accepted.

type Props = {
  slot: ImageSlot
  /** A Decision.id. Required for 'before' and 'after', absent for 'problem'. */
  decisionId?: string
  /** The WHOLE list, because the cap counts every slot together. */
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  label?: string
  /** One file, replaced on re-pick. Before/after slots hold exactly one. */
  single?: boolean
  disabled?: boolean
}

export function UploadSlot({
  slot,
  decisionId,
  attachments,
  onAttachmentsChange,
  label,
  single = false,
  disabled = false,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const mine = attachments.filter((a) => a.slot === slot && a.decisionId === decisionId)

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const nextErrors: string[] = []
      const accepted: File[] = []

      for (const f of Array.from(incoming)) {
        if (!(ACCEPTED_ATTACHMENT_TYPES as readonly string[]).includes(f.type)) {
          nextErrors.push(`${f.name}: unsupported type (need ${ACCEPTED_ATTACHMENT_HINT})`)
          continue
        }
        if (f.size > MAX_ATTACHMENT_BYTES) {
          nextErrors.push(`${f.name}: ${formatSize(f.size)} — exceeds the 5 MB limit`)
          continue
        }
        accepted.push(f)
      }

      // A single slot holds one file: a second pick replaces the first rather
      // than stacking, which is what "an After slot" means.
      const kept = single
        ? attachments.filter((a) => !(a.slot === slot && a.decisionId === decisionId))
        : attachments

      const room = MAX_ATTACHMENTS - kept.length
      const wanted = single ? accepted.slice(-1) : accepted
      const taking = wanted.slice(0, Math.max(0, room))

      const dropped = wanted.length - taking.length
      if (dropped > 0) {
        nextErrors.push(
          `${MAX_ATTACHMENTS} screens in total across the whole case study — ${dropped} skipped.`
        )
      }

      setErrors(nextErrors)
      if (taking.length === 0 && kept.length === attachments.length) return

      onAttachmentsChange([
        ...kept,
        ...taking.map((file) => ({
          id: crypto.randomUUID(),
          file,
          slot,
          ...(decisionId ? { decisionId } : {}),
          notice: '',
        })),
      ])
    },
    [attachments, decisionId, onAttachmentsChange, single, slot]
  )

  // A full pool closes every slot, including an empty single one — otherwise the
  // dropzone invites a file it is about to refuse.
  const poolFull = attachments.length >= MAX_ATTACHMENTS
  const atCapacity = disabled || poolFull
  const hideZone = single && mine.length > 0

  return (
    <div className="w-full">
      {label && (
        <p className="studio-h2 mb-2 text-[var(--studio-text)]">
          {label}
          <span className="studio-small ml-2 text-[var(--studio-text-soft)]">optional</span>
        </p>
      )}

      {!hideZone && (
        <div
          role="button"
          tabIndex={atCapacity ? -1 : 0}
          aria-disabled={atCapacity}
          aria-label={label ?? `Add a ${slot} screen`}
          onClick={() => !atCapacity && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (atCapacity) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!atCapacity) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (atCapacity) return
            addFiles(e.dataTransfer.files)
          }}
          className={
            'flex flex-col items-center justify-center rounded-[var(--studio-r-lg)] border border-dashed text-center transition-colors ' +
            (single ? 'gap-2 px-4 py-5' : 'gap-3 px-6 py-[30px]') +
            ' ' +
            (atCapacity
              ? 'cursor-not-allowed border-[var(--studio-border-strong)] bg-[var(--studio-bg-secondary)] opacity-60'
              : isDragging
                ? 'cursor-pointer border-[var(--studio-brand-hover)] bg-[var(--studio-bg-secondary)]'
                : 'cursor-pointer border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] hover:bg-[var(--studio-bg-secondary)]')
          }
        >
          <UploadPill small={single} />
          <p className="studio-body text-[var(--studio-text)]">
            {atCapacity ? (
              `All ${MAX_ATTACHMENTS} screens used`
            ) : (
              <>
                Drag &amp; drop {single ? 'a screen' : 'files'} here, or{' '}
                <span className="underline underline-offset-2">browse</span>
              </>
            )}
          </p>
          {!single && (
            <p className="studio-small text-[var(--studio-text-soft)]">
              {ACCEPTED_ATTACHMENT_HINT} · up to 5 MB each · {MAX_ATTACHMENTS} in total
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple={!single}
            accept={ACCEPTED_ATTACHMENT_TYPES.join(',')}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              // Reset so selecting the same file after removing it fires onChange.
              e.target.value = ''
            }}
            className="hidden"
          />
        </div>
      )}

      {errors.length > 0 && (
        <ul
          role="alert"
          className="studio-small mt-3 space-y-1 rounded-[var(--studio-r-sm)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-secondary)] px-3 py-2 text-[var(--studio-text)]"
        >
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}

      {mine.length > 0 && (
        <ul className={'mt-3 grid gap-3 ' + (single ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3')}>
          {mine.map((a) => (
            <ScreenCard
              key={a.id}
              attachment={a}
              disabled={disabled}
              onRemove={() => {
                onAttachmentsChange(attachments.filter((x) => x.id !== a.id))
                setErrors([])
              }}
              onNotice={(notice) =>
                onAttachmentsChange(
                  attachments.map((x) => (x.id === a.id ? { ...x, notice } : x))
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

// The only saturated colour in the whole wizard. It is the upload affordance's
// pill and nothing else — it is not a general accent and must not be promoted
// into one.
function UploadPill({ small = false }: { small?: boolean }) {
  return (
    <span
      className={
        'flex items-center justify-center rounded-[var(--studio-r-full)] border-[0.5px] border-[#8ca758] ' +
        (small ? 'size-8' : 'size-11')
      }
      style={{
        background:
          'linear-gradient(to bottom, #cbf380 22.87%, #bbdf76 83.623%, #768d4a 150%)',
        boxShadow: 'inset 0 3px 3px rgba(255,255,255,0.75)',
      }}
    >
      <svg
        width={small ? 14 : 16}
        height={small ? 14 : 16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#171717"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </span>
  )
}

/**
 * A picked screen and what it shows.
 *
 * The note sits on the thumbnail rather than on a step of its own. That is what
 * removed the old "which decision does this show?" dropdown: the slot already
 * answers it, so the only question left is this one — and its wording differs by
 * slot, because a problem screen is §5.4's exhibit with no decision to point at
 * yet, while a before or after screen sits inside a fix block where §8.6 requires
 * the caption to name the decision.
 */
function ScreenCard({
  attachment,
  onRemove,
  onNotice,
  disabled,
}: {
  attachment: Attachment
  onRemove: () => void
  onNotice: (notice: string) => void
  disabled: boolean
}) {
  const evidence = attachment.slot === 'problem'
  const id = `screen-${attachment.id}-notice`

  return (
    <li className="group overflow-hidden rounded-[var(--studio-r-md)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)]">
      <div className="relative">
        <Thumbnail file={attachment.file} />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${attachment.file.name}`}
          className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-[var(--studio-r-full)] bg-[var(--studio-text)]/70 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-2">
        <label htmlFor={id} className="sr-only">
          {SCREEN_FIELDS.notice.label}
        </label>
        <input
          id={id}
          type="text"
          value={attachment.notice}
          disabled={disabled}
          placeholder={
            evidence
              ? SCREEN_FIELDS.notice.placeholderEvidence
              : SCREEN_FIELDS.notice.placeholderDecision
          }
          onChange={(e) => onNotice(e.target.value)}
          className="studio-small block w-full rounded-[var(--studio-r-sm)] border border-[var(--studio-border-strong)] bg-[var(--studio-bg-primary)] px-2 py-1.5 text-[var(--studio-text)] placeholder:text-[var(--studio-text-soft)] disabled:opacity-60"
        />
        <p className="studio-small mt-1 text-[var(--studio-text-soft)]">
          {evidence
            ? SCREEN_FIELDS.notice.helperEvidence
            : SCREEN_FIELDS.notice.helperDecision}
        </p>
      </div>
    </li>
  )
}

/**
 * Create AND revoke in the same effect so the URL's lifetime matches the
 * effect's. Deriving it in render (useMemo) looks tidier and silences the lint
 * rule below, but breaks under StrictMode: the dev remount runs the cleanup,
 * revoking the URL, while the memo does not re-run — leaving the <img> pointed
 * at a dead blob. Tried it, the thumbnail went blank.
 */
function Thumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <div className="aspect-[4/3] bg-[var(--studio-bg-secondary)]">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" draggable={false} />
      )}
    </div>
  )
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
