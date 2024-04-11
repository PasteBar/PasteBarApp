import { Navigate, RouteObject } from 'react-router-dom'

import ClipboardHistoryPage from './main/ClipboardHistoryPage'
import PasteMenuPage from './main/PasteMenuPage'
import AppSettingsPage from './settings/AppSettings'
import ClipboardHistorySettings from './settings/ClipboardHistorySettings'

export default [
  {
    index: true,
    element: <Navigate to="history" replace />,
  },
  { path: 'menu', element: <PasteMenuPage />, index: true },
  { path: 'history', element: <ClipboardHistoryPage /> },
  {
    path: 'app-settings',
    element: <AppSettingsPage />,
    children: [{ path: 'history', element: <ClipboardHistorySettings /> }],
  },
] satisfies RouteObject[]
