import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Client, createLanding, listClients, listLandings } from '../lib/api'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'

function fmtDate(ts: string) {
  try {
    return new Date(ts).toLocaleString('es-ES')
  } catch {
    return ts
  }
}

export default function Landings() {
  const [selectedClientId, setSelectedClientId] = useState('')
  const [name, setName] = useState('')
  const [last, setLast] = useState<any | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [clientsRefreshKey, setClientsRefreshKey] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [landingRows, setLandingRows] = useState<Array<{ id: string; name: string; clientId: string; createdAt: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const m = useMutation({
    mutationFn: async () => createLanding(selectedClientId, name),
    onSuccess: (r) => {
      setLast(r)
      setToast(`✅ Landing creada: ${r.landing.name}`)
      setName('')
      setCursor(null)
      setCursorStack([])
      setPage(1)
      setRefreshKey((k) => k + 1)
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const landingId = last?.landing?.id as string | undefined
  const formId = last?.form?.id as string | undefined

  const copy = async (t: string) => {
    await navigator.clipboard.writeText(t)
    setToast('📋 Copiado al portapapeles')
  }

  const formSubmitUrl = useMemo(() => {
    if (!last?.formEndpoint) return null
    return last.formEndpoint as string
  }, [last])

  useEffect(() => {
    let isCurrent = true
    setClientsLoading(true)
    setClientsError(null)

    listClients({ take: 200 })
      .then((res) => {
        if (!isCurrent) return
        setClients(res.clients || [])
      })
      .catch((e: any) => {
        if (!isCurrent) return
        setClientsError(e?.message || 'Error cargando clientes')
      })
      .finally(() => {
        if (!isCurrent) return
        setClientsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [clientsRefreshKey])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchInput.trim())
      setCursor(null)
      setCursorStack([])
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setSearchInput('')
    setSearchDebounced('')
    setCursor(null)
    setNextCursor(null)
    setCursorStack([])
    setPage(1)
    setLandingRows([])
    setError(null)
  }, [selectedClientId])

  useEffect(() => {
    if (!selectedClientId) {
      setLandingRows([])
      setLoading(false)
      setError(null)
      return
    }

    let isCurrent = true
    setLoading(true)
    setError(null)

    listLandings({
      clientId: selectedClientId,
      take: 50,
      q: searchDebounced || undefined,
      cursor: cursor || undefined,
    })
      .then((res) => {
        if (!isCurrent) return
        setLandingRows(res.landings || [])
        setNextCursor(res.nextCursor ?? null)
      })
      .catch((e: any) => {
        if (!isCurrent) return
        setError(e?.message || 'Error cargando landings')
      })
      .finally(() => {
        if (!isCurrent) return
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [selectedClientId, searchDebounced, cursor, refreshKey])

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
        <div className="text-sm font-semibold text-[var(--text)]">Crear landing</div>
        <div className="grid gap-2.5 md:grid-cols-3">
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">Cliente</div>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={clientsLoading}
              className="w-full rounded-xl border border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] disabled:opacity-60"
              aria-label="Seleccionar cliente"
              id="landing-client-select"
              name="landing-client-select"
            >
              <option value="">Elija un cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {clientsError && (
              <div className="mt-2 text-xs text-[var(--muted)]">
                {clientsError}{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setClientsRefreshKey((k) => k + 1)}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs text-[var(--muted)]">Nombre</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la landing…" />
          </div>
        </div>
        <div>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !selectedClientId.trim() || !name.trim()}>
            {m.isPending ? 'Creando…' : 'Crear Landing'}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="text-sm font-semibold text-[var(--text)]">Landings</div>

        {!selectedClientId ? (
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3 text-sm text-[var(--muted)]">
            Selecciona un cliente para ver sus landings.
          </div>
        ) : (
          <>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar landing…"
              aria-label="Buscar landing"
            />

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
                Cargando landings...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-sm text-[var(--text)]">{error}</div>
                <Button className="mt-3" onClick={() => setRefreshKey((k) => k + 1)}>
                  Reintentar
                </Button>
              </div>
            ) : landingRows.length === 0 ? (
              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3 text-sm text-[var(--muted)]">
                No hay landings para este cliente
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)]">
                <table className="min-w-full divide-y divide-[color:color-mix(in_srgb,var(--text)_10%,white)] text-sm">
                  <thead className="bg-[color:color-mix(in_srgb,var(--bg)_72%,white)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Nombre</th>
                      <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Created date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                    {landingRows.map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2 text-[var(--text)]">{l.name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{l.id}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">{fmtDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-[var(--muted)]">Página {page}</div>
              <div className="flex items-center gap-2">
                <Button
                  className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                  onClick={goPrevious}
                  disabled={loading || page <= 1 || cursorStack.length === 0}
                >
                  Previous
                </Button>
                <Button onClick={goNext} disabled={loading || !nextCursor}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {last && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Resultado</div>
              <div className="text-xs text-[var(--muted)]">Información que debes pasar al cliente.</div>
            </div>
            {landingId && (
              <Link
                className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
                to={`/landings/${landingId}`}
              >
                Abrir detalle →
              </Link>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
              <div className="text-xs text-[var(--muted)]">Telegram connect URL</div>
              <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{last.telegramConnectUrl}</div>
              <div className="mt-2 flex gap-2">
                <Button className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]" onClick={() => copy(last.telegramConnectUrl)}>
                  Copiar
                </Button>
                <a
                  className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
                  href={last.telegramConnectUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
              <div className="text-xs text-[var(--muted)]">Endpoint submit (landing+form)</div>
              <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{formSubmitUrl}</div>
              <div className="mt-2 flex gap-2">
                {formSubmitUrl && (
                  <Button className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]" onClick={() => copy(formSubmitUrl)}>
                    Copiar
                  </Button>
                )}
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">Este endpoint ya incluye el formId.</div>
            </div>
          </div>

          {landingId && formId && (
            <div className="text-xs text-[var(--muted)]">
              landingId: <span className="font-mono">{landingId}</span> • formId:{' '}
              <span className="font-mono">{formId}</span>
            </div>
          )}
        </Card>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
