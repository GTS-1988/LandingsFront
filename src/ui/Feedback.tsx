import { ReactNode } from 'react'
import Button from './Button'
import { cx } from '../lib/cx'

const panelClassName =
  'rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3'

export function LoadingFeedback({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cx('flex items-center gap-2 text-sm text-[var(--muted)]', className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
      {message}
    </div>
  )
}

export function EmptyFeedback({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(panelClassName, 'text-sm text-[var(--muted)]', className)}>{children}</div>
}

export function ErrorFeedback({
  message,
  onRetry,
  retryLabel = 'Reintentar',
  className,
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div className={cx(panelClassName, className)}>
      <div className="text-sm text-[var(--text)]">{message}</div>
      {onRetry && (
        <Button className="mt-3" type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
