import type { Metadata } from 'next'
import { TopBar } from '@/components/landing/TopBar'
import { FeatureCard } from '@/components/landing/FeatureCard'
import {
  IsoOmitted,
  IsoSpine,
  IsoSteps,
  IsoVoice,
} from '@/components/landing/IsoFigures'

// Four benefits, one screen, no scrolling.
//
// This replaced nine sections of mechanism. The rule that governed the long
// version still governs this one, and matters more now that there are only
// four claims left to make: AGENTS.md forbids fabricated credibility, nothing
// is deployed, and there is not one real user. So no shareable link, no PDF
// export, no per-block editing, no free preview, no price, no counts — every
// one of those is either unbuilt or explicitly out of scope, and four cards
// leave nowhere for a false claim to hide.
//
// Each card leads with what the designer gets and puts the mechanism in the
// second sentence as evidence. A benefit with no mechanism under it is just an
// adjective.

export const metadata: Metadata = {
  title: 'Features — Check',
  description:
    'Check asks what you decided, what made you decide it, and what you turned down. The case study is built from those answers and nothing else.',
}

const CARDS = [
  {
    label: 'Shows how you think',
    body: 'A reviewer sees the decisions behind the work, not a gallery of screens. That structure is held in the schema, not asked for in a prompt.',
    glyph: [0, 1, 4, 5, 10, 11, 14, 15],
    figure: <IsoSpine />,
  },
  {
    label: 'Finished, not postponed',
    body: 'Five steps you can answer from memory the week you finish. Nothing blocks you halfway, so the case study gets written instead of staying on the list.',
    glyph: [0, 5, 10, 15, 3, 6, 9, 12],
    figure: <IsoSteps />,
  },
  {
    label: 'Nothing to walk back',
    body: 'Every sentence traces to something you actually said. No invented numbers, names, or quotes, so you can defend the whole page in the room.',
    glyph: [1, 2, 4, 7, 8, 11, 13, 14],
    figure: <IsoOmitted />,
  },
  {
    label: 'Still sounds like you',
    body: 'Three or four sentences in your own words, and the writing follows how you actually talk instead of the tone preset.',
    glyph: [0, 2, 5, 7, 8, 10, 13, 15],
    figure: <IsoVoice />,
  },
]

export default function FeaturesPage() {
  return (
    // Locked to the viewport on lg only, the same way the landing is. Four
    // cards stacked can never fit a phone, and forcing it would clip them.
    //
    // No overflow-hidden. It would guarantee "no scrolling" by cutting a card
    // off instead — silently, and only on the short laptop viewports nobody
    // develops on. Without it a viewport too short to hold the row scrolls a
    // little, which is the failure worth having.
    <main className="min-h-screen bg-canvas lg:flex lg:h-screen lg:flex-col">
      <div className="mx-auto w-full max-w-[1500px] shrink-0 px-6 py-6 lg:px-10 lg:py-8">
        <TopBar />
      </div>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col px-6 pb-16 lg:min-h-0 lg:flex-1 lg:justify-center lg:pb-10">
        <header className="text-center">
          <h1 className="mx-auto max-w-3xl font-[family-name:var(--font-serif)] text-3xl font-medium leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[42px]">
            Great screens don&rsquo;t get you hired.
            <br className="hidden sm:block" /> The decisions behind them do.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
            Check asks what you decided, what made you decide it, and what you
            turned down. The case study is built from those answers and nothing
            else.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <FeatureCard
              key={card.label}
              label={card.label}
              body={card.body}
              glyph={card.glyph}
            >
              {card.figure}
            </FeatureCard>
          ))}
        </div>
      </section>
    </main>
  )
}
