'use client'

import type { ReactNode } from 'react'

// Three button shapes, all read from Figma.
//
//   primary  26:133  — filled, the step's forward action
//   outline  26:142  — white + border/default, used for Back and for "add"
//   chip     26:140  — the small pill the tone row was drawn with
//
// The chip is drawn in Figma as a SINGLE-select row (one tone at a time). Step 4
// needs it multi-select, so `pressed` drives the fill and aria-pressed carries
// the state; nothing else about it changes.

type Variant = 'primary' | 'outline' | 'chip'

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  /** Chips only. Also sets aria-pressed, which is what makes them a toggle. */
  pressed?: boolean
  disabled?: boolean
  full?: boolean
  /** Dashed border — the "add another" affordance. See DashedButton below. */
  dashed?: boolean
  type?: 'button' | 'submit'
  title?: string
}

const base =
  'inline-flex items-center justify-center gap-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS: Record<Variant, string> = {
  primary:
    'studio-button rounded-[var(--studio-r-md)] bg-[var(--studio-brand)] px-4 py-2 text-[var(--studio-text-inverse)] hover:bg-[var(--studio-brand-hover)]',
  outline:
    'studio-button rounded-[var(--studio-r-md)] border border-[var(--studio-border)] bg-[var(--studio-bg-primary)] px-4 py-2 text-[var(--studio-text)] hover:border-[var(--studio-border-strong)]',
  chip: 'studio-small rounded-[var(--studio-r-sm)] border px-3 py-1',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  pressed,
  disabled = false,
  full = false,
  dashed = false,
  type = 'button',
  title,
}: Props) {
  const chip =
    variant === 'chip'
      ? pressed
        ? 'border-[var(--studio-brand)] bg-[var(--studio-brand)] text-[var(--studio-text-inverse)]'
        : 'border-[var(--studio-border)] bg-[var(--studio-bg-primary)] text-[var(--studio-text)] hover:border-[var(--studio-border-strong)]'
      : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...(variant === 'chip' && pressed !== undefined ? { 'aria-pressed': pressed } : {})}
      className={[
        base,
        VARIANTS[variant],
        chip,
        dashed ? 'border-dashed' : '',
        full ? 'w-full' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}

// Back. Figma draws it as the outline button with a 16px icon ahead of the
// label; the icon is inlined rather than downloaded because it is a single
// stroked arrow and an asset request for it would be one more thing to keep.
export function BackButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Back
    </Button>
  )
}
