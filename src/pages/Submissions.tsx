import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useReadOnlySupportText, useRoleAccess } from '../auth/permissions'
import { Form, getLanding, listLandings, listSubmissions, submitForm, Submission } from '../lib/api'
import normalizeSearchValue from '../lib/normalizeSearchValue'
import { getLanguageDateLocale } from '../i18n'
import useClientsOptions from '../hooks/useClientsOptions'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import EntitySelectField from '../ui/EntitySelectField'
import { EmptyFeedback, ErrorFeedback, LoadingFeedback } from '../ui/Feedback'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import PaginationControls from '../ui/PaginationControls'
import Toast from '../ui/Toast'

const MAX_SUBMISSIONS_WINDOW = 200
const SUBMISSIONS_PAGE_SIZE = 24

function fmt(ts: string, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale)
  } catch {
    return ts
  }
}

function getSubmissionSearchText(submission: Submission) {
  return normalizeSearchValue(
    [
      submission.id,
      submission.name,
      submission.email,
      submission.phone,
      submission.message,
      submission.formId,
      submission.form?.name,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

function SubmissionDetailContent({
  submission,
  dateLocale,
  isSupport,
  readOnlyText,
  resendPending,
  onResend,
  t,
}: {
  submission: Submission
  dateLocale: string
  isSupport: boolean
  readOnlyText: ReturnType<typeof useReadOnlySupportText>
  resendPending: boolean
  onResend: () => void
  t: (key: string, options?: any) => string
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-4 text-[var(--text)]">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t('submissions:detail.idsTitle')}</div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.submissionId')}:</span>{' '}
                <span className="font-mono text-xs font-semibold text-[var(--text)]">{submission.id}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.landingId')}:</span>{' '}
                <span className="font-mono text-xs font-semibold text-[var(--text)]">{submission.landingId}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.formId')}:</span>{' '}
                <span className="font-mono text-xs font-semibold text-[var(--text)]">{submission.formId}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.createdAtLabel')}:</span>{' '}
                <span className="font-medium text-[var(--text)]">{fmt(submission.createdAt, dateLocale)}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.deliveredAtLabel')}:</span>{' '}
                <span className="font-medium text-[var(--text)]">
                  {submission.deliveredAt ? fmt(submission.deliveredAt, dateLocale) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-4 text-[var(--text)]">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t('submissions:detail.fieldsTitle')}</div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.nameLabel')}:</span>{' '}
                <span className="font-medium text-[var(--text)]">{submission.name || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.emailLabel')}:</span>{' '}
                <span className="font-medium text-[var(--text)]">{submission.email || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.phoneLabel')}:</span>{' '}
                <span className="font-medium text-[var(--text)]">{submission.phone || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--muted)]">{t('submissions:detail.messageLabel')}:</span>
                <div className="mt-1 whitespace-pre-wrap rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {submission.message || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-4 text-[var(--text)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t('submissions:detail.rawDataTitle')}</div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">{submission.form?.name || t('submissions:list.formReference', { id: submission.formId })}</div>
          </div>
          <pre className="mt-4 max-h-[58vh] overflow-auto rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-3 text-xs text-[var(--text)]">
{JSON.stringify(submission.data || {}, null, 2)}
          </pre>
          {isSupport ? <div className="mt-3 text-xs text-[var(--muted)]">{readOnlyText.sectionHint}</div> : null}
          <div className="mt-auto flex justify-end border-t border-[color:color-mix(in_srgb,var(--text)_10%,white)] pt-4">
            <Button
              onClick={onResend}
              disabled={isSupport || resendPending}
              title={isSupport ? readOnlyText.actionTitle : t('submissions:detail.resendTitle')}
            >
              {resendPending ? t('submissions:actions.resending') : t('submissions:actions.resend')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Submissions() {
  const { t, i18n } = useTranslation(['submissions', 'common'])
  const { isSupport } = useRoleAccess()
  const readOnlyText = useReadOnlySupportText()
  const { clients, clientsLoading, clientsError } = useClientsOptions()
  const [selectedClientId, setSelectedClientId] = useState('')

  const [landings, setLandings] = useState<Array<{ id: string; name: string; clientId: string; createdAt: string }>>([])
  const [landingsLoading, setLandingsLoading] = useState(false)
  const [landingsError, setLandingsError] = useState<string | null>(null)
  const [selectedLandingId, setSelectedLandingId] = useState('')
  const [forms, setForms] = useState<Form[]>([])
  const [formsLoading, setFormsLoading] = useState(false)
  const [formsError, setFormsError] = useState<string | null>(null)
  const [selectedFormId, setSelectedFormId] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [page, setPage] = useState(1)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsError, setSubmissionsError] = useState<string | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [toast, setToast] = useState<string | null>(null)

  const submissionsRequestIdRef = useRef(0)
  const landingsRequestIdRef = useRef(0)
  const formsRequestIdRef = useRef(0)
  const lastTriggerRef = useRef<HTMLElement | null>(null)
  const dateLocale = getLanguageDateLocale(i18n.resolvedLanguage || i18n.language)
  const selected = useMemo(
    () => submissions.find((s) => s.id === selectedSubmissionId) || null,
    [submissions, selectedSubmissionId],
  )
  const totalLoadedCount = submissions.length
  const isTotalKnown = totalLoadedCount < MAX_SUBMISSIONS_WINDOW
  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchInput)
    return submissions.filter((submission) => {
      if (selectedFormId && submission.formId !== selectedFormId) return false
      if (!normalizedQuery) return true
      return getSubmissionSearchText(submission).includes(normalizedQuery)
    })
  }, [searchInput, selectedFormId, submissions])
  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / SUBMISSIONS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * SUBMISSIONS_PAGE_SIZE
  const visibleSubmissions = filteredSubmissions.slice(pageStart, pageStart + SUBMISSIONS_PAGE_SIZE)
  const pageRangeStart = filteredSubmissions.length ? pageStart + 1 : 0
  const pageRangeEnd = Math.min(pageStart + SUBMISSIONS_PAGE_SIZE, filteredSubmissions.length)

  const resetSubmissionState = () => {
    setPage(1)
    setSubmissions([])
    setSubmissionsError(null)
    setSelectedSubmissionId(null)
    setIsDetailOpen(false)
  }

  useEffect(() => {
    landingsRequestIdRef.current += 1
    formsRequestIdRef.current += 1
    submissionsRequestIdRef.current += 1
    setSelectedLandingId('')
    setSelectedFormId('')
    setForms([])
    setFormsError(null)
    setLandings([])
    setLandingsError(null)
    setSearchInput('')
    setLoadingInitial(false)
    resetSubmissionState()

    if (!selectedClientId) {
      setLandingsLoading(false)
      setFormsLoading(false)
      return
    }

    const requestId = landingsRequestIdRef.current
    setLandingsLoading(true)

    listLandings({ clientId: selectedClientId, take: 200 })
      .then((res) => {
        if (requestId !== landingsRequestIdRef.current) return
        setLandings(res.landings || [])
      })
      .catch((e: any) => {
        if (requestId !== landingsRequestIdRef.current) return
        setLandingsError(e?.message || t('submissions:states.loadLandingsError'))
      })
      .finally(() => {
        if (requestId !== landingsRequestIdRef.current) return
        setLandingsLoading(false)
      })
  }, [selectedClientId, t])

  useEffect(() => {
    formsRequestIdRef.current += 1
    setSelectedFormId('')
    setForms([])
    setFormsError(null)
    setSearchInput('')
    setFormsLoading(false)
    resetSubmissionState()

    if (!selectedLandingId) return

    const formsRequestId = formsRequestIdRef.current
    setFormsLoading(true)
    getLanding(selectedLandingId)
      .then((landing) => {
        if (formsRequestId !== formsRequestIdRef.current) return
        setForms(landing.forms || [])
      })
      .catch((e: any) => {
        if (formsRequestId !== formsRequestIdRef.current) return
        setFormsError(e?.message || t('submissions:states.loadFormsError'))
      })
      .finally(() => {
        if (formsRequestId !== formsRequestIdRef.current) return
        setFormsLoading(false)
      })
  }, [selectedLandingId, t])

  useEffect(() => {
    submissionsRequestIdRef.current += 1
    if (!selectedLandingId) {
      setLoadingInitial(false)
      return
    }

    const requestId = submissionsRequestIdRef.current
    setSubmissionsError(null)
    setLoadingInitial(true)

    listSubmissions({ landingId: selectedLandingId, take: MAX_SUBMISSIONS_WINDOW })
      .then((rows) => {
        if (requestId !== submissionsRequestIdRef.current) return
        setSubmissions(rows)
      })
      .catch((e: any) => {
        if (requestId !== submissionsRequestIdRef.current) return
        setSubmissionsError(e?.message || t('submissions:states.loadError'))
      })
      .finally(() => {
        if (requestId !== submissionsRequestIdRef.current) return
        setLoadingInitial(false)
      })
  }, [selectedLandingId, refreshKey, t])

  useEffect(() => {
    setPage(1)
  }, [selectedFormId, searchInput])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    if (selectedSubmissionId && !submissions.some((submission) => submission.id === selectedSubmissionId)) {
      setSelectedSubmissionId(null)
      setIsDetailOpen(false)
    }
  }, [selectedSubmissionId, submissions])

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

  const openSubmissionDetails = (submissionId: string, trigger?: HTMLElement | null) => {
    if (trigger) lastTriggerRef.current = trigger
    setSelectedSubmissionId(submissionId)
    setIsDetailOpen(true)
  }

  const closeSubmissionDetails = () => {
    setIsDetailOpen(false)
  }

  const pageLabel = isTotalKnown
    ? t('submissions:pagination.pageLabelKnown', { page: currentPage, total: totalPages })
    : t('submissions:pagination.pageLabelLoaded', { page: currentPage, total: totalPages })

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-col gap-1">

          <div className="text-sm text-[var(--muted)]">
            {!selectedLandingId
              ? t('submissions:list.noSelectionCount')
              : searchInput || selectedFormId
                ? t('submissions:list.filteredCount', { visible: filteredSubmissions.length, count: submissions.length })
                : isTotalKnown
                  ? t('submissions:list.count', { count: submissions.length })
                  : t('submissions:list.loadedCount', { count: submissions.length })}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <EntitySelectField
            label={t('submissions:filters.clientLabel')}
            value={selectedClientId}
            onChange={setSelectedClientId}
            disabled={clientsLoading}
            loading={clientsLoading}
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
            onChange={(value) => {
              setSelectedLandingId(value)
              resetSubmissionState()
            }}
            disabled={!selectedClientId || landingsLoading}
            loading={landingsLoading}
            id="submissions-landing-select"
            name="submissions-landing-select"
            placeholder={t('submissions:filters.landingPlaceholder')}
            options={landings}
            helperText={landingsError}
            ariaLabel={t('submissions:filters.landingAriaLabel')}
          />

          <EntitySelectField
            label={t('submissions:filters.formLabel')}
            value={selectedFormId}
            onChange={setSelectedFormId}
            disabled={!selectedLandingId || formsLoading}
            loading={formsLoading}
            id="submissions-form-select"
            name="submissions-form-select"
            placeholder={t('submissions:filters.formPlaceholder')}
            options={forms.map((form) => ({ id: form.id, name: form.name, description: form.id }))}
            helperText={formsError}
            ariaLabel={t('submissions:filters.formAriaLabel')}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[var(--text)]">{t('submissions:list.title')}</div>
            {selectedLandingId && filteredSubmissions.length > 0 ? (
              <div className="text-xs text-[var(--muted)]">
                {t('submissions:list.resultsRange', {
                  from: pageRangeStart,
                  to: pageRangeEnd,
                  total: filteredSubmissions.length,
                })}
              </div>
            ) : null}
          </div>

          <div className="w-full max-w-xl">
            <div className="mb-1 text-xs text-[var(--muted)]">{t('submissions:search.label')}</div>
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('submissions:search.placeholder')}
              aria-label={t('submissions:search.ariaLabel')}
              disabled={!selectedLandingId || loadingInitial}
            />
          </div>

        </div>

        {!isTotalKnown && selectedLandingId && !loadingInitial && !submissionsError && submissions.length > 0 ? (
          <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[color:color-mix(in_srgb,var(--bg)_62%,white)] px-3 py-2 text-xs text-[var(--muted)]">
            {t('submissions:pagination.loadedHint', { count: MAX_SUBMISSIONS_WINDOW })}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-4 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:grid">
            <div>{t('submissions:list.headers.contact')}</div>
            <div>{t('submissions:list.headers.form')}</div>
            <div>{t('submissions:list.headers.message')}</div>
            <div className="text-right">{t('submissions:list.headers.status')}</div>
          </div>

          <div className="divide-y divide-[var(--border)]">
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
            ) : filteredSubmissions.length === 0 ? (
              <EmptyFeedback>{t('submissions:list.noResults')}</EmptyFeedback>
            ) : (
              visibleSubmissions.map((submission) => {
                const isSelected = selectedSubmissionId === submission.id
                return (
                  <button
                    key={submission.id}
                    type="button"
                    title={t('submissions:list.openDetail')}
                    onClick={(event) => openSubmissionDetails(submission.id, event.currentTarget)}
                    className={`w-full px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] ${
                      isSelected
                        ? 'bg-[color:color-mix(in_srgb,var(--accent)_10%,white)]'
                        : 'bg-[var(--surface)] hover:bg-[color:color-mix(in_srgb,var(--bg)_84%,white)]'
                    }`}
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--text)]">
                          {submission.name || submission.email || t('submissions:list.unnamed')}
                        </div>
                        <div className="mt-1 space-y-1 text-xs text-[var(--muted)]">
                          <div className="truncate">{submission.email || '-'}</div>
                          <div className="truncate">{submission.phone || '-'}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[var(--text)]">
                          {submission.form?.name || t('submissions:list.formReference', { id: submission.formId })}
                        </div>
                        <div className="mt-1 truncate font-mono text-xs text-[var(--muted)]">{submission.formId}</div>
                      </div>

                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm text-[var(--text)]">{submission.message || '-'}</div>
                      </div>

                      <div className="space-y-2 text-left lg:text-right">
                        <div className="text-sm text-[var(--text)]">{fmt(submission.createdAt, dateLocale)}</div>
                        <div className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_70%,white)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                          {submission.deliveredAt ? t('submissions:list.deliveryDelivered') : t('submissions:list.deliveryPending')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {selectedLandingId && !loadingInitial && !submissionsError && filteredSubmissions.length > 0 ? (
          <PaginationControls
            pageLabel={pageLabel}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            previousDisabled={currentPage <= 1}
            nextDisabled={currentPage >= totalPages}
            previousLabel={t('submissions:actions.previousPage')}
            nextLabel={t('submissions:actions.nextPage')}
          />
        ) : null}
      </Card>

      <Modal
        isOpen={isDetailOpen && Boolean(selected)}
        title={selected?.name || selected?.email || t('submissions:detail.modalTitle')}
        onClose={closeSubmissionDetails}
        returnFocusRef={lastTriggerRef}
      >
        {selected ? (
          <SubmissionDetailContent
            submission={selected}
            dateLocale={dateLocale}
            isSupport={isSupport}
            readOnlyText={readOnlyText}
            resendPending={mResend.isPending}
            onResend={() => mResend.mutate(selected)}
            t={t}
          />
        ) : null}
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
