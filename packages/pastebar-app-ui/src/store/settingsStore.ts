import { invoke } from '@tauri-apps/api'
import { emit, listen, TauriEvent } from '@tauri-apps/api/event'
import { relaunch } from '@tauri-apps/api/process'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { semverCompare } from '~/libs/utils'
import i18n from '~/locales'
import dayjs from 'dayjs'
import { atomWithStore } from 'jotai-zustand'
import { createStore } from 'zustand/vanilla'

import DOMPurify from '../components/libs/dompurify'
import {
  availableVersionBody,
  availableVersionDate,
  availableVersionDateISO,
  availableVersionNumber,
  showRestartAfterUpdate,
  showUpdateAppIsLatest,
  showUpdateAvailable,
  showUpdateChecking,
  showUpdateError,
  showUpdateErrorPermissionDenied,
  showUpdateInstalling,
} from './signalStore'

type Settings = {
  appLastUpdateVersion: string
  appLastUpdateDate: string
  appDataDir: string
  isAppReady: boolean
  isClipNotesHoverCardsEnabled: boolean
  clipNotesHoverCardsDelayMS: number
  clipNotesMaxWidth: number
  clipNotesMaxHeight: number
  isHistoryEnabled: boolean
  historyExclusionList: string
  historyExclusionAppList: string
  historyDetectLanguagesEnabledList: string[]
  appToursCompletedList: string[]
  appToursSkippedList: string[]
  historyDetectLanguagesPrioritizedList: string[]
  isHistoryDetectLanguageEnabled: boolean
  isExclusionListEnabled: boolean
  isExclusionAppListEnabled: boolean
  historyDetectLanguageMinLines: number
  isAutoMaskWordsListEnabled: boolean
  isAutoClearSettingsEnabled: boolean
  autoClearSettingsDuration: number
  autoClearSettingsDurationType: string
  autoMaskWordsList: string
  isHistoryAutoUpdateOnCaputureEnabled: boolean
  copyPasteDelay: number
  copyPasteSequencePinnedDelay: number
  copyPasteSequenceIsReversOrder: boolean
  hotKeysShowHideMainAppWindow: string
  hotKeysShowHideQuickPasteWindow: string
  isHideMacOSDockIcon: boolean
  isAutoCloseOnCopyPaste: boolean
  isAutoPreviewLinkCardsEnabled: boolean
  isAutoGenerateLinkCardsEnabled: boolean
  isAutoFavoriteOnDoubleCopyEnabled: boolean
  isSearchNameOrLabelOnly: boolean
  isShowCollectionNameOnNavBar: boolean
  isShowDisabledCollectionsOnNavBarMenu: boolean
  isSkipAutoStartPrompt: boolean
  pasteSequenceEachSeparator: string
  userSelectedLanguage: string
  isFirstRun: boolean
  isFirstRunAfterUpdate: boolean
  isIdleScreenAutoLockEnabled: boolean
  idleScreenAutoLockTimeInMinutes: number | null
  isShowHistoryCaptureOnLockedScreen: boolean
  screenLockPassCode: string | null
  screenLockPassCodeLength: number
  screenLockRecoveryPasswordMasked: string | null
  isAppLocked: boolean
  isScreenLockPassCodeRequireOnStart: boolean
}

type Constants = {
  APP_DETECT_LANGUAGES_SUPPORTED: string[]
}

