/* eslint-disable sonarjs/cognitive-complexity */
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { invoke } from '@tauri-apps/api'
import { readText } from '@tauri-apps/api/clipboard'
import { listen } from '@tauri-apps/api/event'
import MaskIcon from '~/assets/icons/mask-square'
import { isKeyAltPressed, settingsStoreAtom, showEditClipId } from '~/store'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import {
  AlertTriangle,
  Check,
  CheckSquare2,
  ChevronDown,
  Clipboard,
  ClipboardPaste,
  HardDriveUpload,
  Square,
  SquarePen,
  SquareX,
  Trash,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { maskValue, maskValueFirstLast } from '~/lib/utils'

import ToolTip from '~/components/atoms/tooltip'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import InputCreditCardField from '~/components/molecules/input-credit-card'
import TextArea from '~/components/molecules/textarea'
import {
  Badge,
  Box,
  Button,
  ButtonGhost,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '~/components/ui'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'
import { useDebounce } from '~/hooks/use-debounce'
import { useSignal } from '~/hooks/use-signal'

import { ClipFormTemplateOptions } from './ClipCard'

const renderWithBadges = (
  value: string,
  templateFoundFields: string[] = [],
  templateMissingFields: string[] = [],
  templateFields: {
    value: string | undefined
    label: string | undefined
    isValueMasked: boolean | undefined
    isEnable: boolean | undefined
    isGlobal?: boolean | undefined
  }[] = [],
  clipboardValue: null | string,
  showValues = false,
  globalTemplates: any[] = []
): ReactNode[] => {
  const templateFieldRegex = /\{\{\s*(.*?)\s*\}\}/g

  const parts = value.split(templateFieldRegex)

  return parts.map((part: string, index: number): ReactNode => {
    const matchedField = templateFields.find(
      f => f.label?.toLocaleLowerCase() === part.toLocaleLowerCase()
    )

    const matchedGlobalTemplate = globalTemplates.find(
      gt => gt.isEnabled && gt.name?.toLocaleLowerCase() === part.toLocaleLowerCase()
    )

    if (matchedField) {
      const field = {
        label: part,
        isValueMasked: matchedField.isValueMasked,
        value:
          part.toLocaleLowerCase() === 'clipboard' ? clipboardValue : matchedField.value,
        isFound: templateFoundFields.includes(part.toLowerCase()),
        isMissing: templateMissingFields.includes(part.toLowerCase()),
        isEnable: matchedField.isEnable,
        isGlobal: matchedField.isGlobal || false,
      }

      const showValuesInTemplate = showValues && field.value

      return (
        <Text
          key={index}
          className={`${
            field.isEnable
              ? field.isGlobal
                ? '!text-purple-600 dark:!text-purple-400'
                : '!text-green-600 dark:!text-green-400'
              : '!text-gray-400 dark:!text-gray-600'
          } !font-normal inline-flex`}
          size="xs"
        >
          {showValuesInTemplate ? (
            <ToolTip
              text={
                <Badge
                  variant="outline"
                  className={`${
                    field.isEnable
                      ? field.isGlobal
                        ? '!text-purple-700 dark:!text-purple-300 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 border-purple-200 dark:border-purple-800'
                        : '!text-green-600 dark:!text-green-400 bg-green-100 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-900 border-green-200 dark:border-green-800'
                      : 'dark:!text-gray-300 text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200/80 dark:border-gray-700/80'
                  } text-normal pr-2.5`}
                >
                  <Check
                    size={12}
                    className={`mr-0.5 ${
                      field.isGlobal ? 'text-purple-600 dark:text-purple-400' : ''
                    }`}
                  />
                  {field.label}
                </Badge>
              }
              className="bg-transparent border-0"
              side="top"
              isCompact
              asChild
            >
              <Badge
                variant="outline"
                className={`${
                  field.isEnable
                    ? field.isGlobal
                      ? '!text-purple-700 dark:!text-purple-300 bg-purple-100/80 dark:bg-purple-800 hover:bg-purple-200/80 dark:hover:bg-purple-700/70 border-purple-100 hover:border-purple-200 dark:border-purple-800 dark:hover:border-purple-700'
                      : '!text-green-600 dark:!text-green-400 bg-green-100/80 dark:bg-green-900 hover:bg-green-50/80 dark:hover:bg-green-900/70 border-green-100 hover:border-green-200 dark:border-green-800 dark:hover:border-green-700'
                    : 'dark:!text-gray-600 text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200/80 dark:border-gray-700/80'
                } text-[14px] !font-normal px-1 rounded-sm`}
              >
                {field.isValueMasked ? maskValue(field.value) : field.value}
              </Badge>
            </ToolTip>
          ) : (
            <ToolTip
              isDisabled={field.isMissing || !field.value}
              text={field.value}
              side="top"
              isCompact
              asChild
            >
              <Badge
                variant="outline"
                className={`${
                  field.isEnable
                    ? field.isGlobal
                      ? '!text-purple-700 dark:!text-purple-300 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 border-purple-200 dark:border-purple-800'
                      : 'bg-green-100 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-900 border-green-200 dark:border-green-800'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200/80 dark:border-gray-700/80'
                } text-normal pr-2.5`}
              >
                <Check
                  size={12}
                  className={`mr-0.5 ${
                    field.isGlobal ? 'text-purple-600 dark:text-purple-400' : ''
                  }`}
                />
                {field.label}
              </Badge>
            </ToolTip>
          )}
        </Text>
      )
    } else if (matchedGlobalTemplate) {
      const field = {
        label: part,
        isValueMasked: false,
        value: matchedGlobalTemplate.value,
        isFound: true,
        isMissing: false,
        isEnable: true,
        isGlobal: true,
      }

      const showValuesInTemplate = showValues && field.value

      return (
        <Text
          key={index}
          className="!text-purple-600 dark:!text-purple-400 !font-normal inline-flex"
          size="xs"
        >
          {showValuesInTemplate ? (
            <ToolTip
              text={
                <Badge
                  variant="outline"
                  className="!text-purple-700 dark:!text-purple-300 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 border-purple-200 dark:border-purple-800 text-normal pr-2.5"
                >
                  <Check
                    size={12}
                    className="mr-0.5 text-purple-600 dark:text-purple-400"
                  />
                  {field.label} (Global)
                </Badge>
              }
              className="bg-transparent border-0"
              side="top"
              isCompact
              asChild
            >
              <Badge
                variant="outline"
                className="!text-purple-700 dark:!text-purple-300 bg-purple-100/80 dark:bg-purple-800 hover:bg-purple-200/80 dark:hover:bg-purple-700/70 border-purple-100 hover:border-purple-200 dark:border-purple-800 dark:hover:border-purple-700 text-[14px] !font-normal px-1 rounded-sm"
              >
                {field.value}
              </Badge>
            </ToolTip>
          ) : (
            <ToolTip
              text={`${field.value} (Global Template)`}
              side="top"
              isCompact
              asChild
            >
              <Badge
                variant="outline"
                className="!text-purple-700 dark:!text-purple-300 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 border-purple-200 dark:border-purple-800 text-normal pr-2.5"
              >
                <Check
                  size={12}
                  className="mr-0.5 text-purple-600 dark:text-purple-400"
                />
                {field.label}
              </Badge>
            </ToolTip>
          )}
        </Text>
      )
    }

    return part
  })
}

export function ClipViewTemplate({
  value,
  clipId,
  formTemplateOptions,
}: {
  value: string
  clipId: UniqueIdentifier | undefined
  formTemplateOptions: string | null | undefined
}) {
  const { t } = useTranslation()
  const { globalTemplates, globalTemplatesEnabled } = useAtomValue(settingsStoreAtom)
  const defaultValueResetKey = useSignal<string>(Date.now().toString())
  const valueChangeKey = useSignal<string>(Date.now().toString())
  const showAllLabelsMustBeUniqueMessage = useSignal<boolean>(false)
  const templateMissingFields = useSignal<string[]>([])
  const templateFoundFields = useSignal<string[]>([])
  const templateOutputFormat = useSignal<'text' | 'html'>('text')
  const templateShowFormat = useSignal<'labels' | 'values'>('labels')
  const templateView = useSignal<'template' | 'result'>('template')
  const templateTestOutput = useSignal('')
  const clipboardValueSignal = useSignal<null | string>(null)

  const [, setCopiedItem, ,] = useCopyClipItem({})
  const [, , setPastedItem] = usePasteClipItem({})

  const { updateItemById } = useUpdateItemById()
  const isUpdated = useSignal<boolean>(false)

  const localOptions = useSignal<ClipFormTemplateOptions>({
    templateOptions: [],
    formOptions: {
      fields: [],
    },
  })

  const debounceValueChangeKey = useDebounce(valueChangeKey.value, 300)
  const autoSaveValueChangeKey = useDebounce(valueChangeKey.value, 1000)

  const checkForTemplateFields = useCallback(
    (template: string) => {
      const regex = /{{[^{}]+}}/g
      templateMissingFields.value = []
      templateFoundFields.value = []
      const matches = template.match(regex)
      if (matches) {
        matches.forEach((match, index) => {
          matches[index] = match.replace(/[\n\r{}]+/g, '').trim()
          templateFoundFields.value.push(matches[index].toLocaleLowerCase())

          // Check local templates first
          const field = localOptions.value.templateOptions.find(
            f => f.label?.toLocaleLowerCase() === matches[index].toLocaleLowerCase()
          )

          // Check global templates if no local field found
          const globalTemplate =
            globalTemplatesEnabled &&
            globalTemplates.find(
              gt =>
                gt.isEnabled &&
                gt.name?.toLocaleLowerCase() === matches[index].toLocaleLowerCase()
            )

          if (!field && !globalTemplate) {
            templateMissingFields.value.push(matches[index])
          } else if (field) {
            field.isFound = true
          }
        })
      }
    },
    [localOptions.value.templateOptions, globalTemplates, globalTemplatesEnabled]
  )

  useEffect(() => {
    if (formTemplateOptions) {
      try {
        const options = JSON.parse(formTemplateOptions)
        localOptions.value = {
          ...localOptions.value,
          ...options,
        }
        const isLabelUnique = localOptions.value.templateOptions?.every(f => {
          return (
            localOptions.value.templateOptions?.filter(field => field.label === f.label)
              .length === 1
          )
        })
        if (!isLabelUnique) {
          showAllLabelsMustBeUniqueMessage.value = true
        }
        checkForTemplateFields(value)
      } catch (e) {
        console.log('error', e)
      }
    }
  }, [formTemplateOptions])

  const fillTemplate = useCallback(async () => {
    try {
      templateTestOutput.value = await invoke('run_template_fill', {
        templateValue: value,
        templateOptions: localOptions.value.templateOptions,
        isPreview: true,
      })
    } catch (e) {
      console.error(e)
    }
  }, [value, localOptions.value.templateOptions])

  useEffect(() => {
    fillTemplate()
  }, [localOptions.value.templateOptions, value, debounceValueChangeKey])

  useEffect(() => {
    const formTemplateOptions = JSON.stringify(localOptions.value)
    try {
      updateItemById({
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
  }, [value, autoSaveValueChangeKey])

  useEffect(() => {
    const listenToClipboardUnlisten = listen(
      'clipboard://clipboard-monitor/update',
      async e => {
        if (e.payload === 'clipboard update') {
          clipboardValueSignal.value = await readText()
        }
      }
    )

    const fetchClipboardValue = async () => {
      clipboardValueSignal.value = await readText()
    }

    fetchClipboardValue()

    return () => {
      listenToClipboardUnlisten.then(unlisten => {
        unlisten()
      })
    }
  }, [])

  useEffect(() => {
    if (isUpdated.value) {
      setTimeout(() => {
        isUpdated.value = false
      }, 1000)
    }
  }, [isUpdated.value])

  const renderWithBadgesCallBack = useMemo(() => {
    return renderWithBadges(
      value,
      templateFoundFields.value,
      templateMissingFields.value,
      localOptions.value.templateOptions
        .filter(f => f.label !== undefined)
        .map(({ label, isEnable, value, isValueMasked, isGlobal }) => {
          // For global templates, get the current value from globalTemplates
          const actualValue =
            isGlobal && globalTemplatesEnabled
              ? globalTemplates.find(gt => gt.isEnabled && gt.name === label)?.value || ''
              : value

          return {
            label,
            isValueMasked,
            value: actualValue,
            isEnable,
            isGlobal,
          }
        }),
      clipboardValueSignal.value,
      templateShowFormat.value === 'values',
      globalTemplatesEnabled ? globalTemplates : []
    )
  }, [
    value,
    debounceValueChangeKey,
    templateFoundFields.value,
    templateMissingFields.value,
    localOptions.value.templateOptions,
    clipboardValueSignal.value,
    templateShowFormat.value,
    globalTemplates,
    globalTemplatesEnabled,
  ])

  return (
    <>
      <Box className="select-none mt-1 pb-1">
        <Box className="mt-1.5 mb-1">
          <Flex className="w-full justify-start">
            <Button
              variant="ghost"
              size="mini"
              onClick={() => {
                showEditClipId.value = clipId ?? null
              }}
              className="cursor-pointer hover:bg-transparent "
            >
              <Text
                className="!text-blue-500 dark:!text-blue-400 hover:underline"
                size="xs"
              >
                {t('Edit Template', { ns: 'dashboard' })}
              </Text>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="mini"
                  className="cursor-pointer ml-auto hover:bg-transparent !px-2 !py-0"
                >
                  <Text
                    className="!text-blue-500 dark:!text-blue-400 hover:underline"
                    size="xs"
                  >
                    {t('Fields Value', { ns: 'dashboard' })}
                    <ChevronDown size={12} className="ml-1" />
                  </Text>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={12} align="center">
                <DropdownMenuItem
                  className="text-center items-center justify-start py-1 text-xs"
                  onSelect={() => {
                    localOptions.value.templateOptions =
                      localOptions.value.templateOptions.map(field => {
                        field.value = ''
                        return field
                      })

                    localOptions.value = {
                      ...localOptions.value,
                      templateOptions: [...localOptions.value.templateOptions],
                    }

                    defaultValueResetKey.value = Date.now().toString()
                    valueChangeKey.value = Date.now().toString()
                  }}
                >
                  <Text className="mr-2">
                    {t('Clear All Fields', { ns: 'dashboard' })}
                  </Text>
                  <SquareX size={14} className="ml-auto text-slate-400" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center items-center justify-start py-1 text-xs"
                  onSelect={() => {
                    localOptions.value.templateOptions =
                      localOptions.value.templateOptions.map(field => {
                        field.value = field.defaultValue
                        return field
                      })

                    localOptions.value = {
                      ...localOptions.value,
                      templateOptions: [...localOptions.value.templateOptions],
                    }

                    defaultValueResetKey.value = Date.now().toString()
                    valueChangeKey.value = Date.now().toString()
                  }}
                >
                  <Text className="mr-2">
                    {t('Reset to Defaults', { ns: 'dashboard' })}
                  </Text>
                  <SquarePen size={14} className="ml-auto text-slate-400" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center items-center justify-start py-1 text-xs"
                  onSelect={async () => {
                    localOptions.value.templateOptions.forEach(field => {
                      field.defaultValue = field.value
                    })

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
                  <Text className="mr-2">
                    {t('Save as Defaults', { ns: 'dashboard' })}
                  </Text>
                  <HardDriveUpload size={14} className="ml-auto text-slate-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>
        </Box>
        {localOptions.value.templateOptions?.map((field, i) => {
          const isTextArea = field.type === 'textarea'
          const isLabelOnTop = field.isLabelOnTop
          const selectedOption = field.selectOptions?.find(
            option => option === field.value
          )
          const isSelectEmpty = !Boolean(field.selectOptions?.length)
          const isFoundInTemplate = Boolean(
            field.label && templateFoundFields.value.includes(field.label?.toLowerCase())
          )

          const isEnable = field.isEnable === false || !isFoundInTemplate

          return (
            <Flex
              className={`mb-1 group ${
                isLabelOnTop ? 'flex-col items-start' : 'items-center'
              } ${isTextArea ? '!mt-2 !mb-1' : ''}`}
              key={i}
            >
              {field.label ? (
                <Flex
                  className={`${
                    isEnable ? 'bg-gray-100 opacity-50 dark:bg-gray-900' : ''
                  } text-[13px] !font-semibold flex self-stretch ${
                    !isLabelOnTop ? '!justify-end' : '!justify-start pl-1'
                  } ${
                    !isFoundInTemplate
                      ? '!text-amber-800 dark:!text-amber-400 opacity-60'
                      : ''
                  }`}
                >
                  <span
                    className={`whitespace-nowrap pr-1 min-w-[80px] overflow-hidden text-ellipsis block ${
                      isLabelOnTop ? 'text-left' : 'text-right max-w-[160px]'
                    } ${field.isGlobal ? 'text-purple-600 dark:text-purple-400' : ''}`}
                  >
                    {field.label}
                  </span>
                </Flex>
              ) : (
                <div className="pr-1 min-w-[80px]" />
              )}
              <Flex className="w-full">
                <Flex
                  className={`gap-0.5 flex-col w-full items-start ${
                    isEnable ? 'bg-gray-100 opacity-50 dark:bg-gray-900' : ''
                  }`}
                >
                  <Flex className="w-full gap-1">
                    {field.type === 'password' || field.type === 'passwordCode' ? (
                      <InputField
                        small
                        placeholder={
                          field.type === 'passwordCode'
                            ? t('Enter code', { ns: 'dashboard' })
                            : t('Enter secret value', { ns: 'dashboard' })
                        }
                        autoFocus={
                          i === localOptions.value.templateOptions.length - 1 &&
                          localOptions.value.templateOptions[i].value === ''
                        }
                        classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                        disabled={isEnable}
                        isPassword={true}
                        numbersOnly={field.type === 'passwordCode' ? true : false}
                        showHidePassword={true}
                        className={`${
                          field.isEnable === false
                            ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                            : ''
                        } w-full`}
                        key={defaultValueResetKey.value}
                        onChange={e => {
                          field.value = e.target.value.trim()
                          valueChangeKey.value = Date.now().toString()
                        }}
                        defaultValue={field.value}
                      />
                    ) : field.type === 'creditcard' ? (
                      <InputCreditCardField
                        small
                        placeholder={t('Enter credit card number', { ns: 'dashboard' })}
                        classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                        disabled={isEnable}
                        key={defaultValueResetKey.value}
                        autoFocus={
                          i === localOptions.value.templateOptions?.length - 1 &&
                          localOptions.value.templateOptions[i].value === ''
                        }
                        className={`${
                          isEnable ? 'bg-gray-100 opacity-50 dark:bg-gray-900' : ''
                        } w-full`}
                        onInputBlur={(value: string) => {
                          field.value = value
                        }}
                        ccNumber={field.value}
                      />
                    ) : field.type === 'textarea' ? (
                      <TextArea
                        placeholder={t('Enter field value', { ns: 'dashboard' })}
                        label=""
                        key={defaultValueResetKey.value}
                        className="text-sm font-semibold border-0 border-transparent focus:border-blue-400 rounded-none nowrap overflow-hidden text-ellipsis !pl-0.5 w-full"
                        classNameArea={
                          isEnable
                            ? 'dark:!text-slate-500 !bg-gray-100 opacity-50 dark:!bg-gray-900'
                            : 'dark:!text-slate-300 dark:!bg-slate-900'
                        }
                        autoFocus={
                          i === localOptions.value.templateOptions.length - 1 &&
                          localOptions.value.templateOptions[i].value === '' &&
                          Boolean(localOptions.value.templateOptions[i].label)
                        }
                        maxRows={2}
                        value={field.value}
                        enableEmoji={false}
                        enableEmojiInside
                        onKeyDown={e => {
                          e.stopPropagation()
                        }}
                        onChange={e => {
                          field.value = e.target.value
                          valueChangeKey.value = Date.now().toString()
                          localOptions.value = {
                            ...localOptions.value,
                            templateOptions: [...localOptions.value.templateOptions],
                          }
                        }}
                      />
                    ) : field.type === 'select' ? (
                      <Flex className="justify-start items-center w-full my-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="mini"
                              variant="ghost"
                              disabled={isEnable}
                              className="rounded-sm font-semibold hover:bg-transparent px-2 py-1 w-full border border-slate-300 hover:border-blue-500 dark:border-slate-800 dark:hover:border-blue-500 dark:bg-slate-900 dark:hover:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-500"
                            >
                              <Flex className="flex items-center justify-start w-full gap-1">
                                <Text className="!text-slate-700 dark:!text-slate-300 text-ellipsis overflow-hidden !block line-clamp-2">
                                  {isSelectEmpty
                                    ? t('Select is empty', { ns: 'common' })
                                    : !selectedOption
                                      ? t('Select option', { ns: 'common' })
                                      : selectedOption}
                                </Text>
                                <Flex className="w-[18px] h-[18px] ml-0.5 mr-0">
                                  <ChevronDown size={13} />
                                </Flex>
                              </Flex>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            sideOffset={12}
                            align="start"
                            className="max-w-[300px]"
                          >
                            <DropdownMenuItem
                              className="text-center items-center justify-center py-0.5 text-xs"
                              disabled={true}
                            >
                              {!isSelectEmpty ? (
                                <Text>{t('Select option', { ns: 'common' })}</Text>
                              ) : (
                                <Text>{t('Select is empty', { ns: 'common' })}</Text>
                              )}
                            </DropdownMenuItem>
                            {!isSelectEmpty && (
                              <>
                                <DropdownMenuSeparator />
                                {localOptions.value.templateOptions[
                                  i
                                ]?.selectOptions?.map((option, idx) => {
                                  return (
                                    <DropdownMenuCheckboxItem
                                      key={idx}
                                      checked={field.value === option}
                                      onSelect={() => {
                                        field.value = option
                                        valueChangeKey.value = Date.now().toString()
                                        localOptions.value = {
                                          ...localOptions.value,
                                          templateOptions: [
                                            ...localOptions.value.templateOptions,
                                          ],
                                        }
                                      }}
                                    >
                                      <Text
                                        className={`text-xs ${
                                          field.value === option ? 'font-semibold' : ''
                                        }`}
                                      >
                                        {option}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                  )
                                })}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Flex>
                    ) : field.label?.toLocaleLowerCase() !== 'clipboard' ? (
                      field.isGlobal ? (
                        // For global templates, show the value but make it non-editable
                        <Flex className="items-center gap-2 w-full">
                          <InputField
                            small
                            key={defaultValueResetKey.value}
                            placeholder=""
                            value={
                              globalTemplates.find(
                                gt => gt.isEnabled && gt.name === field.label
                              )?.value || ''
                            }
                            classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-purple-300 dark:bg-slate-900 opacity-75"
                            disabled={true}
                            type="text"
                            className={`${
                              isEnable ? 'bg-gray-100 opacity-50 dark:bg-gray-900' : ''
                            } w-full`}
                            title={`Global Template: ${field.label}`}
                          />
                          <Badge className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700 cursor-default text-xs py-0.5 px-1.5">
                            <Check
                              size={12}
                              className="text-purple-600 dark:text-purple-400"
                            />
                            {t('Global', { ns: 'templates' })}
                          </Badge>
                        </Flex>
                      ) : (
                        <InputField
                          small
                          key={defaultValueResetKey.value}
                          placeholder={t('Enter field value', { ns: 'dashboard' })}
                          autoFocus={Boolean(localOptions.value.templateOptions[i].label)}
                          classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                          disabled={isEnable}
                          type={field.type === 'number' ? 'number' : 'text'}
                          className={`${
                            isEnable ? 'bg-gray-100 opacity-50 dark:bg-gray-900' : ''
                          } w-full`}
                          onChange={e => {
                            field.value = e.target.value.trim()
                            valueChangeKey.value = Date.now().toString()
                          }}
                          defaultValue={field.value}
                        />
                      )
                    ) : (
                      <>
                        <InputField
                          small
                          value={
                            field.isValueMasked && clipboardValueSignal.value
                              ? maskValueFirstLast(clipboardValueSignal.value)
                              : clipboardValueSignal.value
                                ? clipboardValueSignal.value
                                : t('This field allows to insert text from clipboard', {
                                    ns: 'dashboard',
                                  })
                          }
                          title={clipboardValueSignal.value ?? ''}
                          autoFocus={false}
                          classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-transparent"
                          disabled={true}
                          type={'text'}
                          className={`${
                            isEnable ? 'bg-gray-100 opacity-50 dark:bg-gray-900' : ''
                          } w-full`}
                        />
                        <ToolTip
                          isCompact
                          text={t('Mask to hide clipboard value in preview', {
                            ns: 'dashboard',
                          })}
                        >
                          <MaskIcon
                            width={15}
                            height={15}
                            className={`${
                              field.isValueMasked
                                ? 'text-blue-500 opacity-100'
                                : 'text-slate-500 opacity-50'
                            } hover:text-blue-500 dark:hover:text-blue-400 hover:opacity-100 cursor-pointer`}
                            onClick={() => {
                              localOptions.value = {
                                ...localOptions.value,
                                templateOptions: [
                                  ...localOptions.value.templateOptions?.map(
                                    (f, index) => {
                                      if (index === i) {
                                        return {
                                          ...f,
                                          isValueMasked: !f.isValueMasked,
                                        }
                                      }
                                      return f
                                    }
                                  ),
                                ],
                              }
                            }}
                          />
                        </ToolTip>
                      </>
                    )}
                  </Flex>
                </Flex>
                <Flex className="gap-1 ml-0.5">
                  {isFoundInTemplate ? (
                    <Button
                      size="mini"
                      title={t('Enable / Disable', { ns: 'common' })}
                      variant="ghost"
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                      onClick={async () => {
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [
                            ...localOptions.value.templateOptions?.map((f, index) => {
                              if (index === i) {
                                return {
                                  ...f,
                                  isEnable: !f.isEnable,
                                }
                              }
                              return f
                            }),
                          ],
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
                      {localOptions.value.templateOptions &&
                      localOptions.value.templateOptions[i]?.isEnable ? (
                        <CheckSquare2 size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="mini"
                          title={t('Not found in the template', { ns: 'common' })}
                          variant="ghost"
                          className="text-sm font-semibold w-6 h-6 hover:bg-transparent !text-amber-800 dark:!text-amber-400 opacity-60"
                        >
                          <AlertTriangle size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent sideOffset={12} align="center">
                        <DropdownMenuItem
                          className="text-red-500 dark:!text-red-600 text-[13px] focus:text-red-500 py-1"
                          onSelect={() => {
                            localOptions.value = {
                              ...localOptions.value,
                              templateOptions: [
                                ...localOptions.value.templateOptions?.filter(
                                  (f, index) => index !== i
                                ),
                              ],
                            }

                            const formTemplateOptions = JSON.stringify(localOptions.value)
                            try {
                              updateItemById({
                                updatedItem: {
                                  formTemplateOptions,
                                  itemId: clipId,
                                },
                              })
                            } catch (e) {
                              console.error(e)
                            }
                          }}
                        >
                          <Text size="xs" className="!text-red-500 dark:!text-red-600">
                            {t('Remove', { ns: 'common' })}
                          </Text>
                          <div className="ml-auto">
                            <Trash size={13} />
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </Flex>
              </Flex>
            </Flex>
          )
        })}
        {showAllLabelsMustBeUniqueMessage.value && (
          <Text className="!text-amber-800 dark:!text-amber-400 text-[13px] my-2 bg-yellow-50 dark:bg-yellow-900 p-2 relative">
            {t(
              'All field labels must be unique to ensure they are correctly used within the template.',
              {
                ns: 'dashboard',
              }
            )}
            <X
              className="absolute top-0 right-0 m-2 bg-yellow-50 dark:bg-yellow-900 z-10 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800"
              size={14}
              onClick={() => {
                showAllLabelsMustBeUniqueMessage.value = false
              }}
            />
          </Text>
        )}
        {templateMissingFields.value.length > 0 && (
          <Flex className="rounded-md gap-2 my-3 items-start justify-start flex-wrap !text-amber-800 dark:!text-amber-400 text-[13px] bg-yellow-50 dark:bg-amber-950 p-2">
            <Text className="!text-amber-700 dark:!text-amber-500 text-[13px] w-full">
              <AlertTriangle size={13} className="mr-1" />
              {t('Found in template but missing from fields definition', {
                ns: 'common',
              })}
              :
            </Text>
            {templateMissingFields?.value.map((field, i) => {
              // Check if this field exists as a global template
              const globalTemplate =
                globalTemplatesEnabled &&
                globalTemplates.find(
                  gt =>
                    gt.isEnabled &&
                    gt.name?.toLocaleLowerCase() === field.toLocaleLowerCase()
                )

              return (
                <Box key={i}>
                  <Badge
                    variant="outline"
                    className={`${
                      globalTemplate
                        ? 'bg-purple-50 !text-purple-500 dark:!text-purple-400 dark:bg-purple-950/80 border-purple-100 dark:border-purple-900'
                        : 'bg-red-50 !text-red-500 dark:!text-red-400 dark:bg-red-950/80 border-red-100 dark:border-red-900'
                    } text-normal px-2`}
                  >
                    {field}
                    {globalTemplate && (
                      <Text className="ml-1 text-xs opacity-70">(Global)</Text>
                    )}
                  </Badge>
                </Box>
              )
            })}
          </Flex>
        )}
        <>
          <Flex className="gap-1 mt-2">
            <Button
              size="mini"
              className={`!text-sm hover:bg-transparent hover:text-blue-500 dark:hover:text-blue-400 border-b-2 ${
                templateView.value === 'template'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 '
              } rounded-none px-2 py-0.5`}
              variant="ghost"
              onClick={() => {
                templateView.value = 'template'
              }}
            >
              {t('Template', { ns: 'dashboard' })}
            </Button>
            {templateTestOutput.value && (
              <Button
                size="mini"
                variant="ghost"
                className={`!text-sm hover:bg-transparent hover:text-blue-500 dark:hover:text-blue-400 border-b-2 ${
                  templateView.value === 'result'
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-slate-400 dark:text-slate-400'
                } rounded-none px-2 py-0.5`}
                onClick={() => {
                  templateView.value = 'result'
                  fillTemplate()
                }}
              >
                {t('Result', { ns: 'dashboard' })}
              </Button>
            )}
          </Flex>
          {templateView.value === 'template' ? (
            <Box className="bg-sky-50/70 dark:bg-sky-950/70 relative rounded-md text-sm">
              {clipId && (
                <ButtonGhost
                  className="hover:bg-transparent rounded-md dark:text-slate-400 hover:text-green-600 hover:dark:text-green-600 top-3 right-3 absolute z-10"
                  onClick={() => {
                    isKeyAltPressed.value ? setPastedItem(clipId) : setCopiedItem(clipId)
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
                      <ClipboardPaste size={15} />
                    ) : (
                      <Clipboard size={15} />
                    )}
                  </ToolTip>
                </ButtonGhost>
              )}
              <SimpleBar
                className="code-filter"
                style={{ height: 'auto', maxHeight: '280px' }}
                autoHide={false}
              >
                <Box className="text-sm py-1 px-3 whitespace-pre-wrap pb-8 pt-3 select-text">
                  {renderWithBadgesCallBack}
                </Box>
              </SimpleBar>
              <Tabs
                className="flex flex-row absolute bottom-2 right-3 z-10 select-none"
                value={templateShowFormat.value}
                onValueChange={(val: string) => {
                  templateShowFormat.value = val === 'labels' ? 'labels' : 'values'
                }}
              >
                <TabsList className="self-center px-1 py-1 opacity-60 hover:opacity-100 animate-in fade-in bg-slate-200 dark:bg-slate-900">
                  <TabsTrigger
                    value="labels"
                    className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                  >
                    {t('Labels', { ns: 'dashboard' })}
                  </TabsTrigger>
                  <TabsTrigger
                    value="values"
                    className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                  >
                    {t('Values', { ns: 'dashboard' })}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Box>
          ) : (
            templateView.value === 'result' &&
            templateTestOutput.value && (
              <Box className="bg-sky-50/70 dark:bg-sky-950/70 relative mt-0 rounded-md text-sm">
                {clipId && (
                  <ButtonGhost
                    className="hover:bg-transparent rounded-md dark:text-slate-400 hover:text-green-600 hover:dark:text-green-600 top-3 right-3 absolute z-10"
                    onClick={() => {
                      isKeyAltPressed.value
                        ? setPastedItem(clipId)
                        : setCopiedItem(clipId)
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
                        <ClipboardPaste size={15} />
                      ) : (
                        <Clipboard size={15} />
                      )}
                    </ToolTip>
                  </ButtonGhost>
                )}

                <SimpleBar
                  className="code-filter"
                  style={{ height: 'auto', maxHeight: '280px' }}
                  autoHide={false}
                >
                  <Box className="text-sm py-1 px-3 whitespace-pre-wrap pb-8 pt-3 select-text">
                    <div
                      {...(templateOutputFormat.value === 'html' && {
                        dangerouslySetInnerHTML: {
                          __html: DOMPurify.sanitize(templateTestOutput.value),
                        },
                      })}
                      className="font-normal"
                    />
                    {templateOutputFormat.value === 'text' && templateTestOutput.value}
                  </Box>
                </SimpleBar>
                <Tabs
                  className="flex flex-row absolute bottom-2 right-3 z-10 select-none"
                  value={templateOutputFormat.value}
                  onValueChange={(val: string) => {
                    templateOutputFormat.value = val === 'html' ? 'html' : 'text'
                  }}
                >
                  <TabsList className="self-center px-1 py-1 opacity-60 hover:opacity-100 animate-in fade-in bg-slate-200 dark:bg-slate-900">
                    <TabsTrigger
                      value="text"
                      className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                    >
                      {t('Text', { ns: 'dashboard' })}
                    </TabsTrigger>
                    <TabsTrigger
                      value="html"
                      className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                    >
                      {t('HTML', { ns: 'dashboard' })}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </Box>
            )
          )}
        </>
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
