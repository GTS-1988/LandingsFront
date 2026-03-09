import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Client, createClient, listClients } from '../lib/api'
import { getLanguageDateLocale } from '../i18n'
import useCursorPagination from '../hooks/useCursorPagination'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Card } from '../ui/Card'
import DataTable from '../ui/DataTable'
import { EmptyFeedback, ErrorFeedback, LoadingFeedback } from '../ui/Feedback'
import PaginationControls from '../ui/PaginationControls'

function fmtDate(ts: string, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale)
  } catch {
    return ts
  }
}

export default function Clients() {
  const { t, i18n } = useTranslation(['clients', 'common'])
  const [name, setName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { cursor, nextCursor, setNextCursor, cursorStack, page, resetPagination, goNext, goPrevious } =
    useCursorPagination(loading)
  const dateLocale = getLanguageDateLocale(i18n.resolvedLanguage || i18n.language)

  const m = useMutation({
    mutationFn: async () => createClient(name),
    onSuccess: (c) => {
      setToast(`✅ ${t('clients:toasts.createSuccess', { name: c.name, id: c.id })}`)
      resetPagination()
      setRefreshKey((k) => k + 1)
    },
    onError: (e: any) => setToast(`❌ ${t('clients:toasts.createError', { message: e?.message || e })}`),
  })

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      setSearchDebounced(next)
      resetPagination()
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, resetPagination])

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)

    listClients({ q: searchDebounced || undefined, take: 50, cursor: cursor || undefined })
      .then((res) => {
        if (!isCurrent) return
        setClients(res.clients || [])
        setNextCursor(res.nextCursor ?? null)
      })
      .catch((e: any) => {
        if (!isCurrent) return
        setError(e?.message || t('clients:states.loadError'))
      })
      .finally(() => {
        if (!isCurrent) return
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [searchDebounced, cursor, refreshKey])

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">{t('clients:create.title')}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {t('clients:create.subtitle')}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('clients:form.namePlaceholder')}
            aria-label={t('clients:form.nameLabel')}
          />
          <Button onClick={() => m.mutate()} disabled={m.isPending || !name.trim()}>
            {m.isPending ? t('clients:actions.creating') : t('clients:actions.create')}
          </Button>
        </div>
        <div className="text-xs text-[var(--muted)]">{t('clients:create.tip')}</div>
      </Card>

      <Card className="space-y-4">
        <div className="text-sm font-semibold text-[var(--text)]">{t('clients:list.title')}</div>

        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('clients:search.placeholder')}
          aria-label={t('clients:search.ariaLabel')}
        />

        {loading ? (
          <LoadingFeedback message={t('clients:states.loading')} />
        ) : error ? (
          <ErrorFeedback
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
            retryLabel={t('common:actions.retry')}
          />
        ) : clients.length === 0 ? (
          <EmptyFeedback>{t('clients:states.empty')}</EmptyFeedback>
        ) : (
          <DataTable
            columns={[
              { label: t('clients:table.columns.name') },
              { label: t('clients:table.columns.id') },
              { label: t('clients:table.columns.createdAt') },
            ]}
          >
              <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--text)_8%,white)] bg-[var(--surface)]">
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-[var(--text)]">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{c.id}</td>
                    <td className="px-3 py-2 text-[var(--muted)]">{fmtDate(c.createdAt, dateLocale)}</td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}

        <PaginationControls
          pageLabel={t('clients:pagination.pageLabel', { page, total: cursorStack.length + 1 })}
          onPrevious={goPrevious}
          onNext={goNext}
          previousDisabled={loading || page <= 1 || cursorStack.length === 0}
          nextDisabled={loading || !nextCursor}
          previousLabel={t('clients:pagination.previous')}
          nextLabel={t('clients:pagination.next')}
        />
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
