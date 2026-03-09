import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AuditEvent, listAuditEvents, markAuditEventsAsRead } from '../lib/api'
import { useAuth } from '../auth/useAuth'
import { getLanguageDateLocale } from '../i18n'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import { EmptyFeedback, ErrorFeedback, LoadingFeedback } from '../ui/Feedback'
import Toast from '../ui/Toast'

const INITIAL_TAKE = 50
const SUMMARY_CLAMP_STYLE = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical' as const,
  WebkitLineClamp: 2,
  overflow: 'hidden',
}
const SECONDARY_BUTTON_CLASS =
  'w-full border-[color:color-mix(in_srgb,var(--accent)_14%,var(--border-strong))] bg-[color:color-mix(in_srgb,var(--accent)_6%,var(--surface-soft))] text-[color:color-mix(in_srgb,var(--accent)_72%,var(--text))] shadow-none hover:border-[color:color-mix(in_srgb,var(--accent)_22%,var(--border-strong))] hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-soft))] hover:text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_38%,white)] sm:w-auto'
const ACTIVE_SECONDARY_BUTTON_CLASS =
  'w-full border-[color:color-mix(in_srgb,var(--accent)_24%,white)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[color:color-mix(in_srgb,var(--accent)_84%,var(--text))] shadow-none hover:border-[color:color-mix(in_srgb,var(--accent)_30%,white)] hover:bg-[color:color-mix(in_srgb,var(--accent)_16%,var(--surface))] hover:text-[var(--text)] focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_42%,white)] sm:w-auto'
type Translate = (key: string, options?: Record<string, unknown>) => string

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

function truncate(value: string, max = 96) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function fmtDate(value: string | null | undefined, language: string) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString(getLanguageDateLocale(language))
  } catch {
    return value
  }
}

