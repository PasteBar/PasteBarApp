import logger from '~/libs/zustand-logger'
import { atomWithStore } from 'jotai-zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export type UserState = {
  avatar?: string
  userName?: string
  email?: string
  authority?: string[]
}

const initialUserState: UserState = {
  avatar: '',
  userName: '',
  email: '',
  authority: [],
}

export interface AuthStoreState {
  user: UserState
  signedIn: boolean
  token: string | null
  setUser: (user: UserState) => void
  signInSuccess: (token: string) => void
  signOutSuccess: () => void
}

export const authStore = createStore<AuthStoreState>()(
  persist(
    logger(
      set => ({
        user: {
          ...initialUserState,
        },
        signedIn: false,
        token: null,

        setUser: (user: UserState) =>
          set(prev => ({
            ...prev,
            user: {
              ...prev.user,
              avatar: user.avatar,
              email: user.email,
              userName: user.userName,
              authority: user.authority,
            },
          })),

        signInSuccess: (token: string) =>
          set(() => ({
            signedIn: true,
            token,
          })),

        signOutSuccess: () =>
          set(() => ({
            signedIn: false,
            token: null,
          })),
      }),
      { enabled: true }
    ),
    {
      name: 'auth-store', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
      // partialize: state => ({ mode: state.mode, currentRouteKey: state.currentRouteKey })
    }
  )
)

export const authStoreAtom = atomWithStore(authStore)
