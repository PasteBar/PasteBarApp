import { invoke } from '@tauri-apps/api'

export const apiBaseUrl = 'http://locahost:5555'
export const loadPathWithNamespaces = `${apiBaseUrl}/lang/{{lng}}/{{ns}}`

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

const createTranslationKeys = async (requestBody: {
  translationKeys: TranslationKeys[]
}) => {
  try {
    const response = await fetch(`${apiBaseUrl}/create-translation-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to create translation keys:', error)
    throw error
  }
}

export const updateTranslations = async (requestBody: {
  translations: Translations[]
}) => {
  try {
    const response = await fetch(`${apiBaseUrl}/update-translations-keys`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to update translations:', error)
    throw error
  }
}

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
