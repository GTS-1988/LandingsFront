import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

export type UITheme = 'light' | 'dark'
export type UIFontSize = 'small' | 'medium' | 'large'

type UIPreferencesContextValue = {
  theme: UITheme
  fontSize: UIFontSize
  setTheme: (theme: UITheme) => void
  setFontSize: (fontSize: UIFontSize) => void
}

const THEME_STORAGE_KEY = 'landing-admin.ui-theme'
const FONT_SIZE_STORAGE_KEY = 'landing-admin.ui-font-size'

const UIPreferencesContext = createContext<UIPreferencesContextValue | null>(null)

function readStoredPreference<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  if (typeof window === 'undefined') return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value && allowed.includes(value as T) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

export function UIPreferencesProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<UITheme>(() => readStoredPreference(THEME_STORAGE_KEY, 'light', ['light', 'dark']))
  const [fontSize, setFontSize] = useState<UIFontSize>(() =>
    readStoredPreference(FONT_SIZE_STORAGE_KEY, 'medium', ['small', 'medium', 'large']),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize)
    } catch {}
  }, [fontSize])

  const value = useMemo<UIPreferencesContextValue>(
    () => ({
      theme,
      fontSize,
      setTheme,
      setFontSize,
    }),
    [theme, fontSize],
  )

  return <UIPreferencesContext.Provider value={value}>{children}</UIPreferencesContext.Provider>
}

export function useUIPreferences() {
  const ctx = useContext(UIPreferencesContext)
  if (!ctx) throw new Error('useUIPreferences must be used within UIPreferencesProvider')
  return ctx
}
