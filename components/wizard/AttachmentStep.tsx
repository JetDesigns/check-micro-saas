'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Client-side constraints. The bucket enforces the size and MIME rules too
// (migration 0002), but MAX_FILES has no server counterpart.
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 6
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_HINT = 'JPG, PNG, WEBP'

/**
 * A picked file plus an id we mint ourselves.
 *
 * The id exists because step 4 annotates each screen, and identity used to be
 * positional — remove the second screen after annotating the third and every
 * note slides onto the wrong image. The database id would do, but it is not
 * generated until upload, which happens after the whole form is submitted.
 */
export type Attachment = { id: string; file: File }

type Props = {
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  isBusy?: boolean
}

export function AttachmentStep({
  attachments,
  onAttachmentsChange,
  isBusy = false,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      const nextErrors: string[] = []
      const accepted: File[] = []

      for (const f of list) {
        if (!ACCEPTED_TYPES.includes(f.type)) {
          nextErrors.push(`${f.name}: unsupported type (need ${ACCEPTED_HINT})`)
          continue
        }
        if (f.size > MAX_FILE_SIZE) {
          nextErrors.push(
            `${f.name}: ${formatSize(f.size)} — exceeds the 5 MB limit`
          )
          continue
        }
        accepted.push(f)
      }

      const combined = [
        ...attachments,
        ...accepted.map((file) => ({ id: crypto.randomUUID(), file })),
      ].slice(0, MAX_FILES)
      const dropped = attachments.length + accepted.length - combined.length
      if (dropped > 0) {
        nextErrors.push(
          `Only ${MAX_FILES} files allowed — ${dropped} skipped`
        )
      }

      setErrors(nextErrors)
      onAttachmentsChange(combined)
    },
    [attachments, onAttachmentsChange]
  )

  const removeFile = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
    setErrors([])
  }

  // Locked while the form is submitting: the files are already on their way
  // to storage by then, so adding more would silently miss the upload.
  const atCapacity = attachments.length >= MAX_FILES || isBusy

  return (
    <div>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-disabled={atCapacity}
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
          'mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ' +
          (atCapacity
            ? 'cursor-not-allowed border-line bg-canvas/60 opacity-60'
            : isDragging
              ? 'cursor-pointer border-accent bg-accent/5'
              : 'cursor-pointer border-line bg-white hover:border-ink-soft/40 hover:bg-canvas')
        }
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white">
          <UploadIcon />
        </div>
        <p className="mt-4 text-sm font-medium text-ink">
          {atCapacity ? (
            'Maximum files reached'
          ) : (
            <>
              Drag &amp; drop files here, or{' '}
              <span className="underline decoration-accent/60 decoration-2 underline-offset-4">
                browse
              </span>
            </>
          )}
        </p>
        <p className="mt-1.5 text-xs text-ink-muted">
          {ACCEPTED_HINT} · up to 5 MB each · {MAX_FILES} files max
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            // Reset so selecting the same file after removing it fires onChange.
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

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

      {attachments.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
            <span>
              {attachments.length} of {MAX_FILES} added
            </span>
            <button
              type="button"
              onClick={() => onAttachmentsChange([])}
              className="underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Remove all
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((a) => (
              <FilePreview
                key={a.id}
                file={a.file}
                onRemove={() => removeFile(a.id)}
              />
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * A thumbnail of a picked file, exported because step 4 shows the same screens
 * again to ask what each one is doing.
 *
 * Create AND revoke in the same effect so the URL's lifetime matches the
 * effect's. Deriving it in render (useMemo) instead looks tidier and silences
 * the lint rule below, but breaks under StrictMode: the dev remount runs the
 * cleanup, revoking the URL, while the memo does not re-run — leaving the
 * <img> pointed at a dead blob. Tried it, the thumbnail went blank.
 *
 * The setState here is genuinely synchronous, so the rule is right that it
 * costs a render; that is the correct price for a resource that must be torn
 * down and rebuilt with the effect.
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
  file,
  onRemove,
}: {
  file: File
  onRemove: () => void
}) {
  return (
    <li className="group relative overflow-hidden rounded-lg border border-line bg-white">
      <FileThumbnail file={file} />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-ink group-hover:opacity-100 focus-visible:opacity-100"
      >
        <XIcon />
      </button>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span
          className="truncate text-[11px] text-ink-soft"
          title={file.name}
        >
          {file.name}
        </span>
        <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
          {formatSize(file.size)}
        </span>
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
