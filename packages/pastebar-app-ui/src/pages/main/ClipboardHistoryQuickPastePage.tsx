import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'
import { isKeyAltPressed, isKeyCtrlPressed } from '~/store'
import { useAtomValue } from 'jotai'
import { ArrowDownFromLine, ArrowUpToLine, Search } from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { Prism } from 'prism-react-renderer'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import mergeRefs from '~/components/atoms/merge-refs'
import ToolTip from '~/components/atoms/tooltip'
import type { SimpleBarOptions } from '~/components/libs/simplebar-react/simplebar-core'
import { Box, ButtonGhost, Flex, Input, Text } from '~/components/ui'

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

import { ClipboardHistoryQuickPasteRow } from '../components/ClipboardHistory/ClipboardHistoryQuickPasteRow'

const altKeys = ['Alt', 'Meta']
const ctrlKeys = ['Control']
const keyUp = ['ArrowUp', 'Up']
const keyPageUp = ['PageUp']
const keyPageDown = ['PageDown']
const keyDown = ['ArrowDown', 'Down']
const keyEnter = ['Enter']
const keyEscape = ['Escape']
const keyHome = ['Home']

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

async function invokeCopyPasteHistoryItem(historyId: UniqueIdentifier) {
  try {
    await invoke('quickpaste_hide_paste_close', { historyId })
  } catch (error) {
    console.error('Error copying history item:', error)
  }
}

