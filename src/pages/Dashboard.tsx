import { CheckCircle2, Clock3, FileText, Radio, ShieldAlert } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getLanguageDateLocale } from '../i18n'
import { health } from '../lib/api'
import { Card } from '../ui/Card'

type HealthPayload = Record<string, unknown> | null | undefined

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function getFirstString(payload: HealthPayload, keys: string[]) {
  const record = asRecord(payload)
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function getFirstBoolean(payload: HealthPayload, keys: string[]) {
  const record = asRecord(payload)
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') return value
  }
  return null
}

function getFirstDate(payload: HealthPayload, keys: string[]) {
  const value = getFirstString(payload, keys)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatTimestamp(date: Date | null, language: string, fallbackText: string) {
  if (!date) return fallbackText

  const locale = getLanguageDateLocale(language)

  const datePart = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `${datePart} · ${timePart}`
}

function getStatusModel(payload: HealthPayload) {
  const explicitStatus = getFirstString(payload, ['status', 'state'])
  const explicitOk = getFirstBoolean(payload, ['ok', 'healthy', 'connected', 'active'])
  const inferredHealthy = explicitOk ?? (explicitStatus ? /^(ok|healthy|active|connected|up)$/i.test(explicitStatus) : false)
  const label = inferredHealthy
    ? explicitStatus || 'Conectado'
    : explicitStatus || (payload ? 'Revisar estado' : 'Sin datos')

  return {
    healthy: inferredHealthy,
    label,
    timestamp: getFirstDate(payload, ['timestamp', 'updatedAt', 'updated_at', 'checkedAt', 'checked_at']),
    detail: getFirstString(payload, ['message', 'detail', 'service', 'name']),
  }
}

function StatusBadge({ healthy, label }: { healthy: boolean; label: string }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.02em]',
        healthy
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      ].join(' ')}
    >
      <span className={['h-2.5 w-2.5 rounded-full', healthy ? 'bg-emerald-500' : 'bg-rose-500'].join(' ')} aria-hidden="true" />
      {label}
    </span>
  )
}

export default function Dashboard() {
  const { t, i18n } = useTranslation('dashboard')
  const q = useQuery({ queryKey: ['health'], queryFn: health })

  const status = getStatusModel(asRecord(q.data))
  const fallbackUpdatedAt = q.dataUpdatedAt ? new Date(q.dataUpdatedAt) : null
  const lastUpdated = status.timestamp ?? fallbackUpdatedAt
  const healthPreview = !q.data ? t('statusCard.emptyResponse') : JSON.stringify(q.data, null, 2)

  const statusTitle = q.isLoading
    ? t('statusCard.loadingTitle')
    : status.healthy
      ? t('statusCard.healthyTitle')
      : t('statusCard.unhealthyTitle')
  const statusCaption = q.isLoading
    ? t('statusCard.loadingCaption')
    : status.detail || t('statusCard.fallbackCaption')
  const guideSteps = [
    t('guide.steps.step1'),
    t('guide.steps.step2'),
    t('guide.steps.step3'),
    t('guide.steps.step4'),
    t('guide.steps.step5'),
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="min-w-0 overflow-hidden p-0">
          <div className="flex h-full flex-col">
            <div
              className={[
                'flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6',
                status.healthy
                  ? 'border-emerald-100 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)_55%)]'
                  : 'border-rose-100 bg-[linear-gradient(135deg,rgba(244,63,94,0.08),rgba(255,255,255,0)_55%)]',
              ].join(' ')}
            >
              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                      status.healthy
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700',
                    ].join(' ')}
                  >
                    {status.healthy ? <Radio className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t('statusCard.eyebrow')}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-2xl">{statusTitle}</h2>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{statusCaption}</p>
              </div>
              <div className="hidden shrink-0 sm:block">
                <StatusBadge healthy={status.healthy} label={status.healthy ? t('statusCard.badgeHealthy') : t('statusCard.badgeUnhealthy')} />
              </div>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
              <div className="space-y-4">
                <div className="sm:hidden">
                  <StatusBadge healthy={status.healthy} label={status.healthy ? t('statusCard.badgeHealthy') : t('statusCard.badgeUnhealthy')} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('statusCard.currentStatus')}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={[
                          'h-3 w-3 rounded-full shadow-[0_0_0_4px_color-mix(in_srgb,var(--surface)_88%,transparent)]',
                          status.healthy ? 'bg-emerald-500' : 'bg-rose-500',
                        ].join(' ')}
                        aria-hidden="true"
                      />
                      <p className="text-base font-semibold text-[var(--text)]">{status.label}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <Clock3 className="h-4 w-4" />
                      {t('statusCard.updatedAt')}
                    </div>
                    <p className="mt-3 text-base font-semibold text-[var(--text)]">
                      {formatTimestamp(lastUpdated, i18n.resolvedLanguage || 'es', t('statusCard.notAvailable'))}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <FileText className="h-4 w-4" />
                    {t('statusCard.technicalResponse')}
                  </div>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[var(--surface)] p-3 text-xs leading-6 text-[var(--muted)]">
                    {q.isLoading ? t('statusCard.loadingResponse') : healthPreview}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,var(--surface-soft)),var(--surface-soft))] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t('quickRead.eyebrow')}</p>
                <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                    <div className="font-semibold text-[var(--text)]">{t('quickRead.visibilityTitle')}</div>
                    <p className="mt-1 leading-6">{t('quickRead.visibilityText')}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                    <div className="font-semibold text-[var(--text)]">{t('quickRead.actionsTitle')}</div>
                    <p className="mt-1 leading-6">{t('quickRead.actionsText')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
              <FileText className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t('guide.eyebrow')}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--text)]">{t('guide.title')}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t('guide.subtitle')}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{t('guide.sequenceTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t('guide.sequenceText')}</p>
              </div>
              <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
                {t('guide.stepsLabel', { count: guideSteps.length })}
              </span>
            </div>

            <ol className="mt-4 space-y-3">
              {guideSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[color:color-mix(in_srgb,var(--accent)_12%,white)] text-xs font-semibold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 pt-0.5 text-sm leading-6 text-[var(--text)]">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t('guide.summaryEyebrow')}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t('guide.summaryText')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
