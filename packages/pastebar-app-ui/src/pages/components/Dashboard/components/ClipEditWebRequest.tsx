import { useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Signal } from '@preact/signals-react'
import linkifyIt from 'linkify-it'
import {
  AlertTriangle,
  Check,
  CheckSquare2,
  ChevronDown,
  MoreVertical,
  MoveDown,
  MoveUp,
  Square,
  Trash,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ToolTip from '~/components/atoms/tooltip'
import { CodeViewerMemo } from '~/components/code-viewer'
import InputField from '~/components/molecules/input'
import {
  Badge,
  Box,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '~/components/ui'

import { CONTENT_TYPE_LANGUAGE } from '~/store/constants'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { ClipWebRequestOptions } from './ClipCard'

export function ClipEditWebRequest({
  clipId,
  clipValue,
  showLinkValidationError,
  isLargeView,
  isDark,
  webrequestTestOutputObject,
  webrequestLocalOptions,
}: {
  clipId: UniqueIdentifier
  requestOptions: string | null | undefined
  isLargeView: boolean | undefined
  isDark: boolean
  clipValue: Signal<string | undefined>
  webrequestTestOutputObject: Signal<{
    body?: string | null
    status?: number | null
    filteredBody?: string | null
    hasFiltersError?: boolean | null
    contentType?: string | null
  }>
  webrequestLocalOptions: Signal<ClipWebRequestOptions>
  showLinkValidationError: Signal<boolean | undefined>
}) {
  const { t } = useTranslation()
  const showRemoveHeadersConfirmation = useSignal(false)
  const showRemoveAuthConfirmation = useSignal(false)
  const showRemoveFiltersConfirmation = useSignal(false)
  const showFullBodyIfFiltered = useSignal(false)
  const { updateItemById } = useUpdateItemById()

  const FILTERED_TYPES = {
    dotpathjson: t('FILTERED_TYPES:::Dot Path', { ns: 'dashboard' }), // https://github.com/importcjj/rust-ajson
    jsonpath: t('FILTERED_TYPES:::JSON Path', { ns: 'dashboard' }), // https://github.com/besok/jsonpath-rust
    regex: t('FILTERED_TYPES:::RegEx', { ns: 'dashboard' }), // https://rust-lang-nursery.github.io/rust-cookbook/text/regex.html
    regexreplace: t('FILTERED_TYPES:::RegEx Replace', { ns: 'dashboard' }),
    removequotes: t('FILTERED_TYPES:::Remove Quotes', { ns: 'dashboard' }),
  } as const

  const changeWebRequestMethod = async (method: string) => {
    const { headers, body, filters } = webrequestLocalOptions.value
    const newOptions = {
      headers,
      body,
      filters,
      method,
    }

    await updateItemById({
      updatedItem: {
        requestOptions: JSON.stringify({
          headers,
          body,
          method,
        }),
        itemId: clipId,
      },
    })

    webrequestLocalOptions.value = {
      ...newOptions,
    }
  }

  useEffect(() => {
    if (!webrequestLocalOptions.value.body) {
      showFullBodyIfFiltered.value = false
    }
  }, [webrequestTestOutputObject.value.body])

  return (
    <Box className="select-none mt-1">
      <Flex className="text-normal">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="mini"
              className="px-2 pr-1 h-10 text-slate-500 border font-semibold text-xs bg-slate-100 _text-sm group hover:text-blue-500 mr-1 flex items-center"
            >
              <span>{webrequestLocalOptions.value.method}</span>
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={12} align="center">
            <DropdownMenuItem
              onClick={() => {
                changeWebRequestMethod('GET')
              }}
            >
              <Text
                className={`${
                  webrequestLocalOptions.value.method === 'GET' && 'font-semibold'
                }`}
              >
                GET
              </Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              textValue="POST"
              onClick={() => {
                changeWebRequestMethod('POST')
              }}
            >
              <Text
                className={`${
                  webrequestLocalOptions.value.method === 'POST' && 'font-semibold'
                }`}
              >
                POST
              </Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                changeWebRequestMethod('PUT')
              }}
            >
              <Text
                className={`${
                  webrequestLocalOptions.value.method === 'PUT' && 'font-semibold'
                }`}
              >
                PUT
              </Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                changeWebRequestMethod('DELETE')
              }}
            >
              <Text
                className={`${
                  webrequestLocalOptions.value.method === 'DELETE' && 'font-semibold'
                }`}
              >
                DELETE
              </Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                changeWebRequestMethod('HEAD')
              }}
            >
              <Text
                className={`${
                  webrequestLocalOptions.value.method === 'HEAD' && '!font-semibold'
                }`}
              >
                HEAD
              </Text>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <InputField
          defaultValue={clipValue.value}
          placeholder="Enter request url..."
          classNameInput={`pr-7 text-sm focus:border- ${
            showLinkValidationError.value
              ? '!border-yellow-600 !focus:border-yellow-600'
              : ''
          } ${
            showLinkValidationError.value === false
              ? '!border-green-600 !focus:border-green-600'
              : ''
          }`}
          suffix={
            <Box className="absolute top-3 right-2">
              {showLinkValidationError.value ? (
                <ToolTip
                  text={t('Request url might not be valid', { ns: 'dashboard' })}
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
                    text={t('Request url is valid', { ns: 'dashboard' })}
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
            if (showLinkValidationError.value) {
              showLinkValidationError.value = undefined
            }
            if (e.target.value.length > 5) {
              const linkify = linkifyIt()
              const matches = linkify.match(e.target.value)
              if (!matches || matches.length > 1) {
                showLinkValidationError.value = true
              } else {
                showLinkValidationError.value = false
              }
            }
            clipValue.value = e.target.value
          }}
        />
      </Flex>
      <Box className="mt-2">
        <Flex className="gap-4 w-full justify-start">
          <Text
            className="!text-blue-500 hover:underline cursor-pointer"
            size="xs"
            onClick={() => {
              const newHeaders = [...webrequestLocalOptions.value.headers]
              newHeaders.unshift({
                id: Date.now().toString(),
                name: '',
                isEnable: true,
                value: '',
              })

              webrequestLocalOptions.value = {
                ...webrequestLocalOptions.value,
                headers: newHeaders,
              }
            }}
            title={t('Add Request Header', { ns: 'dashboard' })}
          >
            {t('Add Header', { ns: 'dashboard' })}
          </Text>
          <Flex>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Text className="!text-blue-500 hover:underline cursor-pointer" size="xs">
                  {t('Add Auth', { ns: 'dashboard' })}
                  <ChevronDown size={12} className="ml-1" />
                </Text>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={12} align="center">
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.auth) {
                      webrequestLocalOptions.value.auth = {}
                    }
                    webrequestLocalOptions.value.auth.type = 'Basic Password'
                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      auth: {
                        ...webrequestLocalOptions.value.auth,
                        type: 'Basic Password',
                        basicPassword: '',
                        basicUsername: '',
                        isEnable: true,
                      },
                    }
                  }}
                >
                  <Text
                    className={`${
                      webrequestLocalOptions.value.auth?.type === 'Basic Password' &&
                      'font-semibold'
                    }`}
                  >
                    {t('Basic Auth', { ns: 'dashboard' })}
                  </Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.auth) {
                      webrequestLocalOptions.value.auth = {}
                    }
                    webrequestLocalOptions.value.auth.type = 'Bearer Token'
                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      auth: {
                        ...webrequestLocalOptions.value.auth,
                        type: 'Bearer Token',
                        bearerToken: '',
                        isEnable: true,
                      },
                    }
                  }}
                >
                  <Text
                    className={`${
                      webrequestLocalOptions.value.auth?.type === 'Bearer Token' &&
                      'font-semibold'
                    }`}
                  >
                    {t('Bearer Token', { ns: 'dashboard' })}
                  </Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.auth) {
                      webrequestLocalOptions.value.auth = {}
                    }
                    webrequestLocalOptions.value.auth.type = 'API Key'
                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      auth: {
                        ...webrequestLocalOptions.value.auth,
                        type: 'API Key',
                        apiKey: '',
                        apiValue: '',
                        isEnable: true,
                      },
                    }
                  }}
                >
                  <Text
                    className={`${
                      webrequestLocalOptions.value.auth?.type === 'API Key' &&
                      'font-semibold'
                    }`}
                  >
                    {t('API Key', { ns: 'dashboard' })}
                  </Text>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>
          <Flex>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Text className="!text-blue-500 hover:underline cursor-pointer" size="xs">
                  {t('Add Response Filter', { ns: 'dashboard' })}
                  <ChevronDown size={12} className="ml-1" />
                </Text>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={12} align="center">
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.filters) {
                      webrequestLocalOptions.value.filters = []
                    }

                    const newFilters = [...webrequestLocalOptions.value.filters]
                    newFilters.push({
                      id: Date.now().toString(),
                      filterType: 'dotpathjson',
                      isEnable: true,
                      value: '',
                    })

                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      filters: newFilters,
                    }
                  }}
                >
                  <Text>{t('FILTERED_TYPES:::Dot Path', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.filters) {
                      webrequestLocalOptions.value.filters = []
                    }

                    const newFilters = [...webrequestLocalOptions.value.filters]
                    newFilters.push({
                      id: Date.now().toString(),
                      filterType: 'jsonpath',
                      isEnable: true,
                      value: '',
                    })

                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      filters: newFilters,
                    }
                  }}
                >
                  <Text>{t('FILTERED_TYPES:::JSON Path', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.filters) {
                      webrequestLocalOptions.value.filters = []
                    }

                    const newFilters = [...webrequestLocalOptions.value.filters]
                    newFilters.push({
                      id: Date.now().toString(),
                      filterType: 'regex',
                      isEnable: true,
                      value: '',
                    })

                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      filters: newFilters,
                    }
                  }}
                >
                  <Text>{t('FILTERED_TYPES:::RegEx', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.filters) {
                      webrequestLocalOptions.value.filters = []
                    }

                    const newFilters = [...webrequestLocalOptions.value.filters]
                    newFilters.push({
                      id: Date.now().toString(),
                      filterType: 'regexreplace',
                      isEnable: true,
                      replace: '',
                      value: '',
                    })

                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      filters: newFilters,
                    }
                  }}
                >
                  <Text>{t('FILTERED_TYPES:::RegEx Replace', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!webrequestLocalOptions.value.filters) {
                      webrequestLocalOptions.value.filters = []
                    }

                    const newFilters = [...webrequestLocalOptions.value.filters]
                    newFilters.push({
                      id: Date.now().toString(),
                      filterType: 'removequotes',
                      isEnable: true,
                      value: '',
                    })

                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      filters: newFilters,
                    }
                  }}
                >
                  <Text>{t('FILTERED_TYPES:::Remove Quotes', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>
        </Flex>
      </Box>
      {webrequestLocalOptions.value.headers.length > 0 && (
        <Box className="mt-2">
          <Flex className="gap-1 w-full justify-start">
            <Text className="font-semibold" size="sm">
              {t('Headers', { ns: 'dashboard' })}
              <Badge className="ml-1 py-0" variant="secondary">
                {webrequestLocalOptions.value.headers.length}
              </Badge>
            </Text>
            <Popover defaultOpen={false} open={showRemoveHeadersConfirmation.value}>
              <PopoverAnchor asChild>
                <Button
                  size="mini"
                  title={t('Remove headers', { ns: 'dashboard' })}
                  variant="ghost"
                  className="text-sm w-6 h-6 hover:bg-transparent ml-0.5"
                  onClick={() => {
                    showRemoveHeadersConfirmation.value = true
                  }}
                >
                  <X size={16} />
                </Button>
              </PopoverAnchor>
              <PopoverContent
                sideOffset={10}
                align="center"
                className="w-60"
                onEscapeKeyDown={() => {
                  showRemoveHeadersConfirmation.value = false
                }}
                onPointerDownOutside={() => {
                  showRemoveHeadersConfirmation.value = false
                }}
              >
                <Flex className="flex-col gap-3">
                  <Text color="black" size="sm">
                    {t('Confirm to remove headers', { ns: 'dashboard' })}
                  </Text>

                  <Flex>
                    <Button
                      variant="ghost"
                      className="hover:bg-transparent font-normal h-8"
                      onClick={() => {
                        showRemoveHeadersConfirmation.value = false
                      }}
                    >
                      {t('Cancel', { ns: 'common' })}
                    </Button>
                    <Button
                      className="hover:bg-red-100 bg-red-50 text-red-500 h-8"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          headers: [],
                        }
                        showRemoveHeadersConfirmation.value = false
                      }}
                    >
                      {t('Remove', { ns: 'common' })}
                      <Badge variant="destructive" className="ml-1 py-[1px]">
                        {webrequestLocalOptions.value.headers.length}
                      </Badge>
                    </Button>
                  </Flex>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>

          {webrequestLocalOptions.value.headers.map((header, i) => (
            <Flex className="gap-2 mb-1" key={header.id}>
              <InputField
                small
                defaultValue={header.name}
                disabled={header.isEnable === false}
                onChange={e => {
                  header.name = e.target.value.trim()
                }}
                placeholder={t('Name', { ns: 'dashboard' })}
                autoFocus={i === 0}
                className={`${header.isEnable === false ? 'bg-gray-100 opacity-50' : ''}`}
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                required
              ></InputField>
              <InputField
                small
                placeholder={t('Value', { ns: 'dashboard' })}
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                disabled={header.isEnable === false}
                className={`${header.isEnable === false ? 'bg-gray-100 opacity-50' : ''}`}
                onChange={e => {
                  header.value = e.target.value.trim()
                }}
                defaultValue={header.value}
                required
              ></InputField>
              <Button
                size="mini"
                title={t('Enable / Disable', { ns: 'common' })}
                variant="ghost"
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    headers: webrequestLocalOptions.value.headers.map((h, index) => {
                      if (index === i) {
                        return {
                          ...h,
                          isEnable: !h.isEnable,
                        }
                      }
                      return h
                    }),
                  }
                }}
              >
                {webrequestLocalOptions.value.headers[i]?.isEnable ? (
                  <CheckSquare2 size={14} />
                ) : (
                  <Square size={14} />
                )}
              </Button>
              <Button
                size="mini"
                title={t('Remove', { ns: 'common' })}
                variant="ghost"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    headers: webrequestLocalOptions.value.headers.filter((_, index) => {
                      return index !== i
                    }),
                  }
                }}
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
              >
                <Trash size={14} />
              </Button>
            </Flex>
          ))}
        </Box>
      )}
      {webrequestLocalOptions.value.auth?.type && (
        <Box className="mt-2">
          <Flex className="gap-1 w-full justify-start">
            <Text className="font-semibold" size={'sm'}>
              {t('Auth', { ns: 'dashboard' })} ({webrequestLocalOptions.value.auth?.type})
            </Text>
            <Popover defaultOpen={false} open={showRemoveAuthConfirmation.value}>
              <PopoverAnchor asChild>
                <Button
                  size="mini"
                  title={t('Remove headers', { ns: 'dashboard' })}
                  variant="ghost"
                  className="text-sm w-6 h-6 hover:bg-transparent ml-0.5"
                  onClick={() => {
                    showRemoveAuthConfirmation.value = true
                  }}
                >
                  <X size={16} />
                </Button>
              </PopoverAnchor>
              <PopoverContent
                sideOffset={10}
                align="center"
                className="w-52"
                onEscapeKeyDown={() => {
                  showRemoveAuthConfirmation.value = false
                }}
                onPointerDownOutside={() => {
                  showRemoveAuthConfirmation.value = false
                }}
              >
                <Flex className="flex-col gap-3">
                  <Text color="black" size="sm">
                    {t('Confirm to remove Auth', { ns: 'dashboard' })}
                  </Text>

                  <Flex>
                    <Button
                      variant="ghost"
                      className="hover:bg-transparent font-normal h-8"
                      onClick={() => {
                        showRemoveAuthConfirmation.value = false
                      }}
                    >
                      {t('Cancel', { ns: 'common' })}
                    </Button>
                    <Button
                      className="hover:bg-red-100 bg-red-50 text-red-500 h-8"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          auth: {},
                        }
                        showRemoveAuthConfirmation.value = false
                      }}
                    >
                      {t('Remove', { ns: 'common' })}
                    </Button>
                  </Flex>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>

          {webrequestLocalOptions.value.auth?.type === 'Bearer Token' && (
            <Flex className={`gap-2 mb-1`}>
              <InputField
                small
                isPassword
                showHidePassword
                defaultValue={webrequestLocalOptions.value.auth?.bearerToken}
                disabled={webrequestLocalOptions.value.auth?.isEnable === false}
                onChange={e => {
                  if (!webrequestLocalOptions.value.auth) {
                    webrequestLocalOptions.value.auth = {}
                  }

                  webrequestLocalOptions.value.auth.bearerToken = e.target.value.trim()
                }}
                className={`${
                  webrequestLocalOptions.value.auth?.isEnable === false
                    ? 'bg-gray-100 opacity-50'
                    : ''
                }`}
                placeholder={t('Bearer Token', { ns: 'dashboard' })}
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                required
              />
              <Button
                size="mini"
                title={t('Enable / Disable', { ns: 'common' })}
                variant="ghost"
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    auth: {
                      ...webrequestLocalOptions.value.auth,
                      isEnable: !webrequestLocalOptions.value.auth?.isEnable,
                    },
                  }
                }}
              >
                {webrequestLocalOptions.value.auth?.isEnable ? (
                  <CheckSquare2 size={14} />
                ) : (
                  <Square size={14} />
                )}
              </Button>
              <Button
                size="mini"
                title={t('Remove', { ns: 'common' })}
                variant="ghost"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    auth: {},
                  }
                }}
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
              >
                <Trash size={14} />
              </Button>
            </Flex>
          )}

          {webrequestLocalOptions.value.auth?.type === 'API Key' && (
            <Flex className="gap-2 mb-1">
              <InputField
                small
                defaultValue={webrequestLocalOptions.value.auth?.apiKey}
                disabled={webrequestLocalOptions.value.auth?.isEnable === false}
                className={`${
                  webrequestLocalOptions.value.auth?.isEnable === false
                    ? 'bg-gray-100 opacity-50'
                    : ''
                }`}
                onChange={e => {
                  if (!webrequestLocalOptions.value.auth) {
                    webrequestLocalOptions.value.auth = {}
                  }

                  webrequestLocalOptions.value.auth.apiKey = e.target.value.trim()
                }}
                placeholder={t('API Key', { ns: 'dashboard' })}
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                required
              />
              <InputField
                small
                defaultValue={webrequestLocalOptions.value.auth?.apiValue}
                disabled={webrequestLocalOptions.value.auth?.isEnable === false}
                className={`${
                  webrequestLocalOptions.value.auth?.isEnable === false
                    ? 'bg-gray-100 opacity-50'
                    : ''
                }`}
                onChange={e => {
                  if (!webrequestLocalOptions.value.auth) {
                    webrequestLocalOptions.value.auth = {}
                  }

                  webrequestLocalOptions.value.auth.apiValue = e.target.value.trim()
                }}
                placeholder={t("API Key's Value", { ns: 'dashboard' })}
                isPassword
                showHidePassword
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                required
              ></InputField>
              <Button
                size="mini"
                title={t('Enable / Disable', { ns: 'common' })}
                variant="ghost"
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    auth: {
                      ...webrequestLocalOptions.value.auth,
                      isEnable: !webrequestLocalOptions.value.auth?.isEnable,
                    },
                  }
                }}
              >
                {webrequestLocalOptions.value.auth?.isEnable ? (
                  <CheckSquare2 size={14} />
                ) : (
                  <Square size={14} />
                )}
              </Button>
              <Button
                size="mini"
                title={t('Remove', { ns: 'common' })}
                variant="ghost"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    auth: {},
                  }
                }}
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
              >
                <Trash size={14} />
              </Button>
            </Flex>
          )}

          {webrequestLocalOptions.value.auth?.type === 'Basic Password' && (
            <Flex className="gap-2 mb-1">
              <InputField
                small
                defaultValue={webrequestLocalOptions.value.auth?.basicUsername}
                disabled={webrequestLocalOptions.value.auth?.isEnable === false}
                className={`${
                  webrequestLocalOptions.value.auth?.isEnable === false
                    ? 'bg-gray-100 opacity-50'
                    : ''
                }`}
                onChange={e => {
                  if (!webrequestLocalOptions.value.auth) {
                    webrequestLocalOptions.value.auth = {}
                  }

                  webrequestLocalOptions.value.auth.basicUsername = e.target.value.trim()
                }}
                placeholder={t('Basic Username', { ns: 'dashboard' })}
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                required
              />
              <InputField
                small
                defaultValue={webrequestLocalOptions.value.auth?.basicPassword}
                disabled={webrequestLocalOptions.value.auth?.isEnable === false}
                className={`${
                  webrequestLocalOptions.value.auth?.isEnable === false
                    ? 'bg-gray-100 opacity-50'
                    : ''
                }`}
                onChange={e => {
                  if (!webrequestLocalOptions.value.auth) {
                    webrequestLocalOptions.value.auth = {}
                  }

                  webrequestLocalOptions.value.auth.basicPassword = e.target.value.trim()
                }}
                placeholder={t('Basic Password', { ns: 'dashboard' })}
                isPassword
                showHidePassword
                classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                required
              ></InputField>
              <Button
                size="mini"
                title={t('Enable / Disable', { ns: 'common' })}
                variant="ghost"
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    auth: {
                      ...webrequestLocalOptions.value.auth,
                      isEnable: !webrequestLocalOptions.value.auth?.isEnable,
                    },
                  }
                }}
              >
                {webrequestLocalOptions.value.auth?.isEnable ? (
                  <CheckSquare2 size={14} />
                ) : (
                  <Square size={14} />
                )}
              </Button>
              <Button
                size="mini"
                title={t('Remove', { ns: 'common' })}
                variant="ghost"
                onClick={() => {
                  webrequestLocalOptions.value = {
                    ...webrequestLocalOptions.value,
                    auth: {},
                  }
                }}
                className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
              >
                <Trash size={14} />
              </Button>
            </Flex>
          )}
        </Box>
      )}

      {webrequestLocalOptions.value.filters.length > 0 && (
        <Box className="mt-2">
          <Flex className="gap-1 w-full justify-start">
            <Text className="font-semibold" size="sm">
              {t('Response Filters', { ns: 'dashboard' })}
              <Badge className="ml-1 py-0" variant="secondary">
                {webrequestLocalOptions.value.filters.length}
              </Badge>
            </Text>
            <Popover defaultOpen={false} open={showRemoveFiltersConfirmation.value}>
              <PopoverAnchor asChild>
                <Button
                  size="mini"
                  title={t('Remove headers', { ns: 'dashboard' })}
                  variant="ghost"
                  className="text-sm w-6 h-6 hover:bg-transparent ml-0.5"
                  onClick={() => {
                    showRemoveFiltersConfirmation.value = true
                  }}
                >
                  <X size={16} />
                </Button>
              </PopoverAnchor>
              <PopoverContent
                sideOffset={10}
                align="center"
                className="w-60"
                onEscapeKeyDown={() => {
                  showRemoveFiltersConfirmation.value = false
                }}
                onPointerDownOutside={() => {
                  showRemoveFiltersConfirmation.value = false
                }}
              >
                <Flex className="flex-col gap-3">
                  <Text color="black" size="sm">
                    {t('Confirm to remove filters', { ns: 'dashboard' })}
                  </Text>

                  <Flex>
                    <Button
                      variant="ghost"
                      className="hover:bg-transparent font-normal h-8"
                      onClick={() => {
                        showRemoveFiltersConfirmation.value = false
                      }}
                    >
                      {t('Cancel', { ns: 'common' })}
                    </Button>
                    <Button
                      className="hover:bg-red-100 bg-red-50 text-red-500 h-8"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          filters: [],
                        }
                        showRemoveFiltersConfirmation.value = false
                      }}
                    >
                      {t('Remove', { ns: 'common' })}
                      <Badge variant="destructive" className="ml-1 py-[1px]">
                        {webrequestLocalOptions.value.filters.length}
                      </Badge>
                    </Button>
                  </Flex>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>

          {webrequestLocalOptions.value.filters.map((filter, i) => {
            const filterType =
              FILTERED_TYPES[filter.filterType as keyof typeof FILTERED_TYPES]
            return (
              <Flex className="gap-1 mb-1" key={filter.id}>
                <Text
                  title={`${t('Filter Type', { ns: 'dashboard' })}: ${filterType}`}
                  className={`${
                    filter.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                  } text-[13px] !font-semibold pl-1.5 self-stretch flex !justify-end`}
                >
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis w-[120px] text-left block">
                    {i + 1}. {filterType}
                  </span>
                </Text>

                {filter.filterType === 'removequotes' ? (
                  <InputField
                    small
                    autoFocus={i === webrequestLocalOptions.value.filters.length - 1}
                    classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5 !text-slate-600"
                    disabled={false}
                    className={`${
                      filter.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                    } `}
                    readOnly
                    defaultValue={t('Remove all double quotes', { ns: 'dashboard' })}
                  />
                ) : (
                  <InputField
                    small
                    placeholder={t("Filter's Value", { ns: 'dashboard' })}
                    autoFocus={i === webrequestLocalOptions.value.filters.length - 1}
                    classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                    disabled={filter.isEnable === false}
                    className={`${
                      filter.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                    } w-full`}
                    onChange={e => {
                      filter.value = e.target.value.trim()
                    }}
                    defaultValue={filter.value}
                  />
                )}
                {filter.filterType === 'regexreplace' && (
                  <InputField
                    small
                    placeholder={t('Replace Value', { ns: 'dashboard' })}
                    autoFocus={i === webrequestLocalOptions.value.filters.length - 1}
                    classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                    disabled={filter.isEnable === false}
                    className={`${
                      filter.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                    }`}
                    onChange={e => {
                      filter.replace = e.target.value.trim()
                    }}
                    defaultValue={filter.replace}
                  />
                )}
                <Button
                  size="mini"
                  title={t('Enable / Disable', { ns: 'common' })}
                  variant="ghost"
                  className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                  onClick={() => {
                    webrequestLocalOptions.value = {
                      ...webrequestLocalOptions.value,
                      filters: webrequestLocalOptions.value.filters.map((h, index) => {
                        if (index === i) {
                          return {
                            ...h,
                            isEnable: !h.isEnable,
                          }
                        }
                        return h
                      }),
                    }
                  }}
                >
                  {webrequestLocalOptions.value.filters[i]?.isEnable ? (
                    <CheckSquare2 size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="mini"
                      title={t('Remove', { ns: 'common' })}
                      variant="ghost"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          filters: arrayMove(
                            webrequestLocalOptions.value.filters,
                            i,
                            i - 1
                          ),
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
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          filters: arrayMove(
                            webrequestLocalOptions.value.filters,
                            i,
                            i - 1
                          ),
                        }
                      }}
                      className="text-[13px] py-1"
                    >
                      <Text>{t('Move Up', { ns: 'common' })}</Text>
                      <div className="ml-auto">
                        <MoveUp size={13} />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={i === webrequestLocalOptions.value.filters.length - 1}
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          filters: arrayMove(
                            webrequestLocalOptions.value.filters,
                            i,
                            i + 1
                          ),
                        }
                      }}
                      className="text-[13px] py-1"
                    >
                      <Text>{t('Move Down', { ns: 'common' })}</Text>
                      <div className="ml-auto">
                        <MoveDown size={13} />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 text-[13px] focus:text-red-500 py-1"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          filters: webrequestLocalOptions.value.filters.filter(
                            (_, index) => {
                              return index !== i
                            }
                          ),
                        }
                      }}
                    >
                      <Text className="!text-red-500">
                        {t('Remove', { ns: 'common' })}
                      </Text>
                      <div className="ml-auto">
                        <Trash size={13} />
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Flex>
            )
          })}
        </Box>
      )}

      {(webrequestTestOutputObject.value.body ||
        webrequestTestOutputObject.value.status) && (
        <Box
          className={`${
            webrequestTestOutputObject.value.status &&
            webrequestTestOutputObject.value.status >= 400
              ? 'bg-red-50 '
              : 'bg-green-50'
          } ${
            isLargeView ? 'py-1' : 'py-0'
          } rounded-md px-3 relative mt-2 pt-1 pb-1 select-text min-h-[0px] fade-in animate-in duration-500`}
        >
          {webrequestTestOutputObject.value.body &&
            webrequestTestOutputObject.value.filteredBody && (
              <Tabs
                className="flex flex-row absolute top-2 right-3 z-10 select-none"
                value={showFullBodyIfFiltered.value ? 'fullBody' : 'filteredBody'}
                onValueChange={val => {
                  showFullBodyIfFiltered.value = val === 'fullBody' ? true : false
                }}
              >
                <TabsList className="self-center px-1 py-1 opacity-60 hover:opacity-100 animate-in fade-in bg-slate-200">
                  <TabsTrigger
                    value="fullBody"
                    className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                    title={t('Full Body Response', { ns: 'dashboard' })}
                  >
                    {t('Full', { ns: 'dashboard' })}
                  </TabsTrigger>
                  <TabsTrigger
                    value="filteredBody"
                    className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                    title={t('Filtered Response', { ns: 'dashboard' })}
                  >
                    {t('Filtered', { ns: 'dashboard' })}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          <CodeViewerMemo
            isDark={isDark}
            maxHeight={!isLargeView ? 100 : 150}
            isLargeView={false}
            isShowMore={true}
            isWrapped={true}
            value={
              webrequestTestOutputObject.value.filteredBody &&
              !showFullBodyIfFiltered.value
                ? webrequestTestOutputObject.value.filteredBody
                : webrequestTestOutputObject.value.body ||
                  t('No body returned for response', { ns: 'dashboard' })
            }
            language={
              webrequestTestOutputObject.value.contentType &&
              webrequestTestOutputObject.value.body
                ? CONTENT_TYPE_LANGUAGE[
                    webrequestTestOutputObject.value.contentType.split(
                      ';'
                    )[0] as keyof typeof CONTENT_TYPE_LANGUAGE
                  ] || 'text'
                : 'text'
            }
          />
          <Flex className="justify-between py-1 pb-1">
            <Box
              className={`text-xs rounded-sm px-1.5 select-none  bg-slate-300 text-slate-600`}
            >
              {webrequestTestOutputObject.value.contentType &&
                CONTENT_TYPE_LANGUAGE[
                  webrequestTestOutputObject.value.contentType.split(
                    ';'
                  )[0] as keyof typeof CONTENT_TYPE_LANGUAGE
                ]}
            </Box>
            <Box
              className={`${
                webrequestTestOutputObject.value.status &&
                webrequestTestOutputObject.value.status >= 400
                  ? 'bg-red-300 text-red-700'
                  : 'bg-green-300 text-green-700'
              } text-xs rounded-sm px-1.5 select-none`}
            >
              {webrequestTestOutputObject.value.status &&
              webrequestTestOutputObject.value.status >= 400
                ? `${
                    webrequestTestOutputObject.value.hasFiltersError
                      ? 'filters'
                      : webrequestTestOutputObject.value.status
                  } error`
                : `${webrequestTestOutputObject.value.status}`}
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  )
}
