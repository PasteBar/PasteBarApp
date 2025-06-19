import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listen } from '@tauri-apps/api/event'
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut'
import { type } from '@tauri-apps/api/os'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow, LogicalSize, WebviewWindow } from '@tauri-apps/api/window'
import { NavBar } from '~/layout/NavBar'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import LanguageSelectionModal from '~/components/organisms/modals/language-selection-modal'
import { ThemeProvider } from '~/components/theme-provider'

import useKeyPressAlt from '~/hooks/use-keypress-alt'
import { useSignal } from '~/hooks/use-signal'

import debounce from './components/libs/react-resizable-panels/src/utils/debounce'
import { Button, Flex } from './components/ui'
import { useToast } from './components/ui/use-toast'
import { copiedItem, pastedItem } from './hooks/use-copypaste-history-item'
import { NavBarHistoryWindow } from './layout/NavBarHistoryWindow'
import { appReady } from './lib/commands'
import {
  APP_TOURS,
  clipboardHistoryStoreAtom,
  isAppLocked,
  listenToAudioPlayerEvents,
  listenToSettingsStoreEvents,
  listenToSignalStoreEvents,
  openOnBoardingTourName,
  openOSXSystemPermissionsModal,
  settingsStoreAtom,
  themeStoreAtom,
  uiStoreAtom,
} from './store'

const appIdleEvents = ['mousemove', 'keydown', 'scroll', 'keypress', 'mousedown']

