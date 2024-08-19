import { invoke } from '@tauri-apps/api'
import { availableMonitors, WebviewWindow } from '@tauri-apps/api/window'
import { atomWithStore } from 'jotai-zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export const HISTORY_DEFAULT_PANEL_WIDTH_MAC = 350
export const HISTORY_DEFAULT_PANEL_WIDTH_WIN = 320

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

export const clipNotesDelays = [300, 500, 800, 1000, 1500, 2000, 2500, 3000, 3500, 5000]
export const clipNotesSizes = [
  {
    title: 'Small',
    width: 220,
    iconSize: 15,
    height: 120,
  },
  {
    title: 'Medium',
    width: 320,
    iconSize: 18,
    height: 160,
  },
  {
    title: 'Large',
    width: 420,
    iconSize: 21,
    height: 220,
  },
]

export interface UIStoreState {
  fontSize: string
  panelSize: number
  isHideMainWindow: boolean
  isSwapPanels: boolean
  isShowPinned: boolean
  isSplitPanelView: boolean
  isShowHistoryPinned: boolean
  setIsHideMainWindow: (isHideMainWindow: boolean) => void
  setIsSplitPanelView: (isSplitPanelView: boolean) => void
  toggleIsSplitPanelView: () => void
  toggleHistoryQuickPasteWindow: () => void
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
  getDefaultPanelWidth: () => number
  setIsShowHistoryPinned: (isShow: boolean) => void
  setOSType: (osType: string) => void
  setFontSize: (fontSize: string) => void
  setPanelSize: (panelSize: number) => void
  setIsSwapPanels: (isSwapped: boolean) => void
  setAppDataDir: (appDataDir: string) => void
}
const initialState: UIStoreState = {
  fontSize: '100%',
  isWindows: false,
  isSwapPanels: false,
  panelSize: 320,
  isSplitPanelView: false,
  isShowPinned: true,
  isShowHistoryPinned: true,
  isMacOSX: true,
  isLinux: false,
  isScrolling: false,
  isHideMainWindow: false,
  returnRoute: '/menu',
  setIsHideMainWindow: () => {},
  setIsSplitPanelView: () => {},
  toggleIsSplitPanelView: () => {},
  toggleHistoryQuickPasteWindow: () => {},
  setIsShowPinned: () => {},
  getDefaultPanelWidth: () => 320,
  setIsShowHistoryPinned: () => {},
  setReturnRoute: () => {},
  setIsSwapPanels: () => {},
  setIsScrolling: () => {},
  setOSType: () => {},
  resetFontSize: () => {},
  increaseFontSize: () => {},
  setFontSize: () => {},
  setPanelSize: () => {},
  decreaseFontSize: () => {},
  setAppDataDir: () => {},
}

export const uiStore = createStore<UIStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setIsHideMainWindow: (isHideMainWindow: boolean) =>
        set(() => ({
          isHideMainWindow,
        })),
      setIsSplitPanelView: (isSplitPanelView: boolean) =>
        set(() => ({
          isSplitPanelView,
        })),
      toggleHistoryQuickPasteWindow: async () => {
        try {
          await invoke('open_quickpaste_window', {
            width: get().panelSize,
          })
        } catch (e) {
          console.error('Failed to open history window', e)
        }
      },

      toggleIsSplitPanelView: async () => {
        const historyWindow = WebviewWindow.getByLabel('history')

        if (get().isSplitPanelView) {
          set(() => ({
            isSplitPanelView: false,
          }))
          await historyWindow?.close()
        } else {
          set(() => ({
            isSplitPanelView: true,
          }))

          try {
            await invoke('open_history_window', {
              width: get().panelSize,
            })

            const history = WebviewWindow.getByLabel('history')
            if (history) {
              await history.isVisible()
              setTimeout(() => {
                history.show()
                history.setFocus()
              }, 600)
            }
          } catch (e) {
            console.error('Failed to open history window', e)
          }
        }
      },
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
      getDefaultPanelWidth: () => {
        return get().isMacOSX
          ? HISTORY_DEFAULT_PANEL_WIDTH_MAC
          : HISTORY_DEFAULT_PANEL_WIDTH_WIN
      },
      setFontSize: (fontSize: string) => {
        set(() => ({
          fontSize,
        }))
      },
      setPanelSize: (panelSize: number) => {
        set(() => ({
          panelSize,
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
