import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import './studio.css'

// The wizard's own route, and its own everything.
//
// It used to render inside the landing page's right-hand column, which meant it
// inherited that page's palette, its font and its focus ring whether it wanted
// them or not. Here it inherits nothing visual: studio.css re-declares the token
// set on .studio and overrides the two things app/globals.css sets on every
// element in the document.
//
// DEV ONLY, and the guard is in the layout so it covers every child route at
// once — the same `notFound()` app/fixture/page.tsx already uses. It does NOT
// cover /api/compile, which is a separate entry point and guards its own
// dev-only fields.
//
// No sign-in. Worth being precise about: createCaseStudy still opens an
// anonymous Supabase session, because RLS and the storage bucket policy are both
// keyed to auth.uid() and the insert fails without one. "Open route" means no
// login screen, not no session.
// Plain props rather than Next's generated `LayoutProps<'/studio'>`: that type
// is written by the dev/build route scan, so it does not exist on a clean
// checkout and `tsc --noEmit` fails before anything has run.
export default function StudioLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="studio min-h-screen w-full">
      <div className="mx-auto w-full max-w-[600px] px-4 py-10 sm:py-16">{children}</div>
    </div>
  )
}