export interface SettingsStoreState {
  setIsHistoryEnabled: (isHistoryEnabled: boolean) => void
  setIsHistoryAutoUpdateOnCaputureEnabled: (
    isHistoryAutoUpdateOnCaputureEnabled: boolean
  ) => void
  setIsFirstRun: (isFirstRun: boolean) => void
  setIsFirstRunAfterUpdate: (isFirstRunAfterUpdate: boolean) => void
  setCopyPasteDelay: (delay: number) => void
  setCopyPasteSequencePinnedDelay: (delay: number) => void
  setCopyPasteSequenceIsReversOrder: (isReversOrder: boolean) => void
  setPasteSequenceEachSeparator: (separator: string) => void
  setHistoryDetectLanguageMinLines: (lines: number) => void
  setHistoryExclusionList: (text: string) => void
  setHistoryExclusionAppList: (text: string) => void
  addToHistoryExclusionAppList: (text: string) => void
  setIsHistoryDetectLanguageEnabled: (isEnabled: boolean) => void
  setIsExclusionListEnabled: (isEnabled: boolean) => void
  setIsExclusionAppListEnabled: (isEnabled: boolean) => void
  setIsAutoClearSettingsEnabled: (isEnabled: boolean) => void
  setAutoClearSettingsDuration: (duration: number) => void
  setAutoClearSettingsDurationType: (type: string) => void
  CONST: Constants
  setAppLastUpdateVersion: (appLastUpdateVersion: string) => void
  setAppLastUpdateDate: (appLastUpdateDate: string) => void
  setIsAutoMaskWordsListEnabled: (isEnabled: boolean) => void
  setAutoMaskWordsList: (text: string) => void
  setHistoryDetectLanguagesEnabledList: (words: string[]) => void
  setAppToursCompletedList: (words: string[]) => void
  setAppToursSkippedList: (words: string[]) => void
  setHistoryDetectLanguagesPrioritizedList: (words: string[]) => void
  setAppDataDir: (appDataDir: string) => void
  setIsAutoCloseOnCopyPaste: (isEnabled: boolean) => void
  setClipNotesHoverCardsDelayMS: (delay: number) => void
  setClipNotesMaxWidth: (width: number) => void
  setClipNotesMaxHeight: (height: number) => void
  setIsClipNotesHoverCardsEnabled: (isEnabled: boolean) => void
  setIsAutoPreviewLinkCardsEnabled: (isEnabled: boolean) => void
  setIsAutoGenerateLinkCardsEnabled: (isEnabled: boolean) => void
  setIsAutoFavoriteOnDoubleCopyEnabled: (isEnabled: boolean) => void
  setIsSearchNameOrLabelOnly: (isEnabled: boolean) => void
  initConstants: (CONST: Constants) => void
  setIsShowCollectionNameOnNavBar: (isEnabled: boolean) => void
  setIsShowDisabledCollectionsOnNavBarMenu: (isEnabled: boolean) => void
  setIsSkipAutoStartPrompt: (isEnabled: boolean) => void
  setUserSelectedLanguage: (language: string) => void
  setIsIdleScreenAutoLockEnabled: (isEnabled: boolean) => void
  setIdleScreenAutoLockTimeInMinutes: (time: number | null) => void
  setIsShowHistoryCaptureOnLockedScreen: (isEnabled: boolean) => void
  setScreenLockPassCode: (passCode: string | null) => void
  setScreenLockPassCodeLength: (length: number) => void
  setScreenLockResetTempPassCode: (tempPassCode: string | null) => void
  setScreenLockRecoveryPasswordMasked: (backupPasswordMasked: string | null) => void
  setIsAppLocked: (isLocked: boolean) => void
  setIsScreenLockPassCodeRequireOnStart: (isRequire: boolean) => void
  setIsHideMacOSDockIcon: (isHideMacOSDockIcon: boolean) => void
  setHotKeysShowHideMainAppWindow: (hotKeysShowHideMainAppWindow: string) => void
  setHotKeysShowHideQuickPasteWindow: (hotKeysShowHideQuickPasteWindow: string) => void
  hashPassword: (pass: string) => Promise<string>
  isNotTourCompletedOrSkipped: (tourName: string) => boolean
  verifyPassword: (pass: string, hash: string) => Promise<boolean>
  storePassword: (name: string, pass: string) => Promise<string>
  getStoredPassword: (name: string) => Promise<string | null>
  verifyStoredPassword: (name: string, pass: string) => Promise<string>
  deleteStoredPassword: (name: string) => Promise<boolean>
  updateSetting: (name: string, value: string | boolean | number | null) => void
  checkForUpdate: (isManualCheck?: boolean) => void
  resetCheckForUpdate: () => void
  shouldSkipVersionCheck: (newVersion: string, isManualCheck?: boolean) => boolean
  setUpdaterRemindLater: (isReset?: boolean) => void
  setUpdaterSkipVersion: (skipVersion: string | null) => void
  installUpdate: () => void
  syncStateUpdate: (name: string, value: any) => void
  relaunchApp: () => void
  initSettings: (settings: Settings) => void
}

