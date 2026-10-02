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

// Uploads used to be one step at the top of the wizard, and everything about
// what a screen was for had to be reconstructed afterwards on a step of its
// own: a dropdown asking which decision it belonged to, and a free-text note
// asking what it showed. The dropdown is gone because a file is now picked
// INTO the slot that explains it — the problem, or the before/after of one
// decision — so position carries the decision link and the prior/new state
// that §6.2's asset veto and §8.6's after-only caption rule both needed and
// neither could get (I35).
//
// The cap is global and lives in one constant. There are up to nine slots on a
// four-decision project, and a per-slot cap would let each of them hold twelve.

type Props = {
  slot: ImageSlot
  /** A Decision.id. Required for 'before' and 'after', absent for 'problem'. */
  decisionId?: string
  /** The WHOLE list, because the cap counts every slot together. */
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  /** Label above the dropzone. Omit where the surrounding heading says it. */
  label?: string
  /** One file, replaced on re-pick. Before/after slots hold exactly one. */
  single?: boolean
  isBusy?: boolean
}

export function ScreenSlot({
  slot,
  decisionId,
  attachments,
  onAttachmentsChange,
  label,
  single = false,
  isBusy = false,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const mine = attachments.filter(
    (a) => a.slot === slot && a.decisionId === decisionId
  )

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const nextErrors: string[] = []
      const accepted: File[] = []

      for (const f of Array.from(incoming)) {
        if (!(ACCEPTED_ATTACHMENT_TYPES as readonly string[]).includes(f.type)) {
          nextErrors.push(
            `${f.name}: unsupported type (need ${ACCEPTED_ATTACHMENT_HINT})`
          )
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

      // `room` is measured against the WHOLE list, single slot or not. Letting
      // the single branch take its one file unconditionally is how a nine-slot
      // project walks past a twelve-file cap one decision at a time — caught by
      // filling the problem slot to the cap and then dropping a before screen
      // onto a decision, which was accepted.
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
      if (taking.length === 0 && kept === attachments) return

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

  const removeFile = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
    setErrors([])
  }

  // Locked while the form is submitting: the files are already on their way to
  // storage by then, so adding more would silently miss the upload.
  //
  // A full pool closes every slot, including an empty single one — otherwise
  // the dropzone invites a file it is about to refuse.
  const poolFull = attachments.length >= MAX_ATTACHMENTS
  const atCapacity = isBusy || poolFull || (single && mine.length > 0)

  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-medium text-ink">
          {label}
          <span className="ml-2 text-xs font-normal text-ink-muted">optional</span>
        </p>
      )}

      {!(single && mine.length > 0) && (
        <div
          role="button"
          tabIndex={0}
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
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ' +
            (single ? 'px-4 py-5' : 'px-6 py-8') +
            ' ' +
            (atCapacity
              ? 'cursor-not-allowed border-line bg-canvas/60 opacity-60'
              : isDragging
                ? 'cursor-pointer border-accent bg-accent/5'
                : 'cursor-pointer border-line bg-white hover:border-ink-soft/40 hover:bg-canvas')
          }
        >
          <div
            className={
              'flex items-center justify-center rounded-full bg-ink text-white ' +
              (single ? 'h-8 w-8' : 'h-11 w-11')
            }
          >
            <UploadIcon />
          </div>
          <p className={'font-medium text-ink ' + (single ? 'mt-2 text-xs' : 'mt-4 text-sm')}>
            {atCapacity ? (
              `All ${MAX_ATTACHMENTS} screens used`
            ) : (
              <>
                Drag &amp; drop {single ? 'a screen' : 'files'} here, or{' '}
                <span className="underline decoration-accent/60 decoration-2 underline-offset-4">
                  browse
                </span>
              </>
            )}
          </p>
          {!single && (
            <p className="mt-1.5 text-xs text-ink-muted">
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
          className="mt-3 space-y-1 rounded-lg border border-red-200/60 bg-red-50/60 px-3 py-2 text-xs text-red-800"
        >
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}

      {mine.length > 0 && (
        <ul className={'mt-3 grid gap-3 ' + (single ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3')}>
          {mine.map((a) => (
            <FilePreview
              key={a.id}
              attachment={a}
              onRemove={() => removeFile(a.id)}
              onNotice={(notice) =>
                onAttachmentsChange(
                  attachments.map((x) => (x.id === a.id ? { ...x, notice } : x))
                )
              }
              isBusy={isBusy}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

/** Total across every slot, for the counter the steps print. */
export function attachmentsRemaining(attachments: Attachment[]): number {
  return Math.max(0, MAX_ATTACHMENTS - attachments.length)
}

// ---------------------------------------------------------------------------

/**
 * A thumbnail of a picked file.
 *
 * Create AND revoke in the same effect so the URL's lifetime matches the
 * effect's. Deriving it in render (useMemo) instead looks tidier and silences
 * the lint rule below, but breaks under StrictMode: the dev remount runs the
 * cleanup, revoking the URL, while the memo does not re-run — leaving the
 * <img> pointed at a dead blob. Tried it, the thumbnail went blank.
 */
export function FileThumbnail({
  file,
  className,
}: {
  file: File
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <div className={className ?? 'aspect-[4/3] bg-canvas'}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
    </div>
  )
}

function FilePreview({
  attachment,
  onRemove,
  onNotice,
  isBusy,
}: {
  attachment: Attachment
  onRemove: () => void
  onNotice: (notice: string) => void
  isBusy: boolean
}) {
  const evidence = attachment.slot === 'problem'
  const id = `screen-${attachment.id}-notice`

  return (
    <li className="group relative overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative">
        <FileThumbnail file={attachment.file} />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${attachment.file.name}`}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-ink group-hover:opacity-100 focus-visible:opacity-100"
        >
          <XIcon />
        </button>
      </div>

      {/* The note sits on the thumbnail rather than on a step of its own. That
          is what removed the old "which decision does this show?" dropdown: the
          slot already answers it, so the only question left is this one. */}
      <div className="px-2 pt-2 pb-2">
        <label htmlFor={id} className="sr-only">
          {SCREEN_FIELDS.notice.label}
        </label>
        <input
          id={id}
          type="text"
          value={attachment.notice}
          disabled={isBusy}
          placeholder={
            evidence
              ? SCREEN_FIELDS.notice.placeholderEvidence
              : SCREEN_FIELDS.notice.placeholderDecision
          }
          onChange={(e) => onNotice(e.target.value)}
          className="block w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
        />
        <p className="mt-1 text-[11px] text-ink-muted">
          {evidence
            ? SCREEN_FIELDS.notice.helperEvidence
            : SCREEN_FIELDS.notice.helperDecision}
        </p>
      </div>
    </li>
  )
}

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${Math.max(1, Math.round(kb))} KB`
}
