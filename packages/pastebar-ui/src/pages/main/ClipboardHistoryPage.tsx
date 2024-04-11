import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  defaultDropAnimation,
  DndContext,
  DragOverlay,
  DropAnimation,
  MeasuringStrategy,
  PointerSensor,
  rectIntersection,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Portal } from '@radix-ui/react-portal'
import { listen } from '@tauri-apps/api/event'
import { MainContainer } from '~/layout/Layout'
import {
  clipboardHistoryStoreAtom,
  settingsStoreAtom,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  ArrowDownFromLine,
  ArrowUpToLine,
  Clipboard,
  ClipboardPaste,
  LayoutList,
  ListChecks,
  Pin,
  Search,
} from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import useResizeObserver from 'use-resize-observer'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import ToolTip from '~/components/atoms/tooltip'
import {
  Badge,
  BadgeWithRef,
  Box,
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
  Input,
  Text,
  UnPinAll,
} from '~/components/ui'

import {
  useDeleteClipboardHistoryByIds,
  useFindClipboardHistory,
  useGetPinnedClipboardHistories,
  useInfiniteClipboardHistory,
  useMovePinnedClipboardHistoryUpDown,
  usePinnedClipboardHistoryByIds,
  useUnpinAllClipboardHistory,
} from '~/hooks/queries/use-history-items'
import { useUpdateItemValueByHistoryId } from '~/hooks/queries/use-items'
import {
  useCopyPasteHistoryItem,
  usePasteHistoryItem,
} from '~/hooks/use-copypaste-history-item'
import { useDebounce } from '~/hooks/use-debounce'
import { useSignal } from '~/hooks/use-signal'

import { BOARD } from '../components/Dashboard/Dashboard'

export const TRASH_ID = 'trash'

