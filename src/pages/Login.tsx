import Button from '../ui/Button'
import { useAuth } from '../auth/useAuth'

export default function Login() {
  const { authLoginUrl, status, error, refresh } = useAuth()
  const bannerMessage =
    status === 'forbidden'
      ? 'No autorizado / rol no asignado'
      : error

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-8 shadow-[0_10px_28px_rgba(15,23,42,0.09)]">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Acceso solo para usuarios autorizados</p>
        {bannerMessage && (
          <div className="mt-4 rounded-xl border border-[color:color-mix(in_srgb,var(--danger)_24%,white)] bg-[color:color-mix(in_srgb,var(--danger)_9%,white)] p-3 text-sm text-[color:color-mix(in_srgb,var(--danger)_72%,black)]">
            <p>{bannerMessage}</p>
          </div>
        )}
        <Button
          className="mt-6 w-full"
          onClick={() => {
            window.location.href = authLoginUrl
          }}
        >
          Continuar con Google
        </Button>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Si no tienes acceso, pide al administrador que te dé de alta en Supabase.
        </p>
        {error && (
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-3 text-xs font-medium text-[color:color-mix(in_srgb,var(--accent)_78%,var(--text))] hover:underline"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
