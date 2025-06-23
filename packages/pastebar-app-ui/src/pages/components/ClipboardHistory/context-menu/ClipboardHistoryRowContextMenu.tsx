import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { message } from '@tauri-apps/api/dialog'
import { emit } from '@tauri-apps/api/event'
import {
  createClipHistoryItemIds,
  createMenuItemFromHistoryId,
  DEFAULT_SPECIAL_PASTE_CATEGORIES,
  hasDashboardItemCreate,
  isCreatingMenuItem,
  isKeyAltPressed,
  settingsStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  ArrowDownToLine,
  CheckSquare,
  ClipboardPaste,
  ClipboardX,
  EqualNot,
  Expand,
  GalleryVertical,
  ListFilter,
  MenuSquare,
  MinusSquare,
  PanelTop,
  Pin,
  PinOff,
  Settings,
  Shrink,
  SquareAsterisk,
  Star,
  StarOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { TRANSFORM_CATEGORIES, type TransformCategory } from '~/lib/text-transforms'
import { ensureUrlPrefix } from '~/lib/utils'

import {
  Badge,
  Box,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  Flex,
  Text,
} from '~/components/ui'

import {
  useDeleteClipboardHistoryByIds,
  usePinnedClipboardHistoryByIds,
  useUpdateClipboardHistoryById,
} from '~/hooks/queries/use-history-items'
import { useSignal } from '~/hooks/use-signal'
import { useSpecialCopyPasteHistoryItem } from '~/hooks/use-special-copypaste-history-item'

import { LinkMetadata } from '~/types/history'
import { CreateDashboardItemType } from '~/types/menu'

interface ClipboardHistoryRowContextMenuProps {
  historyId: UniqueIdentifier
  value: string | null
  arrLinks: string[]
  isImage: boolean
  isText: boolean
  copiedFromApp?: string | null
  isMasked: boolean
  isImageData: boolean
  isMp3: boolean | undefined
  hasLinkCard: boolean | undefined | string | null
  isSelected: boolean
  isLargeView: boolean
  isPinned: boolean
  isFavorite: boolean
  detectedLanguage: string | null
  setLargeViewItemId: (historyId: UniqueIdentifier | null) => void
  setSavingItem: (historyId: UniqueIdentifier | null) => void
  invalidateClipboardHistoryQuery?: () => void
  generateLinkMetaData?: (
    historyId: UniqueIdentifier,
    url: string
  ) => Promise<LinkMetadata | void>
  removeLinkMetaData?: (historyId: UniqueIdentifier) => Promise<void>
  setSelectHistoryItem: (id: UniqueIdentifier) => void
  setSelectedHistoryItems?: (ids: UniqueIdentifier[]) => void
  selectedHistoryItems?: UniqueIdentifier[]
  onCopyPaste: (id: UniqueIdentifier, delay?: number) => void
  setHistoryFilters?: Dispatch<SetStateAction<string[]>>
  setAppFilters?: Dispatch<SetStateAction<string[]>>
  onDeleteConfirmationChange?: (
    historyId: UniqueIdentifier | null,
    isMultiSelect?: boolean
  ) => void
}

export default function ClipboardHistoryRowContextMenu({
  historyId,
  value,
  copiedFromApp,
  arrLinks,
  isImage,
  isText,
  isMp3,
  isImageData,
  isLargeView,
  isMasked,
  isPinned,
  isFavorite,
  detectedLanguage,
  invalidateClipboardHistoryQuery = () => {},
  generateLinkMetaData = () => Promise.resolve(),
  removeLinkMetaData = () => Promise.resolve(),
  setHistoryFilters = () => {},
  setAppFilters = () => {},
  setSelectedHistoryItems = () => {},
  isSelected,
  hasLinkCard,
  setSavingItem,
  setLargeViewItemId,
  setSelectHistoryItem,
  selectedHistoryItems,
  onCopyPaste,
  onDeleteConfirmationChange = () => {},
}: ClipboardHistoryRowContextMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    copyPasteDelay,
    setCopyPasteDelay,
    historyDetectLanguagesEnabledList,
    setIsExclusionAppListEnabled,
    addToHistoryExclusionAppList,
    enabledSpecialPasteOperations,
    specialPasteCategoriesOrder,
    isSpecialCopyPasteHistoryEnabled,
  } = useAtomValue(settingsStoreAtom)

  const [specialActionInProgress, setSpecialActionInProgress] = useState<string | null>(
    null
  )
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Moved hook declarations before useHotkeys to resolve TS errors
  const { updateClipboardHistoryById } = useUpdateClipboardHistoryById()
  const { deleteClipboardHistoryByIds } = useDeleteClipboardHistoryByIds()
  const { pinnedClipboardHistoryByIds } = usePinnedClipboardHistoryByIds()

  // Track pending delete ID for two-step deletion
  const [pendingDeleteId, setPendingDeleteId] = useState<UniqueIdentifier | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
        deleteTimerRef.current = null
      }
    }
  }, [])

  const { specialCopy, specialPaste } = useSpecialCopyPasteHistoryItem()

  // Ensure we always have an array of categories
  const categoriesOrder = specialPasteCategoriesOrder || [
    ...DEFAULT_SPECIAL_PASTE_CATEGORIES,
  ]

  // Filter categories to only include those with enabled transforms
  const categoriesWithTransforms = categoriesOrder
    .map(categoryId => TRANSFORM_CATEGORIES.find(c => c.id === categoryId))
    .filter((category): category is TransformCategory => {
      if (!category || !categoriesOrder.includes(category.id)) return false

      // Check if category has any enabled transforms
      if (category.subcategories) {
        // For categories with subcategories, check if any subcategory has enabled transforms
        const hasEnabledSubcategories = category.subcategories.some(subcategory =>
          subcategory.transforms.some(transform =>
            enabledSpecialPasteOperations.includes(transform.id)
          )
        )
        return hasEnabledSubcategories
      } else {
        // For categories with transforms, check if any transform is enabled
        const enabledTransforms =
          category.transforms?.filter(transform =>
            enabledSpecialPasteOperations.includes(transform.id)
          ) || []
        return enabledTransforms.length > 0
      }
    })

  const hasEnabledCategories = categoriesWithTransforms.length > 0

  const errorMessage = (err: string) => {
    message(
      t('Errors:::Something went wrong! {{err}} Please try again.', {
        ns: 'common',
        err,
      }),
      'Error'
    )
  }

  if (historyId == null) {
    return null
  }

  return (
    <ContextMenuPortal>
      <ContextMenuContent
        className="max-w-[210px]"
        onInteractOutside={e => {
          // Prevent closing on interaction outside during deletion confirmation
          if (pendingDeleteId) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={e => {
          // Allow escape to close even during confirmation
          setPendingDeleteId(null)
        }}
        onKeyDown={e => {
          // Handle Delete/Backspace keys
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault()
            e.stopPropagation()

            if (isSelected && selectedHistoryItems && selectedHistoryItems.length > 1) {
              // Multi-select delete
              if (pendingDeleteId === 'multi') {
                // Confirm multi-delete
                deleteClipboardHistoryByIds({ historyIds: selectedHistoryItems })
                setTimeout(() => {
                  setSelectedHistoryItems([])
                }, 400)
                setPendingDeleteId(null)
                if (deleteTimerRef.current) {
                  clearTimeout(deleteTimerRef.current)
                }
              } else {
                // Start multi-delete confirmation
                setPendingDeleteId('multi')
                onDeleteConfirmationChange?.(null, true)
                deleteTimerRef.current = setTimeout(() => {
                  setPendingDeleteId(null)
                  onDeleteConfirmationChange?.(null, false)
                }, 3000)
              }
            } else {
              // Single delete
              if (pendingDeleteId === historyId) {
                // Confirm single delete
                deleteClipboardHistoryByIds({ historyIds: [historyId] })
                setPendingDeleteId(null)
                if (deleteTimerRef.current) {
                  clearTimeout(deleteTimerRef.current)
                }
              } else {
                // Start single delete confirmation
                setPendingDeleteId(historyId)
                onDeleteConfirmationChange?.(historyId, false)
                deleteTimerRef.current = setTimeout(() => {
                  setPendingDeleteId(null)
                  onDeleteConfirmationChange?.(null, false)
                }, 3000)
              }
            }
          }
        }}
      >
        <ContextMenuItem
          onClick={() => {
            setSelectHistoryItem(historyId)
          }}
        >
          {isSelected ? (
            <>
              {t('Deselect', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <MinusSquare size={15} />
              </div>
            </>
          ) : (
            <>
              {t('Select', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <CheckSquare size={15} />
              </div>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {
            onCopyPaste(historyId)
          }}
        >
          {t('Copy & Paste', { ns: 'contextMenus' })}
          <Flex className="ml-auto">
            <Flex className="text-gray-800 relative">
              <Box className="py-0 px-2 font-normal pr-2">
                <Text className="text-xs text-gray-400/80">
                  {copyPasteDelay > 0 ? `delay ${copyPasteDelay}s` : 'no delay'}
                </Text>
              </Box>
            </Flex>
            <ClipboardPaste size={15} />
          </Flex>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            {t('Paste Delay', { ns: 'contextMenus' })} ...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuCheckboxItem
              checked={copyPasteDelay === 1}
              onSelect={() => {
                setCopyPasteDelay(1)
                onCopyPaste(historyId, 1)
              }}
            >
              <Text>1 {t('second', { ns: 'common' })}</Text>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={copyPasteDelay === 2}
              onSelect={() => {
                setCopyPasteDelay(2)
                onCopyPaste(historyId, 2)
              }}
            >
              <Text>2 {t('seconds', { ns: 'common' })}</Text>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={copyPasteDelay === 3}
              onSelect={() => {
                setCopyPasteDelay(3)
                onCopyPaste(historyId, 3)
              }}
            >
              <Text>3 {t('seconds', { ns: 'common' })}</Text>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={copyPasteDelay === 4}
              onSelect={() => {
                setCopyPasteDelay(4)
                onCopyPaste(historyId, 4)
              }}
            >
              <Text>4 {t('seconds', { ns: 'common' })}</Text>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={copyPasteDelay === 5}
              onSelect={() => {
                setCopyPasteDelay(5)
                onCopyPaste(historyId, 5)
              }}
            >
              <Text>5 {t('seconds', { ns: 'common' })}</Text>
            </ContextMenuCheckboxItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Special Copy/Paste submenu - only show for text items when enabled */}
        {isSpecialCopyPasteHistoryEnabled && !isImage && value && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {isKeyAltPressed.value
                  ? t('Special Paste', { ns: 'specialCopyPaste' })
                  : t('Special Copy', { ns: 'specialCopyPaste' })}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                {categoriesWithTransforms.map(category => {
                  // Handle categories with subcategories (like Format Converter)
                  if (category.subcategories) {
                    const enabledSubcategories = category.subcategories.filter(
                      subcategory =>
                        subcategory.transforms.some(transform =>
                          enabledSpecialPasteOperations.includes(transform.id)
                        )
                    )

                    return (
                      <ContextMenuSub key={category.id}>
                        <ContextMenuSubTrigger>
                          {t(category.label, {
                            ns: 'specialCopyPaste',
                          })}
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                          {enabledSubcategories.map(subcategory => {
                            const enabledTransforms = subcategory.transforms.filter(
                              transform =>
                                enabledSpecialPasteOperations.includes(transform.id)
                            )

                            return (
                              <ContextMenuSub key={subcategory.id}>
                                <ContextMenuSubTrigger>
                                  {t(subcategory.label, {
                                    ns: 'specialCopyPaste',
                                  })}
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-44">
                                  {enabledTransforms.map(transform => (
                                    <ContextMenuItem
                                      key={transform.id}
                                      disabled={specialActionInProgress === transform.id}
                                      onClick={async () => {
                                        setSpecialActionInProgress(transform.id)
                                        try {
                                          if (isKeyAltPressed.value) {
                                            await specialPaste(
                                              historyId,
                                              value,
                                              transform.id
                                            )
                                          } else {
                                            await specialCopy(
                                              historyId,
                                              value,
                                              transform.id
                                            )
                                          }
                                          setSpecialActionInProgress(null)
                                        } catch (error) {
                                          console.error(
                                            'Special copy/paste failed:',
                                            error
                                          )
                                          setSpecialActionInProgress(null)
                                        }
                                      }}
                                    >
                                      {t(transform.label, {
                                        ns: 'specialCopyPaste',
                                      })}
                                      {specialActionInProgress === transform.id && (
                                        <div className="ml-auto">
                                          <Text className="text-xs text-muted-foreground">
                                            ...
                                          </Text>
                                        </div>
                                      )}
                                    </ContextMenuItem>
                                  ))}
                                </ContextMenuSubContent>
                              </ContextMenuSub>
                            )
                          })}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )
                  } else {
                    // Handle categories with direct transforms
                    const enabledTransforms =
                      category.transforms?.filter(transform =>
                        enabledSpecialPasteOperations.includes(transform.id)
                      ) || []

                    return (
                      <ContextMenuSub key={category.id}>
                        <ContextMenuSubTrigger>
                          {t(category.label, {
                            ns: 'specialCopyPaste',
                          })}
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-44">
                          {enabledTransforms.map(transform => (
                            <ContextMenuItem
                              key={transform.id}
                              disabled={specialActionInProgress === transform.id}
                              onClick={async () => {
                                setSpecialActionInProgress(transform.id)
                                try {
                                  if (isKeyAltPressed.value) {
                                    await specialPaste(historyId, value, transform.id)
                                  } else {
                                    await specialCopy(historyId, value, transform.id)
                                  }
                                  setSpecialActionInProgress(null)
                                } catch (error) {
                                  console.error('Special copy/paste failed:', error)
                                  setSpecialActionInProgress(null)
                                }
                              }}
                            >
                              {t(transform.label, {
                                ns: 'specialCopyPaste',
                              })}
                              {specialActionInProgress === transform.id && (
                                <div className="ml-auto">
                                  <Text className="text-xs text-muted-foreground">
                                    ...
                                  </Text>
                                </div>
                              )}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )
                  }
                })}
                {hasEnabledCategories && <ContextMenuSeparator />}
                <ContextMenuItem
                  onClick={() => {
                    navigate('/app-settings/history#specialCopyPasteHistory', {
                      replace: true,
                    })
                  }}
                >
                  {t('Special Settings', { ns: 'specailCopyPaste' })}
                  <div className="ml-auto">
                    <Settings size={15} />
                  </div>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}

        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            setLargeViewItemId(isLargeView ? null : historyId)
          }}
        >
          {isLargeView
            ? t('Close', { ns: 'contextMenus' })
            : t('View', { ns: 'contextMenus' })}
          <div className="ml-auto">
            {isLargeView ? <Shrink size={15} /> : <Expand size={15} />}
          </div>
        </ContextMenuItem>
        <ContextMenuSeparator />

        {arrLinks?.length > 0 && (
          <>
            {arrLinks[0] === value && !isImage && !hasLinkCard && (
              <ContextMenuItem
                onClick={async () => {
                  await generateLinkMetaData(historyId, ensureUrlPrefix(arrLinks[0]))
                  invalidateClipboardHistoryQuery()
                }}
              >
                {t('Add Link Card', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <PanelTop size={15} />
                </div>
              </ContextMenuItem>
            )}
            {hasLinkCard && (
              <ContextMenuItem
                onClick={async () => {
                  await removeLinkMetaData(historyId)
                  invalidateClipboardHistoryQuery()
                }}
              >
                {t('Remove Link Card', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <PanelTop size={15} />
                </div>
              </ContextMenuItem>
            )}
          </>
        )}

        <ContextMenuItem
          onClick={async () => {
            await pinnedClipboardHistoryByIds({
              historyIds: [historyId],
              isPinned: !Boolean(isPinned),
            })
            await queryClient.invalidateQueries({
              queryKey: ['find_clipboard_histories_by_value_or_filters'],
            })
          }}
        >
          {isPinned
            ? t('UnPin', { ns: 'contextMenus' })
            : t('Pin', { ns: 'contextMenus' })}
          <div className="ml-auto">
            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
          </div>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={async () => {
            await updateClipboardHistoryById({
              historyId,
              updatedData: { isFavorite: !Boolean(isFavorite), historyId },
            })
            await queryClient.invalidateQueries({
              queryKey: ['find_clipboard_histories_by_value_or_filters'],
            })
          }}
        >
          {isFavorite
            ? t('Remove Star', { ns: 'contextMenus' })
            : t('Star', { ns: 'contextMenus' })}
          <div className="ml-auto">
            {isFavorite ? <StarOff size={15} /> : <Star size={15} />}
          </div>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            {t('Add to', { ns: 'contextMenus' })} ...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-28">
            <ContextMenuItem
              onClick={() => {
                hasDashboardItemCreate.value = CreateDashboardItemType.CLIP
                createClipHistoryItemIds.value = [historyId]
              }}
            >
              {t('AddTo:::Clip on Board', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <GalleryVertical size={15} />
              </div>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                if (window.isMainWindow) {
                  navigate('/menu', { replace: true })
                } else {
                  emit('navigate-main', {
                    location: '/menu',
                    isSetFocus: true,
                  })
                }
                setTimeout(() => {
                  createMenuItemFromHistoryId.value = historyId.toString()
                  isCreatingMenuItem.value = true
                }, 300)
              }}
            >
              {t('AddTo:::Paste Menu', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <MenuSquare size={15} />
              </div>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {copiedFromApp && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>{copiedFromApp} ...</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onClick={() => {
                  setAppFilters([copiedFromApp])
                  setHistoryFilters(['source'])
                }}
              >
                {t('AddTo:::Add to Filter by Source', { ns: 'contextMenus' })}
                <div className="ml-auto pl-2">
                  <ListFilter size={15} />
                </div>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  addToHistoryExclusionAppList(copiedFromApp)
                  setIsExclusionAppListEnabled(true)
                  deleteClipboardHistoryByIds({ historyIds: [historyId] })
                }}
              >
                {t('AddTo:::Add to Exclude and Delete', { ns: 'contextMenus' })}
                <div className="ml-auto pl-2">
                  <ClipboardX size={15} />
                </div>
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        <ContextMenuSeparator />
        {(arrLinks?.length > 0 && !detectedLanguage) ||
          (isText && (
            <>
              <ContextMenuItem
                onClick={() => {
                  updateClipboardHistoryById({
                    historyId,
                    updatedData: { isMasked: !Boolean(isMasked), historyId },
                  })
                }}
              >
                {isMasked
                  ? t('Unmask Secret', { ns: 'contextMenus' })
                  : t('Mask Secret', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <SquareAsterisk size={15} />
                </div>
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          ))}
        {detectedLanguage && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t('Detected Language', { ns: 'contextMenus' })} ...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {historyDetectLanguagesEnabledList.map(lang => (
                  <ContextMenuCheckboxItem
                    key={lang}
                    checked={detectedLanguage === lang}
                    onSelect={() => {
                      updateClipboardHistoryById({
                        historyId,
                        updatedData: { detectedLanguage: lang, isCode: true, historyId },
                      })
                    }}
                  >
                    <Text>{lang}</Text>
                  </ContextMenuCheckboxItem>
                ))}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onSelect={() => {
                    updateClipboardHistoryById({
                      historyId,
                      updatedData: { isCode: false, isText: true, historyId },
                    })
                  }}
                >
                  <EqualNot size={16} className="mr-2" />
                  <Text>{t('not a code', { ns: 'contextMenus' })}</Text>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}

        {(isImage || isImageData) && (
          <ContextMenuItem
            onClick={() => {
              invoke('save_to_file_history_item', { historyId, asImage: true })
                .then(res => {
                  if (res === 'saved') {
                    setSavingItem(historyId)
                    setTimeout(() => {
                      setSavingItem(null)
                    }, 1600)
                  } else if (res !== 'cancel') {
                    errorMessage(t('Errors:::Cant save image file', { ns: 'common' }))
                    console.error(
                      t('Errors:::Failed to save image file', { ns: 'common' }),
                      res
                    )
                  }
                })
                .catch(() => {
                  errorMessage(t('Errors:::Cant save image file', { ns: 'common' }))
                })
            }}
          >
            {t('Save as Image File', { ns: 'contextMenus' })}
            <div className="ml-auto pl-2">
              <ArrowDownToLine size={15} />
            </div>
          </ContextMenuItem>
        )}
        {isMp3 ? (
          <ContextMenuItem
            onClick={() => {
              invoke('save_to_file_history_item', { historyId, asMp3: true })
                .then(res => {
                  if (res === 'saved') {
                    setSavingItem(historyId)
                    setTimeout(() => {
                      setSavingItem(null)
                    }, 1600)
                  } else if (res !== 'cancel') {
                    errorMessage(t('Errors:::Cant save file', { ns: 'common' }))
                    console.error(
                      t('Errors:::Failed to save file', { ns: 'common' }),
                      res
                    )
                  }
                })
                .catch(() => {
                  errorMessage(t('Errors:::Cant save file', { ns: 'common' }))
                })
            }}
          >
            {t('Save as Mp3 File', { ns: 'contextMenus' })}
            <div className="ml-auto pl-2">
              <ArrowDownToLine size={15} />
            </div>
          </ContextMenuItem>
        ) : (
          !(isImage && !arrLinks?.length) && (
            <ContextMenuItem
              onClick={() => {
                invoke('save_to_file_history_item', { historyId })
                  .then(res => {
                    if (res === 'saved') {
                      setSavingItem(historyId)
                      setTimeout(() => {
                        setSavingItem(null)
                      }, 1600)
                    } else if (res !== 'cancel') {
                      errorMessage(t('Errors:::Cant save to file', { ns: 'common' }))
                    }
                  })
                  .catch(() => {
                    errorMessage(t('Errors:::Cant save to file', { ns: 'common' }))
                  })
              }}
            >
              {t('Save as Text File', { ns: 'contextMenus' })}
              <div className="ml-auto pl-2">
                <ArrowDownToLine size={15} />
              </div>
            </ContextMenuItem>
          )
        )}

        <ContextMenuSeparator />
        {isSelected && selectedHistoryItems && selectedHistoryItems.length > 1 ? (
          <ContextMenuItem
            className={
              pendingDeleteId === 'multi' ? 'bg-red-500/20 dark:bg-red-600/20' : ''
            }
            onSelect={async e => {
              e.preventDefault()

              if (pendingDeleteId === 'multi') {
                await deleteClipboardHistoryByIds({ historyIds: selectedHistoryItems })
                setTimeout(() => {
                  setSelectedHistoryItems([])
                }, 400)
                setPendingDeleteId(null)
                if (deleteTimerRef.current) {
                  clearTimeout(deleteTimerRef.current)
                }
              } else {
                setPendingDeleteId('multi')
                onDeleteConfirmationChange?.(null, true)
                deleteTimerRef.current = setTimeout(() => {
                  setPendingDeleteId(null)
                  onDeleteConfirmationChange?.(null, false)
                }, 3000)
              }
            }}
          >
            <Flex>
              <Text className="!text-red-500 dark:!text-red-600">
                {pendingDeleteId !== 'multi'
                  ? t('Delete', { ns: 'common' })
                  : t('Click to Confirm', { ns: 'common' })}
                <Badge
                  variant="destructive"
                  className="bg-red-500 ml-1 py-0 font-semibold"
                >
                  {selectedHistoryItems.length}
                </Badge>
              </Text>
            </Flex>
            {pendingDeleteId !== 'multi' && (
              <div className="ml-auto">
                <Badge variant="default" className="ml-1 py-0 font-semibold">
                  DEL
                </Badge>
              </div>
            )}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className={
              pendingDeleteId === historyId ? 'bg-red-500/20 dark:bg-red-600/20' : ''
            }
            onSelect={async e => {
              e.preventDefault()

              if (pendingDeleteId === historyId) {
                await deleteClipboardHistoryByIds({ historyIds: [historyId] })
                setPendingDeleteId(null)
                if (deleteTimerRef.current) {
                  clearTimeout(deleteTimerRef.current)
                }
              } else {
                setPendingDeleteId(historyId)
                onDeleteConfirmationChange?.(historyId, false)
                deleteTimerRef.current = setTimeout(() => {
                  setPendingDeleteId(null)
                  onDeleteConfirmationChange?.(null, false)
                }, 3000)
              }
            }}
          >
            <Flex>
              <Text className="!text-red-500 dark:!text-red-600">
                {pendingDeleteId !== historyId
                  ? t('Delete', { ns: 'common' })
                  : t('Click to Confirm', { ns: 'common' })}
              </Text>
            </Flex>
            {pendingDeleteId !== historyId && (
              <div className="ml-auto">
                <Badge variant="default" className="ml-1 py-0 font-semibold">
                  DEL
                </Badge>
              </div>
            )}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenuPortal>
  )
}
