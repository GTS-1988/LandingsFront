import { useQuery } from '@tanstack/react-query'
import { health } from '../lib/api'
import { Card } from '../ui/Card'

export default function Dashboard() {
  const q = useQuery({ queryKey: ['health'], queryFn: health })
  return (
    <div className="space-y-5">
      <Card className="space-y-2">
        <div className="text-sm font-semibold text-[var(--text)]">Health</div>
        <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_65%,white)] p-3 font-mono text-sm text-[var(--muted)]">
          {q.isLoading ? '...' : JSON.stringify(q.data)}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-[var(--text)]">Flujo recomendado</div>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[var(--muted)]">
          <li>Crea Cliente</li>
          <li>Crea Landing (se crea un Form por defecto)</li>
          <li>Comparte con el cliente el Telegram Connect URL y que pulse Start</li>
          <li>Testea submissions desde “Landings” o “Submissions”</li>
        </ol>
      </Card>
    </div>
  )
}
