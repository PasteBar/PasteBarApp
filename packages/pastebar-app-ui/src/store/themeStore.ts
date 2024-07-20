import { atomWithStore } from 'jotai-zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import type { Direction, Mode } from '~/types/theme'

export type ThemeState = {
  direction: Direction
  mode: Mode
  setDirection: (direction: Direction) => void
  setSystemTheme: (systemTheme: string) => void
  setDeviceId: (deviceId: string) => void
  themeDark: () => boolean
  deviceId: string
  systemTheme: string
  setMode: (mode: Mode) => void
}

const initialState: ThemeState = {
  direction: 'ltr',
  mode: 'system',
  systemTheme: 'light',
  deviceId: '',
  themeDark: () => false,
  setDeviceId: () => {},
  setSystemTheme: () => {},
  setDirection: () => {},
  setMode: () => {},
}

export const themeStore = createStore<ThemeState>()(
  persist(
    (set, get) => ({
      ...initialState,
      themeDark: () => {
        const { mode, systemTheme } = get()
        if (mode === 'system') {
          return systemTheme === 'dark'
        }
        return mode === 'dark'
      },
      setSystemTheme: (systemTheme: string) => {
        set({ systemTheme })
      },
      setDeviceId: (deviceId: string) => {
        set(() => ({ deviceId }))
      },
      setMode: (mode: Mode) => {
        set({ mode })
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        mode: state.mode,
        deviceId: state.deviceId,
        direction: state.direction,
      }),
    }
  )
)

export const themeStoreAtom = atomWithStore(themeStore)
