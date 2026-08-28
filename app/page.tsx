import { SiteFooter } from '@/components/landing/SiteFooter'
import { StartCta } from '@/components/landing/StartCta'
import { TopBar } from '@/components/landing/TopBar'
import { IntakeFlow } from '@/components/intake/IntakeFlow'

// Landing is the one page on a white ground — the rest of the app sits on
// `canvas`. The wizard gets a canvas-tinted frame so it reads as a distinct
// surface rather than floating on the same white as the pitch.

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-10 px-6 py-6 lg:h-screen lg:grid-cols-[minmax(0,48fr)_minmax(0,52fr)] lg:gap-12 lg:px-10 lg:py-8">
        {/* LEFT — nav on top, pitch centred in what's left below it.

            It used to be bottom-anchored with mt-auto. At 1440x900 that left
            356px of empty white between the nav and the headline — 40% of the
            column — which reads as a page that failed to load rather than as
            deliberate composition. my-auto splits the leftover space instead,
            so the pitch sits centred at every window height.

            The height MUST fit inside the viewport: with top-8 (32px) the
            column gets 100vh-4rem, leaving 32px of air at the bottom too. Go
            taller than this and the browser stops pinning and lets the whole
            column scroll away — which is exactly what a 105vh experiment here
            did. The sticky is now belt-and-braces, since the grid is viewport
            height and the page no longer scrolls on lg, but it costs nothing
            and keeps the column correct if that ever changes. */}
        <section className="flex flex-col lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:self-start">
          <TopBar />

          {/* my-auto centres this block on desktop; on mobile the auto
              margins collapse and mt-16 gives a normal top-down stack. */}
          <div className="mt-16 lg:my-auto lg:pb-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              For freelance &amp; small-agency designers
            </span>

            <h1 className="mt-7 max-w-2xl text-4xl font-medium leading-[1.06] tracking-[-0.025em] text-ink sm:text-5xl lg:text-[56px]">
              Turn finished design work into a case study that gets you hired.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              A few questions about the decisions you made. Check turns them
              into a structured case study — what you found, what it demanded,
              and the moves you designed — written for the person deciding
              whether to hire you.
            </p>

            <div className="mt-8">
              <StartCta />
            </div>
          </div>
        </section>

        {/* RIGHT — wizard in a tinted frame.

            On lg the frame owns the full column height and scrolls its own
            content. Before this the card simply ran past the bottom of the
            viewport, so the page picked up a ~130px scroll that stopped almost
            immediately — long enough to look like a bug, too short to read as
            deliberate. Trimming padding only hid it at one window height; at
            800px it came straight back.

            min-h-0 is what makes it work: a grid item defaults to min-height
            auto, which refuses to shrink below its content, and the child's
            overflow never engages. */}
        <section className="lg:h-full lg:min-h-0 lg:py-2">
          <div className="rounded-[28px] bg-canvas p-3 sm:p-5 lg:h-full lg:overflow-y-auto lg:p-6">
            <IntakeFlow />
          </div>
          <p className="mt-4 text-center text-xs text-ink-muted lg:hidden">
            No account needed to start. Pay once per case study.
          </p>
        </section>
      </div>

      {/* Phone only, and the breakpoint is the whole point.

          The top bar's text links are `hidden sm:flex`, so below 640px there
          is no route to /features at all. Above it the bar already carries
          them — and on lg this page is a viewport-locked grid whose height
          two long comments above are devoted to protecting. A footer there
          would put back the ~130px scroll that "reads as a bug". */}
      <SiteFooter className="sm:hidden" />
    </main>
  )
}
