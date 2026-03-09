import { ReactNode, SelectHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  helperText?: ReactNode
}

export default function SelectField({ label, helperText, className, children, ...props }: SelectFieldProps) {
  return (
    <div>
      <div className="mb-1 text-xs text-[var(--muted)]">{label}</div>
      <select
        {...props}
        className={cx(
          'w-full rounded-xl border border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] disabled:opacity-60',
          className,
        )}
      >
        {children}
      </select>
      {helperText && <div className="mt-2 text-xs text-[var(--muted)]">{helperText}</div>}
    </div>
  )
}
