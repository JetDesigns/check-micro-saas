import { notFound } from 'next/navigation'
import { CaseStudyDocument } from '@/components/case-study/CaseStudyDocument'
import { CASE_STUDY_FIXTURE, FIXTURE_TITLE } from '@/lib/fixtures/case-study-fixture'

// Renders the hand-written fixture so the layout can be judged before any
// agent exists. The revision spec puts this second in the build order for a
// reason: a page proven on content we control tells us whether the output is
// good enough before a single token is spent, and prompt work cannot rescue a
// layout that does not hold up.
//
// Dev only. This is scaffolding for looking at, not a route anyone should
// reach in production — and it would sit oddly next to a landing page that is
// deliberately closed.
export default function FixturePage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="min-h-screen bg-canvas">
      <CaseStudyDocument doc={CASE_STUDY_FIXTURE} title={FIXTURE_TITLE} />
    </main>
  )
}
