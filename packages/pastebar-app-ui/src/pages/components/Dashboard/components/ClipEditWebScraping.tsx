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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

import { useSignal } from '~/hooks/use-signal'

import { ClipWebRequestOptions } from './ClipCard'

export function ClipEditWebScraping({
  clipValue,
  showLinkValidationError,
  isLargeView,
  isDark,
  testOutputObject,
  localOptions,
}: {
  requestOptions: string | null | undefined
  isLargeView: boolean | undefined
  isDark: boolean
  clipValue: Signal<string | undefined>
  testOutputObject: Signal<{
    body?: string | null
    status?: number | null
    scrappedBody?: string | null
    foundCount?: number | null
    hasRulesError?: boolean | null
  }>
  localOptions: Signal<ClipWebRequestOptions>
  showLinkValidationError: Signal<boolean | undefined>
}) {
  const { t } = useTranslation()
  const showRemoveRulesConfirmation = useSignal(false)
  const showFullBodyIfFiltered = useSignal(false)

  const RULES_TYPES = {
    cssselector: t('RULES_TYPES:::CSS Selector', { ns: 'dashboard' }), // https://www.w3schools.com/cssref/css_selectors.php
    regexfind: t('RULES_TYPES:::RegEx Find', { ns: 'dashboard' }), // https://rust-lang-nursery.github.io/rust-cookbook/text/regex.html
    regexmatch: t('RULES_TYPES:::RegEx Match', { ns: 'dashboard' }), // https://rust-lang-nursery.github.io/rust-cookbook/text/regex.html
    regexmatchfoundgroup: t('RULES_TYPES:::RegEx Group Match', { ns: 'dashboard' }), // https://rust-lang-nursery.github.io/rust-cookbook/text/regex.html
    regexreplace: t('RULES_TYPES:::RegEx Replace', { ns: 'dashboard' }),
  } as const

  const SEPARATOR_TYPES = {
    comma: t('SEPARATOR_TYPES:::Comma (,)', { ns: 'dashboard' }),
    semicolon: t('SEPARATOR_TYPES:::Semicolon (;)', { ns: 'dashboard' }),
    space: t("SEPARATOR_TYPES:::Space (' ')", { ns: 'dashboard' }),
    newline: t('SEPARATOR_TYPES:::New Line (\\n)', { ns: 'dashboard' }),
    tab: t('SEPARATOR_TYPES:::Tab (\\t)', { ns: 'dashboard' }),
    pipe: t('SEPARATOR_TYPES:::Pipe (|)', { ns: 'dashboard' }),
  } as const

  const RETURN_POSITION_TYPES = {
    first: t('RETURN_POSITION_TYPES:::First Only', { ns: 'dashboard' }),
    last: t('RETURN_POSITION_TYPES:::Last Only', { ns: 'dashboard' }),
  } as const

  return (
    <Box className="select-none mt-1">
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
            className="px-2 h-10 pointer-events-none text-slate-500 border font-semibold text-xs bg-slate-100 _text-sm group hover:text-blue-500 mr-1 flex items-center"
          >
            <span>{t('URL', { ns: 'dashboard' })}</span>
          </Button>
        </ToolTip>

        <InputField
          defaultValue={clipValue.value}
          placeholder={t('Enter request url', { ns: 'dashboard' })}
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
          <Flex>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Text className="!text-blue-500 hover:underline cursor-pointer" size="xs">
                  {t('Add Scraping Rule', { ns: 'dashboard' })}
                  <ChevronDown size={12} className="ml-1" />
                </Text>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={12} align="center">
                <DropdownMenuItem
                  onClick={() => {
                    if (!localOptions.value.scrapingRules) {
                      localOptions.value.scrapingRules = []
                    }

                    const newRules = [...localOptions.value.scrapingRules]
                    newRules.push({
                      id: Date.now().toString(),
                      ruleType: 'cssselector',
                      isEnable: true,
                      value: '',
                    })

                    localOptions.value = {
                      ...localOptions.value,
                      scrapingRules: newRules,
                    }
                  }}
                >
                  <Text>{t('CSS Selector', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!localOptions.value.scrapingRules) {
                      localOptions.value.scrapingRules = []
                    }

                    const newRules = [...localOptions.value.scrapingRules]
                    newRules.push({
                      id: Date.now().toString(),
                      ruleType: 'regexfind',
                      isEnable: true,
                      value: '',
                    })

                    localOptions.value = {
                      ...localOptions.value,
                      scrapingRules: newRules,
                    }
                  }}
                >
                  <Text>{t('RegEx Find', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!localOptions.value.scrapingRules) {
                      localOptions.value.scrapingRules = []
                    }

                    const newRules = [...localOptions.value.scrapingRules]
                    newRules.push({
                      id: Date.now().toString(),
                      ruleType: 'regexmatch',
                      isEnable: true,
                      value: '',
                    })

                    localOptions.value = {
                      ...localOptions.value,
                      scrapingRules: newRules,
                    }
                  }}
                >
                  <Text>{t('RegEx Match', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!localOptions.value.scrapingRules) {
                      localOptions.value.scrapingRules = []
                    }

                    const newRules = [...localOptions.value.scrapingRules]
                    newRules.push({
                      id: Date.now().toString(),
                      ruleType: 'regexmatchfoundgroup',
                      isEnable: true,
                      value: '',
                    })

                    localOptions.value = {
                      ...localOptions.value,
                      scrapingRules: newRules,
                    }
                  }}
                >
                  <Text>{t('RegEx Match Group', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!localOptions.value.scrapingRules) {
                      localOptions.value.scrapingRules = []
                    }

                    const newRules = [...localOptions.value.scrapingRules]
                    newRules.push({
                      id: Date.now().toString(),
                      ruleType: 'regexreplace',
                      isEnable: true,
                      value: '',
                    })

                    localOptions.value = {
                      ...localOptions.value,
                      scrapingRules: newRules,
                    }
                  }}
                >
                  <Text>{t('RegEx Replace', { ns: 'dashboard' })}</Text>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>
        </Flex>
      </Box>

      {localOptions.value.scrapingRules &&
        localOptions.value.scrapingRules.length > 0 && (
          <Box className="mt-2">
            <Flex className="gap-1 w-full justify-start">
              <Text className="font-semibold" size="sm">
                {t('Scrapping Rules', { ns: 'dashboard' })}
                <Badge className="ml-1 py-0" variant="secondary">
                  {localOptions.value.scrapingRules.length}
                </Badge>
              </Text>
              <Popover defaultOpen={false} open={showRemoveRulesConfirmation.value}>
                <PopoverAnchor asChild>
                  <Button
                    size="mini"
                    title={t('Remove headers', { ns: 'dashboard' })}
                    variant="ghost"
                    className="text-sm w-6 h-6 hover:bg-transparent ml-0.5"
                    onClick={() => {
                      showRemoveRulesConfirmation.value = true
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
                    showRemoveRulesConfirmation.value = false
                  }}
                  onPointerDownOutside={() => {
                    showRemoveRulesConfirmation.value = false
                  }}
                >
                  <Flex className="flex-col gap-3">
                    <Text color="black" size="sm">
                      {t('Confirm to remove rules', { ns: 'dashboard' })}
                    </Text>

                    <Flex>
                      <Button
                        variant="ghost"
                        className="hover:bg-transparent font-normal h-8"
                        onClick={() => {
                          showRemoveRulesConfirmation.value = false
                        }}
                      >
                        {t('Cancel', { ns: 'dashboard' })}
                      </Button>
                      <Button
                        className="hover:bg-red-100 bg-red-50 text-red-500 h-8"
                        onClick={() => {
                          localOptions.value = {
                            ...localOptions.value,
                            scrapingRules: [],
                          }
                          showRemoveRulesConfirmation.value = false
                        }}
                      >
                        {t('Remove', { ns: 'dashboard' })}
                        <Badge variant="destructive" className="ml-1 py-[1px]">
                          {localOptions.value.scrapingRules.length}
                        </Badge>
                      </Button>
                    </Flex>
                  </Flex>
                </PopoverContent>
              </Popover>
            </Flex>

            {localOptions.value.scrapingRules.map((rule, i) => {
              const ruleType = RULES_TYPES[rule.ruleType as keyof typeof RULES_TYPES]
              return (
                <Flex className="mb-1 mt-2 items-center" key={rule.id}>
                  <Text
                    title={`${t('Rule Type', { ns: 'common' })}: ${ruleType}`}
                    className={`${
                      rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                    } text-[13px] !font-semibold pl-1.5 self-stretch flex !justify-end pb-2`}
                  >
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis w-[120px] text-left block">
                      {i + 1}. {ruleType}
                    </span>
                  </Text>

                  <Flex
                    className={`gap-0.5 flex-col w-full items-start ${
                      rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                    }`}
                  >
                    <Flex className="w-full gap-1">
                      <>
                        <InputField
                          small
                          placeholder={
                            rule.ruleType === 'cssselector' ? 'Selector' : "Rule's Value"
                          }
                          autoFocus={
                            localOptions.value.scrapingRules
                              ? i === localOptions.value.scrapingRules?.length - 1
                              : false
                          }
                          classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                          disabled={rule.isEnable === false}
                          className={`${
                            rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                          } w-full`}
                          onChange={e => {
                            rule.value = e.target.value.trim()
                          }}
                          defaultValue={rule.value}
                        />
                        {rule.ruleType === 'cssselector' && (
                          <InputField
                            small
                            placeholder="Find Text"
                            classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                            disabled={rule.isEnable === false}
                            className={`max-w-[120px] ${
                              rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                            }`}
                            onChange={e => {
                              rule.filterText = e.target.value.trim()
                            }}
                            defaultValue={rule.filterText}
                          />
                        )}
                      </>
                    </Flex>

                    <Flex className="gap-1 mb-1">
                      {rule.ruleType === 'regexreplace' && (
                        <InputField
                          small
                          placeholder="Replace Value"
                          classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                          disabled={rule.isEnable === false}
                          className={`${
                            rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                          }`}
                          onChange={e => {
                            rule.replace = e.target.value.trim()
                          }}
                          defaultValue={rule.replace}
                        />
                      )}
                      {rule.ruleType === 'cssselector' && (
                        <>
                          <InputField
                            small
                            placeholder="Attribute Name"
                            classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                            disabled={rule.isEnable === false}
                            className={`max-w-[120px] ${
                              rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                            }`}
                            onChange={e => {
                              rule.returnAttribute = e.target.value.trim()
                            }}
                            defaultValue={rule.returnAttribute}
                          />
                          <InputField
                            small
                            placeholder="Attribute Text"
                            classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                            disabled={rule.isEnable === false}
                            className={`max-w-[120px] ${
                              rule.isEnable === false ? 'bg-gray-100 opacity-50' : ''
                            }`}
                            onChange={e => {
                              rule.returnAttributeText = e.target.value.trim()
                            }}
                            defaultValue={rule.returnAttributeText}
                          />
                        </>
                      )}
                    </Flex>
                  </Flex>
                  <Flex className="gap-1 mb-1 mt-[-12px] ml-2">
                    <Button
                      size="mini"
                      title={t('Enable / Disable', { ns: 'common' })}
                      variant="ghost"
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                      onClick={() => {
                        localOptions.value = {
                          ...localOptions.value,
                          scrapingRules: localOptions.value.scrapingRules?.map(
                            (h, index) => {
                              if (index === i) {
                                return {
                                  ...h,
                                  isEnable: !h.isEnable,
                                }
                              }
                              return h
                            }
                          ),
                        }
                      }}
                    >
                      {localOptions.value.scrapingRules &&
                      localOptions.value.scrapingRules[i]?.isEnable ? (
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
                            localOptions.value = {
                              ...localOptions.value,
                              scrapingRules: arrayMove(
                                localOptions.value.scrapingRules || [],
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
                            localOptions.value = {
                              ...localOptions.value,
                              scrapingRules: arrayMove(
                                localOptions.value.scrapingRules || [],
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
                          disabled={
                            localOptions.value.scrapingRules
                              ? i === localOptions.value.scrapingRules.length - 1
                              : false
                          }
                          onClick={() => {
                            localOptions.value = {
                              ...localOptions.value,
                              scrapingRules: arrayMove(
                                localOptions.value.scrapingRules || [],
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
                            localOptions.value = {
                              ...localOptions.value,
                              scrapingRules: localOptions.value.scrapingRules?.filter(
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
                </Flex>
              )
            })}

            {localOptions.value.scrapingRules &&
              localOptions.value.scrapingRules.length > 0 && (
                <Flex className="mt-2 justify-start">
                  <Button
                    variant="outline"
                    size="mini"
                    className="px-2 h-8 text-[13px] text-slate-500 border-0 font-semibold mr-2 flex items-center"
                  >
                    <span className="whitespace-nowrap">
                      {t('Return Result As', { ns: 'dashboard' })}
                    </span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="mini"
                        title={t('Return Type', { ns: 'dashboard' })}
                        className="px-2 pr-1 h-8 text-slate-500 border font-semibold text-xs bg-slate-100 _text-sm group hover:text-blue-500 mr-1 flex items-center"
                      >
                        <span className="whitespace-nowrap">
                          {localOptions.value.scrapingOptions?.returnType}
                        </span>
                        <ChevronDown size={12} className="ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={12} align="center">
                      <DropdownMenuItem
                        disabled
                        className="text-center flex items-center justify-center py-0.5"
                      >
                        <Text>{t('Return Type', { ns: 'dashboard' })}</Text>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={
                          localOptions.value.scrapingOptions?.returnType === 'Text'
                        }
                        onClick={() => {
                          if (!localOptions.value.scrapingOptions) {
                            localOptions.value.scrapingOptions = {}
                          }

                          const newScrapingOptions = {
                            ...localOptions.value.scrapingOptions,
                            returnType: 'Text' as const,
                          }

                          localOptions.value = {
                            ...localOptions.value,
                            scrapingOptions: newScrapingOptions,
                          }
                        }}
                      >
                        <Text
                          className={`${
                            localOptions.value.scrapingOptions?.returnType === 'Text' &&
                            'font-semibold'
                          }`}
                        >
                          {t('ReturnType:::Text', { ns: 'dashboard' })}
                        </Text>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={
                          localOptions.value.scrapingOptions?.returnType === 'Array'
                        }
                        onClick={() => {
                          if (!localOptions.value.scrapingOptions) {
                            localOptions.value.scrapingOptions = {}
                          }

                          const newScrapingOptions = {
                            ...localOptions.value.scrapingOptions,
                            returnType: 'Array' as const,
                          }

                          localOptions.value = {
                            ...localOptions.value,
                            scrapingOptions: newScrapingOptions,
                          }
                        }}
                      >
                        <Text
                          className={`${
                            localOptions.value.scrapingOptions?.returnType === 'Array' &&
                            'font-semibold'
                          }`}
                        >
                          {t('ReturnType:::Array', { ns: 'dashboard' })}
                        </Text>
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="mini"
                        title={t('Return Count Limit', { ns: 'dashboard' })}
                        className="px-2 pr-1 h-8 text-slate-500 border font-semibold text-xs bg-slate-100 _text-sm group hover:text-blue-500 mr-1 flex items-center"
                      >
                        <span className="whitespace-nowrap">
                          {t('Limit', { ns: 'dashboard' })}:
                          <span className="ml-1">
                            {localOptions.value.scrapingOptions?.returnCount &&
                            localOptions.value.scrapingOptions.returnPosition == null &&
                            localOptions.value.scrapingOptions.returnCount > 0
                              ? localOptions.value.scrapingOptions?.returnCount
                              : localOptions.value.scrapingOptions?.returnPosition !==
                                  null
                                ? RETURN_POSITION_TYPES[
                                    localOptions.value.scrapingOptions
                                      ?.returnPosition as keyof typeof RETURN_POSITION_TYPES
                                  ]
                                : t('RETURN_POSITION_TYPES:::All', { ns: 'dashboard' })}
                          </span>
                        </span>
                        <ChevronDown size={12} className="ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={12} align="center">
                      <DropdownMenuItem
                        disabled
                        className="text-center flex items-center justify-center py-0.5"
                      >
                        <Text>{t('Return Count Limit', { ns: 'dashboard' })}</Text>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={
                          localOptions.value.scrapingOptions?.returnCount == null &&
                          localOptions.value.scrapingOptions?.returnPosition == null
                        }
                        onClick={() => {
                          if (!localOptions.value.scrapingOptions) {
                            localOptions.value.scrapingOptions = {}
                          }

                          const newScrapingOptions = {
                            ...localOptions.value.scrapingOptions,
                            returnPosition: null,
                            returnCount: null,
                          }

                          localOptions.value = {
                            ...localOptions.value,
                            scrapingOptions: newScrapingOptions,
                          }
                        }}
                      >
                        <Text
                          className={`${
                            localOptions.value.scrapingOptions?.returnCount == null &&
                            localOptions.value.scrapingOptions?.returnPosition == null &&
                            'font-semibold'
                          }`}
                        >
                          {t('All (No Limit)', { ns: 'dashboard' })}
                        </Text>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={
                          localOptions.value.scrapingOptions?.returnPosition == 'first'
                        }
                        onClick={() => {
                          if (!localOptions.value.scrapingOptions) {
                            localOptions.value.scrapingOptions = {}
                          }

                          const newScrapingOptions = {
                            ...localOptions.value.scrapingOptions,
                            returnCount: null,
                            returnPosition: 'first' as const,
                          }

                          localOptions.value = {
                            ...localOptions.value,
                            scrapingOptions: newScrapingOptions,
                          }
                        }}
                      >
                        <Text
                          className={`${
                            localOptions.value.scrapingOptions?.returnPosition ==
                              'first' && 'font-semibold'
                          }`}
                        >
                          {t('First Only', { ns: 'dashboard' })}
                        </Text>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={
                          localOptions.value.scrapingOptions?.returnPosition == 'last'
                        }
                        onClick={() => {
                          if (!localOptions.value.scrapingOptions) {
                            localOptions.value.scrapingOptions = {}
                          }

                          const newScrapingOptions = {
                            ...localOptions.value.scrapingOptions,
                            returnCount: null,
                            returnPosition: 'last' as const,
                          }

                          localOptions.value = {
                            ...localOptions.value,
                            scrapingOptions: newScrapingOptions,
                          }
                        }}
                      >
                        <Text
                          className={`${
                            localOptions.value.scrapingOptions?.returnPosition ==
                              'last' && 'font-semibold'
                          }`}
                        >
                          {t('Last Only', { ns: 'dashboard' })}
                        </Text>
                      </DropdownMenuCheckboxItem>
                      {[...Array(5)].map((_, i) => {
                        const count = i + 1
                        return (
                          <DropdownMenuCheckboxItem
                            key={count}
                            checked={
                              localOptions.value.scrapingOptions?.returnCount === count
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnPosition: null,
                                returnCount: count,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnCount ===
                                  count && 'font-semibold'
                              }`}
                            >
                              {count}
                            </Text>
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                      {[10, 20].map(count => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={count}
                            checked={
                              localOptions.value.scrapingOptions?.returnCount === count
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnPosition: null,
                                returnCount: count,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnCount ===
                                  count && 'font-semibold'
                              }`}
                            >
                              {count}
                            </Text>
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {localOptions.value.scrapingOptions?.returnType !== 'Array' &&
                    localOptions.value.scrapingOptions?.returnPosition == null &&
                    (localOptions.value.scrapingOptions?.returnCount == null ||
                      localOptions.value.scrapingOptions?.returnCount !== 1) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="mini"
                            title={t('Text Separator', { ns: 'dashboard' })}
                            className="px-2 pr-1 h-8 text-slate-500 border font-semibold text-xs bg-slate-100 _text-sm group hover:text-blue-500 mr-1 flex items-center"
                          >
                            <span className="whitespace-nowrap">
                              {
                                SEPARATOR_TYPES[
                                  localOptions.value.scrapingOptions
                                    ?.returnSeparator as keyof typeof SEPARATOR_TYPES
                                ]
                              }
                            </span>
                            <ChevronDown size={12} className="ml-1" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent sideOffset={12} align="center">
                          <DropdownMenuItem
                            disabled
                            className="text-center flex items-center justify-center py-0.5"
                          >
                            <Text>{t('Text Separator', { ns: 'dashboard' })}</Text>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={
                              localOptions.value.scrapingOptions?.returnSeparator ===
                              'newline'
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnSeparator: 'newline' as const,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnSeparator ===
                                  'newline' && 'font-semibold'
                              }`}
                            >
                              {t('ReturnSeparator:::New Line', { ns: 'dashboard' })} (\n)
                            </Text>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={
                              localOptions.value.scrapingOptions?.returnSeparator ===
                              'tab'
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnSeparator: 'tab' as const,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnSeparator ===
                                  'tab' && 'font-semibold'
                              }`}
                            >
                              {t('ReturnSeparator:::Tab', { ns: 'dashboard' })} (\t)
                            </Text>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={
                              localOptions.value.scrapingOptions?.returnSeparator ===
                              'comma'
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnSeparator: 'comma' as const,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnSeparator ===
                                  'comma' && 'font-semibold'
                              }`}
                            >
                              {t('ReturnSeparator:::Comma', { ns: 'dashboard' })} (,)
                            </Text>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={
                              localOptions.value.scrapingOptions?.returnSeparator ===
                              'semicolon'
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnSeparator: 'semicolon' as const,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnSeparator ===
                                  'semicolon' && 'font-semibold'
                              }`}
                            >
                              {t('ReturnSeparator:::Semicolon', { ns: 'dashboard' })} (;)
                            </Text>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={
                              localOptions.value.scrapingOptions?.returnSeparator ===
                              'pipe'
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnSeparator: 'pipe' as const,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnSeparator ===
                                  'pipe' && 'font-semibold'
                              }`}
                            >
                              {t('ReturnSeparator:::Pipe', { ns: 'dashboard' })} (|)
                            </Text>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={
                              localOptions.value.scrapingOptions?.returnSeparator ===
                              'space'
                            }
                            onClick={() => {
                              if (!localOptions.value.scrapingOptions) {
                                localOptions.value.scrapingOptions = {}
                              }

                              const newScrapingOptions = {
                                ...localOptions.value.scrapingOptions,
                                returnSeparator: 'space' as const,
                              }

                              localOptions.value = {
                                ...localOptions.value,
                                scrapingOptions: newScrapingOptions,
                              }
                            }}
                          >
                            <Text
                              className={`${
                                localOptions.value.scrapingOptions?.returnSeparator ===
                                  'space' && 'font-semibold'
                              }`}
                            >
                              {t('ReturnSeparator:::Space', { ns: 'dashboard' })} (' ')
                            </Text>
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </Flex>
              )}
          </Box>
        )}

      {(testOutputObject.value.body || testOutputObject.value.status) && (
        <Box
          className={`${
            testOutputObject.value.status && testOutputObject.value.status >= 400
              ? 'bg-red-50 '
              : 'bg-green-50'
          } ${
            isLargeView ? '!pb-3 mb-1 !py-3' : 'py-0 pb-2'
          } rounded-md px-3 relative mt-2 pt-1 select-text min-h-[0px] fade-in animate-in duration-500`}
        >
          {testOutputObject.value.body && testOutputObject.value.scrappedBody && (
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
                  {testOutputObject.value.foundCount &&
                  testOutputObject.value.foundCount > 1
                    ? t('Found {{foundCount}} results', {
                        ns: 'dashboard',
                        foundCount: testOutputObject.value.foundCount,
                      })
                    : t('Found', { ns: 'common' })}
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
              testOutputObject.value.scrappedBody && !showFullBodyIfFiltered.value
                ? testOutputObject.value.scrappedBody
                : testOutputObject.value.body ||
                  t('No body returned for response', { ns: 'dashboard' })
            }
            language={
              testOutputObject.value.body && showFullBodyIfFiltered.value
                ? 'html'
                : 'text'
            }
          />
          {localOptions.value.scrapingRules &&
            localOptions.value.scrapingRules.length === 0 && (
              <Text className="text-xs text-yellow-600">
                {t('You have no rules added', { ns: 'dashboard' })}.
              </Text>
            )}
          {testOutputObject.value.status && testOutputObject.value.status >= 400 && (
            <Flex className="justify-between py-1 pb-1">
              <Box className="text-xs rounded-sm px-1.5 select-none bg-red-300 text-red-700">
                {testOutputObject.value.status} error
              </Box>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  )
}
