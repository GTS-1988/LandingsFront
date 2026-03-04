import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { listSubmissions, submitForm, Submission } from '../lib/api'
import { Card } from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString('es-ES')
  } catch {
    return ts
  }
}

export default function Submissions() {
  const [landingId, setLandingId] = useState('')
  const [take, setTake] = useState(50)
  const [toast, setToast] = useState<string | null>(null)
  const [selected, setSelected] = useState<Submission | null>(null)

  const q = useQuery({
    queryKey: ['submissions', landingId, take],
    queryFn: () => listSubmissions({ landingId: landingId.trim() || undefined, take }),
  })

  const rows = q.data || []

  const mResend = useMutation({
    mutationFn: async (s: Submission) => {
      // "Reenviar" = re-post del mismo data al endpoint del formulario (crea una submission nueva)
      const payload = s.data || {}
      return submitForm(s.landingId, s.formId, payload)
    },
    onSuccess: () => {
      setToast('✅ Reenvío (nueva submission) enviado')
      q.refetch()
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const grouped = useMemo(() => {
    // simple grouping by landingId
    const map = new Map<string, Submission[]>()
    for (const s of rows) {
      const k = s.landingId
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(s)
    }
    return map
  }, [rows])

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="grid gap-2.5 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs text-[var(--muted)]">Filtrar por landingId (opcional)</div>
            <Input value={landingId} onChange={(e) => setLandingId(e.target.value)} placeholder="landingId…" />
          </div>
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">take</div>
            <Input
              value={String(take)}
              onChange={(e) => setTake(Math.max(1, Math.min(200, parseInt(e.target.value || '50', 10))))}
              type="number"
              min={1}
              max={200}
            />
          </div>
        </div>

        <div className="text-xs text-[var(--muted)]">
          Backend: GET /admin/submissions?landingId=&take=
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-[var(--text)]">Listado</div>
          <div className="text-xs text-[var(--muted)]">{q.isLoading ? 'Cargando…' : `${rows.length} items`}</div>

          <div className="max-h-[60vh] overflow-auto space-y-2">
            {Array.from(grouped.entries()).map(([lid, items]) => (
              <div
                key={lid}
                className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-2.5"
              >
                <div className="mb-2 text-xs text-[var(--muted)]">
                  landingId: <span className="font-mono">{lid}</span>
                </div>
                <div className="space-y-2">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      className="w-full rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-3 text-left transition hover:bg-[color:color-mix(in_srgb,var(--bg)_86%,white)]"
                      onClick={() => setSelected(s)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-[var(--text)]">{s.name || s.email || '(sin nombre)'}</div>
                        <div className="text-xs text-[var(--muted)]">{fmt(s.createdAt)}</div>
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        formId: <span className="font-mono">{s.formId}</span>
                        {s.form?.name ? ` • ${s.form.name}` : ''}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{s.message || ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="text-sm font-semibold text-[var(--text)]">Detalle</div>
          {!selected ? (
            <div className="text-sm text-[var(--muted)]">Selecciona una submission del listado.</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">IDs</div>
                <div className="mt-1 text-xs">
                  submissionId: <span className="font-mono">{selected.id}</span>
                </div>
                <div className="text-xs">
                  landingId: <span className="font-mono">{selected.landingId}</span>
                </div>
                <div className="text-xs">
                  formId: <span className="font-mono">{selected.formId}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">Campos</div>
                <div className="mt-1 text-sm">
                  <div>👤 {selected.name || '-'}</div>
                  <div>✉️ {selected.email || '-'}</div>
                  <div>📞 {selected.phone || '-'}</div>
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">Mensaje</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">{selected.message || '-'}</div>
              </div>

              <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
                <div className="text-xs text-[var(--muted)]">data (raw)</div>
                <pre className="mt-1 max-h-64 overflow-auto rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-2 text-xs">
{JSON.stringify(selected.data || {}, null, 2)}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => mResend.mutate(selected)}
                  disabled={mResend.isPending}
                  title="Reenvía creando una nueva submission con el mismo payload"
                >
                  {mResend.isPending ? 'Reenviando…' : 'Reenviar (nueva submission)'}
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
