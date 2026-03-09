import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Client, createClient, listClients } from '../lib/api'
import useCursorPagination from '../hooks/useCursorPagination'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'
import DataTable from '../ui/DataTable'
import { EmptyFeedback, ErrorFeedback, LoadingFeedback } from '../ui/Feedback'
import PaginationControls from '../ui/PaginationControls'

function fmtDate(ts: string) {
  try {
    return new Date(ts).toLocaleString('es-ES')
  } catch {
    return ts
  }
}

export default function Clients() {
  const [name, setName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { cursor, nextCursor, setNextCursor, cursorStack, page, resetPagination, goNext, goPrevious } =
    useCursorPagination(loading)

  const m = useMutation({
    mutationFn: async () => createClient(name),
    onSuccess: (c) => {
      setToast(`✅ Cliente creado: ${c.name} (id: ${c.id})`)
      resetPagination()
      setRefreshKey((k) => k + 1)
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      setSearchDebounced(next)
      resetPagination()
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, resetPagination])

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)

    listClients({ q: searchDebounced || undefined, take: 50, cursor: cursor || undefined })
      .then((res) => {
        if (!isCurrent) return
        setClients(res.clients || [])
        setNextCursor(res.nextCursor ?? null)
      })
      .catch((e: any) => {
        if (!isCurrent) return
        setError(e?.message || 'Error cargando clientes')
      })
      .finally(() => {
        if (!isCurrent) return
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [searchDebounced, cursor, refreshKey])

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">Crear cliente</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            El backend actual no expone listado/edición/borrado.
          </div>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <Button onClick={() => m.mutate()} disabled={m.isPending || !name.trim()}>
            {m.isPending ? 'Creando…' : 'Crear'}
          </Button>
        </div>
        <div className="text-xs text-[var(--muted)]">
          Tip: copia el <span className="font-mono">id</span> para crear una landing.
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="text-sm font-semibold text-[var(--text)]">Clientes</div>

        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar cliente..."
          aria-label="Buscar cliente"
        />

        {loading ? (
          <LoadingFeedback message="Cargando clientes..." />
        ) : error ? (
          <ErrorFeedback message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        ) : clients.length === 0 ? (
          <EmptyFeedback>No existen clientes actualmente</EmptyFeedback>
        ) : (
          <DataTable columns={[{ label: 'Nombre' }, { label: 'ID' }, { label: 'Fecha Creación' }]}>
              <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-[var(--text)]">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{c.id}</td>
                    <td className="px-3 py-2 text-[var(--muted)]">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}

        <PaginationControls
          pageLabel={`Página ${page}/${cursorStack.length + 1}`}
          onPrevious={goPrevious}
          onNext={goNext}
          previousDisabled={loading || page <= 1 || cursorStack.length === 0}
          nextDisabled={loading || !nextCursor}
          nextLabel="Siguiente"
        />
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
