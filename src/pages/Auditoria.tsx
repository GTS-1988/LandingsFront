import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuditEvent, listAuditEvents, markAuditEventsAsRead } from '../lib/api'
import { useAuth } from '../auth/useAuth'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import Toast from '../ui/Toast'

const INITIAL_TAKE = 50
const SUMMARY_CLAMP_STYLE = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical' as const,
  WebkitLineClamp: 2,
  overflow: 'hidden',
}
const SECONDARY_BUTTON_CLASS =
  'w-full border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] text-[var(--text)] shadow-none hover:border-[color:color-mix(in_srgb,var(--accent)_22%,white)] hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,white)] hover:text-[var(--text)] focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_38%,white)] sm:w-auto'
const ACTIVE_SECONDARY_BUTTON_CLASS =
  'w-full border-[color:color-mix(in_srgb,var(--accent)_24%,white)] bg-[color:color-mix(in_srgb,var(--accent)_12%,white)] text-[color:color-mix(in_srgb,var(--accent)_84%,var(--text))] shadow-none hover:border-[color:color-mix(in_srgb,var(--accent)_30%,white)] hover:bg-[color:color-mix(in_srgb,var(--accent)_16%,white)] hover:text-[var(--text)] focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_42%,white)] sm:w-auto'

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

function fmtDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('es-ES')
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

function buildUnknownEventSummary(event: AuditEvent, metadata: Record<string, unknown> | null) {
  const safePairs = Object.entries(metadata || {})
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .filter(([key]) => !['payload', 'data', 'raw', 'html', 'message'].includes(key))
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${truncate(String(value), 42)}`)

  if (safePairs.length) {
    return {
      primary: truncate(safePairs.join(' · '), 92),
      secondary: getEntityId(event) ? `Ref. ${shortenReference(getEntityId(event))}` : null,
    }
  }

  return {
    primary: 'Evento registrado',
    secondary: getEntityId(event) ? `Ref. ${shortenReference(getEntityId(event))}` : null,
  }
}

function formatAuditSummary(event: AuditEvent) {
  const metadata = asRecord(event.metadata)
  const eventType = getEventType(event)

  if (eventType === 'client.created') {
    const name = getMetadataValue(metadata, 'name')
    return {
      primary: name ? `Cliente creado: ${truncate(name, 56)}` : 'Cliente creado',
      secondary: null,
    }
  }

  if (eventType === 'landing.created') {
    const name = getMetadataValue(metadata, 'name')
    return {
      primary: name ? `Landing creada: ${truncate(name, 56)}` : 'Landing creada',
      secondary: null,
    }
  }

  if (eventType === 'submission.created') {
    const formId = getFormId(event, metadata)
    const landingId = getMetadataValue(metadata, 'landing_id', 'landingId') || event.landingId || event.landing_id

    return {
      primary: formId
        ? `Nueva submission recibida · Formulario ${shortenReference(formId)}`
        : 'Nueva submission recibida',
      secondary: landingId ? `Landing ${shortenReference(landingId)}` : null,
    }
  }

  return buildUnknownEventSummary(event, metadata)
}

function getEmptyMessage(showingHistory: boolean) {
  return showingHistory ? 'No hay eventos recientes' : 'No hay eventos pendientes de revisar'
}

function getStatusLabel(showingHistory: boolean) {
  return showingHistory ? 'Mostrando historial reciente' : 'Mostrando eventos pendientes de revisar'
}

export default function Auditoria() {
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

      const eventIds = nextEvents.map((event) => event.id).filter(Boolean)
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
        setToast(markError?.message || 'No se pudieron marcar como leídos los eventos cargados.')
      }

      if (requestId !== requestIdRef.current) return
      setHasMarkedInitialBatch(true)
      void refreshUnreadBadge()
    } catch (loadError: any) {
      if (requestId !== requestIdRef.current) return
      setError(loadError?.message || 'Error cargando auditoría')
      setHasMarkedInitialBatch(false)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [refreshUnreadBadge, shouldUseUserIdFallback, user?.userId])

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
      setError(historyError?.message || 'No se pudo cargar el historial reciente.')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [shouldUseUserIdFallback, user?.userId])

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
            <div className="text-base font-semibold text-[var(--text)]">Auditoría</div>
            <p className="text-sm text-[var(--muted)]">
              Se cargan primero los eventos no leídos y se marcan como leídos al entrar en esta sección.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:self-start">
            {showingHistory ? (
              <Button
                type="button"
                onClick={restoreUnreadView}
                className={ACTIVE_SECONDARY_BUTTON_CLASS}
              >
                Volver a no leídas
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => void loadRecentHistory()}
              disabled={loading || isLoadingHistory}
              className={showingHistory ? ACTIVE_SECONDARY_BUTTON_CLASS : SECONDARY_BUTTON_CLASS}
            >
              {isLoadingHistory ? 'Cargando historial…' : 'Ver historial reciente'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--text)_9%,white)] bg-[color:color-mix(in_srgb,var(--bg)_62%,white)] px-3 py-2.5">
          <div className="text-xs font-medium text-[var(--muted)]">{getStatusLabel(showingHistory)}</div>
          {(loading || isLoadingHistory) && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
              {showingHistory ? 'Cargando historial...' : 'Actualizando tabla...'}
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_18%,white)] border-t-[var(--accent)]" />
              Cargando eventos...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
            <div className="text-sm text-[var(--text)]">{error}</div>
            <Button className="mt-3" type="button" onClick={retryCurrentMode}>
              Reintentar
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-4 text-sm text-[var(--muted)]">
            {getEmptyMessage(showingHistory)}
          </div>
        ) : (
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[var(--muted)]">
                {showingHistory
                  ? 'Mostrando los 50 eventos más recientes disponibles.'
                  : hasMarkedInitialBatch
                    ? 'La tanda inicial cargada ya fue procesada para sincronizar su estado de lectura.'
                    : 'Eventos recientes cargados desde auditoría.'}
              </div>
              {showingHistory && (
                <button
                  type="button"
                  onClick={restoreUnreadView}
                  className="text-xs font-semibold text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)]"
                >
                  Volver a no leídas
                </button>
              )}
            </div>
            <div className="-mx-5 overflow-hidden sm:mx-0">
              <div className="w-full max-w-full overflow-x-auto border-y border-[color:color-mix(in_srgb,var(--text)_10%,white)] sm:rounded-xl sm:border">
                <table className="min-w-[940px] w-full divide-y divide-[color:color-mix(in_srgb,var(--text)_10%,white)] text-sm">
                <thead className="bg-[color:color-mix(in_srgb,var(--bg)_72%,white)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Entidad</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Referencia</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Cliente / Landing</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Fecha</th>
                    <th className="w-[32%] min-w-[320px] px-3 py-2 text-left font-semibold text-[var(--text)]">Resumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                  {events.map((event, index) => {
                    const summary = formatAuditSummary(event)

                    return (
                      <tr key={event.id || `${getCreatedAt(event) || 'audit'}-${index}`} className="align-top">
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text)]">{getEventType(event)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--muted)]">{getEntityTable(event)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-[var(--muted)]">{shortenReference(getEntityId(event))}</td>
                        <td className="px-3 py-2.5 text-[var(--muted)]">{getClientLandingLabel(event)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--muted)]">{fmtDate(getCreatedAt(event))}</td>
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
