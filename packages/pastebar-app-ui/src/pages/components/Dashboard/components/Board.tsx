import { memo, useEffect, useMemo, useRef } from 'react'
import { type UniqueIdentifier } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import {
  closeEdit,
  collectionsStoreAtom,
  creatingClipItemBoardId,
  editBoardItemId,
  hasDashboardItemCreate,
  highLightBoardId,
  isBoardNameEditing,
  isFullyExpandViewBoard,
  newBoardItemId,
  newClipItemId,
  playerStoreAtom,
  settingsStoreAtom,
  showBoardNameNotSavedError,
  showClipsMoveOnBoardId,
  showDeleteBoardConfirmationId,
  showDeleteClipConfirmationId,
  showEditClipId,
  showEditClipNameId,
  showExpandViewBoardId,
  showOrganizeLayout,
} from '~/store'
import { cva } from 'class-variance-authority'
import { useAtomValue } from 'jotai'
import {
  AlignVerticalSpaceAround,
  Check,
  CheckIcon,
  Dot,
  FlipVertical,
  Grip,
  LayoutGrid,
  LayoutPanelTop,
  MoreVertical,
  MousePointerSquareDashed,
  Move,
  StretchHorizontal,
  X,
} from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useTranslation } from 'react-i18next'

import { bgColor, borderColor } from '~/lib/utils'