const initialState: SettingsStoreState & Settings = {
  appLastUpdateVersion: '0.0.1',
  appLastUpdateDate: '',
  isAppReady: false,
  appDataDir: '',
  isHistoryEnabled: true,
  isFirstRun: true,
  historyDetectLanguagesEnabledList: [],
  appToursCompletedList: [],
  appToursSkippedList: [],
  historyDetectLanguagesPrioritizedList: [],
  historyExclusionList: '',
  historyExclusionAppList: '',
  isExclusionListEnabled: false,
  isExclusionAppListEnabled: false,
  isAutoClearSettingsEnabled: false,
  isAutoMaskWordsListEnabled: false,
  isHideMacOSDockIcon: false,
  isNotTourCompletedOrSkipped: () => false,
  hotKeysShowHideMainAppWindow: '',
  hotKeysShowHideQuickPasteWindow: '',
  autoMaskWordsList: '',
  isHistoryDetectLanguageEnabled: true,
  historyDetectLanguageMinLines: 3,
  autoClearSettingsDuration: 1,
  autoClearSettingsDurationType: 'months',
  copyPasteDelay: 0,
  copyPasteSequencePinnedDelay: 3,
  copyPasteSequenceIsReversOrder: false,
  pasteSequenceEachSeparator: '',
  isSearchNameOrLabelOnly: true,
  isAutoCloseOnCopyPaste: false,
  isAutoPreviewLinkCardsEnabled: true,
  isAutoGenerateLinkCardsEnabled: true,
  isAutoFavoriteOnDoubleCopyEnabled: true,
  isShowCollectionNameOnNavBar: true,
  isShowDisabledCollectionsOnNavBarMenu: true,
  isClipNotesHoverCardsEnabled: true,
  clipNotesHoverCardsDelayMS: 2000,
  clipNotesMaxWidth: 220,
  clipNotesMaxHeight: 120,
  isSkipAutoStartPrompt: false,
  userSelectedLanguage: '',
  isHistoryAutoUpdateOnCaputureEnabled: true,
  isIdleScreenAutoLockEnabled: false,
  idleScreenAutoLockTimeInMinutes: null,
  isShowHistoryCaptureOnLockedScreen: false,
  screenLockPassCode: null,
  screenLockPassCodeLength: 0,
  screenLockRecoveryPasswordMasked: null,
  isAppLocked: false,
  isScreenLockPassCodeRequireOnStart: false,
  isFirstRunAfterUpdate: false,
  CONST: {
    APP_DETECT_LANGUAGES_SUPPORTED: [],
  },
  setClipNotesMaxWidth: () => {},
  setClipNotesMaxHeight: () => {},
  setIsHistoryEnabled: () => {},
  setCopyPasteDelay: () => {},
  setCopyPasteSequencePinnedDelay: () => {},
  setCopyPasteSequenceIsReversOrder: () => {},
  setPasteSequenceEachSeparator: () => {},
  setIsExclusionListEnabled: () => {},
  setHistoryExclusionAppList: () => {},
  setIsExclusionAppListEnabled: () => {},
  setHistoryDetectLanguageMinLines: () => {},
  setAutoClearSettingsDuration: () => {},
  setAutoClearSettingsDurationType: () => {},
  setIsHistoryDetectLanguageEnabled: () => {},
  setIsHideMacOSDockIcon: () => {},
  setHotKeysShowHideMainAppWindow: () => {},
  setHotKeysShowHideQuickPasteWindow: () => {},
  setHistoryExclusionList: () => {},
  setIsHistoryAutoUpdateOnCaputureEnabled: () => {},
  addToHistoryExclusionAppList: () => {},
  setHistoryDetectLanguagesEnabledList: () => {},
  setAppToursCompletedList: () => {},
  setAppToursSkippedList: () => {},
  setHistoryDetectLanguagesPrioritizedList: () => {},
  setIsAutoClearSettingsEnabled: () => {},
  setIsAutoMaskWordsListEnabled: () => {},
  setIsAutoCloseOnCopyPaste: () => {},
  setIsAutoPreviewLinkCardsEnabled: () => {},
  setIsAutoGenerateLinkCardsEnabled: () => {},
  setIsAutoFavoriteOnDoubleCopyEnabled: () => {},
  setIsSearchNameOrLabelOnly: () => {},
  setAutoMaskWordsList: () => {},
  setIsShowCollectionNameOnNavBar: () => {},
  setIsShowDisabledCollectionsOnNavBarMenu: () => {},
  setIsSkipAutoStartPrompt: () => {},
  setIdleScreenAutoLockTimeInMinutes: () => {},
  setIsIdleScreenAutoLockEnabled: () => {},
  setIsShowHistoryCaptureOnLockedScreen: () => {},
  setScreenLockPassCode: () => {},
  setScreenLockPassCodeLength: () => {},
  setScreenLockResetTempPassCode: () => {},
  setScreenLockRecoveryPasswordMasked: () => {},
  setIsAppLocked: () => {},
  setClipNotesHoverCardsDelayMS: () => {},
  setIsClipNotesHoverCardsEnabled: () => {},
  setIsScreenLockPassCodeRequireOnStart: () => {},
  setIsFirstRunAfterUpdate: () => {},
  initConstants: () => {},
  setAppDataDir: () => {},
  updateSetting: () => {},
  setIsFirstRun: () => {},
  setAppLastUpdateVersion: () => {},
  setAppLastUpdateDate: () => {},
  setUserSelectedLanguage: () => {},
  initSettings: () => {},
  checkForUpdate: () => {},
  resetCheckForUpdate: () => {},
  shouldSkipVersionCheck: () => false,
  setUpdaterRemindLater: () => {},
  setUpdaterSkipVersion: () => {},
  relaunchApp: () => {
    relaunch()
  },
  installUpdate: () => {},
  hashPassword: (password: string): Promise<string> =>
    invoke('hash_password', { password }),
  storePassword: (name: string, password: string): Promise<string> =>
    invoke('store_os_password', { name, password }),
  getStoredPassword: (name: string): Promise<string | null> => {
    try {
      return invoke('get_stored_os_password', { name })
    } catch (e) {
      return Promise.resolve(null)
    }
  },
  syncStateUpdate: () => {},
  verifyStoredPassword: (name: string, password: string): Promise<string> =>
    invoke('verify_os_password', { name, password }),
  deleteStoredPassword: (name: string): Promise<boolean> =>
    invoke('delete_os_password', { name }),
  verifyPassword: (password: string, hash: string): Promise<boolean> =>
    invoke('verify_password', { password, hash }),
}

