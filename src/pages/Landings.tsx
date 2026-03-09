import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createLanding, getLandingDetails, listLandings } from '../lib/api'
import useClientsOptions from '../hooks/useClientsOptions'
import useCursorPagination from '../hooks/useCursorPagination'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'
import DataTable from '../ui/DataTable'
import EntitySelectField from '../ui/EntitySelectField'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal'
import { EmptyFeedback, ErrorFeedback, LoadingFeedback } from '../ui/Feedback'
import PaginationControls from '../ui/PaginationControls'

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
  const [toast, setToast] = useState<string | null>(null)
  const [clientsRefreshKey, setClientsRefreshKey] = useState(0)
  const { clients, clientsLoading, clientsError } = useClientsOptions(clientsRefreshKey)

  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [landingRows, setLandingRows] = useState<Array<{ id: string; name: string; clientId: string; createdAt: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { cursor, nextCursor, setNextCursor, cursorStack, page, resetPagination, goNext, goPrevious } =
    useCursorPagination(loading)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsLandingId, setDetailsLandingId] = useState<string | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<any | null>(null)
  const [detailsReloadKey, setDetailsReloadKey] = useState(0)
  const [lastCreatedById, setLastCreatedById] = useState<Record<string, any>>({})
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  const m = useMutation({
    mutationFn: async () => createLanding(selectedClientId, name),
    onSuccess: (r) => {
      setLastCreatedById((prev) => ({ ...prev, [r.landing.id]: r }))
      setToast(`✅ Landing creada: ${r.landing.name}`)
      setName('')
      resetPagination()
      setRefreshKey((k) => k + 1)
      setDetailsLandingId(r.landing.id)
      setIsDetailsOpen(true)
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t)
      setToast('📋 Copiado al portapapeles')
    } catch {
      setToast('No se pudo copiar al portapapeles')
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchInput.trim())
      resetPagination()
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, resetPagination])

  useEffect(() => {
    setSearchInput('')
    setSearchDebounced('')
    resetPagination(true)
    setLandingRows([])
    setError(null)
  }, [selectedClientId, resetPagination])

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

  useEffect(() => {
    if (!isDetailsOpen || !detailsLandingId) return
    let isCurrent = true
    setDetailsLoading(true)
    setDetailsError(null)

    getLandingDetails(detailsLandingId)
      .then((data) => {
        if (!isCurrent) return
        setDetailsData(data)
      })
      .catch((e: any) => {
        if (!isCurrent) return
        setDetailsError(e?.message || 'Error cargando detalle')
      })
      .finally(() => {
        if (!isCurrent) return
        setDetailsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [isDetailsOpen, detailsLandingId, detailsReloadKey])

  const closeDetails = () => {
    ;(document.activeElement as HTMLElement)?.blur()
    setIsDetailsOpen(false)
  }

  const openDetails = (landingId: string, trigger?: HTMLElement | null) => {
    if (trigger) lastTriggerRef.current = trigger
    ;(document.activeElement as HTMLElement)?.blur()
    setDetailsLandingId(landingId)
    setIsDetailsOpen(true)
  }

  const rawLanding = detailsData?.landing || detailsData
  const fallbackCreated = detailsLandingId ? lastCreatedById[detailsLandingId] : null
  const landingName = rawLanding?.name || fallbackCreated?.landing?.name || '-'
  const modalLandingId = rawLanding?.id || detailsLandingId || fallbackCreated?.landing?.id
  const modalFormId = rawLanding?.forms?.[0]?.id || fallbackCreated?.form?.id
  const telegramConnectUrl =
    detailsData?.telegramConnectUrl ||
    rawLanding?.telegramConnectUrl ||
    fallbackCreated?.telegramConnectUrl ||
    null
  const formEndpoint = detailsData?.formEndpoint || rawLanding?.formEndpoint || fallbackCreated?.formEndpoint || null

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="text-sm font-semibold text-[var(--text)]">Crear landing</div>
        <div className="grid gap-2.5 md:grid-cols-3">
          <EntitySelectField
            label="Cliente"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={clientsLoading}
            id="landing-client-select"
            name="landing-client-select"
            ariaLabel="Seleccionar cliente"
            placeholder="Elija un cliente…"
            options={clients}
            helperText={
              clientsError && (
                <>
                  {clientsError}{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setClientsRefreshKey((k) => k + 1)}
                  >
                    Reintentar
                  </button>
                </>
              )
            }
          />
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
          <EmptyFeedback>Selecciona un cliente para ver sus landings.</EmptyFeedback>
        ) : (
          <>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar landing…"
              aria-label="Buscar landing"
            />

            {loading ? (
              <LoadingFeedback message="Cargando landings..." />
            ) : error ? (
              <ErrorFeedback message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
            ) : landingRows.length === 0 ? (
              <EmptyFeedback>No hay landings para este cliente</EmptyFeedback>
            ) : (
              <DataTable
                columns={[
                  { label: 'Nombre' },
                  { label: 'ID' },
                  { label: 'Created date' },
                  { label: 'Actions', align: 'right' },
                ]}
              >
                  <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                    {landingRows.map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2 text-[var(--text)]">{l.name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{l.id}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">{fmtDate(l.createdAt)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            aria-label={`Ver detalles de ${l.name}`}
                            title="Ver detalles"
                            onClick={(e) => openDetails(l.id, e.currentTarget)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_12%,white)] text-sm text-[var(--muted)] transition-colors duration-200 ease-out hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
                          >
                            👁
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </DataTable>
            )}

            <PaginationControls
              pageLabel={`Página ${page}`}
              onPrevious={goPrevious}
              onNext={goNext}
              previousDisabled={loading || page <= 1 || cursorStack.length === 0}
              nextDisabled={loading || !nextCursor}
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={isDetailsOpen}
        onClose={closeDetails}
        title="Detalle de landing"
        returnFocusRef={lastTriggerRef}
      >
        {detailsLoading ? (
          <LoadingFeedback message="Cargando detalle..." />
        ) : detailsError ? (
          <ErrorFeedback
            message={detailsError}
            onRetry={detailsLandingId ? () => setDetailsReloadKey((k) => k + 1) : undefined}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{landingName}</div>
              {modalLandingId && (
                <div className="text-xs text-[var(--muted)]">
                  landingId: <span className="font-mono">{modalLandingId}</span>
                  {modalFormId ? (
                    <>
                      {' '}• formId: <span className="font-mono">{modalFormId}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">Telegram connect URL</div>
                <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{telegramConnectUrl || '-'}</div>
                <div className="mt-2 flex gap-2">
                  {telegramConnectUrl && (
                    <Button
                      className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                      onClick={() => copy(telegramConnectUrl)}
                    >
                      Copiar
                    </Button>
                  )}
                  {telegramConnectUrl && (
                    <a
                      className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
                      href={telegramConnectUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">Endpoint submit (landing+form)</div>
                <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{formEndpoint || '-'}</div>
                <div className="mt-2 flex gap-2">
                  {formEndpoint && (
                    <Button
                      className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                      onClick={() => copy(formEndpoint)}
                    >
                      Copiar
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">Este endpoint ya incluye el formId.</div>
              </div>
            </div>

            {modalLandingId && (
              <div>
                <Link
                  className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
                  to={`/landings/${modalLandingId}`}
                >
                  Abrir detalle →
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
