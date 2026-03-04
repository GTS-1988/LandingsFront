import { useEffect } from 'react'

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_30%,white)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text)] shadow-[0_10px_30px_rgba(24,39,75,0.14)]">
      {message}
    </div>
  )
}
