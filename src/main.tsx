import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import App from './app/App'
import ErrorBoundary from './app/ErrorBoundary'
import { AuthProvider } from './auth/useAuth'
import { UIPreferencesProvider } from './app/useUIPreferences'
import i18n from './i18n'
import './styles.css'

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary>
            <UIPreferencesProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </UIPreferencesProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