export const settingsStore = createStore<SettingsStoreState & Settings>()((set, get) => ({
  ...initialState,
  syncStateUpdate: (setting: string, value: string | boolean | number | null) => {
    emit('settings-store-sync', { setting, value })
  },

  updateSetting: async (name: string, value: string | boolean | number | null) => {
    let settingType
    if (typeof value === 'boolean') {
      settingType = { valueBool: value }
    } else if (typeof value === 'string') {
      settingType = { valueText: value }
    } else if (typeof value === 'number') {
      settingType = { valueInt: value }
    } else {
      settingType = { valueInt: null, valueText: null, valueBool: null }
    }

    try {
      await invoke('update_setting', {
        setting: {
          name,
          ...settingType,
        },
      })

      if (
        name === 'isHistoryEnabled' ||
        name === 'userSelectedLanguage' ||
        name === 'isAppLocked'
      ) {
        invoke('build_system_menu')
      }

      if (name === 'historyDetectLanguagesEnabledList' && typeof value === 'string') {
        return set(() => ({
          historyDetectLanguagesEnabledList: value.split(','),
        }))
      }

      if (name === 'appToursCompletedList' && typeof value === 'string') {
        return set(() => ({
          appToursCompletedList: value.split(','),
        }))
      }

      if (name === 'appToursSkippedList' && typeof value === 'string') {
        return set(() => ({
          appToursSkippedList: value.split(','),
        }))
      }

      if (name === 'historyDetectLanguagesPrioritizedList' && typeof value === 'string') {
        return set(() => ({
          historyDetectLanguagesPrioritizedList: value.split(','),
        }))
      }

      return set(() => ({ [name]: value }))
    } catch (e) {
      console.error(e)
    }
  },
  setIsHistoryAutoUpdateOnCaputureEnabled: async (
    isHistoryAutoUpdateOnCaputureEnabled: boolean
  ) => {
    get().syncStateUpdate(
      'isHistoryAutoUpdateOnCaputureEnabled',
      isHistoryAutoUpdateOnCaputureEnabled
    )
    return get().updateSetting(
      'isHistoryAutoUpdateOnCaputureEnabled',
      isHistoryAutoUpdateOnCaputureEnabled
    )
  },
  setIsHistoryEnabled: async (isHistoryEnabled: boolean) => {
    get().syncStateUpdate('isHistoryEnabled', isHistoryEnabled)
    return get().updateSetting('isHistoryEnabled', isHistoryEnabled)
  },
  setIsHistoryDetectLanguageEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isHistoryDetectLanguageEnabled', isEnabled)
  },
  setHistoryDetectLanguageMinLines: async (lines: number) => {
    return get().updateSetting('historyDetectLanguageMinLines', lines)
  },
  setHistoryExclusionList: async (text: string) => {
    return get().updateSetting('historyExclusionList', text)
  },
  setHistoryExclusionAppList: async (text: string) => {
    return get().updateSetting('historyExclusionAppList', text)
  },
  addToHistoryExclusionAppList: async (text: string) => {
    const { historyExclusionAppList } = get()
    const list = historyExclusionAppList.split('\n').filter(Boolean)
    list.push(text)
    const newList = Array.from(new Set(list)).join('\n')
    return get().updateSetting('historyExclusionAppList', newList)
  },
  setAutoMaskWordsList: async (text: string) => {
    return get().updateSetting('autoMaskWordsList', text)
  },
  setUserSelectedLanguage: async (text: string) => {
    get().syncStateUpdate('userSelectedLanguage', text)
    return get().updateSetting('userSelectedLanguage', text)
  },
  setAutoClearSettingsDuration: async (duration: number) => {
    return get().updateSetting('autoClearSettingsDuration', duration)
  },
  setAutoClearSettingsDurationType: async (type: string) => {
    return get().updateSetting('autoClearSettingsDurationType', type)
  },
  setIsAutoMaskWordsListEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoMaskWordsListEnabled', isEnabled)
  },
  setIsAutoCloseOnCopyPaste: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoCloseOnCopyPaste', isEnabled)
  },
  setIsSearchNameOrLabelOnly: async (isEnabled: boolean) => {
    return get().updateSetting('isSearchNameOrLabelOnly', isEnabled)
  },
  setIsAutoClearSettingsEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoClearSettingsEnabled', isEnabled)
  },
  setIsAutoPreviewLinkCardsEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoPreviewLinkCardsEnabled', isEnabled)
  },
  setIsAutoGenerateLinkCardsEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoGenerateLinkCardsEnabled', isEnabled)
  },
  setIsAutoFavoriteOnDoubleCopyEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoFavoriteOnDoubleCopyEnabled', isEnabled)
  },
  setIsExclusionListEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isExclusionListEnabled', isEnabled)
  },
  setIsExclusionAppListEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isExclusionAppListEnabled', isEnabled)
  },
  setIsShowCollectionNameOnNavBar: async (isEnabled: boolean) => {
    return get().updateSetting('isShowCollectionNameOnNavBar', isEnabled)
  },
  setIsSkipAutoStartPrompt: async (isEnabled: boolean) => {
    return get().updateSetting('isSkipAutoStartPrompt', isEnabled)
  },
  setIsShowDisabledCollectionsOnNavBarMenu: async (isEnabled: boolean) => {
    return get().updateSetting('isShowDisabledCollectionsOnNavBarMenu', isEnabled)
  },
  setHistoryDetectLanguagesEnabledList: async (list: string[]) => {
    return get().updateSetting(
      'historyDetectLanguagesEnabledList',
      list.filter(Boolean).join()
    )
  },
  setAppToursCompletedList: async (list: string[]) => {
    return get().updateSetting('appToursCompletedList', list.filter(Boolean).join())
  },
  setAppToursSkippedList: async (list: string[]) => {
    return get().updateSetting('appToursSkippedList', list.filter(Boolean).join())
  },
  setHistoryDetectLanguagesPrioritizedList: async (list: string[]) => {
    return get().updateSetting(
      'historyDetectLanguagesPrioritizedList',
      list.filter(Boolean).join()
    )
  },
  setIsClipNotesHoverCardsEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isClipNotesHoverCardsEnabled', isEnabled)
  },
  setClipNotesHoverCardsDelayMS: async (delay: number) => {
    return get().updateSetting('clipNotesHoverCardsDelayMS', delay)
  },
  setClipNotesMaxHeight: async (height: number) => {
    return get().updateSetting('clipNotesMaxHeight', height)
  },
  setClipNotesMaxWidth: async (width: number) => {
    return get().updateSetting('clipNotesMaxWidth', width)
  },
  setCopyPasteDelay: async (delay: number) => {
    get().syncStateUpdate('copyPasteDelay', delay)
    return get().updateSetting('copyPasteDelay', delay)
  },
  setCopyPasteSequencePinnedDelay: async (delay: number) => {
    get().syncStateUpdate('copyPasteSequencePinnedDelay', delay)
    return get().updateSetting('copyPasteSequencePinnedDelay', delay)
  },
  setCopyPasteSequenceIsReversOrder: async (isReversOrder: boolean) => {
    get().syncStateUpdate('copyPasteSequenceIsReversOrder', isReversOrder)
    return get().updateSetting('copyPasteSequenceIsReversOrder', isReversOrder)
  },
  setPasteSequenceEachSeparator: async (separator: string) => {
    get().syncStateUpdate('pasteSequenceEachSeparator', separator)
    return get().updateSetting('pasteSequenceEachSeparator', separator)
  },
  setIsIdleScreenAutoLockEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isIdleScreenAutoLockEnabled', isEnabled)
  },
  setIdleScreenAutoLockTimeInMinutes: async (time: number | null) => {
    return get().updateSetting('idleScreenAutoLockTimeInMinutes', time)
  },
  setIsShowHistoryCaptureOnLockedScreen: async (isEnabled: boolean) => {
    return get().updateSetting('isShowHistoryCaptureOnLockedScreen', isEnabled)
  },
  setScreenLockPassCode: async (passCode: string | null) => {
    get().syncStateUpdate('screenLockPassCode', passCode)
    return get().updateSetting('screenLockPassCode', passCode ? passCode : null)
  },
  setScreenLockPassCodeLength: async (length: number) => {
    return get().updateSetting('screenLockPassCodeLength', length)
  },
  setScreenLockRecoveryPasswordMasked: async (backupPasswordMasked: string | null) => {
    return get().updateSetting('screenLockRecoveryPasswordMasked', backupPasswordMasked)
  },
  setIsAppLocked: async (isLocked: boolean) => {
    return get().updateSetting('isAppLocked', isLocked)
  },
  setIsScreenLockPassCodeRequireOnStart: async (isRequire: boolean) => {
    return get().updateSetting('isScreenLockPassCodeRequireOnStart', isRequire)
  },
  setIsFirstRunAfterUpdate: async (isFirstRunAfterUpdate: boolean) => {
    return get().updateSetting('isFirstRunAfterUpdate', isFirstRunAfterUpdate)
  },
  setIsFirstRun: (isFirstRun: boolean) => {
    return get().updateSetting('isFirstRun', isFirstRun)
  },
  setIsHideMacOSDockIcon: async (isHideMacOSDockIcon: boolean) => {
    return get().updateSetting('isHideMacOSDockIcon', isHideMacOSDockIcon)
  },
  setHotKeysShowHideMainAppWindow: async (hotKeysShowHideMainAppWindow: string) => {
    return get().updateSetting(
      'hotKeysShowHideMainAppWindow',
      hotKeysShowHideMainAppWindow
    )
  },
  setHotKeysShowHideQuickPasteWindow: async (hotKeysShowHideQuickPasteWindow: string) => {
    return get().updateSetting(
      'hotKeysShowHideQuickPasteWindow',
      hotKeysShowHideQuickPasteWindow
    )
  },
  isNotTourCompletedOrSkipped: (tourName: string) => {
    const { appToursCompletedList, appToursSkippedList } = get()
    return (
      !appToursCompletedList.includes(tourName) && !appToursSkippedList.includes(tourName)
    )
  },
  installUpdate: async () => {
    showUpdateInstalling.value = true
    showUpdateError.value = false
    showUpdateErrorPermissionDenied.value = false

    try {
      await checkUpdate()
      await installUpdate()
      showUpdateInstalling.value = false
      showRestartAfterUpdate.value = true
      get().setIsFirstRunAfterUpdate(true)
      if (availableVersionNumber.value) {
        get().setAppLastUpdateVersion(availableVersionNumber.value)
      }
      if (availableVersionDateISO.value) {
        get().setAppLastUpdateDate(availableVersionDateISO.value)
      }

      setTimeout(() => {
        relaunch()
      }, 600)
    } catch (e) {
      console.error('Install Update Error:', e)
      const { message } = e as Error
      if (
        message?.toLocaleLowerCase().includes('permission') ||
        message?.toLocaleLowerCase().includes('denied')
      ) {
        showUpdateErrorPermissionDenied.value = true
      }
      showUpdateInstalling.value = false
      showUpdateError.value = true
    }
  },
  checkForUpdate: async (isManualCheck?: boolean) => {
    showUpdateChecking.value = true
    try {
      const { shouldUpdate, manifest } = await checkUpdate()
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (
        shouldUpdate &&
        manifest?.version &&
        !get().shouldSkipVersionCheck(manifest?.version, isManualCheck)
      ) {
        availableVersionNumber.value = manifest?.version ?? null
        if (manifest?.body) {
          // @ts-expect-error
          window['markdown'].ready.then(markdown => {
            try {
              const html = markdown.parse(manifest?.body)
              availableVersionBody.value = DOMPurify.sanitize(html as string, {
                USE_PROFILES: { html: true },
              })
            } catch (e) {
              if (import.meta.env.TAURI_DEBUG) {
                console.error('Markdown Parse Error:', e)
              }
              availableVersionBody.value = null
            }
          })
        } else {
          availableVersionBody.value = null
        }

        if (manifest?.date) {
          const versionDate = manifest?.date.split(' ')[0] ?? null
          availableVersionDate.value = dayjs(versionDate).format('DD MMMM, YYYY')
          availableVersionDateISO.value = dayjs(versionDate).format('YYYY-MM-DD')
        }
        showUpdateAvailable.value = true
        showUpdateChecking.value = false
      } else {
        if (isManualCheck) {
          showUpdateAppIsLatest.value = true
          setTimeout(() => {
            showUpdateAppIsLatest.value = false
            showUpdateChecking.value = false
          }, 3000)
        } else {
          showUpdateChecking.value = false
        }
      }
    } catch (e) {
      console.error('Check Update Error:', e)
      if (isManualCheck) {
        showUpdateChecking.value = false
        showUpdateAppIsLatest.value = true
        setTimeout(() => {
          showUpdateAppIsLatest.value = false
          showUpdateChecking.value = false
        }, 3000)
      } else {
        showUpdateChecking.value = false
      }
    }
    if (isManualCheck) {
      get().setUpdaterRemindLater(true)
      get().setUpdaterSkipVersion(null)
    }
  },
  shouldSkipVersionCheck: (newVersion: string, isManualCheck?: boolean) => {
    if (isManualCheck) {
      return false
    }

    const remindLater = localStorage.getItem('updaterRemindLater')

    if (remindLater && dayjs().isBefore(remindLater)) {
      return true
    }

    const skipVersion = localStorage.getItem('updaterSkipVersion')

    return Boolean(
      skipVersion &&
        (skipVersion === newVersion || semverCompare(skipVersion, newVersion) >= 0)
    )
  },
  setUpdaterRemindLater: (isReset?: boolean) => {
    if (isReset) {
      localStorage.removeItem('updaterRemindLater')
      return
    }
    localStorage.setItem('updaterRemindLater', dayjs().add(3, 'day').format('YYYY-MM-DD'))
    get().resetCheckForUpdate()
  },
  setUpdaterSkipVersion: (skipVersion: string | null) => {
    if (skipVersion === null) {
      localStorage.removeItem('updaterSkipVersion')
      return
    }
    localStorage.setItem('updaterSkipVersion', skipVersion)
    get().resetCheckForUpdate()
  },
  resetCheckForUpdate: () => {
    showUpdateAvailable.value = false
    showUpdateAppIsLatest.value = false
    showRestartAfterUpdate.value = false
    showUpdateInstalling.value = false
    showUpdateError.value = false
    availableVersionNumber.value = null
    availableVersionBody.value = null
    availableVersionDate.value = null
    availableVersionDateISO.value = null
  },
  initConstants: (CONST: Constants) => set(() => ({ CONST })),
  setAppDataDir: (appDataDir: string) =>
    set(() => ({
      appDataDir,
    })),
  setAppLastUpdateVersion: (appLastUpdateVersion: string) => {
    return get().updateSetting('appLastUpdateVersion', appLastUpdateVersion)
  },
  setAppLastUpdateDate: (appLastUpdateDate: string) => {
    return get().updateSetting('appLastUpdateDate', appLastUpdateDate)
  },
  initSettings: (settings: Settings) => {
    const newInitSettings = Object.keys(initialState).reduce(
      (acc: Settings, key: string) => {
        if (
          typeof settings[key as keyof Settings] !== 'undefined' &&
          settings[key as keyof Settings] !== null
        ) {
          // @ts-expect-error
          acc[key as keyof Settings] = settings[key as keyof Settings]
        }
        return acc
      },
      {} as Settings
    )

    set(prev => ({
      ...prev,
      ...newInitSettings,
    }))
  },
}))

