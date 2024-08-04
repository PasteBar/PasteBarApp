import { Dispatch, SetStateAction } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { message } from '@tauri-apps/api/dialog'
import { emit } from '@tauri-apps/api/event'
import {
  clipboardHistoryStoreAtom,
  createClipHistoryItemIds,
  createMenuItemFromHistoryId,
  hasDashboardItemCreate,
  isCreatingMenuItem,
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
  Filter,
  GalleryVertical,
  ListFilter,
  MenuSquare,
  MinusSquare,
  PanelTop,
  Pin,
  PinOff,
  Shrink,
  SquareAsterisk,
  Star,
  StarOff,
  TrashIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ensureUrlPrefix } from '~/lib/utils'

import {
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

import { LinkMetadata } from '~/types/history'
import { CreateDashboardItemType } from '~/types/menu'

interface ClipboardHistoryRowContextMenuProps {
  historyId: UniqueIdentifier
  value: string | null
  arrLinks: string[]
  isImage: boolean
  isText: boolean
  copiedFromApp: string | null
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
  onCopyPaste: (id: UniqueIdentifier, delay?: number) => void
  setHistoryFilters?: Dispatch<SetStateAction<string[]>>
  setAppFilters?: Dispatch<SetStateAction<string[]>>
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
  isSelected,
  hasLinkCard,
  setSavingItem,
  setLargeViewItemId,
  setSelectHistoryItem,
  onCopyPaste,
}: ClipboardHistoryRowContextMenuProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    copyPasteDelay,
    setCopyPasteDelay,
    historyDetectLanguagesEnabledList,
    setIsExclusionAppListEnabled,
    addToHistoryExclusionAppList,
  } = useAtomValue(settingsStoreAtom)

  const { deleteClipboardHistoryItem } = useAtomValue(clipboardHistoryStoreAtom)

  const { updateClipboardHistoryById } = useUpdateClipboardHistoryById()
  const { deleteClipboardHistoryByIds } = useDeleteClipboardHistoryByIds()
  const { pinnedClipboardHistoryByIds } = usePinnedClipboardHistoryByIds()

  const navigate = useNavigate()

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
      <ContextMenuContent className="w-[190px]">
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
        <ContextMenuItem
          onClick={async e => {
            await deleteClipboardHistoryByIds({ historyIds: [historyId] })
            deleteClipboardHistoryItem(historyId)
          }}
        >
          <Flex>
            <Text className="!text-red-500 dark:!text-red-600">
              {t('Delete', { ns: 'common' })}
            </Text>
          </Flex>
          <div className="ml-auto">
            <TrashIcon className="h-4 w-4 text-red-500 dark:!text-red-600" />
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  )
}
