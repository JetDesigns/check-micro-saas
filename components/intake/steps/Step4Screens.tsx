'use client'

import { FileThumbnail, type Attachment } from '@/components/wizard/AttachmentStep'
import {
  IMAGE_SLOT_LABELS,
  SCREEN_FIELDS,
  imageNoteElementId,
} from '@/lib/wizard-steps'
import type { Decision } from '@/types/database'
import { IMAGE_SLOT_HERO, IMAGE_SLOT_SUPPORTING } from '@/types/database'

export type ScreenNote = { shows: string; notice: string }

type Props = {
  attachments: Attachment[]
  decisions: Decision[]
  notes: Record<string, ScreenNote>
  onNoteChange: (attachmentId: string, patch: Partial<ScreenNote>) => void
  isBusy: boolean
}

// This step is what makes generated captions grounded instead of guessed: the
// designer says which decision a screen shows and what to look at, and the
// caption rule downstream is that a caption names a decision rather than
// describing the UI.
//
// The step is skipped entirely when nothing was uploaded — see stepOrder.
export function Step4Screens({
  attachments,
  decisions,
  notes,
  onNoteChange,
  isBusy,
}: Props) {
  const options = [
    { value: IMAGE_SLOT_HERO, label: IMAGE_SLOT_LABELS.hero },
    ...decisions
      .filter((d) => d.decided.trim())
      .map((d) => ({ value: d.id, label: d.decided.trim() })),
    { value: IMAGE_SLOT_SUPPORTING, label: IMAGE_SLOT_LABELS.supporting },
  ]

  return (
    <ul className="space-y-5">
      {attachments.map((a) => {
        const note = notes[a.id] ?? { shows: '', notice: '' }
        const noticeId = imageNoteElementId(a.id)
        const showsId = `image-${a.id}-shows`

        return (
          <li
            key={a.id}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas/40 p-4 sm:flex-row sm:p-5"
          >
            <FileThumbnail
              file={a.file}
              className="h-24 w-full shrink-0 overflow-hidden rounded-lg border border-line bg-white sm:w-32"
            />

            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <label
                  htmlFor={showsId}
                  className="block text-sm font-medium text-ink"
                >
                  {SCREEN_FIELDS.shows.label}
                </label>
                <div className="mt-2 rounded-xl border border-line bg-white transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                  <select
                    id={showsId}
                    value={note.shows}
                    disabled={isBusy}
                    onChange={(e) => onNoteChange(a.id, { shows: e.target.value })}
                    className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink disabled:opacity-60"
                  >
                    <option value="">{SCREEN_FIELDS.shows.unset}</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor={noticeId}
                  className="block text-sm font-medium text-ink"
                >
                  {SCREEN_FIELDS.notice.label}
                </label>
                <div className="mt-2 rounded-xl border border-line bg-white transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                  <input
                    id={noticeId}
                    type="text"
                    value={note.notice}
                    disabled={isBusy}
                    placeholder={SCREEN_FIELDS.notice.placeholder}
                    onChange={(e) =>
                      onNoteChange(a.id, { notice: e.target.value })
                    }
                    className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] text-ink placeholder:font-normal placeholder:text-ink-muted/80 placeholder:italic disabled:opacity-60"
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  {SCREEN_FIELDS.notice.helper}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