export default function ClipboardHistoryPage() {
  const [copiedItem, setCopiedItem, runSequenceCopy] = useCopyPasteHistoryItem({})
  const [pastedItem, pastingCountDown, setPastedItem, runSequencePaste] =
    usePasteHistoryItem({})

  const [savingItem, setSavingItem] = useState<UniqueIdentifier | null>(null)
  const { updateItemValueByHistoryId } = useUpdateItemValueByHistoryId()
  const { pinnedClipboardHistoryByIds } = usePinnedClipboardHistoryByIds()
  const { unPinAllClipboardHistory } = useUnpinAllClipboardHistory()
  const { movePinnedClipboardHistoryUpDown } = useMovePinnedClipboardHistoryUpDown()

  const [historyFilters, setHistoryFilters] = useState<string[]>([])
  const [codeFilters, setCodeFilters] = useState<string[]>([])
  const historyListSimpleBarRef = useRef<HTMLElement | null>(null)
  const [isMenuDeleting] = useState(false)

  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null)
  const [brokenImageItems, setBrokenImageItems] = useState<UniqueIdentifier[]>([])
  const [dragOverTrashId, setDragOverTrashId] = useState<UniqueIdentifier | null>(null)
  const [dragOverPinnedId, setDragOverPinnedId] = useState<UniqueIdentifier | null>(null)
  const [dragOverBoardId, setDragOverBoardId] = useState<UniqueIdentifier | null>(null)
  const [dragOverClipId, setDragOverClipId] = useState<UniqueIdentifier | null>(null)
  const [expandedItems, setExpandedItems] = useState<UniqueIdentifier[]>([])
  const [wrappedTextItems, setWrappedTextItems] = useState<UniqueIdentifier[]>([])
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<UniqueIdentifier[]>([])
  const [showSelectHistoryItems] = useState(false)
  const [isDragPinnedHistory, setIsDragPinnedHistory] = useState(false)
  const { isShowHistoryPinned, setIsShowHistoryPinned, setReturnRoute } =
    useAtomValue(uiStoreAtom)
  const {
    isHistoryAutoUpdateOnCaputureEnabled,
    isAutoPreviewLinkCardsEnabled,
    copyPasteSequencePinnedDelay,
    setCopyPasteSequencePinnedDelay,
    copyPasteSequenceIsReversOrder,
    setCopyPasteSequenceIsReversOrder,
  } = useAtomValue(settingsStoreAtom)

  const { t } = useTranslation()

  const { themeDark } = useAtomValue(themeStoreAtom)
  const { ref: pinnedPanelRef } = useResizeObserver()

  const isPinnedPanelHovering = useSignal(false)
  const isPinnedPanelKeepOpen = useSignal(false)

  const isPinnedPanelHoverOpen = useMemo(() => {
    return isPinnedPanelKeepOpen.value || isPinnedPanelHovering.value
  }, [isPinnedPanelHovering.value, isPinnedPanelKeepOpen.value])

  const { pinnedClipboardHistory } = useGetPinnedClipboardHistories()

  const { setHistoryListSimpleBar, generateLinkMetaData, removeLinkMetaData } =
    useAtomValue(clipboardHistoryStoreAtom)

  const [isPrismLoaded, setPrismLoaded] = useState(false)

  const location = useLocation()

  const {
    isClipboardHistoryFetchingNextPage,
    invalidateClipboardHistoryQuery,
    fetchNextClipboardHistoryPage,
  } = useInfiniteClipboardHistory()

  const { deleteClipboardHistoryByIds } = useDeleteClipboardHistoryByIds()

  const { clipboardHistory: allClipboardHistory, foundClipboardHistory } = useAtomValue(
    clipboardHistoryStoreAtom
  )

  const [searchTerm, setSearchTerm] = useState('')

  const listRef = useRef(null)
  const rowHeights = useRef<{ [key: string]: number }>({})
  const searchHistoryInputRef = useRef<HTMLInputElement | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const hasSearchOrFilter = useMemo(() => {
    return debouncedSearchTerm.length > 1 || historyFilters.length > 0
  }, [debouncedSearchTerm, historyFilters])

  const hasSelectedPinned = useMemo(
    () =>
      selectedHistoryItems.some(item => {
        return pinnedClipboardHistory.some(pinnedItem => pinnedItem.historyId === item)
      }),
    [selectedHistoryItems, pinnedClipboardHistory]
  )

  const pastedItemValue = useMemo(() => pastedItem, [pastedItem])
  const copiedItemValue = useMemo(() => copiedItem, [copiedItem])

  const clipboardHistory = hasSearchOrFilter ? foundClipboardHistory : allClipboardHistory

  const { refetchFindClipboardHistory } = useFindClipboardHistory({
    query: debouncedSearchTerm,
    filters: historyFilters,
    codeFilters,
  })

  const doRefetchFindClipboardHistory = useCallback(() => {
    if (hasSearchOrFilter && isHistoryAutoUpdateOnCaputureEnabled) {
      refetchFindClipboardHistory()
    }
  }, [hasSearchOrFilter, isHistoryAutoUpdateOnCaputureEnabled])

  useEffect(() => {
    const listenToClipboardUnlisten = listen(
      'clipboard://clipboard-monitor/update',
      e => {
        if (e.payload === 'clipboard update') {
          doRefetchFindClipboardHistory()
        }
      }
    )

    return () => {
      listenToClipboardUnlisten.then(unlisten => {
        unlisten()
      })
    }
  }, [doRefetchFindClipboardHistory])

  useEffect(() => {
    setReturnRoute(location.pathname)
    setPrismLoaded(true)
  }, [])

  useEffect(() => {
    if (copiedItem && selectedHistoryItems.includes(copiedItem)) {
      setSelectedHistoryItems(prev => prev.filter(item => item !== copiedItem))
    }
    if (pastedItem && selectedHistoryItems.includes(pastedItem)) {
      setSelectedHistoryItems(prev => prev.filter(item => item !== pastedItem))
    }
  }, [copiedItem, pastedItem])

  useEffect(() => {
    if (historyListSimpleBarRef) {
      setHistoryListSimpleBar(historyListSimpleBarRef)
    }
  }, [historyListSimpleBarRef])

  useEffect(() => {
    if (pinnedClipboardHistory.length === 0) {
      isPinnedPanelHovering.value = false
      isPinnedPanelKeepOpen.value = false
    }
  }, [pinnedClipboardHistory])

  useEffect(() => {
    if (
      debouncedSearchTerm.length > 1 ||
      historyFilters.length > 0 ||
      codeFilters.length > 0
    ) {
      refetchFindClipboardHistory()
    }
  }, [debouncedSearchTerm, historyFilters, codeFilters])

  const loadMoreClipBoardHistory = async () => {
    if (!isClipboardHistoryFetchingNextPage) {
      await fetchNextClipboardHistoryPage({ cancelRefetch: false })
    }
  }

  function getRowHeight(index: number): number {
    return rowHeights.current[index] || 60
  }

  function setRowHeight(index: number, size: number) {
    // @ts-expect-error - resetAfterIndex is not in the types
    listRef.current?.resetAfterIndex && listRef.current?.resetAfterIndex(0)
    rowHeights.current = { ...rowHeights.current, [index]: size }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { tolerance: 10, delay: 300 } })
  )

  const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
      if (
        activeDragId &&
        (dragOverTrashId === activeDragId ||
          dragOverBoardId ||
          dragOverClipId ||
          dragOverPinnedId)
      ) {
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
            x: transform.final.x + 5,
            y: transform.final.y + 5,
          }),
        },
      ]
    },
    easing: 'ease-out',
    duration: 300,
    sideEffects({ active, dragOverlay }) {
      if (
        activeDragId &&
        (dragOverTrashId === activeDragId ||
          dragOverBoardId === activeDragId ||
          dragOverPinnedId === activeDragId)
      ) {
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

  const setSelectHistoryItem = useCallback(
    (id: UniqueIdentifier) => {
      setSelectedHistoryItems(prev => {
        const isSelected = prev.includes(id)
        return isSelected ? prev.filter(_id => _id !== id) : [...prev, id]
      })
    },
    [setSelectedHistoryItems]
  )

  const setBrokenImageItem = useCallback(
    (id: UniqueIdentifier) => {
      setBrokenImageItems(prev => {
        const isSelected = prev.includes(id)
        return isSelected ? prev.filter(_id => _id !== id) : [...prev, id]
      })
    },
    [setBrokenImageItems]
  )

  const setExpanded = useCallback(
    (id: UniqueIdentifier, isExpanded: boolean) => {
      setExpandedItems(prev => {
        if (isExpanded) {
          return [...prev, id]
        } else {
          return prev.filter(item => item !== id)
        }
      })
    },
    [setExpandedItems]
  )

  const setWrapText = useCallback(
    (id: UniqueIdentifier, isWrapped: boolean) => {
      setWrappedTextItems(prev => {
        if (isWrapped) {
          return [...prev, id]
        } else {
          return prev.filter(item => item !== id)
        }
      })
    },
    [setWrappedTextItems]
  )

  const hasIsDeleting = (historyId: UniqueIdentifier) => {
    return (
      historyId === dragOverTrashId ||
      (Boolean(dragOverTrashId) &&
        Boolean(activeDragId) &&
        selectedHistoryItems.includes(historyId)) ||
      (isMenuDeleting && selectedHistoryItems.includes(historyId))
    )
  }

  return (
    <MainContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        autoScroll={{ layoutShiftCompensation: false, acceleration: 1 }}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={({ active }) => {
          setActiveDragId(active.id)
          setIsDragPinnedHistory(active.id && active.data.current?.isPinned)
        }}
        onDragOver={({ active, over }) => {
          const overData = over?.data.current
          const isOverBoard = overData?.type === BOARD
          const isOverClipDropZone = overData?.type === 'clip::dropzone'
          const isOverPinnedZone = over?.id === 'history::pinnedzone'

          if (active?.id && isOverPinnedZone && !isDragPinnedHistory) {
            setDragOverPinnedId(active.id)
          } else if (!isOverPinnedZone) {
            setDragOverPinnedId(null)
          }

          if (over?.id === TRASH_ID) {
            setDragOverTrashId(active.id)
          } else if (isOverBoard && over?.id) {
            setDragOverBoardId(over?.id)
          } else if (isOverClipDropZone && over?.id) {
            setDragOverClipId(over?.id)
          } else {
            setDragOverTrashId(null)
            setDragOverBoardId(null)
            setDragOverClipId(null)
          }
        }}
        onDragCancel={() => {
          setActiveDragId(null)
          setDragOverTrashId(null)
          setDragOverBoardId(null)
          setDragOverClipId(null)
          return true
        }}
        onDragEnd={async ({ active }) => {
          const isPinnedItem = active?.data.current?.isPinned
          if (active?.id === dragOverPinnedId) {
            setTimeout(async () => {
              setDragOverPinnedId(null)
              setSelectedHistoryItems([])
              setActiveDragId(null)
              if (isPinnedItem) {
                return
              }

              await pinnedClipboardHistoryByIds({
                historyIds:
                  selectedHistoryItems.length > 0
                    ? Array.from(new Set([...selectedHistoryItems, active.id]))
                    : [active.id],
                isPinned: true,
              })
            }, 300)
          } else if (active?.id === dragOverTrashId) {
            const activeId = active.id
            await deleteClipboardHistoryByIds({
              historyIds:
                selectedHistoryItems.length > 0
                  ? Array.from(new Set([...selectedHistoryItems, activeId]))
                  : [activeId],
            })

            setTimeout(() => {
              doRefetchFindClipboardHistory()
              setDragOverPinnedId(null)
              setDragOverTrashId(null)
              setDragOverBoardId(null)
              setDragOverClipId(null)
              setSelectedHistoryItems([])
              setActiveDragId(null)
            }, 600)
          } else if (active?.id && dragOverBoardId) {
            setTimeout(() => {
              setDragOverBoardId(null)
              setActiveDragId(null)
              setSelectedHistoryItems([])
            }, 400)
          } else if (active?.id && dragOverClipId) {
            const activeId = active.id
            const clipId = dragOverClipId.toString().replace('::dropzone', '')

            const clipboardItem = activeId
              ? clipboardHistory.find(item => item.historyId === activeId)
              : null

            if (clipId && clipboardItem?.historyId) {
              await updateItemValueByHistoryId({
                historyId: clipboardItem.historyId,
                itemId: clipId,
              })
            }
            setTimeout(() => {
              setDragOverClipId(null)
              setActiveDragId(null)
            }, 400)
          } else {
            setTimeout(() => {
              setDragOverPinnedId(null)
              setDragOverBoardId(null)
              setDragOverTrashId(null)
              setActiveDragId(null)
            }, 300)
          }
        }}
      >
        <Box className="h-[calc(100vh-70px)] flex flex-col bg-slate-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.8] pb-6 pt-4 px-3 pr-3">
          <>
            {({ height }: { height: number }) =>
              isPrismLoaded &&
              height &&
              height > 0 && (
                <Box className="flex flex-col h-[calc(100vh-95px)] relative">
                  <Box className="flex flex-row bg-slate-100 dark:bg-slate-700 rounded-md p-0 items-center h-[40px] mb-3">
                    {activeDragId && pinnedClipboardHistory.length === 0 ? (
                      <DropZone
                        id="history::pinnedzone"
                        className="w-full h-full"
                        isActive={Boolean(activeDragId)}
                      >
                        <Box
                          ref={dragOverPinnedId ? null : pinnedPanelRef}
                          className={`${
                            dragOverPinnedId
                              ? '!bg-orange-100 dark:!bg-orange-500/40'
                              : ''
                          } ${
                            activeDragId ? '' : 'animate-in fade-in'
                          } py-1 bg-orange-50 dark:bg-orange-800/40 mt-0 my-2 rounded-md relative w-full h-full`}
                        >
                          {activeDragId && (
                            <Box className="z-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-full w-full flex items-center justify-center p-1">
                              <Box
                                className={`border-2 ${
                                  dragOverPinnedId
                                    ? 'border-orange-400 dark:border-orange-500'
                                    : 'border-slate-200 dark:border-slate-500'
                                } border-dashed rounded-md flex items-center justify-center h-full w-full`}
                              >
                                {!dragOverPinnedId ? (
                                  <Pin
                                    size={18}
                                    className="text-orange-300 dark:text-orange-500 animate-in fade-in duration-300"
                                  />
                                ) : (
                                  <Text className="!text-orange-400 dark:text-orange-500 !font-medium animate-in fade-in duration-300 text-sm">
                                    {t('Drop to Pin', { ns: 'dashboard' })}
                                  </Text>
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </DropZone>
                    ) : (
                      <>
                        <Input
                          placeholder={`${t('Find in history', {
                            ns: 'dashboard',
                          })}...`}
                          autoFocus={searchTerm.length > 0}
                          key="search-history"
                          type="search"
                          onChange={e => {
                            setSearchTerm(e.target.value)
                          }}
                          value={searchTerm}
                          ref={searchHistoryInputRef}
                          iconLeft={<Search className="h-4 w-4" />}
                          classNameInput="w-full pr-0"
                          className="text-md ring-offset-0 bg-slate-100 dark:bg-slate-700 border-r-0 border-t-0 border-b-0"
                        />
                      </>
                    )}
                  </Box>
                  {hasSearchOrFilter ? (
                    <Box className="cursor-pointer absolute top-[49px] animate-in fade-in fade-out flex justify-center w-full pointer-events-none">
                      <ToolTip
                        text={t('Clear found results and filters', { ns: 'common' })}
                        isDisabled={Boolean(activeDragId)}
                        className="animate-in fade-in fade-out duration-300"
                        isCompact
                        delayDuration={2000}
                        side="top"
                        onClick={() => {
                          setSearchTerm('')
                          setHistoryFilters([])
                          setCodeFilters([])
                          if (
                            searchHistoryInputRef?.current &&
                            searchHistoryInputRef.current.value
                          ) {
                            searchHistoryInputRef.current.value = ''
                            searchHistoryInputRef?.current?.focus()
                          }
                        }}
                        sideOffset={10}
                      >
                        <Text className="text-xs text-center dark:text-slate-800 bg-blue-200 dark:bg-blue-400 rounded-full px-3 cursor-pointer pointer-events-auto">
                          {clipboardHistory.length ? (
                            <>
                              {clipboardHistory.length < 100
                                ? clipboardHistory.length
                                : '100+'}{' '}
                              {t('found', { ns: 'common' })}
                            </>
                          ) : (
                            <>{t('Nothing found', { ns: 'common' })}</>
                          )}
                        </Text>
                      </ToolTip>
                    </Box>
                  ) : (
                    pinnedClipboardHistory.length > 0 && (
                      <DropZone
                        id="history::pinnedzone"
                        isActive={Boolean(activeDragId) && !isDragPinnedHistory}
                      >
                        <Box
                          onMouseEnter={() => {
                            isPinnedPanelHovering.value = true
                          }}
                          onMouseLeave={() => {
                            isPinnedPanelHovering.value = false
                          }}
                          onClick={() => {
                            isPinnedPanelHovering.value = true
                          }}
                          ref={dragOverPinnedId ? null : pinnedPanelRef}
                          className={`${
                            dragOverPinnedId
                              ? '!bg-orange-100 dark:!bg-orange-500/40'
                              : ''
                          } ${
                            activeDragId
                              ? !isShowHistoryPinned
                                ? 'min-h-[32px]'
                                : ''
                              : 'animate-in fade-in'
                          } ${
                            !isShowHistoryPinned ? 'py-1' : 'py-2'
                          } px-2 pb-0 bg-orange-200/70 dark:bg-orange-900/60 mt-0 my-2 rounded-md relative`}
                        >
                          {activeDragId && !isDragPinnedHistory && (
                            <Box className="z-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-full w-full flex items-center justify-center p-1">
                              <Box
                                className={`border-2 ${
                                  dragOverPinnedId
                                    ? 'border-orange-400 dark:border-orange-500'
                                    : 'border-slate-200 dark:border-slate-500'
                                } border-dashed rounded-md flex items-center justify-center h-full w-full`}
                              >
                                {!dragOverPinnedId ? (
                                  <Pin
                                    size={18}
                                    className="text-orange-300 dark:text-orange-500 animate-in fade-in duration-300"
                                  />
                                ) : (
                                  <Text className="!text-orange-400 dark:!text-orange-500 !font-medium animate-in fade-in duration-300 text-sm">
                                    {t('Drop to Pin', { ns: 'dashboard' })}
                                  </Text>
                                )}
                              </Box>
                            </Box>
                          )}

                          <OverlayScrollbarsComponent
                            defer
                            style={{
                              maxHeight: 200,
                            }}
                            options={{
                              overflow: {
                                x: 'hidden',
                                y: 'scroll',
                              },
                              scrollbars: {
                                autoHide: 'move',
                              },
                            }}
                          >
                            <Box
                              className={`flex flex-col gap-1 relative ${
                                activeDragId && !isDragPinnedHistory ? 'opacity-20' : ''
                              }`}
                            ></Box>
                          </OverlayScrollbarsComponent>
                          <Flex className="justify-between">
                            {isShowHistoryPinned ? (
                              <Flex
                                className={`animate-in fade-in duration-300 ${
                                  (activeDragId && !isDragPinnedHistory) ||
                                  !isPinnedPanelHoverOpen
                                    ? 'opacity-0'
                                    : ''
                                }`}
                              >
                                <ButtonGhost
                                  className="!text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent pl-0.5 pr-1 pt-0 "
                                  title={t('Sequence Copy', { ns: 'common' })}
                                >
                                  <Clipboard
                                    size={14}
                                    onClick={() => {
                                      runSequenceCopy(
                                        pinnedClipboardHistory.map(
                                          ({ historyId }) => historyId
                                        )
                                      )
                                    }}
                                  />
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
                                          <Text size="xs">
                                            {t('No', { ns: 'common' })}
                                          </Text>
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                          checked={copyPasteSequenceIsReversOrder}
                                          onSelect={() => {
                                            setCopyPasteSequenceIsReversOrder(true)
                                          }}
                                        >
                                          <Text size="xs">
                                            {t('Yes', { ns: 'common' })}
                                          </Text>
                                        </DropdownMenuCheckboxItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </Flex>
                            ) : (
                              <Box />
                            )}
                            {!activeDragId && (
                              <ButtonGhost
                                className={`hover:underline ${
                                  isShowHistoryPinned ? 'h-[30px]' : 'h-[26px]'
                                } group !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent ${
                                  !isShowHistoryPinned ? 'pb-1' : ''
                                }`}
                                title={
                                  isShowHistoryPinned
                                    ? t('Hide pinned history', { ns: 'history' })
                                    : t('View pinned history', { ns: 'history' })
                                }
                                onClick={() => {
                                  setIsShowHistoryPinned(!isShowHistoryPinned)
                                }}
                              >
                                <Text className="!font-medium text-xs !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 mr-1">
                                  {pinnedClipboardHistory.length}{' '}
                                  {t('Pinned', { ns: 'common' })}
                                </Text>
                                {isShowHistoryPinned ? (
                                  <ArrowUpToLine
                                    size={13}
                                    className="group-hover:opacity-100 opacity-0"
                                  />
                                ) : (
                                  <ArrowDownFromLine
                                    size={13}
                                    className="group-hover:opacity-100 opacity-0"
                                  />
                                )}
                              </ButtonGhost>
                            )}
                            {isShowHistoryPinned ? (
                              <Box
                                className={`animate-in fade-in duration-300 ${
                                  (activeDragId && !isDragPinnedHistory) ||
                                  !isPinnedPanelHoverOpen
                                    ? 'opacity-0'
                                    : ''
                                }`}
                              >
                                <ButtonGhost
                                  title={
                                    hasSelectedPinned
                                      ? t('Deselect pinned', { ns: 'common' })
                                      : t('Select pinned', { ns: 'common' })
                                  }
                                  className="!text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent px-2 pr-0 rounded-sm py-0 h-5"
                                >
                                  <Flex className="font-medium text-sm gap-1 !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400">
                                    {hasSelectedPinned ? (
                                      <LayoutList
                                        size={15}
                                        onClick={() => {
                                          const selectedPinnedItems =
                                            selectedHistoryItems.filter(item => {
                                              return pinnedClipboardHistory.some(
                                                pinnedItem =>
                                                  pinnedItem.historyId === item
                                              )
                                            })
                                          setSelectedHistoryItems(
                                            selectedHistoryItems.filter(
                                              item => !selectedPinnedItems.includes(item)
                                            )
                                          )
                                        }}
                                      />
                                    ) : (
                                      <ListChecks
                                        size={17}
                                        onClick={() => {
                                          setSelectedHistoryItems(
                                            selectedHistoryItems.concat(
                                              pinnedClipboardHistory.map(
                                                pinnedItem => pinnedItem.historyId
                                              )
                                            )
                                          )
                                        }}
                                      />
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
                                  onConfirm={async () => {
                                    await unPinAllClipboardHistory({})
                                  }}
                                  buttonClassName="group !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400 hover:bg-transparent dark:hover:bg-transparent px-2 pr-0.5 rounded-sm py-0 h-5"
                                />
                              </Box>
                            ) : (
                              <Box />
                            )}
                          </Flex>
                        </Box>
                      </DropZone>
                    )
                  )}

                  <Portal>
                    <DragOverlay dropAnimation={dropAnimationConfig} />
                  </Portal>

                  <Box className={`flex-1 mt-2`} />
                  <Tabs
                    className="min-w-full flex flex-row justify-center h-10 items-center gap-2"
                    value={location.pathname}
                  >
                    <TabsList className="self-center">
                      <>
                        <TabsTrigger value="/history">
                          {t('Clipboard History', { ns: 'common' })}
                        </TabsTrigger>
                        <TabsTrigger value="/menu">
                          {t('Paste Menu', { ns: 'common' })}
                        </TabsTrigger>
                      </>
                    </TabsList>
                    <Box className="w-1"></Box>
                  </Tabs>
                </Box>
              )
            }
          </>
        </Box>
        <Box className="h-[calc(100vh-70px)] flex flex-col bg-slate-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
          <Box className="p-4 py-3 select-auto relative">
            <Box className="flex justify-center mb-2">
              <Text className="font-thin select-none !text-slate-400" size="sm">
                {t('Large View', { ns: 'common' })}
              </Text>
            </Box>
          </Box>
        </Box>
      </DndContext>
    </MainContainer>
  )
}
