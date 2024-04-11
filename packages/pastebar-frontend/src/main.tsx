import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MAX_RETRIES, REACTQUERY_DEVTOOLS } from '~/constants'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import type { ErrorPayload } from 'vite'

import App from './app'
import main from './pages'

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: '/',
        lazy: () => import('./layout/Layout'),
        children: main,
      },
    ],
  },
])

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
      <RouterProvider router={router} />
      {REACTQUERY_DEVTOOLS && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
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
