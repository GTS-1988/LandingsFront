import { Languages, LogOut, MonitorCog, MoonStar, Palette, ShieldCheck, SunMedium, Type, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useUIPreferences, UIFontSize, UITheme } from '../app/useUIPreferences'
import { AppLanguage, SUPPORTED_LANGUAGE_OPTIONS, changeLanguage, getCurrentLanguage } from '../i18n'
import Button from '../ui/Button'
import { Card } from '../ui/Card'
import SelectField from '../ui/SelectField'
import { cx } from '../lib/cx'

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
        <Icon size={18} strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
    </div>
  )
}

function SegmentedOption<T extends string>({
  value,
  currentValue,
  onSelect,
  label,
  description,
  icon: Icon,
  disabled = false,
  title,
}: {
  value: T
  currentValue: T
  onSelect: (value: T) => void
  label: string
  description: string
  icon?: any
  disabled?: boolean
  title?: string
}) {
  const isActive = value === currentValue

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={() => onSelect(value)}
      aria-pressed={isActive}
      className={cx(
        'flex min-w-0 flex-1 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)] disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border-[color:color-mix(in_srgb,var(--accent)_26%,white)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]',
      )}
    >
      {Icon ? (
        <span
          className={cx(
            'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
            isActive ? 'bg-[color:color-mix(in_srgb,var(--accent)_18%,var(--surface))] text-[var(--accent)]' : 'bg-[var(--surface-soft)] text-[var(--muted)]',
          )}
        >
          <Icon size={16} />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{description}</span>
      </span>
    </button>
  )
}

export default function Settings() {
  const { t } = useTranslation(['settings', 'common'])
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()
  const { theme, fontSize, setTheme, setFontSize } = useUIPreferences()
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const currentLanguage = getCurrentLanguage()

  async function onLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)
    const result = await logout()
    setIsLoggingOut(false)
    if (!result.ok) {
      setLogoutError(result.error || t('settings:session.logoutError'))
      return
    }
    navigate('/login')
  }

  return (
    <section className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t('settings:page.eyebrow')}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">{t('settings:page.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t('settings:page.subtitle')}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-5">
          <Card className="space-y-5">
            <SectionHeader
              icon={Palette}
              title={t('settings:appearance.title')}
              description={t('settings:appearance.description')}
            />

            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{t('settings:appearance.themeTitle')}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{t('settings:appearance.themeDescription')}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SegmentedOption<UITheme>
                  value="light"
                  currentValue={theme}
                  onSelect={setTheme}
                  label={t('settings:appearance.lightLabel')}
                  description={t('settings:appearance.lightDescription')}
                  icon={SunMedium}
                />
                <SegmentedOption<UITheme>
                  value="dark"
                  currentValue={theme}
                  onSelect={setTheme}
                  label={t('settings:appearance.darkLabel')}
                  description={t('settings:appearance.darkDescription')}
                  icon={MoonStar}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-[var(--border)] pt-5">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{t('settings:appearance.languageTitle')}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{t('settings:appearance.languageDescription')}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--accent)]">
                    <Languages size={17} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-[var(--text)]">{t('settings:appearance.languageSelectLabel')}</div>
                      <span className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_20%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                        {SUPPORTED_LANGUAGE_OPTIONS.find((option) => option.value === currentLanguage)?.nativeLabel || currentLanguage}
                      </span>
                    </div>
                    <SelectField
                      label=""
                      aria-label={t('settings:appearance.languageSelectLabel')}
                      value={currentLanguage}
                      onChange={(event) => {
                        void changeLanguage(event.target.value as AppLanguage)
                      }}
                      helperText={t('settings:appearance.languageSelectHelper')}
                      className="bg-[var(--surface-soft)]"
                    >
                      {SUPPORTED_LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.nativeLabel}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-[var(--border)] pt-5">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{t('settings:appearance.fontSizeTitle')}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{t('settings:appearance.fontSizeDescription')}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SegmentedOption<UIFontSize>
                  value="small"
                  currentValue={fontSize}
                  onSelect={setFontSize}
                  label={t('settings:appearance.fontSmallLabel')}
                  description={t('settings:appearance.fontSmallDescription')}
                  icon={Type}
                />
                <SegmentedOption<UIFontSize>
                  value="medium"
                  currentValue={fontSize}
                  onSelect={setFontSize}
                  label={t('settings:appearance.fontMediumLabel')}
                  description={t('settings:appearance.fontMediumDescription')}
                  icon={Type}
                />
                <SegmentedOption<UIFontSize>
                  value="large"
                  currentValue={fontSize}
                  onSelect={setFontSize}
                  label={t('settings:appearance.fontLargeLabel')}
                  description={t('settings:appearance.fontLargeDescription')}
                  icon={Type}
                />
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeader
              icon={UserRound}
              title={t('settings:account.title')}
              description={t('settings:account.description')}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t('settings:account.email')}</div>
                <div className="mt-2 break-all text-sm font-semibold text-[var(--text)]">{user?.email || '-'}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t('settings:account.role')}</div>
                <div className="mt-2 text-sm font-semibold capitalize text-[var(--text)]">{role || '-'}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t('settings:account.userId')}</div>
                <div className="mt-2 break-all font-mono text-sm text-[var(--text)]">{user?.userId || '-'}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-5">
            <SectionHeader
              icon={ShieldCheck}
              title={t('settings:session.title')}
              description={t('settings:session.description')}
            />

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--accent)]">
                  <MonitorCog size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">{t('settings:session.currentTitle')}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{t('settings:session.currentDescription')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full gap-2" type="button" onClick={() => void onLogout()} disabled={isLoggingOut}>
                <LogOut size={16} />
                {isLoggingOut ? t('common:actions.loggingOut') : t('common:actions.logout')}
              </Button>
              <p className="text-xs leading-5 text-[var(--muted)]">{t('settings:session.logoutDescription')}</p>
              {logoutError && <p className="text-sm text-[color:color-mix(in_srgb,var(--danger)_72%,black)]">{logoutError}</p>}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
