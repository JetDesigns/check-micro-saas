import { EarlyAccess } from '@/components/landing/EarlyAccess'
import { StartCta } from '@/components/landing/StartCta'
import { TopBar } from '@/components/landing/TopBar'
import { IntakeFlow } from '@/components/intake/IntakeFlow'

// Landing is the one page on a white ground — the rest of the app sits on
// `canvas`. The wizard gets a canvas-tinted frame so it reads as a distinct
// surface rather than floating on the same white as the pitch.

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-10 px-6 py-6 lg:grid-cols-[minmax(0,48fr)_minmax(0,52fr)] lg:gap-12 lg:px-10 lg:py-8">
        {/* LEFT — nav on top, pitch anchored to the bottom, pinned while the
            wizard scrolls past it.

            The height MUST fit inside the viewport for `sticky` to pin: with
            top-8 (32px) the column gets 100vh-4rem, leaving 32px of air at
            the bottom too. Go taller than this and the browser stops pinning
            and lets the whole column scroll away — which is exactly what a
            105vh experiment here did.

            That caps the nav→pitch gap at whatever height is left over, since
            the pitch is bottom-anchored by mt-auto. Sticky and a bigger gap
            pull against each other; pinning wins. */}
        <section className="flex flex-col lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:self-start">
          <TopBar />

          {/* mt-auto is what drops the pitch to the bottom on desktop; on
              mobile it collapses to a normal top-down stack. */}
          <div className="mt-16 lg:mt-auto lg:pb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              For freelance &amp; small-agency designers
            </span>

            <h1 className="mt-7 max-w-2xl text-4xl font-medium leading-[1.06] tracking-[-0.025em] text-ink sm:text-5xl lg:text-[56px]">
              Turn finished design work into a case study that sells the next
              client.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              Conversational questions, one structured narrative. Eight sections
              — vision through reflection — written for the client you want
              next, not for a portfolio reviewer.
            </p>

            <div className="mt-8">
              <StartCta />
            </div>
          </div>
        </section>

        {/* RIGHT — wizard in a tinted frame. */}
        <section className="lg:py-2">
          <div className="rounded-[28px] bg-canvas p-3 sm:p-5 lg:p-6">
            <IntakeFlow />
          </div>
          <p className="mt-4 text-center text-xs text-ink-muted lg:hidden">
            No account needed to start. Pay once per case study.
          </p>
        </section>
      </div>

      {/* Sits under the grid, not inside the hero column: that column is
          sticky and pinned to the viewport height, so anything added to it
          breaks the pinning. */}
      <EarlyAccess />
    </main>
  )
}