import AlertIcon from '~/components/atoms/fundamentals/icons/alert-icon'
import mergeRefs from '~/components/atoms/merge-refs'
import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import SimpleBar from '~/components/libs/simplebar-react'
import {
  Badge,
  Button,
  ButtonGhost,
  ContextMenu,
  ContextMenuTrigger,
  Flex,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '~/components/ui'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { highlightMatchedText } from '../../helpers'
import { BOARD, CLIP } from '../Dashboard'
import { Card, CardContent, CardHeader } from './BaseCard'
import { BoardDelete } from './BoardDelete'
import { BoardDropZone } from './BoardDropZone'
import { BoardEdit } from './BoardEdit'
import { Clip, ClipCardMemoized } from './ClipCard'
import ClipIcon from './ClipIcon'
import ClipsBoardContextMenu from './context-menus/BoardContextMenu'
import ResizePanel from './ResizePanel/ResizePanel'

const MAX_ITEMS_LAYOUT_WIDTH = [
  'max-w-min',
  'max-w-xs',
  'max-w-sm',
  'max-w-md',
  'max-w-[50%]',
  'max-w-prose',
  'max-w-full',
  'max-w-fit',
]

export type BoardType = 'board'

export interface Board {
  id: UniqueIdentifier
  orderNumber: number
  type: BoardType
  icon?: string | null
  iconVisibility?: string | null
  parentId: UniqueIdentifier | null
  color: string | null
  borderWidth?: number | null
  isBoard?: boolean
  showDescription: boolean
  layout: string | null
  layoutSplit: number
  layoutItemsMaxWidth: string | null
  tabId: string
  tabName?: string
  children?: Clip[] | Board[]
  description: string
  name: string
}

export interface Column {
  id: UniqueIdentifier
  title: string
}

export type ColumnType = 'Column'
export interface ColumnDragData {
  type: ColumnType
  column: Column
}

export interface BoardDragData {
  type: BoardType
  isSubBoard?: boolean
  board: Board
}

interface BoardProps {
  board: Board
  boardColor?: string | null
  isSubBoard?: boolean
  globalSearchTerm?: string
  order?: number
  showDragHandle?: boolean
  isHistoryDragActive?: boolean
  isGlobalSearchBoardsOnly?: boolean
  dragOverBoardId?: UniqueIdentifier | null
  panelHeight?: number
  onResizeCallBack?: (size: number) => void
  isDark: boolean
  currentTabLayout: string
  isLastBoard?: boolean
  isActiveDragBoard?: boolean
  setCurrentTab?: (tabId: string) => void
  closeGlobalSearch?: () => void
  selectedItemIds: UniqueIdentifier[]
  setSelectedItemId: (id: UniqueIdentifier) => void
  showDetailsItem?: UniqueIdentifier | null
  setShowDetailsItem?: (id: UniqueIdentifier | null) => void
  isDragPreview?: boolean
  keyboardSelectedClipId?: { value: UniqueIdentifier | null }
  currentSelectedBoardId?: { value: UniqueIdentifier | null }
  keyboardNavigationMode?: { value: 'history' | 'board' | 'pinned' | null }
}

export function BoardComponent({
  board,
  boardColor,
  isDragPreview,
  isSubBoard,
  isDark,
  showDragHandle,
  globalSearchTerm,
  isGlobalSearchBoardsOnly,
  isHistoryDragActive,
  dragOverBoardId,
  panelHeight,
  currentTabLayout,
  selectedItemIds,
  showDetailsItem,
  closeGlobalSearch,
  setShowDetailsItem,
  setCurrentTab,
  setSelectedItemId,
  keyboardSelectedClipId,
  currentSelectedBoardId,
  keyboardNavigationMode,
}: BoardProps) {
  const { t } = useTranslation()
  const childrenIds = useMemo(() => {
    return board.children?.map((clip: Clip | Board) => clip.id) ?? []
  }, [board])

  const { isPlaying, isSongWithIdAndTypePlaying } = useAtomValue(playerStoreAtom)

  const { updateItemById, updateItemByIdPending } = useUpdateItemById()

  const {
    isClipNotesHoverCardsEnabled,
    clipNotesHoverCardsDelayMS,
    clipNotesMaxHeight,
    clipNotesMaxWidth,
    isSingleClickToCopyPaste,
  } = useAtomValue(settingsStoreAtom)

  const contextMenuOpen = useSignal(false)
  const contextMenuButtonRef = useRef<HTMLButtonElement>(null)
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
  const showFullDescription = useSignal(false)
  const isHovering = useSignal(false)
  const { isBoardHasChildren } = useAtomValue(collectionsStoreAtom)

  const scollToRef = useRef<HTMLDivElement>(null)

  const isNewClip = hasDashboardItemCreate.value === CLIP
  const isHighLightBoard = highLightBoardId.value === board.id && !globalSearchTerm

  const { setNodeRef, listeners, isDragging } = useSortable({
    disabled:
      isHistoryDragActive ||
      isNewClip ||
      Boolean(showEditClipId.value) ||
      Boolean(newClipItemId.value),
    id: board.id,
    data: {
      type: 'board',
      isSubBoard,
      board,
    } satisfies BoardDragData,
  })

  const showOrganizeLayoutValue = useMemo(
    () => showOrganizeLayout.value,
    [showOrganizeLayout.value]
  )

  const hasChildren = isBoardHasChildren(board.id)

  const isNewBoard = board.id === newBoardItemId.value
  const isMovedClipBoard = board.name === t('Moved Clips Panel', { ns: 'dashboard' })
  const isEditBoard = board.id === editBoardItemId.value
  const isBoardDelete = showDeleteBoardConfirmationId.value === board.id
  const showEditControls = isNewBoard || isEditBoard
  const color = board.color || boardColor || 'slate'
  const borderWidthStyle =
    board.borderWidth === 0
      ? isSubBoard
        ? 'border'
        : 'border-none'
      : board.borderWidth === 1
        ? 'border'
        : `border-[${board.borderWidth}px]`

  const isFlex = board.layout?.startsWith('flex') || false
  const isFlexNoWrap = board.layout === 'flex-nowrap' || false
  const isGrid = board.layout?.startsWith('grid') || false
  const gridCols = parseInt(board.layout?.split('grid-cols-')[1] ?? '', 10) || 2

  const showOrganizeThisBoard =
    showClipsMoveOnBoardId.value === board.id && !globalSearchTerm

  const isOverBoard = dragOverBoardId === board.id
  const isExpandedView = showExpandViewBoardId.value === board.id

  const variants = cva(
    `${
      isOverBoard
        ? `bg-blue-200 dark:bg-blue-400 border-blue-300 dark:border-blue-300`
        : `${bgColor(color, '200')} ${borderColor(color, '300', '700')}`
    }` +
      ` h-full flex flex-col ${
        showEditControls ? 'border-2 min-h-[120px]' : 'border-0 min-h-[100px]'
      } px-0.5 py-1 bg-opacity-70 dark:bg-opacity-70 rounded-lg overflow-hidden` +
      ` ${isBoardDelete ? `border-2 border-red-300 bg-red-100` : ''}` +
      ` ${
        isMovedClipBoard
          ? `border-2 ${borderColor(
              color,
              '300',
              '700'
            )} border-opacity-70 dark:border-opacity-70`
          : ''
      }` +
      ` ${
        isSubBoard
          ? 'border-opacity-50 dark:border-opacity-50'
          : 'border-opacity-60 dark:border-opacity-60'
      }` +
      ` ${borderWidthStyle}` +
      ` ${isNewClip ? `hover:bg-blue-100` : ''}` +
      ` ${isHighLightBoard ? 'pulse-clip' : ''}`,
    {
      variants: {
        dragging: {
          over: 'border-2 border-dashed border-blue-400 dark:border-blue-500',
          overlay: `${borderColor(color, '300', '700')} opacity-70 border-2`,
        },
      },
    }
  )

  useEffect(() => {
    if (isHighLightBoard) {
      scollToRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
      setTimeout(() => {
        highLightBoardId.value = null
      }, 1000)
    }
  }, [isHighLightBoard, scollToRef?.current])

  useEffect(() => {
    if (isDragging && isSubBoard) {
      showClipsMoveOnBoardId.value = board.parentId
    }
  }, [isDragging, isSubBoard])

  return (
    <Card
      ref={mergeRefs(
        scollToRef,
        Boolean(showEditClipId.value) || Boolean(newClipItemId.value) ? null : setNodeRef
      )}
      className={variants({
        dragging: isDragPreview ? 'overlay' : isDragging ? 'over' : undefined,
      })}
    >
      <ContextMenu
        onOpenChange={isOpen => {
          contextMenuOpen.value = isOpen
          showDeleteBoardConfirmationId.value = null
        }}
      >
        <ContextMenuTrigger
          disabled={showEditControls || showOrganizeThisBoard || showDragHandle}
          ref={isHovering.value ? contextMenuTriggerRef : null}
        >
          <CardHeader
            onMouseEnter={() => {
              isHovering.value = true
            }}
            onMouseLeave={() => {
              isHovering.value = false
            }}
            onClick={() => {
              isHovering.value = true
            }}
            onDoubleClick={() => {
              isHovering.value = true
              if (showEditControls) {
                return
              }
              if (showExpandViewBoardId.value !== board.id) {
                if (currentTabLayout === 'full') {
                  isFullyExpandViewBoard.value = true
                }
                showExpandViewBoardId.value = board.id
              } else {
                showExpandViewBoardId.value = null
                isFullyExpandViewBoard.value = false
              }
            }}
            className={`p-1 pt-1.5 px-4 pb-0 pr-2 flex flex-row relative board-panel-header_tour ${
              board.name ? '' : 'min-h-[18px] pt-0'
            } ${isExpandedView && !board.name ? 'my-1' : ''}
            }`}
            {...(!showOrganizeLayoutValue && !showEditControls ? listeners : {})}
          >
            {showEditControls ? (
              <BoardEdit
                boardName={board.name}
                boardSubtitle={board.description}
                scrollRef={scollToRef}
                isNewBoard={isNewBoard}
                boardColor={board.color}
                boardBorderWidth={board.borderWidth ?? 0}
                boardId={board.id}
              />
            ) : (
              <div className="overflow-hidden">
                <div className="cursor-default flex items-center">
                  <ClipIcon
                    icon={board.icon}
                    size={17}
                    isBoard={true}
                    className="mr-1.5"
                    description={board.showDescription ? null : board.description}
                    iconVisibility={board.iconVisibility}
                    isHover={true}
                  >
                    {isMovedClipBoard && (
                      <MousePointerSquareDashed size={17} className="mr-1.5" />
                    )}
                  </ClipIcon>
                  {!globalSearchTerm ? (
                    <Text
                      color="black"
                      className="!font-medium text-sm text-ellipsis !block overflow-hidden whitespace-nowrap first-letter:uppercase"
                    >
                      {board.name}
                    </Text>
                  ) : (
                    <Text
                      color="black"
                      className="dark:hover:!text-blue-400 hover:!text-blue-500 cursor-pointer !font-medium text-sm text-ellipsis !block overflow-hidden whitespace-nowrap first-letter:uppercase"
                      onClick={() => {
                        setCurrentTab?.(board.tabId)
                        highLightBoardId.value = board.id
                        closeGlobalSearch?.()
                      }}
                    >
                      {isGlobalSearchBoardsOnly
                        ? highlightMatchedText(board.name, globalSearchTerm)
                        : board.name}
                    </Text>
                  )}
                  {!board.showDescription &&
                    (!board.icon || board.iconVisibility !== 'always') && (
                      <ToolTip
                        text={board.description}
                        className="!px-2 !py-1"
                        delayDuration={300}
                        isCompact
                        isDisabled={isDragPreview || !isHovering.value}
                        sideOffset={10}
                        side="bottom"
                      >
                        <div
                          className={`ml-0.5 pl-1 text-primary/50 cursor-pointer hover:opacity-100 ${
                            isHovering.value ? 'opacity-80' : 'opacity-0'
                          }`}
                        >
                          <AlertIcon size={17} />
                        </div>
                      </ToolTip>
                    )}
                </div>

                {board.description && board.showDescription && (
                  <div
                    onClick={() => {
                      showFullDescription.value = !showFullDescription.value
                    }}
                    className={`!font-light text-xs cursor-default hover:opacity-100 opacity-70 hover:animate-in ${
                      showFullDescription.value ? '' : 'line-clamp-2'
                    } mt-0.5`}
                  >
                    {board.description}
                  </div>
                )}
              </div>
            )}
            {!showEditControls && (
              <div
                className={`flex flex-row ml-auto opacity-0 animate-in fade-in ${
                  isHovering.value ||
                  contextMenuOpen.value ||
                  isExpandedView ||
                  showDragHandle ||
                  showOrganizeLayoutValue ||
                  showOrganizeThisBoard
                    ? 'opacity-100'
                    : ''
                } !mt-0`}
              >
                {!isDragPreview ? (
                  <Flex className="flex-row items-start relative">
                    {showOrganizeLayoutValue || showDragHandle ? (
                      <ButtonGhost
                        {...listeners}
                        className={`p-1 text-primary/50 h-auto cursor-grab absolute right-0 top-[-3px] hover:${bgColor(
                          board.color,
                          '200'
                        )}`}
                      >
                        <Grip size={18} />
                      </ButtonGhost>
                    ) : showOrganizeThisBoard ? (
                      <Button
                        variant="light"
                        size="mini"
                        className="px-3 py-0.5 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80"
                        onClick={() => {
                          showClipsMoveOnBoardId.value = null
                        }}
                      >
                        <Text className="whitespace-nowrap">
                          {t('Done', { ns: 'common' })}
                        </Text>
                        <div className="ml-auto pl-1.5">
                          <Check size={14} />
                        </div>
                      </Button>
                    ) : (
                      !globalSearchTerm && (
                        <Flex className="absolute right-0 top-[-3px] gap-2">
                          <Button
                            title={t('Board Menu', { ns: 'dashboard' })}
                            variant={'ghost'}
                            size="mini"
                            className={`p-1 text-secondary-foreground/50 ${bgColor(
                              board.color,
                              '200'
                            )} dark:hover:bg-${board.color}-800 hover:${bgColor(
                              board.color,
                              '200'
                            )} bg-opacity-80 cursor-pointer rounded-md flex ${
                              isExpandedView ? 'opacity-0' : ''
                            } ${isHovering.value ? 'opacity-100' : ''}`}
                            onClick={() => {
                              const x =
                                contextMenuButtonRef?.current?.getBoundingClientRect().x
                              const y =
                                contextMenuButtonRef?.current?.getBoundingClientRect().y

                              contextMenuTriggerRef?.current?.dispatchEvent(
                                new MouseEvent('contextmenu', {
                                  bubbles: true,
                                  clientX: x && x + 10,
                                  clientY: y && y + 30,
                                })
                              )
                            }}
                            ref={contextMenuButtonRef}
                          >
                            <MoreVertical size={18} />
                          </Button>
                          {isExpandedView && (
                            <Button
                              title={t('Close View', { ns: 'contextMenus' })}
                              variant={'ghost'}
                              size="mini"
                              className={`p-1 text-secondary-foreground/50 ${bgColor(
                                board.color,
                                '100'
                              )} dark:hover:bg-${board.color}-800 hover:${bgColor(
                                board.color,
                                '200'
                              )} bg-opacity-100 cursor-pointer rounded-md !mt-0 flex`}
                              onClick={() => {
                                showExpandViewBoardId.value = null
                                isFullyExpandViewBoard.value = false
                              }}
                            >
                              <X size={18} />
                            </Button>
                          )}
                        </Flex>
                      )
                    )}
                  </Flex>
                ) : (
                  <Move size={18} />
                )}
              </div>
            )}
            {globalSearchTerm && board.tabName && (
              <Badge
                onClick={() => {
                  setCurrentTab?.(board.tabId)
                  closeGlobalSearch?.()
                }}
                variant="secondary"
                className="absolute top-0 right-2 rounded-[4px] text-slate-400 hover:text-blue-400 hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-blue-500 dark:bg-slate-800"
              >
                {board.tabName}
              </Badge>
            )}
            {isExpandedView && (
              <Dot
                className={`absolute text-${
                  board.color ? board.color : 'slate'
                }-400 dark:text-${
                  board.color ? board.color : 'slate'
                }-800 top-[-15px] left-[-5px] animate-in fade-in duration-500`}
                size={28}
              />
            )}
          </CardHeader>
        </ContextMenuTrigger>
        {(isHovering || contextMenuOpen.value) && (
          <ClipsBoardContextMenu
            itemId={board.id}
            showDeleteBoard={hasChildren}
            itemParentId={board.parentId}
            icon={board.icon}
            currentTabLayout={currentTabLayout}
            iconVisibility={board.iconVisibility}
            isEdit={isEditBoard}
            isShowDescription={board.showDescription}
            hasDescription={!!board.description}
            setEditBoard={(boardId: UniqueIdentifier | null) => {
              editBoardItemId.value = boardId
            }}
            onShowDescriptionChange={(
              boardId: UniqueIdentifier,
              showDescription: boolean
            ) => {
              updateItemById({
                updatedItem: {
                  showDescription,
                  itemId: boardId,
                },
              })
            }}
          />
        )}
      </ContextMenu>

      <CardContent className="m-0 p-0 pb-2 pr-3 pl-2 relative h-full">
        <OverlayScrollbarsComponent
          defer
          options={{
            overflow: {
              x: 'hidden',
            },
            scrollbars: {
              theme: isDark ? 'os-theme-light' : 'os-theme-dark',
              autoHide: 'move',
            },
          }}
          style={{
            maxHeight:
              isSubBoard || currentTabLayout === 'auto'
                ? 400
                : board.showDescription && board.description && panelHeight
                  ? panelHeight - (showEditControls ? 156 : 90)
                  : panelHeight && panelHeight - (showEditControls ? 126 : 60),
          }}
        >
          {(isHistoryDragActive || isNewClip) &&
            !Boolean(showEditClipId.value) &&
            !Boolean(newClipItemId.value) && (
              <BoardDropZone
                board={board}
                isNewClip={isNewClip}
                isCreatingClip={creatingClipItemBoardId.value === board.id}
              />
            )}

          <SortableContext
            items={childrenIds}
            strategy={() => null}
            disabled={isHistoryDragActive || isNewClip}
          >
            {board.children?.length &&
              splitIntoRows(board.children as Board[], board.layoutSplit || 1).map(
                (boardRow: Board[], index: number) => {
                  return (
                    boardRow.length > 0 && (
                      <div key={index}>
                        {index > 0 && (
                          <Separator className="mt-2 mb-1 ml-1" color={color} />
                        )}
                        <OverlayScrollbarsComponent
                          defer
                          style={{ width: '100%' }}
                          options={{
                            scrollbars: {
                              theme: isDark ? 'os-theme-light' : 'os-theme-dark',
                              autoHide: 'move',
                            },
                          }}
                        >
                          <div
                            className={`${isFlex ? 'flex' : 'grid'} ${
                              isFlexNoWrap ? 'flex-nowrap' : 'flex-wrap'
                            } justify-normal gap-2.5 items-start ${
                              board.name ? 'mt-2.5' : ''
                            } mb-2 ml-2 mr-1 ${isGrid ? board.layout : ''}`}
                          >
                            {boardRow?.map((item: Board | Clip) => {
                              const isClipEdit = showEditClipId.value === item.id
                              return (
                                <div
                                  key={item.id}
                                  className={`${
                                    isClipEdit || newClipItemId.value === item.id
                                      ? 'min-w-[265px] duration-100 '
                                      : 'min-w-[140px] '
                                  } ${
                                    board.layoutItemsMaxWidth
                                      ? board.layoutItemsMaxWidth
                                      : !(isClipEdit || newClipItemId.value === item.id)
                                        ? 'max-w-fit'
                                        : 'max-w-full'
                                  }  hover:z-100 ${isFlex ? board.layout : ''}`}
                                >
                                  {item.type === BOARD ? (
                                    <BoardComponentMemorized
                                      isHistoryDragActive={isHistoryDragActive}
                                      dragOverBoardId={dragOverBoardId}
                                      isDark={isDark}
                                      board={item as Board}
                                      boardColor={color}
                                      showDragHandle={
                                        showOrganizeThisBoard || isEditBoard
                                      }
                                      currentTabLayout={currentTabLayout}
                                      isSubBoard
                                      selectedItemIds={selectedItemIds}
                                      setSelectedItemId={setSelectedItemId}
                                      showDetailsItem={showDetailsItem}
                                      setShowDetailsItem={setShowDetailsItem}
                                      keyboardSelectedClipId={keyboardSelectedClipId}
                                      currentSelectedBoardId={currentSelectedBoardId}
                                      keyboardNavigationMode={keyboardNavigationMode}
                                    />
                                  ) : (
                                    item.type === CLIP && (
                                      <ClipCardMemoized
                                        clip={item}
                                        boardColor={color}
                                        isMp3={
                                          item.isLink && item.value?.endsWith('.mp3')
                                        }
                                        isMp3File={
                                          item.isPath && item.value?.endsWith('.mp3')
                                        }
                                        isPlaying={
                                          isSongWithIdAndTypePlaying(item.id, 'clip') &&
                                          isPlaying
                                        }
                                        isClipNotesHoverCardsEnabled={
                                          isClipNotesHoverCardsEnabled &&
                                          !showOrganizeLayoutValue &&
                                          !showOrganizeThisBoard
                                        }
                                        clipNotesHoverCardsDelayMS={
                                          clipNotesHoverCardsDelayMS
                                        }
                                        clipNotesMaxHeight={clipNotesMaxHeight}
                                        clipNotesMaxWidth={clipNotesMaxWidth}
                                        globalSearchTerm={globalSearchTerm}
                                        isGlobalSearchBoardsOnly={
                                          isGlobalSearchBoardsOnly
                                        }
                                        closeGlobalSearch={closeGlobalSearch}
                                        isDark={isDark}
                                        isClipDelete={
                                          showDeleteClipConfirmationId.value === item.id
                                        }
                                        isClipNameEditing={
                                          showEditClipNameId.value === item.id
                                        }
                                        isClipEdit={
                                          isClipEdit || newClipItemId.value === item.id
                                        }
                                        canReorangeItems={
                                          showEditControls || showOrganizeThisBoard
                                        }
                                        isShowOrganizeLayoutValue={
                                          showOrganizeLayoutValue
                                        }
                                        isHistoryDragActive={isHistoryDragActive}
                                        isShowDetails={showDetailsItem === item.id}
                                        setShowDetailsItem={setShowDetailsItem}
                                        setSelectedItemId={setSelectedItemId}
                                        isSelected={selectedItemIds.includes(item.id)}
                                        selectedOrder={
                                          selectedItemIds.indexOf(item.id) + 1
                                        }
                                        isKeyboardSelected={
                                          keyboardSelectedClipId?.value === item.id
                                        }
                                        isSingleClickToCopyPaste={
                                          isSingleClickToCopyPaste
                                        }
                                      />
                                    )
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </OverlayScrollbarsComponent>
                      </div>
                    )
                  )
                }
              )}
          </SortableContext>
        </OverlayScrollbarsComponent>
        {showEditControls && (
          <>
            <Spacer h={11} />
            <Flex className="justify-between w-full pl-2 pr-2 mt-2 absolute bottom-1 left-0">
              <BoardDelete
                boardName={board.name}
                isNewBoard={isNewBoard}
                boardId={board.id}
              />
              <Flex className="w-full scroll-h-tabs-wrap">
                {hasChildren && (
                  <SimpleBar
                    style={{ minWidth: '100%' }}
                    forceVisible="y"
                    autoHide={false}
                  >
                    <Tabs
                      className="min-w-[280px] flex flex-row mt-[2px]"
                      title={t('Change Layout', { ns: 'dashboard' })}
                      activationMode="manual"
                      value={board.layout || 'flex-auto'}
                      onValueChange={async layout => {
                        if (updateItemByIdPending) {
                          return
                        }
                        await updateItemById({
                          updatedItem: {
                            layout,
                            itemId: board.id,
                          },
                        })
                      }}
                    >
                      <Flex className="w-full">
                        <Flex className="mr-2">
                          {board.layoutSplit > 1 && (
                            <Badge
                              onClick={() => {
                                updateItemById({
                                  updatedItem: {
                                    layoutSplit:
                                      board.layoutSplit > 4 ? 1 : board.layoutSplit + 1,
                                    itemId: board.id,
                                  },
                                })
                              }}
                              variant="outline"
                              className="bg-white border border-white dark:border-slate-600 dark:bg-slate-600 cursor-pointer px-1.5 mr-1"
                            >
                              <Text className="font-mono text-slate-400 font-semibold">
                                {board.layoutSplit}
                              </Text>
                            </Badge>
                          )}

                          <Button
                            variant="light"
                            title={t('Vertical Split', { ns: 'dashboard' })}
                            onClick={() => {
                              updateItemById({
                                updatedItem: {
                                  layoutSplit:
                                    board.layoutSplit > 4 ? 1 : board.layoutSplit + 1,
                                  itemId: board.id,
                                },
                              })
                            }}
                            className="px-1 py-2 bg-gray-50 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer opacity-80 hover:opacity-100 hover:text-grey-500 h-8 w-8"
                          >
                            <FlipVertical size={18} className="opacity-70" />
                          </Button>
                        </Flex>
                        <Flex className="mr-0.5">
                          <Badge
                            variant="outline"
                            title={t('Layout Max Width', { ns: 'dashboard' })}
                            onClick={() => {
                              let newLayoutItemsMaxWidthIndex =
                                MAX_ITEMS_LAYOUT_WIDTH.findIndex(
                                  layout => layout === board.layoutItemsMaxWidth
                                )

                              if (newLayoutItemsMaxWidthIndex === -1) {
                                newLayoutItemsMaxWidthIndex = 0
                              } else {
                                newLayoutItemsMaxWidthIndex =
                                  (newLayoutItemsMaxWidthIndex + 1) %
                                  MAX_ITEMS_LAYOUT_WIDTH.length
                              }

                              const newLayoutItemsMaxWidth =
                                MAX_ITEMS_LAYOUT_WIDTH[newLayoutItemsMaxWidthIndex]

                              updateItemById({
                                updatedItem: {
                                  layoutItemsMaxWidth: newLayoutItemsMaxWidth,
                                  itemId: board.id,
                                },
                              })
                            }}
                            className="bg-white border border-white dark:border-slate-600 dark:bg-slate-600 cursor-pointer px-2 py-3 h-6 mr-1"
                          >
                            <Text className="text-slate-400 font-semibold text-md uppercase">
                              {board.layoutItemsMaxWidth
                                ? board.layoutItemsMaxWidth?.replace('max-w-', '')
                                : 'fit'}
                            </Text>
                          </Badge>
                        </Flex>
                        <TabsList className="self-center text-primary/40">
                          <TabsTrigger value="flex-auto" className="text-xs px-2 py-1">
                            <StretchHorizontal size={18} className="opacity-70" />
                          </TabsTrigger>

                          <TabsTrigger value="flex-1" className="text-xs px-2 py-1">
                            <LayoutPanelTop
                              size={18}
                              className="opacity-60 transform -scale-y-100"
                            />
                          </TabsTrigger>

                          <TabsTrigger value="flex-nowrap" className="text-xs px-2 py-1">
                            <AlignVerticalSpaceAround size={18} className="opacity-60" />
                          </TabsTrigger>

                          <TabsTrigger
                            value={`grid-cols-${gridCols}`}
                            className="text-xs px-2 py-1"
                          >
                            <LayoutGrid
                              size={18}
                              className="opacity-60"
                              onClick={e => {
                                e.stopPropagation()
                                updateItemById({
                                  updatedItem: {
                                    layout: `grid-cols-${
                                      gridCols > 3 ? 1 : gridCols + 1
                                    }`,
                                    itemId: board.id,
                                  },
                                })
                              }}
                            />
                          </TabsTrigger>
                        </TabsList>
                        {isGrid && (
                          <Badge
                            title={t('Number of columns', { ns: 'dashboard' })}
                            onClick={() => {
                              updateItemById({
                                updatedItem: {
                                  layout: `grid-cols-${gridCols > 3 ? 1 : gridCols + 1}`,
                                  itemId: board.id,
                                },
                              })
                            }}
                            variant="outline"
                            className="bg-white border border-white dark:border-slate-600 dark:bg-slate-600 cursor-pointer px-1.5 ml-1"
                          >
                            <Text className="font-mono text-slate-400 font-semibold">
                              {gridCols}
                            </Text>
                          </Badge>
                        )}
                      </Flex>
                    </Tabs>
                  </SimpleBar>
                )}
              </Flex>
              <Button
                variant="light"
                title={`${hasChildren ? t('Done', { ns: 'common' }) : ''}`}
                onClick={() => {
                  if (isBoardNameEditing.value) {
                    showBoardNameNotSavedError.value = true
                    return
                  }

                  closeEdit()
                }}
                className="px-2 text-blue-500 animate-in fade-in bg-gray-50 hover:bg-grey-100 cursor-pointer opacity-90 hover:opacity-100 hover:text-blue-600"
              >
                {!hasChildren ? (
                  <>
                    <CheckIcon size={19} className="mr-1" />
                    {t('Done', { ns: 'common' })}
                  </>
                ) : (
                  <CheckIcon size={19} />
                )}
              </Button>
            </Flex>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const BoardComponentMemorized = memo(BoardComponent)

export function BoardWithPanel({
  board,
  isDragPreview,
  isDark,
  isSubBoard,
  isHistoryDragActive,
  dragOverBoardId,
  onResizeCallBack,
  panelHeight,
  currentTabLayout,
  selectedItemIds,
  showDetailsItem,
  setShowDetailsItem,
  order,
  isLastBoard,
  setSelectedItemId,
  keyboardSelectedClipId,
  currentSelectedBoardId,
  keyboardNavigationMode,
}: BoardProps) {
  return (
    <ResizePanel
      defaultSize={50}
      isCollapsible={false}
      collapsedSize={6}
      minSize={6}
      id={board.id.toString()}
      order={order}
      className="board-panel_tour"
      onResize={size => {
        onResizeCallBack?.(size)
      }}
      hasResizeHandle={!isDragPreview}
      isLastPanel={isLastBoard}
    >
      <BoardComponentMemorized
        key={board.id}
        board={board}
        boardColor={board.color}
        order={order}
        panelHeight={panelHeight}
        isHistoryDragActive={isHistoryDragActive}
        dragOverBoardId={dragOverBoardId}
        currentTabLayout={currentTabLayout}
        isSubBoard={isSubBoard}
        selectedItemIds={selectedItemIds}
        setSelectedItemId={setSelectedItemId}
        showDetailsItem={showDetailsItem}
        setShowDetailsItem={setShowDetailsItem}
        isDark={isDark}
        isDragPreview={isDragPreview}
        keyboardSelectedClipId={keyboardSelectedClipId}
        currentSelectedBoardId={currentSelectedBoardId}
        keyboardNavigationMode={keyboardNavigationMode}
      />
    </ResizePanel>
  )
}

export const BoardWithPanelMemorized = memo(BoardWithPanel)

export function FakeContext({ children }: { children: React.ReactNode }) {
  return children
}

function splitIntoRows(children: Board[], numberOfRows: number) {
  const length = children.length
  const segmentSize = Math.ceil(length / numberOfRows)
  const rows: Board[][] = Array.from({ length: numberOfRows }, () => [])

  children.forEach((child: Board, index) => {
    const rowIndex = Math.min(Math.floor(index / segmentSize), numberOfRows - 1)
    rows[rowIndex].push(child)
  })

  return rows
}
