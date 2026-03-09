import { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

export default function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_38%,white)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] transition duration-200 ease-out hover:bg-[color:color-mix(in_srgb,var(--accent)_88%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_42%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    />
  )
}