function App() {
  useKeyPressAlt()

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const appLocation = useLocation()
  const uiStore = useAtomValue(uiStoreAtom)
  const appIdleTimeAutoLock = useSignal<null | number>(null)
  const settingsStore = useAtomValue(settingsStoreAtom)
  const themeStore = useAtomValue(themeStoreAtom)
  const clipboardHistoryStore = useAtomValue(clipboardHistoryStoreAtom)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const { i18n, t } = useTranslation()
  const { toast } = useToast()
  const historyWindowOpening = useSignal(false)
  const showLanguageSelectionModal = useSignal(false)
  const permissionsTrustedSignal = useSignal<boolean | null>(null)

  const handleLanguageSelected = useCallback(
    (languageCode: string) => {
      settingsStore.updateSetting('userSelectedLanguage', languageCode)
      settingsStore.updateSetting('isFirstRun', false)
      showLanguageSelectionModal.value = false
    },
    [settingsStore]
  )

  const handleActivity = useCallback(
    debounce(() => {
      if (appIdleTimeAutoLock.value === null || isAppLocked.value) {
        return
      }
      isAppLocked.value = false
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      idleTimerRef.current = setTimeout(() => {
        isAppLocked.value = true
      }, appIdleTimeAutoLock.value)
    }, 1000),
    [appIdleTimeAutoLock]
  )

  useEffect(() => {
    if (isAppLocked.value) {
      settingsStore.setIsAppLocked(true)
    } else {
      settingsStore.setIsAppLocked(false)
    }
  }, [isAppLocked.value])

  useEffect(() => {
    appReady().then(res => {
      if (res === null) return

      try {
        const {
          constants,
          settings,
          permissionstrusted: initialPermissionsTrusted,
        } = JSON.parse(res)
        permissionsTrustedSignal.value = initialPermissionsTrusted

        const {
          app_dev_data_dir: appDevDataDir,
          app_data_dir: appDataDir,
          app_detect_languages_supported: appDetectLanguageSupport,
        } = constants

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

        settingsStore.initSettings({
          appDataDir: import.meta.env.TAURI_DEBUG ? appDevDataDir : appDataDir,
          // Initialize new DB path settings for type conformity; actual value loaded by loadInitialCustomDbPath
          customDbPath: null,
          isCustomDbPathValid: null,
          customDbPathError: null,
          dbRelocationInProgress: false,
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
          clipTextMinLength: settings.clipTextMinLength?.valueInt,
          clipTextMaxLength: settings.clipTextMaxLength?.valueInt,
          isImageCaptureDisabled: settings.isImageCaptureDisabled?.valueBool,
          isMenuItemCopyOnlyEnabled: settings.isMenuItemCopyOnlyEnabled?.valueBool,
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
          isNoteIconsEnabled: settings.isNoteIconsEnabled?.valueBool ?? true,
          defaultNoteIconType:
            settings.defaultNoteIconType?.valueText ?? 'MessageSquareText',
          isHistoryPanelVisibleOnly: settings.isHistoryPanelVisibleOnly?.valueBool,
          isSavedClipsPanelVisibleOnly: settings.isSavedClipsPanelVisibleOnly?.valueBool,
          isSimplifiedLayout: settings.isSimplifiedLayout?.valueBool ?? true,
          isMainWindowOnTop: settings.isMainWindowOnTop?.valueBool ?? false,
          isQuickPasteCopyOnly: settings.isQuickPasteCopyOnly?.valueBool ?? false,
          isQuickPasteAutoClose: settings.isQuickPasteAutoClose?.valueBool ?? true,
          isSingleClickToCopyPaste: settings.isSingleClickToCopyPaste?.valueBool ?? false,
          hasPinProtectedCollections:
            settings.hasPinProtectedCollections?.valueBool ?? false,
          protectedCollections: settings.protectedCollections?.valueText
            ? settings.protectedCollections.valueText.split(',').filter(Boolean)
            : [],
          isSingleClickToCopyPasteQuickWindow:
            settings.isSingleClickToCopyPasteQuickWindow?.valueBool ?? false,
          isKeepPinnedOnClearEnabled:
            settings.isKeepPinnedOnClearEnabled?.valueBool ?? false,
          isKeepStarredOnClearEnabled:
            settings.isKeepStarredOnClearEnabled?.valueBool ?? false,
          isAppReady: true,
        })
        settingsStore.initConstants({
          APP_DETECT_LANGUAGES_SUPPORTED: appDetectLanguageSupport,
        })
        // Load the actual custom DB path after basic settings are initialized
        settingsStore.loadInitialCustomDbPath()
        type().then(osType => {
          if (osType === 'Windows_NT' && settings.copyPasteDelay?.valueInt === 0) {
            settingsStore.updateSetting('copyPasteDelay', 2)
          }
        })

        if (settings.isFirstRun?.valueBool) {
          appWindow.setSize(new LogicalSize(1105, 710))
          showLanguageSelectionModal.value = true
        }

        if (
          settings.isIdleScreenAutoLockEnabled?.valueBool &&
          settings.idleScreenAutoLockTimeInMinutes?.valueInt > 0
        ) {
          appIdleEvents.forEach(event => window.addEventListener(event, handleActivity))
          appIdleTimeAutoLock.value =
            settings.idleScreenAutoLockTimeInMinutes?.valueInt * 1000 * 60
        }

        if (
          settings.isAppLocked?.valueBool ||
          settings.isScreenLockPassCodeRequireOnStart?.valueBool
        ) {
          isAppLocked.value = true
        }

        if (settings.hotKeysShowHideMainAppWindow?.valueText) {
          try {
            register(settings.hotKeysShowHideMainAppWindow?.valueText, async () => {
              if (document.hasFocus()) {
                await appWindow.hide()
              } else {
                await appWindow.show()
                await appWindow.setFocus()
              }
            }).catch(e => {
              console.error(e)
            })
          } catch (e) {
            console.error(e)
          }
        }

        if (settings.hotKeysShowHideQuickPasteWindow?.valueText) {
          try {
            register(settings.hotKeysShowHideQuickPasteWindow?.valueText, async () => {
              await uiStore.toggleHistoryQuickPasteWindow(
                t('PasteBar Quick Paste', { ns: 'settings2' })
              )
            }).catch(e => {
              console.error(e)
            })
          } catch (e) {
            console.error(e)
          }
        }

        // Welcome tour logic moved to a separate useEffect

        if (!settings.isSkipAutoStartPrompt?.valueBool) {
          invoke('is_autostart_enabled').then(async isAutoStartEnabled => {
            if (!isAutoStartEnabled) {
              try {
                await invoke('autostart', { enabled: true })
              } catch (e) {
                console.error(e)
              }
            }
          })
        }

        // OSX Permissions modal logic moved to a separate useEffect
      } catch (e) {
        console.error(e)
      }
    })

    // Set OS type
    type().then(osType => {
      uiStore.setOSType(osType)
    })

    appWindow.innerSize().then(size => {
      const { width, height } = size
      if (width < 740 || height < 600) {
        appWindow.setSize(new LogicalSize(750, 620))
      }
    })

    // Set Hardware Id
    if (themeStore.deviceId === '') {
      invoke('get_device_id').then(id => {
        const hwid = id as string
        themeStore.setDeviceId(hwid)
      })
    }

    if (!import.meta.env.TAURI_DEBUG || import.meta.env.VITE_ENABLE_DEV_AUTO_UPDATER) {
      // check for app update on app start
      settingsStore.checkForUpdate()
    }

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

    const listenToClipsUnlisten = listen('clips://clips-monitor/update', async e => {
      if (e.payload === 'update') {
        await queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
      }
    })

    const listenToWindowCloseUnlisten = listen('window-events', e => {
      if (e.payload === 'history-window-closed') {
        uiStore.setIsSplitPanelView(false)
      } else if (e.payload === 'main-window-hide') {
        uiStore.setIsHideMainWindow(true)
      } else if (e.payload === 'main-window-show') {
        uiStore.setIsHideMainWindow(false)
      }
    })

    const listenToOSXPermissionUnlisten = listen('macosx-permissions-modal', e => {
      if (e.payload === 'show') {
        openOSXSystemPermissionsModal.value = true
      }
    })

    const listenToSettingUnlisten = listen('setting:update', e => {
      const { name, value_bool } = e.payload as {
        name: string
        value: boolean | string | number
        value_bool?: boolean
        value_number?: number
        value_string?: string
      }

      if (name === 'isHistoryEnabled') {
        settingsStore.updateSetting('isHistoryEnabled', Boolean(value_bool))
      }
      if (name === 'isImageCaptureDisabled') {
        settingsStore.updateSetting('isImageCaptureDisabled', Boolean(value_bool))
      }
    })

    const listenToMenuUnlisten = listen('menu:add_first_menu_item', () => {
      navigate('/menu', { replace: true })
    })

    const listenToNavigateUnlisten = listen('navigate-main', e => {
      const { location, isSetFocus } = e.payload as {
        location: string
        isSetFocus: boolean
      }
      if (window.isMainWindow && location !== appLocation.pathname) {
        appWindow.show()
        if (isSetFocus) {
          appWindow.setFocus()
        }
        navigate(location, { replace: true })
      }
    })

    i18n.on('languageChanged', async function () {
      await queryClient.invalidateQueries({
        queryKey: ['get_clipboard_history'],
      })
    })

    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event)
    })

    window.addEventListener('contextmenu', e => {
      if (!import.meta.env.TAURI_DEBUG) {
        e.preventDefault()
      }
    })

    return () => {
      if (window.isMainWindow) {
        unregisterAll()
      }

      listenToNavigateUnlisten.then(unlisten => {
        unlisten()
      })

      listenToSignalStoreEvents.then(unlisten => {
        if (!import.meta.env.TAURI_DEBUG) {
          unlisten()
        }
      })

      listenToSettingsStoreEvents.then(unlisten => {
        if (!import.meta.env.TAURI_DEBUG) {
          unlisten()
        }
      })

      listenToAudioPlayerEvents.then(unlisten => {
        if (!import.meta.env.TAURI_DEBUG) {
          unlisten()
        }
      })

      listenToWindowCloseUnlisten.then(unlisten => {
        unlisten()
      })

      listenToClipboardUnlisten.then(unlisten => {
        unlisten()
      })

      listenToMenuUnlisten.then(unlisten => {
        unlisten()
      })

      listenToClipsUnlisten.then(unlisten => {
        unlisten()
      })

      listenToSettingUnlisten.then(unlisten => {
        unlisten()
      })

      listenToOSXPermissionUnlisten.then(unlisten => {
        unlisten()
      })

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      appIdleEvents.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [])

  // Effect to show OSX System Permissions Modal
  useEffect(() => {
    // Wait until permissions status is known and settings are initialized
    if (permissionsTrustedSignal.value === null || !settingsStore.isAppReady) {
      return
    }

    // If it's the first run and the language selection modal is active,
    // wait for it to be closed before checking/showing the permissions modal.
    if (settingsStore.isFirstRun && showLanguageSelectionModal.value) {
      return
    }

    // Proceed if:
    // - It's not the first run OR
    // - It was the first run AND the language modal is now closed.
    if (permissionsTrustedSignal.value === false) {
      if (!openOSXSystemPermissionsModal.value) {
        openOSXSystemPermissionsModal.value = true
      }
    } else if (permissionsTrustedSignal.value === true) {
      // If permissions are trusted, ensure the modal is not trying to be shown.
      // This can be useful if the modal was opened and then permissions were granted.
      if (openOSXSystemPermissionsModal.value) {
        openOSXSystemPermissionsModal.value = false
      }
    }
  }, [
    permissionsTrustedSignal.value,
    showLanguageSelectionModal.value,
    settingsStore.isFirstRun,
    settingsStore.isAppReady,
    // openOSXSystemPermissionsModal // signal itself, stable reference
  ])

  useEffect(() => {
    if (
      permissionsTrustedSignal.value === false &&
      openOSXSystemPermissionsModal.value === false
    ) {
      permissionsTrustedSignal.value = true
    }
  }, [openOSXSystemPermissionsModal.value])

  // Effect to show Welcome Tour toast
  useEffect(() => {
    let welcomeTourToast: { dismiss: () => void } | undefined

    // Ensure all prerequisites are met: settings ready, permission status known,
    // and relevant modals (language, OSX permissions) are not active.
    if (
      !settingsStore.isAppReady ||
      permissionsTrustedSignal.value === null ||
      (settingsStore.isFirstRun && showLanguageSelectionModal.value) ||
      openOSXSystemPermissionsModal.value === true
    ) {
      return () => {
        welcomeTourToast?.dismiss()
      }
    }

    // If we've passed the early exit, language and permissions modals are closed.
    // Now, only show the tour if permissions are actually trusted.
    if (permissionsTrustedSignal.value) {
      const tourCompleted = settingsStore.appToursCompletedList?.includes(
        APP_TOURS.historyPanelTour
      )
      const tourSkipped = settingsStore.appToursSkippedList?.includes(
        APP_TOURS.historyPanelTour
      )

      if (!tourCompleted && !tourSkipped) {
        welcomeTourToast = toast({
          title: `${t('Welcome to PasteBar', { ns: 'help' })} 🎉`,
          id: 'welcome-tour',
          duration: 0, // Stays until dismissed
          description: (
            <>
              {t(`WelcomeDescription`, { ns: 'help' })}
              <Flex className="mt-3">{t(`WelcomeTour`, { ns: 'help' })}</Flex>
              <Flex className="justify-between">
                <Button
                  className="bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-600 px-4 mt-3 text-white"
                  onClick={() => {
                    openOnBoardingTourName.value = APP_TOURS.historyPanelTour
                    welcomeTourToast?.dismiss()
                  }}
                >
                  {t('Start Tour', { ns: 'help' })}
                </Button>
                <Flex className="gap-3">
                  <Button
                    variant="light"
                    className="text-gray-800 px-4 mt-3 dark:bg-slate-800 dark:text-gray-400 hover:dark:text-gray-300"
                    onClick={() => {
                      welcomeTourToast?.dismiss()
                    }}
                  >
                    {t('Later', { ns: 'help' })}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-gray-800 px-4 mt-3"
                    onClick={() => {
                      welcomeTourToast?.dismiss()
                      const tours = Object.values(APP_TOURS)
                      settingsStore.setAppToursSkippedList([...tours])
                    }}
                  >
                    {t('Skip All Tours', { ns: 'help' })}
                  </Button>
                </Flex>
              </Flex>
            </>
          ),
        })
      }
    }

    return () => {
      welcomeTourToast?.dismiss() // Dismiss if this effect instance created it
    }
  }, [
    settingsStore.isAppReady,
    showLanguageSelectionModal.value,
    settingsStore.isFirstRun,
    permissionsTrustedSignal.value,
    openOSXSystemPermissionsModal.value, // Added dependency
    settingsStore.appToursCompletedList,
    settingsStore.appToursSkippedList,
    settingsStore, // For setAppToursSkippedList and accessing properties
    t,
    toast,
    openOnBoardingTourName,
  ])

  const uiState = useAtomValue(uiStoreAtom)

  useEffect(() => {
    document.documentElement.style.fontSize = uiState.fontSize
  }, [uiState.fontSize])

  useEffect(() => {
    if (uiState.isSplitPanelView && window.isMainWindow && settingsStore.isAppReady) {
      const openHistoryWindow = async () => {
        invoke('open_history_window').then(() => {
          historyWindowOpening.value = false
          setTimeout(() => {
            if (settingsStore.isKeepMainWindowClosedOnRestartEnabled) {
              appWindow.hide()
            }
            historyWindow?.setFocus()
          }, 300)
        })
      }
      const historyWindow = WebviewWindow.getByLabel('history')
      if (!historyWindow && !historyWindowOpening.value) {
        historyWindowOpening.value = true
        openHistoryWindow()
      }
      setTimeout(() => {
        historyWindow?.setFocus()
      }, 300)
    }
  }, [
    uiState.isSplitPanelView,
    settingsStore.isAppReady,
    settingsStore.isKeepMainWindowClosedOnRestartEnabled,
  ])

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className={`bg-transparent ${uiStore.isMacOSX ? 'p-0' : 'p-1'} rounded-md`}>
          <div
            className={`border overflow-hidden ${
              uiStore.isMacOSX
                ? 'rounded-lg shadow-window _border-gray-100 _dark:border-gray-800'
                : 'rounded-md _shadow-window _border-gray-300 _dark:border-gray-800 '
            } relative`}
          >
            {window.isHistoryWindow ? <NavBarHistoryWindow /> : <NavBar />}
            <Outlet />
          </div>
        </div>
        {settingsStore.isFirstRun && (
          <LanguageSelectionModal
            open={showLanguageSelectionModal.value}
            onClose={() => {
              showLanguageSelectionModal.value = false
              settingsStore.updateSetting('isFirstRun', false)
            }}
            onLanguageSelected={handleLanguageSelected}
          />
        )}
      </ThemeProvider>
    </>
  )
}

export default App
