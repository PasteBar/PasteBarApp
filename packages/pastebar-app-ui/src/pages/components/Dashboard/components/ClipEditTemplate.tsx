/* eslint-disable sonarjs/cognitive-complexity */
import { useRef } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { Signal, useSignal as useSignalPreact } from '@preact/signals-react' // Renamed to avoid conflict
import MaskIcon from '~/assets/icons/mask-square'
import { settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import {
  AlertTriangle,
  AlignEndVertical,
  AlignVerticalJustifyEnd,
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  CheckSquare2,
  ChevronDown,
  Edit,
  MoreVertical,
  MoveDown,
  MoveUp,
  Plus,
  Square,
  SquarePen,
  SquareX,
  Trash,
  Trash2,
  X,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { maskValueFirstLast } from '~/lib/utils'

import ToolTip from '~/components/atoms/tooltip'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import InputCreditCardField from '~/components/molecules/input-credit-card'
import TextArea, { TextAreaRef } from '~/components/molecules/textarea'
import {
  Badge,
  Box,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Text,
} from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

import { ClipFormTemplateOptions } from './ClipCard'
import { ClipFormTypes } from './ClipEditForm'

const FIELD_TYPES: Array<'text' | 'textarea' | 'select'> = ['text', 'textarea', 'select']
export function ClipEditTemplate({
  clipValue,
  templateMissingFields,
  templateFoundFields,
  checkForTemplateFieldsCallback,
  isLargeView,
  localOptions,
}: {
  clipValue: Signal<string>
  templateMissingFields: Signal<string[]>
  templateFoundFields: Signal<string[]>
  checkForTemplateFieldsCallback: () => void
  isLargeView?: boolean
  localOptions: Signal<ClipFormTemplateOptions>
}) {
  const { t } = useTranslation()
  const { globalTemplates, globalTemplatesEnabled } = useAtomValue(settingsStoreAtom)
  const editFieldId = useSignalPreact<string | null>(null)
  const editSelectOptionFieldId = useSignalPreact<string | null>(null)
  const addSelectOptionFieldId = useSignal<string | null>(null)
  const editSelectOptionOriginalValue = useSignalPreact<string | null>(null)
  const textAreaRef = useRef<TextAreaRef>(null)
  const showAllLabelsMustBeUniqueMessage = useSignalPreact<boolean>(false)
  const showGlobalConflictWarning = useSignalPreact<boolean>(false)
  const conflictingGlobalLabel = useSignalPreact<string | null>(null)
  const defaultValueResetKey = useSignalPreact<string>(Date.now().toString())

  const FIELD_TYPES = ['text', 'textarea', 'select'] as const
  type FieldType = (typeof FIELD_TYPES)[number]

  return (
    <Box className="select-none mt-1">
      <Box className="my-2">
        <Flex className="gap-3 w-full justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Text
                className="!text-blue-500 dark:!text-blue-400 hover:underline cursor-pointer"
                size="xs"
              >
                {t('Add Template Field', { ns: 'dashboard' })}
                <ChevronDown size={12} className="ml-1" />
              </Text>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={12} align="center">
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5 text-xs"
                disabled={true}
              >
                <Text>{t('General Fields', { ns: 'dashboard' })}</Text>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {FIELD_TYPES.map((type: FieldType) => (
                <DropdownMenuItem
                  className="text-xs"
                  key={type}
                  onClick={() => {
                    editFieldId.value = null
                    showGlobalConflictWarning.value = false
                    conflictingGlobalLabel.value = null
                    if (!localOptions.value.templateOptions) {
                      localOptions.value.templateOptions = []
                    }

                    const newFields = localOptions.value.templateOptions.map(field => {
                      if (!field.label?.trim()) {
                        field.label = `${
                          field.type &&
                          field.type?.charAt(0).toUpperCase() + field.type?.slice(1)
                        } ${t('Field', { ns: 'dashboard' })}`
                      }
                      return field
                    })

                    const newLabel = `${type.charAt(0).toUpperCase() + type.slice(1)}`
                    newFields.push({
                      id: Date.now().toString(),
                      type,
                      label: newLabel,
                      isEnable: true,
                      value: '',
                    })

                    // Check for global conflict
                    if (globalTemplatesEnabled) {
                      const conflictingGlobal = globalTemplates.find(
                        gt => gt.isEnabled && gt.name === newLabel
                      )
                      if (conflictingGlobal) {
                        showGlobalConflictWarning.value = true
                        conflictingGlobalLabel.value = newLabel
                      }
                    }

                    localOptions.value = {
                      ...localOptions.value,
                      templateOptions: [...newFields],
                    }
                    editFieldId.value = newFields[newFields.length - 1].id ?? null
                  }}
                >
                  <Plus size={12} className="mr-1" />
                  {t('{{type}} Field', {
                    ns: 'dashboard',
                    type: type.charAt(0).toUpperCase() + type.slice(1),
                  })}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5 text-xs"
                disabled={true}
              >
                <Text>{t('Common Fields', { ns: 'dashboard' })}</Text>
              </DropdownMenuItem>
              <SimpleBar
                className="code-filter"
                style={{ height: 'auto', maxHeight: '260px' }}
                autoHide={false}
              >
                {ClipFormTypes.map(label => {
                  return (
                    <DropdownMenuItem
                      key={label}
                      className="text-xs"
                      onClick={() => {
                        if (!localOptions.value.templateOptions) {
                          localOptions.value.templateOptions = []
                        }

                        showAllLabelsMustBeUniqueMessage.value = false
                        showGlobalConflictWarning.value = false
                        conflictingGlobalLabel.value = null

                        const newFields = [...localOptions.value.templateOptions]

                        const newType =
                          label === 'Text'
                            ? 'text'
                            : label === 'Number'
                              ? 'number'
                              : label === 'Password' ||
                                  label === 'Secret' ||
                                  label === 'API Key' ||
                                  label === 'License Key' ||
                                  label === 'SSN'
                                ? 'password'
                                : label === 'CVV Code'
                                  ? 'passwordCode'
                                  : label === 'Textarea'
                                    ? 'textarea'
                                    : label === 'Credit Card'
                                      ? 'creditcard'
                                      : 'text'

                        const isLabelUnique = localOptions.value.templateOptions?.every(
                          f => {
                            return f.label !== label
                          }
                        )

                        if (!isLabelUnique) {
                          showAllLabelsMustBeUniqueMessage.value = true
                        }

                        const newLabel = isLabelUnique
                          ? label
                          : `${label} ${localOptions.value.templateOptions.length + 1}`

                        newFields.push({
                          id: Date.now().toString(),
                          label: newLabel,
                          type: newType,
                          isEnable: true,
                          value: '',
                        })

                        // Check for global conflict
                        if (globalTemplatesEnabled) {
                          const conflictingGlobal = globalTemplates.find(
                            gt => gt.isEnabled && gt.name === newLabel
                          )
                          if (conflictingGlobal) {
                            showGlobalConflictWarning.value = true
                            conflictingGlobalLabel.value = newLabel
                          }
                        }

                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: newFields,
                        }

                        if (label === 'Custom') {
                          editFieldId.value = newFields[newFields.length - 1].id ?? null
                        }
                      }}
                    >
                      {label}
                    </DropdownMenuItem>
                  )
                })}
              </SimpleBar>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5 text-xs"
                disabled={true}
              >
                <Text>{t('Special Field', { ns: 'dashboard' })}</Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => {
                  editFieldId.value = null
                  if (!localOptions.value.templateOptions) {
                    localOptions.value.templateOptions = []
                  }
                  showGlobalConflictWarning.value = false
                  conflictingGlobalLabel.value = null

                  const isClipboardFieldExists = localOptions.value.templateOptions?.some(
                    field => field.label === 'Clipboard'
                  )

                  if (isClipboardFieldExists) {
                    localOptions.value.templateOptions =
                      localOptions.value.templateOptions.map(field => {
                        if (field.label === 'Clipboard') {
                          field.isEnable = true
                        }
                        return field
                      })
                    return
                  }

                  const newFields = localOptions.value.templateOptions.map(field => {
                    return field
                  })

                  newFields.push({
                    id: Date.now().toString(),
                    type: 'text',
                    label: 'Clipboard', // 'Clipboard' is a special keyword, unlikely to conflict with user global templates
                    isEnable: true,
                    value: '',
                  })

                  localOptions.value = {
                    ...localOptions.value,
                    templateOptions: [...newFields],
                  }
                }}
              >
                <Plus size={12} className="mr-1" />
                {t('Clipboard', {
                  ns: 'dashboard',
                })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                className="text-center items-center justify-center py-1 text-xs"
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
                }}
              >
                <Text>{t('Clear All Fields', { ns: 'dashboard' })}</Text>
                <SquareX size={14} className="ml-1 text-slate-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Box>
      {localOptions.value.templateOptions?.map((field, i) => {
        const isEdit = field.id === editFieldId.value
        const isTextArea = field.type === 'textarea'
        const isLabelOnTop = field.isLabelOnTop
        const selectedOption = field.selectOptions?.find(option => option === field.value)
        const isSelectEmpty = !Boolean(field.selectOptions?.length)

        return (
          <Flex
            className={`mb-1 group ${
              isLabelOnTop ? 'flex-col items-start' : 'items-center'
            } ${isTextArea ? '!mt-2 !mb-1' : ''}`}
            key={i}
          >
            {field.label || isEdit ? (
              <Flex
                className={`${
                  field.isEnable === false
                    ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                    : ''
                } text-[13px] !font-semibold flex self-stretch ${
                  !isLabelOnTop ? '!justify-end' : '!justify-start pl-1'
                }`}
              >
                {!isEdit ? (
                  <span
                    className={`whitespace-nowrap pr-1 min-w-[80px] overflow-hidden text-ellipsis block ${
                      isLabelOnTop ? 'text-left' : 'text-right max-w-[160px]'
                    }`}
                  >
                    {field.label}
                  </span>
                ) : (
                  <Flex className={`whitespace-nowrap pr-1 min-w-[120px] text-left`}>
                    <InputField
                      defaultValue={field.label}
                      small
                      placeholder={t('Enter Label', { ns: 'dashboard' })}
                      autoFocus={true}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          editFieldId.value = null
                          showAllLabelsMustBeUniqueMessage.value = false
                          showGlobalConflictWarning.value = false // Reset on action
                          conflictingGlobalLabel.value = null

                          const finalLabel = field.label?.trim() || ''

                          const isLabelUnique = localOptions.value.templateOptions?.every(
                            (f, index) => {
                              if (index !== i) {
                                return f.label !== finalLabel
                              }
                              return true
                            }
                          )

                          if (!isLabelUnique) {
                            field.label = `${finalLabel} ${i + 1}`
                          } else {
                            field.label = finalLabel // Ensure trimmed label is set
                          }

                          // Check for global conflict
                          if (globalTemplatesEnabled && field.label) {
                            const conflictingGlobal = globalTemplates.find(
                              gt => gt.isEnabled && gt.name === field.label
                            )
                            if (conflictingGlobal) {
                              showGlobalConflictWarning.value = true
                              conflictingGlobalLabel.value = field.label
                            }
                          }

                          localOptions.value = {
                            ...localOptions.value,
                            templateOptions: [...localOptions.value.templateOptions],
                          }
                        }
                      }}
                      onChange={e => {
                        field.label = e.target.value.trim()
                      }}
                    />
                    <Button
                      size="mini"
                      variant="ghost"
                      className="ml-1 h-8 w-9 text-blue-500 dark:bg-slate-800"
                      onClick={() => {
                        editFieldId.value = null
                        // Final check for conflicts when 'Done' is clicked
                        const finalLabelOnClick = field.label?.trim() || ''
                        if (finalLabelOnClick) {
                          field.label = finalLabelOnClick // Ensure trimmed label is set
                          if (globalTemplatesEnabled) {
                            const conflictingGlobal = globalTemplates.find(
                              gt => gt.isEnabled && gt.name === finalLabelOnClick
                            )
                            if (conflictingGlobal) {
                              showGlobalConflictWarning.value = true
                              conflictingGlobalLabel.value = finalLabelOnClick
                            } else {
                              showGlobalConflictWarning.value = false
                              conflictingGlobalLabel.value = null
                            }
                          }
                        }
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [...localOptions.value.templateOptions],
                        }
                      }}
                      title={t('Done Edit', { ns: 'common' })}
                    >
                      <Check size={18} />
                    </Button>
                  </Flex>
                )}
              </Flex>
            ) : (
              <div className="pr-1 min-w-[80px]" />
            )}
            <Flex className="w-full">
              <Flex
                className={`gap-0.5 flex-col w-full items-start ${
                  field.isEnable === false
                    ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                    : ''
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
                      disabled={field.isEnable === false}
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
                      }}
                      defaultValue={field.value}
                    />
                  ) : field.type === 'creditcard' ? (
                    <InputCreditCardField
                      small
                      placeholder={t('Enter credit card number', { ns: 'dashboard' })}
                      classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                      disabled={field.isEnable === false}
                      key={defaultValueResetKey.value}
                      autoFocus={
                        i === localOptions.value.templateOptions?.length - 1 &&
                        localOptions.value.templateOptions[i].value === ''
                      }
                      className={`${
                        field.isEnable === false
                          ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                          : ''
                      } w-full`}
                      onInputBlur={(value: string) => {
                        field.value = value
                      }}
                      ccNumber={field.value}
                    />
                  ) : field.type === 'textarea' ? (
                    <TextArea
                      placeholder={t('Enter default value', { ns: 'dashboard' })}
                      label=""
                      key={defaultValueResetKey.value}
                      className="text-sm font-semibold border-0 border-transparent focus:border-blue-400 rounded-none nowrap overflow-hidden text-ellipsis !pl-0.5 w-full"
                      classNameArea={
                        field.isEnable === false
                          ? 'dark:!text-slate-500 !bg-gray-100 opacity-50 dark:!bg-gray-900'
                          : 'dark:!text-slate-300 dark:!bg-slate-900'
                      }
                      autoFocus={
                        i === localOptions.value.templateOptions.length - 1 &&
                        localOptions.value.templateOptions[i].value === '' &&
                        localOptions.value.templateOptions[i].label !== 'Textarea'
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
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [...localOptions.value.templateOptions],
                        }
                      }}
                    />
                  ) : field.type === 'select' ? (
                    <Flex className="justify-start items-center w-full my-1">
                      {editSelectOptionFieldId.value !== field.id &&
                      addSelectOptionFieldId.value !== field.id ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="mini"
                              variant="ghost"
                              disabled={field.isEnable === false}
                              className="rounded-sm font-semibold hover:bg-transparent ml-0 px-2 py-1 w-full border border-slate-300 hover:border-blue-500 dark:border-slate-800 dark:hover:border-blue-500 dark:bg-slate-900 dark:hover:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-500"
                            >
                              <Flex className="flex items-center justify-start w-full gap-1">
                                <Text className="!text-slate-700 dark:!text-slate-300 text-ellipsis overflow-hidden !block line-clamp-2">
                                  {isSelectEmpty
                                    ? t('Select is empty', { ns: 'common' })
                                    : !selectedOption
                                      ? t('Select default', { ns: 'common' })
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
                                <Text>
                                  {t('Select Default Option', { ns: 'dashboard' })}
                                </Text>
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
                                      {field.value === option && (
                                        <Flex className="ml-auto gap-2 pl-2 opacity-60 hover:opacity-100">
                                          <Edit
                                            size={13}
                                            className="cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
                                            onClick={() => {
                                              addSelectOptionFieldId.value = null
                                              editSelectOptionOriginalValue.value = option
                                              editSelectOptionFieldId.value =
                                                field.id ?? null
                                            }}
                                          />
                                          <Trash2
                                            size={13}
                                            className="cursor-pointer hover:text-red-500 dark:hover:text-red-400"
                                            onClick={e => {
                                              e.stopPropagation()

                                              const optionIndex: number =
                                                field.selectOptions?.indexOf(option) ?? -1

                                              field.selectOptions =
                                                field.selectOptions?.filter(
                                                  o => o !== option
                                                )

                                              if (optionIndex !== -1) {
                                                const prevOption =
                                                  field.selectOptions?.[optionIndex - 1]
                                                const nextOption =
                                                  field.selectOptions?.[optionIndex]

                                                field.value =
                                                  prevOption || nextOption || undefined
                                              }

                                              localOptions.value = {
                                                ...localOptions.value,
                                                templateOptions: [
                                                  ...localOptions.value.templateOptions,
                                                ],
                                              }
                                            }}
                                          />
                                        </Flex>
                                      )}
                                    </DropdownMenuCheckboxItem>
                                  )
                                })}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-center items-center justify-center py-0.5 text-xs"
                              onClick={() => {
                                if (isSelectEmpty) {
                                  field.selectOptions = []
                                }

                                editSelectOptionOriginalValue.value = null
                                editSelectOptionFieldId.value = null
                                addSelectOptionFieldId.value = field.id ?? null
                              }}
                            >
                              <Text
                                size="xs"
                                className="!text-blue-500 dark:!text-blue-400"
                              >
                                <Plus size={13} />

                                {isSelectEmpty
                                  ? t('Add First Option', { ns: 'common' })
                                  : t('Add Option', { ns: 'common' })}
                              </Text>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <>
                          <InputField
                            small
                            key={defaultValueResetKey.value}
                            placeholder={t('Enter select option', { ns: 'dashboard' })}
                            autoFocus={Boolean(
                              localOptions.value.templateOptions[i].label
                            )}
                            classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                            disabled={field.isEnable === false}
                            type="text"
                            className={`${
                              field.isEnable === false
                                ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                                : ''
                            }`}
                            onKeyDown={e => {
                              if (e.key === 'Escape') {
                                if (editSelectOptionOriginalValue.value) {
                                  field.value = editSelectOptionOriginalValue.value
                                }

                                editSelectOptionFieldId.value = null
                                editSelectOptionOriginalValue.value = null
                                addSelectOptionFieldId.value = null
                              } else if (e.key === 'Enter') {
                                if (
                                  editSelectOptionOriginalValue.value &&
                                  editSelectOptionFieldId.value === field.id
                                ) {
                                  field.selectOptions = field.selectOptions?.map(
                                    option =>
                                      option === editSelectOptionOriginalValue.value
                                        ? field.value || option
                                        : option
                                  )
                                } else if (
                                  addSelectOptionFieldId.value === field.id &&
                                  field.value
                                ) {
                                  !field.selectOptions?.includes(field.value) &&
                                    field.selectOptions?.push(field.value)
                                }

                                localOptions.value = {
                                  ...localOptions.value,
                                  templateOptions: [
                                    ...localOptions.value.templateOptions,
                                  ],
                                }
                                editSelectOptionOriginalValue.value = null
                                editSelectOptionFieldId.value = null
                                addSelectOptionFieldId.value = null
                              }
                            }}
                            onChange={e => {
                              field.value = e.target.value.trim()
                            }}
                            defaultValue={
                              addSelectOptionFieldId.value === field.id ? '' : field.value
                            }
                          />
                          <Button
                            size="mini"
                            variant="ghost"
                            className="ml-1 h-8 w-9 text-blue-500 dark:bg-slate-800"
                            onClick={() => {
                              if (
                                editSelectOptionOriginalValue.value &&
                                editSelectOptionFieldId.value === field.id
                              ) {
                                field.selectOptions = field.selectOptions?.map(option =>
                                  option === editSelectOptionOriginalValue.value
                                    ? field.value || option
                                    : option
                                )
                              } else if (
                                addSelectOptionFieldId.value === field.id &&
                                field.value
                              ) {
                                !field.selectOptions?.includes(field.value) &&
                                  field.selectOptions?.push(field.value)
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                templateOptions: [...localOptions.value.templateOptions],
                              }
                              editSelectOptionOriginalValue.value = null
                              editSelectOptionFieldId.value = null
                              addSelectOptionFieldId.value = null
                            }}
                            title={
                              addSelectOptionFieldId.value === field.id
                                ? t('Add Option', { ns: 'common' })
                                : t('Done Edit', { ns: 'common' })
                            }
                          >
                            {addSelectOptionFieldId.value === field.id ? (
                              <Plus size={18} />
                            ) : (
                              editSelectOptionFieldId.value === field.id && (
                                <Check size={18} />
                              )
                            )}
                          </Button>
                          <Button
                            size="mini"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 dark:bg-transparent"
                            onClick={() => {
                              if (editSelectOptionOriginalValue.value) {
                                field.value = editSelectOptionOriginalValue.value
                              }

                              editSelectOptionFieldId.value = null
                              editSelectOptionOriginalValue.value = null
                              addSelectOptionFieldId.value = null
                            }}
                            title={t('Cancel', { ns: 'common' })}
                          >
                            <X size={15} />
                          </Button>
                        </>
                      )}
                    </Flex>
                  ) : field.label?.toLocaleLowerCase() !== 'clipboard' ? (
                    <InputField
                      small
                      key={defaultValueResetKey.value}
                      placeholder={t('Enter default value', { ns: 'dashboard' })}
                      autoFocus={localOptions.value.templateOptions[i].label !== 'Text'}
                      classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 dark:bg-slate-900"
                      disabled={field.isEnable === false}
                      type={field.type === 'number' ? 'number' : 'text'}
                      className={`${
                        field.isEnable === false
                          ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                          : ''
                      } w-full`}
                      onChange={e => {
                        field.value = e.target.value.trim()
                      }}
                      defaultValue={field.value}
                    />
                  ) : (
                    <>
                      <InputField
                        small
                        value={
                          field.isValueMasked
                            ? maskValueFirstLast(
                                t('This field allows to insert text from clipboard', {
                                  ns: 'dashboard',
                                })
                              )
                            : t('This field allows to insert text from clipboard', {
                                ns: 'dashboard',
                              })
                        }
                        title={t('This field allows to insert text from clipboard', {
                          ns: 'dashboard',
                        })}
                        autoFocus={false}
                        classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 nowrap overflow-hidden text-ellipsis dark:!text-slate-300 opacity-100 dark:bg-transparent"
                        disabled={true}
                        type={'text'}
                        className={`${
                          field.isEnable === false
                            ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                            : ''
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
                                ...localOptions.value.templateOptions?.map((f, index) => {
                                  if (index === i) {
                                    return {
                                      ...f,
                                      isValueMasked: !f.isValueMasked,
                                    }
                                  }
                                  return f
                                }),
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
                {field.type !== 'section' && (
                  <Button
                    size="mini"
                    title={t('Enable / Disable', { ns: 'common' })}
                    variant="ghost"
                    className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                    onClick={() => {
                      editFieldId.value = null
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
                    }}
                  >
                    {localOptions.value.templateOptions &&
                    localOptions.value.templateOptions[i]?.isEnable ? (
                      <CheckSquare2 size={14} />
                    ) : (
                      <Square size={14} />
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="mini"
                      title={t('Field Options', { ns: 'dashboard' })}
                      variant="ghost"
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [
                            ...arrayMove(
                              localOptions.value.templateOptions || [],
                              i,
                              i - 1
                            ),
                          ],
                        }
                      }}
                      className="text-sm font-semibold rounded-none hover:bg-transparent w-5 dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={i === 0}
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [
                            ...arrayMove(
                              localOptions.value.templateOptions || [],
                              i,
                              i - 1
                            ),
                          ],
                        }
                      }}
                      className="text-[13px] py-1"
                    >
                      <Text size="xs">{t('Move Up', { ns: 'common' })}</Text>
                      <div className="ml-auto">
                        <MoveUp size={13} />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={
                        localOptions.value.templateOptions
                          ? i === localOptions.value.templateOptions.length - 1
                          : false
                      }
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [
                            ...arrayMove(
                              localOptions.value.templateOptions || [],
                              i,
                              i + 1
                            ),
                          ],
                        }
                      }}
                      className="text-[13px] py-1"
                    >
                      <Text size="xs">{t('Move Down', { ns: 'common' })}</Text>
                      <div className="ml-auto">
                        <MoveDown size={13} />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {field.label?.toLocaleLowerCase() !== 'clipboard' && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (isEdit) {
                            editFieldId.value = null
                          } else {
                            editFieldId.value = field.id ?? null
                          }
                        }}
                      >
                        {isEdit ? (
                          <Text size="xs">{t('Done Edit', { ns: 'common' })}</Text>
                        ) : (
                          <Text size="xs">{t('Edit Label', { ns: 'common' })}</Text>
                        )}
                        <div className="ml-auto">
                          <SquarePen size={13} />
                        </div>
                      </DropdownMenuItem>
                    )}
                    {field.isLabelOnTop ? (
                      <DropdownMenuItem
                        onClick={() => {
                          editFieldId.value = null
                          localOptions.value = {
                            ...localOptions.value,
                            templateOptions: [
                              ...localOptions.value.templateOptions?.map((f, index) => {
                                if (index === i) {
                                  return {
                                    ...f,
                                    isLabelOnTop: false,
                                  }
                                }
                                return f
                              }),
                            ],
                          }
                        }}
                      >
                        <Text size="xs">{t('Label Left', { ns: 'dashboard' })}</Text>
                        <div className="ml-auto">
                          <AlignEndVertical size={13} />
                        </div>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          editFieldId.value = null
                          localOptions.value = {
                            ...localOptions.value,
                            templateOptions: [
                              ...localOptions.value.templateOptions?.map((f, index) => {
                                if (index === i) {
                                  return {
                                    ...f,
                                    isLabelOnTop: true,
                                  }
                                }
                                return f
                              }),
                            ],
                          }
                        }}
                      >
                        <Text size="xs">{t('Label Top', { ns: 'dashboard' })}</Text>
                        <div className="ml-auto">
                          <AlignVerticalJustifyEnd size={13} />
                        </div>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 dark:!text-red-600 text-[13px] focus:text-red-500 py-1"
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          templateOptions: [
                            ...localOptions.value.templateOptions?.filter((_, index) => {
                              return index !== i
                            }),
                          ],
                        }
                        checkForTemplateFieldsCallback()
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
      {showGlobalConflictWarning.value && conflictingGlobalLabel.value && (
        <Text className="!text-orange-800 dark:!text-orange-400 text-[13px] my-2 bg-orange-50 dark:bg-orange-900/70 p-2 relative">
          <AlertTriangle size={13} className="mr-1 inline-block" />
          {t('localTemplateConflictWarning', {
            ns: 'templates',
            label: conflictingGlobalLabel.value,
          })}
          <X
            className="absolute top-0 right-0 m-2 bg-orange-50 dark:bg-orange-900/70 z-10 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-800"
            size={14}
            onClick={() => {
              showGlobalConflictWarning.value = false
              conflictingGlobalLabel.value = null
            }}
          />
        </Text>
      )}
      {templateMissingFields.value.length > 0 && (
        <Flex className="rounded-md gap-2 my-3 items-start justify-start flex-wrap !text-amber-800 dark:!text-amber-400 text-[13px] bg-yellow-50 dark:bg-amber-950 p-2">
          <Text className="!text-amber-700 dark:!text-amber-500 text-[13px] w-full">
            <AlertTriangle size={13} className="mr-1" />
            {t('Found in template but missing from fields definition', { ns: 'common' })}:
          </Text>
          {templateMissingFields?.value.map((field, i) => {
            return (
              <Box
                className="cursor-pointer"
                key={i}
                onClick={() => {
                  if (!localOptions.value.templateOptions) {
                    localOptions.value.templateOptions = []
                  }

                  showAllLabelsMustBeUniqueMessage.value = false

                  const newFields = [...localOptions.value.templateOptions]

                  const isLabelUnique = localOptions.value.templateOptions?.every(f => {
                    return f.label !== field
                  })

                  if (!isLabelUnique) {
                    showAllLabelsMustBeUniqueMessage.value = true
                  }

                  const newLabel = isLabelUnique
                    ? field
                    : `${field} ${localOptions.value.templateOptions.length + 1}`

                  newFields.push({
                    id: Date.now().toString(),
                    label: newLabel,
                    type: 'text',
                    isEnable: true,
                    value: '',
                  })

                  localOptions.value = {
                    ...localOptions.value,
                    templateOptions: newFields,
                  }

                  checkForTemplateFieldsCallback()
                }}
              >
                <Badge
                  variant="outline"
                  className="bg-red-50 dark:bg-red-950/80 hover:bg-blue-50 dark:hover:bg-blue-950/80 border-red-100 dark:border-red-900 hover:border-blue-100 dark:hover:border-blue-800 group text-normal pr-2.5"
                >
                  <ToolTip
                    text={t('Add to template fields', { ns: 'common' })}
                    sideOffset={5}
                    isCompact
                    side="bottom"
                  >
                    <Flex className="group !text-red-500 dark:!text-red-400 hover:!text-blue-500 dark:hover:!text-blue-400 font-semibold mr-0.5">
                      <ArrowUpToLine
                        size={12}
                        className="mr-0.5 group-hover:block hidden"
                      />
                      <Plus size={12} className="mr-0.5 group-hover:hidden" />
                      {field}
                    </Flex>
                  </ToolTip>
                  <ToolTip
                    text={t('Remove from template', { ns: 'common' })}
                    sideOffset={10}
                    key={i}
                    isCompact
                    side="bottom"
                  >
                    <X
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        textAreaRef.current?.handleRemoveTemplateField(field)
                      }}
                      size={12}
                      className="ml-0.5 mr-0 hover:!text-red-600 dark:hover:!text-red-500 group-hover:text-blue-300 dark:group-hover:text-blue-400 text-red-300 dark:text-red-400 cursor-pointer"
                    />
                  </ToolTip>
                </Badge>
              </Box>
            )
          })}
        </Flex>
      )}
      <>
        {localOptions.value.templateOptions.length > 0 && (
          <Flex className="gap-2 my-3 items-start justify-start flex-wrap">
            {localOptions.value.templateOptions.map((field, i) => {
              if (!field.label || !field.label.length) {
                return null
              }
              return field.label &&
                templateFoundFields?.value.includes(field.label?.toLocaleLowerCase()) ? (
                <ToolTip
                  key={i}
                  text={
                    field.isEnable ? (
                      field.label === 'Clipboard' ? (
                        <Trans
                          i18nKey="Field <b>{{Clipboard}}</b> has been found in the template. This allows you to copy text to the clipboard, and it will be inserted into the template"
                          ns="common"
                        />
                      ) : (
                        <Trans
                          i18nKey="Field <b>&#123;&#123;<b>{{name}}</b>&#125;&#125;</b> has been found in the template"
                          ns="dashboard"
                          values={{ name: field.label }}
                        />
                      )
                    ) : (
                      <Trans
                        i18nKey="Disabled field <b>&#123;&#123;<b>{{name}}</b>&#125;&#125;</b> has been found in the template"
                        ns="dashboard"
                        values={{ name: field.label }}
                      />
                    )
                  }
                  isCompact
                  side="bottom"
                >
                  <Text
                    className={`${
                      field.isEnable
                        ? '!text-green-600 dark:!text-green-400'
                        : '!text-gray-400 dark:!text-gray-500'
                    } !font-normal group`}
                    size="xs"
                  >
                    <Badge
                      variant="outline"
                      className={`${
                        field.isEnable
                          ? 'bg-green-100 dark:bg-green-900 hover:bg-green-100/70 dark:hover:bg-green-900 border-green-200 dark:border-green-800'
                          : 'bg-gray-100 dark:bg-gray-800/70 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 border-gray-200 dark:border-gray-700'
                      } text-normal pr-2.5 group-hover:pr-1.5`}
                    >
                      <Check size={12} className="mr-0.5" />
                      {field.label}
                      <ToolTip
                        text={t('Remove from template', { ns: 'common' })}
                        sideOffset={10}
                        isCompact
                        side="bottom"
                      >
                        <X
                          onClick={() => {
                            textAreaRef.current?.handleRemoveTemplateField(field.label)
                          }}
                          size={12}
                          className={`${
                            field.isEnable
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-500'
                          } ml-1 hover:!text-red-600 dark:hover:!text-red-300 group-hover:block animate-in fade-in hidden cursor-pointer`}
                        />
                      </ToolTip>
                    </Badge>
                  </Text>
                </ToolTip>
              ) : (
                <ToolTip
                  key={i}
                  text={
                    field.isEnable ? (
                      field.label === 'Clipboard' ? (
                        <Trans
                          i18nKey="Add <b>{{Clipboard}}</b> field to template. This allows you to copy text to the clipboard, and it will be inserted into the template"
                          ns="common"
                        />
                      ) : (
                        <Trans
                          i18nKey="Add field <b>&#123;&#123;<b>{{name}}</b>&#125;&#125;</b> into the template"
                          ns="dashboard"
                          values={{ name: field.label }}
                        />
                      )
                    ) : (
                      <Trans
                        i18nKey="Disabled field <b>&#123;&#123;<b>{{name}}</b>&#125;&#125;</b>"
                        ns="dashboard"
                        values={{ name: field.label }}
                      />
                    )
                  }
                  isCompact
                  side="bottom"
                >
                  <Text
                    className={`${
                      field.isEnable
                        ? '!text-slate-500 dark:!text-slate-600 hover:!text-blue-500 dark:hover:!text-blue-700 cursor-pointer'
                        : '!text-gray-300 dark:!text-gray-600 '
                    } group !font-normal`}
                    size="xs"
                    onClick={() => {
                      if (field.isEnable) {
                        textAreaRef?.current?.handleAddText(`{{${field.label}}}`)
                      }
                    }}
                  >
                    <Badge
                      variant="outline"
                      className={`${
                        field.isEnable
                          ? 'bg-white dark:bg-slate-300/90 hover:bg-blue-50 dark:hover:bg-blue-300 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700'
                      } text-normal pr-2.5`}
                    >
                      {field.isEnable ? (
                        <>
                          <ArrowDownToLine
                            size={12}
                            className="mr-0.5 group-hover:block hidden"
                          />
                          <Plus size={12} className="mr-0.5 group-hover:hidden" />
                        </>
                      ) : (
                        <Square
                          size={12}
                          className="mr-0.5 hover:text-blue-500 cursor-pointer"
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()

                            localOptions.value = {
                              ...localOptions.value,
                              templateOptions: [
                                ...localOptions.value.templateOptions?.map((f, index) => {
                                  if (index === i) {
                                    return {
                                      ...f,
                                      isEnable: true,
                                    }
                                  }
                                  return f
                                }),
                              ],
                            }
                          }}
                        />
                      )}
                      {field.label}
                    </Badge>
                  </Text>
                </ToolTip>
              )
            })}
            {localOptions.value.templateOptions.length > 1 &&
              templateFoundFields.value.length > 0 && (
                <ToolTip
                  text={t('Remove all fields from template', { ns: 'common' })}
                  isCompact
                  side="bottom"
                >
                  <Text
                    className="!text-slate-300 dark:!text-slate-500 hover:!text-red-500 dark:hover:!text-red-500 cursor-pointer !font-normal group"
                    size="xs"
                    onClick={() => {
                      textAreaRef?.current?.handleRemoveAllTemplateFields()
                    }}
                  >
                    <Badge
                      variant="outline"
                      className="dark:bg-slate-300/90 dark:hover:bg-red-100 dark:border-slate-700 dark:hover:border-blue-800 bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 text-normal px-2.5 py-[3px]"
                    >
                      <Trash2 size={13} />
                    </Badge>
                  </Text>
                </ToolTip>
              )}
          </Flex>
        )}
        <TextArea
          ref={textAreaRef}
          tabIndex={0}
          enableEmoji={false}
          className="bg-white rounded-md text-sm w-full mr-1"
          placeholder={`${t('Enter template or drag from history', {
            ns: 'dashboard',
          })}. ${t(
            'Use double curly brackets for {{field name}}. Use {{clipboard}} to add current clipboard value.',
            { ns: 'dashboard' }
          )}`}
          rows={2}
          autoCorrect="off"
          spellCheck={false}
          enableEmojiInside={true}
          label=""
          maxRows={isLargeView ? 12 : 6}
          value={clipValue.value}
          onKeyDown={e => {
            e.stopPropagation()
          }}
          onChange={e => {
            clipValue.value = e.target.value
          }}
        />
      </>
    </Box>
  )
}
