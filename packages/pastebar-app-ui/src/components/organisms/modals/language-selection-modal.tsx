import { useCallback, useEffect, useState } from 'react'
import { LANGUAGES } from '~/locales/languges'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Modal from '~/components/molecules/modal'
import { Button, Flex, Text } from '~/components/ui'

type Props = {
  open: boolean
  onLanguageSelected: (languageCode: string) => void
  onClose?: () => void
}

const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en'

  const langMappings: Record<string, string> = {
    en: 'en',
    'en-US': 'en',
    'en-GB': 'en',
    es: 'esES',
    'es-ES': 'esES',
    'es-MX': 'esES',
    de: 'de',
    'de-DE': 'de',
    fr: 'fr',
    'fr-FR': 'fr',
    it: 'it',
    'it-IT': 'it',
    tr: 'tr',
    'tr-TR': 'tr',
    ru: 'ru',
    'ru-RU': 'ru',
    uk: 'uk',
    'uk-UA': 'uk',
    zh: 'zhCN',
    'zh-CN': 'zhCN',
    'zh-Hans': 'zhCN',
  }

  const mappedLang = langMappings[browserLang] || langMappings[browserLang.split('-')[0]]

  const supportedCodes = LANGUAGES.map(lang => lang.code)
  return supportedCodes.includes(mappedLang) ? mappedLang : 'en'
}

export default function LanguageSelectionModal({
  open,
  onLanguageSelected,
  onClose = () => {},
}: Props) {
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en')

  useEffect(() => {
    if (open) {
      const detected = detectBrowserLanguage()
      setDetectedLanguage(detected)
      setSelectedLanguage(detected)

      if (detected !== i18n.language) {
        i18n.changeLanguage(detected)
      }
    }
  }, [open, i18n])

  const handleLanguageChange = useCallback(
    (languageCode: string) => {
      setSelectedLanguage(languageCode)
      i18n.changeLanguage(languageCode)
    },
    [i18n]
  )

  const handleStartApp = useCallback(() => {
    onLanguageSelected(selectedLanguage)
  }, [selectedLanguage, onLanguageSelected])

  // Sort languages to put detected language first, then the rest
  const sortedLanguages = [...LANGUAGES].sort((a, b) => {
    if (a.code === detectedLanguage) return -1
    if (b.code === detectedLanguage) return 1
    return 0
  })

  return (
    <Modal open={open} handleClose={() => {}} canClose={false} positionTop={true}>
      <Modal.Body className="min-w-[400px] max-w-[500px] relative">
        <Button
          variant="link"
          type="button"
          onClick={onClose}
          className="hover:bg-slate-200 px-2 absolute right-1.5 top-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:dark:text-slate-400 hover:bg-transparent dark:hover:bg-transparent z-10"
        >
          <X className="w-5 h-5" />
        </Button>
        <Modal.Content className="max-h-[400px]">
          <Flex className="w-full flex-col gap-3 mt-2 justify-center">
            <div className="text-center">
              <Text className="font-semibold text-2xl mb-2 justify-center">
                {t('Welcome to PasteBar', { ns: 'common2' })}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                {t('Please select your preferred language', { ns: 'common2' })}
              </Text>
            </div>

            <div className="space-y-3">
              <Flex className="gap-3 flex-wrap items-start justify-evenly">
                {sortedLanguages.map(({ code, name, flag }) => (
                  <Button
                    key={code}
                    variant="ghost"
                    onClick={() => handleLanguageChange(code)}
                    className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                      selectedLanguage === code
                        ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                        : ''
                    } dark:text-slate-200 px-3 !py-0.5`}
                  >
                    <span className="flags mr-3">{flag}</span> {name}
                  </Button>
                ))}
              </Flex>
            </div>
          </Flex>
        </Modal.Content>
        <Modal.Footer className="flex justify-center !pt-4 !pb-5">
          <Button
            onClick={handleStartApp}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
          >
            {t('Start using PasteBar', { ns: 'common2' })}
          </Button>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}
