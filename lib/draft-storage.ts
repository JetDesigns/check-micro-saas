// Browser storage for the wizard draft: localStorage for the answers, IndexedDB
// for the screenshots.
//
// Two stores because they are two kinds of thing. The answers are a few
// kilobytes of JSON. The files are up to twelve images of up to 5 MB each, which
// is well past localStorage's ~5 MB total and would fail on the first large
// screenshot. IndexedDB stores File objects directly.
//
// EVERY FUNCTION HERE SWALLOWS ITS FAILURES. Storage is unavailable in private
// windows, blocked by some browser settings, and full on some disks; in each case
// the wizard has to carry on working exactly as it did before drafts existed.
// Losing the safety net is a degradation. Breaking the form because the safety
// net failed would be worse than never having one. Failures are logged, once,
// so that "why did my draft not come back" has an answer.

import { DRAFT_KEY, parseDraft, type Draft } from '@/lib/wizard-draft'

const DB_NAME = 'check-studio-draft'
const STORE = 'files'

let warned = false
function warnOnce(what: string, err: unknown) {
  if (warned) return
  warned = true
  console.warn(`[studio] draft ${what} unavailable — your answers will not survive a reload:`, err)
}

// --- answers ---------------------------------------------------------------

export function readDraft(): Draft | null {
  try {
    return parseDraft(window.localStorage.getItem(DRAFT_KEY))
  } catch (err) {
    warnOnce('storage', err)
    return null
  }
}

export function writeDraft(draft: Draft): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch (err) {
    warnOnce('storage', err)
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch (err) {
    warnOnce('storage', err)
  }
  void clearFiles()
}

// --- files -----------------------------------------------------------------

type StoredFile = { blob: Blob; name: string; type: string; lastModified: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
        t.onerror = () => reject(t.error)
      })
  )
}

export async function saveFile(id: string, file: File): Promise<void> {
  try {
    const value: StoredFile = {
      blob: file,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
    }
    await tx('readwrite', (s) => s.put(value, id))
  } catch (err) {
    warnOnce('file storage', err)
  }
}

export async function loadFile(id: string): Promise<File | null> {
  try {
    const stored = await tx<StoredFile | undefined>('readonly', (s) => s.get(id))
    if (!stored) return null
    return new File([stored.blob], stored.name, {
      type: stored.type,
      lastModified: stored.lastModified,
    })
  } catch (err) {
    warnOnce('file storage', err)
    return null
  }
}

export async function deleteFile(id: string): Promise<void> {
  try {
    await tx('readwrite', (s) => s.delete(id))
  } catch (err) {
    warnOnce('file storage', err)
  }
}

export async function clearFiles(): Promise<void> {
  try {
    await tx('readwrite', (s) => s.clear())
  } catch (err) {
    warnOnce('file storage', err)
  }
}
