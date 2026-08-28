import type { Metadata } from 'next'
import { TopBar } from '@/components/landing/TopBar'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { EarlyAccessButton } from '@/components/landing/EarlyAccessButton'

// What the product does and why its shape is unusual.
//
// Two rules governed every sentence here. First, `canvas` ground: the landing
// is the one white page in the app (see app/page.tsx), and this reads as part
// of the product rather than as a second pitch. Second, and it constrained the
// copy far more: AGENTS.md forbids fabricated credibility, and nothing here is
// deployed or has a single real user yet. So there are no testimonials, no
// counts, no logos, and no claim about the published page or per-block editing
// — both are Phase 6 and unbuilt. Every claim below is something that exists
// in the repo today and is covered by HANDOFF's "Sudah terbukti" list.
//
// Price is deliberately absent. The Buy control is hidden while
// EARLY_ACCESS_MODE is on, for reasons argued at length in TopBar, and a
// price on a page with nothing to buy repeats exactly that inconsistency.

export const metadata: Metadata = {
  title: 'Features — Check',
  description:
    'How Check builds a portfolio case study: a finding→requirement→move spine guaranteed in code, an interview that asks about decisions, and a model that never adds facts you did not state.',
}

const SERIF = 'font-[family-name:var(--font-serif)]'
const EYEBROW =
  'text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted'
const SECTION = 'mt-20 scroll-mt-24 border-t border-line-soft pt-14'
const H2 =
  'text-2xl font-medium leading-snug tracking-[-0.02em] text-ink sm:text-3xl'
