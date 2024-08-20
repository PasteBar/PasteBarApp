import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listen } from '@tauri-apps/api/event'
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut'
import { type } from '@tauri-apps/api/os'
import { invoke } from '@tauri-apps/api/tauri'
// import { settingsStoreAtom } from './store/settingsStore'
import i18n from '~/locales'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'

import { ThemeProvider } from '~/components/theme-provider'

import { useSignal } from '~/hooks/use-signal'

import debounce from './components/libs/react-resizable-panels/src/utils/debounce'
import { Button, Flex } from './components/ui'
import { useToast } from './components/ui/use-toast'
import { copiedItem, pastedItem } from './hooks/use-copypaste-history-item'
import { appSettings } from './lib/commands'
import ClipboardHistoryQuickPastePage from './pages/main/ClipboardHistoryQuickPastePage'
import { uiStoreAtom } from './store/uiStore'

function QuickPasteApp() {
  // const settingsStore = useAtomValue(settingsStoreAtom)
  // const { t } = useTranslation()

  const uiState = useAtomValue(uiStoreAtom)

  useEffect(() => {
    appSettings().then(res => {
      if (res === null) return
      try {
        const { settings } = JSON.parse(res)

        if (
          settings.userSelectedLanguage?.valueText &&
          settings.userSelectedLanguage?.valueText !== '' &&
          i18n.language !== settings.userSelectedLanguage?.valueText
        ) {
          i18n.changeLanguage(settings.userSelectedLanguage.valueText)
        }
        if (
          settings.userSelectedLanguage?.valueText === '' &&
          i18n.resolvedLanguage !== 'en'
        ) {
          i18n.changeLanguage(i18n.resolvedLanguage)
        }
      } catch (error) {
        console.error('Error parsing app settings', error)
      }
    })
  }, [])

  useEffect(() => {
    document.documentElement.style.fontSize = uiState.fontSize
  }, [uiState.fontSize])

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ClipboardHistoryQuickPastePage />
      </ThemeProvider>
    </>
  )
}

export default QuickPasteApp
