import { useEffect, useState } from 'react'
import { Client, listClients } from '../lib/api'

export default function useClientsOptions(refreshKey?: number) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    setClientsLoading(true)
    setClientsError(null)

    listClients({ take: 200 })
      .then((res) => {
        if (!isCurrent) return
        setClients(res.clients || [])
      })
      .catch((e: any) => {
        if (!isCurrent) return
        setClientsError(e?.message || 'Error cargando clientes')
      })
      .finally(() => {
        if (!isCurrent) return
        setClientsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [refreshKey])

  return { clients, clientsLoading, clientsError }
}
