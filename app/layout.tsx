import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

// Editorial serif used for the case study title on /c/[id] — gives the page
// a "document" feel that lines up with the "send it to a prospect" purpose.
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Check — Case studies that sell the next client',
  description:
    'A structured interview that turns finished client work into a business-framed case study, proposal one-pager, and meeting talking points.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