const BODY = 'mt-5 text-[17px] leading-[1.7] text-ink-soft'
// The payoff line under each mechanism. Indented off an accent rule so the
// page reads as claim-then-consequence rather than as a list of features.
const BENEFIT =
  'mt-6 border-l-2 border-accent pl-5 text-[15px] leading-relaxed text-ink'

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-6 lg:px-10 lg:py-8">
        <TopBar />
      </div>

      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 lg:pt-14">
        <header>
          <p className={EYEBROW}>Features</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.06] tracking-[-0.025em] text-ink sm:text-5xl">
            Most case studies list what you did. This one shows how you decided.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
            Check asks about the decisions behind a finished project, then
            builds a page around them. The structure is guaranteed in code
            rather than requested in a prompt and hoped for.
          </p>
        </header>

        {/* ---- The spine ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>The spine</p>
          <h2 className={`mt-3 ${H2}`}>
            One idea, carried through at three levels
          </h2>
          <p className={BODY}>
            A case study reads as senior when a single idea is restated at three
            resolutions, and each one maps to exactly one of the others: what
            you found, what that demanded of the design, and what you built in
            response. Generic case studies fail because those three become
            unrelated lists.
          </p>
          <p className={BODY}>
            Check holds the mapping in its content schema, so a document where
            the levels drift apart cannot be saved.
          </p>

          <div className="mt-8 overflow-hidden rounded-xl border border-line bg-white">
            <div className="grid grid-cols-1 divide-y divide-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <SpineCell
                label="Finding"
                hint="What you learned"
                text="Nurses photographed the handover screen before every shift, because they had learned it might not be there afterwards."
              />
              <SpineCell
                label="Requirement"
                hint="What it demanded"
                text="The note had to survive the shift boundary visibly, not reassure people that it had saved."
              />
              <SpineCell
                label="Move"
                hint="What you designed"
                text="Freeze the note at shift change."
                serif
              />
            </div>
          </div>

          <p className={BENEFIT}>
            For the person deciding whether to hire you, that mapping is the
            difference between watching someone make judgment calls and reading
            a list of activities.
          </p>
        </section>

        {/* ---- The interview ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>The interview</p>
          <h2 className={`mt-3 ${H2}`}>
            It asks what you decided, never what you &ldquo;learned&rdquo;
          </h2>
          <p className={BODY}>
            The core step repeats one block: what did you decide, what made you
            decide it, and what did you consider instead. All three levels of
            the spine are derived from that single unit. You are never asked for
            a requirement, because people can recall decisions and nobody can
            recall requirements.
          </p>
          <p className={BENEFIT}>
            You can answer it from memory the week you finish a project, and the
            structure comes out true by construction instead of by editing.
          </p>
        </section>

        {/* ---- Five steps ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>Five steps</p>
          <h2 className={`mt-3 ${H2}`}>Nothing traps you halfway</h2>
          <p className={BODY}>
            Setup, what you walked into, the decisions you made, your screens,
            where it landed. Moving forward is never blocked and every field can
            be left empty. A review screen at the end marks what is still brief
            and links straight back to it.
          </p>
          <p className={BENEFIT}>
            You finish in one sitting and return to the thin parts later, rather
            than abandoning a form that refuses to let you past a field you
            cannot answer yet.
          </p>
        </section>

        {/* ---- What it will not do ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>What it will not do</p>
          <h2 className={`mt-3 ${H2}`}>It does not make anything up</h2>
          <p className={BODY}>
            Check can reframe what you wrote and draw inferences from it. It can
            never add a fact you did not state — no client names, no numbers, no
            quotes, no benchmarks. Give it no numbers at all and the metric
            block is left out of the page rather than filled with something
            plausible.
          </p>
          <p className={BENEFIT}>
            Nothing ends up on the page that you cannot defend in the
            conversation it gets you.
          </p>
        </section>

        {/* ---- Screens ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>Your screens</p>
          <h2 className={`mt-3 ${H2}`}>Captions that name a decision</h2>
          <p className={BODY}>
            Add up to six screens, and Check asks what someone should notice in
            each one. That answer is what the caption is built from, which is
            what keeps it pointed at the choice rather than at the layout.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <CaptionExample
              verdict="Not this"
              text="Dashboard with filters on the left."
            />
            <CaptionExample
              verdict="This"
              text="Filters stay pinned because people compared four options before choosing."
              good
            />
          </div>

          <p className={BENEFIT}>
            The images carry part of the argument instead of sitting underneath
            it as decoration.
          </p>
        </section>

        {/* ---- Voice ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>Your voice</p>
          <h2 className={`mt-3 ${H2}`}>It can sound like you</h2>
          <p className={BODY}>
            One optional field asks you to explain the project the way you would
            say it out loud. Three or four sentences is enough. It overrides the
            tone preset wherever the two disagree, and it is kept away from the
            facts — nothing you write there is treated as something that
            happened.
          </p>
          <p className={BENEFIT}>
            The writing reads like yours rather than like a template with your
            project poured into it.
          </p>
        </section>

        {/* ---- Also true ---- */}
        <section className={SECTION}>
          <p className={EYEBROW}>Also true</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SmallCard title="Eight rules, checked in code">
              The document has to pass all of them before it is saved. One that
              breaks a rule is written again, not shipped.
            </SmallCard>
            <SmallCard title="Headings are your decisions">
              <span className={SERIF}>Freeze the note at shift change</span> —
              not &ldquo;The Solution&rdquo;. Section titles come from what you
              chose, phrased as an instruction.
            </SmallCard>
            <SmallCard title="Written by claude-opus-5">
              The most capable model available, on the one call that produces
              the thing you keep.
            </SmallCard>
          </div>
        </section>

        {/* ---- Close ---- */}
        <section className={SECTION}>
          <h2 className={H2}>Not open yet</h2>
          <p className={BODY}>
            Check is in early access while the last pieces are finished. Leave
            your email and two quick answers, and we will reach out when a spot
            is ready.
          </p>
          <div className="mt-7">
            <EarlyAccessButton />
          </div>
        </section>
      </article>

      <SiteFooter />
    </main>
  )
}

// ---------------------------------------------------------------------------

function SpineCell({
  label,
  hint,
  text,
  serif = false,
}: {
  label: string
  hint: string
  text: string
  serif?: boolean
}) {
  return (
    <div className="px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-ink-muted">{hint}</p>
      <p
        className={
          'mt-3 leading-relaxed text-ink ' +
          (serif ? `${SERIF} text-lg` : 'text-sm text-ink-soft')
        }
      >
        {text}
      </p>
    </div>
  )
}

function CaptionExample({
  verdict,
  text,
  good = false,
}: {
  verdict: string
  text: string
  good?: boolean
}) {
  return (
    <div
      className={
        'rounded-xl border px-5 py-4 ' +
        (good ? 'border-accent bg-accent/5' : 'border-line bg-white')
      }
    >
      <p
        className={
          'text-[11px] font-semibold uppercase tracking-[0.2em] ' +
          (good ? 'text-accent' : 'text-ink-muted')
        }
      >
        {verdict}
      </p>
      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{text}</p>
    </div>
  )
}

function SmallCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-5">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  )
}
