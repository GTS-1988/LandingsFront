import { TextareaHTMLAttributes, useId } from 'react'
import { cx } from '../lib/cx'

export default function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId().replace(/:/g, '')
  const fieldId = props.id ?? `textarea-${autoId}`
  const fieldName = props.name ?? fieldId

  return (
    <textarea
      {...props}
      id={fieldId}
      name={fieldName}
      className={cx(
        'w-full rounded-xl border border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[color:color-mix(in_srgb,var(--text)_45%,white)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] disabled:cursor-not-allowed disabled:bg-[color:color-mix(in_srgb,var(--bg)_72%,white)] disabled:text-[var(--muted)]',
        className,
      )}
    />
  )
}
