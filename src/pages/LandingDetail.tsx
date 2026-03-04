import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createForm, getLanding, submitForm, updateForm } from '../lib/api'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Toast from '../ui/Toast'

export default function LandingDetail() {
  const { landingId } = useParams()
  const [toast, setToast] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['landing', landingId],
    queryFn: () => getLanding(landingId!),
    enabled: Boolean(landingId),
  })

  const landing = q.data
  const connectUrl = useMemo(() => {
    if (!landing) return ''
    // reconstruimos URL del bot usando el token (en backend también se devuelve en createLanding)
    return landing.telegramConnectToken ? `t.me/<bot>?start=${landing.telegramConnectToken}` : ''
  }, [landing])

  const mCreateForm = useMutation({
    mutationFn: async (payload: { name: string; fields: any[] }) => createForm(landingId!, payload),
    onSuccess: () => {
      q.refetch()
      setToast('✅ Form creado')
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const mUpdateForm = useMutation({
    mutationFn: async (vars: { formId: string; payload: any }) => updateForm(landingId!, vars.formId, vars.payload),
    onSuccess: () => {
      q.refetch()
      setToast('✅ Form actualizado')
    },
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const [newFormName, setNewFormName] = useState('Nuevo formulario')
  const [newFields, setNewFields] = useState(
    JSON.stringify(
      [
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'message', label: 'Mensaje', type: 'textarea', required: false },
      ],
      null,
      2,
    ),
  )

  const [testFormId, setTestFormId] = useState('')
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+34 600 000 000',
        message: 'Hola!',
        website: '',
        pageUrl: 'https://ejemplo.com',
        utm_source: 'postman',
      },
      null,
      2,
    ),
  )

  const mTest = useMutation({
    mutationFn: async () => {
      const body = JSON.parse(testPayload)
      return submitForm(landingId!, testFormId, body)
    },
    onSuccess: (r) => setToast(`✅ Submit OK: ${r?.reason ? r.reason : 'DELIVERED? ' + String(r?.delivered)}`),
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  const copy = async (t: string) => {
    await navigator.clipboard.writeText(t)
    setToast('📋 Copiado')
  }

  if (q.isLoading) return <div className="text-sm text-zinc-400">Cargando…</div>
  if (!landing) return <div className="text-sm text-zinc-400">Landing no encontrada</div>

  const forms = landing.forms || []

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">{landing.name}</div>
        <div className="text-sm text-zinc-400">landingId: <span className="font-mono">{landing.id}</span></div>
      </div>

      <Card className="space-y-2">
        <div className="text-sm font-medium">Estado Telegram</div>
        <div className="text-sm text-zinc-300">
          Destination: {landing.destination ? '✅ Conectado' : '❌ No conectado'}
        </div>
        {!landing.destination && (
          <div className="text-xs text-zinc-500">
            Comparte el deep link con el cliente para conectar el chat.
          </div>
        )}
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Deep link (reconstruido)</div>
          <div className="mt-1 break-all font-mono text-xs">{connectUrl}</div>
          <div className="mt-2 flex gap-2">
            <Button className="bg-zinc-200" onClick={() => copy(connectUrl)}>
              Copiar
            </Button>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Nota: aquí no conocemos el username real del bot, este link es orientativo. Usa el devuelto al crear landing.
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <div className="text-sm font-medium">Formularios ({forms.length})</div>
          <div className="space-y-3">
            {forms.map((f) => (
              <div key={f.id} className="rounded-xl border border-zinc-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-zinc-500">formId: <span className="font-mono">{f.id}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-zinc-200" onClick={() => copy(`${landing.id}/${f.id}`)}>Copiar IDs</Button>
                    <Button
                      onClick={() => {
                        setTestFormId(f.id)
                        setToast('✅ Seleccionado para test')
                      }}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-zinc-400">Campos (JSON)</div>
                <pre className="mt-1 max-h-40 overflow-auto rounded-xl bg-black/30 p-2 text-xs">
{JSON.stringify(f.fields || [], null, 2)}
                </pre>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    className="bg-zinc-200"
                    onClick={() =>
                      mUpdateForm.mutate({
                        formId: f.id,
                        payload: { isActive: !f.isActive },
                      })
                    }
                  >
                    {f.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-2">
          <div className="text-sm font-medium">Crear formulario</div>
          <div className="text-xs text-zinc-500">Backend: POST /admin/landings/:landingId/forms</div>
          <div>
            <div className="mb-1 text-xs text-zinc-400">Nombre</div>
            <Input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-400">Fields (JSON)</div>
            <Textarea value={newFields} onChange={(e) => setNewFields(e.target.value)} rows={10} className="font-mono" />
          </div>
          <Button
            onClick={() => {
              const fields = JSON.parse(newFields)
              mCreateForm.mutate({ name: newFormName, fields })
            }}
            disabled={mCreateForm.isPending}
          >
            {mCreateForm.isPending ? 'Creando…' : 'Crear'}
          </Button>

          <div className="mt-6 border-t border-zinc-800 pt-4 space-y-2">
            <div className="text-sm font-medium">Test submit</div>
            <div className="text-xs text-zinc-500">POST /forms/:landingId/:formId/submit</div>
            <div>
              <div className="mb-1 text-xs text-zinc-400">formId</div>
              <Input value={testFormId} onChange={(e) => setTestFormId(e.target.value)} placeholder="Selecciona un formId" />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-400">Payload (JSON)</div>
              <Textarea value={testPayload} onChange={(e) => setTestPayload(e.target.value)} rows={10} className="font-mono" />
            </div>
            <Button onClick={() => mTest.mutate()} disabled={mTest.isPending || !testFormId.trim()}>
              {mTest.isPending ? 'Enviando…' : 'Enviar test'}
            </Button>
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
