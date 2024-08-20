import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { listen } from '@tauri-apps/api/event'
import { useAtomValue } from 'jotai'
import {
  ArrowDownFromLine,
  ArrowUpToLine,
  Clipboard,
  ClipboardPaste,
  LayoutList,
  ListChecks,
  ListFilter,
  Pin,
  Search,
  X,
} from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { Prism } from 'prism-react-renderer'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import mergeRefs from '~/components/atoms/merge-refs'
import ToolTip from '~/components/atoms/tooltip'
import AutoSize from '~/components/libs/autosizer'
import SimpleBar from '~/components/libs/simplebar-react'
import type { SimpleBarOptions } from '~/components/libs/simplebar-react/simplebar-core'
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
  Input,
  Text,
  UnPinAll,
} from '~/components/ui'

import { clipboardHistoryStoreAtom } from '~/store/clipboardHistoryStore'
import { themeStoreAtom } from '~/store/themeStore'
import { uiStoreAtom } from '~/store/uiStore'

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

import {
  // ClipboardHistoryIconMenu,
  // ClipboardHistoryLargeView,
  // ClipboardHistoryListFilter,
  ClipboardHistoryRow,
  // TrashHistory,
} from '../components/ClipboardHistory'
import { ClipboardHistoryQuickPasteRow } from '../components/ClipboardHistory/ClipboardHistoryQuickPasteRow'

// import { ClipboardHistoryWindowIcons } from '../components/ClipboardHistory/ClipboardHistoryWindowIcons'
// import { Dashboard } from '../components/Dashboard'
// import { ClipCardLargeView } from '../components/Dashboard/components/ClipCardLargeView'
// import {
//   coordinateGetter,
//   getActiveIdFromPinned,
// } from '../components/Dashboard/components/utils'
// import { BOARD } from '../components/Dashboard/Dashboard'

export const TRASH_ID = 'trash'

const loadPrismComponents = async () => {
  // @ts-expect-error - global Prism
  window.Prism = Prism

  await Promise.all([
    // @ts-expect-error
    import('prismjs/components/prism-json'),
    // @ts-expect-error
    import('prismjs/components/prism-markup-templating'),
    // @ts-expect-error
    import('prismjs/components/prism-java'),
    // @ts-expect-error
    import('prismjs/components/prism-c'),
    // @ts-expect-error
    import('prismjs/components/prism-css'),
    // @ts-expect-error
    import('prismjs/components/prism-csharp'),
    // @ts-expect-error
    import('prismjs/components/prism-php'),
    // @ts-expect-error
    import('prismjs/components/prism-regex'),
    // @ts-expect-error
    import('prismjs/components/prism-ruby'),
    // @ts-expect-error
    import('prismjs/components/prism-shell-session.js'),
    // @ts-expect-error
    import('prismjs/components/prism-sql'),
    // @ts-expect-error
    import('prismjs/components/prism-uri'),
    // @ts-expect-error
    import('prismjs/components/prism-yaml'),
    // @ts-expect-error
    import('prismjs/components/prism-markdown'),
    // @ts-expect-error
    import('prismjs/components/prism-dart'),
    // @ts-expect-error
    import('~/libs/prismjs/components/prism-path'),
  ])
  Prism.languages['shell'] = Prism.languages['shell-session']
}

