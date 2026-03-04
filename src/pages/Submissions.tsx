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
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Submissions</div>
        <div className="text-sm text-zinc-400">Lista y detalle. Reenviar crea una submission nueva (misma data).</div>
      </div>

      <Card className="space-y-2">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs text-zinc-400">Filtrar por landingId (opcional)</div>
            <Input value={landingId} onChange={(e) => setLandingId(e.target.value)} placeholder="landingId…" />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-400">take</div>
            <Input
              value={String(take)}
              onChange={(e) => setTake(Math.max(1, Math.min(200, parseInt(e.target.value || '50', 10))))}
              type="number"
              min={1}
              max={200}
            />
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          Backend: GET /admin/submissions?landingId=&take=
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <div className="text-sm font-medium">Listado</div>
          <div className="text-xs text-zinc-500">{q.isLoading ? 'Cargando…' : `${rows.length} items`}</div>

          <div className="max-h-[60vh] overflow-auto space-y-2">
            {Array.from(grouped.entries()).map(([lid, items]) => (
              <div key={lid} className="rounded-xl border border-zinc-800 p-2">
                <div className="mb-2 text-xs text-zinc-400">
                  landingId: <span className="font-mono">{lid}</span>
                </div>
                <div className="space-y-2">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-left hover:bg-zinc-900/40"
                      onClick={() => setSelected(s)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{s.name || s.email || '(sin nombre)'}</div>
                        <div className="text-xs text-zinc-500">{fmt(s.createdAt)}</div>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        formId: <span className="font-mono">{s.formId}</span>
                        {s.form?.name ? ` • ${s.form.name}` : ''}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400 line-clamp-2">{s.message || ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-2">
          <div className="text-sm font-medium">Detalle</div>
          {!selected ? (
            <div className="text-sm text-zinc-400">Selecciona una submission del listado.</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 p-3">
                <div className="text-xs text-zinc-400">IDs</div>
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

              <div className="rounded-xl border border-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Campos</div>
                <div className="mt-1 text-sm">
                  <div>👤 {selected.name || '-'}</div>
                  <div>✉️ {selected.email || '-'}</div>
                  <div>📞 {selected.phone || '-'}</div>
                </div>
                <div className="mt-2 text-xs text-zinc-400">Mensaje</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{selected.message || '-'}</div>
              </div>

              <div className="rounded-xl border border-zinc-800 p-3">
                <div className="text-xs text-zinc-400">data (raw)</div>
                <pre className="mt-1 max-h-64 overflow-auto rounded-xl bg-black/30 p-2 text-xs">
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
