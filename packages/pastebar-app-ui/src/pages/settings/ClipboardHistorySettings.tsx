import { useEffect, useState } from 'react'
import { closestCenter, DndContext } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DEFAULT_SPECIAL_PASTE_CATEGORIES,
  DEFAULT_SPECIAL_PASTE_OPERATIONS,
  settingsStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { ChevronDown, Grip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import { TEXT_TRANSFORMS, TRANSFORM_CATEGORIES } from '~/lib/text-transforms'
import {
  arraysEqual,
  isStringArrayEmpty,
  maskValue,
  trimAndRemoveExtraNewlines,
} from '~/lib/utils'

import Spacer from '~/components/atoms/spacer'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckBoxFilter,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from '~/components/ui'

import { useDebounce } from '~/hooks/use-debounce'

import TextArea from '../../components/molecules/textarea'

interface SortableItemProps {
  id: string
  language: string
}
function SortableItem({ id, language }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'z-100 opacity-70' : 'z-auto opacity-100'}
    >
      <Flex className="items-center justify-between p-2 border rounded mb-2 dark:bg-slate-900 bg-slate-50">
        <Flex className="items-center justify-center ml-2">
          <Text>{language}</Text>
        </Flex>
        <Button variant="ghost" size="sm" className="opacity-40 hover:opacity-90">
          <Grip size={20} />
        </Button>
      </Flex>
    </div>
  )
}

