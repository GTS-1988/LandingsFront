import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createLanding, getLandingDetails, listLandings } from '../lib/api'
import useClientsOptions from '../hooks/useClientsOptions'
import useCursorPagination from '../hooks/useCursorPagination'
import { getLanguageDateLocale } from '../i18n'
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

function fmtDate(ts: string, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale)
  } catch {
    return ts
  }
}

export default function Landings() {
  const { t, i18n } = useTranslation(['landings', 'common'])
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
  const dateLocale = getLanguageDateLocale(i18n.resolvedLanguage || i18n.language)

  const m = useMutation({
    mutationFn: async () => createLanding(selectedClientId, name),
    onSuccess: (r) => {
      setLastCreatedById((prev) => ({ ...prev, [r.landing.id]: r }))
      setToast(`✅ ${t('landings:toasts.createSuccess', { name: r.landing.name })}`)
      setName('')
      resetPagination()
      setRefreshKey((k) => k + 1)
      setDetailsLandingId(r.landing.id)
      setIsDetailsOpen(true)
    },
    onError: (e: any) => setToast(`❌ ${t('landings:toasts.createError', { message: e?.message || e })}`),
  })

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setToast(`📋 ${t('landings:toasts.copySuccess')}`)
    } catch {
      setToast(t('landings:toasts.copyError'))
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
        setError(e?.message || t('landings:states.loadError'))
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
        setDetailsError(e?.message || t('landings:states.detailLoadError'))
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
        <div className="text-sm font-semibold text-[var(--text)]">{t('landings:create.title')}</div>
        <div className="grid gap-2.5 md:grid-cols-3">
          <EntitySelectField
            label={t('landings:create.clientLabel')}
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={clientsLoading}
            id="landing-client-select"
            name="landing-client-select"
            ariaLabel={t('landings:create.clientAriaLabel')}
            placeholder={t('landings:create.clientPlaceholder')}
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
                    {t('common:actions.retry')}
                  </button>
                </>
              )
            }
          />
          <div className="md:col-span-2">
            <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:create.nameLabel')}</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('landings:create.namePlaceholder')}
            />
          </div>
        </div>
        <div>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !selectedClientId.trim() || !name.trim()}>
            {m.isPending ? t('landings:actions.creating') : t('landings:actions.create')}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="text-sm font-semibold text-[var(--text)]">{t('landings:list.title')}</div>

        {!selectedClientId ? (
          <EmptyFeedback>{t('landings:states.selectClient')}</EmptyFeedback>
        ) : (
          <>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('landings:search.placeholder')}
              aria-label={t('landings:search.ariaLabel')}
            />

            {loading ? (
              <LoadingFeedback message={t('landings:states.loading')} />
            ) : error ? (
              <ErrorFeedback
                message={error}
                onRetry={() => setRefreshKey((k) => k + 1)}
                retryLabel={t('common:actions.retry')}
              />
            ) : landingRows.length === 0 ? (
              <EmptyFeedback>{t('landings:states.empty')}</EmptyFeedback>
            ) : (
              <DataTable
                columns={[
                  { label: t('landings:table.columns.name') },
                  { label: t('landings:table.columns.id') },
                  { label: t('landings:table.columns.createdAt') },
                  { label: t('landings:table.columns.actions'), align: 'right' },
                ]}
              >
                  <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                    {landingRows.map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2 text-[var(--text)]">{l.name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{l.id}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">{fmtDate(l.createdAt, dateLocale)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            aria-label={t('landings:list.viewDetailsFor', { name: l.name })}
                            title={t('landings:list.viewDetails')}
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
              pageLabel={t('landings:pagination.pageLabel', { page, total: cursorStack.length + 1 })}
              onPrevious={goPrevious}
              onNext={goNext}
              previousDisabled={loading || page <= 1 || cursorStack.length === 0}
              nextDisabled={loading || !nextCursor}
              previousLabel={t('landings:pagination.previous')}
              nextLabel={t('landings:pagination.next')}
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={isDetailsOpen}
        onClose={closeDetails}
        title={t('landings:detail.modalTitle')}
        returnFocusRef={lastTriggerRef}
      >
        {detailsLoading ? (
          <LoadingFeedback message={t('landings:states.loadingDetail')} />
        ) : detailsError ? (
          <ErrorFeedback
            message={detailsError}
            onRetry={detailsLandingId ? () => setDetailsReloadKey((k) => k + 1) : undefined}
            retryLabel={t('common:actions.retry')}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{landingName}</div>
              {modalLandingId && (
                <div className="text-xs text-[var(--muted)]">
                  {t('landings:labels.landingId')}: <span className="font-mono">{modalLandingId}</span>
                  {modalFormId ? (
                    <>
                      {' '}• {t('landings:labels.formId')}: <span className="font-mono">{modalFormId}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">{t('landings:labels.telegramConnectUrl')}</div>
                <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{telegramConnectUrl || '-'}</div>
                <div className="mt-2 flex gap-2">
                  {telegramConnectUrl && (
                    <Button
                      className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                      onClick={() => copy(telegramConnectUrl)}
                    >
                      {t('landings:actions.copy')}
                    </Button>
                  )}
                  {telegramConnectUrl && (
                    <a
                      className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
                      href={telegramConnectUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('landings:actions.open')}
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">{t('landings:labels.submitEndpoint')}</div>
                <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{formEndpoint || '-'}</div>
                <div className="mt-2 flex gap-2">
                  {formEndpoint && (
                    <Button
                      className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                      onClick={() => copy(formEndpoint)}
                    >
                      {t('landings:actions.copy')}
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">{t('landings:detail.endpointHelper')}</div>
              </div>
            </div>

            {modalLandingId && (
              <div>
                <Link
                  className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
                  to={`/landings/${modalLandingId}`}
                >
                  {t('landings:actions.openDetail')} →
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
