import { PropsWithChildren, RefObject, useEffect, useRef } from 'react'

type ModalProps = PropsWithChildren<{
  isOpen: boolean
  title: string
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}>

export default function Modal({ isOpen, title, onClose, returnFocusRef, children }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onEsc)
      returnFocusRef?.current?.focus()
    }
  }, [isOpen, onClose, returnFocusRef])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--text)_45%,white)]/25"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_12%,white)] bg-[var(--surface)] shadow-[0_18px_46px_rgba(24,39,75,0.2)]"
      >
        <div className="flex items-center justify-between border-b border-[color:color-mix(in_srgb,var(--accent)_18%,white)] px-4 py-3">
          <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close details modal"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_12%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
          >
            X
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto p-4">{children}</div>
      </div>
    </div>
  )
}
