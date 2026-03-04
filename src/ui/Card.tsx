import { PropsWithChildren } from 'react'
import { cx } from '../lib/cx'

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={cx('rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4', className)}>{children}</div>
}
