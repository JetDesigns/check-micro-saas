'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  NARRATIVE_SECTIONS,
  type CaseStudyMeta,
  type CompiledNarrative,
  type NarrativeCallout,
  type NarrativeSection,
  type ProjectType,
  type Tone,
} from '@/types/database'
// Applied to every in-place editable element while edit mode is on. A dashed
// outline marks what's editable without shifting layout (outline, not border).
const EDITABLE =
  'outline-dashed outline-1 outline-offset-4 outline-line rounded-sm focus:outline-solid focus:outline-2 focus:outline-accent'

export type CaseStudyAttachment = {
  id: string
  url: string
  caption: string | null
}

type Props = {
  caseStudyId: string
  title: string
  /** AI-generated compact H1 headline (6–10 words). Falls back to `title`
   *  (the raw user intake answer) when null — e.g., for case studies
   *  compiled before migration 0007 added this column. */
  headline: string | null
  /** AI-inferred meta grid (role/client/audience/platform + image_captions).
   *  Null for rows compiled before migration 0008 — hero renders without
   *  the meta grid in that case. */
  meta: CaseStudyMeta | null
  clientType: string | null
  projectType: ProjectType | null
  tone: Tone | null
  createdAtISO: string
  isPaid: boolean
  isOwner: boolean
  /** Populated when isPaid = true. Rich 8-section narrative. */
  narrative: CompiledNarrative | null
  /** Populated only for the owner previewing an unpaid case study — the
   *  Vision section is the free preview. Sections 02–08 render as skeletons. */
  visionSection: NarrativeSection | null
  /** Signed URLs for attachments, in upload order. Distributed
   *  deterministically into the inter-section slots by the renderer. */
  attachments: CaseStudyAttachment[]
  welcome: boolean
  /** True when the user just returned from /auth/callback. Triggers the
   *  "1 free credit added" flash. */
  login: boolean
  /** True when the user just returned from a successful Stripe purchase.
   *  Triggers the "5 credits added" flash. */
  purchased: boolean
  /** Only meaningful when isOwner = true. Drives the sticky CTA copy on
   *  the locked view — Unlock (has credits) vs Buy 5 credits (balance 0). */
  ownerBalance: number
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  focused_fix: 'Focused fix',
  zero_to_one: 'Built from nothing',
  advisory: 'Strategy & advisory',
}