export default function ClipboardHistoryQuickPastePage() {
  const [copiedItem, setCopiedItem] = useCopyPasteHistoryItem({})
  const [pastedItem, pastingCountDown, setPastedItem] = usePasteHistoryItem({})

  const [savingItem, setSavingItem] = useState<UniqueIdentifier | null>(null)
  const { movePinnedClipboardHistoryUpDown } = useMovePinnedClipboardHistoryUpDown()

  const [historyFilters, setHistoryFilters] = useState<string[]>([])
  const [codeFilters, setCodeFilters] = useState<string[]>([])
  const [appFilters, setAppFilters] = useState<string[]>([])

  const historyListSimpleBarRef = useRef<HTMLDivElement | null>(null)

  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null)
  const [brokenImageItems, setBrokenImageItems] = useState<UniqueIdentifier[]>([])
  const [dragOverTrashId, setDragOverTrashId] = useState<UniqueIdentifier | null>(null)
  const [dragOverPinnedId, setDragOverPinnedId] = useState<UniqueIdentifier | null>(null)
  const [dragOverBoardId, setDragOverBoardId] = useState<UniqueIdentifier | null>(null)
  const [dragOverClipId, setDragOverClipId] = useState<UniqueIdentifier | null>(null)
  const [expandedItems, setExpandedItems] = useState<UniqueIdentifier[]>([])
  const [wrappedTextItems, setWrappedTextItems] = useState<UniqueIdentifier[]>([])
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

  const { t } = useTranslation()

  const { themeDark } = useAtomValue(themeStoreAtom)

  const { pinnedClipboardHistory } = useGetPinnedClipboardHistories()

  const isDark = themeDark()

  const {
    setHistoryListSimpleBar,
    scrollToTopHistoryList,
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

  const keyboardIndexSelectedItem = useSignal<number>(0)

  const [isPrismLoaded, setPrismLoaded] = useState(false)

  const {
    isClipboardInfiniteHistoryLoading,
    isClipboardHistoryFetchingNextPage,
    infiniteClipboardHistory,
    invalidateClipboardHistoryQuery,
    fetchNextClipboardHistoryPage,
  } = useInfiniteClipboardHistory()

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

  const pastedItemValue = useMemo(() => pastedItem, [pastedItem])
  const copiedItemValue = useMemo(() => copiedItem, [copiedItem])

  const clipboardHistory = hasSearchOrFilter ? foundClipboardHistory : allClipboardHistory

  const { refetchFindClipboardHistory } = useFindClipboardHistory({
    query: debouncedSearchTerm,
    filters: historyFilters,
    codeFilters,
    appFilters,
  })

  const keyboardSelectedItemId = useMemo(() => {
    return clipboardHistory.length > 0
      ? clipboardHistory[keyboardIndexSelectedItem.value].historyId
      : null
  }, [keyboardIndexSelectedItem.value, clipboardHistory])

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

  function hasAltKey(event: KeyboardEvent) {
    return altKeys.includes(event.key)
  }

  function hasCtrlKey(event: KeyboardEvent) {
    return ctrlKeys.includes(event.key)
  }

  async function downHandler(event: KeyboardEvent) {
    event.preventDefault()

    if (hasAltKey(event)) {
      isKeyAltPressed.value = true
    }
    if (hasCtrlKey(event)) {
      isKeyCtrlPressed.value = true
    }

    if (keyHome.includes(event.key)) {
      const prevSelectedItem = clipboardHistory[0]?.historyId
      if (prevSelectedItem) {
        keyboardIndexSelectedItem.value = 0
        scrollToTopHistoryList()
      }
    }

    if (keyUp.includes(event.key)) {
      const prevSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value - 1]?.historyId
      if (prevSelectedItem) {
        keyboardIndexSelectedItem.value = keyboardIndexSelectedItem.value - 1
      } else {
        keyboardIndexSelectedItem.value = 0
      }
    }

    if (keyDown.includes(event.key)) {
      const nextSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value + 1]?.historyId

      if (nextSelectedItem) {
        keyboardIndexSelectedItem.value = keyboardIndexSelectedItem.value + 1
      }
    }

    if (keyPageUp.includes(event.key)) {
      const prevSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value - 5]?.historyId
      if (prevSelectedItem) {
        keyboardIndexSelectedItem.value = keyboardIndexSelectedItem.value - 5
      } else {
        keyboardIndexSelectedItem.value = 0
      }
    }

    if (keyPageDown.includes(event.key)) {
      const nextSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value + 5]?.historyId

      if (nextSelectedItem) {
        keyboardIndexSelectedItem.value = keyboardIndexSelectedItem.value + 5
      } else {
        keyboardIndexSelectedItem.value = clipboardHistory.length - 1
      }
    }

    if (keyEnter.includes(event.key)) {
      const selectedItemId = clipboardHistory[keyboardIndexSelectedItem.value]?.historyId
      if (selectedItemId) {
        invokeCopyPasteHistoryItem(selectedItemId)
      }
    }
    if (keyEscape.includes(event.key)) {
      appWindow?.close()
    }
  }

  function upHandler(event: KeyboardEvent) {
    if (hasAltKey(event)) {
      isKeyAltPressed.value = false
    }
    if (hasCtrlKey(event)) {
      isKeyCtrlPressed.value = false
    }
  }

  function focusHandler() {
    isKeyAltPressed.value = false
    isKeyCtrlPressed.value = false
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)
    window.addEventListener('focus', focusHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
      window.removeEventListener('focus', focusHandler)
    }
  }, [clipboardHistory, keyboardIndexSelectedItem.value])

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
              } px-2 py-2 pb-0 bg-orange-200/70 dark:bg-orange-900/60 mt-0 my-2 rounded-md relative`}
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
                              setKeyboardSelected={id => {
                                const index = clipboardHistory.findIndex(
                                  item => item.historyId === id
                                )
                                if (index > -1) {
                                  keyboardIndexSelectedItem.value = index
                                }
                              }}
                              isKeyboardSelected={keyboardSelectedItemId === historyId}
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
                              onCopy={invokeCopyPasteHistoryItem}
                              onCopyPaste={invokeCopyPasteHistoryItem}
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
                              isSelected={false}
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
              {!isShowHistoryPinned ? (
                <Flex className="justify-center">
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
                      {t('Pinned', {
                        ns: 'common',
                        count: pinnedClipboardHistory.length,
                      })}
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
                </Flex>
              ) : (
                <Box className="mb-2" />
              )}
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
                      scrollToTopHistoryList(true)
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
                      if (e.visibleStartIndex > 20) {
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
                    outerRef={historyListSimpleBarRef}
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
                          onCopy={invokeCopyPasteHistoryItem}
                          onCopyPaste={invokeCopyPasteHistoryItem}
                          isKeyboardSelected={keyboardSelectedItemId === historyId}
                          setKeyboardSelected={id => {
                            const index = clipboardHistory.findIndex(
                              item => item.historyId === id
                            )
                            if (index > -1) {
                              keyboardIndexSelectedItem.value = index
                            }
                          }}
                          pastingCountDown={
                            historyId === pastedItemValue ? pastingCountDown : undefined
                          }
                          isPasted={historyId === pastedItemValue}
                          isCopied={historyId === copiedItemValue}
                          isSaved={historyId === savingItem}
                          setSavingItem={setSavingItem}
                          key={historyId}
                          isDeleting={false}
                          isSelected={false}
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