import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Settings as SettingsIcon,
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { useAuth } from '../auth/useAuth'
import { getAuditUnreadCount } from '../lib/api'

const SIDEBAR_COLLAPSED_KEY = 'landing-admin.sidebar-collapsed'

function getUserPillLabel(email: string | null | undefined, fallbackLabel: string) {
  if (!email) return fallbackLabel
  const localPart = email.split('@')[0] || email
  const firstSegment = localPart.split(/[._+-]/).find(Boolean) || localPart
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
}

function getUserInitial(email: string | null | undefined, fallbackLabel: string) {
  const label = getUserPillLabel(email, fallbackLabel)
  return label.charAt(0).toUpperCase() || 'U'
}

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
            ? 'bg-[color:color-mix(in_srgb,var(--accent)_15%,var(--surface))] text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_24%,var(--surface))]'
            : 'text-[color:color-mix(in_srgb,var(--text)_68%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--surface))] hover:text-[var(--text)]',
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
                  ? 'border-[color:color-mix(in_srgb,var(--accent)_28%,var(--surface))] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[color:color-mix(in_srgb,var(--accent)_78%,var(--text))]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
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
  const { t } = useTranslation('common')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { role, user, isStaff, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const blurActiveElement = () => (document.activeElement as HTMLElement)?.blur()
  const auditUnreadCountQuery = useQuery({
    queryKey: ['audit', 'unread-count', user?.userId ?? 'unknown'],
    queryFn: () => getAuditUnreadCount(),
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

  const fallbackUserLabel = t('user.fallbackName')

  const routeTitle = pathname.startsWith('/landings/')
    ? t('routes.landingDetail.title')
    : (
      {
        '/': t('routes.dashboard.title'),
        '/clients': t('routes.clients.title'),
        '/landings': t('routes.landings.title'),
        '/submissions': t('routes.submissions.title'),
        '/auditoria': t('routes.audits.title'),
        '/settings': t('routes.settings.title'),
      } as Record<string, string>
    )[pathname] ?? t('routes.dashboard.title')

  const routeSubtitle = pathname.startsWith('/landings/')
    ? t('routes.landingDetail.subtitle')
    : (
      {
        '/': t('routes.dashboard.subtitle'),
        '/clients': t('routes.clients.subtitle'),
        '/landings': t('routes.landings.subtitle'),
        '/submissions': t('routes.submissions.subtitle'),
        '/auditoria': t('routes.audits.subtitle'),
        '/settings': t('routes.settings.subtitle'),
      } as Record<string, string>
    )[pathname] ?? t('routes.dashboard.subtitle')

  const NavContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) => (
    <>
      <div className={cx('flex items-center', collapsed ? 'justify-center pb-3' : 'justify-between px-2 pb-5')}>
        {!collapsed && (
          <div>
            <div className="text-lg font-semibold tracking-tight text-[var(--text)]">Landing Admin</div>
            <div className="text-xs font-medium text-[var(--muted)]">{t('app.backend')}</div>
          </div>
        )}
        <button
          type="button"
          aria-label={collapsed ? t('navigation.expand') : t('navigation.collapse')}
          title={collapsed ? t('navigation.expand') : t('navigation.collapse')}
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
        <Item to="/" icon={LayoutDashboard} label={t('navigation.dashboard')} collapsed={collapsed} onNavigate={onNavigate} />
        {!isStaff && <Item to="/clients" icon={Users} label={t('navigation.clients')} collapsed={collapsed} onNavigate={onNavigate} />}
        <Item to="/landings" icon={PanelsTopLeft} label={t('navigation.landings')} collapsed={collapsed} onNavigate={onNavigate} />
        <Item to="/submissions" icon={Inbox} label={t('navigation.submissions')} collapsed={collapsed} onNavigate={onNavigate} />
        <Item
          to="/auditoria"
          icon={History}
          label={t('navigation.audits')}
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
            'hidden h-full border-r border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-5 transition-[width,padding] duration-200 ease-out md:block',
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
              'absolute inset-0 bg-black/20 transition-opacity duration-200 ease-out',
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
            aria-label={t('navigation.title')}
            className={cx(
              'absolute left-0 top-0 h-full w-[280px] border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 shadow-[0_18px_40px_rgba(var(--shadow-color),0.26)] transition-transform duration-200 ease-out',
              isMobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold tracking-tight text-[var(--text)]">{t('navigation.title')}</div>
              <button
                type="button"
                aria-label={t('navigation.close')}
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
          <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 shadow-[inset_0_-1px_0_0_var(--border)]">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label={t('navigation.open')}
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
                  <div className="hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:inline-flex">
                    {role}
                  </div>
                )}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    title={user?.email || fallbackUserLabel}
                    onClick={() => {
                      setLogoutError(null)
                      setIsUserMenuOpen((s) => !s)
                    }}
                    className="inline-flex h-10 max-w-[9.5rem] items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--text)] transition-colors duration-200 ease-out hover:border-[color:color-mix(in_srgb,var(--accent)_26%,white)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] sm:max-w-[11rem]"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-[11px] font-bold text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))]">
                      {getUserInitial(user?.email, fallbackUserLabel)}
                    </span>
                    <span className="min-w-0 flex-1 truncate overflow-hidden text-ellipsis whitespace-nowrap text-left">
                      {getUserPillLabel(user?.email, fallbackUserLabel)}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cx('shrink-0 text-[var(--muted)] transition-transform duration-200', isUserMenuOpen && 'rotate-180')}
                    />
                  </button>
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+10px)] z-30 w-[224px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_20px_36px_rgba(var(--shadow-color),0.18)]"
                    >
                      <div className="mb-2 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-[var(--accent)]">
                          <UserCircle2 size={18} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--text)]">{user?.email || fallbackUserLabel}</div>
                          <div className="mt-0.5 text-xs text-[var(--muted)]">
                            {role ? t('user.role', { role }) : t('user.activeSession')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/settings')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
                      >
                        <SettingsIcon size={16} className="text-[var(--muted)]" />
                        {t('actions.settings')}
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
                            setLogoutError(result.error || t('actions.logoutError'))
                            return
                          }
                          setIsUserMenuOpen(false)
                          navigate('/login')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] disabled:opacity-60"
                      >
                        <LogOut size={16} className="text-[var(--muted)]" />
                        {isLoggingOut ? t('actions.loggingOut') : t('actions.logout')}
                      </button>
                      {logoutError && (
                        <p className="px-3 pb-1 pt-2 text-xs text-[color:color-mix(in_srgb,var(--danger)_72%,black)]">
                          {logoutError}
                        </p>
                      )}
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
