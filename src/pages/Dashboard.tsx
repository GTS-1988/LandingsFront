import { CheckCircle2, Clock3, FileText, Radio, ShieldAlert } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { health } from '../lib/api'
import { Card } from '../ui/Card'

type HealthPayload = Record<string, unknown> | null | undefined

const GUIDE_STEPS = [
  'Crea Cliente',
  'Crea Landing (se crea un Form por defecto)',
  'Crea o usa (si existe previamente) un formulario secundario como principal (Opcional)',
  'Comparte con el cliente el Telegram Connect URL y que pulse Start',
  'Testea submissions desde “Landings” o “Submissions”',
]

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

function formatTimestamp(date: Date | null) {
  if (!date) return 'Sin fecha disponible'
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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
    timestamp: getFirstDate(payload, ['updatedAt', 'updated_at', 'timestamp', 'checkedAt', 'checked_at']),
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
      {healthy ? 'Operativo' : 'Atención'}
    </span>
  )
}

export default function Dashboard() {
  const q = useQuery({ queryKey: ['health'], queryFn: health })

  const status = getStatusModel(asRecord(q.data))
  const healthPreview = !q.data ? 'Sin respuesta todavía' : JSON.stringify(q.data, null, 2)

  const statusTitle = q.isLoading ? 'Comprobando estado del sistema' : status.healthy ? 'Sistema activo' : 'Estado requiere revisión'
  const statusCaption = q.isLoading
    ? 'Validando conectividad y disponibilidad.'
    : status.detail || 'Vista rápida del estado general expuesto por /health.'

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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estado del sistema</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-2xl">{statusTitle}</h2>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{statusCaption}</p>
              </div>
              <div className="hidden shrink-0 sm:block">
                <StatusBadge healthy={status.healthy} label={status.label} />
              </div>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
              <div className="space-y-4">
                <div className="sm:hidden">
                  <StatusBadge healthy={status.healthy} label={status.label} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[color:color-mix(in_srgb,var(--bg)_55%,white)] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <CheckCircle2 className="h-4 w-4" />
                      Estado actual
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={[
                          'h-3 w-3 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.85)]',
                          status.healthy ? 'bg-emerald-500' : 'bg-rose-500',
                        ].join(' ')}
                        aria-hidden="true"
                      />
                      <p className="text-base font-semibold text-[var(--text)]">{status.label}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[color:color-mix(in_srgb,var(--bg)_55%,white)] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <Clock3 className="h-4 w-4" />
                      Actualizado
                    </div>
                    <p className="mt-3 text-base font-semibold text-[var(--text)]">{formatTimestamp(status.timestamp)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[color:color-mix(in_srgb,var(--bg)_42%,white)] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <FileText className="h-4 w-4" />
                    Respuesta técnica
                  </div>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[var(--surface)] p-3 text-xs leading-6 text-[var(--muted)]">
                    {q.isLoading ? 'Cargando estado...' : healthPreview}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,248,247,0.72))] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Lectura rápida</p>
                <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
                  <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2.5">
                    <div className="font-semibold text-[var(--text)]">Visibilidad inmediata</div>
                    <p className="mt-1 leading-6">Un vistazo rápido al estado operativo del panel sin salir del dashboard.</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2.5">
                    <div className="font-semibold text-[var(--text)]">Últimas acciones disponibles</div>
                    <p className="mt-1 leading-6">Se notifican y revisan el histórico en la sección de auditorías.</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Guía rápida</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--text)]">Flujo recomendado</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Resumen operativo del recorrido habitual para configurar cliente, landing y recepción de submissions.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[color:color-mix(in_srgb,var(--bg)_45%,white)] p-4">
            <div className="flex items-center justify-between gap-3 border-b border-[color:color-mix(in_srgb,var(--text)_8%,white)] pb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Secuencia sugerida</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Sigue estos pasos para dejar operativa una nueva implementación.</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{GUIDE_STEPS.length} pasos</span>
            </div>

            <ol className="mt-4 space-y-3">
              {GUIDE_STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-xl bg-white/80 px-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[color:color-mix(in_srgb,var(--accent)_12%,white)] text-xs font-semibold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 pt-0.5 text-sm leading-6 text-[var(--text)]">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Resumen</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Cliente y landing son la base. El enlace de Telegram activa la conexión y las pruebas finales se validan desde el área
              de landings o submissions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
