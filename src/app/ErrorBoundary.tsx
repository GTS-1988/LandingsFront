import { Component, ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // Intentionally silent to avoid noisy duplicate logs in production.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] p-6">
          <div className="w-full max-w-md rounded-2xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)] bg-[var(--surface)] p-6 text-center shadow-[0_10px_28px_rgba(15,23,42,0.09)]">
            <h1 className="text-lg font-semibold text-[var(--text)]">Ocurrió un error inesperado</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Recarga la página para continuar.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--text)_14%,white)] px-4 text-sm font-medium text-[var(--text)] transition-colors duration-200 ease-out hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,white)]"
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
