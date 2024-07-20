import { invoke } from '@tauri-apps/api'

export type MissingKeys = {
  translationKey: string
  namespace: string
  language: string
  fallbackValue: string
}[]

export type TranslationKeys = {
  key: string
  namespace: string
}

export type Translations = {
  key: string
  namespace: string
  language: string
  text: string
}

export const missingKeys: MissingKeys = []

export const saveMissingKeysDevOnly = async () => {
  console.info(`Saving ${missingKeys.length} missing translation keys`)

  const translations = missingKeys.map(element => ({
    key: element.translationKey,
    namespace: element.namespace,
    language: element.language,
    text: element.fallbackValue,
  }))

  try {
    await invoke('update_translation_keys', { translations })
    missingKeys.length = 0 // Clear the array after successful operations
    missingKeys.length = 0
  } catch (error) {
    console.error(`Error during Tauri command invocation: ${error}`)
  }
}
