import { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

export default function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50',
        className,
      )}
    />
  )
}
