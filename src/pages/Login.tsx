import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import { Card } from '../ui/Card'
import Button from '../ui/Button'

export default function Login() {
  const { t } = useTranslation(['auth', 'common'])
  const { authLoginUrl, status, error, refresh } = useAuth()
  const bannerMessage = status === 'forbidden' ? t('auth:login.forbiddenMessage') : error

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] p-6">
      <Card className="w-full max-w-md space-y-6 p-8 shadow-[0_16px_34px_rgba(var(--shadow-color),0.14)]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_18%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
            <ShieldCheck size={20} strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t('auth:login.eyebrow')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">{t('auth:login.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t('auth:login.subtitle')}</p>
          </div>
        </div>

        {bannerMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger)_18%,var(--surface))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--danger)_8%,var(--surface)),color-mix(in_srgb,var(--danger)_4%,var(--surface)))] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:color-mix(in_srgb,var(--danger)_74%,black)]">
              {status === 'forbidden' ? t('auth:login.forbiddenTitle') : t('auth:login.errorTitle')}
            </p>
            <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--text)_88%,var(--danger))]">
              {bannerMessage}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-sm font-medium text-[var(--text)]">{t('auth:login.helperTitle')}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t('auth:login.helperText')}</p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = authLoginUrl
            }}
          >
            {t('auth:login.continueWithGoogle')}
          </Button>
        </div>

        {error && (
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-xs font-semibold text-[color:color-mix(in_srgb,var(--accent)_78%,var(--text))] underline-offset-4 transition-colors hover:text-[var(--text)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
          >
            {t('common:actions.retry')}
          </button>
        )}
      </Card>
    </div>
  )
}