export const listenToSettingsStoreEvents = listen('settings-store-sync', async event => {
  const { payload } = event
  const { setting, value } = payload as {
    setting: string
    value: string | boolean | number | null
  }
  if (
    (window.isHistoryWindow && event.windowLabel !== 'history') ||
    (window.isMainWindow && event.windowLabel !== 'main')
  ) {
    if (
      setting === 'userSelectedLanguage' &&
      settingsStore.getState().userSelectedLanguage !== value &&
      typeof value === 'string'
    ) {
      i18n.changeLanguage(value)
      return
    }
    if (
      setting === 'copyPasteDelay' &&
      settingsStore.getState().copyPasteDelay !== value &&
      typeof value === 'number'
    ) {
      settingsStore.setState({ copyPasteDelay: value })
      return
    }
    if (
      setting === 'copyPasteSequencePinnedDelay' &&
      settingsStore.getState().copyPasteSequencePinnedDelay !== value &&
      typeof value === 'number'
    ) {
      settingsStore.setState({ copyPasteSequencePinnedDelay: value })
      return
    }
    if (
      setting === 'copyPasteSequenceIsReversOrder' &&
      settingsStore.getState().copyPasteSequenceIsReversOrder !== value &&
      typeof value === 'boolean'
    ) {
      settingsStore.setState({ copyPasteSequenceIsReversOrder: value })
      return
    }
    if (
      setting === 'pasteSequenceEachSeparator' &&
      settingsStore.getState().pasteSequenceEachSeparator !== value &&
      typeof value === 'string'
    ) {
      settingsStore.setState({ pasteSequenceEachSeparator: value })
      return
    }
    if (
      setting === 'isHistoryEnabled' &&
      settingsStore.getState().isHistoryEnabled !== value &&
      typeof value === 'boolean'
    ) {
      settingsStore.setState({ isHistoryEnabled: value })
      return
    }
    if (
      setting === 'isHistoryAutoUpdateOnCaputureEnabled' &&
      settingsStore.getState().isHistoryAutoUpdateOnCaputureEnabled !== value &&
      typeof value === 'boolean'
    ) {
      settingsStore.setState({ isHistoryAutoUpdateOnCaputureEnabled: value })
      return
    }
    if (
      setting === 'screenLockPassCode' &&
      settingsStore.getState().screenLockPassCode !== value &&
      typeof value === 'string'
    ) {
      settingsStore.setState({ screenLockPassCode: value })
      return
    }
  }
})

export const settingsStoreAtom = atomWithStore(settingsStore)

export { showUpdateAppIsLatest, showUpdateChecking }

if (import.meta.env.TAURI_DEBUG) {
  // @ts-expect-error
  window.settingsStore = settingsStore
}
