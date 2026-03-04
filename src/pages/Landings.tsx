import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createLanding } from '../lib/api'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'

export default function Landings() {
  const [clientId, setClientId] = useState('')
  const [name, setName] = useState('Landing 1')
  const [last, setLast] = useState<any | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const m = useMutation({
    mutationFn: async () => createLanding(clientId, name),
    onSuccess: (r) => {
      setLast(r)
      setToast(`✅ Landing creada: ${r.landing.name}`)
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const landingId = last?.landing?.id as string | undefined
  const formId = last?.form?.id as string | undefined

  const copy = async (t: string) => {
    await navigator.clipboard.writeText(t)
    setToast('📋 Copiado al portapapeles')
  }

  const formSubmitUrl = useMemo(() => {
    if (!last?.formEndpoint) return null
    return last.formEndpoint as string
  }, [last])

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Landings</div>
        <div className="text-sm text-zinc-400">Crear landings y ver URLs clave para el cliente.</div>
      </div>

      <Card>
        <div className="mb-2 text-sm font-medium">Crear landing</div>
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <div className="mb-1 text-xs text-zinc-400">clientId</div>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Pega aquí el clientId" />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs text-zinc-400">Nombre</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la landing" />
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={() => m.mutate()} disabled={m.isPending || !clientId.trim() || !name.trim()}>
            {m.isPending ? 'Creando…' : 'Crear Landing'}
          </Button>
        </div>
      </Card>

      {last && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium">Resultado</div>
              <div className="text-xs text-zinc-400">Información que debes pasar al cliente.</div>
            </div>
            {landingId && (
              <Link className="text-sm text-zinc-200 underline" to={`/landings/${landingId}`}>
                Abrir detalle →
              </Link>
            )}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Telegram connect URL</div>
              <div className="mt-1 break-all font-mono text-xs">{last.telegramConnectUrl}</div>
              <div className="mt-2 flex gap-2">
                <Button className="bg-zinc-200" onClick={() => copy(last.telegramConnectUrl)}>
                  Copiar
                </Button>
                <a className="text-sm underline" href={last.telegramConnectUrl} target="_blank" rel="noreferrer">
                  Abrir
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Endpoint submit (landing+form)</div>
              <div className="mt-1 break-all font-mono text-xs">{formSubmitUrl}</div>
              <div className="mt-2 flex gap-2">
                {formSubmitUrl && (
                  <Button className="bg-zinc-200" onClick={() => copy(formSubmitUrl)}>
                    Copiar
                  </Button>
                )}
              </div>
              <div className="mt-2 text-xs text-zinc-500">Este endpoint ya incluye el formId.</div>
            </div>
          </div>

          {landingId && formId && (
            <div className="text-xs text-zinc-400">
              landingId: <span className="font-mono">{landingId}</span> • formId:{' '}
              <span className="font-mono">{formId}</span>
            </div>
          )}
        </Card>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
