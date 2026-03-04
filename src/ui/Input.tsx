import { InputHTMLAttributes, useId } from 'react'
import { cx } from '../lib/cx'

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId().replace(/:/g, '')
  const fieldId = props.id ?? `input-${autoId}`
  const fieldName = props.name ?? fieldId

  return (
    <input
      {...props}
      id={fieldId}
      name={fieldName}
      className={cx(
        'w-full rounded-xl border border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[color:color-mix(in_srgb,var(--text)_45%,white)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]',
        className,
      )}
    />
  )
}
