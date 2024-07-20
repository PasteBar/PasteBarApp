import { useCallback, useEffect, useMemo } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useSignals } from '@preact/signals-react/runtime'
import createBoardTree from '~/libs/create-board-tree'
import {
  collectionsStoreAtom,
  createBoardItemId,
  createClipBoardItemId,
  isFullyExpandViewBoard,
  showClipsMoveOnBoardId,
  showDeleteBoardConfirmationId,
  showExpandViewBoardId,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  CircleOff,
  Expand,
  Eye,
  EyeOff,
  FileSignature,
  GalleryVertical,
  Move,
  PanelTop,
  Shrink,
  TrashIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
import { useDeleteItemById, useUpdateItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { BOARD } from '../../Dashboard'
import { Board } from '../Board'
import { Clip } from '../ClipCard'
import { collectChildrenIds } from '../utils'

interface BoardContextMenuProps {
  itemId: UniqueIdentifier
  showDeleteBoard: boolean
  itemParentId: UniqueIdentifier | null
  isShowDescription: boolean
  currentTabLayout: string
  hasDescription: boolean
  iconVisibility: string | null | undefined
  icon: string | null | undefined
  isEdit: boolean | undefined
  setEditBoard: (id: UniqueIdentifier | null) => void
  onShowDescriptionChange: (id: UniqueIdentifier, showDescription: boolean) => void
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

export default function BoardContextMenu({
  itemId,
  itemParentId,
  onShowDescriptionChange,
  hasDescription,
  showDeleteBoard,
  isShowDescription,
  isEdit,
  currentTabLayout,
  iconVisibility,
  icon,
  setEditBoard,
}: BoardContextMenuProps) {
  const { clipItems, tabs, currentTab, setClipItems, currentCollectionId } =
    useAtomValue(collectionsStoreAtom)
  useSignals()
  const showDeleteThisBoardConfirmation = useSignal(false)

  const { t } = useTranslation()
  const { deleteItemById } = useDeleteItemById()
  const { updateItemById } = useUpdateItemById()

  const { updateMovedClips } = useUpdateMovedClipsInCollection()

  const memoizedBoardTree = useMemo(() => {
    return createBoardTree(clipItems, currentTab).filter(b => b.id !== itemId)
  }, [clipItems, currentTab, itemId])

  const createMemorizedBoardItems = () => {
    return createBoardTree(clipItems, currentTab, itemParentId?.toString())
      .filter(b => b.id !== itemId)
      .sort((a, b) => a.orderNumber - b.orderNumber)
  }

  useEffect(() => {
    if (showDeleteThisBoardConfirmation.value) {
      showDeleteBoardConfirmationId.value = itemId
      setTimeout(() => {
        showDeleteThisBoardConfirmation.value = false
        showDeleteBoardConfirmationId.value = null
      }, 3000)
    }
  }, [showDeleteThisBoardConfirmation.value])

  const moveBoardTo = useCallback(
    (targetBoardId: UniqueIdentifier | null, targetTabId?: string) => {
      const movingBoard = clipItems.find(item => item.itemId === itemId && item.isBoard)

      if (movingBoard && !targetBoardId && targetTabId) {
        const currentTabBoardTree = createBoardTree(
          clipItems,
          currentTab,
          itemParentId?.toString()
        )
        const movedBoard = currentTabBoardTree.find(board => board.id === itemId)

        const allChildrenIds = movedBoard ? collectChildrenIds(movedBoard) : []

        const boardsInTargetTab = clipItems
          .filter(
            item => item.tabId === targetTabId && item.isBoard && item.parentId === null
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        boardsInTargetTab.unshift(movingBoard)

        const itemIdToNewIndexMap = new Map(
          boardsInTargetTab.map((item, index) => [item.itemId, index])
        )

        const itemIdToNewTabIdMap = new Map(allChildrenIds?.map(id => [id, true]))
        const updatedClipIds = [] as string[]

        const newBoardItems = clipItems.map(item => {
          const newOrderIndex = itemIdToNewIndexMap.get(item.itemId)

          if (newOrderIndex !== undefined) {
            updatedClipIds.push(item.itemId)
            return {
              ...item,
              orderNumber: newOrderIndex,
              tabId: targetTabId,
              parentId: null,
            }
          } else if (itemIdToNewTabIdMap?.has(item.itemId)) {
            updatedClipIds.push(item.itemId)
            return {
              ...item,
              tabId: targetTabId,
            }
          }

          return item
        })

        setClipItems(newBoardItems)

        const updatedMoveClips = newBoardItems
          .filter(item => updatedClipIds.includes(item.itemId))
          .map(item => ({
            itemId: item.itemId,
            parentId: item.parentId,
            tabId: item.tabId,
            collectionId: currentCollectionId,
            orderNumber: item.orderNumber,
          }))

        updateMovedClips({ updatedMoveClips })
      } else if (movingBoard && targetBoardId && !targetTabId) {
        const clipsInTargetParentBoard = clipItems
          .filter(item => item.parentId === targetBoardId && item.tabId === currentTab)
          .sort((a, b) => a.orderNumber - b.orderNumber)

        clipsInTargetParentBoard.unshift(movingBoard)

        const itemIdToNewIndexMap = new Map(
          clipsInTargetParentBoard.map((item, index) => [item.itemId, index])
        )

        const newBoardItems = clipItems.map(item => {
          const newOrderIndex = itemIdToNewIndexMap.get(item.itemId)

          if (newOrderIndex !== undefined) {
            return {
              ...item,
              orderNumber: newOrderIndex,
              parentId: targetBoardId.toString(),
            }
          }

          return item
        })

        setClipItems(newBoardItems)

        const updatedMoveClips = newBoardItems
          .filter(item => item.parentId === targetBoardId)
          .map(item => ({
            itemId: item.itemId,
            parentId: targetBoardId,
            tabId: currentTab,
            collectionId: currentCollectionId,
            orderNumber: item.orderNumber,
          }))

        updateMovedClips({ updatedMoveClips })
      }
    },
    [itemId, currentTab]
  )

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

    const targetBoardTree = createBoardTree(
      clipItems,
      tabId,
      itemParentId?.toString()
    ).sort((a, b) => a.orderNumber - b.orderNumber)

    const itemIndex = targetBoardTree.findIndex(b => b.id === itemId)

    if (itemIndex === -1) {
      return
    }

    let newIndex
    if (moveUp) {
      newIndex = Math.max(0, itemIndex - 1)
    } else if (moveDown) {
      newIndex = Math.min(targetBoardTree.length - 1, itemIndex + 1)
    } else if (isAfterItemId) {
      const afterIndex = targetBoardTree.findIndex(b => b.id === isAfterItemId)
      if (afterIndex === -1) {
        return
      }
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

  if (itemId == null) {
    return null
  }

  return (
    <ContextMenuPortal>
      <ContextMenuContent className="min-w-[150px]">
        <ContextMenuItem
          onSelect={() => {
            createClipBoardItemId.value = itemId
          }}
        >
          {t('Add Clip', { ns: 'contextMenus' })}
          <div className="ml-auto">
            <GalleryVertical size={16} />
          </div>
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={() => {
            createBoardItemId.value = itemId
          }}
        >
          {t('Add Board', { ns: 'contextMenus' })}
          <div className="ml-auto">
            <PanelTop size={16} />
          </div>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {showExpandViewBoardId.value !== itemId ? (
          <ContextMenuItem
            onClick={() => {
              showExpandViewBoardId.value = itemId
              if (currentTabLayout === 'full') {
                isFullyExpandViewBoard.value = true
              }
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
              showExpandViewBoardId.value = null
              isFullyExpandViewBoard.value = false
            }}
          >
            {t('Close View', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <Shrink size={14} />
            </div>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {!isEdit && (
          <ContextMenuItem
            onClick={() => {
              setEditBoard(itemId)
            }}
          >
            {t('Edit Board', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <FileSignature size={15} className="ml-1" />
            </div>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => {
            showClipsMoveOnBoardId.value = itemId
          }}
        >
          {t('Organize', { ns: 'contextMenus' })}
          <div className="ml-auto pl-2">
            <Move size={15} className="fill-transparent" />
          </div>
        </ContextMenuItem>

        {hasDescription && (
          <>
            {!isShowDescription ? (
              <ContextMenuItem
                onClick={() => {
                  onShowDescriptionChange(itemId, true)
                }}
              >
                {t('Show Subtitle', { ns: 'contextMenus' })}
                <div className="ml-auto pl-3">
                  <Eye size={15} />
                </div>
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  onShowDescriptionChange(itemId, false)
                }}
              >
                {t('Hide Subtitle', { ns: 'contextMenus' })}
                <div className="ml-auto pl-3">
                  <EyeOff size={15} />
                </div>
              </ContextMenuItem>
            )}
          </>
        )}

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            {t('Board Icon', { ns: 'contextMenus' })} ...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
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
                          iconVisibility: 'none',
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
                                iconVisibility: 'always',
                                icon: name,
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
            {t('Move To', { ns: 'contextMenus' })} ...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t('MoveTo:::Tab', { ns: 'contextMenus' })} ...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {tabs.map(({ tabId, tabName, tabOrderNumber }) => (
                  <ContextMenuItem
                    key={tabId}
                    onSelect={() => {
                      moveBoardTo(null, tabId)
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
            {createBoardTree(clipItems, currentTab).filter(b => b.id !== itemId).length >
              0 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  {t('MoveTo:::Board', { ns: 'contextMenus' })} ...
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {memoizedBoardTree.map(board => {
                    return (
                      <RecursiveSubMenu
                        key={board.id}
                        board={board}
                        level={0}
                        itemId={itemId}
                        onSelect={(boardId: UniqueIdentifier) => {
                          moveBoardTo(boardId)
                        }}
                      />
                    )
                  })}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {!showDeleteBoard && (
          <>
            <ContextMenuSeparator />
            {showDeleteThisBoardConfirmation.value ? (
              <ContextMenuItem
                key="delete-board-confirmation"
                className="!bg-red-100 dark:!bg-red-900"
                onClick={e => {
                  deleteItemById({
                    itemId,
                    collectionId: currentCollectionId,
                  })
                  showDeleteBoardConfirmationId.value === null
                  showDeleteThisBoardConfirmation.value = false
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
                key="delete-board"
                onClick={e => {
                  e.preventDefault()
                  showDeleteThisBoardConfirmation.value = true
                }}
              >
                <Flex>
                  <Text className="!text-red-500">
                    {t('Delete Board', { ns: 'contextMenus' })}
                  </Text>
                </Flex>
                <div className="ml-auto pl-3">
                  <TrashIcon size={15} className="text-red-500" />
                </div>
              </ContextMenuItem>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenuPortal>
  )
}