interface SortableCategoryItemProps {
  categoryId: string
  localCategoriesOrder: string[]
  setLocalCategoriesOrder: (categories: string[]) => void
}
function SortableCategoryItem({
  categoryId,
  localCategoriesOrder,
  setLocalCategoriesOrder,
}: SortableCategoryItemProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: categoryId })

  const {
    enabledSpecialPasteOperations,
    setEnabledSpecialPasteOperations,
    setSpecialPasteCategoriesOrder,
  } = useAtomValue(settingsStoreAtom)

  const category = TRANSFORM_CATEGORIES.find(c => c.id === categoryId)
  if (!category) return null

  const isCategoryEnabled = localCategoriesOrder.includes(category.id)

  // Get all transforms in category (including from subcategories)
  const allTransformsInCategory = category.subcategories
    ? category.subcategories.flatMap(subcategory => subcategory.transforms)
    : category.transforms || []

  const enabledTransformsInCategory = allTransformsInCategory.filter(transform =>
    enabledSpecialPasteOperations.includes(transform.id)
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      key={category.id}
      {...attributes}
      className={
        isDragging
          ? 'z-100 opacity-70 bg-slate-50 dark:bg-slate-900'
          : 'z-auto opacity-100'
      }
    >
      <Box
        className={`border rounded-lg p-4 ${
          !isCategoryEnabled ? 'opacity-60 bg-gray-50 dark:bg-gray-900/50' : ''
        }`}
      >
        {/* Category Header */}
        <Flex className="items-center justify-between">
          <Flex className="items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`opacity-40 hover:opacity-90 p-1 ${
                isCategoryEnabled
                  ? 'cursor-grab active:cursor-grabbing'
                  : 'cursor-not-allowed'
              }`}
              {...(isCategoryEnabled ? listeners : {})}
              disabled={!isCategoryEnabled}
            >
              <Grip size={18} />
            </Button>
            <Text className="text-[14px] font-semibold">
              {t(category.label, { ns: 'specialCopyPaste' })}
            </Text>
          </Flex>
          <Flex className="items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {enabledTransformsInCategory.length}/{allTransformsInCategory.length}
            </Badge>
            <Switch
              className="scale-[.95]"
              checked={isCategoryEnabled}
              onCheckedChange={checked => {
                if (checked) {
                  const newLocalOrder = localCategoriesOrder.includes(category.id)
                    ? localCategoriesOrder
                    : [...localCategoriesOrder, category.id]
                  setLocalCategoriesOrder(newLocalOrder)
                  setSpecialPasteCategoriesOrder(newLocalOrder)

                  // Enable all transforms in the category (including from subcategories)
                  const allTransformIds = allTransformsInCategory.map(t => t.id)
                  const newOps = [
                    ...new Set([...enabledSpecialPasteOperations, ...allTransformIds]),
                  ]
                  setEnabledSpecialPasteOperations(newOps)
                } else {
                  const newLocalOrder = localCategoriesOrder.filter(
                    id => id !== category.id
                  )
                  setLocalCategoriesOrder(newLocalOrder)
                  setSpecialPasteCategoriesOrder(newLocalOrder)

                  const transformIds = allTransformsInCategory.map(t => t.id)
                  const newOps = enabledSpecialPasteOperations.filter(
                    op => !transformIds.includes(op)
                  )
                  setEnabledSpecialPasteOperations(newOps)
                }
              }}
            />
          </Flex>
        </Flex>

        {/* Individual Transform Controls */}
        {isCategoryEnabled && (
          <Box className="mt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {t('Select Operations', { ns: 'specialCopyPaste' })}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>
                  {t(category.label, { ns: 'specialCopyPaste' })}{' '}
                  {t('Operations', { ns: 'specialCopyPaste' })}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <SimpleBar
                  className="code-filter"
                  style={{
                    height: 'auto',
                    maxHeight: '400px',
                    overflowX: 'hidden',
                  }}
                  autoHide={false}
                >
                  {category.subcategories
                    ? // Handle categories with subcategories (like Format Converter)
                      category.subcategories.map(subcategory => (
                        <div key={subcategory.id}>
                          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                            {t(subcategory.label, { ns: 'specialCopyPaste' })}
                          </DropdownMenuLabel>
                          {subcategory.transforms.map(transform => (
                            <DropdownMenuCheckboxItem
                              key={transform.id}
                              checked={enabledSpecialPasteOperations.includes(
                                transform.id
                              )}
                              onSelect={e => {
                                e.preventDefault()
                              }}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setEnabledSpecialPasteOperations([
                                    ...enabledSpecialPasteOperations,
                                    transform.id,
                                  ])
                                } else {
                                  setEnabledSpecialPasteOperations(
                                    enabledSpecialPasteOperations.filter(
                                      op => op !== transform.id
                                    )
                                  )
                                }
                              }}
                              className="pl-6"
                            >
                              {t(transform.label, { ns: 'specialCopyPaste' })}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {category.subcategories &&
                            subcategory !==
                              category.subcategories[
                                category.subcategories.length - 1
                              ] && <DropdownMenuSeparator />}
                        </div>
                      ))
                    : // Handle categories with direct transforms
                      (category.transforms || []).map(transform => (
                        <DropdownMenuCheckboxItem
                          key={transform.id}
                          checked={enabledSpecialPasteOperations.includes(transform.id)}
                          onSelect={e => {
                            e.preventDefault()
                          }}
                          onCheckedChange={checked => {
                            if (checked) {
                              setEnabledSpecialPasteOperations([
                                ...enabledSpecialPasteOperations,
                                transform.id,
                              ])
                            } else {
                              setEnabledSpecialPasteOperations(
                                enabledSpecialPasteOperations.filter(
                                  op => op !== transform.id
                                )
                              )
                            }
                          }}
                        >
                          {t(transform.label, { ns: 'specialCopyPaste' })}
                        </DropdownMenuCheckboxItem>
                      ))}
                </SimpleBar>
              </DropdownMenuContent>
            </DropdownMenu>
          </Box>
        )}
      </Box>
    </div>
  )
}

export default function ClipboardHistorySettings() {
  const {
    isHistoryEnabled,
    clipTextMinLength,
    clipTextMaxLength,
    historyPreviewLineLimit,
    setClipTextMinLength,
    setClipTextMaxLength,
    setHistoryPreviewLineLimit,
    setIsHistoryEnabled,
    isImageCaptureDisabled,
    setIsImageCaptureDisabled,
    isHistoryAutoUpdateOnCaputureEnabled,
    setIsHistoryAutoTrimOnCaputureEnabled,
    isHistoryAutoTrimOnCaputureEnabled,
    setIsHistoryAutoUpdateOnCaputureEnabled,
    setIsExclusionListEnabled,
    setIsExclusionAppListEnabled,
    historyExclusionList,
    historyExclusionAppList,
    autoMaskWordsList,
    isExclusionListEnabled,
    isExclusionAppListEnabled,
    setHistoryExclusionList,
    setHistoryExclusionAppList,
    setAutoMaskWordsList,
    isAutoMaskWordsListEnabled,
    isAutoPreviewLinkCardsEnabled,
    setIsAutoPreviewLinkCardsEnabled,
    isAutoGenerateLinkCardsEnabled,
    setIsAutoGenerateLinkCardsEnabled,
    isAutoFavoriteOnDoubleCopyEnabled,
    setIsAutoFavoriteOnDoubleCopyEnabled,
    setIsAutoMaskWordsListEnabled,
    setHistoryDetectLanguagesEnabledList,
    setHistoryDetectLanguagesPrioritizedList,
    setIsHistoryDetectLanguageEnabled,
    isHistoryDetectLanguageEnabled,
    historyDetectLanguagesEnabledList,
    historyDetectLanguagesPrioritizedList,
    historyDetectLanguageMinLines,
    setHistoryDetectLanguageMinLines,
    isAutoClearSettingsEnabled,
    setIsAutoClearSettingsEnabled,
    autoClearSettingsDuration,
    setAutoClearSettingsDuration,
    autoClearSettingsDurationType,
    setAutoClearSettingsDurationType,
    isKeepPinnedOnClearEnabled,
    setIsKeepPinnedOnClearEnabled,
    isKeepStarredOnClearEnabled,
    setIsKeepStarredOnClearEnabled,
    isSpecialCopyPasteHistoryEnabled,
    setIsSpecialCopyPasteHistoryEnabled,
    enabledSpecialPasteOperations,
    setEnabledSpecialPasteOperations,
    specialPasteCategoriesOrder,
    setSpecialPasteCategoriesOrder,
    isAppReady,
    CONST: { APP_DETECT_LANGUAGES_SUPPORTED: languageList },
  } = useAtomValue(settingsStoreAtom)

  const { returnRoute } = useAtomValue(uiStoreAtom)
  const { t } = useTranslation()

  useEffect(() => {
    const id = window.location.hash.substring(1)

    if (id == null) {
      return
    }

    setTimeout(() => {
      const releventDiv = document.getElementById(id)
      releventDiv?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
  }, [])

  const [exclusionListValue, setExclusionListValue] = useState('')
  const [exclusionAppListValue, setExclusionAppListValue] = useState('')
  const [autoMaskListValue, setAutoMaskListValue] = useState('')
  const [isAutoMaskWordsTextAreaInFocus, setIsAutoMaskWordsTextAreaInFocus] =
    useState(false)

  const debouncedExclusionListValue = useDebounce(exclusionListValue, 300)
  const debouncedExclusionAppListValue = useDebounce(exclusionAppListValue, 300)
  const debouncedAutoMaskListValue = useDebounce(autoMaskListValue, 300)

  const [prioritizedLanguages, setPrioritizedLanguages] = useState<string[]>([])
  const [localCategoriesOrder, setLocalCategoriesOrder] = useState<string[]>([])

  useEffect(() => {
    if (
      isStringArrayEmpty(historyDetectLanguagesPrioritizedList) &&
      !isStringArrayEmpty(historyDetectLanguagesEnabledList)
    ) {
      setPrioritizedLanguages(historyDetectLanguagesEnabledList)
    } else if (!isStringArrayEmpty(historyDetectLanguagesPrioritizedList)) {
      setPrioritizedLanguages(historyDetectLanguagesPrioritizedList)
    }
  }, [historyDetectLanguagesEnabledList, historyDetectLanguagesPrioritizedList])

  // Initialize local categories order from store
  useEffect(() => {
    if (
      Array.isArray(specialPasteCategoriesOrder) &&
      specialPasteCategoriesOrder.length > 0
    ) {
      setLocalCategoriesOrder(specialPasteCategoriesOrder)
    } else {
      setLocalCategoriesOrder([...DEFAULT_SPECIAL_PASTE_CATEGORIES])
    }
  }, [specialPasteCategoriesOrder])

  // Show all categories, ordered by user preference with enabled ones first
  const orderedCategories = (() => {
    const enabled =
      localCategoriesOrder.length > 0
        ? localCategoriesOrder
        : [...DEFAULT_SPECIAL_PASTE_CATEGORIES]

    // Get all categories that exist but aren't in the enabled list
    const allCategoryIds = [...DEFAULT_SPECIAL_PASTE_CATEGORIES]
    const disabled = allCategoryIds.filter(id => !enabled.includes(id))

    // Return enabled categories first, then disabled ones
    return [...enabled, ...disabled]
  })()

  console.log(
    'Component render - specialPasteCategoriesOrder:',
    specialPasteCategoriesOrder,
    typeof specialPasteCategoriesOrder,
    Array.isArray(specialPasteCategoriesOrder)
  )
  console.log(
    'Component render - orderedCategories:',
    orderedCategories,
    Array.isArray(orderedCategories)
  )

  useEffect(() => {
    if (isAppReady) {
      setHistoryExclusionList(trimAndRemoveExtraNewlines(debouncedExclusionListValue))
    }
  }, [debouncedExclusionListValue, isAppReady])

  useEffect(() => {
    if (isAppReady) {
      setHistoryExclusionAppList(
        trimAndRemoveExtraNewlines(debouncedExclusionAppListValue)
      )
    }
  }, [debouncedExclusionAppListValue, isAppReady])

  useEffect(() => {
    if (isAppReady) {
      setAutoMaskWordsList(trimAndRemoveExtraNewlines(debouncedAutoMaskListValue))
    }
  }, [debouncedAutoMaskListValue, isAppReady])

  useEffect(() => {
    if (isAppReady) {
      setExclusionListValue(historyExclusionList)
      setExclusionAppListValue(historyExclusionAppList)
      setAutoMaskListValue(autoMaskWordsList)
    }
  }, [isAppReady])

  const durationOptionsMapByType: {
    readonly [key: string]: readonly number[]
  } = {
    days: [1, 2, 3, 4, 5, 6],
    weeks: [1, 2, 3],
    months: [1, 3, 6, 8],
    year: [1, 2],
  }

  function getAutoClearSettingDurationLabel(
    autoClearSettingsDuration: number,
    autoClearSettingsDurationType: string
  ) {
    const durationTypeMap: Record<string, string> = {
      days:
        autoClearSettingsDuration === 1
          ? t('Day', { ns: 'calendar' })
          : t('Days', { ns: 'calendar' }),
      weeks:
        autoClearSettingsDuration === 1
          ? t('Week', { ns: 'calendar' })
          : t('Weeks', { ns: 'calendar' }),
      months:
        autoClearSettingsDuration === 1
          ? t('Month', { ns: 'calendar' })
          : t('Months', { ns: 'calendar' }),
      year:
        autoClearSettingsDuration === 1
          ? t('Year', { ns: 'calendar' })
          : t('Years', { ns: 'calendar' }),
    }
    const durationTypeLabel = durationTypeMap[autoClearSettingsDurationType]

    return `${autoClearSettingsDuration} ${durationTypeLabel}`
  }

  return (
    <AutoSize disableWidth>
      {({ height }) => {
        return (
          height && (
            <Box className="p-4 py-6 select-none min-w-[320px]">
              <Box className="text-xl my-2 mx-2 flex items-center justify-between">
                <Text className="light">
                  {t('Clipboard History Settings', { ns: 'settings' })}
                </Text>
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
              </Box>
              <Spacer h={3} />
              <SimpleBar style={{ maxHeight: height - 85 }} autoHide={true}>
                <Box className="animate-in fade-in max-w-xl">
                  <Card
                    className={`${
                      !isHistoryEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Capture History', { ns: 'settings' })}
                      </CardTitle>
                      <Switch
                        checked={isHistoryEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsHistoryEnabled(!isHistoryEnabled)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t('Enable history capture', { ns: 'settings' })}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>
                {isHistoryEnabled && (
                  <>
                    <Box className="max-w-xl mt-4 animate-in fade-in">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Capture History Text Length Limits', {
                              ns: 'settings',
                            })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t(
                              'This option lets you customize the minimum and maximum length of text that can be captured in the clipboard history. Setting either value to 0 makes that limit unlimited.',
                              {
                                ns: 'settings',
                              }
                            )}
                          </Text>

                          <Flex className="w-full gap-10 my-4 items-start justify-start">
                            <InputField
                              className="text-md !w-36"
                              type="number"
                              step="1"
                              min={0}
                              small
                              label={t('Minimum length', { ns: 'common' })}
                              value={clipTextMinLength}
                              onBlur={() => {
                                if (clipTextMinLength < 0) {
                                  setClipTextMinLength(0)
                                }
                              }}
                              onChange={e => {
                                const value = e.target.value
                                if (value === '') {
                                  setClipTextMinLength(0)
                                } else {
                                  const number = parseInt(value)
                                  setClipTextMinLength(number)
                                }
                              }}
                            />
                            <InputField
                              className="text-md !w-36"
                              type="number"
                              step="0"
                              min={0}
                              small
                              label={t('Maximum length', { ns: 'common' })}
                              value={clipTextMaxLength}
                              onBlur={() => {
                                if (clipTextMaxLength < 0) {
                                  setClipTextMaxLength(0)
                                }
                              }}
                              onChange={e => {
                                const value = e.target.value
                                if (value === '') {
                                  setClipTextMaxLength(0)
                                } else {
                                  const number = parseInt(value)
                                  setClipTextMaxLength(number)
                                }
                              }}
                            />
                          </Flex>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                              clipTextMinLength === 0 && clipTextMaxLength === 5000
                            }
                            onClick={() => {
                              setClipTextMinLength(0)
                              setClipTextMaxLength(5000)
                            }}
                            className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                          >
                            {t('Reset', { ns: 'common' })}
                          </Button>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="max-w-xl mt-4 animate-in fade-in">
                      <Card
                        className={`${
                          historyPreviewLineLimit == null &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('History Item Preview Max Lines', {
                              ns: 'settings2',
                            })}
                          </CardTitle>
                          <Switch
                            checked={historyPreviewLineLimit !== null}
                            className="ml-auto"
                            onCheckedChange={() => {
                              if (historyPreviewLineLimit) {
                                setHistoryPreviewLineLimit(null)
                              } else {
                                setHistoryPreviewLineLimit(5)
                              }
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t(
                              'Set the maximum number of lines to display in the preview of a history item',
                              {
                                ns: 'settings2',
                              }
                            )}
                          </Text>
                          {historyPreviewLineLimit !== null && (
                            <>
                              <Flex className="w-full gap-10 my-4 items-start justify-start">
                                <InputField
                                  className="text-md !w-36"
                                  type="number"
                                  step="1"
                                  min={1}
                                  max={20}
                                  small
                                  label={t('Preview Max Lines', { ns: 'settings2' })}
                                  value={
                                    historyPreviewLineLimit ? historyPreviewLineLimit : ''
                                  }
                                  onBlur={() => {
                                    if (
                                      historyPreviewLineLimit &&
                                      historyPreviewLineLimit < 0
                                    ) {
                                      setHistoryPreviewLineLimit(null)
                                    }
                                  }}
                                  onChange={e => {
                                    const value = e.target.value
                                    if (value === '') {
                                      setHistoryPreviewLineLimit(null)
                                    } else {
                                      const number = parseInt(value, 10)
                                      setHistoryPreviewLineLimit(number)
                                    }
                                  }}
                                />
                              </Flex>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setHistoryPreviewLineLimit(0)
                                }}
                                className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                              >
                                {t('Reset', { ns: 'common' })}
                              </Button>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="max-w-xl animate-in fade-in mt-4">
                      <Card
                        className={`${
                          !isHistoryAutoUpdateOnCaputureEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Auto-Update on Capture', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isHistoryAutoUpdateOnCaputureEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsHistoryAutoUpdateOnCaputureEnabled(
                                !isHistoryAutoUpdateOnCaputureEnabled
                              )
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t('Enable auto update on capture', { ns: 'settings' })}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="max-w-xl animate-in fade-in mt-4">
                      <Card
                        className={`${
                          !isHistoryAutoTrimOnCaputureEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Auto-Trim Spaces on Capture', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isHistoryAutoTrimOnCaputureEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsHistoryAutoTrimOnCaputureEnabled(
                                !isHistoryAutoTrimOnCaputureEnabled
                              )
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t('Enable auto trim spaces on history capture', {
                              ns: 'settings',
                            })}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="max-w-xl animate-in fade-in mt-4">
                      <Card
                        className={`${
                          !isImageCaptureDisabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Disable Image Capture', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isImageCaptureDisabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsImageCaptureDisabled(!isImageCaptureDisabled)
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t('Disable capturing and storing images from clipboard', {
                              ns: 'settings',
                            })}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="mt-4 max-w-xl animate-in fade-in">
                      <Card
                        className={`${
                          !isAutoFavoriteOnDoubleCopyEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Auto-Star on Double Copy', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isAutoFavoriteOnDoubleCopyEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsAutoFavoriteOnDoubleCopyEnabled(
                                !isAutoFavoriteOnDoubleCopyEnabled
                              )
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t(
                              'Add a star to the copied text when you copy it twice within 1 second. This allows you to quickly add copied text or links to your favorites and easily find it in the clipboard history.',
                              { ns: 'settings' }
                            )}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="mt-4 max-w-xl animate-in fade-in">
                      <Card
                        className={`${
                          !isAutoGenerateLinkCardsEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Auto-Generate Link Card Preview', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isAutoGenerateLinkCardsEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsAutoGenerateLinkCardsEnabled(
                                !isAutoGenerateLinkCardsEnabled
                              )
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t(
                              'Automatically create link card preview in the clipboard history. This allows to quickly view website details without opening or pasting the link.',
                              { ns: 'settings' }
                            )}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="mt-4 max-w-xl animate-in fade-in">
                      <Card
                        className={`${
                          !isAutoPreviewLinkCardsEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Auto-Preview Link on Hover', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isAutoPreviewLinkCardsEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsAutoPreviewLinkCardsEnabled(
                                !isAutoPreviewLinkCardsEnabled
                              )
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t(
                              'Create a preview card on link hover in the clipboard history. This allows you to preview the link before opening or pasting it.',
                              { ns: 'settings' }
                            )}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="mt-4 max-w-xl animate-in fade-in">
                      <Card
                        className={`${
                          !isExclusionAppListEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Excluded Apps List', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isExclusionAppListEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsExclusionAppListEnabled(!isExclusionAppListEnabled)
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground mb-2">
                            {t(
                              'Applications listed below will not have their copy to clipboard action captured in clipboard history. Case insensitive.',
                              { ns: 'settings' }
                            )}
                          </Text>

                          <TextArea
                            className="text-sm"
                            isDisabled={!isExclusionAppListEnabled}
                            label={t(
                              'List each application name or window identifier on a new line.',
                              {
                                ns: 'settings',
                              }
                            )}
                            placeholder={undefined}
                            rows={5}
                            maxRows={15}
                            enableEmoji={false}
                            onBlur={() => {
                              setHistoryExclusionAppList(
                                trimAndRemoveExtraNewlines(exclusionAppListValue)
                              )
                            }}
                            onChange={e => {
                              setExclusionAppListValue(e.target.value)
                            }}
                            value={exclusionAppListValue}
                          />
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="max-w-xl animate-in fade-in mt-4">
                      <Card
                        className={`${
                          !isExclusionListEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Stop Words List', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isExclusionListEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsExclusionListEnabled(!isExclusionListEnabled)
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground mb-2">
                            {t(
                              'Words or sentences listed below will not be captured in clipboard history if found in the copied text. Case insensitive.',
                              { ns: 'settings' }
                            )}
                          </Text>

                          <TextArea
                            className="text-sm"
                            isDisabled={!isExclusionListEnabled}
                            label={t('List each word or sentence on a new line.', {
                              ns: 'settings',
                            })}
                            placeholder={undefined}
                            rows={5}
                            maxRows={15}
                            enableEmoji={false}
                            onBlur={() => {
                              setHistoryExclusionList(
                                trimAndRemoveExtraNewlines(exclusionListValue)
                              )
                            }}
                            onChange={e => {
                              setExclusionListValue(e.target.value)
                            }}
                            value={exclusionListValue}
                          />
                        </CardContent>
                      </Card>
                    </Box>

                    <Box className="max-w-xl animate-in fade-in mt-4">
                      <Card
                        className={`${
                          !isAutoMaskWordsListEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Auto Masking Words List', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isAutoMaskWordsListEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsAutoMaskWordsListEnabled(!isAutoMaskWordsListEnabled)
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground mb-2">
                            {t(
                              'Sensitive words or sentences listed below will automatically be masked if found in the copied text. Case insensitive.',
                              { ns: 'settings' }
                            )}
                          </Text>

                          <TextArea
                            className="text-sm"
                            label={t('List each word or sentence on a new line.', {
                              ns: 'settings',
                            })}
                            placeholder={undefined}
                            isDisabled={!isAutoMaskWordsListEnabled}
                            rows={5}
                            maxRows={15}
                            enableEmoji={false}
                            onFocus={() => {
                              setIsAutoMaskWordsTextAreaInFocus(true)
                            }}
                            onBlur={() => {
                              setAutoMaskWordsList(
                                trimAndRemoveExtraNewlines(autoMaskListValue)
                              )
                              setIsAutoMaskWordsTextAreaInFocus(false)
                            }}
                            onChange={e => {
                              setAutoMaskListValue(e.target.value)
                            }}
                            value={
                              isAutoMaskWordsTextAreaInFocus
                                ? autoMaskListValue
                                : maskValue(autoMaskListValue)
                            }
                          />
                        </CardContent>
                      </Card>
                    </Box>
                    <Box className="max-w-xl animate-in fade-in mt-4">
                      <Card
                        className={`${
                          !isHistoryDetectLanguageEnabled &&
                          'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Programming Language Detection', { ns: 'settings' })}
                          </CardTitle>
                          <Switch
                            checked={isHistoryDetectLanguageEnabled}
                            className="ml-auto"
                            onCheckedChange={() => {
                              setIsHistoryDetectLanguageEnabled(
                                !isHistoryDetectLanguageEnabled
                              )
                            }}
                          />
                        </CardHeader>
                        <CardContent>
                          <Text className="text-sm text-muted-foreground">
                            {t('Enable programming language detection', {
                              ns: 'settings',
                            })}
                          </Text>
                        </CardContent>
                      </Card>
                    </Box>
                  </>
                )}

                {isHistoryEnabled && isHistoryDetectLanguageEnabled && (
                  <>
                    <Box className="max-w-xl mt-4 animate-in fade-in">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Minimum number of lines to trigger detection', {
                              ns: 'settings',
                            })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <InputField
                            className="text-md !w-36"
                            small
                            label={t('Number of lines', { ns: 'common' })}
                            value={historyDetectLanguageMinLines}
                            onChange={e => {
                              const value = e.target.value
                              if (value === '') {
                                setHistoryDetectLanguageMinLines(0)
                              } else {
                                const number = parseInt(value)
                                if (number) {
                                  setHistoryDetectLanguageMinLines(number)
                                }
                              }
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Box>
                    <Box className="mt-4 max-w-2xl animate-in fade-in">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <CardTitle className="animate-in fade-in text-md font-medium w-full">
                            {t('Programming Language Selection', { ns: 'settings' })}
                            <Text className="mt-2 text-sm text-muted-foreground">
                              {t(
                                'To ensure the best detection accuracy, please select up to 7 languages. Limiting choices improves precision.',
                                { ns: 'settings' }
                              )}
                            </Text>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Box className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 py-2">
                            {languageList.map((language, index) => (
                              <button
                                key={index}
                                className="flex"
                                onClick={() => {
                                  if (
                                    historyDetectLanguagesEnabledList.length >= 7 &&
                                    !historyDetectLanguagesEnabledList.includes(language)
                                  ) {
                                    return
                                  }
                                  setHistoryDetectLanguagesEnabledList(
                                    historyDetectLanguagesEnabledList.includes(language)
                                      ? historyDetectLanguagesEnabledList.filter(
                                          lang => lang !== language
                                        )
                                      : historyDetectLanguagesEnabledList.concat([
                                          language,
                                        ])
                                  )

                                  const newPrioritizedLanguages =
                                    prioritizedLanguages.includes(language)
                                      ? prioritizedLanguages.filter(
                                          lang => lang !== language
                                        )
                                      : prioritizedLanguages.concat([language])

                                  setPrioritizedLanguages(
                                    newPrioritizedLanguages.filter(Boolean)
                                  )
                                  setHistoryDetectLanguagesPrioritizedList(
                                    newPrioritizedLanguages.filter(Boolean)
                                  )
                                }}
                              >
                                <CheckBoxFilter
                                  label={language}
                                  checked={historyDetectLanguagesEnabledList.includes(
                                    language
                                  )}
                                />
                              </button>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>

                    {prioritizedLanguages.length > 0 && (
                      <Box className="mt-4 max-w-2xl animate-in fade-in">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="animate-in fade-in text-md font-medium w-full">
                              {t('Prioritize Language Detection', { ns: 'settings' })}
                              <Text className="mt-2 text-sm text-muted-foreground">
                                {t(
                                  'Drag and drop to prioritize languages for detection. The higher a language is in the list, the higher its detection priority.',
                                  { ns: 'settings' }
                                )}
                              </Text>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <DndContext
                              collisionDetection={closestCenter}
                              onDragEnd={event => {
                                const { active, over } = event
                                if (over?.id && active.id !== over?.id) {
                                  setPrioritizedLanguages(items => {
                                    const oldIndex = items.indexOf(active.id.toString())
                                    const newIndex = items.indexOf(over.id.toString())
                                    const newArray = arrayMove(items, oldIndex, newIndex)
                                    if (!arraysEqual(items, newArray)) {
                                      setHistoryDetectLanguagesPrioritizedList(newArray)
                                    }
                                    return newArray
                                  })
                                }
                              }}
                            >
                              <SortableContext
                                items={prioritizedLanguages}
                                strategy={verticalListSortingStrategy}
                              >
                                {prioritizedLanguages.map(
                                  language =>
                                    language && (
                                      <SortableItem
                                        key={language}
                                        id={language}
                                        language={language}
                                      />
                                    )
                                )}
                              </SortableContext>
                            </DndContext>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </>
                )}

                <Box className="mt-4 max-w-xl animate-in fade-in">
                  <Card
                    className={`${
                      !isAutoClearSettingsEnabled &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Auto-Clear Settings', { ns: 'settings' })}
                      </CardTitle>
                      <Switch
                        checked={isAutoClearSettingsEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsAutoClearSettingsEnabled(!isAutoClearSettingsEnabled)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Configure settings to automatically delete clipboard history items after a specified duration.',
                          { ns: 'settings' }
                        )}
                      </Text>
                      {isAutoClearSettingsEnabled && (
                        <Flex className="mt-6 row justify-start">
                          <Text className="text-sm text-muted-foreground">
                            {t('Auto-delete clipboard history after', { ns: 'settings' })}
                          </Text>

                          <Flex className="mx-2">
                            <Select
                              value={autoClearSettingsDurationType}
                              onValueChange={value => {
                                setAutoClearSettingsDurationType(value)
                                setAutoClearSettingsDuration(1)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">
                                  <span className="font-medium">
                                    {t('Days', { ns: 'calendar' })}
                                  </span>
                                </SelectItem>
                                <SelectItem value="weeks">
                                  <span className="font-medium">
                                    {t('Weeks', { ns: 'calendar' })}
                                  </span>
                                </SelectItem>
                                <SelectItem value="months">
                                  <span className="font-medium">
                                    {t('Months', { ns: 'calendar' })}
                                  </span>
                                </SelectItem>
                                <SelectItem value="year">
                                  <span className="font-medium">
                                    {t('Years', { ns: 'calendar' })}
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Flex>
                          <Flex>
                            <Select
                              value={autoClearSettingsDuration.toString()}
                              onValueChange={value => {
                                setAutoClearSettingsDuration(Number(value))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {durationOptionsMapByType[
                                  autoClearSettingsDurationType as keyof typeof durationOptionsMapByType
                                ].map((duration: number) => (
                                  <SelectItem key={duration} value={duration.toString()}>
                                    <span className="font-medium whitespace-nowrap">
                                      {getAutoClearSettingDurationLabel(
                                        duration,
                                        autoClearSettingsDurationType
                                      )}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Flex>
                        </Flex>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box className="mt-4 max-w-xl animate-in fade-in">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Keep Items on Clear', { ns: 'settings2' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground mb-4">
                        {t(
                          'Configure which items to preserve when clearing clipboard history (both manual and auto-clear operations).',
                          { ns: 'settings2' }
                        )}
                      </Text>
                      <Flex className="flex-col gap-4">
                        <Flex className="items-center justify-between w-full">
                          <Flex className="flex-col justify-start items-start">
                            <Text className="text-[15px] font-semibold">
                              {t('Keep Pinned Items', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t('Preserve pinned items when clearing history', {
                                ns: 'settings2',
                              })}
                            </Text>
                          </Flex>
                          <Switch
                            checked={isKeepPinnedOnClearEnabled}
                            onCheckedChange={checked => {
                              setIsKeepPinnedOnClearEnabled(checked)
                            }}
                          />
                        </Flex>
                        <Flex className="items-center justify-between w-full">
                          <Flex className="flex-col justify-start items-start">
                            <Text className="text-[15px] font-semibold">
                              {t('Keep Starred Items', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t('Preserve starred items when clearing history', {
                                ns: 'settings2',
                              })}
                            </Text>
                          </Flex>
                          <Switch
                            checked={isKeepStarredOnClearEnabled}
                            onCheckedChange={checked => {
                              setIsKeepStarredOnClearEnabled(checked)
                            }}
                          />
                        </Flex>
                      </Flex>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  className="mt-4 max-w-xl animate-in fade-in"
                  id="specialCopyPasteHistory"
                >
                  <Card
                    className={`${
                      !isSpecialCopyPasteHistoryEnabled &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Special Copy/Paste Operations', { ns: 'specialCopyPaste' })}
                      </CardTitle>
                      <Switch
                        checked={isSpecialCopyPasteHistoryEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsSpecialCopyPasteHistoryEnabled(
                            !isSpecialCopyPasteHistoryEnabled
                          )
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground mb-2">
                        {t(
                          'Enable special text transformation options for clipboard history items',
                          { ns: 'specialCopyPaste' }
                        )}
                      </Text>

                      {isSpecialCopyPasteHistoryEnabled && (
                        <>
                          <Text className="text-sm text-muted-foreground mb-4">
                            {t(
                              'Drag and drop category to prioritize its order in the special copy/paste menu.',
                              { ns: 'specialCopyPaste' }
                            )}
                          </Text>
                          <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={event => {
                              const { active, over } = event
                              if (over?.id && active.id !== over?.id) {
                                setLocalCategoriesOrder(items => {
                                  const activeId = active.id.toString()
                                  const overId = over.id.toString()

                                  // Check if both active and over items are in the enabled list
                                  if (
                                    items.includes(activeId) &&
                                    items.includes(overId)
                                  ) {
                                    const oldIndex = items.indexOf(activeId)
                                    const newIndex = items.indexOf(overId)
                                    const newArray = arrayMove(items, oldIndex, newIndex)

                                    // Update the store if array changed
                                    if (!arraysEqual(items, newArray)) {
                                      setSpecialPasteCategoriesOrder(newArray)
                                    }
                                    return newArray
                                  }
                                  return items
                                })
                              }
                            }}
                          >
                            <SortableContext
                              items={localCategoriesOrder}
                              strategy={verticalListSortingStrategy}
                            >
                              <Box className="space-y-4">
                                {orderedCategories
                                  .map(categoryId =>
                                    TRANSFORM_CATEGORIES.find(c => c.id === categoryId)
                                  )
                                  .filter(category => category)
                                  .map(category => {
                                    if (!category) return null

                                    return (
                                      <SortableCategoryItem
                                        key={category.id}
                                        categoryId={category.id}
                                        localCategoriesOrder={localCategoriesOrder}
                                        setLocalCategoriesOrder={setLocalCategoriesOrder}
                                      />
                                    )
                                  })}
                              </Box>
                            </SortableContext>
                          </DndContext>

                          {/* Summary */}
                          <Box className="mt-4 pt-4">
                            <Text className="text-sm font-medium mb-2">
                              {t('Enabled Operations', { ns: 'specialCopyPaste' })} (
                              {enabledSpecialPasteOperations.length}):
                            </Text>
                            {enabledSpecialPasteOperations.length > 0 ? (
                              <Flex className="flex-wrap gap-1 justify-start">
                                {enabledSpecialPasteOperations.map(opId => {
                                  const transform = TEXT_TRANSFORMS.find(
                                    t => t.id === opId
                                  )
                                  return transform ? (
                                    <Badge
                                      key={opId}
                                      variant="graySecondary"
                                      className="font-normal text-xs"
                                    >
                                      {t(transform.label, { ns: 'specialCopyPaste' })}
                                    </Badge>
                                  ) : null
                                })}
                              </Flex>
                            ) : (
                              <Text className="text-sm text-muted-foreground">
                                {t('None', { ns: 'specialCopyPaste' })}
                              </Text>
                            )}
                          </Box>
                          {/* Reset Button */}
                          <Box className="mt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Enable all categories and operations using constants
                                const defaultCategories = [
                                  ...DEFAULT_SPECIAL_PASTE_CATEGORIES,
                                ]
                                setLocalCategoriesOrder(defaultCategories)
                                setSpecialPasteCategoriesOrder(defaultCategories)
                                setEnabledSpecialPasteOperations([
                                  ...DEFAULT_SPECIAL_PASTE_OPERATIONS,
                                ])
                              }}
                            >
                              {t('Enable All', { ns: 'specialCopyPaste' })}
                            </Button>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Spacer h={6} />

                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
                <Spacer h={4} />
              </SimpleBar>
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
