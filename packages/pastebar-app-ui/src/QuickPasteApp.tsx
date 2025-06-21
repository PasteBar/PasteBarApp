import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listen } from '@tauri-apps/api/event'
import { type } from '@tauri-apps/api/os'
import { invoke } from '@tauri-apps/api/tauri'
import i18n from '~/locales'
import { useAtomValue } from 'jotai'

import { ThemeProvider } from '~/components/theme-provider'

import { copiedItem, pastedItem } from './hooks/use-copypaste-history-item'
import { appSettings } from './lib/commands'
import ClipboardHistoryQuickPastePage from './pages/main/ClipboardHistoryQuickPastePage'
import { clipboardHistoryStoreAtom } from './store/clipboardHistoryStore'
import { settingsStoreAtom } from './store/settingsStore'
import { isAppLocked } from './store/signalStore'
import { uiStoreAtom } from './store/uiStore'

function QuickPasteApp() {
  const settingsStore = useAtomValue(settingsStoreAtom)

  const clipboardHistoryStore = useAtomValue(clipboardHistoryStoreAtom)

  const queryClient = useQueryClient()
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

        // @ts-expect-error
        settingsStore.initSettings({
          appDataDir: '',
          isSingleClickToCopyPaste: settings.isSingleClickToCopyPaste?.valueBool,
          historyPreviewLineLimit: settings.historyPreviewLineLimit?.valueInt ?? null,
          appLastUpdateVersion: settings.appLastUpdateVersion?.valueText,
          appLastUpdateDate: settings.appLastUpdateDate?.valueText,
          isHideMacOSDockIcon: settings.isHideMacOSDockIcon?.valueBool,
          hotKeysShowHideMainAppWindow: settings.hotKeysShowHideMainAppWindow?.valueText,
          hotKeysShowHideQuickPasteWindow:
            settings.hotKeysShowHideQuickPasteWindow?.valueText,
          isFirstRun: settings.isFirstRun?.valueBool,
          isFirstRunAfterUpdate: settings.isFirstRunAfterUpdate?.valueBool,
          isHistoryDetectLanguageEnabled:
            settings.isHistoryDetectLanguageEnabled?.valueBool,
          historyDetectLanguageMinLines: settings.historyDetectLanguageMinLines?.valueInt,
          historyExclusionList: settings.historyExclusionList?.valueText,
          historyExclusionAppList: settings.historyExclusionAppList?.valueText,
          isExclusionListEnabled: settings.isExclusionListEnabled?.valueBool,
          isKeepMainWindowClosedOnRestartEnabled:
            settings.isKeepMainWindowClosedOnRestartEnabled?.valueBool,
          isExclusionAppListEnabled: settings.isExclusionAppListEnabled?.valueBool,
          isAutoMaskWordsListEnabled: settings.isAutoMaskWordsListEnabled?.valueBool,
          autoMaskWordsList: settings.autoMaskWordsList?.valueText,
          historyDetectLanguagesPrioritizedList:
            settings.historyDetectLanguagesPrioritizedList?.valueText.split(','),
          historyDetectLanguagesEnabledList:
            settings.historyDetectLanguagesEnabledList?.valueText.split(','),
          appToursCompletedList: settings.appToursCompletedList?.valueText.split(','),
          appToursSkippedList: settings.appToursSkippedList?.valueText.split(','),
          isHistoryAutoTrimOnCaputureEnabled:
            settings.isHistoryAutoTrimOnCaputureEnabled?.valueBool,
          isHistoryAutoUpdateOnCaputureEnabled:
            settings.isHistoryAutoUpdateOnCaputureEnabled?.valueBool,
          isHistoryEnabled: settings.isHistoryEnabled?.valueBool,
          isAutoClearSettingsEnabled: settings.isAutoClearSettingsEnabled?.valueBool,
          autoClearSettingsDuration: settings.autoClearSettingsDuration?.valueInt,
          autoClearSettingsDurationType:
            settings.autoClearSettingsDurationType?.valueText,
          copyPasteDelay: settings.copyPasteDelay?.valueInt,
          copyPasteSequencePinnedDelay:
            settings.copyPasteSequencePinnedDelay?.valueInt ?? 3,
          copyPasteSequenceIsReversOrder:
            settings.copyPasteSequenceIsReversOrder?.valueBool,
          pasteSequenceEachSeparator: settings.pasteSequenceEachSeparator?.valueText,
          isAutoCloseOnCopyPaste: settings.isAutoCloseOnCopyPaste?.valueBool,
          isAutoPreviewLinkCardsEnabled:
            settings.isAutoPreviewLinkCardsEnabled?.valueBool,
          isAutoGenerateLinkCardsEnabled:
            settings.isAutoGenerateLinkCardsEnabled?.valueBool,
          isClipNotesHoverCardsEnabled: settings.isClipNotesHoverCardsEnabled?.valueBool,
          clipNotesHoverCardsDelayMS: settings.clipNotesHoverCardsDelayMS?.valueInt,
          clipNotesMaxWidth: settings.clipNotesMaxWidth?.valueInt,
          clipNotesMaxHeight: settings.clipNotesMaxHeight?.valueInt,
          isAutoFavoriteOnDoubleCopyEnabled:
            settings.isAutoFavoriteOnDoubleCopyEnabled?.valueBool,

          isIdleScreenAutoLockEnabled: settings.isIdleScreenAutoLockEnabled?.valueBool,
          idleScreenAutoLockTimeInMinutes:
            settings.idleScreenAutoLockTimeInMinutes?.valueInt,
          isShowHistoryCaptureOnLockedScreen:
            settings.isShowHistoryCaptureOnLockedScreen?.valueBool,
          screenLockPassCode: settings.screenLockPassCode?.valueText,
          screenLockPassCodeLength: settings.screenLockPassCodeLength?.valueInt,
          screenLockRecoveryPasswordMasked:
            settings.screenLockRecoveryPasswordMasked?.valueText,
          isAppLocked: settings.isAppLocked?.valueBool,
          isScreenLockPassCodeRequireOnStart:
            settings.isScreenLockPassCodeRequireOnStart?.valueBool,

          isSearchNameOrLabelOnly: settings.isSearchNameOrLabelOnly?.valueBool,
          isSkipAutoStartPrompt: settings.isSkipAutoStartPrompt?.valueBool,
          isShowCollectionNameOnNavBar: settings.isShowCollectionNameOnNavBar?.valueBool,
          isHideCollectionsOnNavBar: settings.isHideCollectionsOnNavBar?.valueBool,
          isShowNavBarItemsOnHoverOnly: settings.isShowNavBarItemsOnHoverOnly?.valueBool,
          isShowDisabledCollectionsOnNavBarMenu:
            settings.isShowDisabledCollectionsOnNavBarMenu?.valueBool,
          userSelectedLanguage: settings.userSelectedLanguage?.valueText,
          clipTextMinLength: settings.clipTextMinLength?.valueInt,
          clipTextMaxLength: settings.clipTextMaxLength?.valueInt,
          isQuickPasteCopyOnly: settings.isQuickPasteCopyOnly?.valueBool ?? false,
          isQuickPasteAutoClose: settings.isQuickPasteAutoClose?.valueBool ?? true,
          isSingleClickToCopyPasteQuickWindow:
            settings.isSingleClickToCopyPasteQuickWindow?.valueBool ?? false,
          isAppReady: true,
        })

        type().then(osType => {
          if (osType === 'Windows_NT' && settings.copyPasteDelay?.valueInt === 0) {
            settingsStore.updateSetting('copyPasteDelay', 2)
          }
        })

        if (
          settings.isAppLocked?.valueBool ||
          settings.isScreenLockPassCodeRequireOnStart?.valueBool
        ) {
          isAppLocked.value = true
        }

        // Set OS type
        type().then(osType => {
          uiState.setOSType(osType)
        })
      } catch (error) {
        console.error('Error parsing app settings', error)
      }
    })

    const listenToClipboardUnlisten = listen(
      'clipboard://clipboard-monitor/update',
      async e => {
        if (e.payload === 'clipboard update') {
          if (copiedItem.value) {
            await new Promise(resolve => setTimeout(resolve, 600))
            copiedItem.value = ''
          }
          if (pastedItem.value) {
            await new Promise(resolve => setTimeout(resolve, 600))
            pastedItem.value = ''
          }

          await queryClient.invalidateQueries({
            queryKey: ['get_clipboard_history'],
          })
          await queryClient.invalidateQueries({
            queryKey: ['get_clipboard_history_pinned'],
          })

          setTimeout(() => {
            clipboardHistoryStore.scrollToTopHistoryList()
          }, 100)

          setTimeout(() => {
            queryClient.setQueryData(
              ['get_clipboard_history'],
              (oldData: { pages: unknown[]; pageParams: unknown[] }) => {
                if (!oldData) return undefined
                return {
                  ...oldData,
                  pages: oldData.pages.slice(0, 1),
                  pageParams: oldData.pageParams.slice(0, 1),
                }
              }
            )
          }, 1000)

          invoke('build_system_menu')
        }
      }
    )

    const listenToHistoryItemsUnlisten = listen(
      'update-history-items-quickpaste',
      async () => {
        await queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        clipboardHistoryStore.updateClipboardHistory()
      }
    )

    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event)
    })

    window.addEventListener('contextmenu', e => {
      if (!import.meta.env.TAURI_DEBUG) {
        e.preventDefault()
      }
    })

    return () => {
      listenToHistoryItemsUnlisten.then(unlisten => {
        unlisten()
      })

      listenToClipboardUnlisten.then(unlisten => {
        unlisten()
      })
    }
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
