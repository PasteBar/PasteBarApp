import { memo, useCallback, useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useSignals } from '@preact/signals-react/runtime'
import { invoke } from '@tauri-apps/api'
import { message } from '@tauri-apps/api/dialog'
import createBoardTree from '~/libs/create-board-tree'
import {
  collectionsStoreAtom,
  createMenuItemFromClipId,
  creatingClipItemBoardId,
  isCreatingMenuItem,
  newClipItemId,
  settingsStoreAtom,
  showClipsMoveOnBoardId,
  showDeleteClipConfirmationId,
  showEditClipId,
  showEditClipNameId,
  showLargeViewClipId,
  showLinkedMenuId,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  BookOpenText,
  CircleOff,
  ClipboardCheck,
  ClipboardEdit,
  ClipboardMinus,
  Contact,
  Copy,
  Expand,
  FileText,
  Locate,
  MenuSquare,
  MessageSquareText,
  Move,
  NotebookPen,
  PanelTopClose,
  PanelTopOpen,
  Pencil,
  Pin,
  PinOff,
  Star,
  StarOff,
  TrashIcon,
  XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CUSTOM_ICON_NAMES, CustomIcon } from '~/components/icons'
import SimpleBar from '~/components/libs/simplebar-react'
import {
  Box,
  Button,
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

import { useUpdateMovedClipsInCollection } from '~/hooks/queries/use-collections'
import {
  useCreateItem,
  useDeleteItemById,
  useDuplicateItem,
  usePinnedClipsByIds,
  useUpdateItemById,
} from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { BOARD } from '../../Dashboard'
import { Board } from '../Board'
import { Clip } from '../ClipCard'
import { getNoteOptions, parseItemOptions, shouldShowNoteIcon } from '../utils'

interface ClipsCardContextMenuProps {
  itemId: UniqueIdentifier
  icon?: string | null
  iconVisibility?: string | null
  description?: string | null
  itemOptions?: string | null
  isShowDetails: boolean | undefined
  boardId: UniqueIdentifier | null
  tabId: UniqueIdentifier | null
  isSelected: boolean | undefined
  isImage: boolean | undefined
  isImageData: boolean | undefined
  isMp3: boolean | undefined
  arrLinks: string[] | undefined
  setShowDetails: (id: UniqueIdentifier | null) => void
  setSelectedItemId: (id: UniqueIdentifier) => void
  isPinned: boolean | undefined
  isMenu: boolean | undefined
  isPinnedBoard: boolean | undefined
  isFavorite: boolean | undefined
  isLargeView: boolean | undefined
}

export default function ClipsCardContextMenuComponent({
  itemId,
  setShowDetails,
  isLargeView,
  isShowDetails,
  isImage,
  isImageData,
  isMp3,
  arrLinks,
  isSelected,
  isPinned,
  isMenu,
  icon,
  iconVisibility,
  description,
  itemOptions,
  isPinnedBoard,
  isFavorite,
  boardId,
  tabId,
  setSelectedItemId,
}: ClipsCardContextMenuProps) {
  useSignals()
  const { t } = useTranslation()
  const { updateMovedClips } = useUpdateMovedClipsInCollection()

  const { duplicateItem } = useDuplicateItem()
  const { deleteItemById } = useDeleteItemById()
  const { updateItemById } = useUpdateItemById()
  const { updatePinnedClipsByIds } = usePinnedClipsByIds()
  const { setIsShowPinned, isShowPinned } = useAtomValue(uiStoreAtom)
  const { isNoteIconsEnabled, defaultNoteIconType } = useAtomValue(settingsStoreAtom)
  const { createNewItem } = useCreateItem()
  const navigate = useNavigate()
  const showDeleteThisClipConfirmation = useSignal(false)

  const { clipItems, tabs, currentTab, setCurrentTab, currentCollectionId } =
    useAtomValue(collectionsStoreAtom)

  const createMemorizedBoardTree = useCallback(() => {
    return createBoardTree(clipItems, currentTab).filter(b => b.id !== itemId)
  }, [clipItems, currentTab, itemId])

  const createMemorizedBoardItems = useCallback(() => {
    return createBoardTree(clipItems, currentTab, boardId?.toString())
      .filter(b => b.id !== itemId)
      .sort((a, b) => a.orderNumber - b.orderNumber)
  }, [clipItems, currentTab, itemId, boardId])

  useEffect(() => {
    if (showDeleteThisClipConfirmation.value) {
      showDeleteClipConfirmationId.value = itemId
      setTimeout(() => {
        showDeleteThisClipConfirmation.value = false
        showDeleteClipConfirmationId.value = null
      }, 3000)
    }
  }, [showDeleteThisClipConfirmation.value])

  const copyToTab = async function (targetTabId?: UniqueIdentifier, isMove = false) {
    if (!currentCollectionId || !targetTabId || !boardId) {
      return
    }

    const tabId = targetTabId.toString()

    const targetTabBoardTree = createBoardTree(clipItems, tabId)

    let clipToBoardId = targetTabBoardTree.find(
      board => board.name === t('Moved Clips Panel', { ns: 'dashboard' })
    )?.id

    if (!clipToBoardId) {
      const targetTabColor = tabs.find(tab => tab.tabId === tabId)?.tabColor
      const newMovedClipsBoard = {
        name: t('Moved Clips Panel', { ns: 'dashboard' }),
        isBoard: true,
        tabId,
        color: targetTabColor,
        description: t('Panel for moved or copied items from other tabs', {
          ns: 'dashboard',
        }),
        parentId: null,
        collectionId: currentCollectionId,
        orderNumber: 0,
      }

      const newBoardId = await createNewItem({
        item: newMovedClipsBoard,
      })

      targetTabBoardTree
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .unshift({
          ...newMovedClipsBoard,
          id: newBoardId,
          layout: '',
          type: 'board',
          color: null,
          showDescription: true,
          layoutItemsMaxWidth: '',
          layoutSplit: 1,
        })

      const updatedMoveClips = targetTabBoardTree.map((board, i) => ({
        itemId: board.id,
        parentId: null,
        tabId: board.tabId,
        collectionId: currentCollectionId,
        orderNumber: i,
      }))

      updateMovedClips({ updatedMoveClips })

      clipToBoardId = newBoardId
    }

    if (clipToBoardId) {
      const boardId = clipToBoardId.toString()

      const newClipId = isMove
        ? itemId
        : await duplicateItem({
            itemId,
            boardId,
            tabId,
            collectionId: currentCollectionId,
          })

      creatingClipItemBoardId.value = boardId

      const targetBoardTree = createBoardTree(
        clipItems,
        tabId.toString(),
        boardId?.toString()
      )

      targetBoardTree
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .unshift({
          parentId: boardId,
          tabId,
          id: newClipId,
          type: 'clip',
          orderNumber: 0,
          createdAt: 0,
          value: '',
          name: '',
        })

      const updatedMoveClips = targetBoardTree.map((item, i) => ({
        itemId: item.id,
        parentId: item.parentId,
        tabId: item.tabId,
        collectionId: currentCollectionId,
        orderNumber: i,
      }))

      setCurrentTab(tabId)

      if (isMove) {
        await updateMovedClips({ updatedMoveClips })
      } else {
        setTimeout(async () => {
          await updateMovedClips({ updatedMoveClips })
          newClipItemId.value = newClipId
        }, 300)
      }
    }
  }

  const copyToBoard = async function (targetBoardId?: UniqueIdentifier, isMove = false) {
    if (!currentCollectionId || !targetBoardId) {
      return
    }

    const boardId = targetBoardId.toString()
    const tabId = currentTab.toString()

    const newClipId = isMove
      ? itemId
      : await duplicateItem({
          itemId,
          boardId,
          tabId,
          collectionId: currentCollectionId,
        })

    creatingClipItemBoardId.value = boardId

    const targetBoardTree = createBoardTree(
      clipItems,
      tabId.toString(),
      boardId?.toString()
    )

    targetBoardTree
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .unshift({
        parentId: boardId,
        tabId,
        id: newClipId,
        type: 'clip',
        orderNumber: 0,
        createdAt: 0,
        value: '',
        name: '',
      })

    const updatedMoveClips = targetBoardTree.map((item, i) => ({
      itemId: item.id,
      parentId: item.parentId,
      tabId: item.tabId,
      collectionId: currentCollectionId,
      orderNumber: i,
    }))

    setCurrentTab(tabId)

    if (isMove) {
      await updateMovedClips({ updatedMoveClips })
    } else {
      setTimeout(async () => {
        await updateMovedClips({ updatedMoveClips })
        newClipItemId.value = newClipId
      }, 300)
    }
  }

  const moveItemToPosition = async function ({
    isLast,
    isFirst,
    isAfterItemId,
    moveUp,
    moveDown,
  }: {
    isLast?: boolean
    isFirst?: boolean
    isAfterItemId?: UniqueIdentifier
    moveUp?: boolean
    moveDown?: boolean
  }) {
    const tabId = currentTab.toString()
    const targetBoardTree = createBoardTree(clipItems, tabId, boardId?.toString()).sort(
      (a, b) => a.orderNumber - b.orderNumber
    )

    const itemIndex = targetBoardTree.findIndex(b => b.id === itemId)
    if (itemIndex === -1) return // If itemId not found, return early

    let newIndex
    if (moveUp) {
      newIndex = Math.max(0, itemIndex - 1)
    } else if (moveDown) {
      newIndex = Math.min(targetBoardTree.length - 1, itemIndex + 1)
    } else if (isAfterItemId) {
      const afterIndex = targetBoardTree.findIndex(b => b.id === isAfterItemId)
      if (afterIndex === -1) return
      newIndex = itemIndex > afterIndex ? afterIndex + 1 : afterIndex
    } else {
      newIndex = isFirst ? 0 : isLast ? targetBoardTree.length : 0
    }

    const newTargetBoardTree = arrayMove(targetBoardTree, itemIndex, newIndex)

    if (newTargetBoardTree && newTargetBoardTree.length) {
      const updatedMoveClips = newTargetBoardTree.map((item, i) => ({
        itemId: item.id,
        parentId: item.parentId,
        tabId: item.tabId,
        collectionId: currentCollectionId,
        orderNumber: i,
      }))

      await updateMovedClips({ updatedMoveClips })
    }
  }

  const errorMessage = (err: string) => {
    message(
      t('Errors:::Something went wrong! {{err}} Please try again.', {
        ns: 'common',
        err,
      }),
      'Error'
    )
  }

  const RecursiveSubMenu = ({
    board,
    itemId,
    level,
    onSelect,
  }: {
    board: Board | Clip
    itemId: UniqueIdentifier
    level: number
    onSelect: (boardId: UniqueIdentifier) => void
  }) => {
    if (
      'isBoard' in board &&
      level < 1 &&
      board.children?.some(b => 'isBoard' in b && b.isBoard && b.id !== itemId)
    ) {
      return (
        <ContextMenuSub>
          <ContextMenuSubTrigger
            onClick={() => {
              onSelect(board.id)
            }}
          >
            <span className="capitalize !block max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
              {board.name}
            </span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {board.children
              .filter(b => b.id !== itemId)
              .filter(b => b.type === BOARD)
              .map(subBoard => (
                <RecursiveSubMenu
                  key={subBoard.id}
                  board={subBoard}
                  itemId={itemId}
                  level={level + 1}
                  onSelect={onSelect}
                />
              ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )
    } else {
      return (
        <ContextMenuItem
          key={board.id}
          onSelect={() => {
            onSelect(board.id)
          }}
        >
          <span className="capitalize !block max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
            {board.name}
          </span>
        </ContextMenuItem>
      )
    }
  }

  if (itemId == null) {
    return null
  }

  return (
    <ContextMenuPortal>
      <ContextMenuContent>
        {!isLargeView ? (
          <>
            {!isShowDetails ? (
              <ContextMenuItem
                onClick={() => {
                  setShowDetails(itemId)
                }}
              >
                {t('Open', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <PanelTopOpen size={15} />
                </div>
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  setShowDetails(null)
                }}
              >
                {t('Close', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <PanelTopClose size={15} />
                </div>
              </ContextMenuItem>
            )}

            {showLargeViewClipId.value !== itemId ? (
              <ContextMenuItem
                onClick={() => {
                  showLargeViewClipId.value = itemId
                }}
              >
                {t('View', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <Expand size={14} />
                </div>
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  showLargeViewClipId.value = null
                }}
              >
                {t('Close', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <XCircle size={14} />
                </div>
              </ContextMenuItem>
            )}

            {!isSelected ? (
              <ContextMenuItem
                onClick={() => {
                  setSelectedItemId(itemId)
                }}
              >
                {t('Select', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <ClipboardCheck size={15} />
                </div>
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  setSelectedItemId(itemId)
                }}
              >
                {t('Deselect', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <ClipboardMinus size={15} />
                </div>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator />
          </>
        ) : (
          <>
            <ContextMenuItem
              onClick={() => {
                showLargeViewClipId.value = null
              }}
            >
              {t('Close', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <XCircle size={14} />
              </div>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {showEditClipId.value !== itemId ? (
          <ContextMenuItem
            className="gap-2"
            onClick={() => {
              showEditClipNameId.value = null
              showEditClipId.value = itemId
            }}
          >
            {t('Edit Clip', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <ClipboardEdit size={15} />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onClick={() => {
              showEditClipId.value = null
              showEditClipNameId.value = null
            }}
          >
            {t('Close Edit', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <ClipboardEdit size={15} className="ml-1" />
            </div>
          </ContextMenuItem>
        )}
        {showEditClipNameId.value !== itemId ? (
          <ContextMenuItem
            className="gap-2"
            onClick={() => {
              showEditClipId.value = null
              showEditClipNameId.value = itemId
            }}
          >
            {t('Rename', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <Pencil size={13} />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onClick={() => {
              showEditClipId.value = null
              showEditClipNameId.value = null
            }}
          >
            {t('Close Rename', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <Pencil size={13} className="ml-1" />
            </div>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {!isPinnedBoard ? (
          <>
            {!isPinned ? (
              <ContextMenuItem
                onClick={() => {
                  if (!isPinned && !isShowPinned) {
                    setIsShowPinned(true)
                  }
                  updatePinnedClipsByIds({
                    itemIds: [itemId],
                    isPinned: true,
                  })
                }}
              >
                {t('Pin', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <Pin size={15} />
                </div>
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  updatePinnedClipsByIds({
                    itemIds: [itemId],
                    isPinned: false,
                  })
                }}
              >
                {t('UnPin Clip', { ns: 'contextMenus' })}
                <div className="ml-auto">
                  <PinOff size={15} />
                </div>
              </ContextMenuItem>
            )}
          </>
        ) : (
          <ContextMenuItem
            onClick={() => {
              updatePinnedClipsByIds({
                itemIds: [itemId],
                isPinned: false,
              })
            }}
          >
            {t('UnPin Clip', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <PinOff size={15} />
            </div>
          </ContextMenuItem>
        )}

        {!isFavorite ? (
          <ContextMenuItem
            onClick={() => {
              updateItemById({
                updatedItem: {
                  isFavorite: true,
                  itemId: itemId,
                },
              })
            }}
          >
            {t('Star', { ns: 'contextMenus' })}
            <div className="ml-auto pl-2">
              <Star size={15} className="fill-transparent" />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onClick={() => {
              updateItemById({
                updatedItem: {
                  isFavorite: false,
                  itemId: itemId,
                },
              })
            }}
          >
            {t('Remove Star', { ns: 'contextMenus' })}
            <div className="ml-auto pl-2">
              <StarOff size={15} className="fill-transparent" />
            </div>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {!isMenu ? (
          <ContextMenuItem
            onClick={() => {
              navigate('/menu', { replace: true })
              setTimeout(() => {
                createMenuItemFromClipId.value = itemId
                isCreatingMenuItem.value = true
              }, 300)
            }}
          >
            {t('Add to Menu', { ns: 'contextMenus' })}
            <div className="ml-auto pl-3">
              <MenuSquare size={15} />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onClick={() => {
              navigate('/menu', { replace: true })
              setTimeout(() => {
                showLinkedMenuId.value = itemId.toString()
              }, 300)
            }}
          >
            {t('Locate Menu', { ns: 'contextMenus' })}
            <div className="ml-auto pl-3">
              <Locate size={15} />
            </div>
          </ContextMenuItem>
        )}

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            {t('Manage', { ns: 'contextMenus' })} ...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onClick={async () => {
                if (!currentCollectionId || !tabId || !boardId) {
                  return
                }

                const newClipId = await duplicateItem({
                  itemId,
                  boardId,
                  tabId,
                  collectionId: currentCollectionId,
                })

                creatingClipItemBoardId.value = boardId

                const targetBoardTree = createBoardTree(
                  clipItems,
                  tabId.toString(),
                  boardId?.toString()
                )

                targetBoardTree
                  .sort((a, b) => a.orderNumber - b.orderNumber)
                  .unshift({
                    parentId: boardId,
                    tabId,
                    id: newClipId,
                    type: 'clip',
                    orderNumber: 0,
                    createdAt: 0,
                    value: '',
                    name: t('Copy Clip', { ns: 'dashboard' }),
                  })

                const updatedMoveClips = targetBoardTree.map((item, i) => ({
                  itemId: item.id,
                  parentId: item.parentId,
                  tabId: item.tabId,
                  collectionId: currentCollectionId,
                  orderNumber: i,
                }))

                setTimeout(async () => {
                  await updateMovedClips({ updatedMoveClips })
                  newClipItemId.value = newClipId
                }, 600)
              }}
            >
              {t('Duplicate', { ns: 'contextMenus' })}
              <div className="ml-auto pl-3">
                <Copy size={15} />
              </div>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => {
                showClipsMoveOnBoardId.value = boardId
              }}
            >
              {t('Organize', { ns: 'contextMenus' })}
              <div className="ml-auto pl-2">
                <Move size={15} className="fill-transparent" />
              </div>
            </ContextMenuItem>

            {(isImage || isImageData) && (
              <ContextMenuItem
                onClick={() => {
                  invoke('save_to_file_clip_item', { itemId, asImage: true })
                    .then(res => {
                      if (res === 'saved') {
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
                {t('Save as File', { ns: 'contextMenus' })}
                <div className="ml-auto pl-2">
                  <ArrowDownToLine size={15} />
                </div>
              </ContextMenuItem>
            )}
            {isMp3 ? (
              <ContextMenuItem
                onClick={() => {
                  invoke('save_to_file_clip_item', { itemId, asMp3: true })
                    .then(res => {
                      if (res === 'saved') {
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
                {t('Save as Mp3', { ns: 'contextMenus' })}
                <div className="ml-auto pl-2">
                  <ArrowDownToLine size={15} />
                </div>
              </ContextMenuItem>
            ) : (
              !(isImage && !arrLinks?.length) && (
                <ContextMenuItem
                  onClick={() => {
                    invoke('save_to_file_clip_item', { itemId })
                      .then(res => {
                        if (res === 'saved') {
                        } else if (res !== 'cancel') {
                          errorMessage(t('Errors:::Cant save to file', { ns: 'common' }))
                        }
                      })
                      .catch(() => {
                        errorMessage(t('Errors:::Cant save to file', { ns: 'common' }))
                      })
                  }}
                >
                  {t('Save as File', { ns: 'contextMenus' })}
                  <div className="ml-auto pl-2">
                    <ArrowDownToLine size={15} />
                  </div>
                </ContextMenuItem>
              )
            )}

            <ContextMenuSeparator />

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t('Position', { ns: 'contextMenus' })} ...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() => {
                    moveItemToPosition({
                      moveUp: true,
                    })
                  }}
                >
                  {t('Up', { ns: 'contextMenus' })}
                  <div className="ml-auto pl-2">
                    <ArrowUp size={15} className="fill-transparent" />
                  </div>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    moveItemToPosition({
                      moveDown: true,
                    })
                  }}
                >
                  {t('Down', { ns: 'contextMenus' })}
                  <div className="ml-auto pl-2">
                    <ArrowDown size={15} className="fill-transparent" />
                  </div>
                </ContextMenuItem>
                <ContextMenuSeparator />
                {createMemorizedBoardItems().length > 0 && (
                  <>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        {t('After', { ns: 'contextMenus' })}...
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        {createMemorizedBoardItems().map(item => {
                          return (
                            <RecursiveSubMenu
                              key={item.id}
                              board={item}
                              level={0}
                              itemId={itemId}
                              onSelect={(itemId: UniqueIdentifier) => {
                                moveItemToPosition({
                                  isAfterItemId: itemId,
                                })
                              }}
                            />
                          )
                        })}
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                  </>
                )}

                <ContextMenuItem
                  onClick={() => {
                    moveItemToPosition({
                      isFirst: true,
                    })
                  }}
                >
                  {t('Start', { ns: 'contextMenus' })}
                  <div className="ml-auto pl-2">
                    <ArrowUpToLine size={15} className="fill-transparent" />
                  </div>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => {
                    moveItemToPosition({
                      isLast: true,
                    })
                  }}
                >
                  {t('End', { ns: 'contextMenus' })}
                  <div className="ml-auto pl-2">
                    <ArrowDownToLine size={15} className="fill-transparent" />
                  </div>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t('Copy To', { ns: 'contextMenus' })} ...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    {t('CopyTo:::Tab', { ns: 'contextMenus' })}...
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {tabs.map(({ tabId, tabName, tabOrderNumber }) => (
                      <ContextMenuItem
                        key={tabId}
                        onSelect={() => {
                          copyToTab(tabId)
                        }}
                      >
                        {currentTab === tabId ? (
                          <Text className="font-semibold capitalize">
                            {tabName
                              ? tabName
                              : `${t('Tab', { ns: 'dashboard' })} ${tabOrderNumber + 1}`}
                          </Text>
                        ) : (
                          <span className="capitalize">
                            {tabName
                              ? tabName
                              : `${t('Tab', { ns: 'dashboard' })} ${tabOrderNumber + 1}`}
                          </span>
                        )}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                {createBoardTree(clipItems, currentTab).filter(b => b.id !== itemId)
                  .length > 0 && (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      {t('CopyTo:::Board', { ns: 'contextMenus' })}...
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      {createMemorizedBoardTree().map(board => {
                        return (
                          <RecursiveSubMenu
                            key={board.id}
                            board={board}
                            level={0}
                            itemId={itemId}
                            onSelect={(boardId: UniqueIdentifier) => {
                              copyToBoard(boardId)
                            }}
                          />
                        )
                      })}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t('Move To', { ns: 'contextMenus' })} ...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    {t('CopyTo:::Tab', { ns: 'contextMenus' })}...
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {tabs.map(({ tabId, tabName, tabOrderNumber }) => (
                      <ContextMenuItem
                        key={tabId}
                        onSelect={() => {
                          copyToTab(tabId, true)
                        }}
                      >
                        {currentTab === tabId ? (
                          <Text className="font-semibold capitalize">
                            {tabName
                              ? tabName
                              : `${t('Tab', { ns: 'dashboard' })} ${tabOrderNumber + 1}`}
                          </Text>
                        ) : (
                          <span className="capitalize">
                            {tabName
                              ? tabName
                              : `${t('Tab', { ns: 'dashboard' })} ${tabOrderNumber + 1}`}
                          </span>
                        )}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                {createBoardTree(clipItems, currentTab).filter(b => b.id !== itemId)
                  .length > 0 && (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      {t('CopyTo:::Board', { ns: 'contextMenus' })}...
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      {createMemorizedBoardTree().map(board => {
                        return (
                          <RecursiveSubMenu
                            key={board.id}
                            board={board}
                            level={0}
                            itemId={itemId}
                            onSelect={(boardId: UniqueIdentifier) => {
                              copyToBoard(boardId, true)
                            }}
                          />
                        )
                      })}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t('Clip Icon', { ns: 'contextMenus' })} ...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  disabled={true}
                  className="text-center items-center justify-center py-0.5"
                >
                  <Text>{t('Icon Visibility', { ns: 'contextMenus' })}</Text>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuCheckboxItem
                  checked={iconVisibility === 'none'}
                  onSelect={() => {
                    updateItemById({
                      updatedItem: {
                        iconVisibility: 'none',
                        itemId,
                      },
                    })
                  }}
                  className={iconVisibility === 'none' ? 'font-semibold' : ''}
                >
                  {t('Hide', { ns: 'contextMenus' })}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  checked={iconVisibility === 'always'}
                  onSelect={() => {
                    updateItemById({
                      updatedItem: {
                        iconVisibility: 'always',
                        itemId,
                      },
                    })
                  }}
                  className={iconVisibility === 'always' ? 'font-semibold' : ''}
                >
                  {t('Show', { ns: 'contextMenus' })}
                </ContextMenuCheckboxItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="flex items-center justify-center">
                    {icon ? (
                      <CustomIcon
                        size={16}
                        className="ml-1 mr-2"
                        name={icon as (typeof CUSTOM_ICON_NAMES)[number]}
                      />
                    ) : (
                      <CircleOff size={16} className="ml-1 mr-2 opacity-30" />
                    )}
                    {t('Custom Icon', { ns: 'contextMenus' })} ...
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-64">
                    <ContextMenuItem
                      disabled={true}
                      className="text-center items-center justify-between py-0.5  data-[disabled]:pointer-events-auto"
                    >
                      <Box className="w-6" />
                      <Text>{t('Select Icon', { ns: 'contextMenus' })}</Text>
                      <Button
                        className="text-[11px] px-1.5 font-semibold py-0.5 bg-opacity-70"
                        variant="default"
                        size="mini"
                        onClick={() => {
                          updateItemById({
                            updatedItem: {
                              icon: '',
                              iconVisibility: '',
                              itemId,
                            },
                          })
                        }}
                      >
                        {t('RESET', { ns: 'contextMenus' })}
                      </Button>
                    </ContextMenuItem>

                    <SimpleBar
                      className="code-filter"
                      style={{ height: 'auto', maxHeight: '260px' }}
                      autoHide={false}
                    >
                      <Flex className="grid grid-cols-7 gap-0.5">
                        {CUSTOM_ICON_NAMES.map(name => {
                          return (
                            <ContextMenuItem
                              key={name}
                              className={`flex items-center justify-center ${
                                icon === name
                                  ? '!bg-gray-200 dark:!bg-gray-600 dark:!text-slate-300'
                                  : ''
                              }`}
                              onSelect={e => {
                                e.preventDefault()
                                updateItemById({
                                  updatedItem: {
                                    icon: name,
                                    iconVisibility: 'always',
                                    itemId,
                                  },
                                })
                              }}
                            >
                              <CustomIcon name={name} size={16} />
                            </ContextMenuItem>
                          )
                        })}
                      </Flex>
                    </SimpleBar>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>

            {description && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  {t('Note Icon', { ns: 'contextMenus' })} ...
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem
                    disabled={true}
                    className="text-center items-center justify-center py-0.5"
                  >
                    <Text>{t('Note Icon Settings', { ns: 'contextMenus' })}</Text>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuCheckboxItem
                    checked={(() => {
                      const currentOptions = parseItemOptions(itemOptions)
                      return (
                        !currentOptions.noteOptions ||
                        Object.keys(currentOptions.noteOptions).length === 0
                      )
                    })()}
                    onSelect={e => {
                      e.preventDefault()
                      const currentOptions = parseItemOptions(itemOptions)
                      const { noteOptions, ...otherOptions } = currentOptions

                      updateItemById({
                        updatedItem: {
                          itemOptions: JSON.stringify(otherOptions),
                          itemId,
                        },
                      })
                    }}
                  >
                    {t('Use Global Setting', { ns: 'contextMenus' })}
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={shouldShowNoteIcon(description, itemOptions, {
                      isNoteIconsEnabled,
                      defaultNoteIconType,
                    })}
                    className={
                      shouldShowNoteIcon(description, itemOptions, {
                        isNoteIconsEnabled,
                        defaultNoteIconType,
                      })
                        ? 'font-semibold'
                        : ''
                    }
                    onSelect={e => {
                      e.preventDefault()
                      const currentOptions = parseItemOptions(itemOptions)
                      const currentNoteOptions = currentOptions.noteOptions || {}
                      const newShowIcon = !shouldShowNoteIcon(description, itemOptions, {
                        isNoteIconsEnabled,
                        defaultNoteIconType,
                      })

                      updateItemById({
                        updatedItem: {
                          itemOptions: JSON.stringify({
                            ...currentOptions,
                            noteOptions: {
                              ...currentNoteOptions,
                              showIcon: newShowIcon,
                            },
                          }),
                          itemId,
                        },
                      })
                    }}
                  >
                    {t('Show Note Icon', { ns: 'contextMenus' })}
                  </ContextMenuCheckboxItem>

                  {shouldShowNoteIcon(description, itemOptions, {
                    isNoteIconsEnabled,
                    defaultNoteIconType,
                  }) && (
                    <ContextMenuSub>
                      <ContextMenuSubTrigger className="flex items-center justify-center">
                        {(() => {
                          const iconType = getNoteOptions(itemOptions, {
                            isNoteIconsEnabled,
                            defaultNoteIconType,
                          }).iconType
                          const iconMap = {
                            MessageSquareText: (
                              <MessageSquareText size={16} className="ml-1 mr-2" />
                            ),
                            FileText: <FileText size={16} className="ml-1 mr-2" />,
                            BookOpenText: (
                              <BookOpenText size={16} className="ml-1 mr-2" />
                            ),
                            Contact: <Contact size={16} className="ml-1 mr-2" />,
                            NotebookPen: <NotebookPen size={16} className="ml-1 mr-2" />,
                          }
                          return (
                            iconMap[iconType as keyof typeof iconMap] || (
                              <MessageSquareText size={16} className="ml-1 mr-2" />
                            )
                          )
                        })()}
                        {t('Icon Type', { ns: 'contextMenus' })} ...
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        {[
                          {
                            name: 'MessageSquareText',
                            labelKey: 'Note Icon Types Message',
                            icon: MessageSquareText,
                          },
                          {
                            name: 'FileText',
                            labelKey: 'Note Icon Types File',
                            icon: FileText,
                          },
                          {
                            name: 'BookOpenText',
                            labelKey: 'Note Icon Types Book',
                            icon: BookOpenText,
                          },
                          {
                            name: 'Contact',
                            labelKey: 'Note Icon Types Contact',
                            icon: Contact,
                          },
                          {
                            name: 'NotebookPen',
                            labelKey: 'Note Icon Types Notebook',
                            icon: NotebookPen,
                          },
                        ].map(iconType => {
                          const isSelected =
                            getNoteOptions(itemOptions, {
                              isNoteIconsEnabled,
                              defaultNoteIconType,
                            }).iconType === iconType.name
                          const IconComponent = iconType.icon

                          return isSelected ? (
                            <ContextMenuCheckboxItem
                              key={iconType.name}
                              checked={true}
                              className="font-semibold"
                              onSelect={e => {
                                e.preventDefault()
                                const currentOptions = parseItemOptions(itemOptions)
                                const currentNoteOptions =
                                  currentOptions.noteOptions || {}

                                updateItemById({
                                  updatedItem: {
                                    itemOptions: JSON.stringify({
                                      ...currentOptions,
                                      noteOptions: {
                                        ...currentNoteOptions,
                                        iconType: iconType.name,
                                        showIcon: true,
                                      },
                                    }),
                                    itemId,
                                  },
                                })
                              }}
                            >
                              {t(iconType.labelKey, { ns: 'contextMenus' })}
                            </ContextMenuCheckboxItem>
                          ) : (
                            <ContextMenuItem
                              key={iconType.name}
                              onSelect={() => {
                                const currentOptions = parseItemOptions(itemOptions)
                                const currentNoteOptions =
                                  currentOptions.noteOptions || {}

                                updateItemById({
                                  updatedItem: {
                                    itemOptions: JSON.stringify({
                                      ...currentOptions,
                                      noteOptions: {
                                        ...currentNoteOptions,
                                        iconType: iconType.name,
                                        showIcon: true,
                                      },
                                    }),
                                    itemId,
                                  },
                                })
                              }}
                              className="flex items-center"
                            >
                              <IconComponent size={16} className="mr-2" />
                              {t(iconType.labelKey, { ns: 'contextMenus' })}
                            </ContextMenuItem>
                          )
                        })}
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {isPinnedBoard ? (
          <ContextMenuItem
            onClick={() => {
              updatePinnedClipsByIds({
                itemIds: [itemId],
                isPinned: false,
              })
            }}
          >
            <Text className="!text-orange-600">
              {t('UnPin Clip', { ns: 'contextMenus' })}
            </Text>
            <div className="ml-auto ">
              <PinOff size={15} className="!text-orange-600" />
            </div>
          </ContextMenuItem>
        ) : showDeleteThisClipConfirmation.value ? (
          <ContextMenuItem
            key="delete-clip-confirmation"
            className="!bg-red-100 dark:!bg-red-900"
            onClick={() => {
              deleteItemById({
                itemId,
                collectionId: currentCollectionId,
              })

              if (isLargeView) {
                setTimeout(() => {
                  showLargeViewClipId.value = null
                }, 300)
              }
              showDeleteThisClipConfirmation.value = false
              showDeleteClipConfirmationId.value === null
            }}
          >
            <Flex>
              <Text className="!text-red-500">
                {t('Click to Confirm', { ns: 'common' })}
              </Text>
            </Flex>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            key="delete-clip"
            onClick={e => {
              e.preventDefault()
              showDeleteThisClipConfirmation.value = true
            }}
          >
            <Flex>
              <Text className="!text-red-500">
                {t('Delete Clip', { ns: 'contextMenus' })}
              </Text>
            </Flex>
            <div className="ml-auto pl-3">
              <TrashIcon size={15} className="text-red-500" />
            </div>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenuPortal>
  )
}

export const ClipsCardContextMenu = ClipsCardContextMenuComponent
