import { invoke } from '@tauri-apps/api'
import { settingsStore } from '~/store'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import TimeAgo from 'javascript-time-ago'
import deTimeAgo from 'javascript-time-ago/locale/de'
import enTimeAgo from 'javascript-time-ago/locale/en'
import esTimeAgo from 'javascript-time-ago/locale/es'
import frTimeAgo from 'javascript-time-ago/locale/fr'
import ruTimeAgo from 'javascript-time-ago/locale/ru'
import ukTimeAgo from 'javascript-time-ago/locale/uk'
import zhTimeAgo from 'javascript-time-ago/locale/zh'
import { initReactI18next } from 'react-i18next'
// @ts-expect-error - Vite plugin
// eslint-disable-next-line import/no-unresolved
import resources from 'virtual:i18next-loader'

import { DEFAULT_LOCALE, LANGUAGES } from './languges'
import { missingKeys, saveMissingKeysDevOnly } from './translation-utils'

TimeAgo.addDefaultLocale(enTimeAgo)
TimeAgo.addLocale(deTimeAgo)
TimeAgo.addLocale(esTimeAgo)
TimeAgo.addLocale(frTimeAgo)
TimeAgo.addLocale(ruTimeAgo)
TimeAgo.addLocale(ukTimeAgo)
TimeAgo.addLocale(zhTimeAgo)

export const timeAgoCache = new Map()

// Define a mapping for non-dash language codes to the correct dash format
const langCodeMapping: { [key: string]: string } = {
  zhCN: 'zh-CN',
  esES: 'es-ES',
}

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
        if (!isDev) {
          return
        }

        if (import.meta.env.VITE_DISABLE_SAVE_TRANSLATIONS) {
          return
        }

        if (['tours'].includes(namespace)) {
          return
        }

        console.warn(
          'missingKeyHandler',
          languages,
          namespace,
          translationKey,
          fallbackValue
        )

        const resources = i18n.services.resourceStore.data[languages[0] ?? DEFAULT_LOCALE]
        const checkNs = namespace ?? 'common'
        const keys = resources[checkNs] ? Object.keys(resources[checkNs]) : []

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
  // eslint-disable-next-line sonarjs/no-empty-collection
  timeAgoCache.clear()
})

export const timeAgoInstance = () => {
  let lang =
    langCodeMapping[i18n.language === 'en' ? 'en' : i18n.language] ||
    (i18n.language === 'en' ? 'en' : i18n.language)

  if (!timeAgoInstancesCache[lang as keyof typeof timeAgoInstancesCache]) {
    timeAgoInstancesCache[lang as keyof typeof timeAgoInstancesCache] = new TimeAgo(lang)
  }
  return timeAgoInstancesCache[lang as keyof typeof timeAgoInstancesCache]
}

export default i18n
