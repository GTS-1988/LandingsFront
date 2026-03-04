import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createClient } from '../lib/api'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'

export default function Clients() {
  const [name, setName] = useState('Cliente ACME')
  const [toast, setToast] = useState<string | null>(null)

  const m = useMutation({
    mutationFn: async () => createClient(name),
    onSuccess: (c) => setToast(`✅ Cliente creado: ${c.name} (id: ${c.id})`),
    onError: (e: any) => setToast(`❌ Error: ${e?.message || e}`),
  })

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">Crear cliente</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            El backend actual no expone listado/edición/borrado.
          </div>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <Button onClick={() => m.mutate()} disabled={m.isPending || !name.trim()}>
            {m.isPending ? 'Creando…' : 'Crear'}
          </Button>
        </div>
        <div className="text-xs text-[var(--muted)]">
          Tip: copia el <span className="font-mono">id</span> para crear una landing.
        </div>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
