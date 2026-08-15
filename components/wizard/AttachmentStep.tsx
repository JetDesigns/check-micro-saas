'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Client-side constraints. Mirror these on the server upload path in step 4.
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 6
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_HINT = 'JPG, PNG, WEBP'

type Props = {
  files: File[]
  onFilesChange: (files: File[]) => void
  isBusy?: boolean
  /**
   * 'standalone' renders its own heading and Continue/Skip footer.
   * 'inline' drops both — the parent form owns the heading and submit button.
   */
  variant?: 'standalone' | 'inline'
  onContinue?: () => void
  onSkip?: () => void
}

export function AttachmentStep({
  files,
  onFilesChange,
  isBusy = false,
  variant = 'standalone',
  onContinue,
  onSkip,
}: Props) {
  const inline = variant === 'inline'
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

      const combined = [...files, ...accepted].slice(0, MAX_FILES)
      const dropped = files.length + accepted.length - combined.length
      if (dropped > 0) {
        nextErrors.push(
          `Only ${MAX_FILES} files allowed — ${dropped} skipped`
        )
      }

      setErrors(nextErrors)
      onFilesChange(combined)
    },
    [files, onFilesChange]
  )

  const removeFile = (idx: number) => {
    onFilesChange(files.slice(0, idx).concat(files.slice(idx + 1)))
    setErrors([])
  }

  const atCapacity = files.length >= MAX_FILES

  return (
    <div>
      {!inline && (
        <>
          <h2 className="text-xl font-medium leading-snug text-ink sm:text-2xl">
            Got any visuals from this project?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Screenshots, before/afters, final designs — whatever you have.
            These show up alongside your story, but they&apos;re optional.
          </p>
        </>
      )}

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

      {files.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
            <span>
              {files.length} of {MAX_FILES} added
            </span>
            <button
              type="button"
              onClick={() => onFilesChange([])}
              className="underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Remove all
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {files.map((file, i) => (
              <FilePreview
                key={`${file.name}-${file.lastModified}-${i}`}
                file={file}
                onRemove={() => removeFile(i)}
              />
            ))}
          </ul>
        </div>
      )}

      {!inline && (
        <footer className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            Skip this step
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={isBusy}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink"
          >
            {isBusy
              ? files.length > 0
                ? 'Uploading…'
                : 'Starting…'
              : files.length > 0
                ? `Continue with ${files.length} file${files.length > 1 ? 's' : ''}`
                : 'Continue'}
          </button>
        </footer>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function FilePreview({
  file,
  onRemove,
}: {
  file: File
  onRemove: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <li className="group relative overflow-hidden rounded-lg border border-line bg-white">
      <div className="aspect-[4/3] bg-canvas">
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
