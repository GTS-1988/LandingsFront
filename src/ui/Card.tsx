import { PropsWithChildren } from 'react'
import { cx } from '../lib/cx'

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_10px_24px_rgba(var(--shadow-color),0.08)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
