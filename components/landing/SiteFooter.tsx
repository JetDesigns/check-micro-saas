import Link from 'next/link'

// Small footer, and it exists for one reason: the top bar's text links are
// `hidden sm:flex`, so below 640px there is no way to reach anything but the
// landing page. There is no hamburger menu anywhere in this app.
//
// On the landing this renders `sm:hidden` — see the note where it is used.
// Here it is unconditional, because /features is an ordinary scrolling page.
export function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={
        'border-t border-line-soft px-6 py-8 lg:px-10 ' + className
      }
    >
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-ink transition-colors hover:text-ink-soft"
        >
          Check.
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/features"
            className="text-sm text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Features
          </Link>
        </nav>
      </div>
    </footer>
  )
}
