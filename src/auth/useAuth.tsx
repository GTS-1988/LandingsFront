import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, abortPendingApiFetchRequests, apiFetch, getAuthLoginUrl } from '../lib/api'

export type AuthStatus = 'loading' | 'authed' | 'guest' | 'forbidden'
export type AuthRole = 'admin' | 'staff' | 'support' | null
export type AuthUser = { userId: string; email: string }

type MeResponse = {
  ok: boolean
  user?: AuthUser
  role?: 'admin' | 'staff' | 'support' | null
  proAuthEnabled?: boolean
}

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  role: AuthRole
  proAuthEnabled: boolean | null
  error: string | null
  refresh: () => Promise<void>
  setGuest: () => void
  logout: () => Promise<{ ok: boolean; error?: string }>
  authLoginUrl: string
  isAdmin: boolean
  isStaff: boolean
  isSupport: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<AuthRole>(null)
  const [proAuthEnabled, setProAuthEnabled] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const didRefreshRef = useRef(false)
  const authLoginUrl = getAuthLoginUrl()

  const setGuest = useCallback(() => {
    abortPendingApiFetchRequests()
    setStatus('guest')
    setUser(null)
    setRole(null)
    setProAuthEnabled(null)
    setError(null)
  }, [])

  const runRefresh = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const data = await apiFetch<MeResponse>('/v1/me', { credentials: 'include' })
      setStatus('authed')
      setUser(data.user ?? null)
      setRole(data.role ?? null)
      setProAuthEnabled(data.proAuthEnabled ?? null)
      setError(null)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      if (err instanceof ApiError && err.code === 'UNAUTH') {
        setGuest()
        return
      }
      if (err instanceof ApiError && err.code === 'FORBIDDEN') {
        setStatus('forbidden')
        setUser(null)
        setRole(null)
        setProAuthEnabled(null)
        setError('No autorizado / rol no asignado')
        return
      }
      setGuest()
      setError('Error de conexión. Reintentar.')
    }
  }, [setGuest])

  const refresh = useCallback(async () => {
    await runRefresh()
  }, [runRefresh])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setGuest()
      return { ok: true }
    } catch (err: any) {
      if (err?.name === 'AbortError') return { ok: true }
      if (err instanceof ApiError && err.code === 'UNAUTH') {
        setGuest()
        return { ok: true }
      }
      return { ok: false, error: 'No se pudo cerrar sesión. Intenta nuevamente.' }
    }
  }, [setGuest])

  useEffect(() => {
    if (didRefreshRef.current) return
    didRefreshRef.current = true
    void refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role,
      proAuthEnabled,
      error,
      refresh,
      setGuest,
      logout,
      authLoginUrl,
      isAdmin: role === 'admin',
      isStaff: role === 'staff',
      isSupport: role === 'support',
    }),
    [status, user, role, proAuthEnabled, error, refresh, setGuest, logout, authLoginUrl],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
