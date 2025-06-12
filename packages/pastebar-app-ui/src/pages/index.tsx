import { Navigate, RouteObject } from 'react-router-dom'

import ClipboardHistoryPage from './main/ClipboardHistoryPage'
import PasteMenuPage from './main/PasteMenuPage'
import AppSettingsPage from './settings/AppSettings'
import BackupRestoreSettings from './settings/BackupRestoreSettings'
import ClipboardHistorySettings from './settings/ClipboardHistorySettings'
import ManageCollections from './settings/collections/ManageCollections'
import SecuritySettings from './settings/SecuritySettings'
import UserPreferences from './settings/UserPreferences'

const isHistoryWindow = window.isHistoryWindow

export default [
  {
    index: true,
    element: isHistoryWindow ? (
      <Navigate to="history-index" replace />
    ) : (
      <Navigate to="history" replace />
    ),
  },
  { path: 'menu', element: <PasteMenuPage />, index: true },
  { path: 'history', element: <ClipboardHistoryPage /> },
  { path: 'history-index', element: <ClipboardHistoryPage /> },
  { path: 'quickpaste-index', element: <ClipboardHistoryPage /> },
  {
    path: 'app-settings',
    element: <AppSettingsPage />,
    children: [
      { path: 'collections', element: <ManageCollections /> },
      { path: 'collections/new', element: <ManageCollections showAddNewCollection /> },
      { path: 'items', element: <ManageCollections /> },
      { path: 'history', element: <ClipboardHistorySettings /> },
      { path: 'preferences', element: <UserPreferences /> },
      { path: 'backup-restore', element: <BackupRestoreSettings /> },
      { path: 'security', element: <SecuritySettings /> },
    ],
  },
] satisfies RouteObject[]
