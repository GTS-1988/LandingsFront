import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from './locales/en/common.json'
import authEn from './locales/en/auth.json'
import dashboardEn from './locales/en/dashboard.json'
import settingsEn from './locales/en/settings.json'
import auditsEn from './locales/en/audits.json'
import clientsEn from './locales/en/clients.json'
import landingsEn from './locales/en/landings.json'
import submissionsEn from './locales/en/submissions.json'
import commonPtBr from './locales/pt-BR/common.json'
import authPtBr from './locales/pt-BR/auth.json'
import dashboardPtBr from './locales/pt-BR/dashboard.json'
import settingsPtBr from './locales/pt-BR/settings.json'
import auditsPtBr from './locales/pt-BR/audits.json'
import clientsPtBr from './locales/pt-BR/clients.json'
import landingsPtBr from './locales/pt-BR/landings.json'
import submissionsPtBr from './locales/pt-BR/submissions.json'
import commonFr from './locales/fr/common.json'
import authFr from './locales/fr/auth.json'
import dashboardFr from './locales/fr/dashboard.json'
import settingsFr from './locales/fr/settings.json'
import auditsFr from './locales/fr/audits.json'
import clientsFr from './locales/fr/clients.json'
import landingsFr from './locales/fr/landings.json'
import submissionsFr from './locales/fr/submissions.json'
import commonDe from './locales/de/common.json'
import authDe from './locales/de/auth.json'
import dashboardDe from './locales/de/dashboard.json'
import settingsDe from './locales/de/settings.json'
import auditsDe from './locales/de/audits.json'
import clientsDe from './locales/de/clients.json'
import landingsDe from './locales/de/landings.json'
import submissionsDe from './locales/de/submissions.json'
import commonEs from './locales/es/common.json'
import authEs from './locales/es/auth.json'
import dashboardEs from './locales/es/dashboard.json'
import settingsEs from './locales/es/settings.json'
import auditsEs from './locales/es/audits.json'
import clientsEs from './locales/es/clients.json'
import landingsEs from './locales/es/landings.json'
import submissionsEs from './locales/es/submissions.json'

export const APP_LANGUAGE_STORAGE_KEY = 'app_language'
export const SUPPORTED_LANGUAGES = ['es', 'en', 'pt-BR', 'fr', 'de'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const SUPPORTED_LANGUAGE_OPTIONS = [
  { value: 'es', nativeLabel: 'Español', codeLabel: 'ES' },
  { value: 'en', nativeLabel: 'English', codeLabel: 'EN' },
  { value: 'pt-BR', nativeLabel: 'Português (Brasil)', codeLabel: 'PT-BR' },
  { value: 'fr', nativeLabel: 'Français', codeLabel: 'FR' },
  { value: 'de', nativeLabel: 'Deutsch', codeLabel: 'DE' },
] as const satisfies ReadonlyArray<{
  value: AppLanguage
  nativeLabel: string
  codeLabel: string
}>

const DEFAULT_LANGUAGE: AppLanguage = 'es'
const NAMESPACES = ['common', 'auth', 'dashboard', 'settings', 'audits', 'clients', 'landings', 'submissions'] as const

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    settings: settingsEn,
    audits: auditsEn,
    clients: clientsEn,
    landings: landingsEn,
    submissions: submissionsEn,
  },
  'pt-BR': {
    common: commonPtBr,
    auth: authPtBr,
    dashboard: dashboardPtBr,
    settings: settingsPtBr,
    audits: auditsPtBr,
    clients: clientsPtBr,
    landings: landingsPtBr,
    submissions: submissionsPtBr,
  },
  fr: {
    common: commonFr,
    auth: authFr,
    dashboard: dashboardFr,
    settings: settingsFr,
    audits: auditsFr,
    clients: clientsFr,
    landings: landingsFr,
    submissions: submissionsFr,
  },
  de: {
    common: commonDe,
    auth: authDe,
    dashboard: dashboardDe,
    settings: settingsDe,
    audits: auditsDe,
    clients: clientsDe,
    landings: landingsDe,
    submissions: submissionsDe,
  },
  es: {
    common: commonEs,
    auth: authEs,
    dashboard: dashboardEs,
    settings: settingsEs,
    audits: auditsEs,
    clients: clientsEs,
    landings: landingsEs,
    submissions: submissionsEs,
  },
} as const

function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return Boolean(value && SUPPORTED_LANGUAGES.includes(value as AppLanguage))
}

function persistLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language)
  } catch {}
}

export function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  try {
    const storedValue = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
    return isSupportedLanguage(storedValue) ? storedValue : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function getCurrentLanguage(): AppLanguage {
  const currentLanguage = i18n.resolvedLanguage || i18n.language
  return isSupportedLanguage(currentLanguage) ? currentLanguage : DEFAULT_LANGUAGE
}

export async function changeLanguage(language: AppLanguage) {
  if (!isSupportedLanguage(language)) return
  await i18n.changeLanguage(language)
}

export function getLanguageDateLocale(language: string | null | undefined) {
  switch (language) {
    case 'en':
      return 'en-GB'
    case 'pt-BR':
      return 'pt-BR'
    case 'fr':
      return 'fr-FR'
    case 'de':
      return 'de-DE'
    case 'es':
    default:
      return 'es-ES'
  }
}

if (!i18n.isInitialized) {
  i18n.on('languageChanged', (language) => {
    if (isSupportedLanguage(language)) {
      persistLanguage(language)
    }
  })

  void i18n.use(initReactI18next).init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: [...NAMESPACES],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  })
}

// Future languages can be added by creating the same namespace files under
// src/i18n/locales/<language>/ and extending resources above.

export default i18n
