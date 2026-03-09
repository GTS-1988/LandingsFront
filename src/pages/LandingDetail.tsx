import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { buildV1Url, createForm, getLanding, makePrimaryForm, submitForm, updateForm } from '../lib/api'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Toast from '../ui/Toast'

export default function LandingDetail() {
  const { t } = useTranslation(['landings', 'common'])
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

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-[var(--text)]">{t('landings:detail.telegramStatusTitle')}</div>
        <div className="text-sm text-[var(--text)]">
          {t('landings:labels.destination')}: {landing.destination ? t('landings:status.connected') : t('landings:status.disconnected')}
        </div>
        {!landing.destination && (
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
                className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                onClick={() => copy(telegramConnectUrl)}
              >
                {t('landings:actions.copy')}
              </Button>
            )}
            {telegramConnectUrl && (
              <a
                className="text-sm font-medium text-[color:color-mix(in_srgb,var(--accent)_82%,var(--text))] underline"
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

      <Card className="space-y-3">
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
                className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
                onClick={() => copy(primaryEndpoint)}
              >
                {t('landings:actions.copy')}
              </Button>
            )}
          </div>
        </div>
      </Card>

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
                    >
                      {f.isActive ? t('landings:actions.deactivate') : t('landings:actions.activate')}
                    </Button>
                    <Button
                      className="border-[color:color-mix(in_srgb,var(--text)_18%,white)] !bg-[var(--surface)] !text-[var(--text)] hover:bg-[color:color-mix(in_srgb,var(--bg)_90%,white)]"
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
                        disabled={mMakePrimary.isPending}
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
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:create.nameLabel')}</div>
            <Input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} />
          </div>
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:labels.fieldsJson')}</div>
            <Textarea value={newFields} onChange={(e) => setNewFields(e.target.value)} rows={10} className="font-mono" />
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
            disabled={mCreateForm.isPending}
          >
            {mCreateForm.isPending ? t('landings:actions.creatingForm') : t('landings:actions.createForm')}
          </Button>

          <div className="mt-5 space-y-3 border-t border-[color:color-mix(in_srgb,var(--text)_10%,white)] pt-4">
            <div className="text-sm font-semibold text-[var(--text)]">{t('landings:sections.testSubmit')}</div>
            <div className="text-xs text-[var(--muted)]">{t('landings:detail.testSubmitHelper')}</div>
            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:labels.formId')}</div>
              <Input
                value={testFormId}
                onChange={(e) => setTestFormId(e.target.value)}
                placeholder={t('landings:detail.testFormPlaceholder')}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t('landings:labels.payloadJson')}</div>
              <Textarea value={testPayload} onChange={(e) => setTestPayload(e.target.value)} rows={10} className="font-mono" />
            </div>
            <Button onClick={() => mTest.mutate()} disabled={mTest.isPending || !testFormId.trim()}>
              {mTest.isPending ? t('landings:actions.sendingTest') : t('landings:actions.sendTest')}
            </Button>
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
