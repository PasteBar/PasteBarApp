import { createRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  CollisionDetection,
  defaultDropAnimation,
  DndContext,
  DragOverlay,
  DropAnimation,
  getFirstCollision,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  UniqueIdentifier,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Portal } from '@radix-ui/react-portal'
import createBoardTree from '~/libs/create-board-tree'
import {
  activeOverTabId,
  collectionsStoreAtom,
  createFirstBoard,
  currentNavigationContext,
  isFullyExpandViewBoard,
  isKeyAltPressed,
  keyboardSelectedBoardId,
  keyboardSelectedClipId,
  playerStoreAtom,
  settingsStoreAtom,
  showClipsMoveOnBoardId,
  showDetailsClipId,
  showEditClipId,
  showExpandViewBoardId,
  showLinkedClipId,
  showOrganizeLayout,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  ArrowRightLeft,
  Check,
  ChevronsDown,
  ChevronsUp,
  Clipboard,
  ClipboardPaste,
  LayoutList,
  ListChecks,
  PanelTop,
  Pin,
  Plus,
  X,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'

import { bgColor } from '~/lib/utils'

import AutoSize from '~/components/libs/autosizer'
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
} from '~/components/libs/react-resizable-panels/src'
import SimpleBar from '~/components/libs/simplebar-react'
import {
  Badge,
  BadgeWithRef,
  Box,
  Button,
  ButtonGhost,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropZone,
  Flex,
  Text,
  UnPinAll,
} from '~/components/ui'

import {
  useGetCollections,
  useGetCollectionWithClips,
  useUpdateMovedClipsInCollection,
} from '~/hooks/queries/use-collections'
import {
  useCreateItem,
  useMovePinnedClipUpDown,
  usePinnedClipsByIds,
  useUnpinAllClips,
} from '~/hooks/queries/use-items'
import { useUpdateTabs } from '~/hooks/queries/use-tabs'
import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'
import { useLocalStorage } from '~/hooks/use-localstorage'
// import { useNavigation } from '~/hooks/use-navigation'
import { useSignal } from '~/hooks/use-signal'

import { Item } from '~/types/menu'

import type { Board } from './components/Board'
import { BoardComponent, BoardWithPanelMemorized, FakeContext } from './components/Board'
import BoardTabs from './components/BoardTabs'
import { Clip, ClipCard, ClipCardMemoized } from './components/ClipCard'
import ResizeHandle from './components/ResizePanel/ResizeHandle'
import {
  collectChildrenIds,
  coordinateGetter,
  findBoardsById,
  hasDraggableData,
} from './components/utils'

export const BOARD = 'board' as const
export const CLIP = 'clip' as const
export const TAB = 'tab' as const

export type UpdatedClip = {
  itemId: string
  name: string
  parentId: string | null
  tabId?: string | null
  collectionId: string | null
  orderNumber: number
}

