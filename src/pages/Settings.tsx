import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { useAuth } from '../auth/useAuth'

export default function Settings() {
  const navigate = useNavigate()
  const { user, role, proAuthEnabled, logout } = useAuth()
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function onLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)
    const result = await logout()
    setIsLoggingOut(false)
    if (!result.ok) {
      setLogoutError(result.error || 'No se pudo cerrar sesión.')
      return
    }
    navigate('/login')
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text)]">Ajustes</h2>
      <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_12%,white)] bg-[var(--surface)] p-4 text-sm text-[var(--text)]">
        <p>
          <strong>Email:</strong> {user?.email || '-'}
        </p>
        <p>
          <strong>Rol:</strong> {role || '-'}
        </p>
        <p>
          <strong>User ID:</strong> {user?.userId || '-'}
        </p>
        <p>
          <strong>PRO auth habilitado:</strong> {String(proAuthEnabled)}
        </p>
      </div>

      <div className="space-y-2">
        <Button type="button" onClick={() => void onLogout()} disabled={isLoggingOut}>
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
        {logoutError && <p className="text-sm text-[color:color-mix(in_srgb,var(--danger)_72%,black)]">{logoutError}</p>}
      </div>
    </section>
  )
}
