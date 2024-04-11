import { invoke } from '@tauri-apps/api'
import { settingsStore } from '~/store'
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import TimeAgo from 'javascript-time-ago'
import enTimeAgo from 'javascript-time-ago/locale/en'
import { initReactI18next } from 'react-i18next'
// @ts-expect-error - Vite plugin
// eslint-disable-next-line import/no-unresolved
import resources from 'virtual:i18next-loader'

import { DEFAULT_LOCALE, LANGUAGES } from './languges'
import { missingKeys, saveMissingKeysDevOnly } from './translation-utils'

dayjs.extend(localeData)

TimeAgo.addDefaultLocale(enTimeAgo)

export const timeAgoCache = new Map()

const timeAgoInstancesCache = {
  en: new TimeAgo(DEFAULT_LOCALE),
}

export let missingKeyInterval: NodeJS.Timeout | undefined

const isDev = import.meta.env.DEV
const fallbackLng = !isDev
  ? DEFAULT_LOCALE
  : import.meta.env.VITE_DISABLE_LANGUAGE_FALLBACK
    ? false
    : DEFAULT_LOCALE

if (isDev) {
  console.log('Fallback Lang', fallbackLng)
  console.log('Translations', resources)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(
    {
      debug: false,
      resources,
      fallbackLng,
      detection: {
        order: ['localStorage', 'cookie', 'navigator'],
        caches: ['localStorage'],
      },
      supportedLngs: LANGUAGES.map(lang => lang.code),
      interpolation: {
        escapeValue: false,
      },
      saveMissing: isDev,
      defaultNS: 'common',
      keySeparator: ':::', // Use ::: instead of . for key separation
      nsSeparator: false, // Disable namespace separator if you're not using namespaces
      saveMissingTo: 'current', // Save missing keys to all files
      updateMissing: isDev,
      missingKeyHandler: async (languages, namespace, translationKey, fallbackValue) => {
        console.warn(
          'missingKeyHandler',
          languages,
          namespace,
          translationKey,
          fallbackValue
        )

        if (!isDev) {
          return
        }
        if (import.meta.env.VITE_DISABLE_SAVE_TRANSLATIONS) {
          return
        }

        const resources = i18n.services.resourceStore.data[languages[0] ?? DEFAULT_LOCALE]
        const keys = Object.keys(resources[namespace ?? 'common'])
        const key = keys.find(key => key === translationKey)
        if (key) {
          console.log('Key already found in translations', key)
          return
        }

        if (
          missingKeys.some(
            key => key.translationKey === translationKey && key.namespace === namespace
          )
        ) {
          return
        }
        console.debug(
          `Translations [${namespace}]:[${translationKey}] not available in ${languages.join(
            ', '
          )}. Fallback value: ${fallbackValue}.`
        )

        missingKeys.push({
          translationKey: translationKey,
          namespace: namespace ?? '',
          language: languages[0] ?? DEFAULT_LOCALE,
          fallbackValue: fallbackValue ?? '',
        })

        if (!missingKeyInterval && missingKeys.length > 0) {
          missingKeyInterval = setInterval(async () => {
            if (missingKeys.length > 0) {
              await saveMissingKeysDevOnly()
            }
          }, 5_000)
        }
      },
      react: {
        transSupportBasicHtmlNodes: true, // allow <br/> and simple html elements in translations
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'b', 'i'], // don't convert to <1></1> if simple react elements
      },
    },
    async err => {
      if (err) {
        console.log(err)
      }
      window.__locale__ = i18n.language
    }
  )

i18n.on('languageChanged', async function (lng) {
  window.__locale__ = lng
  settingsStore.getState().setUserSelectedLanguage(lng)
  invoke('change_menu_language', { language: lng })
  invoke('build_system_menu')
})

export const timeAgoInstance = () => {
  const lang = i18n.language === 'en' ? 'en' : i18n.language

  if (timeAgoInstancesCache[lang as keyof typeof timeAgoInstancesCache]) {
    return timeAgoInstancesCache[lang as keyof typeof timeAgoInstancesCache]
  }
  timeAgoInstancesCache[i18n.language as keyof typeof timeAgoInstancesCache] =
    new TimeAgo(i18n.language)
  return timeAgoInstancesCache[i18n.language as keyof typeof timeAgoInstancesCache]
}

export const dateLocales: {
  [key: string]: () => Promise<ILocale>
} = {
  en: () => import('dayjs/locale/en'),
}

export default i18n
