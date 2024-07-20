// import { apiSignIn, apiSignOut, apiSignUp } from '~/services/AuthService'
import appConfig from '~/configs/app.config'
import { authStoreAtom } from '~/store'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'

import type { SignInCredential, SignUpCredential } from '~/types/auth'

import useQuery from './useQuery'

type Status = 'success' | 'failed'

const REDIRECT_URL_KEY = 'redirectUrl'

// fake api calls for apiSignIn, apiSignOut, apiSignUp
const apiSignIn = async (values: SignInCredential) => {
  return new Promise<{ data: { token: string; user: { userName: string } } }>(
    (resolve, reject) => {
      setTimeout(() => {
        resolve({
          data: {
            token: 'fake token',
            user: {
              userName: 'fake user name',
            },
          },
        })
      }, 1000)
    }
  )

  // return axios.post('/api/auth/signin', values)
}

const apiSignOut = async () => {
  return new Promise<{ data: { token: string; user: { userName: string } } }>(
    (resolve, reject) => {
      setTimeout(() => {
        resolve({
          data: {
            token: 'fake token',
            user: {
              userName: 'fake user name',
            },
          },
        })
      }, 1000)
    }
  )
  // return axios.post('/api/auth/signout', values)
}

const apiSignUp = async (values: SignUpCredential) => {
  return new Promise<{ data: { token: string; user: { userName: string } } }>(
    (resolve, reject) => {
      setTimeout(() => {
        resolve({
          data: {
            token: 'fake token',
            user: {
              userName: 'fake user name',
            },
          },
        })
      }, 1000)
    }
  )
  // return axios.post('/api/auth/signup', values)
}

export default function useAuth() {
  const [authStore] = useAtom(authStoreAtom)

  const { setUser, signInSuccess, signOutSuccess, token, signedIn } = authStore

  const navigate = useNavigate()

  const query = useQuery()

  const signIn = async (
    values: SignInCredential
  ): Promise<
    | {
        status: Status
        message: string
      }
    | undefined
  > => {
    try {
      const resp = await apiSignIn(values)
      if (resp.data) {
        const { token } = resp.data
        signInSuccess(token)
        if (resp.data.user) {
          setUser(
            resp.data.user || {
              avatar: '',
              userName: 'Anonymous',
              authority: ['USER'],
              email: '',
            }
          )
        }
        const redirectUrl = query.get(REDIRECT_URL_KEY)
        navigate(redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath, {
          replace: true,
        })
        return {
          status: 'success',
          message: '',
        }
      }
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (errors: any) {
      return {
        status: 'failed',
        message: errors?.response?.data?.message || errors.toString(),
      }
    }
  }

  const signUp = async (values: SignUpCredential) => {
    try {
      const resp = await apiSignUp(values)
      if (resp.data) {
        const { token } = resp.data
        signInSuccess(token)
        if (resp.data.user) {
          setUser(
            resp.data.user || {
              avatar: '',
              userName: 'Anonymous',
              authority: ['USER'],
              email: '',
            }
          )
        }
        const redirectUrl = query.get(REDIRECT_URL_KEY)
        navigate(redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath, {
          replace: true,
        })
        return {
          status: 'success',
          message: '',
        }
      }
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (errors: any) {
      return {
        status: 'failed',
        message: errors?.response?.data?.message || errors.toString(),
      }
    }
  }

  const handleSignOut = () => {
    signOutSuccess()

    setUser({
      avatar: '',
      userName: '',
      email: '',
      authority: [],
    })
    navigate(appConfig.unAuthenticatedEntryPath, { replace: true })
  }

  const signOut = async () => {
    await apiSignOut()
    handleSignOut()
  }

  return {
    authenticated: token && signedIn,
    signIn,
    signUp,
    signOut,
  }
}
