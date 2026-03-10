import { KeyboardEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../lib/cx'
import normalizeSearchValue from '../lib/normalizeSearchValue'

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
  searchText?: string
}

type SearchableSelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  id: string
  name?: string
  placeholder: string
  options: SearchableSelectOption[]
  helperText?: ReactNode
  ariaLabel?: string
}

export default function SearchableSelectField({
  label,
  value,
  onChange,
  disabled,
  loading,
  id,
  name,
  placeholder,
  options,
  helperText,
  ariaLabel,
}: SearchableSelectFieldProps) {
  const { t } = useTranslation('common')
  const searchInputId = useId().replace(/:/g, '')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const activeOptionRef = useRef<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selectedOption = useMemo(() => options.find((option) => option.value === value) || null, [options, value])

  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        normalizedLabel: normalizeSearchValue(option.label),
        normalizedDescription: normalizeSearchValue(option.description || ''),
        normalizedSearchText: normalizeSearchValue(option.searchText || option.value),
      })),
    [options],
  )

  const normalizedQuery = useMemo(() => normalizeSearchValue(query), [query])
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return normalizedOptions
    return normalizedOptions.filter((option) => {
      return (
        option.normalizedLabel.includes(normalizedQuery) ||
        option.normalizedDescription.includes(normalizedQuery) ||
        option.normalizedSearchText.includes(normalizedQuery)
      )
    })
  }, [normalizedOptions, normalizedQuery])

  const [activeIndex, setActiveIndex] = useState(0)
  const listboxId = `${id}-listbox`
  const activeOptionId = filteredOptions[activeIndex] ? `${id}-option-${filteredOptions[activeIndex].value}` : undefined

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    const selectedIndex = normalizedOptions.findIndex((option) => option.value === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [isOpen, normalizedOptions, value])

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || disabled) return
    searchInputRef.current?.focus()
  }, [isOpen, disabled])

  useEffect(() => {
    if (disabled && isOpen) setIsOpen(false)
  }, [disabled, isOpen])

  useEffect(() => {
    if (!filteredOptions.length) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((current) => {
      if (current < 0) return 0
      if (current >= filteredOptions.length) return filteredOptions.length - 1
      return current
    })
  }, [filteredOptions])

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setIsOpen(false)
    setQuery('')
  }

  const openMenu = () => {
    if (disabled) return
    setIsOpen(true)
  }

  const moveActiveIndex = (direction: 1 | -1) => {
    if (!filteredOptions.length) return
    setActiveIndex((current) => {
      const next = current + direction
      if (next < 0) return filteredOptions.length - 1
      if (next >= filteredOptions.length) return 0
      return next
    })
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMenu()
    }
    if ((event.key === 'Backspace' || event.key === 'Delete') && value) {
      event.preventDefault()
      handleSelect('')
    }
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActiveIndex(1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActiveIndex(-1)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const activeOption = filteredOptions[activeIndex]
      if (activeOption) handleSelect(activeOption.value)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
    }
  }

  const triggerLabel = loading
    ? t('selectors.loading')
    : selectedOption?.label || (value ? value : placeholder)

  const hasOptions = normalizedOptions.length > 0
  const hasFilteredResults = filteredOptions.length > 0

  return (
    <div ref={rootRef} className="relative">
      {label ? <div className="mb-1 text-xs text-[var(--muted)]">{label}</div> : null}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel || label}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={isOpen ? activeOptionId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        className={cx(
          'flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-left text-sm text-[var(--text)] transition focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] disabled:cursor-not-allowed disabled:bg-[color:color-mix(in_srgb,var(--bg)_72%,white)] disabled:text-[var(--muted)]',
          !selectedOption && !loading ? 'text-[var(--muted)]' : null,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={cx('h-4 w-4 shrink-0 text-[var(--muted)] transition', isOpen ? 'rotate-180' : null)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] shadow-[0_18px_45px_rgba(var(--shadow-color),0.16)]">
          <div className="border-b border-[color:color-mix(in_srgb,var(--text)_8%,white)] p-2.5">
            <input
              ref={searchInputRef}
              id={searchInputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('selectors.searchPlaceholder')}
              aria-label={t('selectors.searchPlaceholder')}
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
            />
          </div>

          {value ? (
            <div className="border-b border-[color:color-mix(in_srgb,var(--text)_8%,white)] p-2">
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--text)] transition hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-soft))] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
              >
                {t('selectors.clear')}
              </button>
            </div>
          ) : null}

          <div role="listbox" id={listboxId} className="max-h-64 overflow-auto p-2">
            {loading ? (
              <div className="rounded-xl px-3 py-2 text-sm text-[var(--muted)]">{t('selectors.loading')}</div>
            ) : !hasOptions ? (
              <div className="rounded-xl px-3 py-2 text-sm text-[var(--muted)]">{t('selectors.empty')}</div>
            ) : !hasFilteredResults ? (
              <div className="rounded-xl px-3 py-2 text-sm text-[var(--muted)]">{t('selectors.noResults')}</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <button
                    key={option.value}
                    ref={isActive ? activeOptionRef : null}
                    id={`${id}-option-${option.value}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(option.value)}
                    className={cx(
                      'mb-1 flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition last:mb-0 focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]',
                      isSelected
                        ? 'bg-[color:color-mix(in_srgb,var(--accent)_14%,var(--surface-soft))] text-[var(--text)]'
                        : 'text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--surface-soft))]',
                      isActive && !isSelected
                        ? 'bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-soft))]'
                        : null,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{option.description}</span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <span className="shrink-0 rounded-full border border-[color:color-mix(in_srgb,var(--accent)_30%,white)] bg-[color:color-mix(in_srgb,var(--accent)_18%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text)]">
                        {t('selectors.selected')}
                      </span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}

      {helperText ? <div className="mt-2 text-xs text-[var(--muted)]">{helperText}</div> : null}
    </div>
  )
}
