import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './Shell'
import Dashboard from '../pages/Dashboard'
import Clients from '../pages/Clients'
import Landings from '../pages/Landings'
import LandingDetail from '../pages/LandingDetail'
import Submissions from '../pages/Submissions'
import Audits from '../pages/Audits'
import Login from '../pages/Login'
import Settings from '../pages/Settings'
import { useAuth } from '../auth/useAuth'

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] p-6">
      <div className="flex items-center gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted)]">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text)_22%,white)] border-t-[var(--accent)]" />
        Cargando sesión...
      </div>
    </div>
  )
}

export default function App() {
  const { status } = useAuth()

  if (status === 'loading') return <LoadingScreen />
  if (status === 'guest' || status === 'forbidden') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/landings" element={<Landings />} />
        <Route path="/landings/:landingId" element={<LandingDetail />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/auditoria" element={<Audits />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
