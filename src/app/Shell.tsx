import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, PanelsTopLeft, Inbox, History, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react'
import { cx } from '../lib/cx'
import { useAuth } from '../auth/useAuth'
import { getAuditUnreadCount } from '../lib/api'

const SIDEBAR_COLLAPSED_KEY = 'landing-admin.sidebar-collapsed'

function Item({
  to,
  icon: Icon,
  label,
  badgeCount,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: any
  label: string
  badgeCount?: number
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const hasBadge = (badgeCount ?? 0) > 0
  const badgeLabel = badgeCount && badgeCount > 99 ? '99+' : String(badgeCount ?? 0)

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      aria-label={label}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)]',
          collapsed ? 'justify-center' : 'gap-3',
          isActive
            ? 'bg-[color:color-mix(in_srgb,var(--accent)_15%,white)] text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_24%,white)]'
            : 'text-[color:color-mix(in_srgb,var(--text)_68%,white)] hover:bg-[color:color-mix(in_srgb,var(--accent)_8%,white)] hover:text-[var(--text)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              'absolute bottom-2 left-1 top-2 w-[3px] rounded-full transition-all duration-200 ease-out',
              isActive ? 'bg-[var(--accent)] opacity-100' : 'bg-[var(--accent)] opacity-0 group-hover:opacity-45',
            )}
          />
          <Icon size={17} strokeWidth={1.9} />
          {!collapsed && <span className="truncate">{label}</span>}
          {hasBadge && (
            <span
              className={cx(
                'inline-flex min-w-6 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                isActive
                  ? 'border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_12%,white)] text-[color:color-mix(in_srgb,var(--accent)_78%,var(--text))]'
                  : 'border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[color:color-mix(in_srgb,var(--surface)_94%,white)] text-[var(--text)]',
                collapsed ? 'absolute right-2 top-2' : 'ml-auto',
              )}
            >
              {badgeLabel}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Shell({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { role, user, isStaff, logout, proAuthEnabled } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const blurActiveElement = () => (document.activeElement as HTMLElement)?.blur()
  const shouldUseAuditUserIdFallback = Boolean(user?.userId) && proAuthEnabled !== true
  const auditUnreadCountQuery = useQuery({
    queryKey: ['audit', 'unread-count', user?.userId ?? 'unknown', shouldUseAuditUserIdFallback ? 'user-id' : 'session'],
    queryFn: () =>
      getAuditUnreadCount({
        userId: user?.userId ?? undefined,
        useUserIdFallback: shouldUseAuditUserIdFallback,
      }),
    enabled: Boolean(user?.userId),
    staleTime: 30_000,
    retry: 1,
  })
  const auditUnreadCount = auditUnreadCountQuery.data ?? 0

  useEffect(() => {
    try {
      setIsCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? '1' : '0')
    } catch {}
  }, [isCollapsed])

  useEffect(() => {
    blurActiveElement()
    setIsMobileOpen(false)
    setIsUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileOpen) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        blurActiveElement()
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isMobileOpen])

  useEffect(() => {
    if (!isUserMenuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isUserMenuOpen])

  useEffect(() => {
    if (!isMobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobileOpen])

  const routeTitle = pathname.startsWith('/landings/')
    ? 'Landing Detail'
    : (
      {
        '/': 'Dashboard',
        '/clients': 'Clientes',
        '/landings': 'Landings',
        '/submissions': 'Submissions',
        '/auditoria': 'Auditoría',
        '/settings': 'Ajustes',
      } as Record<string, string>
    )[pathname] ?? 'Dashboard'

  const routeSubtitle = pathname.startsWith('/landings/')
    ? 'Configura formularios, conexión y pruebas de envío'
    : (
      {
        '/': 'Estado general y flujo recomendado',
        '/clients': 'Alta rápida de clientes para nuevas landings',
        '/landings': 'Creación de landings y URLs operativas',
        '/submissions': 'Consulta, detalle y reenvío de envíos',
        '/auditoria': 'Eventos recientes y trazabilidad de cambios',
        '/settings': 'Información de cuenta y sesión',
      } as Record<string, string>
    )[pathname] ?? 'Panel de administración'

  const NavContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) => (
    <>
      <div className={cx('flex items-center', collapsed ? 'justify-center pb-3' : 'justify-between px-2 pb-5')}>
        {!collapsed && (
          <div>
            <div className="text-lg font-semibold tracking-tight text-[var(--text)]">Landing Admin</div>
            <div className="text-xs font-medium text-[var(--muted)]">Supabase API backend</div>
          </div>
        )}
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          onClick={() => {
            blurActiveElement()
            setIsCollapsed((s) => !s)
          }}
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_13%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--accent)_26%,white)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)] md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav className="flex flex-col gap-1.5">
        <Item to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onNavigate={onNavigate} />
        {!isStaff && <Item to="/clients" icon={Users} label="Clientes" collapsed={collapsed} onNavigate={onNavigate} />}
        <Item to="/landings" icon={PanelsTopLeft} label="Landings" collapsed={collapsed} onNavigate={onNavigate} />
        <Item to="/submissions" icon={Inbox} label="Submissions" collapsed={collapsed} onNavigate={onNavigate} />
        <Item
          to="/auditoria"
          icon={History}
          label="Auditoría"
          badgeCount={auditUnreadCount}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>
    </>
  )

  return (
    <div className="h-dvh min-h-dvh overflow-hidden bg-[var(--bg)]">
      <div className="flex h-full min-w-0">
        <aside
          className={cx(
            'hidden h-full border-r border-[color:color-mix(in_srgb,var(--text)_12%,white)] bg-[color:color-mix(in_srgb,var(--surface)_86%,var(--bg))] px-3 py-5 transition-[width,padding] duration-200 ease-out md:block',
            isCollapsed ? 'w-20' : 'w-72 px-4',
          )}
        >
          <NavContent collapsed={isCollapsed} />
        </aside>

        <div
          className={cx(
            'fixed inset-0 z-40 md:hidden',
            isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        >
          <div
            className={cx(
              'absolute inset-0 bg-[color:color-mix(in_srgb,var(--text)_45%,white)]/25 transition-opacity duration-200 ease-out',
              isMobileOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={() => {
              blurActiveElement()
              setIsMobileOpen(false)
            }}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Sidebar navigation"
            className={cx(
              'absolute left-0 top-0 h-full w-[280px] border-r border-[color:color-mix(in_srgb,var(--text)_12%,white)] bg-[var(--surface)] px-4 py-5 shadow-[0_12px_34px_rgba(24,39,75,0.2)] transition-transform duration-200 ease-out',
              isMobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold tracking-tight text-[var(--text)]">Navigation</div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => {
                  blurActiveElement()
                  setIsMobileOpen(false)
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_13%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)]"
              >
                <X size={16} />
              </button>
            </div>
            <NavContent
              onNavigate={() => {
                blurActiveElement()
                setIsMobileOpen(false)
              }}
            />
          </aside>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="border-b border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[color:color-mix(in_srgb,var(--surface)_92%,white)] px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 shadow-[inset_0_-1px_0_0_color-mix(in_srgb,var(--accent)_14%,white)]">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label="Open navigation"
                  onClick={() => {
                    blurActiveElement()
                    setIsMobileOpen(true)
                  }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_13%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--accent)_30%,white)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)] md:hidden"
                >
                  <Menu size={17} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex min-w-0 max-w-full items-center rounded-full border border-[color:color-mix(in_srgb,var(--accent)_35%,white)] bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-1.5 text-xs font-semibold text-[color:color-mix(in_srgb,var(--accent)_80%,var(--text))] sm:px-3.5">
                  <span className="min-w-0 max-w-full truncate overflow-hidden text-ellipsis whitespace-nowrap">{routeTitle}</span>
                </div>
                <p className="mt-1 hidden truncate text-sm text-[var(--muted)] md:block">{routeSubtitle}</p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {role && (
                  <div className="hidden rounded-full border border-[color:color-mix(in_srgb,var(--text)_16%,white)] bg-[color:color-mix(in_srgb,var(--surface)_92%,white)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:inline-flex">
                    {role}
                  </div>
                )}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    onClick={() => {
                      setLogoutError(null)
                      setIsUserMenuOpen((s) => !s)
                    }}
                    className="inline-flex h-11 max-w-[10rem] items-center rounded-full border border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] transition-colors duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--accent)_26%,white)] hover:text-[var(--text)] sm:max-w-[12rem]"
                  >
                    <span className="min-w-0 max-w-full truncate overflow-hidden text-ellipsis whitespace-nowrap">{user?.email || 'Usuario'}</span>
                    {role ? <span className="ml-1 hidden lg:inline">({role})</span> : null}
                  </button>
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[180px] rounded-xl border border-[color:color-mix(in_srgb,var(--text)_14%,white)] bg-[var(--surface)] p-1.5 shadow-[0_10px_26px_rgba(15,23,42,0.14)]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/settings')
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,white)]"
                      >
                        Ajustes
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={isLoggingOut}
                        onClick={async () => {
                          setIsLoggingOut(true)
                          setLogoutError(null)
                          const result = await logout()
                          setIsLoggingOut(false)
                          if (!result.ok) {
                            setLogoutError(result.error || 'No se pudo cerrar sesión.')
                            return
                          }
                          setIsUserMenuOpen(false)
                          navigate('/login')
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,white)] disabled:opacity-60"
                      >
                        {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                      </button>
                      {logoutError && <p className="px-3 pb-1 pt-2 text-xs text-[color:color-mix(in_srgb,var(--danger)_72%,black)]">{logoutError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-4 lg:p-7">{children}</main>
        </div>
      </div>
    </div>
  )
}
