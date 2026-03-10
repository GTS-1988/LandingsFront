import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './useAuth'

export function useRoleAccess() {
  const { role } = useAuth()

  return useMemo(
    () => ({
      isSupport: role === 'support',
      canSeeClientsNavigation: role !== 'staff',
    }),
    [role],
  )
}

export function useReadOnlySupportText() {
  const { t } = useTranslation('common')

  return useMemo(
    () => ({
      actionTitle: t('permissions.readOnlyAction'),
      sectionHint: t('permissions.readOnlyHint'),
    }),
    [t],
  )
}
