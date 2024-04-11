import { atomWithStore } from 'jotai-zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export const availableColors = [
  'slate',
  'sky',
  'stone',
  'teal',
  'indigo',
  'green',
  'yellow',
  'blue',
  'purple',
  'rose',
  'lime',
  'emerald',
  'amber',
  'cyan',
  'fuchsia',
  'pink',
]

export const fontSizeIncrements = [
  '85%',
  '90%',
  '95%',
  '100%',
  '105%',
  '110%',
  '120%',
  '125%',
]

export interface UIStoreState {
  fontSize: string
  isSwapPanels: boolean
  isShowPinned: boolean
  isShowHistoryPinned: boolean
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  isScrolling: boolean
  setIsScrolling: (isScrolling: boolean) => void
  isWindows: boolean
  isMacOSX: boolean
  isLinux: boolean
  returnRoute: string
  setReturnRoute: (route: string) => void
  setIsShowPinned: (isShow: boolean) => void
  setIsShowHistoryPinned: (isShow: boolean) => void
  setOSType: (osType: string) => void
  setFontSize: (fontSize: string) => void
  setIsSwapPanels: (isSwapped: boolean) => void
  setAppDataDir: (appDataDir: string) => void
}
const initialState: UIStoreState = {
  fontSize: '100%',
  isWindows: false,
  isSwapPanels: false,
  isShowPinned: true,
  isShowHistoryPinned: true,
  isMacOSX: true,
  isLinux: false,
  isScrolling: false,
  returnRoute: '/menu',
  setIsShowPinned: () => {},
  setIsShowHistoryPinned: () => {},
  setReturnRoute: () => {},
  setIsSwapPanels: () => {},
  setIsScrolling: () => {},
  setOSType: () => {},
  resetFontSize: () => {},
  increaseFontSize: () => {},
  setFontSize: () => {},
  decreaseFontSize: () => {},
  setAppDataDir: () => {},
}

export const uiStore = createStore<UIStoreState>()(
  persist(
    (set, _get) => ({
      ...initialState,
      setIsShowPinned: (isShow: boolean) =>
        set(() => ({
          isShowPinned: isShow,
        })),
      setIsShowHistoryPinned: (isShow: boolean) =>
        set(() => ({
          isShowHistoryPinned: isShow,
        })),
      setIsSwapPanels: (isSwapped: boolean) =>
        set(() => ({
          isSwapPanels: isSwapped,
        })),
      resetFontSize: () => {
        set(() => ({
          fontSize: '100%',
        }))
      },
      setIsScrolling(isScrolling) {
        set(() => ({
          isScrolling,
        }))
      },
      setOSType: (osType: string) => {
        set(() => ({
          isWindows: osType === 'Windows_NT',
          isMacOSX: osType === 'Darwin',
          isLinux: osType === 'Linux',
        }))
      },
      setFontSize: (fontSize: string) => {
        set(() => ({
          fontSize,
        }))
      },
      increaseFontSize: () => {
        set(state => {
          const currentSizeIndex = fontSizeIncrements.indexOf(state.fontSize)
          const nextSizeIndex = Math.min(
            fontSizeIncrements.length - 1,
            currentSizeIndex + 1
          )
          return {
            fontSize: fontSizeIncrements[nextSizeIndex],
          }
        })
      },
      decreaseFontSize: () => {
        set(state => {
          const currentSizeIndex = fontSizeIncrements.indexOf(state.fontSize)
          const prevSizeIndex = Math.max(0, currentSizeIndex - 1)
          return {
            fontSize: fontSizeIncrements[prevSizeIndex],
          }
        })
      },
      setReturnRoute: (route: string) => {
        set(() => ({
          returnRoute: route,
        }))
      },
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export const uiStoreAtom = atomWithStore(uiStore)
