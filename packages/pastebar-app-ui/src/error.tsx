import 'react-complex-tree/lib/style-modern.css'
import '~/components/libs/simplebar-react/simplebar.css'
import './styles/globals.css'
import './styles/overlayscrollbars.css'

import { useState } from 'react'
import { getClient } from '@tauri-apps/api/http'
import { relaunch } from '@tauri-apps/api/process'
import { open as openUrl } from '@tauri-apps/api/shell'
import { useAtomValue } from 'jotai/react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Logo from './layout/Logo'
import { themeStoreAtom, uiStoreAtom } from './store'

export function fallbackRender({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return <AppErrorPage reset={resetErrorBoundary} error={error} />
}

export const AppErrorPage = ({ reset, error }: { reset: () => void; error: Error }) => {
  const { i18n, t } = useTranslation()

  const { themeDark, deviceId } = useAtomValue(themeStoreAtom)

  const isDark = themeDark()

  const { isMacOSX, isWindows } = useAtomValue(uiStoreAtom)

  const [showThankYou, setShowThankYou] = useState(false)

  const appOs = isMacOSX ? 'macos' : isWindows ? 'windows' : 'unknown'

  const appOSandVersion = `appVersion=${APP_VERSION}&appOs=${appOs}`

  const darkMode = isDark ? 'true' : 'false'

  const contactUrl = `${
    import.meta.env.VITE_CONTACT_SERVER_URL
  }/contact/?source=app&iserror=true&locale=${
    i18n.language
  }&deviceId=${deviceId}&dark=${darkMode}&${appOSandVersion}`

  const openContactInBrowser = () => {
    openUrl(contactUrl)
  }

  const reportErrorandRestart = async () => {
    const postBody = {
      name,
      errorMessage: error.message,
      componentStack: error.stack,
      appVersion: APP_VERSION,
      isError: true,
      appOs,
      deviceId,
      appLanguage: i18n.language,
    }

    const client = await getClient()
    try {
      const resp = (await client.post(
        `${import.meta.env.VITE_CONTACT_SERVER_URL}/api/error-report`,
        { type: 'Json', payload: postBody }
      )) as {
        data: {
          code: number
        }
      }

      if (resp?.data?.code !== 200) {
        console.error('error', resp.data)
      }
    } catch (error) {
      console.error('error', error)
    }

    setShowThankYou(true)

    setTimeout(() => {
      setShowThankYou(false)
      reset()
    }, 2000)
  }

  return (
    <div
      className="w-screen h-screen flex justify-center items-center border flex-col bg-red-100/70 dark:bg-red-950 text-black dark:text-white"
      data-tauri-drag-region
    >
      <div className="flex fixed top-0 left-0 w-full" data-tauri-drag-region>
        <div className="flex justify-center items-center mx-2">
          <Logo className="w-10 h-10 mr-1" />
          <span className="text-lg font-bold text-[#25c8db] mt-2">PasteBar</span>
        </div>
        <X
          className="w-6 h-6 m-4 text-amber-500 cursor-pointer ml-auto"
          onClick={reset}
        />
      </div>

      <div className="flex flex-col max-w-2xl gap-6 justify-center items-center px-10 py-6 rounded-xl bg-amber-50/50 dark:bg-amber-900/50 shadow-sm">
        <div className="text-amber-500/80 dark:text-amber-700/80 max-w-sm w-1/4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="3.1249 4.0034 93.751 91.9929"
            fill="currentColor"
          >
            <path d="M92.996 22.832H63.871L54.5038 6.605c-.9531-1.6523-2.5938-2.6016-4.5039-2.6016s-3.5508.9492-4.5039 2.6016l-9.3672 16.227H7.0038c-2.1406 0-3.8789 1.7422-3.8789 3.8789v56.352c0 2.1367 1.7383 3.8789 3.8789 3.8789h32.922v5.5781c-3.5508.3164-7.0117.8008-10.363 1.457-.5508.1094-.914.6445-.8047 1.1953.1094.5508.6445.914 1.1953.8047 6.3242-1.2344 13.07-1.8633 20.047-1.8633s13.723.625 20.047 1.8594a1.141 1.141 0 0 0 .1953.0195c.4766 0 .9024-.336 1-.8242.1094-.5508-.2539-1.0859-.8047-1.1953-3.3477-.6523-6.8125-1.1367-10.363-1.457v-5.5781h32.922c2.1367 0 3.879-1.7383 3.879-3.8789V26.711c0-2.1367-1.7384-3.8789-3.879-3.8789zM47.262 7.625c.5898-1.0195 1.5625-1.582 2.7383-1.582s2.1484.5625 2.7383 1.582l14.133 24.48c.5898 1.0195.5898 2.1445 0 3.1641s-1.5625 1.582-2.7383 1.582h-28.266c-1.1758 0-2.1484-.5625-2.7383-1.582s-.5898-2.1445 0-3.1641zM31.364 36.289c.9531 1.6523 2.5977 2.6016 4.5039 2.6016h28.27c1.9102 0 3.5508-.9492 4.5039-2.6016.9531-1.6523.9531-3.5469 0-5.1992l-1.3398-2.3242h23.445v52.25l-81.488-.004v-52.25h23.445l-1.3398 2.3243c-.9531 1.6523-.9531 3.5469 0 5.203zm26.672 56.066c-2.6367-.1836-5.3203-.2773-8.0352-.2773s-5.3984.0937-8.0352.2773v-5.4141h16.074zm36.801-9.2891c0 1.0156-.8242 1.8398-1.8398 1.8398l-85.992-.004c-1.0156 0-1.8398-.8241-1.8398-1.8397V26.71c0-1.0156.8242-1.8398 1.8398-1.8398h27.949l-1.0703 1.8516H8.2389c-.5625 0-1.0195.457-1.0195 1.0195v54.289c0 .5625.457 1.0195 1.0195 1.0195h83.523c.5625 0 1.0195-.457 1.0195-1.0195v-54.289c0-.5625-.457-1.0195-1.0195-1.0195h-25.645l-1.0703-1.8516h27.949c1.0156 0 1.8398.8242 1.8398 1.8398zm-46.969-56.234h4.2656c.5625 0 1.0195-.457 1.0195-1.0195v-12.562c0-.5625-.457-1.0195-1.0195-1.0195H47.868c-.5625 0-1.0195.457-1.0195 1.0195v12.562c0 .5625.457 1.0195 1.0195 1.0195zm1.0195-12.562h2.2266v10.523h-2.2266zm1.1133 21.203c2.0938 0 3.7969-1.7031 3.7969-3.7969s-1.7031-3.7969-3.7969-3.7969-3.7969 1.7031-3.7969 3.7969 1.7031 3.7969 3.7969 3.7969zm0-5.5586c.9687 0 1.7578.789 1.7578 1.7578s-.789 1.7578-1.7578 1.7578-1.7578-.789-1.7578-1.7578c0-.9648.789-1.7578 1.7578-1.7578zm-17.594 25.562 2.9531-2.9531-2.9531-2.9531a1.0185 1.0185 0 0 1 0-1.4414 1.0185 1.0185 0 0 1 1.4414 0l2.9531 2.9531 2.9531-2.9531a1.0185 1.0185 0 0 1 1.4414 0 1.0185 1.0185 0 0 1 0 1.4414l-2.9531 2.9531 2.9531 2.9531a1.0185 1.0185 0 0 1 0 1.4414 1.0209 1.0209 0 0 1-.7227.3008 1.0209 1.0209 0 0 1-.7226-.3008l-2.9531-2.9531-2.9531 2.9531a1.0209 1.0209 0 0 1-.7227.3008 1.0209 1.0209 0 0 1-.7226-.3008c-.3907-.3984-.3907-1.0469.0078-1.4414zm26.398 0 2.9531-2.9531-2.9531-2.9531a1.0185 1.0185 0 0 1 0-1.4414 1.0185 1.0185 0 0 1 1.4414 0l2.9531 2.9531 2.9531-2.9531a1.0185 1.0185 0 0 1 1.4414 0 1.0185 1.0185 0 0 1 0 1.4414l-2.9531 2.9531 2.9531 2.9531a1.0185 1.0185 0 0 1 0 1.4414 1.0209 1.0209 0 0 1-.7227.3008 1.0209 1.0209 0 0 1-.7226-.3008l-2.9531-2.9531-2.9531 2.9531c-.1992.1992-.461.3008-.7227.3008s-.5234-.1016-.7226-.3008c-.3907-.3984-.3907-1.0469.0078-1.4414zm-17.996 14.957c2.2109-2.8867 5.5586-4.543 9.1914-4.543s6.9805 1.6562 9.1914 4.543c.3398.4453.2578 1.0859-.1914 1.4297-.4453.3398-1.086.2578-1.4297-.1914-1.8164-2.379-4.5781-3.7461-7.5703-3.7461s-5.754 1.3672-7.5703 3.746c-.1992.2618-.504.3985-.8086.3985a1.017 1.017 0 0 1-.6172-.211 1.009 1.009 0 0 1-.1953-1.4257z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-amber-800 dark:text-amber-600">
          {t('PasteBar Application Error', { ns: 'common' })}
        </h1>
        <p className="text-amber-800 dark:text-amber-200 text-center">
          {t(
            'We apologize but you found a bug. Please report this issue to us and try again',
            { ns: 'common' }
          )}
        </p>
        {/* <pre style={{ color: 'red' }}>{error.message}</pre> */}
        {!showThankYou ? (
          <button
            onClick={reportErrorandRestart}
            className="text-white bg-gradient-to-br from-pink-500 to-orange-400 dark:from-ping-800 dark:to-orange-700 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
          >
            {t('Report and Try Again', { ns: 'common' })}
          </button>
        ) : (
          <h2 className="text-green-500 font-semibold text-xl px-5 py-2.5 text-center me-2 mb-2 animate-in zoom-in-50 fade-in duration-1000">
            {t('Thank you for reporting the error.', { ns: 'common' })}
          </h2>
        )}
      </div>
      <button
        type="button"
        onClick={() => relaunch()}
        className="mt-10 text-amber-500 hover:text-white border border-amber-500 hover:bg-amber-500 font-medium rounded-lg text-sm px-5 py-2 text-center me-2 mb-2 dark:border-amber-800 dark:text-amber-800 dark:hover:text-white dark:hover:bg-amber-800"
      >
        {t('Restart', { ns: 'common' })}
      </button>

      <div className="bottom-0 left-0 w-full justify-center fixed flex">
        <p className="py-3 text-gray-500 flex flex-row gap-1 flex-nowrap whitespace-nowrap text-xs md:text-sm">
          {t('if this error persists, try to restart the application or', {
            ns: 'common',
          })}
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              openContactInBrowser()
            }}
            className="underline text-blue-500 dark:text-blue-400"
          >
            {t('contact us.', { ns: 'common' })}
          </a>
          {t('Thank you!', { ns: 'common' })}
        </p>
      </div>
    </div>
  )
}
