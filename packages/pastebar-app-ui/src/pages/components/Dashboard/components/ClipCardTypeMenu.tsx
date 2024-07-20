import { ReactNode } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import SimpleBar from '~/components/libs/simplebar-react'
import { Box, Text } from '~/components/ui'

import { useUpdateItemById } from '~/hooks/queries/use-items'

const RESET_ALL = {
  isCode: false,
  isText: false,
  isForm: false,
  isImage: false,
  isCommand: false,
  isWebRequest: false,
  isWebScraping: false,
  isTemplate: false,
  isLink: false,
  isPath: false,
  detectedLanguage: '',
}

type ClipCardTypeMenuProps = {
  itemId: UniqueIdentifier
  isCode: boolean | undefined
  isText: boolean | undefined
  isForm: boolean | undefined
  isImage: boolean | undefined
  isCommand: boolean | undefined
  isWebRequest: boolean | undefined
  isWebScraping: boolean | undefined
  isTemplate: boolean | undefined
  isPath: boolean | undefined
  isLink: boolean | undefined
  children?: ReactNode
  detectedLanguage: string | undefined | null
}

export const ClipCardTypeMenu = ({
  itemId,
  isCode,
  isImage,
  isText,
  isForm,
  isLink,
  isCommand,
  isWebRequest,
  isTemplate,
  isWebScraping,
  isPath,
  detectedLanguage,
  children,
}: ClipCardTypeMenuProps) => {
  const { t } = useTranslation()
  const {
    CONST: { APP_DETECT_LANGUAGES_SUPPORTED: languageList },
  } = useAtomValue(settingsStoreAtom)

  const { updateItemById } = useUpdateItemById()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={12} align="center">
        <DropdownMenuItem
          className="text-center items-center justify-center py-0.5"
          disabled={true}
        >
          <Text>{t('TypeMenu:::Clip Type', { ns: 'common' })}</Text>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={Boolean(isText)}
          onClick={() => {
            updateItemById({
              updatedItem: {
                ...RESET_ALL,
                isText: true,
                itemId,
              },
            })
          }}
        >
          <Text className={`${isText ? 'font-semibold' : ''}`}>
            {t('TypeMenu:::Plain Text', { ns: 'common' })}
          </Text>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={Boolean(isLink)}
          onClick={() => {
            updateItemById({
              updatedItem: {
                ...RESET_ALL,
                isLink: true,
                itemId,
              },
            })
          }}
        >
          <Text className={`${isLink ? 'font-semibold' : ''}`}>
            {t('TypeMenu:::Link or Email', { ns: 'common' })}
          </Text>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={Boolean(isImage)}
          onClick={() => {
            updateItemById({
              updatedItem: {
                ...RESET_ALL,
                isImage: true,
                itemId,
              },
            })
          }}
        >
          <Text className={`${isImage ? 'font-semibold' : ''}`}>
            {t('TypeMenu:::Image', { ns: 'common' })}
          </Text>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={Boolean(isPath)}
          onClick={() => {
            updateItemById({
              updatedItem: {
                ...RESET_ALL,
                isPath: true,
                itemId,
              },
            })
          }}
        >
          <Text className={`${isPath ? 'font-semibold' : ''}`}>
            {t('TypeMenu:::File, Path or App', { ns: 'common' })}
          </Text>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {isCode ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Box className="mr-2 h-4 w-4" />
            )}
            <Text className={`${isCode ? '!font-semibold' : ''}`}>
              {t('TypeMenu:::Code Snippet', { ns: 'common' })} ...
            </Text>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <DropdownMenuItem
              className="text-center items-center justify-center py-0.5"
              disabled={true}
            >
              {detectedLanguage ? (
                <Text>{capitalizeFirstLetter(detectedLanguage)}</Text>
              ) : (
                <Text>{t('TypeMenu:::Select Language', { ns: 'common' })}</Text>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <SimpleBar
              className="code-filter"
              style={{ height: 'auto', maxHeight: '290px' }}
              autoHide={false}
            >
              {languageList.map(lang => (
                <DropdownMenuCheckboxItem
                  checked={detectedLanguage === lang}
                  key={lang}
                  className={`${detectedLanguage === lang ? 'font-semibold ' : ''}`}
                  onClick={() => {
                    updateItemById({
                      updatedItem: {
                        ...RESET_ALL,
                        isCode: true,
                        detectedLanguage: lang,
                        itemId,
                      },
                    })
                  }}
                >
                  {capitalizeFirstLetter(lang)}
                </DropdownMenuCheckboxItem>
              ))}
            </SimpleBar>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuCheckboxItem
          checked={Boolean(isTemplate)}
          onClick={() => {
            updateItemById({
              updatedItem: {
                ...RESET_ALL,
                isTemplate: true,
                itemId,
              },
            })
          }}
        >
          <Text className={`${isTemplate ? 'font-semibold' : ''}`}>
            {t('TypeMenu:::Template Fill', { ns: 'common' })}
          </Text>
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={Boolean(isForm)}
          onClick={() => {
            updateItemById({
              updatedItem: {
                ...RESET_ALL,
                isForm: true,
                itemId,
              },
            })
          }}
        >
          <Text className={`${isForm ? 'font-semibold' : ''}`}>
            {t('TypeMenu:::Form Auto Fill', { ns: 'common' })}
          </Text>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {isCommand || isWebRequest || isWebScraping ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Box className="mr-2 h-4 w-4" />
            )}
            <Text
              className={`${
                isCommand || isWebRequest || isWebScraping ? '!font-semibold' : ''
              }`}
            >
              {t('TypeMenu:::Run, Execute', { ns: 'common' })}
            </Text>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuCheckboxItem
              checked={Boolean(isCommand)}
              onClick={() => {
                updateItemById({
                  updatedItem: {
                    ...RESET_ALL,
                    isCommand: true,
                    itemId,
                  },
                })
              }}
            >
              <Text className={`${isCommand ? 'font-semibold' : ''}`}>
                {t('TypeMenu:::Shell Command', { ns: 'common' })}
              </Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={Boolean(isWebRequest)}
              onClick={() => {
                updateItemById({
                  updatedItem: {
                    ...RESET_ALL,
                    isWebRequest: true,
                    itemId,
                  },
                })
              }}
            >
              <Text className={`${isWebRequest ? 'font-semibold' : ''}`}>
                {t('TypeMenu:::Web Request (HTTP)', { ns: 'common' })}
              </Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={Boolean(isWebScraping)}
              onClick={() => {
                updateItemById({
                  updatedItem: {
                    ...RESET_ALL,
                    isWebScraping: true,
                    itemId,
                  },
                })
              }}
            >
              <Text className={`${isWebScraping ? 'font-semibold' : ''}`}>
                {t('TypeMenu:::Web Scraper / Parser', { ns: 'common' })}
              </Text>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