export function CaseStudyView(props: Props) {
  const {
    caseStudyId,
    title,
    headline,
    meta,
    projectType,
    createdAtISO,
    isPaid,
    isOwner,
    narrative,
    visionSection,
    attachments,
    welcome,
    login,
    purchased,
    ownerBalance,
  } = props

  const router = useRouter()
  const [copiedLink, setCopiedLink] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  // Bumped on cancel to remount the editable subtrees. React never re-renders
  // contentEditable text the user typed (the props didn't change), so a key
  // change is what actually restores the original wording.
  const [editSession, setEditSession] = useState(0)
  const docRef = useRef<HTMLDivElement>(null)
  const [welcomeVisible, setWelcomeVisible] = useState(welcome)
  const [loginVisible, setLoginVisible] = useState(login)
  const [purchasedVisible, setPurchasedVisible] = useState(purchased)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [ctaError, setCtaError] = useState<string | null>(null)

  // The active section id is used by the sticky ToC to highlight the current
  // section. Updated by IntersectionObserver below.
  const [activeSectionKey, setActiveSectionKey] = useState<string>(
    NARRATIVE_SECTIONS[0].key
  )

  // Clean the ?welcome=1 param so it doesn't re-trigger the toast on refresh,
  // then auto-hide the toast after a moment.
  useEffect(() => {
    if (!welcome) return
    const clean = window.location.pathname
    window.history.replaceState(null, '', clean)
    const t = window.setTimeout(() => setWelcomeVisible(false), 6000)
    return () => window.clearTimeout(t)
  }, [welcome])

  // Same treatment for ?login=1.
  useEffect(() => {
    if (!login) return
    const url = new URL(window.location.href)
    url.searchParams.delete('login')
    const clean =
      url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '')
    window.history.replaceState(null, '', clean)
    const t = window.setTimeout(() => setLoginVisible(false), 8000)
    return () => window.clearTimeout(t)
  }, [login])

  // Same treatment for ?purchased=1.
  useEffect(() => {
    if (!purchased) return
    const url = new URL(window.location.href)
    url.searchParams.delete('purchased')
    const clean =
      url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '')
    window.history.replaceState(null, '', clean)
    const t = window.setTimeout(() => setPurchasedVisible(false), 8000)
    return () => window.clearTimeout(t)
  }, [purchased])

  // ToC highlight — IntersectionObserver watches each section and picks the
  // one whose vertical midpoint sits closest to the viewport centre. The
  // rootMargin trims the top/bottom 40% so a section only counts as "current"
  // once it has actually taken over the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Multiple sections can be intersecting at once; pick the highest one
        // that is intersecting.
        let bestKey: string | null = null
        let bestTop = Infinity
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const key = (e.target as HTMLElement).dataset.sectionKey
          if (!key) continue
          const top = e.boundingClientRect.top
          if (top < bestTop) {
            bestTop = top
            bestKey = key
          }
        }
        if (bestKey) setActiveSectionKey(bestKey)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )

    for (const s of NARRATIVE_SECTIONS) {
      const el = document.getElementById(s.key)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      window.setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Clipboard blocked — fail quiet, user can copy from address bar.
    }
  }

  // Read the edited document back out of the DOM. Editing is in-place
  // (contentEditable on the rendered elements) rather than a form, so the
  // save path walks the same [data-edit] paths the renderer wrote.
  //
  // Callout STRUCTURE comes from the original narrative — only the text
  // fields are taken from the DOM. That keeps kind/shape stable no matter
  // what the browser did to the markup while the user typed.
  const collectEdits = (): {
    headline: string
    narrative: CompiledNarrative
  } | null => {
    const root = docRef.current
    if (!root || !narrative) return null

    const readText = (path: string): string =>
      root.querySelector(`[data-edit="${path}"]`)?.textContent?.trim() ?? ''

    const nextHeadline = readText('headline')

    const nextNarrative = {} as CompiledNarrative
    for (const s of NARRATIVE_SECTIONS) {
      const original = narrative[s.key]

      // Paragraphs = the direct children of the body container. Whichever
      // block element the browser produced when the user pressed Enter, one
      // child is one paragraph.
      const bodyEl = root.querySelector(`[data-edit="${s.key}.body"]`)
      const blocks = bodyEl ? Array.from(bodyEl.children) : []
      const paragraphs = (
        blocks.length > 0
          ? blocks.map((el) => el.textContent ?? '')
          : [bodyEl?.textContent ?? '']
      )
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      let callout: NarrativeCallout | null = null
      const oc = original.callout
      if (oc?.kind === 'insight') {
        callout = {
          kind: 'insight',
          label: readText(`${s.key}.callout.label`),
          text: readText(`${s.key}.callout.text`),
        }
      } else if (oc?.kind === 'stat') {
        callout = {
          kind: 'stat',
          items: oc.items.map((it, i) => ({
            value: readText(`${s.key}.callout.items.${i}.value`) || it.value,
            label: readText(`${s.key}.callout.items.${i}.label`) || it.label,
          })),
        }
      } else if (oc?.kind === 'process') {
        callout = {
          kind: 'process',
          steps: oc.steps.map((st, i) => ({
            n: st.n,
            title: readText(`${s.key}.callout.steps.${i}.title`) || st.title,
            text: readText(`${s.key}.callout.steps.${i}.text`) || st.text,
          })),
        }
      }

      nextNarrative[s.key] = {
        subtitle: readText(`${s.key}.subtitle`) || original.subtitle,
        body: paragraphs.join('\n\n') || original.body,
        callout,
      }
    }

    return { headline: nextHeadline, narrative: nextNarrative }
  }

  const handleSaveEdits = async () => {
    if (isSaving) return
    const edits = collectEdits()
    if (!edits) return
    if (edits.headline.length === 0) {
      setSaveError('The headline cannot be empty.')
      return
    }

    setSaveError(null)
    setIsSaving(true)
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          caseStudyId,
          headline: edits.headline,
          narrative: edits.narrative,
        }),
      })
      const b = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        message?: string
      }
      if (!res.ok || !b.ok) {
        throw new Error(b.message || b.error || `Save failed (HTTP ${res.status})`)
      }
      setIsEditing(false)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 3000)
      router.refresh()
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Save failed. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdits = () => {
    setSaveError(null)
    setIsEditing(false)
    // Force the editable subtrees to remount so the user's uncommitted DOM
    // text is thrown away and the server copy renders again.
    setEditSession((n) => n + 1)
  }

  // Spend a credit and flip the case study to `paid`. The server route runs
  // the atomic spend_credit RPC and then fetches the full narrative; we don't
  // need the returned body here — router.refresh() will re-run the server
  // component and render the full narrative from the DB.
  const handleUnlock = async () => {
    if (isUnlocking) return
    setCtaError(null)
    setIsUnlocking(true)
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseStudyId }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        message?: string
      }
      if (!res.ok || !body.ok) {
        throw new Error(body.message || body.error || `Unlock failed (HTTP ${res.status})`)
      }
      router.refresh()
    } catch (err) {
      setCtaError(
        err instanceof Error ? err.message : 'Unlock failed. Please try again.'
      )
      setIsUnlocking(false)
    }
  }

  const handleBuyCredits = async () => {
    if (isPurchasing) return
    setCtaError(null)
    setIsPurchasing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseStudyId }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
        message?: string
      }
      if (!res.ok || !body.url) {
        throw new Error(
          body.message || body.error || `Checkout failed (HTTP ${res.status})`
        )
      }
      window.location.href = body.url
    } catch (err) {
      setCtaError(
        err instanceof Error
          ? err.message
          : 'Could not start checkout. Please try again.'
      )
      setIsPurchasing(false)
    }
  }

  // For each of the 7 slots between the 8 sections, pick which attachment
  // (if any) renders there. Round-robin from the front of the queue — this
  // way 1 attachment lands right after Vision, 2 attachments span
  // Vision+Discovery slots, etc. In preview state we hide all attachments
  // (paywall — captions live on the meta column but images are teased
  // only for the paid page).
  const slotAttachments = useMemo(() => {
    const arr: Array<CaseStudyAttachment | null> = new Array(
      NARRATIVE_SECTIONS.length - 1
    ).fill(null)
    if (!isPaid) return arr
    for (let i = 0; i < Math.min(attachments.length, arr.length); i++) {
      arr[i] = attachments[i]
    }
    return arr
  }, [attachments, isPaid])

  const displayTitle = headline ?? title

  return (
    <div
      ref={docRef}
      className="min-h-screen bg-gradient-to-b from-canvas via-surface to-canvas pb-40"
    >
      {/* Top nav — bare on non-owner view. For the owner: "Copy link case
          study" (the URL is the deliverable) plus in-place editing. Both are
          disabled while the study is locked — seven of eight sections are
          skeletons then, so there is nothing to share or to edit yet. */}
      <div className="mx-auto max-w-5xl px-6 pt-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            ← Back to Check
          </Link>

          {isOwner && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdits}
                    disabled={isSaving}
                    className="rounded-xl px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                    className="rounded-xl border border-ink bg-white px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-ink"
                  >
                    {isSaving ? 'Saving…' : 'Save edit'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={!isPaid}
                  title={
                    isPaid ? undefined : 'Unlock the case study to edit it.'
                  }
                  className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-ink-soft/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line"
                >
                  {savedFlash ? 'Changes saved' : 'Edit case study'}
                </button>
              )}

              <button
                type="button"
                onClick={copyLink}
                disabled={!isPaid || isEditing}
                title={isPaid ? undefined : 'Unlock the case study to share it.'}
                className="rounded-xl bg-ink px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
              >
                {copiedLink ? 'Link copied' : 'Copy link case study'}
              </button>
            </div>
          )}
        </div>

        {saveError && (
          <p role="alert" className="mt-3 text-right text-xs text-red-700">
            {saveError}
          </p>
        )}
      </div>

      {/* Hero — breadcrumb, serif H1, 4-col meta grid. Sets the tone for a
          document, not a landing page. */}
      <header
        key={`header-${editSession}`}
        className="mx-auto max-w-4xl px-6 pt-12 sm:pt-20"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Case study
          {projectType ? (
            <>
              <span aria-hidden> · </span>
              {PROJECT_TYPE_LABELS[projectType]}
            </>
          ) : null}
          <span aria-hidden> · </span>
          {formatYear(createdAtISO)}
        </p>
        <h1
          data-edit="headline"
          contentEditable={isEditing}
          suppressContentEditableWarning
          className={
            'mt-5 font-[family-name:var(--font-serif)] text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl ' +
            (isEditing ? EDITABLE : '')
          }
        >
          {displayTitle}
        </h1>

        {meta ? (
          <MetaGrid meta={meta} />
        ) : (
          <div className="mt-10 h-px w-full bg-line" />
        )}
      </header>

      {/* Sticky ToC — appears below the header, sticks to the top on scroll.
          Horizontal-scroll on mobile with scroll-snap; centred pill row on
          desktop. Skipped in preview state so the anchor jumps don't dump
          the reader into locked skeletons. */}
      {isPaid ? (
        <StickyToc activeKey={activeSectionKey} />
      ) : (
        <div className="mx-auto mt-14 h-px max-w-4xl bg-line" />
      )}

      {/* Sections. Each section has a fixed number + name and an AI-written
          subtitle. Body prose splits on blank lines. A Callout renders at
          the tail when the model emitted one (and its kind is allowed). */}
      <main key={`main-${editSession}`} className="mx-auto mt-16 max-w-4xl px-6">
        {NARRATIVE_SECTIONS.map((meta, i) => {
          // Preview only shows Vision live. The rest render as skeleton
          // bodies with the heading intact so the reader can see the arc.
          const section: NarrativeSection | null = isPaid
            ? narrative?.[meta.key] ?? null
            : meta.key === 'vision'
              ? visionSection
              : null
          return (
            <div key={meta.key}>
              <Section
                number={meta.number}
                label={meta.label}
                section={section}
                sectionKey={meta.key}
                isFirst={i === 0}
                isEditing={isEditing}
              />
              {/* Image slot AFTER the section, except the last one. */}
              {i < slotAttachments.length && slotAttachments[i] ? (
                <InlineImage
                  attachment={slotAttachments[i] as CaseStudyAttachment}
                />
              ) : null}
            </div>
          )
        })}

        <p className="mx-auto mt-24 max-w-2xl border-t border-line-soft pt-8 text-center text-xs text-ink-muted">
          Written with Check ·{' '}
          <Link
            href="/"
            className="underline decoration-accent/40 underline-offset-4 hover:text-ink"
          >
            turn your work into one
          </Link>
        </p>
      </main>

      {/* Sticky bottom CTA — only when locked and viewer is the owner. */}
      {!isPaid && isOwner && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-4px_16px_-4px_rgba(23,23,23,0.08)] backdrop-blur">
          <div className="px-6 py-4">
            <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">
                {ownerBalance > 0 ? (
                  <>
                    Case study locked — unlock all 8 sections.{' '}
                    <span className="text-ink-muted">
                      {ownerBalance} credit{ownerBalance === 1 ? '' : 's'} in your
                      account.
                    </span>
                  </>
                ) : (
                  <>
                    Case study locked — unlock all 8 sections.{' '}
                    <span className="text-ink-muted">$9 for 5 credits.</span>
                  </>
                )}
              </p>
              {ownerBalance > 0 ? (
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="rounded-xl bg-ink px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink"
                >
                  {isUnlocking ? 'Unlocking…' : 'Unlock (uses 1 credit)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBuyCredits}
                  disabled={isPurchasing}
                  className="rounded-xl bg-ink px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-ink"
                >
                  {isPurchasing ? 'Opening checkout…' : 'Buy 5 credits — $9'}
                </button>
              )}
            </div>
            {ctaError && (
              <p role="alert" className="mx-auto mt-2 max-w-5xl text-xs text-red-700">
                {ctaError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toasts */}
      {welcomeVisible && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent shadow-lg backdrop-blur">
          Your case study is ready — copy the link to send it to a prospect.
        </div>
      )}
      {loginVisible && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-accent/30 bg-white px-4 py-2 text-sm font-medium text-ink shadow-lg backdrop-blur">
          Signed in. 1 free credit added — click Unlock below to open the full case study.
        </div>
      )}
      {purchasedVisible && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent shadow-lg backdrop-blur">
          5 credits added. Click Unlock below to open the full case study.
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------

function MetaGrid({ meta }: { meta: CaseStudyMeta }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Role', value: meta.role },
    { label: 'Client', value: meta.client },
    { label: 'Audience', value: meta.audience },
    { label: 'Platform', value: meta.platform },
  ]
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 md:grid-cols-4">
      {rows.map((r) => (
        <div key={r.label}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {r.label}
          </p>
          <p className="mt-2 text-sm leading-snug text-ink">{r.value}</p>
        </div>
      ))}
    </div>
  )
}

