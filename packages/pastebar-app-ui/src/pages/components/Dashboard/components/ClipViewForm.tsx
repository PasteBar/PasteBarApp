import { useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { open } from '@tauri-apps/api/shell'
import { isKeyAltPressed } from '~/store'
import { CheckSquare2, Clipboard, ClipboardPaste, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import ToolTip from '~/components/atoms/tooltip'
import InputField from '~/components/molecules/input'
import InputCreditCardField from '~/components/molecules/input-credit-card'
import TextArea from '~/components/molecules/textarea'
import { Badge, Box, Button, Flex, Text } from '~/components/ui'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useClipboardPaste, useCopyPaste } from '~/hooks/use-copypaste'
import { useSignal } from '~/hooks/use-signal'

import { ClipFormTemplateOptions } from './ClipCard'
import { CopyPasteBadge } from './CopyPasteBadge'

export const ClipFormAfterInputKeyPress = ['Tab', 'Enter', 'TabTab', 'TabEnter'] as const

export const ClipFormKeyPressDisplayValueMap = {
  Tab: 'Tab',
  Enter: 'Enter',
  TabTab: '2 Tabs',
  TabTabTab: '3 Tabs',
  TabEnter: 'Tab, Enter',
  TabTabEnter: '2Tabs, Enter',
}
export const ClipFormDelayTime = ['1s', '2s', '3s', '4s', '5s'] as const

export const ClipFormTypes = [
  'Email',
  'Login',
  'Username',
  'Password',
  'Title',
  'Textarea',
  'Phone',
  'Website',
  'Date',
  'Name',
  'First Name',
  'Last Name',
  'Company',
  'Address',
  'City',
  'State',
  'Zip',
  'Country',
  'Province',
  'Text',
  'Number',
  'Credit Card',
  'CVV Code',
  'Exp. Date',
  'Secret',
  'License Key',
  'Occupation',
  'Gender',
  'Age',
  'Description',
  'Birthdate',
  'API Key',
  'SSN',
  'Custom',
] as const

export function ClipViewForm({
  clipId,
  formTemplateOptions,
}: {
  clipId: UniqueIdentifier | undefined
  formTemplateOptions: string | null | undefined
}) {
  const { t } = useTranslation()
  const [isCopied, copyToClipboard] = useCopyPaste({})
  const [pastedText, pastedItemCountDown, pasteToClipboard] = useClipboardPaste({})
  const { updateItemById } = useUpdateItemById()
  const isUpdated = useSignal<boolean>(false)
  const copyOrPasteFieldId = useSignal<string | null>(null)

  const localOptions = useSignal<ClipFormTemplateOptions>({
    templateOptions: [],
    formOptions: {
      openUrl: null,
      fields: [],
    },
  })

  useEffect(() => {
    if (formTemplateOptions) {
      try {
        localOptions.value = JSON.parse(formTemplateOptions)
      } catch (e) {
        console.error(e)
      }
    }
  }, [formTemplateOptions])

  useEffect(() => {
    if (isUpdated.value) {
      setTimeout(() => {
        isUpdated.value = false
      }, 1000)
    }
  }, [isUpdated.value])

  const isCopiedOrPasted = Boolean(isCopied || pastedText)

  return (
    <>
      <Box className="select-none mb-2">
        {localOptions.value.formOptions.openUrl != null && (
          <Flex
            className={`text-normal w-full gap-2 py-0.5 mb-1 ${
              localOptions.value.formOptions.isOpenUrlDisabled
                ? 'bg-gray-100 dark:bg-gray-900 opacity-70'
                : ''
            }`}
          >
            {localOptions.value.formOptions.isOpenUrlDisabled ? (
              <>
                <Text className="!font-semibold pointer-events-none text-slate-500 dark:text-slate-200 border dark:bg-slate-700/80 group hover:text-blue-500 flex items-center bg-gray-200 !text-xs px-2 py-1 rounded-md line-through gap-1">
                  {t('Open', { ns: 'common' })}
                  <span className="overflow-hidden text-ellipsis p-1">
                    {ensureUrlPrefix(localOptions.value.formOptions.openUrl)}
                  </span>
                </Text>
              </>
            ) : (
              <>
                <Text className="!font-semibold text-slate-500 dark:text-slate-200 border dark:bg-slate-700/80 group hover:text-blue-700 dark:hover:text-blue-400 flex items-center bg-gray-200 !text-xs px-2 py-1 rounded-md gap-1">
                  <span className="pointer-events-none">
                    {t('Open', { ns: 'common' })}
                  </span>
                  <span
                    className="underline cursor-pointer text-blue-700 dark:text-blue-400 overflow-hidden text-ellipsis relative p-1"
                    title={`${t('Open', { ns: 'common' })} ${
                      localOptions.value.formOptions.openUrl
                    }`}
                    onClick={() => {
                      open(ensureUrlPrefix(localOptions.value.formOptions.openUrl))
                    }}
                  >
                    {ensureUrlPrefix(localOptions.value.formOptions.openUrl)}
                    <CopyPasteBadge
                      id={localOptions.value.formOptions.openUrl}
                      isCopiedOrPasted={isCopiedOrPasted}
                      pastedItemCountDown={pastedItemCountDown}
                      isCopied={isCopied}
                      pastedText={pastedText}
                      copyOrPasteFieldId={copyOrPasteFieldId}
                    />
                  </span>
                </Text>
              </>
            )}
            <Flex>
              <Button
                className="text-slate-500 h-full hover:text-green-700 dark:hover:text-green-600 px-1 py-0.5 hover:bg-transparent"
                variant="ghost"
                disabled={localOptions.value.formOptions.isOpenUrlDisabled}
                onClick={e => {
                  e.preventDefault()
                  if (localOptions.value.formOptions.openUrl) {
                    copyOrPasteFieldId.value = localOptions.value.formOptions.openUrl
                    if (!isKeyAltPressed.value) {
                      copyToClipboard(localOptions.value.formOptions.openUrl)
                    } else {
                      pasteToClipboard(localOptions.value.formOptions.openUrl)
                    }
                  }
                }}
              >
                <ToolTip
                  text={
                    isKeyAltPressed.value
                      ? t('Copy and Paste', { ns: 'common' })
                      : t('Copy to Clipboard', { ns: 'common' })
                  }
                  delayDuration={2000}
                  isCompact
                  side="bottom"
                  sideOffset={10}
                >
                  {isKeyAltPressed.value ? (
                    <ClipboardPaste size={14} />
                  ) : (
                    <Clipboard size={14} />
                  )}
                </ToolTip>
              </Button>
              <Button
                variant="ghost"
                size="mini"
                title={t('Enable / Disable URL Open', { ns: 'dashboard' })}
                onClick={async () => {
                  localOptions.value = {
                    ...localOptions.value,
                    formOptions: {
                      ...localOptions.value.formOptions,
                      isOpenUrlDisabled:
                        !localOptions.value.formOptions?.isOpenUrlDisabled,
                    },
                  }

                  const formTemplateOptions = JSON.stringify(localOptions.value)
                  try {
                    await updateItemById({
                      updatedItem: {
                        formTemplateOptions,
                        itemId: clipId,
                      },
                    })
                    setTimeout(() => {
                      isUpdated.value = true
                    }, 300)
                  } catch (e) {
                    console.error(e)
                  }
                }}
                className="pl-1 font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
              >
                {!localOptions.value.formOptions?.isOpenUrlDisabled ? (
                  <CheckSquare2 size={14} />
                ) : (
                  <Square size={14} />
                )}
              </Button>
            </Flex>
          </Flex>
        )}

        {localOptions.value.formOptions?.fields.map((field, i) => {
          const isLabelOnTop = field.isLabelOnTop
          const isLabelHidden = field.isLabelHidden
          const isSection = field.type === 'section'
          const isTextArea = field.type === 'textarea'
          return (
            <Flex
              className={`${field.type !== 'section' ? 'mb-1' : 'mt-1'} group ${
                isLabelOnTop ? 'flex-col items-start' : 'items-center'
              } ${isTextArea ? '!mt-2 !mb-1' : ''}`}
              key={field.id}
            >
              {!isLabelHidden && (
                <>
                  {field.label && field.type !== 'section' ? (
                    <Text
                      className={`${
                        field.isEnable === false
                          ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                          : ''
                      } text-[13px] !font-semibold flex self-stretch ${
                        !isLabelOnTop ? '!justify-end' : '!justify-start pl-1'
                      }`}
                    >
                      <span
                        className={`whitespace-nowrap pr-1 min-w-[80px] overflow-hidden text-ellipsis block ${
                          isLabelOnTop ? 'text-left' : 'text-right max-w-[160px]'
                        }`}
                      >
                        {field.label}
                      </span>
                    </Text>
                  ) : (
                    <div className="pr-1 min-w-[80px]" />
                  )}
                </>
              )}
              <Flex className="w-full">
                <Flex
                  className={`gap-0.5 flex-col w-full items-start ${
                    field.isEnable === false
                      ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                      : ''
                  }`}
                >
                  <Flex className="w-full gap-1 justify-start">
                    {field.isDelayOnly || field.isPressKeysOnly ? (
                      <Flex
                        className={`${
                          field.isEnable === false
                            ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                            : ''
                        } w-full justify-end mr-1 py-1`}
                      >
                        {field.isDelayOnly && (
                          <Badge
                            variant="secondary"
                            className="pl-2 py-0.5 text-slate-500 whitespace-nowrap"
                          >
                            {t('Delay', { ns: 'common' })} {field.value}
                          </Badge>
                        )}
                        {field.isPressKeysOnly && field.pressKeysAfterPaste && (
                          <Badge
                            variant="secondary"
                            className="pl-2 py-0.5 text-slate-500 whitespace-nowrap"
                          >
                            {t('Press', { ns: 'common' })}{' '}
                            {ClipFormKeyPressDisplayValueMap[field.pressKeysAfterPaste]}
                          </Badge>
                        )}
                      </Flex>
                    ) : field.type === 'password' || field.type === 'passwordCode' ? (
                      <Flex>
                        <div className="relative w-full">
                          <InputField
                            small
                            placeholder={t('Empty', { ns: 'common' })}
                            classNameInput="text-sm border-0 border-b border-gray-200 hover:border-gray-400 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis"
                            disabled={field.isEnable === false}
                            isPassword={true}
                            numbersOnly={field.type === 'passwordCode' ? true : false}
                            showHidePassword={true}
                            className={`${
                              field.isEnable === false
                                ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                                : ''
                            } w-full`}
                            readOnly
                            value={field.value}
                          />
                          <CopyPasteBadge
                            id={field.id}
                            isCopiedOrPasted={isCopiedOrPasted}
                            pastedItemCountDown={pastedItemCountDown}
                            isCopied={isCopied}
                            pastedText={pastedText}
                            copyOrPasteFieldId={copyOrPasteFieldId}
                          />
                        </div>
                        {!isSection && !field.isDelayOnly && !field.isPressKeysOnly && (
                          <Button
                            className="text-slate-500 h-full hover:text-green-700 dark:hover:text-green-600 px-1 py-0.5 hover:bg-transparent"
                            disabled={field.isEnable === false || !field.value}
                            variant="ghost"
                            onClick={e => {
                              e.preventDefault()
                              if (field.value) {
                                copyOrPasteFieldId.value = field.id || null
                                if (!isKeyAltPressed.value) {
                                  copyToClipboard(field.value)
                                } else {
                                  pasteToClipboard(field.value)
                                }
                              }
                            }}
                          >
                            <ToolTip
                              text={
                                isKeyAltPressed.value
                                  ? t('Copy and Paste', { ns: 'common' })
                                  : t('Copy to Clipboard', { ns: 'common' })
                              }
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isKeyAltPressed.value ? (
                                <ClipboardPaste size={14} />
                              ) : (
                                <Clipboard size={14} />
                              )}
                            </ToolTip>
                          </Button>
                        )}
                      </Flex>
                    ) : field.type === 'creditcard' ? (
                      <Flex>
                        <div className="relative w-full">
                          <InputCreditCardField
                            small
                            placeholder={t('Empty', { ns: 'common' })}
                            classNameInput="text-sm border-0 border-b border-gray-200 rounded-none hover:border-gray-400 pl-1.5 nowrap overflow-hidden text-ellipsis"
                            disabled={field.isEnable === false}
                            className={`${
                              field.isEnable === false
                                ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                                : ''
                            } w-full`}
                            readOnly
                            ccNumber={field.value}
                          />
                          <CopyPasteBadge
                            id={field.id}
                            isCopiedOrPasted={isCopiedOrPasted}
                            pastedItemCountDown={pastedItemCountDown}
                            isCopied={isCopied}
                            pastedText={pastedText}
                            copyOrPasteFieldId={copyOrPasteFieldId}
                          />
                        </div>
                        {!isSection && !field.isDelayOnly && !field.isPressKeysOnly && (
                          <Button
                            className="text-slate-500 h-full hover:text-green-700 dark:hover:text-green-600 px-1 py-0.5 hover:bg-transparent"
                            disabled={field.isEnable === false || !field.value}
                            variant="ghost"
                            onClick={e => {
                              e.preventDefault()
                              if (field.value) {
                                copyOrPasteFieldId.value = field.id || null
                                if (!isKeyAltPressed.value) {
                                  copyToClipboard(field.value)
                                } else {
                                  pasteToClipboard(field.value)
                                }
                              }
                            }}
                          >
                            <ToolTip
                              text={
                                isKeyAltPressed.value
                                  ? t('Copy and Paste', { ns: 'common' })
                                  : t('Copy to Clipboard', { ns: 'common' })
                              }
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isKeyAltPressed.value ? (
                                <ClipboardPaste size={14} />
                              ) : (
                                <Clipboard size={14} />
                              )}
                            </ToolTip>
                          </Button>
                        )}
                      </Flex>
                    ) : isSection ? (
                      <span className="text-sm !font-semibold border-0 nowrap overflow-hidden text-ellipsis !pl-0.5 py-2">
                        {field.value}
                      </span>
                    ) : field.type === 'textarea' ? (
                      <Flex>
                        <div className="w-full relative">
                          <TextArea
                            placeholder={t('Empty', { ns: 'common' })}
                            label=""
                            className="text-sm font-semibold border-0 border-transparent hover:border-gray-400 rounded-none nowrap overflow-hidden text-ellipsis !pl-0.5 w-full"
                            classNameArea={
                              field.isEnable === false
                                ? 'dark:!text-slate-500 !bg-gray-100 opacity-50 dark:!bg-gray-900'
                                : 'dark:!text-slate-300 dark:!bg-slate-900'
                            }
                            autoFocus={
                              i === localOptions.value.formOptions.fields?.length - 1 &&
                              localOptions.value.formOptions.fields[i].value === ''
                            }
                            maxRows={2}
                            value={field.value}
                            enableEmoji={false}
                            readOnly
                            enableEmojiInside={false}
                          />
                          <CopyPasteBadge
                            id={field.id}
                            isCopiedOrPasted={isCopiedOrPasted}
                            pastedItemCountDown={pastedItemCountDown}
                            isCopied={isCopied}
                            pastedText={pastedText}
                            copyOrPasteFieldId={copyOrPasteFieldId}
                          />
                        </div>
                        {!isSection && !field.isDelayOnly && !field.isPressKeysOnly && (
                          <Button
                            className="text-slate-500 h-full hover:text-green-700 dark:hover:text-green-600 px-1 py-0.5 hover:bg-transparent"
                            disabled={field.isEnable === false || !field.value}
                            variant="ghost"
                            onClick={e => {
                              e.preventDefault()
                              if (field.value) {
                                copyOrPasteFieldId.value = field.id || null
                                if (!isKeyAltPressed.value) {
                                  copyToClipboard(field.value)
                                } else {
                                  pasteToClipboard(field.value)
                                }
                              }
                            }}
                          >
                            <ToolTip
                              text={
                                isKeyAltPressed.value
                                  ? t('Copy and Paste', { ns: 'common' })
                                  : t('Copy to Clipboard', { ns: 'common' })
                              }
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isKeyAltPressed.value ? (
                                <ClipboardPaste size={14} />
                              ) : (
                                <Clipboard size={14} />
                              )}
                            </ToolTip>
                          </Button>
                        )}
                      </Flex>
                    ) : (
                      <Flex>
                        <div className="w-full relative">
                          <InputField
                            small
                            placeholder={t('Empty', { ns: 'common' })}
                            autoFocus={
                              i === localOptions.value.formOptions.fields?.length - 1 &&
                              localOptions.value.formOptions.fields[i].value === '' &&
                              localOptions.value.formOptions.fields[i].label !== 'Custom'
                            }
                            classNameInput="text-sm border-0 border-b border-gray-200 hover:border-gray-400 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                            disabled={field.isEnable === false}
                            type={field.type === 'number' ? 'number' : 'text'}
                            className={`${
                              field.isEnable === false
                                ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                                : ''
                            } w-full`}
                            readOnly
                            value={field.value}
                          />

                          <CopyPasteBadge
                            id={field.id}
                            isCopiedOrPasted={isCopiedOrPasted}
                            pastedItemCountDown={pastedItemCountDown}
                            isCopied={isCopied}
                            pastedText={pastedText}
                            copyOrPasteFieldId={copyOrPasteFieldId}
                          />
                        </div>
                        {!isSection && !field.isDelayOnly && !field.isPressKeysOnly && (
                          <Button
                            className="text-slate-500 h-full hover:text-green-700 dark:hover:text-green-600 px-1 py-0.5 hover:bg-transparent"
                            disabled={field.isEnable === false || !field.value}
                            variant="ghost"
                            onClick={e => {
                              e.preventDefault()
                              if (field.value) {
                                copyOrPasteFieldId.value = field.id || null
                                if (!isKeyAltPressed.value) {
                                  copyToClipboard(field.value)
                                } else {
                                  pasteToClipboard(field.value)
                                }
                              }
                            }}
                          >
                            <ToolTip
                              text={
                                isKeyAltPressed.value
                                  ? t('Copy and Paste', { ns: 'common' })
                                  : t('Copy to Clipboard', { ns: 'common' })
                              }
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isKeyAltPressed.value ? (
                                <ClipboardPaste size={14} />
                              ) : (
                                <Clipboard size={14} />
                              )}
                            </ToolTip>
                          </Button>
                        )}
                      </Flex>
                    )}
                    {field.isDelayOnly || field.isPressKeysOnly || isSection ? (
                      <></>
                    ) : (
                      <Flex>
                        {field.pressKeysAfterPaste && (
                          <Badge
                            variant="secondary"
                            className="p-2 py-0.5 text-slate-500 whitespace-nowrap mr-1"
                          >
                            {ClipFormKeyPressDisplayValueMap[field.pressKeysAfterPaste]}
                          </Badge>
                        )}
                      </Flex>
                    )}
                  </Flex>
                </Flex>
                <Flex className="gap-1">
                  {!isSection && (
                    <Button
                      size="mini"
                      title={t('Enable / Disable', { ns: 'common' })}
                      variant="ghost"
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                      onClick={async () => {
                        localOptions.value = {
                          ...localOptions.value,
                          formOptions: {
                            ...localOptions.value.formOptions,
                            fields: localOptions.value.formOptions?.fields.map(
                              (f, index) => {
                                if (index === i) {
                                  return {
                                    ...f,
                                    isEnable: !f.isEnable,
                                  }
                                }
                                return f
                              }
                            ),
                          },
                        }

                        const formTemplateOptions = JSON.stringify(localOptions.value)
                        try {
                          await updateItemById({
                            updatedItem: {
                              formTemplateOptions,
                              itemId: clipId,
                            },
                          })
                          setTimeout(() => {
                            isUpdated.value = true
                          }, 300)
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      {localOptions.value.formOptions?.fields &&
                      localOptions.value.formOptions?.fields[i]?.isEnable ? (
                        <CheckSquare2 size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Flex>
          )
        })}
      </Box>
      {isUpdated.value && (
        <Box
          className={`bg-blue-200 dark:bg-blue-800 text-xs rounded-sm px-1.5 absolute left-1 bottom-1`}
        >
          {t('Updated', { ns: 'common' })}
        </Box>
      )}
    </>
  )
}
