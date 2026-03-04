import { PropsWithChildren } from 'react'
import { cx } from '../lib/cx'

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_9%,white)] bg-[var(--surface)] p-5 shadow-[0_6px_18px_rgba(24,39,75,0.05)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
