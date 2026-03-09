import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listLandings, listSubmissions, submitForm, Submission } from '../lib/api'
import { getLanguageDateLocale } from '../i18n'
import useClientsOptions from '../hooks/useClientsOptions'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import EntitySelectField from '../ui/EntitySelectField'
import { EmptyFeedback, ErrorFeedback, LoadingFeedback } from '../ui/Feedback'
import SelectField from '../ui/SelectField'
import Toast from '../ui/Toast'

function fmt(ts: string, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale)
  } catch {
    return ts
  }
}

export default function Submissions() {
  const { t, i18n } = useTranslation(['submissions', 'common'])
  const { clients, clientsLoading, clientsError } = useClientsOptions()
  const [selectedClientId, setSelectedClientId] = useState('')

  const [landings, setLandings] = useState<Array<{ id: string; name: string; clientId: string; createdAt: string }>>([])
  const [landingsLoading, setLandingsLoading] = useState(false)
  const [landingsError, setLandingsError] = useState<string | null>(null)
  const [selectedLandingId, setSelectedLandingId] = useState('')

  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsError, setSubmissionsError] = useState<string | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [toast, setToast] = useState<string | null>(null)

  const submissionsRequestIdRef = useRef(0)
  const landingsRequestIdRef = useRef(0)
  const listRootRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const hasMoreRef = useRef(true)
  const loadingInitialRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const selectedLandingIdRef = useRef('')
  const computedTakeRef = useRef(50)

  const computedTake = Math.min(page * pageSize, 200)
  const dateLocale = getLanguageDateLocale(i18n.resolvedLanguage || i18n.language)
  const selected = useMemo(
    () => submissions.find((s) => s.id === selectedSubmissionId) || null,
    [submissions, selectedSubmissionId],
  )

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    loadingInitialRef.current = loadingInitial
  }, [loadingInitial])

  useEffect(() => {
    loadingMoreRef.current = loadingMore
  }, [loadingMore])

  useEffect(() => {
    selectedLandingIdRef.current = selectedLandingId
  }, [selectedLandingId])

  useEffect(() => {
    computedTakeRef.current = computedTake
  }, [computedTake])

  const resetSubmissionState = () => {
    setPage(1)
    setHasMore(true)
    setSubmissions([])
    setSubmissionsError(null)
    setSelectedSubmissionId(null)
  }

  useEffect(() => {
    setSelectedLandingId('')
    setLandings([])
    setLandingsError(null)
    resetSubmissionState()

    if (!selectedClientId) {
      setLandingsLoading(false)
      return
    }

    const requestId = ++landingsRequestIdRef.current
    setLandingsLoading(true)

    listLandings({ clientId: selectedClientId, take: 200 })
      .then((res) => {
        if (requestId !== landingsRequestIdRef.current) return
        setLandings(res.landings || [])
      })
      .catch((e: any) => {
        if (requestId !== landingsRequestIdRef.current) return
        setLandingsError(e?.message || i18n.t('submissions:states.loadLandingsError'))
      })
      .finally(() => {
        if (requestId !== landingsRequestIdRef.current) return
        setLandingsLoading(false)
      })
  }, [selectedClientId])

  useEffect(() => {
    if (!selectedLandingId) return

    const requestId = ++submissionsRequestIdRef.current
    setSubmissionsError(null)
    if (page > 1) setLoadingMore(true)
    else setLoadingInitial(true)

    listSubmissions({ landingId: selectedLandingId, take: computedTake })
      .then((rows) => {
        if (requestId !== submissionsRequestIdRef.current) return

        const returnedCount = rows.length
        const expectedCount = computedTake
        setSubmissions(rows)

        if (expectedCount >= 200) setHasMore(false)
        else if (returnedCount < expectedCount) setHasMore(false)
        else setHasMore(true)
      })
      .catch((e: any) => {
        if (requestId !== submissionsRequestIdRef.current) return
        setSubmissionsError(e?.message || i18n.t('submissions:states.loadError'))
      })
      .finally(() => {
        if (requestId !== submissionsRequestIdRef.current) return
        setLoadingInitial(false)
        setLoadingMore(false)
      })
  }, [selectedLandingId, computedTake, page, refreshKey])

  const mResend = useMutation({
    mutationFn: async (s: Submission) => {
      const payload = s.data || {}
      return submitForm(s.landingId, s.formId, payload)
    },
    onSuccess: () => {
      setToast(`✅ ${t('submissions:toasts.resendSuccess')}`)
      setRefreshKey((k) => k + 1)
    },
    onError: (e: any) => setToast(`❌ ${t('submissions:toasts.error', { message: e?.message || e })}`),
  })

  useEffect(() => {
    const root = listRootRef.current
    const target = sentinelRef.current
    if (!root || !target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (!selectedLandingIdRef.current) return
        if (!hasMoreRef.current) return
        if (loadingInitialRef.current || loadingMoreRef.current) return
        if (computedTakeRef.current >= 200) return
        setPage((p) => p + 1)
      },
      { root, rootMargin: '200px', threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [selectedLandingId, hasMore, loadingInitial, loadingMore, computedTake])

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="grid gap-2.5 md:grid-cols-3">
          <EntitySelectField
            label={t('submissions:filters.clientLabel')}
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={clientsLoading}
            id="submissions-client-select"
            name="submissions-client-select"
            placeholder={t('submissions:filters.clientPlaceholder')}
            options={clients}
            helperText={clientsError}
            ariaLabel={t('submissions:filters.clientAriaLabel')}
          />

          <EntitySelectField
            label={t('submissions:filters.landingLabel')}
            value={selectedLandingId}
            onChange={(e) => {
              setSelectedLandingId(e.target.value)
              resetSubmissionState()
            }}
            disabled={!selectedClientId || landingsLoading}
            id="submissions-landing-select"
            name="submissions-landing-select"
            placeholder={t('submissions:filters.landingPlaceholder')}
            options={landings}
            helperText={landingsError}
            ariaLabel={t('submissions:filters.landingAriaLabel')}
          />

          <SelectField
            label={t('submissions:filters.pageSizeLabel')}
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10))
              resetSubmissionState()
            }}
            id="submissions-page-size-select"
            name="submissions-page-size-select"
          >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
          </SelectField>
        </div>

      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex h-[68vh] min-h-[460px] flex-col space-y-3">
          <div className="text-sm font-semibold text-[var(--text)]">{t('submissions:list.title')}</div>
          <div className="text-xs text-[var(--muted)]">
            {!selectedLandingId ? t('submissions:list.noSelectionCount') : t('submissions:list.count', { count: submissions.length })}
          </div>

          <div ref={listRootRef} className="min-h-0 flex-1 space-y-2 overflow-auto">
            {!selectedLandingId ? (
              <EmptyFeedback>{t('submissions:states.selectLanding')}</EmptyFeedback>
            ) : loadingInitial ? (
              <LoadingFeedback message={t('submissions:states.loading')} />
            ) : submissionsError ? (
              <ErrorFeedback
                message={submissionsError}
                onRetry={() => setRefreshKey((k) => k + 1)}
                retryLabel={t('common:actions.retry')}
              />
            ) : submissions.length === 0 ? (
              <EmptyFeedback>{t('submissions:states.empty')}</EmptyFeedback>
            ) : (
              <>
                <div className="space-y-2">
                  {submissions.map((s) => {
                    const isSelected = selectedSubmissionId === s.id
                    return (
                      <button
                        key={s.id}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-[color:color-mix(in_srgb,var(--accent)_35%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,white)]'
                            : 'border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] hover:bg-[color:color-mix(in_srgb,var(--bg)_86%,white)]'
                        }`}
                        onClick={() => setSelectedSubmissionId((prev) => (prev === s.id ? null : s.id))}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-[var(--text)]">{s.name || s.email || t('submissions:list.unnamed')}</div>
                          <div className="text-xs text-[var(--muted)]">{fmt(s.createdAt, dateLocale)}</div>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {t('submissions:list.formReference', { id: s.formId })}{' '}
                          {s.form?.name ? ` • ${s.form.name}` : ''}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{s.message || ''}</div>
                      </button>
                    )
                  })}
                </div>
                <div ref={sentinelRef} className="h-1" />
                {loadingMore && (
                  <div className="flex items-center justify-center py-2 text-sm text-[var(--muted)]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
                    <span className="sr-only">{t('submissions:states.loadingMore')}</span>
                  </div>
                )}
                {!hasMore && <div className="pb-2 text-center text-xs text-[var(--muted)]">{t('submissions:states.endOfResults')}</div>}
              </>
            )}
          </div>
        </Card>

        <Card className="space-y-3 md:h-[68vh] md:overflow-auto">
          <div className="text-sm font-semibold text-[var(--text)]">{t('submissions:detail.title')}</div>
          {!selected ? (
            <div className="text-sm text-[var(--muted)]">{t('submissions:detail.empty')}</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3 text-[var(--text)]">
                <div className="text-xs text-[var(--muted)]">{t('submissions:detail.idsTitle')}</div>
                <div className="mt-1 text-xs">
                  {t('submissions:detail.submissionId')}: <span className="font-mono">{selected.id}</span>
                </div>
                <div className="text-xs">
                  {t('submissions:detail.landingId')}: <span className="font-mono">{selected.landingId}</span>
                </div>
                <div className="text-xs">
                  {t('submissions:detail.formId')}: <span className="font-mono">{selected.formId}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3 text-[var(--text)]">
                <div className="text-xs text-[var(--muted)]">{t('submissions:detail.fieldsTitle')}</div>
                <div className="mt-1 text-sm">
                  <div>👤 {t('submissions:detail.nameLabel')}: {selected.name || '-'}</div>
                  <div>✉️ {t('submissions:detail.emailLabel')}: {selected.email || '-'}</div>
                  <div>📞 {t('submissions:detail.phoneLabel')}: {selected.phone || '-'}</div>
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">{t('submissions:detail.messageLabel')}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">{selected.message || '-'}</div>
              </div>

              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3 text-[var(--text)]">
                <div className="text-xs text-[var(--muted)]">{t('submissions:detail.rawDataTitle')}</div>
                <pre className="mt-1 max-h-64 overflow-auto rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-2 text-xs text-[var(--text)]">
{JSON.stringify(selected.data || {}, null, 2)}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => mResend.mutate(selected)}
                  disabled={mResend.isPending}
                  title={t('submissions:detail.resendTitle')}
                >
                  {mResend.isPending ? t('submissions:actions.resending') : t('submissions:actions.resend')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
