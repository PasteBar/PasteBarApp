import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MAX_RETRIES, REACTQUERY_DEVTOOLS } from '~/constants'
import { createRoot } from 'react-dom/client'
import type { ErrorPayload } from 'vite'

import App from './App'

import 'react-complex-tree/lib/style-modern.css'
import '~/components/libs/simplebar-react/simplebar.css'
import './styles/overlayscrollbars.css'
import './styles/globals.css'

import { ErrorBoundary } from 'react-error-boundary'

import { fallbackRender } from './error'
import main from './pages'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      networkMode: 'always',
    },
    queries: {
      networkMode: 'always',
      gcTime: REACTQUERY_DEVTOOLS ? 600 : 1000 * 60 * 60 * 1,
      retry: MAX_RETRIES,
      retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 30000),
    },
  },
})

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <h1>Hello QuickPaste Window</h1>
    </QueryClientProvider>
  </StrictMode>
)

if (import.meta.env.DEV) {
  const showErrorOverlay = (err: Partial<ErrorPayload['err']>) => {
    if (!err || !err.message) return

    const ErrorOverlay = customElements.get('vite-error-overlay')
    if (ErrorOverlay == null) return
    document.body.appendChild(new ErrorOverlay(err))
  }

  window.addEventListener('error', ({ error }) => showErrorOverlay(error))
  window.addEventListener('unhandledrejection', ({ reason }) => showErrorOverlay(reason))
}