export default function ClipboardHistoryQuickPastePage() {
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
  const [appFilters, setAppFilters] = useState<string[]>([])

  const historyListSimpleBarRef = useRef<HTMLElement | null>(null)
  const [isMenuDeleting, setIsMenuDeleting] = useState(false)

  const scrollBarRef = useRef<SimpleBarOptions | null>(null)
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null)
  const [brokenImageItems, setBrokenImageItems] = useState<UniqueIdentifier[]>([])
  const [dragOverTrashId, setDragOverTrashId] = useState<UniqueIdentifier | null>(null)
  const [dragOverPinnedId, setDragOverPinnedId] = useState<UniqueIdentifier | null>(null)
  const [dragOverBoardId, setDragOverBoardId] = useState<UniqueIdentifier | null>(null)
  const [dragOverClipId, setDragOverClipId] = useState<UniqueIdentifier | null>(null)
  const [expandedItems, setExpandedItems] = useState<UniqueIdentifier[]>([])
  const [wrappedTextItems, setWrappedTextItems] = useState<UniqueIdentifier[]>([])
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<UniqueIdentifier[]>([])
  const [showSelectHistoryItems, setShowSelectHistoryItems] = useState(false)
  const [isDragPinnedHistory, setIsDragPinnedHistory] = useState(false)
  const {
    setIsScrolling,
    isShowHistoryPinned,
    setIsShowHistoryPinned,
    isSwapPanels,
    panelSize,
    isSplitPanelView,
    isWindows,
    getDefaultPanelWidth,
    setPanelSize,
    setReturnRoute,
  } = useAtomValue(uiStoreAtom)
  // const {
  //   isHistoryEnabled,
  //   setIsHistoryEnabled,
  //   isHistoryAutoUpdateOnCaputureEnabled,
  //   isAutoPreviewLinkCardsEnabled,
  //   isAutoGenerateLinkCardsEnabled,
  //   historyDetectLanguagesEnabledList,
  //   copyPasteSequencePinnedDelay,
  //   setCopyPasteSequencePinnedDelay,
  //   copyPasteSequenceIsReversOrder,
  //   setCopyPasteSequenceIsReversOrder,
  //   setIsHistoryAutoUpdateOnCaputureEnabled,
  // } = useAtomValue(settingsStoreAtom)

  const { t } = useTranslation()

  const { themeDark } = useAtomValue(themeStoreAtom)

  const { pinnedClipboardHistory } = useGetPinnedClipboardHistories()

  const isDark = themeDark()

  const {
    setHistoryListSimpleBar,
    updateClipboardHistory,
    deleteClipboardHistoryItem,
    deleteClipboardHistoryItems,
    addToClipboardHistoryIdsURLErrors,
    addToGenerateLinkMetaDataInProgress,
    removeToGenerateLinkMetaDataInProgress,
    clipboardHistoryGenerateLinkMetaDataInProgress,
    clipboardHistoryIdsURLErrors,
    generateLinkMetaData,
    removeLinkMetaData,
  } = useAtomValue(clipboardHistoryStoreAtom)

  const [isPrismLoaded, setPrismLoaded] = useState(false)

  const {
    isClipboardInfiniteHistoryLoading,
    isClipboardHistoryFetchingNextPage,
    infiniteClipboardHistory,
    invalidateClipboardHistoryQuery,
    fetchNextClipboardHistoryPage,
  } = useInfiniteClipboardHistory()

  const { deleteClipboardHistoryByIds } = useDeleteClipboardHistoryByIds()

  const {
    clipboardHistory: allClipboardHistory,
    newClipboardHistoryCount,
    foundClipboardHistory,
  } = useAtomValue(clipboardHistoryStoreAtom)

  const [searchTerm, setSearchTerm] = useState('')
  const [currentTopItemTimeAgo, setCurrentTopItemTimeAgo] = useState('')

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
    appFilters,
  })

  const doRefetchFindClipboardHistory = useCallback(() => {
    if (hasSearchOrFilter) {
      refetchFindClipboardHistory()
    }
  }, [hasSearchOrFilter])

  useHotkeys(
    [...Array(10).keys()].map(i => `ctrl+${i.toString()}`),
    e => {
      const index = e.key === '0' ? 9 : Number(e.key) - 1
      const itemId = clipboardHistory[Number(index)]?.historyId

      if (!itemId) {
        return
      }

      setCopiedItem(itemId)
    }
  )

  useHotkeys(
    [...Array(10).keys()].map(i => `ctrl+${isWindows ? 'alt' : 'meta'}+${i.toString()}`),
    e => {
      const index = e.key === '0' ? 9 : Number(e.key) - 1
      const itemId = clipboardHistory[Number(index)]?.historyId

      if (!itemId) {
        return
      }

      setPastedItem(itemId)
    }
  )

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
    const loadComponents = async () => {
      await loadPrismComponents()
    }
    setReturnRoute(location.pathname)

    loadComponents()
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
    if (
      debouncedSearchTerm.length > 1 ||
      historyFilters.length > 0 ||
      appFilters.length > 0 ||
      codeFilters.length > 0
    ) {
      refetchFindClipboardHistory()
    }
  }, [debouncedSearchTerm, historyFilters, codeFilters, appFilters])

  useEffect(() => {
    if (!scrollBarRef.current?.setDisableScroll || !historyListSimpleBarRef.current) {
      return
    }

    if (activeDragId) {
      scrollBarRef.current.setDisableScroll(true)
      historyListSimpleBarRef.current.style.overflow = 'hidden'
    } else {
      scrollBarRef.current.setDisableScroll(false)
      historyListSimpleBarRef.current.style.overflow = 'visible'
    }
  }, [activeDragId])

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

  const isMainWindow = window.isMainWindow
  const isHistoryWindow = window.isHistoryWindow

  return (
    <Box className="flex flex-col bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.8] pb-6 pt-4 px-3 pr-3">
      <Box className="flex flex-col relative" id="side-panel_tour">
        {hasSearchOrFilter && (
          <Box
            className="flex flex-row bg-slate-100 dark:bg-slate-700 rounded-md p-0 items-center h-[40px] mb-3"
            id="history-find_tour"
          >
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
          </Box>
        )}
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
                setAppFilters([])
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
                    {clipboardHistory.length < 100 ? clipboardHistory.length : '100+'}{' '}
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
            <Box
              className={`${
                dragOverPinnedId ? '!bg-orange-100 dark:!bg-orange-500/40' : ''
              } px-2 py-2 bg-orange-200/70 dark:bg-orange-900/60 mt-0 my-2 rounded-md relative`}
            >
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
                    theme: isDark ? 'os-theme-light' : 'os-theme-dark',
                    autoHide: 'move',
                  },
                }}
              >
                <Box
                  className={`flex flex-col gap-1 relative ${
                    activeDragId && !isDragPinnedHistory ? 'opacity-20' : ''
                  }`}
                >
                  {isShowHistoryPinned &&
                    pinnedClipboardHistory
                      .sort((a, b) => a.pinnedOrderNumber - b.pinnedOrderNumber)
                      .map((item, index) => {
                        const historyId = item.historyId
                        return (
                          <Box key={historyId}>
                            <ClipboardHistoryQuickPasteRow
                              isPinnedTop
                              hasClipboardHistoryURLErrors={clipboardHistoryIdsURLErrors.includes(
                                historyId
                              )}
                              setHistoryFilters={setHistoryFilters}
                              setAppFilters={setAppFilters}
                              addToClipboardHistoryIdsURLErrors={
                                addToClipboardHistoryIdsURLErrors
                              }
                              addToGenerateLinkMetaDataInProgress={
                                addToGenerateLinkMetaDataInProgress
                              }
                              removeToGenerateLinkMetaDataInProgress={
                                removeToGenerateLinkMetaDataInProgress
                              }
                              hasGenerateLinkMetaDataInProgress={clipboardHistoryGenerateLinkMetaDataInProgress.includes(
                                historyId
                              )}
                              isPinnedTopFirst={index === 0}
                              isDisabledPinnedMoveUp={index === 0}
                              isDisabledPinnedMoveDown={
                                index === pinnedClipboardHistory.length - 1
                              }
                              onMovePinnedUpDown={move => {
                                movePinnedClipboardHistoryUpDown(move)
                              }}
                              setSelectHistoryItem={() => {}}
                              onCopy={setCopiedItem}
                              onCopyPaste={setPastedItem}
                              pastingCountDown={
                                historyId === pastedItemValue
                                  ? pastingCountDown
                                  : undefined
                              }
                              isPasted={historyId === pastedItemValue}
                              isCopied={historyId === copiedItemValue}
                              isSaved={historyId === savingItem}
                              setSavingItem={setSavingItem}
                              isDeleting={false}
                              isSelected={selectedHistoryItems.includes(historyId)}
                              setBrokenImageItem={setBrokenImageItem}
                              isBrokenImage={brokenImageItems.includes(historyId)}
                              showTimeAgo={false}
                              isExpanded={expandedItems.includes(historyId)}
                              isWrapText={wrappedTextItems.includes(historyId)}
                              searchTerm={hasSearchOrFilter ? debouncedSearchTerm : ''}
                              showSelectHistoryItems={showSelectHistoryItems}
                              invalidateClipboardHistoryQuery={() => {
                                invalidateClipboardHistoryQuery()
                                doRefetchFindClipboardHistory()
                              }}
                              setExpanded={setExpanded}
                              setWrapText={setWrapText}
                              isDark={isDark}
                              setRowHeight={setRowHeight}
                              clipboard={item}
                              removeLinkMetaData={removeLinkMetaData}
                              generateLinkMetaData={generateLinkMetaData}
                            />
                          </Box>
                        )
                      })}
                </Box>
              </OverlayScrollbarsComponent>
            </Box>
          )
        )}

        {clipboardHistory.length > 0 || hasSearchOrFilter ? (
          <div className="relative h-full" id="quick-paste-history-list">
            {currentTopItemTimeAgo && (
              <Box
                className={`${
                  newClipboardHistoryCount > 0 ? 'top-9' : 'top-1'
                } absolute z-100 animate-in fade-in fade-out duration-300 flex justify-center w-full ml-[-5px] pointer-events-none`}
              >
                <ToolTip
                  text={t('Scroll to Top', { ns: 'common' })}
                  isDisabled={Boolean(activeDragId)}
                  className="animate-in fade-in fade-out duration-300"
                  isCompact
                  delayDuration={2000}
                  side="bottom"
                  asChild
                  sideOffset={10}
                >
                  <ButtonGhost
                    className="pointer-events-auto rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-200 hover:dark:bg-slate-700"
                    onClick={() => {
                      // scrollToTopHistoryList(true)
                    }}
                  >
                    <Text className="text-mute text-xs text-center px-3">
                      {currentTopItemTimeAgo}
                    </Text>
                  </ButtonGhost>
                </ToolTip>
              </Box>
            )}

            <InfiniteLoader
              isItemLoaded={index =>
                index < clipboardHistory.length && !!clipboardHistory[index]
              }
              threshold={10}
              itemCount={clipboardHistory.length + 1}
              loadMoreItems={loadMoreClipBoardHistory}
            >
              {({ onItemsRendered, ref }) => {
                return (
                  <VariableSizeList
                    overscanCount={10}
                    height={400 - (hasSearchOrFilter ? 60 : 85)}
                    itemCount={clipboardHistory.length}
                    width="100%"
                    itemSize={getRowHeight}
                    itemKey={index => clipboardHistory[index].historyId ?? 'id-${index}'}
                    onItemsRendered={e => {
                      if (e.visibleStartIndex > 10) {
                        const currentTopItem = clipboardHistory[e.visibleStartIndex]
                        if (currentTopItem?.timeAgo) {
                          if (currentTopItemTimeAgo !== currentTopItem.timeAgo) {
                            setCurrentTopItemTimeAgo(currentTopItem.timeAgo)
                          }
                        } else {
                          setCurrentTopItemTimeAgo('')
                        }
                      } else if (currentTopItemTimeAgo) {
                        setCurrentTopItemTimeAgo('')
                      }
                      !debouncedSearchTerm && onItemsRendered(e)
                    }}
                    ref={mergeRefs(listRef, ref)}
                  >
                    {({ index, style }) => {
                      const clipboard = clipboardHistory[index]
                      const { historyId, showTimeAgo, timeAgo } = clipboard

                      return (
                        <ClipboardHistoryQuickPasteRow
                          hasClipboardHistoryURLErrors={clipboardHistoryIdsURLErrors.includes(
                            historyId
                          )}
                          addToGenerateLinkMetaDataInProgress={
                            addToGenerateLinkMetaDataInProgress
                          }
                          removeToGenerateLinkMetaDataInProgress={
                            removeToGenerateLinkMetaDataInProgress
                          }
                          addToClipboardHistoryIdsURLErrors={
                            addToClipboardHistoryIdsURLErrors
                          }
                          hasGenerateLinkMetaDataInProgress={clipboardHistoryGenerateLinkMetaDataInProgress.includes(
                            historyId
                          )}
                          setHistoryFilters={setHistoryFilters}
                          setAppFilters={setAppFilters}
                          setSelectHistoryItem={() => {}}
                          onCopy={setCopiedItem}
                          onCopyPaste={setPastedItem}
                          pastingCountDown={
                            historyId === pastedItemValue ? pastingCountDown : undefined
                          }
                          isPasted={historyId === pastedItemValue}
                          isCopied={historyId === copiedItemValue}
                          isSaved={historyId === savingItem}
                          setSavingItem={setSavingItem}
                          key={historyId}
                          isDeleting={false}
                          isOverPinned={
                            historyId === dragOverPinnedId ||
                            (Boolean(dragOverPinnedId) &&
                              Boolean(activeDragId) &&
                              selectedHistoryItems.includes(historyId))
                          }
                          isSelected={selectedHistoryItems.includes(historyId)}
                          setBrokenImageItem={setBrokenImageItem}
                          isBrokenImage={brokenImageItems.includes(historyId)}
                          showTimeAgo={showTimeAgo}
                          timeAgo={timeAgo}
                          isExpanded={expandedItems.includes(historyId)}
                          isWrapText={wrappedTextItems.includes(historyId)}
                          searchTerm={hasSearchOrFilter ? debouncedSearchTerm : ''}
                          showSelectHistoryItems={showSelectHistoryItems}
                          invalidateClipboardHistoryQuery={() => {
                            invalidateClipboardHistoryQuery()
                            doRefetchFindClipboardHistory()
                          }}
                          setExpanded={setExpanded}
                          setWrapText={setWrapText}
                          isDark={isDark}
                          setRowHeight={setRowHeight}
                          clipboard={clipboard}
                          removeLinkMetaData={removeLinkMetaData}
                          generateLinkMetaData={generateLinkMetaData}
                          index={index}
                          style={style}
                        />
                      )
                    }}
                  </VariableSizeList>
                )
              }}
            </InfiniteLoader>
          </div>
        ) : (
          !isClipboardInfiniteHistoryLoading &&
          infiniteClipboardHistory?.pages?.flat().length === 0 && (
            <Flex className="flex items-center flex-col gap-3 justify-center">
              <Text className="animate-in fade-in duration-600 text-slate-300 text-xs bg-slate-100 rounded-full px-3 dark:text-slate-600 dark:bg-slate-900">
                {t('No Clipboard History', { ns: 'dashboard' })}
              </Text>
            </Flex>
          )
        )}
      </Box>
    </Box>
  )
}
