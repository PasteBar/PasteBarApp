import { invoke } from '@tauri-apps/api'
import { atomWithStore } from 'jotai-zustand'
import { createStore } from 'zustand/vanilla'

type Settings = {
  appVersion: string
  appDataDir: string
  isAppReady: boolean
  isHistoryEnabled: boolean
  historyExclusionList: string
  historyDetectLanguagesEnabledList: string[]
  isHistoryDetectLanguageEnabled: boolean
  isExclusionListEnabled: boolean
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
  isAutoCloseOnCopyPaste: boolean
  isAutoPreviewLinkCardsEnabled: boolean
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
  licenseKey: string | null
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
  setIsHistoryDetectLanguageEnabled: (isEnabled: boolean) => void
  setIsExclusionListEnabled: (isEnabled: boolean) => void
  setIsAutoClearSettingsEnabled: (isEnabled: boolean) => void
  setAutoClearSettingsDuration: (duration: number) => void
  setAutoClearSettingsDurationType: (type: string) => void
  CONST: Constants
  setAppVersion: (appVersion: string) => void
  setIsAutoMaskWordsListEnabled: (isEnabled: boolean) => void
  setAutoMaskWordsList: (text: string) => void
  setHistoryDetectLanguagesEnabledList: (words: string[]) => void
  setAppDataDir: (appDataDir: string) => void
  setIsAutoCloseOnCopyPaste: (isEnabled: boolean) => void
  setIsAutoPreviewLinkCardsEnabled: (isEnabled: boolean) => void
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
  setLicenseKey: (licenseKey: string | null) => void
  hashPassword: (pass: string) => Promise<string>
  verifyPassword: (pass: string, hash: string) => Promise<boolean>
  storePassword: (name: string, pass: string) => Promise<string>
  getStoredPassword: (name: string) => Promise<string | null>
  verifyStoredPassword: (name: string, pass: string) => Promise<string>
  deleteStoredPassword: (name: string) => Promise<boolean>
  updateSetting: (name: string, value: string | boolean | number | null) => void
  initSettings: (settings: Settings) => void
}

const initialState: SettingsStoreState & Settings = {
  appVersion: '0.0.1',
  isAppReady: false,
  appDataDir: '',
  isHistoryEnabled: true,
  isFirstRun: true,
  historyDetectLanguagesEnabledList: [],
  historyExclusionList: '',
  isExclusionListEnabled: false,
  isAutoClearSettingsEnabled: false,
  isAutoMaskWordsListEnabled: false,
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
  isAutoFavoriteOnDoubleCopyEnabled: true,
  isShowCollectionNameOnNavBar: true,
  isShowDisabledCollectionsOnNavBarMenu: true,
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
  licenseKey: null,
  isFirstRunAfterUpdate: false,
  CONST: {
    APP_DETECT_LANGUAGES_SUPPORTED: [],
  },
  setIsHistoryEnabled: () => {},
  setCopyPasteDelay: () => {},
  setCopyPasteSequencePinnedDelay: () => {},
  setCopyPasteSequenceIsReversOrder: () => {},
  setPasteSequenceEachSeparator: () => {},
  setIsExclusionListEnabled: () => {},
  setHistoryDetectLanguageMinLines: () => {},
  setAutoClearSettingsDuration: () => {},
  setAutoClearSettingsDurationType: () => {},
  setIsHistoryDetectLanguageEnabled: () => {},
  setHistoryExclusionList: () => {},
  setIsHistoryAutoUpdateOnCaputureEnabled: () => {},
  setHistoryDetectLanguagesEnabledList: () => {},
  setIsAutoClearSettingsEnabled: () => {},
  setIsAutoMaskWordsListEnabled: () => {},
  setIsAutoCloseOnCopyPaste: () => {},
  setIsAutoPreviewLinkCardsEnabled: () => {},
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
  setIsScreenLockPassCodeRequireOnStart: () => {},
  setLicenseKey: () => {},
  setIsFirstRunAfterUpdate: () => {},
  initConstants: () => {},
  setAppDataDir: () => {},
  updateSetting: () => {},
  setIsFirstRun: () => {},
  setAppVersion: () => {},
  setUserSelectedLanguage: () => {},
  initSettings: () => {},
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
  verifyStoredPassword: (name: string, password: string): Promise<string> =>
    invoke('verify_os_password', { name, password }),
  deleteStoredPassword: (name: string): Promise<boolean> =>
    invoke('delete_os_password', { name }),
  verifyPassword: (password: string, hash: string): Promise<boolean> =>
    invoke('verify_password', { password, hash }),
}

export const settingsStore = createStore<SettingsStoreState & Settings>()((set, get) => ({
  ...initialState,
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

      return set(() => ({ [name]: value }))
    } catch (e) {
      console.error(e)
    }
  },
  setIsHistoryAutoUpdateOnCaputureEnabled: async (
    isHistoryAutoUpdateOnCaputureEnabled: boolean
  ) => {
    return get().updateSetting(
      'isHistoryAutoUpdateOnCaputureEnabled',
      isHistoryAutoUpdateOnCaputureEnabled
    )
  },
  setIsHistoryEnabled: async (isHistoryEnabled: boolean) => {
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
  setAutoMaskWordsList: async (text: string) => {
    return get().updateSetting('autoMaskWordsList', text)
  },
  setUserSelectedLanguage: async (text: string) => {
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
  setIsAutoFavoriteOnDoubleCopyEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isAutoFavoriteOnDoubleCopyEnabled', isEnabled)
  },
  setIsExclusionListEnabled: async (isEnabled: boolean) => {
    return get().updateSetting('isExclusionListEnabled', isEnabled)
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
    return get().updateSetting('historyDetectLanguagesEnabledList', list.join())
  },
  setCopyPasteDelay: async (delay: number) => {
    return get().updateSetting('copyPasteDelay', delay)
  },
  setCopyPasteSequencePinnedDelay: async (delay: number) => {
    return get().updateSetting('copyPasteSequencePinnedDelay', delay)
  },
  setCopyPasteSequenceIsReversOrder: async (isReversOrder: boolean) => {
    return get().updateSetting('copyPasteSequenceIsReversOrder', isReversOrder)
  },
  setPasteSequenceEachSeparator: async (separator: string) => {
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
  setLicenseKey: async (licenseKey: string | null) => {
    return get().updateSetting('licenseKey', licenseKey)
  },
  setIsFirstRunAfterUpdate: async (isFirstRunAfterUpdate: boolean) => {
    return get().updateSetting('isFirstRunAfterUpdate', isFirstRunAfterUpdate)
  },
  setIsFirstRun: (isFirstRun: boolean) => set(() => ({ isFirstRun })),
  initConstants: (CONST: Constants) => set(() => ({ CONST })),
  setAppDataDir: (appDataDir: string) =>
    set(() => ({
      appDataDir,
    })),
  setAppVersion: (appVersion: string) =>
    set(() => ({
      appVersion,
    })),
  initSettings: (settings: Settings) => {
    const newInitSettings = Object.keys(initialState).reduce(
      (acc: Settings, key: string) => {
        if (typeof settings[key as keyof Settings] !== 'undefined') {
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

export const settingsStoreAtom = atomWithStore(settingsStore)

if (import.meta.env.TAURI_DEBUG) {
  // @ts-expect-error
  window.settingsStore = settingsStore
}