function DashboardComponent({
  historyDragActive,
  isDark,
  dragOverBoardId,
}: {
  historyDragActive: boolean
  isDark: boolean
  dragOverBoardId?: UniqueIdentifier | null
}) {
  useGetCollections()

  const { t } = useTranslation()
  const { isShowPinned, setIsShowPinned, isSplitPanelView } = useAtomValue(uiStoreAtom)
  const [showDetailsItem, setShowDetailsItem] = useState<UniqueIdentifier | null>(null)
  const [dragOverPinnedId, setDragOverPinnedId] = useState<UniqueIdentifier | null>(null)
  const [showDetailsItemPinned, setShowDetailsItemPinned] =
    useState<UniqueIdentifier | null>(null)

  const { isPlaying, isSongWithIdAndTypePlaying } = useAtomValue(playerStoreAtom)

  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const pinnedClipsPanelRef = useRef<ImperativePanelHandle>(null)
  const { updateTabs } = useUpdateTabs()
  const {
    invalidateCollectionWithClips,
    isCollectionWithClipsLoadingFinished,
    isCollectionWithClipsLoading,
  } = useGetCollectionWithClips()
  const { updateMovedClips } = useUpdateMovedClipsInCollection()
  const { movePinnedClipUpDown } = useMovePinnedClipUpDown()

  const [, , , runSequencePasteItems] = usePasteClipItem({})
  const [, , runSequenceCopyItems] = useCopyClipItem({})

  const [selectedItemIds, setSelectedItemIds] = useState<UniqueIdentifier[]>([])
  const [isDragCancelled, setIsDragCancelled] = useState(false)
  const panelHeightRef = useRef<ImperativePanelHandle>(null)

  const isPinnedPanelHovering = useSignal(false)
  const isPinnedPanelKeepOpen = useSignal(false)
  const isPinnedPanelReorder = useSignal(false)
  const expandedPanels = useSignal<
    {
      id: string
      size: number[]
    }[]
  >([])

  useEffect(() => {
    try {
      expandedPanels.value = JSON.parse(localStorage.getItem('expandedPanels') || '[]')
    } catch (error) {
      console.error('Failed to load expanded panels', error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('expandedPanels', JSON.stringify(expandedPanels.value))
    } catch (error) {
      console.error('Failed to save expanded panels', error)
    }
  }, [expandedPanels.value.length])

  const panelGroupRefs = useRef<{ [key: string]: React.RefObject<any> }>({})

  const isPinnedPanelHoverOpen = useMemo(() => {
    if (pinnedClipsPanelRef?.current && pinnedClipsPanelRef?.current?.getSize() === 0) {
      return false
    }
    return isPinnedPanelKeepOpen.value || isPinnedPanelHovering.value
  }, [
    isPinnedPanelHovering.value,
    isPinnedPanelKeepOpen.value,
    pinnedClipsPanelRef?.current,
  ])

  const isKeyAltPressedValue = useMemo(
    () => isKeyAltPressed.value,
    [isKeyAltPressed.value]
  )

  const { createNewItem } = useCreateItem()
  const { unPinAllClips } = useUnpinAllClips()
  const { updatePinnedClipsByIds } = usePinnedClipsByIds()

  const {
    clipItems,
    pinnedClips,
    tabs,
    tabsLoaded,
    setCurrentTab,
    setTabsByOrder,
    currentTab,
    setClipItemsDebounced,
    setClipItems,
    currentCollectionId,
  } = useAtomValue(collectionsStoreAtom)

  const {
    copyPasteSequencePinnedDelay,
    setCopyPasteSequencePinnedDelay,
    copyPasteSequenceIsReversOrder,
    setCopyPasteSequenceIsReversOrder,
    isClipNotesHoverCardsEnabled,
    clipNotesHoverCardsDelayMS,
    clipNotesMaxHeight,
    isSimplifiedLayout,
    clipNotesMaxWidth,
    isSingleClickToCopyPaste,
  } = useAtomValue(settingsStoreAtom)

  const boardsIds = useMemo(
    () =>
      clipItems
        .filter(
          ({ parentId, isBoard, tabId }) =>
            parentId === null && isBoard && tabId === currentTab
        )
        .map(board => board.itemId),
    [clipItems]
  )

  // // Prepare board contexts for navigation
  // const boardContexts = useMemo(() => {
  //   return clipItems
  //     .filter(
  //       ({ parentId, isBoard, tabId }) =>
  //         parentId === null && isBoard && tabId === currentTab
  //     )
  //     .map(board => ({
  //       boardId: board.itemId.toString(),
  //       boardName: board.name,
  //       clips: clipItems
  //         .filter(
  //           ({ parentId, isClip, tabId }) =>
  //             parentId === board.itemId && isClip && tabId === currentTab
  //         )
  //         .map(clip => ({ id: clip.itemId, itemId: clip.itemId }))
  //     }))
  // }, [clipItems, currentTab])

  // // Use unified navigation hook (empty history items for Dashboard only)
  // const { selectedClipId } = useNavigation({
  //   historyItems: [],
  //   boardContexts,
  // })

  useEffect(() => {
    if (pinnedClips.length === 0) {
      isPinnedPanelHovering.value = false
      isPinnedPanelKeepOpen.value = false
    }
  }, [pinnedClips])

  useEffect(() => {
    if (pinnedClips.length > 0) {
      pinnedClipsPanelRef?.current?.expand()
    } else {
      pinnedClipsPanelRef?.current?.collapse()
    }
  }, [pinnedClips, pinnedClipsPanelRef])

  const [activeDragBoard, setActiveDragBoard] = useState<Board | null>(null)
  const [activeDragClip, setActiveDragClip] = useState<Clip | null>(null)

  const DragOverCallback = useCallback(onDragOver, [
    isKeyAltPressedValue,
    activeDragBoard,
    activeDragClip,
    clipItems,
  ])

  const setSelectedItemId = useCallback(
    (id: UniqueIdentifier) => {
      setSelectedItemIds(prev => {
        const isSelected = prev.includes(id)
        return isSelected ? prev.filter(_id => _id !== id) : [...prev, id]
      })
    },
    [setSelectedItemIds]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { tolerance: 100, delay: 600 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  )

  const sensorsGrabHandle = useSensors(
    useSensor(PointerSensor, { activationConstraint: { tolerance: 10, delay: 60 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  )

  const hasSelectedPinned = selectedItemIds.some(item => {
    return pinnedClips.some(pinnedItem => pinnedItem.id === item)
  })

  const boardBoardTree =
    clipItems.length > 0 ? createBoardTree(clipItems, currentTab) : []

  const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
      if (isDragCancelled || activeOverTabId.value || dragOverPinnedId) {
        return [
          {
            opacity: 0.7,
          },
          {
            opacity: 0,
          },
        ]
      }
      return [
        { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
        {
          opacity: 0,
          transform: CSS.Transform.toString({
            ...transform.final,
          }),
        },
      ]
    },
    easing: 'ease-out',
    duration: isDragCancelled ? 0 : 300,
    sideEffects({ active, dragOverlay }) {
      if (activeDragClip || activeOverTabId.value || dragOverPinnedId) {
        dragOverlay.node.animate([{ opacity: 0.7 }, { opacity: 0 }], {
          duration: 300,
          easing: defaultDropAnimation.easing,
        })
      } else {
        active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: defaultDropAnimation.duration,
          easing: defaultDropAnimation.easing,
        })
      }
    },
  }

  const clipsIds = useMemo(
    () => clipItems.filter(({ isClip }) => isClip).map(board => board.itemId),
    [clipItems, activeDragClip]
  )

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    args => {
      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args)
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args)
      let overId = getFirstCollision(intersections, 'id')

      if (overId != null) {
        if (overId in clipsIds) {
          const containerItems = clipItems.map(
            item => item.parentId === overId && item.itemId
          ) as UniqueIdentifier[]

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                container =>
                  container.id !== overId && containerItems.includes(container.id)
              ),
            })[0]?.id
          }
        }

        lastOverId.current = overId

        return [{ id: overId }]
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [activeDragBoard, activeDragClip, clipsIds, clipItems]
  )

  const DndContextWrapper = useMemo(
    () => (historyDragActive ? FakeContext : DndContext),
    [historyDragActive]
  )

  const { tabLayoutSplit: currentTabLayoutSplit = 1, tabLayout: currentTabLayout } =
    tabs.find(tab => tab.tabId === currentTab) ?? {}

  const panelHeight = panelHeightRef?.current?.getSizePixels() || 0
  const pinnedPanelHeight = pinnedClipsPanelRef?.current?.getSizePixels() || 0

  useEffect(() => {
    setShowDetailsItem(showDetailsClipId.value)
  }, [showDetailsClipId.value])

  useEffect(() => {
    if (showLinkedClipId.value || showEditClipId.value) {
      const itemId = showEditClipId.value || showLinkedClipId.value
      const item = clipItems.find(item => item.itemId === itemId)

      if (item?.tabId) {
        setCurrentTab(item.tabId)
      }

      if (showLinkedClipId.value) {
        setShowDetailsItem(showLinkedClipId.value)
      }

      setTimeout(() => {
        showLinkedClipId.value = null
      }, 2000)
    }
  }, [showLinkedClipId.value, showEditClipId.value])

  const getPanelGroupRef = (key: string) => {
    if (!panelGroupRefs.current[key]) {
      panelGroupRefs.current[key] = createRef()
    }
    return panelGroupRefs.current[key]
  }

  const expandedBoard = useMemo(() => {
    return findBoardsById(boardBoardTree, showExpandViewBoardId.value)
  }, [showExpandViewBoardId.value, boardBoardTree]) as Board

  const isFullyExpandViewBoardValue = useMemo(
    () => isFullyExpandViewBoard.value,
    [isFullyExpandViewBoard.value]
  )

  return (
    <DndContextWrapper
      sensors={showOrganizeLayout.value ? sensorsGrabHandle : sensors}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={onDragStart}
      onDragCancel={() => {
        setIsDragCancelled(true)
        setActiveDragBoard(null)
        setActiveDragClip(null)
        invalidateCollectionWithClips()
        setTimeout(() => {
          setIsDragCancelled(false)
        }, 300)
      }}
      onDragEnd={onDragEnd}
      onDragOver={DragOverCallback}
    >
      <SortableContext items={boardsIds} strategy={() => null}>
        <PanelGroup
          autoSaveId="ClipsDashboard"
          direction="vertical"
          className={`flex ${
            !isSplitPanelView ? 'pt-4' : 'pt-2'
          } clips-dashboard-panel_tour`}
        >
          {isShowPinned && (
            <>
              <Panel
                collapsible={true}
                ref={pinnedClipsPanelRef}
                defaultSize={12}
                id="pinned-clips"
                order={1}
                minSize={4}
                maxSize={30}
                className={`flex flex-col ${
                  activeDragClip
                    ? dragOverPinnedId
                      ? 'bg-orange-200/70 dark:bg-orange-600/70'
                      : 'bg-orange-100 dark:bg-orange-500/70'
                    : 'bg-orange-300/40 dark:bg-orange-700/40'
                } rounded-lg px-2 py-4 pt-3 ${
                  isSimplifiedLayout && !isSplitPanelView ? 'mr-2' : 'mx-2 mr-3'
                } relative`}
              >
                <DropZone
                  id="clips::pinnedzone"
                  className={`w-full h-full`}
                  isActive={Boolean(activeDragClip)}
                >
                  {activeDragClip && (
                    <Box className="z-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-full w-full flex items-center justify-center p-1.5">
                      <Box
                        className={`border-2 ${
                          dragOverPinnedId
                            ? 'border-orange-500 dark:border-orange-400'
                            : 'border-slate-300/80 dark:border-slate-400/80'
                        } border-dashed rounded-md flex items-center justify-center h-full w-full`}
                      >
                        {!dragOverPinnedId ? (
                          <Pin
                            size={18}
                            className="text-orange-500/80 dark:!text-orange-400/80 hover:text-orange-400 animate-in fade-in duration-300"
                          />
                        ) : (
                          <Text className="!text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 !font-medium animate-in fade-in duration-300 text-sm">
                            {t('Drop to Pin', { ns: 'dashboard' })}
                          </Text>
                        )}
                      </Box>
                    </Box>
                  )}
                  <AutoSize disableWidth defaultHeight={pinnedPanelHeight - 20}>
                    {({ height }: { height: number }) => (
                      <SimpleBar
                        style={{ height }}
                        onMouseEnter={() => {
                          isPinnedPanelHovering.value = true
                        }}
                        onMouseLeave={() => {
                          isPinnedPanelHovering.value = false
                        }}
                        onClick={() => {
                          isPinnedPanelHovering.value = true
                        }}
                      >
                        <Flex
                          className={`flex flex-wrap justify-normal gap-2 items-start mt-3 mb-1 ml-1 relative ${
                            activeDragClip ? 'opacity-20' : ''
                          }`}
                        >
                          {pinnedClips.map((clip, index) => (
                            <ClipCardMemoized
                              key={clip.id}
                              clip={clip}
                              isDark={isDark}
                              isMp3={clip.isLink && clip.value?.endsWith('.mp3')}
                              isPlaying={
                                isSongWithIdAndTypePlaying(clip.id, 'clip') && isPlaying
                              }
                              isClipNotesHoverCardsEnabled={isClipNotesHoverCardsEnabled}
                              clipNotesHoverCardsDelayMS={clipNotesHoverCardsDelayMS}
                              clipNotesMaxHeight={clipNotesMaxHeight}
                              clipNotesMaxWidth={clipNotesMaxWidth}
                              isDisabledPinnedMoveUp={index === 0}
                              isDisabledPinnedMoveDown={index === pinnedClips.length - 1}
                              onMovePinnedUpDown={move => {
                                movePinnedClipUpDown(move)
                              }}
                              isShowDetails={showDetailsItemPinned === clip.id}
                              setShowDetailsItem={setShowDetailsItemPinned}
                              setSelectedItemId={setSelectedItemId}
                              isSelected={selectedItemIds.includes(clip.id)}
                              selectedOrder={selectedItemIds.indexOf(clip.id) + 1}
                              boardColor={'gray'}
                              isShowOrganizeLayoutValue={
                                showOrganizeLayout.value || isPinnedPanelReorder.value
                              }
                              isPinnedBoard={true}
                              isSingleClickToCopyPaste={isSingleClickToCopyPaste}
                            />
                          ))}
                        </Flex>
                      </SimpleBar>
                    )}
                  </AutoSize>
                </DropZone>
                {pinnedClips.length > 0 && !activeDragClip && (
                  <Flex
                    className={`justify-between absolute right-0 bottom-1 ${
                      isPinnedPanelReorder.value ? 'px-1' : 'px-2.5'
                    } w-full`}
                    onMouseEnter={() => {
                      isPinnedPanelHovering.value = true
                    }}
                    onMouseLeave={() => {
                      isPinnedPanelHovering.value = false
                    }}
                    onClick={() => {
                      isPinnedPanelHovering.value = true
                    }}
                  >
                    {isShowPinned &&
                      !isPinnedPanelReorder.value &&
                      !showOrganizeLayout.value && (
                        <>
                          <Flex
                            className={`animate-in fade-in duration-300 ${
                              historyDragActive ||
                              dragOverPinnedId ||
                              !isPinnedPanelHoverOpen
                                ? 'opacity-0'
                                : ''
                            }`}
                          >
                            <ButtonGhost
                              className="group text-orange-500/80 dark:!text-orange-400/80 hover:text-orange-400 hover:bg-transparent dark:hover:bg-transparent pl-0.5 pr-1 pt-0 "
                              title={
                                isKeyAltPressedValue
                                  ? t('Sequence Paste', { ns: 'common' })
                                  : t('Sequence Copy', { ns: 'common' })
                              }
                            >
                              {isKeyAltPressedValue ? (
                                <ClipboardPaste
                                  size={14}
                                  onClick={() => {
                                    runSequencePasteItems(
                                      pinnedClips.map(clip => clip.id)
                                    )
                                  }}
                                />
                              ) : (
                                <Clipboard
                                  size={14}
                                  onClick={() => {
                                    runSequenceCopyItems(pinnedClips.map(clip => clip.id))
                                  }}
                                />
                              )}
                            </ButtonGhost>
                            <DropdownMenu
                              onOpenChange={isOpen => {
                                isPinnedPanelKeepOpen.value = isOpen
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <BadgeWithRef
                                  variant="outline"
                                  title={t('Sequence Delay Next', {
                                    ns: 'common',
                                  })}
                                  className="bg-orange-300/20 border-orange-300/50 dark:bg-orange-900/70 dark:border-orange-800/50 border h-[18px] cursor-pointer px-1.5 ml-1"
                                >
                                  <Text className="font-mono !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent font-semibold">
                                    {copyPasteSequencePinnedDelay}s
                                  </Text>
                                </BadgeWithRef>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-44">
                                <DropdownMenuItem
                                  className="text-center items-center justify-center py-0.5"
                                  disabled
                                >
                                  <Text size="xs">
                                    {t('Sequence Copy Paste', { ns: 'common' })}
                                  </Text>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Flex className="flex w-full">
                                      <Text size="xs">
                                        {t('Delay Next', { ns: 'common' })}...
                                      </Text>
                                      <Badge
                                        className="ml-auto py-0 bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                        variant="outline"
                                      >
                                        {copyPasteSequencePinnedDelay}s
                                      </Badge>
                                    </Flex>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequencePinnedDelay === 1}
                                      onSelect={() => {
                                        setCopyPasteSequencePinnedDelay(1)
                                      }}
                                    >
                                      <Text size="xs">
                                        1 {t('second', { ns: 'common' })}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequencePinnedDelay === 2}
                                      onSelect={() => {
                                        setCopyPasteSequencePinnedDelay(2)
                                      }}
                                    >
                                      <Text size="xs">
                                        2 {t('seconds', { ns: 'common' })}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequencePinnedDelay === 3}
                                      onSelect={() => {
                                        setCopyPasteSequencePinnedDelay(3)
                                      }}
                                    >
                                      <Text size="xs">
                                        3 {t('seconds', { ns: 'common' })}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequencePinnedDelay === 4}
                                      onSelect={() => {
                                        setCopyPasteSequencePinnedDelay(4)
                                      }}
                                    >
                                      <Text size="xs">
                                        4 {t('seconds', { ns: 'common' })}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequencePinnedDelay === 5}
                                      onSelect={() => {
                                        setCopyPasteSequencePinnedDelay(5)
                                      }}
                                    >
                                      <Text size="xs">
                                        5 {t('seconds', { ns: 'common' })}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequencePinnedDelay === 10}
                                      onSelect={() => {
                                        setCopyPasteSequencePinnedDelay(10)
                                      }}
                                    >
                                      <Text size="xs">
                                        10 {t('seconds', { ns: 'common' })}
                                      </Text>
                                    </DropdownMenuCheckboxItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Flex className="flex w-full">
                                      <Text size="xs">
                                        {t('Reverse Order', { ns: 'common' })}...
                                      </Text>
                                      <Badge
                                        className="ml-auto py-0 bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                        variant="outline"
                                      >
                                        {copyPasteSequenceIsReversOrder
                                          ? t('Yes', { ns: 'common' })
                                          : t('No', { ns: 'common' })}
                                      </Badge>
                                    </Flex>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem
                                      checked={!copyPasteSequenceIsReversOrder}
                                      onSelect={() => {
                                        setCopyPasteSequenceIsReversOrder(false)
                                      }}
                                    >
                                      <Text size="xs">{t('No', { ns: 'common' })}</Text>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={copyPasteSequenceIsReversOrder}
                                      onSelect={() => {
                                        setCopyPasteSequenceIsReversOrder(true)
                                      }}
                                    >
                                      <Text size="xs">{t('Yes', { ns: 'common' })}</Text>
                                    </DropdownMenuCheckboxItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </Flex>
                          <Box
                            className={`animate-in fade-in duration-300 ${
                              historyDragActive ||
                              dragOverPinnedId ||
                              !isPinnedPanelHoverOpen
                                ? 'opacity-0'
                                : ''
                            }`}
                          >
                            <ButtonGhost
                              title={t('Reorder pinned', { ns: 'common' })}
                              onClick={() => {
                                isPinnedPanelReorder.value = !isPinnedPanelReorder.value
                              }}
                              className="!text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent px-2 pr-0 rounded-sm py-0 h-5"
                            >
                              <ArrowRightLeft size={15} />
                            </ButtonGhost>
                            <ButtonGhost
                              title={
                                hasSelectedPinned
                                  ? t('Deselect pinned', { ns: 'common' })
                                  : t('Select pinned', { ns: 'common' })
                              }
                              onClick={() => {
                                const selectedPinnedItems = selectedItemIds.filter(
                                  item => {
                                    return pinnedClips.some(
                                      pinnedItem => pinnedItem.id === item
                                    )
                                  }
                                )
                                if (hasSelectedPinned) {
                                  setSelectedItemIds(
                                    selectedItemIds.filter(
                                      item => !selectedPinnedItems.includes(item)
                                    )
                                  )
                                } else {
                                  setSelectedItemIds(
                                    selectedItemIds.concat(
                                      pinnedClips.map(pinnedItem => pinnedItem.id)
                                    )
                                  )
                                }
                              }}
                              className="!text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent px-2 pr-0 rounded-sm py-0 h-5"
                            >
                              <Flex className="font-medium text-sm gap-1 !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400">
                                {hasSelectedPinned ? (
                                  <LayoutList size={15} />
                                ) : (
                                  <ListChecks size={17} />
                                )}
                              </Flex>
                            </ButtonGhost>
                            <UnPinAll
                              onOpen={isOpen => {
                                isPinnedPanelKeepOpen.value = isOpen
                              }}
                              onCancel={() => {
                                setTimeout(() => {
                                  isPinnedPanelKeepOpen.value = false
                                  isPinnedPanelHovering.value = false
                                }, 300)
                              }}
                              onConfirm={() => {
                                unPinAllClips({})
                              }}
                              buttonClassName="group !text-orange-400 hover:bg-transparent dark:hover:bg-transparent px-2 pr-0.5 rounded-sm py-0 h-5"
                            />
                          </Box>
                        </>
                      )}
                    {isPinnedPanelReorder.value && (
                      <Button
                        onClick={() => {
                          isPinnedPanelReorder.value = false
                        }}
                        className="!text-orange-600 dark:!text-orange-300 bg-yellow-400 dark:bg-yellow-800 hover:bg-yellow-400/80 dark:hover:bg-yellow-700/80 px-2 pr-1 mr-0 rounded-sm py-0 h-5 flex items-center justify-center ml-auto"
                      >
                        <Text
                          size="xs"
                          className="!text-orange-600 dark:!text-orange-300 mr-1"
                        >
                          {t('Done Reorder', { ns: 'common' })}
                        </Text>
                        <Check size={15} />
                      </Button>
                    )}
                  </Flex>
                )}
                {isCollectionWithClipsLoadingFinished && !activeDragClip && (
                  <ButtonGhost
                    title={t('Hide Pinned Board', { ns: 'common' })}
                    onClick={() => {
                      setIsShowPinned(false)
                    }}
                    className="hover:underline group !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent absolute right-1 top-1.5 px-2 pr-1 rounded-sm"
                  >
                    <Flex className="font-medium text-xs gap-1">
                      <span>
                        {pinnedClips.length > 0
                          ? pinnedClips.length
                          : t(' No', { ns: 'common' })}{' '}
                        {t('Pinned', { ns: 'common', count: pinnedClips.length })}
                      </span>
                      <X size={14} />
                    </Flex>
                  </ButtonGhost>
                )}
              </Panel>
              <ResizeHandle isVertical />
            </>
          )}

          {!isCollectionWithClipsLoading && tabsLoaded && (
            <SortableContext
              items={tabs.map(tab => tab.tabId)}
              disabled={historyDragActive}
              strategy={horizontalListSortingStrategy}
            >
              <BoardTabs
                tabs={tabs}
                selectedItemIds={selectedItemIds}
                setSelectedItemIds={setSelectedItemIds}
                pinnedItemIds={pinnedClips.map(clip => clip.id)}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                isKeyboardNavigationDisabled={currentNavigationContext.value !== null}
              />
            </SortableContext>
          )}

          <Panel
            collapsible={false}
            order={2}
            ref={panelHeightRef}
            id="boards"
            className={
              isSimplifiedLayout && !isSplitPanelView
                ? 'px-0'
                : isSimplifiedLayout
                  ? 'px-1.5'
                  : 'px-0'
            }
          >
            {panelHeight > 0 && (
              <AutoSize disableWidth defaultHeight={panelHeight - 20}>
                {({ height }: { height: number }) => {
                  return (
                    <SimpleBar style={{ height }}>
                      {!expandedBoard ? (
                        boardBoardTree
                          .reduce((resultArray, item, index) => {
                            const chunkIndex = Math.floor(index / currentTabLayoutSplit)

                            if (!resultArray[chunkIndex]) {
                              resultArray[chunkIndex] = []
                            }

                            resultArray[chunkIndex].push(item as Board)

                            return resultArray
                          }, [] as Board[][])
                          .map((boardGroup: Board[], groupIndex) => {
                            const panelGroupKey = `${currentTab}-${groupIndex}`
                            const panelGroupRef = getPanelGroupRef(panelGroupKey)

                            return (
                              <PanelGroup
                                key={panelGroupKey}
                                ref={panelGroupRef}
                                autoSaveId={`${currentTab}-panel-group-${groupIndex}`}
                                className="mb-3"
                                style={{
                                  height:
                                    currentTabLayout === 'full' ? height - 12 : undefined,
                                }}
                                direction="horizontal"
                              >
                                {boardGroup.map((board, index) => (
                                  <BoardWithPanelMemorized
                                    key={`${currentTab}-${groupIndex}-${index}`}
                                    board={board}
                                    isDark={isDark}
                                    panelHeight={height}
                                    isHistoryDragActive={historyDragActive}
                                    dragOverBoardId={dragOverBoardId}
                                    currentTabLayout={
                                      currentTabLayout === 'full' ? 'full' : 'auto'
                                    }
                                    order={board.orderNumber}
                                    isLastBoard={index === boardGroup.length - 1}
                                    showDetailsItem={showDetailsItem}
                                    setShowDetailsItem={setShowDetailsItem}
                                    selectedItemIds={selectedItemIds}
                                    setSelectedItemId={setSelectedItemId}
                                    keyboardSelectedClipId={keyboardSelectedClipId}
                                    currentSelectedBoardId={keyboardSelectedBoardId}
                                    keyboardNavigationMode={currentNavigationContext}
                                  />
                                ))}
                              </PanelGroup>
                            )
                          })
                      ) : (
                        <Box className="relative">
                          <PanelGroup
                            key={'expaned-board'}
                            style={{
                              height: isFullyExpandViewBoardValue
                                ? height - 14
                                : undefined,
                            }}
                            direction="horizontal"
                          >
                            <BoardWithPanelMemorized
                              key={`${currentTab}-expanded-${expandedBoard.id}`}
                              board={expandedBoard}
                              isDark={isDark}
                              panelHeight={height}
                              isHistoryDragActive={historyDragActive}
                              dragOverBoardId={dragOverBoardId}
                              currentTabLayout={
                                isFullyExpandViewBoardValue ? 'full' : 'auto'
                              }
                              order={expandedBoard.orderNumber}
                              isLastBoard={true}
                              showDetailsItem={showDetailsItem}
                              setShowDetailsItem={setShowDetailsItem}
                              selectedItemIds={selectedItemIds}
                              setSelectedItemId={setSelectedItemId}
                              keyboardSelectedClipId={keyboardSelectedClipId}
                              currentSelectedBoardId={keyboardSelectedBoardId}
                              keyboardNavigationMode={currentNavigationContext}
                            />
                            <Flex className="absolute right-0 w-full bottom-[-13px] z-100">
                              <Button
                                title={
                                  isFullyExpandViewBoard.value
                                    ? t('Collapse View', { ns: 'contextMenus' })
                                    : t('Expand View', { ns: 'contextMenus' })
                                }
                                variant={'ghost'}
                                size="mini"
                                className={`px-1.5 py-1 mr-2 text-secondary-foreground/50 ${bgColor(
                                  expandedBoard.color,
                                  '200'
                                )} dark:hover:bg-${
                                  expandedBoard.color
                                }-900 hover:${bgColor(
                                  expandedBoard.color,
                                  '200'
                                )} cursor-pointer rounded-md flex items-center justify-center`}
                                onClick={() => {
                                  isFullyExpandViewBoard.value =
                                    !isFullyExpandViewBoard.value
                                }}
                              >
                                {isFullyExpandViewBoard.value ? (
                                  <ChevronsUp size={20} />
                                ) : (
                                  <ChevronsDown size={20} />
                                )}
                              </Button>
                            </Flex>
                          </PanelGroup>
                        </Box>
                      )}
                      {tabsLoaded && !(boardBoardTree.length && tabs.length) && (
                        <>
                          {!boardBoardTree.length && tabs.length > 0 && (
                            <Flex
                              className="flex items-start justify-center w-full absolute top-4"
                              style={{ height }}
                            >
                              <Flex className="flex-col items-center justify-center">
                                <DropdownMenu defaultOpen={true} modal={false}>
                                  <DropdownMenuTrigger
                                    className="mr-1.5 rounded-sm"
                                    asChild
                                  >
                                    <Box className="flex w-20 group flex-row items-center cursor-pointer justify-center border-2 border-dashed rounded-md p-1.5 hover:border-blue-400 hover:dark:border-blue-500 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:border-slate-500 dark:text-slate-300 border-slate-300">
                                      <Plus
                                        size={20}
                                        className="group-hover:text-blue-400 dark:group-hover:text-blue-300 text-slate-400"
                                      />
                                    </Box>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="center" sideOffset={8}>
                                    <DropdownMenuItem
                                      disabled
                                      className="flex justify-center py-0.5 dark:text-gray-400 text-gray-500"
                                    >
                                      {t('Dashboard', { ns: 'dashboard' })}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      className="outline-none flex items-center"
                                      onClick={() => {
                                        createFirstBoard.value = true
                                      }}
                                    >
                                      <PanelTop size={16} className="mr-2" />
                                      <span>
                                        {t('Add First Board', { ns: 'dashboard' })}
                                      </span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Text className="text-sm mt-4 !text-slate-500">
                                  {t('Create Board', { ns: 'dashboard' })}
                                </Text>
                              </Flex>
                            </Flex>
                          )}
                          <Flex
                            className="flex items-center justify-center w-full h-full"
                            style={{ height }}
                          >
                            <Text className="animate-in fade-in duration-600 text-slate-300 text-xs bg-slate-100 rounded-full px-3 dark:text-slate-600 dark:bg-slate-900">
                              {!tabs.length
                                ? t('No Tabs or Boards', { ns: 'dashboard' })
                                : t('No Boards', { ns: 'dashboard' })}
                            </Text>
                          </Flex>
                        </>
                      )}
                    </SimpleBar>
                  )
                }}
              </AutoSize>
            )}
          </Panel>
        </PanelGroup>
      </SortableContext>
      <Portal>
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeDragBoard && (
            <BoardComponent
              board={activeDragBoard}
              isDragPreview
              isDark={isDark}
              currentTabLayout="auto"
              selectedItemIds={selectedItemIds}
              setSelectedItemId={setSelectedItemId}
            />
          )}
          {activeDragClip && (
            <ClipCard
              clip={activeDragClip}
              isDragPreview
              isClipNotesHoverCardsEnabled={false}
              isDark={isDark}
              isSingleClickToCopyPaste={isSingleClickToCopyPaste}
            />
          )}
        </DragOverlay>
      </Portal>
    </DndContextWrapper>
  )

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return
    if (activeOverTabId.value) {
      activeOverTabId.value = null
    }
    const data = event.active.data.current
    if (data?.type === BOARD) {
      setActiveDragBoard(data.board)
    } else if (data?.type === CLIP) {
      setActiveDragClip(data.clip)
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveDragBoard(null)
    setActiveDragClip(null)
    setTimeout(() => {
      activeOverTabId.value = null
    }, 100)

    const { active, over } = event

    if (!active || !hasDraggableData(active)) {
      return
    }

    const activeId = active.id

    if (active?.id === dragOverPinnedId) {
      setTimeout(async () => {
        setDragOverPinnedId(null)
        await updatePinnedClipsByIds({
          itemIds: [active.id],
          isPinned: true,
        })
      }, 300)
    }

    if (active.data.current?.type === TAB && over?.data.current?.type === TAB) {
      const overId = over?.id
      const activeIndex = tabs.findIndex(({ tabId }) => tabId === activeId)
      const overIndex = tabs.findIndex(({ tabId }) => tabId === overId)
      const tabsWithNewOrder = arrayMove(tabs, activeIndex, overIndex)
      const tabsIdToNewIndexMap = new Map(
        tabsWithNewOrder.map((tab, index) => [tab.tabId, index])
      )

      const newTabs = tabs.map(tab => {
        const newIndex = tabsIdToNewIndexMap.get(tab.tabId)
        if (newIndex !== undefined) {
          tab.tabOrderNumber = newIndex
        }
        return tab
      })

      setTabsByOrder(newTabs)

      await updateTabs({ updatedTabs: newTabs })

      return
    }

    if (over?.data.current?.type === TAB) {
      const targetTabId = over.id
      const movingBoard = clipItems.find(item => item.itemId === activeId && item.isBoard)
      const movingClip = clipItems.find(item => item.itemId === activeId && item.isClip)

      if (
        movingBoard?.tabId === targetTabId ||
        movingClip?.tabId === targetTabId ||
        !targetTabId
      ) {
        return
      }

      if (movingBoard) {
        const targetTabId = over.id.toString()
        const isSubBoard = active.data?.current?.isSubBoard
        const targetTabBoardTree =
          isSubBoard && active.data?.current?.board.parentId
            ? createBoardTree(clipItems, currentTab, active.data?.current?.board.parentId)
            : createBoardTree(clipItems, currentTab)

        const movedBoard = targetTabBoardTree.find(board => board.id === activeId)

        if (!movedBoard) {
          return
        }

        const allChildrenIds = movedBoard ? collectChildrenIds(movedBoard) : []

        const boardsInTargetTab = clipItems
          .filter(
            item => item.tabId === targetTabId && item.isBoard && item.parentId === null
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        if (isSubBoard) {
          if (boardsInTargetTab.length === 0) {
            boardsInTargetTab.push(movingBoard)
          } else {
            const targetBoardId = boardsInTargetTab[0].itemId.toString()
            const itemsInTargetParentBoard = clipItems
              .filter(
                item => item.parentId === targetBoardId && item.tabId === targetTabId
              )
              .sort((a, b) => a.orderNumber - b.orderNumber)

            itemsInTargetParentBoard.unshift(movingBoard)

            const itemIdToNewIndexMap = new Map(
              itemsInTargetParentBoard.map((item, index) => [item.itemId, index])
            )

            const itemIdToNewTabIdMap = new Map(allChildrenIds?.map(id => [id, true]))

            const updatedClipIds = [] as string[]

            const newClipItems = clipItems.map(item => {
              const newOrderIndex = itemIdToNewIndexMap.get(item.itemId)

              if (newOrderIndex !== undefined) {
                updatedClipIds.push(item.itemId)
                return {
                  ...item,
                  orderNumber: newOrderIndex,
                  tabId: targetTabId,
                  parentId: targetBoardId,
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

            setClipItems(newClipItems)

            const updatedMoveClips = newClipItems
              .filter(item => updatedClipIds.includes(item.itemId))
              .map(item => ({
                itemId: item.itemId,
                parentId: item.parentId,
                tabId: targetTabId,
                collectionId: currentCollectionId,
                orderNumber: item.orderNumber,
              }))

            updateMovedClips({ updatedMoveClips })
            setCurrentTab(targetTabId.toString())
            return
          }
        }

        boardsInTargetTab.unshift(movingBoard)

        const itemIdToNewIndexMap = new Map(
          boardsInTargetTab.map((item, index) => [item.itemId, index])
        )

        const itemIdToNewTabIdMap = new Map(allChildrenIds?.map(id => [id, true]))

        const newBoardItems = clipItems.map(item => {
          const newOrderIndex = itemIdToNewIndexMap.get(item.itemId)

          if (newOrderIndex !== undefined) {
            return {
              ...item,
              orderNumber: newOrderIndex,
              tabId: targetTabId,
              parentId: null,
            }
          } else if (itemIdToNewTabIdMap?.has(item.itemId)) {
            return {
              ...item,
              tabId: targetTabId,
            }
          }

          return item
        })

        setClipItems(newBoardItems)

        const updatedMoveClips = newBoardItems
          .filter(
            item =>
              (item.parentId === null ||
                item.parentId === activeId ||
                itemIdToNewTabIdMap.has(item.parentId)) &&
              item.tabId === targetTabId
          )
          .map(item => ({
            itemId: item.itemId,
            parentId: item.parentId,
            tabId: item.tabId,
            collectionId: currentCollectionId,
            orderNumber: item.orderNumber,
          }))

        updateMovedClips({ updatedMoveClips })
      } else if (movingClip) {
        const targetTabId = over.id.toString()
        const targetTabBoardTree = createBoardTree(clipItems, targetTabId)

        let movedToBoardId = targetTabBoardTree.find(
          board => board.name === t('Moved Clips Panel', { ns: 'dashboard' })
        )?.id

        if (!movedToBoardId) {
          const targetTabColor = tabs.find(tab => tab.tabId === targetTabId)?.tabColor
          const newMovedClipsBoard = {
            name: t('Moved Clips Panel', { ns: 'dashboard' }),
            isBoard: true,
            tabId: targetTabId,
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

          movedToBoardId = newBoardId
        }

        if (movedToBoardId) {
          const targetBoardId = movedToBoardId.toString()
          const targetBoardTabId = targetTabId.toString()

          const clipsInTargetParentBoard = clipItems
            .filter(
              item => item.parentId === targetBoardId && item.tabId === targetBoardTabId
            )
            .sort((a, b) => a.orderNumber - b.orderNumber)

          clipsInTargetParentBoard.unshift(movingClip)

          const itemIdToNewIndexMap = new Map(
            clipsInTargetParentBoard.map((item, index) => [item.itemId, index])
          )

          const newClipItems = clipItems.map(item => {
            const newOrderIndex = itemIdToNewIndexMap.get(item.itemId)

            if (newOrderIndex !== undefined) {
              return {
                ...item,
                orderNumber: newOrderIndex,
                tabId: targetBoardTabId,
                parentId: targetBoardId,
              }
            }

            return item
          })

          setClipItems(newClipItems)

          const updatedMoveClips = newClipItems
            .filter(item => item.parentId === targetBoardId)
            .map(item => ({
              itemId: item.itemId,
              parentId: targetBoardId,
              tabId: targetBoardTabId,
              collectionId: currentCollectionId,
              orderNumber: item.orderNumber,
            }))

          updateMovedClips({ updatedMoveClips })
        }
      }
      setCurrentTab(targetTabId.toString())
      return
    }

    let updatedClip: Item | null = null

    for (let i = 0; i < clipItems.length; i++) {
      if (clipItems[i].itemId === activeId) {
        updatedClip = clipItems[i]
        break
      }
    }

    if (updatedClip) {
      const updatedMoveClips = clipItems
        .filter(item => item.parentId === updatedClip?.parentId)
        .map(item => ({
          itemId: item.itemId,
          parentId: item.parentId,
          tabId: item.tabId,
          collectionId: currentCollectionId,
          orderNumber: item.orderNumber,
        }))

      updateMovedClips({ updatedMoveClips })
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event

    if (!over) {
      return
    }

    const isOverPinnedZone = over?.id === 'clips::pinnedzone'

    if (active?.id && isOverPinnedZone) {
      setDragOverPinnedId(active.id)
    } else if (!isOverPinnedZone) {
      setDragOverPinnedId(null)
    }

    if (over.data.current?.type === TAB && active?.data.current?.type !== TAB) {
      const activeItem = clipItems.find(({ itemId }) => itemId === active.id)
      if (activeItem?.tabId !== over.id || currentTab !== over.id) {
        activeOverTabId.value = over.id.toString()
      }
    } else if (activeOverTabId.value) {
      activeOverTabId.value = null
    }

    if (isOverPinnedZone) {
      return
    }

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) {
      return
    }

    if (!hasDraggableData(active) || !hasDraggableData(over)) {
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    const isActiveAClip = activeData?.type === CLIP
    const isActiveABoard = activeData?.type === BOARD
    const isOverClip = overData?.type === CLIP
    const isOverBoard = overData?.type === BOARD

    if (!isActiveAClip && !isActiveABoard) {
      return
    }

    if (isActiveAClip && isOverBoard && showClipsMoveOnBoardId.value === overId) {
      return
    }

    if (isActiveAClip && isOverBoard && !isKeyAltPressedValue) {
      const activeParentId = activeData.clip.parentId
      const newClipsOnSameBoard = clipItems
        .filter(({ parentId }) => activeParentId == parentId)
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })

      const activeIndex = newClipsOnSameBoard.findIndex(
        ({ itemId }) => itemId === activeId
      )

      const overIndex = newClipsOnSameBoard.findIndex(({ itemId }) => itemId === overId)

      const activeClip = newClipsOnSameBoard[activeIndex]
      const overClip = newClipsOnSameBoard[overIndex]

      if (activeClip && overClip && activeClip.parentId === overClip.parentId) {
        const clipsOnSameBoard = arrayMove(newClipsOnSameBoard, activeIndex, overIndex)

        const itemIdToNewIndexMap = new Map(
          clipsOnSameBoard.map((clip, index) => [clip.itemId, index])
        )

        const newClipItems = clipItems.map(clip => {
          const newClipIndex = itemIdToNewIndexMap.get(clip.itemId)
          if (newClipIndex !== undefined) {
            clip.orderNumber = newClipIndex
          }
          return clip
        })
        setClipItemsDebounced(newClipItems)
        return
      }
    } else if (isActiveAClip && isOverClip) {
      const activeParentId = activeData.clip.parentId

      const newClipsOnSameBoard = clipItems
        .filter(({ parentId, isClip }) => activeParentId == parentId && isClip)
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })

      const activeIndex = newClipsOnSameBoard.findIndex(
        ({ itemId }) => itemId === activeId
      )
      const overIndex = newClipsOnSameBoard.findIndex(({ itemId }) => itemId === overId)

      const activeClip = newClipsOnSameBoard[activeIndex]
      const overClip = newClipsOnSameBoard[overIndex]

      if (activeClip && overClip && activeClip.parentId === overClip.parentId) {
        const clipsOnSameBoard = arrayMove(newClipsOnSameBoard, activeIndex, overIndex)

        const itemIdToNewIndexMap = new Map(
          clipsOnSameBoard.map((clip, index) => [clip.itemId, index])
        )

        const newClipItems = clipItems.map(clip => {
          const newClipIndex = itemIdToNewIndexMap.get(clip.itemId)
          if (newClipIndex !== undefined) {
            clip.orderNumber = newClipIndex
          }
          return clip
        })
        setClipItemsDebounced(newClipItems)
        return
      }
    } else if (isActiveABoard && isOverClip) {
      const overParentId = overData.clip.parentId

      const newItemsOnSameBoard = clipItems
        .filter(({ parentId }) => overParentId == parentId)
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })

      const activeIndex = newItemsOnSameBoard.findIndex(
        ({ itemId }) => itemId === activeId
      )
      const overIndex = newItemsOnSameBoard.findIndex(({ itemId }) => itemId === overId)

      const activeBoard = newItemsOnSameBoard[activeIndex]
      const overClip = newItemsOnSameBoard[overIndex]

      if (activeBoard && overClip && activeBoard.parentId === overClip.parentId) {
        const itemsOnSameBoard = arrayMove(newItemsOnSameBoard, activeIndex, overIndex)

        const itemIdToNewIndexMap = new Map(
          itemsOnSameBoard.map((clip, index) => [clip.itemId, index])
        )

        const newClipItems = clipItems.map(clip => {
          const newClipIndex = itemIdToNewIndexMap.get(clip.itemId)
          if (newClipIndex !== undefined) {
            clip.orderNumber = newClipIndex
          }
          return clip
        })
        setClipItemsDebounced(newClipItems)
        return
      }
    }

    const overBoard = clipItems.find(
      ({ itemId, isBoard }) => itemId === overId && isBoard
    )

    const overClip = clipItems.find(({ itemId, isClip }) => itemId === overId && isClip)

    const overBoardId = overBoard?.itemId
    const overClipId = overClip?.itemId

    const activeIndex = clipItems.findIndex(({ itemId }) => itemId === activeId)
    const activeClip = clipItems[activeIndex]
    const activeBoard = isActiveABoard ? clipItems[activeIndex] : null

    if (overBoardId && activeClip.parentId !== overBoardId && !isActiveABoard) {
      const newItemOnAnotherBoard = clipItems
        .filter(({ parentId }) => overBoardId == parentId)
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })
      activeClip.parentId = overBoardId
      newItemOnAnotherBoard.unshift(activeClip)

      const itemIdToNewIndexMap = new Map(
        newItemOnAnotherBoard.map((clip, index) => [clip.itemId, index])
      )

      const newClipItems = clipItems.map(clip => {
        const newClipIndex = itemIdToNewIndexMap.get(clip.itemId)
        if (newClipIndex !== undefined) {
          return { ...clip, orderNumber: newClipIndex }
        }
        return clip
      })

      setClipItemsDebounced(newClipItems)
      return
    }

    if (
      overClipId &&
      overClip?.parentId &&
      activeClip.parentId !== overClip.parentId &&
      !isActiveABoard
    ) {
      activeClip.parentId = overClip.parentId
      activeClip.orderNumber = overClip.orderNumber

      const newItemsOnAnotherBoard = clipItems
        .filter(({ parentId }) => overClip.parentId == parentId)
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })

      newItemsOnAnotherBoard.unshift(activeClip)

      const movedClipsOnAnotherBoard = arrayMove(
        newItemsOnAnotherBoard,
        0,
        overClip.orderNumber
      )

      const itemIdToNewIndexMap = new Map(
        movedClipsOnAnotherBoard.map((clip, index) => [clip.itemId, index])
      )

      const newClipItems = clipItems.map(clip => {
        const newClipIndex = itemIdToNewIndexMap.get(clip.itemId)
        if (newClipIndex !== undefined) {
          return { ...clip, orderNumber: newClipIndex }
        }
        return clip
      })

      setClipItemsDebounced(newClipItems)
      return
    }

    if (
      overBoardId &&
      isActiveABoard &&
      activeBoard &&
      activeBoard?.parentId !== overBoard?.parentId &&
      activeData.isSubBoard
    ) {
      activeBoard.parentId = overBoardId

      const newItemOnAnotherBoard = clipItems
        .filter(({ parentId }) => overBoard.parentId == parentId)
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })

      newItemOnAnotherBoard.unshift(activeBoard)

      const itemIdToNewIndexMap = new Map(
        newItemOnAnotherBoard.map((item, index) => [item.itemId, index])
      )

      const newClipItems = clipItems.map(clip => {
        const newClipIndex = itemIdToNewIndexMap.get(clip.itemId)
        if (newClipIndex !== undefined) {
          return { ...clip, orderNumber: newClipIndex }
        }
        return clip
      })

      setClipItemsDebounced(newClipItems)
    }

    if (overBoardId && isActiveABoard && activeBoard?.parentId === overBoard?.parentId) {
      const newBoardsOnSameBoard = clipItems
        .filter(
          ({ parentId, isBoard, tabId }) =>
            overBoard?.parentId == parentId && isBoard && tabId === currentTab
        )
        .sort((a, b) => {
          return a.orderNumber - b.orderNumber
        })

      const activeIndex = newBoardsOnSameBoard.findIndex(
        ({ itemId }) => itemId === activeBoard?.itemId
      )
      const overIndex = newBoardsOnSameBoard.findIndex(
        ({ itemId }) => itemId === overBoardId
      )

      const boardOnSameBoard = arrayMove(newBoardsOnSameBoard, activeIndex, overIndex)

      const itemIdToNewIndexMap = new Map(
        boardOnSameBoard.map((board, index) => [board.itemId, index])
      )

      const newClipItems = clipItems.map(board => {
        const newBoardIndex = itemIdToNewIndexMap.get(board.itemId)
        if (newBoardIndex !== undefined) {
          return { ...board, orderNumber: newBoardIndex }
        }
        return board
      })

      setClipItemsDebounced(newClipItems)
    }
  }
}

export const Dashboard = memo(DashboardComponent)
