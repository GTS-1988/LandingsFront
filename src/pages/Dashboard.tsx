import { useQuery } from '@tanstack/react-query'
import { health } from '../lib/api'
import { Card } from '../ui/Card'

export default function Dashboard() {
  const q = useQuery({ queryKey: ['health'], queryFn: health })
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Dashboard</div>
        <div className="text-sm text-zinc-400">Estado rápido del backend</div>
      </div>

      <Card>
        <div className="text-sm text-zinc-400">Health</div>
        <div className="mt-1 font-mono text-sm">{q.isLoading ? '...' : JSON.stringify(q.data)}</div>
      </Card>

      <Card>
        <div className="text-sm text-zinc-400">Flujo recomendado</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-200">
          <li>Crea Cliente</li>
          <li>Crea Landing (se crea un Form por defecto)</li>
          <li>Comparte con el cliente el Telegram Connect URL y que pulse Start</li>
          <li>Testea submissions desde “Landings” o “Submissions”</li>
        </ol>
      </Card>
    </div>
  )
}
