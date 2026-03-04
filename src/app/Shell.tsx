import { PropsWithChildren, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, PanelsTopLeft, Inbox, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react'
import { cx } from '../lib/cx'

const SIDEBAR_COLLAPSED_KEY = 'landing-admin.sidebar-collapsed'

function Item({
  to,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: any
  label: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
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
        </>
      )}
    </NavLink>
  )
}

export default function Shell({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const blurActiveElement = () => (document.activeElement as HTMLElement)?.blur()

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
      } as Record<string, string>
    )[pathname] ?? 'Panel de administración'

  const breadcrumbLabel = pathname.startsWith('/landings/') ? 'Landings' : routeTitle

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
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_13%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--accent)_26%,white)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)] md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav className="flex flex-col gap-1.5">
        <Item to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onNavigate={onNavigate} />
        <Item to="/clients" icon={Users} label="Clientes" collapsed={collapsed} onNavigate={onNavigate} />
        <Item to="/landings" icon={PanelsTopLeft} label="Landings" collapsed={collapsed} onNavigate={onNavigate} />
        <Item to="/submissions" icon={Inbox} label="Submissions" collapsed={collapsed} onNavigate={onNavigate} />
      </nav>
      <div className={cx('mt-5 rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-3 text-xs', collapsed && 'hidden')}>
        <div className="font-semibold text-[var(--text)]">Auth</div>
        <div className="mt-1 text-[var(--muted)]">`x-admin-key` desde `.env` (frontend)</div>
      </div>
    </>
  )

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)]">
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
          aria-hidden={!isMobileOpen}
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_13%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)]"
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
          <header className="border-b border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[color:color-mix(in_srgb,var(--surface)_92%,white)] px-5 py-4 shadow-[inset_0_-1px_0_0_color-mix(in_srgb,var(--accent)_14%,white)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  aria-label="Open navigation"
                  onClick={() => {
                    blurActiveElement()
                    setIsMobileOpen(true)
                  }}
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--text)_13%,white)] text-[var(--muted)] transition-colors duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--accent)_30%,white)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,white)] md:hidden"
                >
                  <Menu size={17} />
                </button>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    <span>Admin</span>
                    <span className="opacity-60">/</span>
                    <span className="text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))]">{breadcrumbLabel}</span>
                  </div>
                  <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--text)]">{routeTitle}</h1>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">{routeSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_35%,white)] bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-1 text-xs font-semibold text-[color:color-mix(in_srgb,var(--accent)_80%,var(--text))]">
                  {routeTitle}
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-auto p-5 lg:p-7">{children}</main>
        </div>
      </div>
    </div>
  )
}
