import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Client, createClient, listClients } from '../lib/api'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'

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
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const m = useMutation({
    mutationFn: async () => createClient(name),
    onSuccess: (c) => {
      setToast(`✅ Cliente creado: ${c.name} (id: ${c.id})`)
      setCursor(null)
      setCursorStack([])
      setPage(1)
      setRefreshKey((k) => k + 1)
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      setSearchDebounced(next)
      setCursor(null)
      setCursorStack([])
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

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

  const goNext = () => {
    if (!nextCursor || loading) return
    setCursorStack((prev) => [...prev, cursor || ''])
    setCursor(nextCursor)
    setPage((p) => p + 1)
  }

  const goPrevious = () => {
    if (!cursorStack.length || loading) return
    const nextStack = [...cursorStack]
    const prevCursor = nextStack.pop() || ''
    setCursorStack(nextStack)
    setCursor(prevCursor || null)
    setPage((p) => Math.max(1, p - 1))
  }

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
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
            Cargando clientes...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
            <div className="text-sm text-[var(--text)]">{error}</div>
            <Button
              className="mt-3"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Reintentar
            </Button>
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3 text-sm text-[var(--muted)]">
            No existen clientes actualmente
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)]">
            <table className="min-w-full divide-y divide-[color:color-mix(in_srgb,var(--text)_10%,white)] text-sm">
              <thead className="bg-[color:color-mix(in_srgb,var(--bg)_72%,white)]">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Fecha Creación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-[var(--text)]">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{c.id}</td>
                    <td className="px-3 py-2 text-[var(--muted)]">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-[var(--muted)]">Página {page}/{cursorStack.length +1}</div>
          <div className="flex items-center gap-2">
            <Button
              className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)] disabled:border-[color:color-mix(in_srgb,var(--text)_12%,white)] disabled:bg-[color:color-mix(in_srgb,var(--bg)_70%,white)] disabled:text-[var(--muted)] disabled:opacity-100"
              onClick={goPrevious}
              disabled={loading || page <= 1 || cursorStack.length === 0}
            >
              Previous
            </Button>
            <Button onClick={goNext} disabled={loading || !nextCursor}>
              Siguiente
            </Button>
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