// Sticky pill-row ToC. On mobile it becomes a horizontally scrollable strip
// with scroll-snap; on desktop it's centred. IntersectionObserver in the
// parent updates `activeKey` so the current pill goes solid.
function StickyToc({ activeKey }: { activeKey: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  // When the active section changes, pull that pill into view on mobile.
  //
  // Deliberately NOT scrollIntoView: that walks up the ancestor chain and
  // will scroll the document itself, which fights the user's own scrolling
  // and yanks the page back up mid-read. Setting scrollLeft directly touches
  // only this one horizontal scroller.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const el = scroller.querySelector<HTMLAnchorElement>(
      `[data-toc-key="${activeKey}"]`
    )
    if (!el) return
    // No-op when the row isn't actually overflowing (desktop).
    if (scroller.scrollWidth <= scroller.clientWidth) return
    const target =
      el.offsetLeft - scroller.clientWidth / 2 + el.offsetWidth / 2
    scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [activeKey])

  return (
    <div className="sticky top-0 z-30 mt-14 border-y border-line bg-canvas/85 backdrop-blur">
      <div
        ref={scrollerRef}
        className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 py-2.5 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center"
      >
        {NARRATIVE_SECTIONS.map((s) => {
          const active = s.key === activeKey
          return (
            <a
              key={s.key}
              href={`#${s.key}`}
              data-toc-key={s.key}
              className={
                'flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors [scroll-snap-align:center] ' +
                (active
                  ? 'bg-ink text-white'
                  : 'text-ink-muted hover:bg-ink/5 hover:text-ink')
              }
            >
              <span className={active ? 'text-white/70' : 'text-ink-muted/70'}>
                {s.number}
              </span>
              <span>{s.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

// Renders one numbered section — header (number + fixed name + AI-written
// subtitle), prose body split into paragraphs on blank lines, and an
// optional callout at the tail. When `section` is null (preview state,
// locked), the body renders as a skeleton and the callout is skipped.
function Section({
  number,
  label,
  section,
  sectionKey,
  isFirst,
  isEditing,
}: {
  number: string
  label: string
  section: NarrativeSection | null
  sectionKey: string
  /** Drives the top divider + spacing. Passed explicitly rather than using
   *  Tailwind's `first:` — each section is wrapped in its own div (to carry
   *  the trailing image slot), so `:first-child` matches every one of them. */
  isFirst: boolean
  isEditing: boolean
}) {
  const paragraphs = section?.body
    ? section.body
        .split(/\n{2,}/g)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : []

  return (
    <section
      id={sectionKey}
      data-section-key={sectionKey}
      className={
        '[scroll-margin-top:80px] ' +
        (isFirst ? '' : 'mt-20 border-t border-line-soft pt-20')
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {number} · The {label}
      </p>
      <h2
        data-edit={`${sectionKey}.subtitle`}
        contentEditable={isEditing}
        suppressContentEditableWarning
        className={
          'mx-auto mt-4 max-w-2xl font-[family-name:var(--font-serif)] text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl ' +
          (isEditing ? EDITABLE : '')
        }
      >
        {section?.subtitle ?? sectionSubtitleSkeleton(sectionKey)}
      </h2>

      <div className="mx-auto mt-8 max-w-2xl">
        {paragraphs.length > 0 ? (
          <div
            data-edit={`${sectionKey}.body`}
            contentEditable={isEditing}
            suppressContentEditableWarning
            className={
              'space-y-5 text-[17px] leading-[1.75] text-ink ' +
              (isEditing ? EDITABLE : '')
            }
          >
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <BodySkeleton />
        )}

        {section?.callout ? (
          <Callout
            callout={section.callout}
            sectionKey={sectionKey}
            isEditing={isEditing}
          />
        ) : null}
      </div>
    </section>
  )
}

// Skeleton subtitle so the section heading still has typographic weight
// while locked. Not shown to the reader as real text.
function sectionSubtitleSkeleton(key: string): string {
  // Returned as text so the H2 keeps its serif look; individual keys don't
  // matter for the visual — the skeleton bars in the body signal locking.
  return `The ${key} chapter`
}

function Callout({
  callout,
  sectionKey,
  isEditing,
}: {
  callout: NarrativeCallout
  sectionKey: string
  isEditing: boolean
}) {
  // Callout text is editable too — a typo in a stat label is exactly the kind
  // of thing an owner wants to fix. The KIND and item/step counts stay fixed;
  // only the strings are read back on save.
  const edit = (path: string) => ({
    'data-edit': `${sectionKey}.callout.${path}`,
    contentEditable: isEditing,
    suppressContentEditableWarning: true,
  })
  const ec = isEditing ? ' ' + EDITABLE : ''

  if (callout.kind === 'insight') {
    return (
      <aside className="mt-10 rounded-xl border-l-4 border-accent bg-accent/5 px-5 py-4">
        <p
          {...edit('label')}
          className={
            'text-[10px] font-semibold uppercase tracking-[0.2em] text-accent' +
            ec
          }
        >
          {callout.label}
        </p>
        <p
          {...edit('text')}
          className={'mt-2 text-[15px] leading-relaxed text-ink' + ec}
        >
          {callout.text}
        </p>
      </aside>
    )
  }

  if (callout.kind === 'stat') {
    return (
      <div
        className={
          'mt-12 grid gap-10 sm:gap-8 ' +
          (callout.items.length > 1 ? 'sm:grid-cols-2' : '')
        }
      >
        {callout.items.map((it, i) => (
          <div key={i} className="flex items-center gap-5">
            <StatRing value={it.value}>
              <p
                {...edit(`items.${i}.value`)}
                className={
                  'absolute inset-0 flex items-center justify-center px-2 text-center font-[family-name:var(--font-serif)] font-medium leading-none tracking-tight text-ink ' +
                  statValueSize(it.value) +
                  ec
                }
              >
                {it.value}
              </p>
            </StatRing>
            <p
              {...edit(`items.${i}.label`)}
              className={
                'min-w-0 flex-1 text-xs font-semibold uppercase leading-relaxed tracking-[0.16em] text-ink-soft' +
                ec
              }
            >
              {it.label}
            </p>
          </div>
        ))}
      </div>
    )
  }

  // process
  return (
    <ol className="mt-10 space-y-3 rounded-xl border border-line bg-white px-5 py-5">
      {callout.steps.map((s, i) => (
        <li key={s.n} className="flex gap-4">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
            {s.n}
          </span>
          <div className="min-w-0 flex-1">
            <p
              {...edit(`steps.${i}.title`)}
              className={'text-sm font-semibold text-ink' + ec}
            >
              {s.title}
            </p>
            <p
              {...edit(`steps.${i}.text`)}
              className={'mt-1 text-sm leading-relaxed text-ink-soft' + ec}
            >
              {s.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Donut ring behind a stat value.
//
// The arc is only ever a real proportion. `statArcFraction` returns a number
// when the value genuinely contains a percentage; when it doesn't (a "3.5x",
// a "30 min", a "1.4 → 4.2"), the ring is drawn COMPLETE — a frame around the
// number rather than a partial fill. A half-swept ring on a value that isn't
// a percentage would be inventing a proportion the data never claimed, which
// is the visual version of the anti-fabrication rule the prompt enforces.
//
// One accent colour for every ring: the palette is a single accent by design
// (see globals.css), so stats don't get their own colour coding.
function StatRing({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const fraction = statArcFraction(value)
  const R = 44
  const C = 2 * Math.PI * R

  return (
    <div className="relative h-28 w-28 flex-none sm:h-32 sm:w-32">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="7"
        />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="7"
          strokeLinecap="round"
          {...(fraction === null
            ? {}
            : {
                strokeDasharray: C,
                strokeDashoffset: C * (1 - fraction),
              })}
        />
      </svg>
      {children}
    </div>
  )
}

// Percentage in the value → that's the arc. For a transition ("70% → 39%")
// the LAST percentage wins: the after-state is the number the reader cares
// about. No percentage → null, and the caller draws a complete ring.
function statArcFraction(value: string): number | null {
  const matches = value.match(/(\d+(?:\.\d+)?)\s*%/g)
  if (!matches || matches.length === 0) return null
  const last = matches[matches.length - 1]
  const n = Number.parseFloat(last)
  if (!Number.isFinite(n)) return null
  return Math.min(1, Math.max(0, n / 100))
}

// Values range from "40%" to "70% → 39%". The number is the focal point, so
// keep it as large as will fit: step down only as far as the string length
// forces. Usable width inside the ring is roughly 100px at the sm size.
function statValueSize(value: string): string {
  const len = value.trim().length
  if (len <= 4) return 'text-3xl sm:text-4xl '
  if (len <= 6) return 'text-2xl sm:text-3xl '
  if (len <= 11) return 'text-base sm:text-lg '
  return 'text-xs sm:text-sm '
}

function InlineImage({ attachment }: { attachment: CaseStudyAttachment }) {
  return (
    <figure className="mx-auto mt-16 max-w-3xl">
      {/* Signed URLs from Supabase Storage — a plain <img> is enough. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={attachment.url}
        alt={attachment.caption ?? ''}
        className="w-full rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(23,23,23,0.06),0_16px_40px_-12px_rgba(23,23,23,0.16)]"
      />
      {attachment.caption ? (
        <figcaption className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-ink-muted">
          {attachment.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function BodySkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="h-3.5 w-full rounded bg-ink/8" />
      <div className="h-3.5 w-11/12 rounded bg-ink/8" />
      <div className="h-3.5 w-10/12 rounded bg-ink/8" />
      <div className="h-3.5 w-full rounded bg-ink/8" />
      <div className="h-3.5 w-9/12 rounded bg-ink/8" />
      <div className="h-3.5 w-8/12 rounded bg-ink/8" />
    </div>
  )
}

function formatYear(iso: string): string {
  const d = new Date(iso)
  return String(d.getFullYear())
}
