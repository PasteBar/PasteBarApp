import { useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { Signal } from '@preact/signals-react'
import linkifyIt from 'linkify-it'
import {
  AlertCircle,
  AlertTriangle,
  AlignEndVertical,
  AlignVerticalJustifyEnd,
  Check,
  CheckSquare2,
  ChevronDown,
  CircleOff,
  MoreVertical,
  MoveDown,
  MoveUp,
  Plus,
  PointerOff,
  Square,
  SquarePen,
  Trash,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ToolTip from '~/components/atoms/tooltip'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import InputCreditCardField from '~/components/molecules/input-credit-card'
import TextArea from '~/components/molecules/textarea'
import {
  Badge,
  Box,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Text,
} from '~/components/ui'

import { useDebounce } from '~/hooks/use-debounce'
import { useSignal } from '~/hooks/use-signal'

import { ClipFormKeyPress, ClipFormTemplateOptions } from './ClipCard'

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

export function ClipEditForm({
  showLinkValidationError,
  localOptions,
}: {
  isLargeView: boolean | undefined
  showLinkValidationError: Signal<boolean | undefined>
  localOptions: Signal<ClipFormTemplateOptions>
}) {
  const { t } = useTranslation()
  const urlInput = useSignal<string | undefined>(undefined)
  const editFieldId = useSignal<string | null>(null)
  const debouncedUrlInput = useDebounce(urlInput.value, 300)

  useEffect(() => {
    if (!debouncedUrlInput) {
      return
    }
    if (showLinkValidationError.value) {
      showLinkValidationError.value = undefined
    }
    if (debouncedUrlInput.length > 5) {
      const linkify = linkifyIt()
      const matches = linkify.match(debouncedUrlInput)
      if (!matches || matches.length > 1) {
        showLinkValidationError.value = true
      } else {
        showLinkValidationError.value = false
      }
    }

    if (!localOptions.value.formOptions) {
      localOptions.value.formOptions = {
        fields: [],
        openUrl: null,
      }
    }

    localOptions.value = {
      ...localOptions.value,
      formOptions: {
        ...localOptions.value.formOptions,
        openUrl: debouncedUrlInput,
      },
    }
  }, [debouncedUrlInput])

  return (
    <Box className="select-none mt-1">
      {localOptions.value.formOptions.openUrl != null && (
        <Flex className="text-normal">
          <ToolTip
            asChild
            text={t('Website URL', { ns: 'dashboard' })}
            isCompact
            side="bottom"
          >
            <Button
              variant="outline"
              size="mini"
              className={`px-2 h-10 pointer-events-none text-slate-500 dark:text-slate-200 border font-semibold text-xs bg-slate-100 dark:bg-slate-700/80 group hover:text-blue-500 mr-1 flex items-center ${
                localOptions.value.formOptions?.isOpenUrlDisabled === true
                  ? 'opacity-70 line-through'
                  : ''
              }`}
            >
              <span>{t('Open', { ns: 'dashboard' })}</span>
            </Button>
          </ToolTip>

          <InputField
            defaultValue={localOptions.value.formOptions?.openUrl ?? ''}
            placeholder={t('Enter URL', { ns: 'dashboard' })}
            disabled={localOptions.value.formOptions?.isOpenUrlDisabled}
            classNameInput={`pr-7 text-sm focus:border- ${
              showLinkValidationError.value
                ? '!border-yellow-600 !focus:border-yellow-600'
                : ''
            } ${
              showLinkValidationError.value === false
                ? '!border-green-600 !focus:border-green-600'
                : ''
            } ${
              localOptions.value.formOptions?.isOpenUrlDisabled === true
                ? '!bg-gray-100 dark:!bg-gray-700 opacity-70'
                : ''
            }`}
            suffix={
              <Box className="absolute top-3 right-2">
                {showLinkValidationError.value ? (
                  <ToolTip
                    text={t('Website URL might not be valid', { ns: 'dashboard' })}
                    isCompact
                    side="bottom"
                    className="bg-yellow-50 text-yellow-600 font-semibold"
                    asChild
                    sideOffset={10}
                  >
                    <AlertTriangle size={18} className="text-yellow-500 cursor-pointer" />
                  </ToolTip>
                ) : (
                  showLinkValidationError.value === false && (
                    <ToolTip
                      text={t('Website URL is valid', { ns: 'dashboard' })}
                      isCompact
                      side="bottom"
                      className="bg-green-50 text-green-600 font-semibold"
                      asChild
                      sideOffset={10}
                    >
                      <Check size={18} className="text-green-600 cursor-pointer" />
                    </ToolTip>
                  )
                )}
              </Box>
            }
            onChange={e => {
              urlInput.value = e.target.value
            }}
          />
          <Button
            variant="ghost"
            size="mini"
            title={t('Open URL Disable / Enable', { ns: 'dashboard' })}
            onClick={() => {
              localOptions.value = {
                ...localOptions.value,
                formOptions: {
                  ...localOptions.value.formOptions,
                  isOpenUrlDisabled: !localOptions.value.formOptions?.isOpenUrlDisabled,
                },
              }
            }}
            className={`${
              localOptions.value.formOptions?.isOpenUrlDisabled ? 'opacity-70' : ''
            } pl-2 h-8 flex items-center hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500`}
          >
            {!localOptions.value.formOptions?.isOpenUrlDisabled ? (
              <CheckSquare2 size={14} />
            ) : (
              <Square size={14} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="mini"
            title={t('Remove Open URL', { ns: 'dashboard' })}
            onClick={() => {
              localOptions.value = {
                ...localOptions.value,
                formOptions: {
                  ...localOptions.value.formOptions,
                  openUrl: null,
                  isOpenUrlDisabled: false,
                },
              }
            }}
            className="pl-3 h-10 text-sm font-semibold hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
          >
            <Trash size={14} />
          </Button>
        </Flex>
      )}
      <Box className="my-2">
        <Flex className="gap-3 w-full justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Text className="!text-blue-500 hover:underline cursor-pointer" size="xs">
                {t('Add Form Field', { ns: 'dashboard' })}
                <ChevronDown size={12} className="ml-1" />
              </Text>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={12} align="center">
              <DropdownMenuItem
                className="text-xs"
                onClick={() => {
                  editFieldId.value = null
                  if (!localOptions.value.formOptions) {
                    localOptions.value.formOptions = {
                      fields: [],
                    }
                  }

                  const newFields = [...localOptions.value.formOptions.fields]

                  newFields.push({
                    id: Date.now().toString(),
                    type: 'section',
                    pressKeysAfterPaste: ClipFormKeyPress[0],
                    isEnable: true,
                    value: '',
                  })

                  localOptions.value = {
                    ...localOptions.value,
                    formOptions: {
                      ...localOptions.value.formOptions,
                      fields: newFields,
                    },
                  }
                }}
              >
                <Plus size={12} className="mr-1" />
                {t('Add Section', { ns: 'dashboard' })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5 text-xs"
                disabled={true}
              >
                <Text>{t('Form Fields', { ns: 'dashboard' })}</Text>
              </DropdownMenuItem>
              <SimpleBar
                className="code-filter"
                style={{ height: 'auto', maxHeight: '290px' }}
                autoHide={false}
              >
                {ClipFormTypes.map(label => {
                  return (
                    <DropdownMenuItem
                      key={label}
                      className="text-xs"
                      onClick={() => {
                        if (!localOptions.value.formOptions) {
                          localOptions.value.formOptions = {
                            fields: [],
                          }
                        }

                        const newFields = [...localOptions.value.formOptions.fields]

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
                        newFields.push({
                          id: Date.now().toString(),
                          label: label,
                          type: newType,
                          pressKeysAfterPaste: ClipFormKeyPress[0],
                          isEnable: true,
                          value: '',
                        })

                        localOptions.value = {
                          ...localOptions.value,
                          formOptions: {
                            ...localOptions.value.formOptions,
                            fields: newFields,
                          },
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
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Text className="!text-blue-500 hover:underline cursor-pointer" size="xs">
                {t('Key Press', { ns: 'dashboard' })}
                <ChevronDown size={12} className="ml-1" />
              </Text>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={12} align="center">
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5 text-xs"
                disabled={true}
              >
                <Text>{t('Add Key Press', { ns: 'dashboard' })}</Text>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ClipFormKeyPress.map(type => {
                return (
                  <DropdownMenuItem
                    key={type}
                    className="text-xs"
                    onClick={() => {
                      if (!localOptions.value.formOptions) {
                        localOptions.value.formOptions = {
                          fields: [],
                        }
                      }

                      const newFields = [...localOptions.value.formOptions.fields]
                      newFields.push({
                        id: Date.now().toString(),
                        isPressKeysOnly: true,
                        isEnable: true,
                        pressKeysAfterPaste: type,
                      })

                      localOptions.value = {
                        ...localOptions.value,
                        formOptions: {
                          ...localOptions.value.formOptions,
                          fields: newFields,
                        },
                      }
                    }}
                  >
                    {ClipFormKeyPressDisplayValueMap[type]}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Text className="!text-blue-500  hover:underline cursor-pointer" size="xs">
                {t('Delay', { ns: 'dashboard' })}
                <ChevronDown size={12} className="ml-1" />
              </Text>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={12} align="center">
              <DropdownMenuItem
                className="text-center items-center justify-center py-0.5 text-xs"
                disabled={true}
              >
                <Text>{t('Add Delay Time', { ns: 'dashboard' })}</Text>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ClipFormDelayTime.map(delay => {
                return (
                  <DropdownMenuItem
                    key={delay}
                    className="text-xs"
                    onClick={() => {
                      editFieldId.value = null
                      if (!localOptions.value.formOptions) {
                        localOptions.value.formOptions = {
                          fields: [],
                        }
                      }

                      const newFields = [...localOptions.value.formOptions.fields]
                      newFields.push({
                        id: Date.now().toString(),
                        isDelayOnly: true,
                        value: delay,
                        isEnable: true,
                      })

                      localOptions.value = {
                        ...localOptions.value,
                        formOptions: {
                          ...localOptions.value.formOptions,
                          fields: newFields,
                        },
                      }
                    }}
                  >
                    {delay === '1s' && `1 ${t('Second', { ns: 'common' })}`}
                    {delay === '2s' && `2 ${t('Seconds', { ns: 'common' })}`}
                    {delay === '3s' && `3 ${t('Seconds', { ns: 'common' })}`}
                    {delay === '4s' && `4 ${t('Seconds', { ns: 'common' })}`}
                    {delay === '5s' && `5 ${t('Seconds', { ns: 'common' })}`}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {localOptions.value.formOptions.openUrl == null && (
            <Text
              className="!text-blue-500 hover:underline cursor-pointer text-center"
              size="xs"
              onClick={() => {
                if (!localOptions.value.formOptions) {
                  localOptions.value.formOptions = {
                    fields: [],
                  }
                }

                localOptions.value = {
                  ...localOptions.value,
                  formOptions: {
                    ...localOptions.value.formOptions,
                    openUrl: '',
                    isOpenUrlDisabled: false,
                  },
                }
              }}
            >
              {t('Add Open URL', { ns: 'dashboard' })}
            </Text>
          )}
        </Flex>
      </Box>

      {localOptions.value.formOptions?.fields.map((field, i) => {
        const isLabelOnTop = field.isLabelOnTop
        const isLabelHidden = field.isLabelHidden
        const isSection = field.type === 'section'
        const isEdit = field.id === editFieldId.value
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
                {(field.label || isEdit) && field.type !== 'section' ? (
                  <Text
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
                              localOptions.value = {
                                ...localOptions.value,
                                formOptions: {
                                  ...localOptions.value.formOptions,
                                },
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
                            localOptions.value = {
                              ...localOptions.value,
                              formOptions: {
                                ...localOptions.value.formOptions,
                              },
                            }
                          }}
                          title={t('Done Edit', { ns: 'common' })}
                        >
                          <Check size={18} />
                        </Button>
                      </Flex>
                    )}
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
                <Flex className="w-full gap-1">
                  {field.isDelayOnly || field.isPressKeysOnly ? (
                    <Flex
                      className={`${
                        field.isEnable === false
                          ? 'bg-gray-100 opacity-50 dark:bg-gray-900'
                          : ''
                      } w-full justify-end mr-1 py-1`}
                    >
                      {field.isDelayOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Badge
                              variant="secondary"
                              className="pl-2 py-0.5 text-blue-500 dark:bg-slate-800 whitespace-nowrap"
                            >
                              {t('Delay', { ns: 'dashboard' })} {field.value}
                              <ChevronDown size={13} className="ml-0.5 mr-0" />
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent sideOffset={12} align="center">
                            <DropdownMenuItem
                              className="text-center items-center justify-center py-0.5 text-xs"
                              disabled={true}
                            >
                              {t('Delay', { ns: 'dashboard' })}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ClipFormDelayTime.map(delay => {
                              return (
                                <DropdownMenuItem
                                  key={delay}
                                  className="text-xs"
                                  onClick={() => {
                                    editFieldId.value = null
                                    field.value = delay

                                    localOptions.value = {
                                      ...localOptions.value,
                                    }
                                  }}
                                >
                                  {delay === '1s' && '1 Second'}
                                  {delay === '2s' && '2 Seconds'}
                                  {delay === '3s' && '3 Seconds'}
                                  {delay === '4s' && '4 Seconds'}
                                  {delay === '5s' && '5 Seconds'}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {field.isPressKeysOnly && field.pressKeysAfterPaste && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="mini"
                              variant="ghost"
                              disabled={field.isEnable === false}
                              title={t('Key Press After', { ns: 'dashboard' })}
                              className="text-sm font-semibold hover:bg-transparent mr-1"
                            >
                              <Badge
                                variant="secondary"
                                className="pl-2 py-0.5 text-blue-500 dark:bg-slate-800 whitespace-nowrap"
                              >
                                {t('Press', { ns: 'dashboard' })}{' '}
                                {
                                  ClipFormKeyPressDisplayValueMap[
                                    field.pressKeysAfterPaste
                                  ]
                                }
                                <ChevronDown size={13} className="ml-0.5 mr-0" />
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent sideOffset={12} align="center">
                            <DropdownMenuItem
                              className="text-center items-center justify-center py-0.5 text-xs"
                              disabled={true}
                            >
                              <Text>{t('Key Press', { ns: 'dashboard' })}</Text>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ClipFormAfterInputKeyPress.map(type => {
                              return (
                                <DropdownMenuItem
                                  key={type}
                                  className="text-xs"
                                  onClick={() => {
                                    field.pressKeysAfterPaste = type

                                    localOptions.value = {
                                      ...localOptions.value,
                                      formOptions: {
                                        ...localOptions.value.formOptions,
                                      },
                                    }
                                  }}
                                >
                                  {ClipFormKeyPressDisplayValueMap[type]}
                                </DropdownMenuItem>
                              )
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs text-red-400"
                              onClick={() => {
                                localOptions.value.formOptions.fields =
                                  localOptions.value.formOptions.fields.filter(
                                    f => f.id !== field.id
                                  )

                                localOptions.value = {
                                  ...localOptions.value,
                                }
                              }}
                            >
                              <Text
                                size="xs"
                                className="!text-red-500 dark:!text-red-600"
                              >
                                {t('Remove', { ns: 'common' })}
                              </Text>
                              <div className="ml-auto">
                                <PointerOff
                                  className="ml-auto text-red-400 dark:text-red-600"
                                  size={13}
                                />
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </Flex>
                  ) : field.type === 'password' || field.type === 'passwordCode' ? (
                    <InputField
                      small
                      placeholder={
                        field.type === 'passwordCode'
                          ? t('Enter code', { ns: 'dashboard' })
                          : t('Enter secret value', { ns: 'dashboard' })
                      }
                      autoFocus={
                        i === localOptions.value.formOptions.fields?.length - 1 &&
                        localOptions.value.formOptions.fields[i].value === ''
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
                      autoFocus={
                        i === localOptions.value.formOptions.fields?.length - 1 &&
                        localOptions.value.formOptions.fields[i].value === ''
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
                  ) : isSection ? (
                    <InputField
                      small
                      placeholder={t('Enter section label', { ns: 'dashboard' })}
                      classNameInput="text-sm font-semibold border-b border-0 border-transparent hover:border-gray-200 focus:border-blue-400 rounded-none nowrap overflow-hidden text-ellipsis pl-1.5 dark:!text-slate-300 dark:bg-slate-900"
                      autoFocus={
                        i === localOptions.value.formOptions.fields?.length - 1 &&
                        localOptions.value.formOptions.fields[i].value === ''
                      }
                      onChange={e => {
                        field.value = e.target.value.trim()
                      }}
                      defaultValue={field.value}
                    />
                  ) : field.type === 'textarea' ? (
                    <TextArea
                      placeholder={t('Enter field value', { ns: 'dashboard' })}
                      label=""
                      className="text-sm font-semibold border-0 border-transparent focus:border-blue-400 rounded-none nowrap overflow-hidden text-ellipsis !pl-0.5 w-full"
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
                      enableEmojiInside
                      onKeyDown={e => {
                        e.stopPropagation()
                      }}
                      onChange={e => {
                        field.value = e.target.value
                        localOptions.value = {
                          ...localOptions.value,
                          formOptions: {
                            ...localOptions.value.formOptions,
                          },
                        }
                      }}
                    />
                  ) : (
                    <InputField
                      small
                      placeholder={t('Enter field value', { ns: 'dashboard' })}
                      autoFocus={
                        i === localOptions.value.formOptions.fields?.length - 1 &&
                        localOptions.value.formOptions.fields[i].value === '' &&
                        localOptions.value.formOptions.fields[i].label !== 'Custom'
                      }
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
                  )}
                  {field.isDelayOnly || field.isPressKeysOnly || isSection ? (
                    <></>
                  ) : (
                    <Flex>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="mini"
                            variant="ghost"
                            disabled={field.isEnable === false}
                            title={t('Key Press After', { ns: 'dashboard' })}
                            className="text-sm font-semibold hover:bg-transparent mr-1"
                          >
                            {!field.pressKeysAfterPaste ? (
                              <Badge
                                variant="secondary"
                                className="pl-1 py-0.5 text-blue-500 dark:bg-slate-800 whitespace-nowrap hover:text-blue-500"
                              >
                                <Plus size={13} className="ml-0.5 mr-0" />

                                <ChevronDown size={13} className="ml-0.5 mr-0" />
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="pl-2 py-0.5 text-blue-500 dark:bg-slate-800 whitespace-nowrap hover:text-blue-500"
                              >
                                {
                                  ClipFormKeyPressDisplayValueMap[
                                    field.pressKeysAfterPaste
                                  ]
                                }
                                <ChevronDown size={13} className="ml-0.5 mr-0" />
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={12} align="center">
                          <DropdownMenuItem
                            className="text-center items-center justify-center py-0.5 text-xs"
                            disabled={true}
                          >
                            <Text>{t('Key Press After', { ns: 'dashboard' })}</Text>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {ClipFormAfterInputKeyPress.map(type => {
                            return (
                              <DropdownMenuItem
                                key={type}
                                className="text-xs"
                                onClick={() => {
                                  field.pressKeysAfterPaste = type

                                  localOptions.value = {
                                    ...localOptions.value,
                                    formOptions: {
                                      ...localOptions.value.formOptions,
                                    },
                                  }
                                }}
                              >
                                {ClipFormKeyPressDisplayValueMap[type]}
                              </DropdownMenuItem>
                            )
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs text-red-400"
                            onClick={() => {
                              field.pressKeysAfterPaste = null

                              localOptions.value = {
                                ...localOptions.value,
                                formOptions: {
                                  ...localOptions.value.formOptions,
                                },
                              }
                            }}
                          >
                            <Text size="xs" className="!text-red-500 dark:!text-red-600">
                              {t('Remove', { ns: 'common' })}
                            </Text>
                            <div className="ml-auto">
                              <PointerOff
                                className="ml-auto text-red-400 dark:text-red-600"
                                size={13}
                              />
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Flex>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="mini"
                      title={t('Field Options', { ns: 'dashboard' })}
                      variant="ghost"
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          formOptions: {
                            ...localOptions.value.formOptions,
                            fields: arrayMove(
                              localOptions.value.formOptions.fields || [],
                              i,
                              i - 1
                            ),
                          },
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
                          formOptions: {
                            ...localOptions.value.formOptions,
                            fields: arrayMove(
                              localOptions.value.formOptions.fields || [],
                              i,
                              i - 1
                            ),
                          },
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
                        localOptions.value.formOptions.fields
                          ? i === localOptions.value.formOptions.fields.length - 1
                          : false
                      }
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          formOptions: {
                            ...localOptions.value.formOptions,
                            fields: arrayMove(
                              localOptions.value.formOptions.fields || [],
                              i,
                              i + 1
                            ),
                          },
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
                    {!isSection && !isLabelHidden && (
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
                    {field.type !== 'section' && (
                      <>
                        {field.isLabelOnTop ? (
                          <DropdownMenuItem
                            onClick={() => {
                              editFieldId.value = null
                              localOptions.value = {
                                ...localOptions.value,
                                formOptions: {
                                  ...localOptions.value.formOptions,
                                  fields: localOptions.value.formOptions?.fields.map(
                                    (f, index) => {
                                      if (index === i) {
                                        return {
                                          ...f,
                                          isLabelHidden: false,
                                          isLabelOnTop: false,
                                        }
                                      }
                                      return f
                                    }
                                  ),
                                },
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
                                formOptions: {
                                  ...localOptions.value.formOptions,
                                  fields: localOptions.value.formOptions?.fields.map(
                                    (f, index) => {
                                      if (index === i) {
                                        return {
                                          ...f,
                                          isLabelHidden: false,
                                          isLabelOnTop: true,
                                        }
                                      }
                                      return f
                                    }
                                  ),
                                },
                              }
                            }}
                          >
                            <Text size="xs">{t('Label Top', { ns: 'dashboard' })}</Text>
                            <div className="ml-auto">
                              <AlignVerticalJustifyEnd size={13} />
                            </div>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    {isLabelHidden ? (
                      <DropdownMenuItem
                        onClick={() => {
                          editFieldId.value = null
                          localOptions.value = {
                            ...localOptions.value,
                            formOptions: {
                              ...localOptions.value.formOptions,
                              fields: localOptions.value.formOptions?.fields.map(
                                (f, index) => {
                                  if (index === i) {
                                    return {
                                      ...f,
                                      isLabelHidden: false,
                                    }
                                  }
                                  return f
                                }
                              ),
                            },
                          }
                        }}
                      >
                        {isSection ? (
                          <Text size="xs">{t('Label Offset', { ns: 'dashboard' })}</Text>
                        ) : (
                          <Text size="xs">{t('Show Label', { ns: 'dashboard' })}</Text>
                        )}

                        <div className="ml-auto">
                          <AlertCircle size={13} />
                        </div>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          localOptions.value = {
                            ...localOptions.value,
                            formOptions: {
                              ...localOptions.value.formOptions,
                              fields: localOptions.value.formOptions?.fields.map(
                                (f, index) => {
                                  if (index === i) {
                                    return {
                                      ...f,
                                      isLabelHidden: true,
                                    }
                                  }
                                  return f
                                }
                              ),
                            },
                          }
                        }}
                      >
                        {isSection ? (
                          <Text size="xs">{t('Label on Left', { ns: 'dashboard' })}</Text>
                        ) : (
                          <Text size="xs">{t('Hide Label', { ns: 'dashboard' })}</Text>
                        )}
                        <div className="ml-auto">
                          <CircleOff size={13} />
                        </div>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 dark:!text-red-600 text-[13px] focus:text-red-500 py-1"
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          formOptions: {
                            ...localOptions.value.formOptions,
                            fields: localOptions.value.formOptions?.fields?.filter(
                              (_, index) => {
                                return index !== i
                              }
                            ),
                          },
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
              </Flex>
            </Flex>
          </Flex>
        )
      })}
    </Box>
  )
}
