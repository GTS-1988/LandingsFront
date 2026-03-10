import { Radio, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useReadOnlySupportText, useRoleAccess } from '../auth/permissions'
import { buildV1Url, createForm, getLanding, makePrimaryForm, submitForm, updateForm } from '../lib/api'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import EntitySelectField from '../ui/EntitySelectField'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Toast from '../ui/Toast'

const primaryActionLinkClass =
  'inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_38%,white)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(var(--shadow-color),0.08)] transition duration-200 ease-out hover:bg-[color:color-mix(in_srgb,var(--accent)_88%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_42%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]'

const copyActionClass =
  'border-[color:color-mix(in_srgb,var(--accent)_24%,white)] !bg-[color:color-mix(in_srgb,var(--accent)_18%,white)] !text-[color:color-mix(in_srgb,var(--accent)_88%,black)] hover:!bg-[color:color-mix(in_srgb,var(--accent)_26%,white)] hover:!text-[color:color-mix(in_srgb,var(--accent)_92%,black)]'

export default function LandingDetail() {
  const { t } = useTranslation(['landings', 'common'])
  const { isSupport } = useRoleAccess()
  const readOnlyText = useReadOnlySupportText()
  const { landingId } = useParams()
  const [toast, setToast] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['landing', landingId],
    queryFn: () => getLanding(landingId!),
    enabled: Boolean(landingId),
  })

  const mCreateForm = useMutation({
    mutationFn: async (payload: { name: string; fields: any[] }) => createForm(landingId!, payload),
    onSuccess: async () => {
      await q.refetch()
      setToast(`✅ ${t('landings:toasts.formCreated')}`)
    },
    onError: (e: any) => setToast(`❌ ${t('landings:toasts.formCreateError', { message: e?.message || e })}`),
  })

  const mUpdateForm = useMutation({
    mutationFn: async (vars: { formId: string; payload: any }) => updateForm(landingId!, vars.formId, vars.payload),
    onSuccess: async () => {
      await q.refetch()
      setToast(`✅ ${t('landings:toasts.formUpdated')}`)
    },
    onError: (e: any) => setToast(`❌ ${t('landings:toasts.formUpdateError', { message: e?.message || e })}`),
  })

  const mMakePrimary = useMutation({
    mutationFn: async (formId: string) => makePrimaryForm(landingId!, formId),
    onSuccess: async () => {
      await q.refetch()
      setToast(`✅ ${t('landings:toasts.primaryUpdated')}`)
    },
    onError: (e: any) => setToast(`❌ ${t('landings:toasts.primaryUpdateError', { message: e?.message || e })}`),
  })

  const [newFormName, setNewFormName] = useState('Nuevo formulario')
  const [newFields, setNewFields] = useState(
    JSON.stringify(
      [
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'message', label: 'Mensaje', type: 'textarea', required: false },
      ],
      null,
      2,
    ),
  )

  const [testFormId, setTestFormId] = useState('')
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+34 600 000 000',
        message: 'Hola!',
        website: '',
        pageUrl: 'https://ejemplo.com',
        utm_source: 'postman',
      },
      null,
      2,
    ),
  )

  const mTest = useMutation({
    mutationFn: async () => {
      const body = JSON.parse(testPayload)
      return submitForm(landingId!, testFormId, body)
    },
    onSuccess: (r) =>
      setToast(
        `✅ ${t('landings:toasts.testSubmitSuccess', {
          result: r?.reason
            ? r.reason
            : t('landings:toasts.testSubmitDeliveredFallback', { value: String(r?.delivered) }),
        })}`,
      ),
    onError: (e: any) => setToast(`❌ ${t('landings:toasts.testSubmitError', { message: e?.message || e })}`),
  })

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setToast(`📋 ${t('landings:toasts.copySuccess')}`)
    } catch {
      setToast(t('landings:toasts.copyError'))
    }
  }

  if (q.isLoading) return <div className="text-sm text-[var(--muted)]">{t('landings:states.loadingDetail')}</div>

  const landing = q.data
  if (!landing) return <div className="text-sm text-[var(--muted)]">{t('landings:states.notFound')}</div>

  const forms = landing.forms || []
  const primaryFormId = landing.primaryFormId || forms[0]?.id || null
  const primaryForm = landing.primaryForm || forms.find((f) => f.id === primaryFormId) || null
  const telegramConnectUrl = landing.telegramConnectUrl || ''
  const isTelegramConnected = Boolean(landing.destination)

  const buildSubmitEndpoint = (formId: string) => {
    return buildV1Url(`/forms/${landing.id}/${formId}/submit`)
  }

  const primaryEndpoint = landing.formEndpoint || (primaryFormId ? buildSubmitEndpoint(primaryFormId) : '')

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xl font-semibold tracking-tight text-[var(--text)]">{landing.name}</div>
        <div className="text-sm text-[var(--muted)]">
          {t('landings:labels.landingId')}: <span className="font-mono">{landing.id}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex h-full min-w-0 flex-col space-y-4">
          <div className="text-sm font-semibold text-[var(--text)]">{t('landings:detail.telegramStatusTitle')}</div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <div
                className={[
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                  isTelegramConnected
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                ].join(' ')}
              >
                {isTelegramConnected ? <Radio className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {t('landings:labels.destination')}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <span
                    className={[
                      'h-2.5 w-2.5 rounded-full',
                      isTelegramConnected ? 'bg-emerald-500' : 'bg-rose-500',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  {isTelegramConnected ? t('landings:status.connected') : t('landings:status.disconnected')}
                </div>
              </div>
            </div>
          </div>
          {!isTelegramConnected && (
            <div className="text-xs text-[var(--muted)]">
              {t('landings:detail.telegramHelper')}
            </div>
          )}
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
            <div className="text-xs text-[var(--muted)]">{t('landings:labels.telegramConnectUrl')}</div>
            <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{telegramConnectUrl || '-'}</div>
            <div className="mt-2 flex gap-2">
              {telegramConnectUrl && (
                <Button
                  className={copyActionClass}
                  onClick={() => copy(telegramConnectUrl)}
                >
                  {t('landings:actions.copy')}
                </Button>
              )}
              {telegramConnectUrl && (
                <a
                  className={primaryActionLinkClass}
                  href={telegramConnectUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('landings:actions.open')}
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex h-full min-w-0 flex-col space-y-4">
          <div className="text-sm font-semibold text-[var(--text)]">{t('landings:sections.primaryForm')}</div>
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
            <div className="text-sm font-semibold text-[var(--text)]">{primaryForm?.name || '-'}</div>
            <div className="text-xs text-[var(--muted)]">
              {t('landings:labels.formId')}: <span className="font-mono">{primaryFormId || '-'}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3">
            <div className="text-xs text-[var(--muted)]">{t('landings:labels.primaryEndpoint')}</div>
            <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{primaryEndpoint || '-'}</div>
            <div className="mt-2 flex gap-2">
              {primaryEndpoint && (
                <Button
                  className={copyActionClass}
                  onClick={() => copy(primaryEndpoint)}
                >
                  {t('landings:actions.copy')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-[var(--text)]">
            {t('landings:sections.formsCount', { count: forms.length })}
          </div>
          <div className="space-y-3">
            {forms.map((f) => {
              const isPrimary = f.id === primaryFormId
              const formEndpoint = buildSubmitEndpoint(f.id)

              return (
                <div
                  key={f.id}
                  className="rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[color:color-mix(in_srgb,var(--bg)_56%,white)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-[var(--text)]">{f.name}</div>
                        {isPrimary && (
                          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_35%,white)] bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text)]">
                            {t('landings:status.primary')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {t('landings:labels.formId')}: <span className="font-mono">{f.id}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setTestFormId(f.id)
                        setToast(`✅ ${t('landings:toasts.selectedForTest')}`)
                      }}
                    >
                      {t('landings:actions.test')}
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-[var(--muted)]">{t('landings:labels.endpoint')}</div>
                  <div className="mt-1 break-all font-mono text-xs text-[var(--text)]">{formEndpoint}</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] !bg-[var(--surface)] !text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                      onClick={() =>
                        mUpdateForm.mutate({
                          formId: f.id,
                          payload: { isActive: !f.isActive },
                        })
                      }
                      disabled={isSupport}
                      title={isSupport ? readOnlyText.actionTitle : undefined}
                    >
                      {f.isActive ? t('landings:actions.deactivate') : t('landings:actions.activate')}
                    </Button>
                    <Button
                      className={copyActionClass}
                      onClick={() => copy(formEndpoint)}
                    >
                      {t('landings:actions.copyEndpoint')}
                    </Button>
                    {!isPrimary && (
                      <Button
                        className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] !bg-[var(--surface)] !text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                        onClick={() => {
                          const shouldContinue = window.confirm(
                            t('landings:confirmations.makePrimary'),
                          )
                          if (!shouldContinue) return
                          mMakePrimary.mutate(f.id)
                        }}
                        disabled={isSupport || mMakePrimary.isPending}
                        title={isSupport ? readOnlyText.actionTitle : undefined}
                      >
                        {t('landings:actions.makePrimary')}
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-[var(--muted)]">{t('landings:labels.fieldsJson')}</div>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-2 text-xs text-[var(--text)]">
{JSON.stringify(f.fields || [], null, 2)}
                  </pre>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="text-sm font-semibold text-[var(--text)]">{t('landings:sections.createForm')}</div>
          <div className="text-xs text-[var(--muted)]">{t('landings:detail.createFormHelper')}</div>
          {isSupport ? <div className="text-xs text-[var(--muted)]">{readOnlyText.sectionHint}</div> : null}
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:create.nameLabel')}</div>
            <Input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} disabled={isSupport} />
          </div>
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:labels.fieldsJson')}</div>
            <Textarea
              value={newFields}
              onChange={(e) => setNewFields(e.target.value)}
              rows={10}
              className="font-mono"
              disabled={isSupport}
            />
          </div>
          <Button
            onClick={() => {
              try {
                const fields = JSON.parse(newFields)
                mCreateForm.mutate({ name: newFormName, fields })
              } catch {
                setToast(`❌ ${t('landings:toasts.invalidFieldsJson')}`)
              }
            }}
            disabled={isSupport || mCreateForm.isPending}
            title={isSupport ? readOnlyText.actionTitle : undefined}
          >
            {mCreateForm.isPending ? t('landings:actions.creatingForm') : t('landings:actions.createForm')}
          </Button>

          <div className="mt-5 space-y-3 border-t border-[color:color-mix(in_srgb,var(--text)_10%,white)] pt-4">
            <div className="text-sm font-semibold text-[var(--text)]">{t('landings:sections.testSubmit')}</div>
            <div className="text-xs text-[var(--muted)]">{t('landings:detail.testSubmitHelper')}</div>
            {isSupport ? <div className="text-xs text-[var(--muted)]">{readOnlyText.sectionHint}</div> : null}
            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:labels.formId')}</div>
              <EntitySelectField
                value={testFormId}
                onChange={setTestFormId}
                placeholder={t('landings:detail.testFormPlaceholder')}
                disabled={isSupport}
                label=""
                ariaLabel={t('landings:labels.formId')}
                id="landing-test-form-select"
                name="landing-test-form-select"
                options={forms.map((form) => ({
                  id: form.id,
                  name: form.name,
                  description: form.id,
                }))}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:labels.payloadJson')}</div>
              <Textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={10}
                className="font-mono"
                disabled={isSupport}
              />
            </div>
            <Button
              onClick={() => mTest.mutate()}
              disabled={isSupport || mTest.isPending || !testFormId.trim()}
              title={isSupport ? readOnlyText.actionTitle : undefined}
            >
              {mTest.isPending ? t('landings:actions.sendingTest') : t('landings:actions.sendTest')}
            </Button>
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
