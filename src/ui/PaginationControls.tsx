import Button from './Button'

const secondaryButtonClass =
  'border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)] disabled:border-[color:color-mix(in_srgb,var(--text)_12%,white)] disabled:bg-[color:color-mix(in_srgb,var(--bg)_70%,white)] disabled:text-[var(--muted)] disabled:opacity-100'

type PaginationControlsProps = {
  pageLabel: string
  onPrevious: () => void
  onNext: () => void
  previousDisabled: boolean
  nextDisabled: boolean
  previousLabel?: string
  nextLabel?: string
}

export default function PaginationControls({
  pageLabel,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  previousLabel = 'Previous',
  nextLabel = 'Next',
}: PaginationControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm text-[var(--muted)]">{pageLabel}</div>
      <div className="flex items-center gap-2">
        <Button className={secondaryButtonClass} onClick={onPrevious} disabled={previousDisabled}>
          {previousLabel}
        </Button>
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