function shortenReference(value?: string | null) {
  if (!value) return '-'
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

function getEventType(event: AuditEvent) {
  return event.eventType || event.event_type || '-'
}

function getEntityTable(event: AuditEvent) {
  return event.entityTable || event.entity_table || '-'
}

function getEntityId(event: AuditEvent) {
  return event.entityId || event.entity_id || null
}

function getCreatedAt(event: AuditEvent) {
  return event.createdAt || event.created_at || null
}

function getMetadataValue(metadata: Record<string, unknown> | null, ...keys: string[]) {
  for (const key of keys) {
    const value = normalizeValue(metadata?.[key])
    if (value) return value
  }
  return null
}

function getFormId(event: AuditEvent, metadata: Record<string, unknown> | null) {
  return (
    getMetadataValue(metadata, 'form_id', 'formId') ||
    getMetadataValue(asRecord(metadata?.form), 'id')
  )
}

function getClientLandingLabel(event: AuditEvent) {
  const metadata = asRecord(event.metadata)
  const clientLabel =
    normalizeValue(event.client?.name) ||
    normalizeValue(metadata?.clientName) ||
    normalizeValue(metadata?.clientLabel) ||
    normalizeValue(event.clientId) ||
    normalizeValue(event.client_id)
  const landingLabel =
    normalizeValue(event.landing?.name) ||
    normalizeValue(metadata?.landingName) ||
    normalizeValue(metadata?.landingLabel) ||
    normalizeValue(event.landingId) ||
    normalizeValue(event.landing_id)

  if (clientLabel && landingLabel) return `${clientLabel} / ${landingLabel}`
  return clientLabel || landingLabel || '-'
}

function getLocalizedEventType(event: AuditEvent, t: Translate) {
  switch (getEventType(event)) {
    case 'client.created':
      return t('audits:eventTypes.clientCreated')
    case 'landing.created':
      return t('audits:eventTypes.landingCreated')
    case 'submission.created':
      return t('audits:eventTypes.submissionCreated')
    default:
      return t('audits:eventTypes.recorded')
  }
}

function buildUnknownEventSummary(event: AuditEvent, metadata: Record<string, unknown> | null, t: Translate) {
  const safePairs = Object.entries(metadata || {})
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .filter(([key]) => !['payload', 'data', 'raw', 'html', 'message'].includes(key))
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${truncate(String(value), 42)}`)

  if (safePairs.length) {
    return {
      primary: truncate(safePairs.join(' · '), 92),
      secondary: getEntityId(event)
        ? t('audits:summary.reference', { reference: shortenReference(getEntityId(event)) })
        : null,
    }
  }

  return {
    primary: t('audits:summary.unknown'),
    secondary: getEntityId(event)
      ? t('audits:summary.reference', { reference: shortenReference(getEntityId(event)) })
      : null,
  }
}

function formatAuditSummary(event: AuditEvent, t: Translate) {
  const metadata = asRecord(event.metadata)
  const eventType = getEventType(event)

  if (eventType === 'client.created') {
    const name = getMetadataValue(metadata, 'name')
    return {
      primary: name
        ? t('audits:summary.clientCreatedWithName', { name: truncate(name, 56) })
        : t('audits:summary.clientCreated'),
      secondary: null,
    }
  }

  if (eventType === 'landing.created') {
    const name = getMetadataValue(metadata, 'name')
    return {
      primary: name
        ? t('audits:summary.landingCreatedWithName', { name: truncate(name, 56) })
        : t('audits:summary.landingCreated'),
      secondary: null,
    }
  }

  if (eventType === 'submission.created') {
    const formId = getFormId(event, metadata)
    const landingId = getMetadataValue(metadata, 'landing_id', 'landingId') || event.landingId || event.landing_id

    return {
      primary: formId
        ? `${t('audits:summary.submissionCreated')} · ${t('audits:summary.submissionForm', { reference: shortenReference(formId) })}`
        : t('audits:summary.submissionCreated'),
      secondary: landingId
        ? t('audits:summary.landingReference', { reference: shortenReference(landingId) })
        : null,
    }
  }

  return buildUnknownEventSummary(event, metadata, t)
}

function getEmptyMessage(showingHistory: boolean, t: Translate) {
  return showingHistory ? t('audits:states.emptyHistory') : t('audits:states.emptyUnread')
}

function getStatusLabel(showingHistory: boolean, t: Translate) {
  return showingHistory ? t('audits:status.showingHistory') : t('audits:status.showingUnread')
}

export default function Audits() {
  const { t, i18n } = useTranslation(['audits', 'common'])
  const { user, proAuthEnabled } = useAuth()
  const queryClient = useQueryClient()
  const requestIdRef = useRef(0)
  const markedBatchRef = useRef<string | null>(null)
  const unreadEventsRef = useRef<AuditEvent[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasMarkedInitialBatch, setHasMarkedInitialBatch] = useState(false)
  const [showingHistory, setShowingHistory] = useState(false)

  const shouldUseUserIdFallback = Boolean(user?.userId) && proAuthEnabled !== true

  const refreshUnreadBadge = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['audit', 'unread-count'] })
  }, [queryClient])

  const loadInitialUnread = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    setEvents([])
    setHasMarkedInitialBatch(false)

    try {
      const response = await listAuditEvents({
        take: INITIAL_TAKE,
        unreadOnly: true,
        userId: user?.userId ?? undefined,
        useUserIdFallback: shouldUseUserIdFallback,
      })

      if (requestId !== requestIdRef.current) return

      const nextEvents = response.events || []
      unreadEventsRef.current = nextEvents
      setEvents(nextEvents)
      setShowingHistory(false)

      if (!nextEvents.length) {
        setHasMarkedInitialBatch(true)
        void refreshUnreadBadge()
        return
      }

      const eventIds = nextEvents.map(({ id }) => id).filter(Boolean)
      const batchKey = eventIds.join(',')

      if (!eventIds.length || markedBatchRef.current === batchKey) {
        setHasMarkedInitialBatch(true)
        void refreshUnreadBadge()
        return
      }

      markedBatchRef.current = batchKey

      try {
        await markAuditEventsAsRead(eventIds, {
          userId: user?.userId ?? undefined,
          useUserIdFallback: shouldUseUserIdFallback,
        })
      } catch (markError: any) {
        if (requestId !== requestIdRef.current) return
        setToast(markError?.message || t('audits:states.markReadError'))
      }

      if (requestId !== requestIdRef.current) return
      setHasMarkedInitialBatch(true)
      void refreshUnreadBadge()
    } catch (loadError: any) {
      if (requestId !== requestIdRef.current) return
      setError(loadError?.message || t('audits:states.loadError'))
      setHasMarkedInitialBatch(false)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [refreshUnreadBadge, shouldUseUserIdFallback, t, user?.userId])

  const loadRecentHistory = useCallback(async () => {
    setShowingHistory(true)
    setIsLoadingHistory(true)
    setError(null)

    try {
      const response = await listAuditEvents({
        take: INITIAL_TAKE,
        userId: user?.userId ?? undefined,
        useUserIdFallback: shouldUseUserIdFallback,
      })
      setEvents(response.events || [])
    } catch (historyError: any) {
      setError(historyError?.message || t('audits:states.historyError'))
    } finally {
      setIsLoadingHistory(false)
    }
  }, [shouldUseUserIdFallback, t, user?.userId])

  const restoreUnreadView = useCallback(() => {
    setError(null)
    setShowingHistory(false)
    setEvents(unreadEventsRef.current)
  }, [])

  const retryCurrentMode = useCallback(() => {
    if (showingHistory) {
      void loadRecentHistory()
      return
    }
    void loadInitialUnread()
  }, [loadInitialUnread, loadRecentHistory, showingHistory])

  useEffect(() => {
    void loadInitialUnread()
    return () => {
      requestIdRef.current += 1
    }
  }, [loadInitialUnread])

  return (
    <div className="min-w-0 space-y-5">
      <Card className="min-w-0 space-y-4 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="text-base font-semibold text-[var(--text)]">{t('audits:page.title')}</div>
            <p className="text-sm text-[var(--muted)]">
              {t('audits:page.subtitle')}
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:self-start">
            {showingHistory ? (
              <Button
                type="button"
                onClick={restoreUnreadView}
                className={ACTIVE_SECONDARY_BUTTON_CLASS}
              >
                {t('audits:actions.backToUnread')}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => void loadRecentHistory()}
              disabled={loading || isLoadingHistory}
              className={showingHistory ? ACTIVE_SECONDARY_BUTTON_CLASS : SECONDARY_BUTTON_CLASS}
            >
              {isLoadingHistory ? t('audits:status.loadingHistory') : t('audits:actions.viewRecentHistory')}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
          <div className="text-xs font-medium text-[var(--muted)]">{getStatusLabel(showingHistory, t)}</div>
          {(loading || isLoadingHistory) && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
              {showingHistory ? t('audits:status.loadingHistory') : t('audits:status.updatingTable')}
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <LoadingFeedback message={t('audits:states.loading')} />
          </div>
        ) : error ? (
          <ErrorFeedback message={error} onRetry={retryCurrentMode} retryLabel={t('common:actions.retry')} />
        ) : events.length === 0 ? (
          <EmptyFeedback className="p-4">
            {getEmptyMessage(showingHistory, t)}
          </EmptyFeedback>
        ) : (
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[var(--muted)]">
                {showingHistory
                  ? t('audits:status.showingRecentCount')
                  : hasMarkedInitialBatch
                    ? t('audits:status.initialBatchProcessed')
                    : t('audits:status.recentEventsLoaded')}
              </div>
              {showingHistory && (
                <button
                  type="button"
                  onClick={restoreUnreadView}
                  className="text-xs font-semibold text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)]"
                >
                  {t('audits:actions.backToUnread')}
                </button>
              )}
            </div>
            <div className="-mx-5 overflow-hidden sm:mx-0">
              <div className="w-full max-w-full overflow-x-auto border-y border-[var(--border)] bg-[var(--surface)] sm:rounded-xl sm:border">
                <table className="min-w-[940px] w-full divide-y divide-[var(--border)] text-sm">
                <thead className="bg-[var(--surface-soft)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">{t('audits:table.columns.type')}</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">{t('audits:table.columns.entity')}</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">{t('audits:table.columns.reference')}</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">{t('audits:table.columns.clientLanding')}</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">{t('audits:table.columns.date')}</th>
                    <th className="w-[32%] min-w-[320px] px-3 py-2 text-left font-semibold text-[var(--text)]">{t('audits:table.columns.summary')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                  {events.map((event, index) => {
                    const summary = formatAuditSummary(event, t)

                    return (
                      <tr key={event.id || `${getCreatedAt(event) || 'audit'}-${index}`} className="align-top">
                        <td className="px-3 py-2.5 text-[var(--text)]">
                          <div className="space-y-1">
                            <div className="leading-5" style={SUMMARY_CLAMP_STYLE}>
                              {getLocalizedEventType(event, t)}
                            </div>
                            <div className="font-mono text-[11px] text-[var(--muted)]">{truncate(getEventType(event), 28)}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--muted)]">{getEntityTable(event)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-[var(--muted)]">{shortenReference(getEntityId(event))}</td>
                        <td className="px-3 py-2.5 text-[var(--muted)]">{getClientLandingLabel(event)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--muted)]">{fmtDate(getCreatedAt(event), i18n.resolvedLanguage || 'es')}</td>
                        <td className="px-3 py-2.5 text-[var(--text)]">
                          <div className="space-y-1">
                            <div className="leading-5" style={SUMMARY_CLAMP_STYLE}>
                              {summary.primary}
                            </div>
                            {summary.secondary && (
                              <div className="font-mono text-[11px] text-[var(--muted)]">{truncate(summary.secondary, 52)}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
