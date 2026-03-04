import { useEffect } from 'react'

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-4 right-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm shadow">
      {message}
    </div>
  )
}
