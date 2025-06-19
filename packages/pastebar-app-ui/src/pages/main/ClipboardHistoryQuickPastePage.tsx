import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'
import { isKeyAltPressed, isKeyCtrlPressed, settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { throttle } from 'lodash-es'
import { ArrowDownFromLine, ArrowUpToLine, Search } from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { Prism } from 'prism-react-renderer'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import useResizeObserver from 'use-resize-observer'

import mergeRefs from '~/components/atoms/merge-refs'
import ToolTip from '~/components/atoms/tooltip'
import { Box, ButtonGhost, Flex, Input, Text } from '~/components/ui'

import { clipboardHistoryStoreAtom } from '~/store/clipboardHistoryStore'
import { themeStoreAtom } from '~/store/themeStore'
import { uiStoreAtom } from '~/store/uiStore'

import {
  useFindClipboardHistory,
  useGetPinnedClipboardHistories,
  useInfiniteClipboardHistory,
  useMovePinnedClipboardHistoryUpDown,
} from '~/hooks/queries/use-history-items'
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

async function invokeCopyPasteHistoryItem(
  historyId: UniqueIdentifier,
  isQuickPasteCopyOnly: boolean,
  isQuickPasteAutoClose: boolean,
  handleCopyHistoryItem: (id: UniqueIdentifier) => void,
  handlePasteHistoryItem: (id: UniqueIdentifier, delay?: number) => void
) {
  try {
    if (isQuickPasteCopyOnly) {
      handleCopyHistoryItem(historyId)
    } else {
      if (isQuickPasteAutoClose) {
        await invoke('quickpaste_hide_paste_close', { historyId })
      } else {
        handlePasteHistoryItem(historyId, 0)
      }
    }
  } catch (error) {
    console.error('Error copying/pasting history item:', error)
  }
}

export default function ClipboardHistoryQuickPastePage() {
  const [savingItem, setSavingItem] = useState<UniqueIdentifier | null>(null)
  const isShowSearch = useSignal(false)
  const { movePinnedClipboardHistoryUpDown } = useMovePinnedClipboardHistoryUpDown()

  const {
    isAutoPreviewLinkCardsEnabled,
    isAutoGenerateLinkCardsEnabled,
    isQuickPasteCopyOnly,
    isQuickPasteAutoClose,
    isSingleClickToCopyPaste,
    isSingleClickToCopyPasteQuickWindow,
  } = useAtomValue(settingsStoreAtom)

  const [historyFilters, setHistoryFilters] = useState<string[]>([])
  const [codeFilters, setCodeFilters] = useState<string[]>([])
  const [appFilters, setAppFilters] = useState<string[]>([])

  const historyListSimpleBarRef = useRef<HTMLDivElement | null>(null)

  const [brokenImageItems, setBrokenImageItems] = useState<UniqueIdentifier[]>([])
  const [expandedItems, setExpandedItems] = useState<UniqueIdentifier[]>([])
  const [wrappedTextItems, setWrappedTextItems] = useState<UniqueIdentifier[]>([])
  const { setIsScrolling, isScrolling, isWindows, setReturnRoute } =
    useAtomValue(uiStoreAtom)

  const { t } = useTranslation()

  const [isShowHistoryPinned, setIsShowHistoryPinned] = useState(false)

  const { themeDark } = useAtomValue(themeStoreAtom)
  const { ref: pinnedPanelRef, height: pinnedPanelHeight } = useResizeObserver()
  const { ref: historyPanelRef, height: historyPanelHeight } = useResizeObserver()

  const { pinnedClipboardHistory } = useGetPinnedClipboardHistories()

  const isDark = themeDark()

  // Hooks for copy and paste operations
  const [copiedHistoryItem, handleCopyHistoryItem] = useCopyPasteHistoryItem({
    delay: 100,
    onCopied: () => {
      if (isQuickPasteAutoClose) {
        appWindow?.close()
      }
    },
  })

  const [pastedHistoryItem, pastingCountDown, handlePasteHistoryItem] =
    usePasteHistoryItem({
      delay: 100,
      onPasted: () => {
        if (isQuickPasteAutoClose) {
          appWindow?.close()
        }
      },
    })

  // Create wrapper functions for the row component
  const onCopyHistoryItem = useCallback(
    (historyId: UniqueIdentifier) => {
      handleCopyHistoryItem(historyId)
    },
    [handleCopyHistoryItem]
  )

  const onCopyPasteHistoryItem = useCallback(
    (historyId: UniqueIdentifier) => {
      invokeCopyPasteHistoryItem(
        historyId,
        isQuickPasteCopyOnly,
        isQuickPasteAutoClose,
        handleCopyHistoryItem,
        handlePasteHistoryItem
      )
    },
    [
      isQuickPasteCopyOnly,
      isQuickPasteAutoClose,
      handleCopyHistoryItem,
      handlePasteHistoryItem,
    ]
  )

  const {
    setHistoryListSimpleBar,
    scrollToTopHistoryList,
    addToClipboardHistoryIdsURLErrors,
    addToGenerateLinkMetaDataInProgress,
    removeToGenerateLinkMetaDataInProgress,
    clipboardHistoryGenerateLinkMetaDataInProgress,
    clipboardHistoryIdsURLErrors,
    generateLinkMetaData,
    removeLinkMetaData,
  } = useAtomValue(clipboardHistoryStoreAtom)

  const keyboardIndexSelectedItem = useSignal<number>(0)
  const keyboardIndexSelectedPinnedItem = useSignal<number>(-1)

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

  const onScrollCallback = throttle(
    () => {
      if (!isScrolling) {
        setIsScrolling(true)
      }
    },
    300,
    { leading: true }
  )

  const hasSearchOrFilter = useMemo(() => {
    return debouncedSearchTerm.length > 1 || historyFilters.length > 0
  }, [debouncedSearchTerm, historyFilters])

  const clipboardHistory = hasSearchOrFilter ? foundClipboardHistory : allClipboardHistory

  const { refetchFindClipboardHistory } = useFindClipboardHistory({
    query: debouncedSearchTerm,
    filters: historyFilters,
    codeFilters,
    appFilters,
  })

  const keyboardSelectedItemId = useMemo(() => {
    if (keyboardIndexSelectedItem.value >= 0) {
      setIsShowHistoryPinned(false)
      keyboardIndexSelectedPinnedItem.value = -1
    }

    return clipboardHistory.length > 0 &&
      clipboardHistory[keyboardIndexSelectedItem.value]
      ? clipboardHistory[keyboardIndexSelectedItem.value].historyId
      : null
  }, [
    keyboardIndexSelectedItem.value,
    clipboardHistory,
    keyboardIndexSelectedPinnedItem.value,
  ])

  const keyboardSelectedPinnedItemId = useMemo(() => {
    if (keyboardIndexSelectedPinnedItem.value > 0) {
      keyboardIndexSelectedItem.value = -1
    }
    return pinnedClipboardHistory.length > 0 &&
      pinnedClipboardHistory[keyboardIndexSelectedPinnedItem.value]
      ? pinnedClipboardHistory[keyboardIndexSelectedPinnedItem.value].historyId
      : null
  }, [
    keyboardIndexSelectedPinnedItem.value,
    pinnedClipboardHistory,
    keyboardIndexSelectedItem.value,
  ])

  const doRefetchFindClipboardHistory = useCallback(() => {
    if (hasSearchOrFilter) {
      refetchFindClipboardHistory()
      keyboardIndexSelectedPinnedItem.value = -1
      keyboardIndexSelectedItem.value = 0
    }
  }, [
    hasSearchOrFilter,
    keyboardIndexSelectedPinnedItem.value,
    keyboardIndexSelectedItem.value,
  ])

  useHotkeys(
    [...Array(10).keys()].map(i => `ctrl+${i.toString()}`),
    e => {
      e.preventDefault()
      const index = e.key === '0' ? 9 : Number(e.key) - 1
      const itemId = clipboardHistory[Number(index)]?.historyId

      if (!itemId) {
        return
      }

      invokeCopyPasteHistoryItem(
        itemId,
        isQuickPasteCopyOnly,
        isQuickPasteAutoClose,
        handleCopyHistoryItem,
        handlePasteHistoryItem
      )
    },
    {
      enableOnFormTags: ['input'],
    }
  )

  useHotkeys(
    [...Array(10).keys()].map(i => `meta+${i.toString()}`),
    e => {
      e.preventDefault()
      const index = e.key === '0' ? 9 : Number(e.key) - 1
      const itemId = clipboardHistory[Number(index)]?.historyId

      if (!itemId) {
        return
      }

      invokeCopyPasteHistoryItem(
        itemId,
        isQuickPasteCopyOnly,
        isQuickPasteAutoClose,
        handleCopyHistoryItem,
        handlePasteHistoryItem
      )
    },
    {
      enabled: !isWindows,
      enableOnFormTags: ['input'],
    }
  )

  const toggleSearch = (e: KeyboardEvent) => {
    e.preventDefault()
    if (keyboardIndexSelectedPinnedItem.value > 0) {
      keyboardIndexSelectedPinnedItem.value = -1
      keyboardIndexSelectedItem.value = 0
    }
    isShowSearch.value = !isShowSearch.value
  }

  useEffect(() => {
    if (searchHistoryInputRef?.current && isShowSearch.value) {
      searchHistoryInputRef?.current?.focus()
      // Set cursor position to end when search is activated with initial text
      if (searchTerm.length > 0) {
        requestAnimationFrame(() => {
          searchHistoryInputRef?.current?.setSelectionRange(
            searchTerm.length,
            searchTerm.length
          )
        })
      }
    }
  }, [isShowSearch.value])

  useHotkeys(['ctrl+f', 'meta+f', 'ctrl+k', 'meta+k', '/'], toggleSearch)

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
    if (historyListSimpleBarRef.current) {
      setHistoryListSimpleBar(historyListSimpleBarRef)
      historyListSimpleBarRef.current.addEventListener('scroll', onScrollCallback)
    }
  }, [historyListSimpleBarRef.current])

  useEffect(() => {
    if (
      debouncedSearchTerm.length > 1 ||
      historyFilters.length > 0 ||
      appFilters.length > 0 ||
      codeFilters.length > 0
    ) {
      refetchFindClipboardHistory()
      scrollToTopHistoryList()
      keyboardIndexSelectedPinnedItem.value = -1
      keyboardIndexSelectedItem.value = 0
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
    if (isScrolling) {
      setIsScrolling(false)
    }

    if (hasAltKey(event)) {
      isKeyAltPressed.value = true
    }
    if (hasCtrlKey(event)) {
      isKeyCtrlPressed.value = true
    }

    // Auto-activate search when typing letters or numbers
    if (
      !isShowSearch.value &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key.length === 1 &&
      /^[\p{L}\p{N}]$/u.test(event.key)
    ) {
      event.preventDefault()
      isShowSearch.value = true
      setSearchTerm(event.key)
      // Focus will be handled by the useEffect that watches searchHistoryInputRef
      return
    }

    // Handle Escape key before the early return for search input
    if (keyEscape.includes(event.key)) {
      event.preventDefault()
      if (isShowSearch.value && searchTerm.length > 0) {
        setSearchTerm('')
      } else if (isShowSearch.value && searchTerm.length === 0) {
        isShowSearch.value = false
      } else if (!isShowSearch.value) {
        appWindow?.close()
      }
      return
    }

    // If search is active and input is focused, only process navigation keys
    if (isShowSearch.value && document.activeElement === searchHistoryInputRef?.current) {
      // Allow navigation keys to be processed
      if (!keyUp.includes(event.key) && 
          !keyDown.includes(event.key) && 
          !keyPageUp.includes(event.key) && 
          !keyPageDown.includes(event.key) &&
          !keyHome.includes(event.key) &&
          !keyEnter.includes(event.key)) {
        return
      }
    }

    if (keyHome.includes(event.key)) {
      if (!isShowSearch.value) {
        event.preventDefault()
      } else {
        return
      }
      keyboardIndexSelectedPinnedItem.value = -1
      const prevSelectedItem = clipboardHistory[0]?.historyId
      if (prevSelectedItem) {
        keyboardIndexSelectedItem.value = 0
        scrollToTopHistoryList()
      }
      return
    }

    if (keyUp.includes(event.key)) {
      event.preventDefault()
      if (keyboardIndexSelectedPinnedItem.value > -1) {
        const prevSelectedPinnedItem =
          pinnedClipboardHistory[keyboardIndexSelectedPinnedItem.value - 1]?.historyId

        keyboardIndexSelectedItem.value = -1
        if (prevSelectedPinnedItem) {
          keyboardIndexSelectedPinnedItem.value =
            keyboardIndexSelectedPinnedItem.value - 1
        } else {
          keyboardIndexSelectedPinnedItem.value = 0
        }
        return
      }
      const prevSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value - 1]?.historyId
      if (prevSelectedItem) {
        keyboardIndexSelectedItem.value -= 1
      } else {
        if (pinnedClipboardHistory.length > 0 && !isShowSearch.value) {
          if (!isShowHistoryPinned) {
            setIsShowHistoryPinned(true)
          }
          keyboardIndexSelectedItem.value = -1
          keyboardIndexSelectedPinnedItem.value = pinnedClipboardHistory.length - 1
        } else {
          keyboardIndexSelectedItem.value = 0
        }
      }
      return
    }

    if (keyDown.includes(event.key)) {
      event.preventDefault()
      if (keyboardIndexSelectedPinnedItem.value > -1) {
        const nextSelectedPinnedItem =
          pinnedClipboardHistory[keyboardIndexSelectedPinnedItem.value + 1]?.historyId

        if (nextSelectedPinnedItem) {
          keyboardIndexSelectedItem.value = -1
          keyboardIndexSelectedPinnedItem.value += 1
        } else {
          keyboardIndexSelectedPinnedItem.value = -1
          keyboardIndexSelectedItem.value = 0
        }
        return
      }

      const nextSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value + 1]?.historyId

      if (nextSelectedItem) {
        keyboardIndexSelectedItem.value += 1
      } else {
        if (keyboardIndexSelectedItem.value < 0 && pinnedClipboardHistory.length > 0) {
          keyboardIndexSelectedItem.value += 1
        }
      }
      return
    }

    if (keyPageUp.includes(event.key)) {
      event.preventDefault()
      keyboardIndexSelectedPinnedItem.value = -1
      const prevSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value - 5]?.historyId
      if (prevSelectedItem) {
        keyboardIndexSelectedItem.value -= 5
      } else {
        keyboardIndexSelectedItem.value = 0
      }
      return
    }

    if (keyPageDown.includes(event.key)) {
      event.preventDefault()
      keyboardIndexSelectedPinnedItem.value = -1
      const nextSelectedItem =
        clipboardHistory[keyboardIndexSelectedItem.value + 5]?.historyId

      if (nextSelectedItem) {
        keyboardIndexSelectedItem.value += 5
      } else {
        keyboardIndexSelectedItem.value = clipboardHistory.length - 1
      }
      return
    }

    if (keyEnter.includes(event.key)) {
      event.preventDefault()
      const selectedItemId =
        keyboardIndexSelectedPinnedItem.value > -1
          ? pinnedClipboardHistory[keyboardIndexSelectedPinnedItem.value]?.historyId
          : clipboardHistory[keyboardIndexSelectedItem.value]?.historyId

      if (selectedItemId) {
        invokeCopyPasteHistoryItem(
          selectedItemId,
          isQuickPasteCopyOnly,
          isQuickPasteAutoClose,
          handleCopyHistoryItem,
          handlePasteHistoryItem
        )
      }
    }
    return
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
  }, [
    clipboardHistory,
    pinnedClipboardHistory,
    isShowSearch.value,
    searchTerm,
    keyboardIndexSelectedItem.value,
    keyboardIndexSelectedPinnedItem.value,
  ])

  return (
    isPrismLoaded && (
      <Box
        ref={historyPanelRef}
        className="h-[100vh] flex flex-col bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.8] pb-6 pt-4 px-3 pr-3"
      >
        <Box className="flex flex-col relative" id="side-panel_tour">
          {isShowSearch.value && (
            <SearchInput
              key="search-input"
              setSearchTerm={setSearchTerm}
              searchTerm={searchTerm}
              searchHistoryInputRef={searchHistoryInputRef}
              t={t}
            />
          )}
          {hasSearchOrFilter ? (
            <Box className="cursor-pointer absolute top-[46px] z-100 animate-in fade-in fade-out flex justify-center w-full pointer-events-none">
              <ToolTip
                text={t('Clear found results and filters', { ns: 'common' })}
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
            pinnedClipboardHistory.length > 0 &&
            !isShowSearch.value && (
              <Box
                ref={pinnedPanelRef}
                className={`px-2 py-2 pb-0 bg-orange-200/70 dark:bg-orange-900/60 mt-0 my-2 rounded-md relative`}
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
                  <Box className={`flex flex-col gap-1 relative`}>
                    {isShowHistoryPinned &&
                      pinnedClipboardHistory
                        .sort((a, b) => a.pinnedOrderNumber - b.pinnedOrderNumber)
                        .map((item, index) => {
                          const historyId = item.historyId
                          return (
                            <ClipboardHistoryQuickPasteRow
                              isPinnedTop
                              isScrolling={isScrolling}
                              setKeyboardSelected={id => {
                                const index = pinnedClipboardHistory.findIndex(
                                  item => item.historyId === id
                                )
                                if (index > -1) {
                                  keyboardIndexSelectedPinnedItem.value = index
                                  keyboardIndexSelectedItem.value = -1
                                }
                              }}
                              isKeyboardSelected={
                                keyboardSelectedPinnedItemId === historyId
                              }
                              hasClipboardHistoryURLErrors={clipboardHistoryIdsURLErrors.includes(
                                historyId
                              )}
                              showSelectHistoryItems={false}
                              setHistoryFilters={setHistoryFilters}
                              setAppFilters={setAppFilters}
                              addToClipboardHistoryIdsURLErrors={
                                addToClipboardHistoryIdsURLErrors
                              }
                              isLinkCardPreviewEnabled={isAutoPreviewLinkCardsEnabled}
                              isAutoGenerateLinkCardsEnabled={
                                isAutoGenerateLinkCardsEnabled
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
                              onCopy={onCopyHistoryItem}
                              onCopyPaste={onCopyPasteHistoryItem}
                              isSaved={historyId === savingItem}
                              setSavingItem={setSavingItem}
                              isDeleting={false}
                              isSelected={false}
                              isWindows={isWindows}
                              setBrokenImageItem={setBrokenImageItem}
                              isBrokenImage={brokenImageItems.includes(historyId)}
                              showTimeAgo={false}
                              isExpanded={expandedItems.includes(historyId)}
                              isWrapText={wrappedTextItems.includes(historyId)}
                              searchTerm={hasSearchOrFilter ? debouncedSearchTerm : ''}
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
                              isSingleClickToCopyPaste={
                                isSingleClickToCopyPaste ||
                                isSingleClickToCopyPasteQuickWindow
                              }
                            />
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

          <Box>
            {clipboardHistory.length > 0 || hasSearchOrFilter ? (
              <div className="relative" id="quick-paste-history-list">
                {currentTopItemTimeAgo && (
                  <Box
                    className={`${
                      newClipboardHistoryCount > 0 ? 'top-9' : 'top-1'
                    } absolute z-100 animate-in fade-in fade-out duration-300 flex justify-center w-full ml-[-5px] pointer-events-none`}
                  >
                    <ToolTip
                      text={t('Scroll to Top', { ns: 'common' })}
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
                        style={{ overflowX: 'hidden' }}
                        height={
                          historyPanelHeight
                            ? historyPanelHeight -
                              (isShowSearch.value
                                ? 40
                                : pinnedClipboardHistory.length === 0
                                  ? 0
                                  : pinnedPanelHeight
                                    ? pinnedPanelHeight
                                    : 0)
                            : 400
                        }
                        itemCount={clipboardHistory.length}
                        width="100%"
                        itemSize={getRowHeight}
                        itemKey={index =>
                          clipboardHistory[index].historyId ?? 'id-${index}'
                        }
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
                              isLinkCardPreviewEnabled={isAutoPreviewLinkCardsEnabled}
                              isAutoGenerateLinkCardsEnabled={
                                isAutoGenerateLinkCardsEnabled
                              }
                              isScrolling={isScrolling}
                              removeToGenerateLinkMetaDataInProgress={
                                removeToGenerateLinkMetaDataInProgress
                              }
                              addToClipboardHistoryIdsURLErrors={
                                addToClipboardHistoryIdsURLErrors
                              }
                              hasGenerateLinkMetaDataInProgress={clipboardHistoryGenerateLinkMetaDataInProgress.includes(
                                historyId
                              )}
                              isWindows={isWindows}
                              setHistoryFilters={setHistoryFilters}
                              setAppFilters={setAppFilters}
                              setSelectHistoryItem={() => {}}
                              onCopy={onCopyHistoryItem}
                              onCopyPaste={onCopyPasteHistoryItem}
                              isKeyboardSelected={keyboardSelectedItemId === historyId}
                              setKeyboardSelected={id => {
                                const index = clipboardHistory.findIndex(
                                  item => item.historyId === id
                                )
                                if (index > -1) {
                                  keyboardIndexSelectedItem.value = index
                                  keyboardIndexSelectedPinnedItem.value = -1
                                }
                              }}
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
                              showSelectHistoryItems={false}
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
                              isSingleClickToCopyPaste={
                                isSingleClickToCopyPaste ||
                                isSingleClickToCopyPasteQuickWindow
                              }
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
      </Box>
    )
  )
}

const SearchInput = React.memo(
  ({
    searchTerm,
    setSearchTerm,
    searchHistoryInputRef,
    t,
  }: {
    searchTerm: string
    setSearchTerm: (value: string) => void
    searchHistoryInputRef: React.RefObject<HTMLInputElement>
    t: (key: string, options?: Record<string, unknown>) => string
  }) => (
    <Box className="flex flex-row bg-slate-100 dark:bg-slate-700 rounded-md p-0 items-center h-[40px] mb-3">
      <Input
        placeholder={`${t('Find in history', { ns: 'dashboard' })}...`}
        autoFocus
        key="search-history"
        type="search"
        onChange={e => {
          const newValue = e.target.value
          if (newValue !== searchTerm) {
            setSearchTerm(newValue)
          }
        }}
        value={searchTerm}
        ref={searchHistoryInputRef}
        iconLeft={<Search className="h-4 w-4" />}
        classNameInput="w-full pr-0"
        className="text-md ring-offset-0 bg-slate-100 dark:bg-slate-700 border-r-0 border-t-0 border-b-0"
        onKeyDown={e => {
          // Allow navigation keys and Escape to bubble up
          if (!keyEscape.includes(e.key) && 
              !keyUp.includes(e.key) && 
              !keyDown.includes(e.key) && 
              !keyPageUp.includes(e.key) && 
              !keyPageDown.includes(e.key) &&
              !keyHome.includes(e.key) &&
              !keyEnter.includes(e.key)) {
            e.stopPropagation()
          }
        }}
      />
    </Box>
  )
)
