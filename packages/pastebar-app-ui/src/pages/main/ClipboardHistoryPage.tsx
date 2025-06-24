import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  defaultDropAnimation,
  DndContext,
  DragOverlay,
  DropAnimation,
  KeyboardSensor,
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
  collectionsStoreAtom,
  createClipBoardItemId,
  createClipHistoryItemIds,
  createMenuItemFromHistoryId,
  currentBoardIndex,
  currentNavigationContext,
  hoveringHistoryRowId,
  isKeyAltPressed,
  keyboardSelectedBoardId,
  keyboardSelectedClipId,
  keyboardSelectedItemId,
  resetKeyboardNavigation,
  settingsStoreAtom,
  shouldKeyboardNavigationBeDisabled,
  showClipsMoveOnBoardId,
  showDetailsClipId,
  showHistoryDeleteConfirmationId,
  showKeyboardNavContextMenuClipId,
  showKeyboardNavContextMenuHistoryId,
  showLargeViewClipId,
  showLargeViewHistoryId,
  showOrganizeLayout,
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
  ListFilter,
  Pin,
  Search,
  X,
} from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { Prism } from 'prism-react-renderer'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import useResizeObserver from 'use-resize-observer'

import {
  buildNavigationOrder,
  findCurrentNavigationIndex,
  findNextNonEmptyBoard,
  navigateToItem,
} from '~/lib/utils'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import mergeRefs from '~/components/atoms/merge-refs'
import ToolTip from '~/components/atoms/tooltip'
import AutoSize from '~/components/libs/autosizer'
import SimpleBar from '~/components/libs/simplebar-react'
import type { SimpleBarOptions } from '~/components/libs/simplebar-react/simplebar-core'
import {
  SplitPanePrimary,
  SplitPaneSecondary,
  SplitView,
} from '~/components/libs/split-view'
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
import { useCopyClipItem } from '~/hooks/use-copypaste-clip-item' // Added for clip copying
import {
  useCopyPasteHistoryItem,
  usePasteHistoryItem,
} from '~/hooks/use-copypaste-history-item'
import { useDebounce } from '~/hooks/use-debounce'
import useDeleteConfirmationTimer from '~/hooks/use-delete-confirmation-items'
import useKeyboardDeleteConfirmation from '~/hooks/use-keyboard-delete-confirmation'
import { useSignal } from '~/hooks/use-signal'
import {
  specialCopiedItem,
  specialPastedItem,
  specialPastedItemCountDown,
} from '~/hooks/use-special-copypaste-history-item'

import {
  ClipboardHistoryIconMenu,
  ClipboardHistoryLargeView,
  ClipboardHistoryListFilter,
  ClipboardHistoryRow,
  TrashHistory,
} from '../components/ClipboardHistory'
import { ClipboardHistoryWindowIcons } from '../components/ClipboardHistory/ClipboardHistoryWindowIcons'
import { Dashboard } from '../components/Dashboard'
import { ClipCardLargeView } from '../components/Dashboard/components/ClipCardLargeView'
import {
  coordinateGetter,
  getActiveIdFromPinned,
} from '../components/Dashboard/components/utils'
import { BOARD } from '../components/Dashboard/Dashboard'

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

export default function ClipboardHistoryPage() {
  const [copiedItem, setCopiedItem, runSequenceCopy] = useCopyPasteHistoryItem({})
  const [, handleCopyClipItem] = useCopyClipItem({}) // Destructure to get handleCopyClipItem
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
    isScrolling,
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
  const {
    isHistoryEnabled,
    setIsHistoryEnabled,
    isHistoryAutoUpdateOnCaputureEnabled,
    isAutoPreviewLinkCardsEnabled,
    isAutoGenerateLinkCardsEnabled,
    historyDetectLanguagesEnabledList,
    copyPasteSequencePinnedDelay,
    setCopyPasteSequencePinnedDelay,
    copyPasteSequenceIsReversOrder,
    setCopyPasteSequenceIsReversOrder,
    setIsHistoryAutoUpdateOnCaputureEnabled,
    isHistoryPanelVisibleOnly,
    isSimplifiedLayout,
    isSavedClipsPanelVisibleOnly,
    isSingleClickToCopyPaste,
    historyPreviewLineLimit,
  } = useAtomValue(settingsStoreAtom)

  const { t } = useTranslation()

  const { clipItems, currentTab } = useAtomValue(collectionsStoreAtom)

  const { themeDark } = useAtomValue(themeStoreAtom)
  const { ref: pinnedPanelRef, height: pinnedPanelHeight } = useResizeObserver()

  const isPinnedPanelHovering = useSignal(false)
  const isPinnedPanelKeepOpen = useSignal(false)

  const { showConfirmation, hoveringHistoryIdDelete } = useDeleteConfirmationTimer({
    hoveringHistoryRowId,
    selectedHistoryItems,
    onConfirmedDelete: async () => {
      if (selectedHistoryItems.length > 0) {
        await deleteClipboardHistoryByIds({ historyIds: selectedHistoryItems })
        setSelectedHistoryItems([])
      } else if (hoveringHistoryIdDelete) {
        await deleteClipboardHistoryByIds({ historyIds: [hoveringHistoryIdDelete] })
      }
    },
  })

  const {
    showConfirmation: showConfirmationKeyboardDelete,
    keyboardItemIdDelete,
    resetTimer: resetKeyboardDeleteTimer,
  } = useKeyboardDeleteConfirmation({
    keyboardSelectedItemId: keyboardSelectedItemId,
    selectedHistoryItems,
    onConfirmedDelete: async () => {
      if (keyboardSelectedItemId.value) {
        // Calculate next selection before deletion
        const currentIndex = keyboardSelectedItemId.value
          ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
          : -1
        let nextSelectedId: UniqueIdentifier | null = null
        if (currentIndex !== -1) {
          if (currentIndex < clipboardHistory.length - 1) {
            // Select next item
            nextSelectedId = clipboardHistory[currentIndex + 1].historyId
          } else if (currentIndex > 0) {
            // Select previous item
            nextSelectedId = clipboardHistory[currentIndex - 1].historyId
          }
          // If only one item, nextSelectedId remains null
        }

        await deleteClipboardHistoryByIds({
          historyIds: [keyboardSelectedItemId.value],
        })

        // Update selection to the calculated next item
        keyboardSelectedItemId.value = nextSelectedId
      }
    },
  })

  const isPinnedPanelHoverOpen = useMemo(() => {
    return isPinnedPanelKeepOpen.value || isPinnedPanelHovering.value
  }, [isPinnedPanelHovering.value, isPinnedPanelKeepOpen.value])

  const { pinnedClipboardHistory } = useGetPinnedClipboardHistories()

  const isDark = themeDark()

  const {
    setHistoryListSimpleBar,
    scrollToTopHistoryList,
    updateClipboardHistory,
    addToClipboardHistoryIdsURLErrors,
    addToGenerateLinkMetaDataInProgress,
    removeToGenerateLinkMetaDataInProgress,
    clipboardHistoryGenerateLinkMetaDataInProgress,
    clipboardHistoryIdsURLErrors,
    generateLinkMetaData,
    removeLinkMetaData,
  } = useAtomValue(clipboardHistoryStoreAtom)

  const [isPrismLoaded, setPrismLoaded] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

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

  const isKeyAltPressedValue = useMemo(
    () => isKeyAltPressed.value,
    [isKeyAltPressed.value]
  )

  const hasSelectedPinned = useMemo(
    () =>
      selectedHistoryItems.some(item => {
        return pinnedClipboardHistory.some(pinnedItem => pinnedItem.historyId === item)
      }),
    [selectedHistoryItems, pinnedClipboardHistory]
  )

  const pastedItemValue = useMemo(() => pastedItem, [pastedItem])
  const copiedItemValue = useMemo(() => copiedItem, [copiedItem])
  const specialCopiedItemValue = useMemo(
    () => specialCopiedItem.value,
    [specialCopiedItem.value]
  )
  const specialPastedItemValue = useMemo(
    () => specialPastedItem.value,
    [specialPastedItem.value]
  )
  const specialPastingCountDown = useMemo(
    () => specialPastedItemCountDown.value,
    [specialPastedItemCountDown.value]
  )

  const clipboardHistory = hasSearchOrFilter ? foundClipboardHistory : allClipboardHistory

  const historyIndexMap = useMemo(
    () => new Map(clipboardHistory.map((item, index) => [item.historyId, index])),
    [clipboardHistory]
  )

  const { refetchFindClipboardHistory } = useFindClipboardHistory({
    query: debouncedSearchTerm,
    filters: historyFilters,
    codeFilters,
    appFilters,
  })

  const doRefetchFindClipboardHistory = useCallback(() => {
    if (hasSearchOrFilter && isHistoryAutoUpdateOnCaputureEnabled) {
      refetchFindClipboardHistory()
    }
  }, [hasSearchOrFilter, isHistoryAutoUpdateOnCaputureEnabled])

  useHotkeys(
    [...Array(10).keys()].map(i => `ctrl+${i.toString()}`),
    e => {
      e.preventDefault()
      const index = e.key === '0' ? 9 : Number(e.key) - 1
      const itemId = clipboardHistory[Number(index)]?.historyId

      if (!itemId) {
        return
      }

      setCopiedItem(itemId)
    },
    {
      enableOnFormTags: ['input'],
      enabled: isWindows,
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

      setCopiedItem(itemId)
    },
    {
      enabled: !isWindows,
      enableOnFormTags: ['input'],
    }
  )

  useHotkeys(
    [...Array(10).keys()].map(i => `ctrl+${isWindows ? 'alt' : 'meta'}+${i.toString()}`),
    e => {
      e.preventDefault()
      const index = e.key === '0' ? 9 : Number(e.key) - 1
      const itemId = clipboardHistory[Number(index)]?.historyId

      if (!itemId) {
        return
      }

      setPastedItem(itemId)
    },
    {
      enableOnFormTags: ['input'],
    }
  )

  useHotkeys(
    ['enter'],
    async e => {
      e.preventDefault()
      if (currentNavigationContext.value === 'board' && keyboardSelectedClipId.value) {
        try {
          currentNavigationContext.value = null
          keyboardSelectedItemId.value = null
          keyboardSelectedBoardId.value = null
          await handleCopyClipItem(keyboardSelectedClipId.value)
          keyboardSelectedClipId.value = null
        } catch (error) {
          console.error('Failed to copy clip item from hotkey', error)
        }

        currentNavigationContext.value = null
        keyboardSelectedItemId.value = null
        keyboardSelectedBoardId.value = null
        keyboardSelectedClipId.value = null
        currentBoardIndex.value = 0
      } else if (
        (currentNavigationContext.value === 'history' ||
          currentNavigationContext.value === null) &&
        keyboardSelectedItemId.value
      ) {
        // Reset keyboard delete confirmation when copying
        resetKeyboardDeleteTimer()
        setCopiedItem(keyboardSelectedItemId.value)
      } else if (
        (currentNavigationContext.value === 'history' ||
          currentNavigationContext.value === null) &&
        clipboardHistory.length > 0
      ) {
        // TODO: Fix this
        // setCopiedItem(clipboardHistory[0]?.historyId)
      }
      currentNavigationContext.value = null
      keyboardSelectedItemId.value = null
      keyboardSelectedBoardId.value = null
      keyboardSelectedClipId.value = null
      currentBoardIndex.value = 0
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  const currentNavigationContextValue = useMemo(
    () => currentNavigationContext.value,
    [currentNavigationContext.value, currentTab]
  )

  useHotkeys(
    ['arrowdown'],
    e => {
      e.preventDefault()

      // Reset delete confirmation when navigating
      showHistoryDeleteConfirmationId.value = null

      if (keyboardSelectedBoardId.value) {
        const clipsOnBoard = clipItems
          .filter(
            item =>
              item.isClip &&
              item.parentId === keyboardSelectedBoardId.value &&
              item.tabId === currentTab
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        if (clipsOnBoard.length === 0) return

        let currentIndex = clipsOnBoard.findIndex(
          clip => clip.itemId === keyboardSelectedClipId.value
        )
        if (currentIndex === -1 && clipsOnBoard.length > 0) {
          keyboardSelectedClipId.value = clipsOnBoard[0].itemId
        } else {
          currentIndex = (currentIndex + 1) % clipsOnBoard.length
          keyboardSelectedClipId.value = clipsOnBoard[currentIndex].itemId
        }
      }
    },
    {
      enabled:
        currentNavigationContextValue === 'board' &&
        !shouldKeyboardNavigationBeDisabled.value,
    }
  )

  useHotkeys(
    ['arrowup'],
    e => {
      e.preventDefault()

      if (keyboardSelectedBoardId.value) {
        const clipsOnBoard = clipItems
          .filter(
            item =>
              item.isClip &&
              item.parentId === keyboardSelectedBoardId.value &&
              item.tabId === currentTab
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        if (clipsOnBoard.length === 0) return

        let currentIndex = clipsOnBoard.findIndex(
          clip => clip.itemId === keyboardSelectedClipId.value
        )
        if (currentIndex === -1 && clipsOnBoard.length > 0) {
          keyboardSelectedClipId.value = clipsOnBoard[clipsOnBoard.length - 1].itemId
        } else {
          currentIndex = (currentIndex - 1 + clipsOnBoard.length) % clipsOnBoard.length
          keyboardSelectedClipId.value = clipsOnBoard[currentIndex].itemId
        }
      }
    },
    {
      enabled:
        currentNavigationContextValue === 'board' &&
        !shouldKeyboardNavigationBeDisabled.value,
    }
  )

  // Helper function to reset to history context
  const resetToHistory = () => {
    currentNavigationContext.value = 'history'
    keyboardSelectedBoardId.value = null
    keyboardSelectedClipId.value = null
    currentBoardIndex.value = 0
  }

  // Helper function to check if a board has navigable clips
  const hasNavigableClips = (boardId: string | number) => {
    return clipItems.some(
      clip =>
        clip.isClip &&
        clip.parentId === boardId &&
        clip.tabId === currentTab &&
        clip.itemId != null
    )
  }

  // Helper function to handle navigation from history context
  const navigateFromHistory = (direction: 'forward' | 'backward') => {
    const navigationOrder = buildNavigationOrder(clipItems, currentTab)
    const startIndex = direction === 'forward' ? 0 : navigationOrder.length
    const nonEmptyBoard = findNextNonEmptyBoard(
      navigationOrder,
      startIndex,
      direction,
      clipItems,
      currentTab
    )

    if (nonEmptyBoard) {
      currentNavigationContext.value = 'board'
      keyboardSelectedItemId.value = null
      navigateToItem(nonEmptyBoard, clipItems, currentTab)
    } else {
      // No non-empty boards found, ensure we're in history context
      if (currentNavigationContext.value === null) {
        currentNavigationContext.value = 'history'
      }
      keyboardSelectedBoardId.value = null
      keyboardSelectedClipId.value = null
      currentBoardIndex.value = 0
    }
  }

  // Helper function to handle navigation from board context
  const navigateFromBoard = (direction: 'forward' | 'backward') => {
    const navigationOrder = buildNavigationOrder(clipItems, currentTab)

    if (navigationOrder.length <= 1) {
      resetToHistory()
      return
    }

    let currentNavIndex = findCurrentNavigationIndex(navigationOrder)
    const increment = direction === 'forward' ? 1 : -1
    const shouldWrapToHistory =
      direction === 'forward'
        ? (index: number) => index >= navigationOrder.length
        : (index: number) => index < 1

    while (true) {
      currentNavIndex += increment

      if (shouldWrapToHistory(currentNavIndex)) {
        resetToHistory()
        return
      }

      const candidateBoardNavInfo = navigationOrder[currentNavIndex]

      if (hasNavigableClips(candidateBoardNavInfo.id)) {
        navigateToItem(candidateBoardNavInfo, clipItems, currentTab)
        return
      }
    }
  }

  // Simplified tab navigation handler
  const handleTabNavigation =
    (direction: 'forward' | 'backward') => (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      showLargeViewHistoryId.value = null

      const isInHistory =
        currentNavigationContextValue === 'history' ||
        currentNavigationContextValue === null

      if (isInHistory) {
        navigateFromHistory(direction)
      } else if (currentNavigationContextValue === 'board') {
        navigateFromBoard(direction)
      }
    }

  useHotkeys(['control+s'], e => {
    if (hoveringHistoryRowId.value) {
      setSelectHistoryItem(hoveringHistoryRowId.value)
    }
  })

  useHotkeys(['tab'], handleTabNavigation('forward'), {
    enabled: !shouldKeyboardNavigationBeDisabled.value,
  })

  useHotkeys(
    ['space'],
    e => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      if (
        currentNavigationContext.value === 'history' ||
        currentNavigationContext.value === null
      ) {
        if (keyboardSelectedItemId.value) {
          // Reset keyboard delete confirmation when selecting
          resetKeyboardDeleteTimer()

          setSelectHistoryItem(keyboardSelectedItemId.value)
          const currentItemIndex = keyboardSelectedItemId.value
            ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
            : -1
          const nextItem = clipboardHistory[currentItemIndex + 1]
          if (nextItem) {
            keyboardSelectedItemId.value = nextItem.historyId
            if (showLargeViewHistoryId.value) {
              showLargeViewHistoryId.value = nextItem.historyId
            }
          }
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
    }
  )

  useHotkeys(['shift+tab'], handleTabNavigation('backward'), {
    enabled: !shouldKeyboardNavigationBeDisabled.value,
  })

  useHotkeys(
    'esc',
    () => {
      // Clear any delete timeout when escaping
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
        deleteTimeoutRef.current = null
      }

      // Reset delete confirmation on escape
      showHistoryDeleteConfirmationId.value = null

      // Reset keyboard delete confirmation on escape
      resetKeyboardDeleteTimer()

      // Escape closes large view first, then performs normal escape behavior
      if (showKeyboardNavContextMenuHistoryId.value) {
        showKeyboardNavContextMenuHistoryId.value = null
      }

      if (showKeyboardNavContextMenuClipId.value) {
        showKeyboardNavContextMenuClipId.value = null
      }

      if (showLargeViewHistoryId.value) {
        showLargeViewHistoryId.value = null
      } else {
        resetKeyboardNavigation()
      }
    },
    {
      enableOnFormTags: ['input', 'textarea'],
    }
  )

  useHotkeys(
    ['arrowdown'],
    e => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      // Clear any delete timeout when navigating away
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
        deleteTimeoutRef.current = null
      }

      // Reset delete confirmation when navigating to a different item
      showHistoryDeleteConfirmationId.value = null

      // Reset keyboard delete confirmation when navigating
      resetKeyboardDeleteTimer()

      const currentItemIndex = keyboardSelectedItemId.value
        ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
        : -1
      const nextItem = clipboardHistory[currentItemIndex + 1]
      if (nextItem) {
        keyboardSelectedItemId.value = nextItem.historyId
        if (showLargeViewHistoryId.value) {
          showLargeViewHistoryId.value = nextItem.historyId
        }
      }
    },
    {
      enabled:
        (currentNavigationContext.value === 'history' ||
          currentNavigationContext.value === null) &&
        !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['arrowup'],
    e => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      // Clear any delete timeout when navigating away
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
        deleteTimeoutRef.current = null
      }

      // Reset delete confirmation when navigating to a different item
      showHistoryDeleteConfirmationId.value = null

      // Reset keyboard delete confirmation when navigating
      resetKeyboardDeleteTimer()

      if (
        currentNavigationContext.value === 'history' ||
        currentNavigationContext.value === null
      ) {
        const currentItemIndex = keyboardSelectedItemId.value
          ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
          : -1
        const prevItem = clipboardHistory[currentItemIndex - 1]
        if (prevItem) {
          keyboardSelectedItemId.value = prevItem.historyId
          // Update large view if it's open
          if (showLargeViewHistoryId.value) {
            showLargeViewHistoryId.value = prevItem.historyId
          }
        }
      }
    },
    {
      enabled:
        (currentNavigationContext.value === 'history' ||
          currentNavigationContext.value === null) &&
        !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['arrowright'],
    e => {
      e.preventDefault()
      if (keyboardSelectedItemId.value || keyboardSelectedClipId.value) {
        if (isSwapPanels) {
          // In swap mode, right arrow closes large view
          if (
            currentNavigationContext.value === 'history' ||
            currentNavigationContext.value === null
          ) {
            showLargeViewHistoryId.value = null
          } else if (currentNavigationContext.value === 'board') {
            showDetailsClipId.value = null
          }
        } else {
          // In regular mode, right arrow opens large view
          if (
            currentNavigationContext.value === 'history' ||
            currentNavigationContext.value === null
          ) {
            showLargeViewHistoryId.value = keyboardSelectedItemId.value
          } else if (currentNavigationContext.value === 'board') {
            showDetailsClipId.value = keyboardSelectedClipId.value
          }
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['arrowleft'],
    e => {
      e.preventDefault()
      if (isSwapPanels) {
        // In swap mode, left arrow opens large view
        if (keyboardSelectedItemId.value || keyboardSelectedClipId.value) {
          if (
            currentNavigationContext.value === 'history' ||
            currentNavigationContext.value === null
          ) {
            showLargeViewHistoryId.value = keyboardSelectedItemId.value
          } else if (currentNavigationContext.value === 'board') {
            showDetailsClipId.value = keyboardSelectedClipId.value
          }
        }
      } else {
        // In regular mode, left arrow closes large view
        if (
          currentNavigationContext.value === 'history' ||
          currentNavigationContext.value === null
        ) {
          showLargeViewHistoryId.value = null
        } else if (currentNavigationContext.value === 'board') {
          showDetailsClipId.value = null
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['home'],
    e => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      if (
        currentNavigationContext.value === 'history' ||
        currentNavigationContext.value === null
      ) {
        // Navigate to first history item
        if (clipboardHistory.length > 0) {
          keyboardSelectedItemId.value = clipboardHistory[0].historyId
          scrollToTopHistoryList()
          if (showLargeViewHistoryId.value) {
            showLargeViewHistoryId.value = clipboardHistory[0].historyId
          }
        }
      } else if (currentNavigationContext.value === 'board') {
        // Navigate to first clip in first board with clips
        const boardsWithClips = clipItems
          .filter(item => item.isBoard && item.tabId === currentTab)
          .filter(board =>
            clipItems.some(
              clip =>
                clip.isClip && clip.parentId === board.itemId && clip.tabId === currentTab
            )
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        if (boardsWithClips.length > 0) {
          const firstBoard = boardsWithClips[0]
          const firstBoardClips = clipItems
            .filter(
              item =>
                item.isClip &&
                item.parentId === firstBoard.itemId &&
                item.tabId === currentTab
            )
            .sort((a, b) => a.orderNumber - b.orderNumber)

          if (firstBoardClips.length > 0) {
            keyboardSelectedBoardId.value = firstBoard.itemId
            keyboardSelectedClipId.value = firstBoardClips[0].itemId
            currentBoardIndex.value = 0
          }
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['pageup'],
    e => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      if (
        currentNavigationContext.value === 'history' ||
        currentNavigationContext.value === null
      ) {
        // Move up by 5 items in history
        const currentIndex = keyboardSelectedItemId.value
          ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
          : -1
        const newIndex = Math.max(0, currentIndex - 5)
        if (clipboardHistory[newIndex]) {
          keyboardSelectedItemId.value = clipboardHistory[newIndex].historyId
          if (showLargeViewHistoryId.value) {
            showLargeViewHistoryId.value = clipboardHistory[newIndex].historyId
          }
        }
      } else if (
        currentNavigationContext.value === 'board' &&
        keyboardSelectedBoardId.value
      ) {
        // Move up by 5 clips in current board
        const clipsOnBoard = clipItems
          .filter(
            item =>
              item.isClip &&
              item.parentId === keyboardSelectedBoardId.value &&
              item.tabId === currentTab
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        const currentIndex = clipsOnBoard.findIndex(
          clip => clip.itemId === keyboardSelectedClipId.value
        )
        const newIndex = Math.max(0, currentIndex - 5)
        if (clipsOnBoard[newIndex]) {
          keyboardSelectedClipId.value = clipsOnBoard[newIndex].itemId
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['pagedown'],
    e => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      if (
        currentNavigationContext.value === 'history' ||
        currentNavigationContext.value === null
      ) {
        // Move down by 5 items in history
        const currentIndex = keyboardSelectedItemId.value
          ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
          : -1
        const newIndex = Math.min(clipboardHistory.length - 1, currentIndex + 5)
        if (clipboardHistory[newIndex]) {
          keyboardSelectedItemId.value = clipboardHistory[newIndex].historyId
          if (showLargeViewHistoryId.value) {
            showLargeViewHistoryId.value = clipboardHistory[newIndex].historyId
          }
        }
      } else if (
        currentNavigationContext.value === 'board' &&
        keyboardSelectedBoardId.value
      ) {
        // Move down by 5 clips in current board
        const clipsOnBoard = clipItems
          .filter(
            item =>
              item.isClip &&
              item.parentId === keyboardSelectedBoardId.value &&
              item.tabId === currentTab
          )
          .sort((a, b) => a.orderNumber - b.orderNumber)

        const currentIndex = clipsOnBoard.findIndex(
          clip => clip.itemId === keyboardSelectedClipId.value
        )
        const newIndex = Math.min(clipsOnBoard.length - 1, currentIndex + 5)
        if (clipsOnBoard[newIndex]) {
          keyboardSelectedClipId.value = clipsOnBoard[newIndex].itemId
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  useHotkeys(
    ['alt+arrowdown'],
    e => {
      e.preventDefault()
      if (
        currentNavigationContext.value === 'history' ||
        currentNavigationContext.value === null
      ) {
        // Open context menu for selected history item
        if (keyboardSelectedItemId.value) {
          showKeyboardNavContextMenuHistoryId.value = keyboardSelectedItemId.value
        }
      } else if (currentNavigationContext.value === 'board') {
        // Open context menu for selected clip item
        if (keyboardSelectedClipId.value) {
          showKeyboardNavContextMenuClipId.value = keyboardSelectedClipId.value
        }
      }
    },
    {
      enabled: !shouldKeyboardNavigationBeDisabled.value,
      enableOnFormTags: false,
      preventDefault: true,
    }
  )

  function setKeyboardHistorySelectedItemId(itemId: UniqueIdentifier | null) {
    if (itemId) {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
        deleteTimeoutRef.current = null
      }

      if (itemId === keyboardSelectedItemId.value) {
        resetKeyboardNavigation()
        return
      }

      // Reset delete confirmation when navigating to a different item
      showHistoryDeleteConfirmationId.value = null

      // Reset keyboard delete confirmation when navigating
      resetKeyboardDeleteTimer()

      const currentItemIndex = historyIndexMap.get(itemId) ?? -1

      if (currentItemIndex === -1) {
        keyboardSelectedItemId.value = null
        return
      }

      currentNavigationContext.value = 'history'
      keyboardSelectedItemId.value = itemId
    } else {
      keyboardSelectedItemId.value = null
    }
  }

  // Store timeout reference to clear it if needed
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        resetKeyboardNavigation()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      // Clean up delete timeout on unmount
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
        deleteTimeoutRef.current = null
      }
    }
  }, [
    clipboardHistory,
    currentNavigationContext,
    keyboardSelectedItemId,
    keyboardSelectedBoardId,
    keyboardSelectedClipId,
    currentBoardIndex,
  ])

  useEffect(() => {
    if (
      currentNavigationContext.value === 'history' &&
      !keyboardSelectedItemId.value &&
      clipboardHistory.length > 0
    ) {
      keyboardSelectedItemId.value = clipboardHistory[0]?.historyId
    }
  }, [currentNavigationContext.value, keyboardSelectedItemId.value, clipboardHistory])

  useEffect(() => {
    if (keyboardSelectedItemId.value && listRef.current) {
      const selectedIndex = keyboardSelectedItemId.value
        ? historyIndexMap.get(keyboardSelectedItemId.value) ?? -1
        : -1
      if (selectedIndex !== -1) {
        // @ts-expect-error - scrollToItem is not in the types
        listRef.current.scrollToItem?.(selectedIndex, 'smart')
      }
    }
  }, [keyboardSelectedItemId.value, clipboardHistory])

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
    createMenuItemFromHistoryId.value = null
    showClipsMoveOnBoardId.value = null

    const loadComponents = async () => {
      await loadPrismComponents()
    }
    setReturnRoute(location.pathname)

    showOrganizeLayout.value = false

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
    if (pinnedClipboardHistory.length === 0) {
      isPinnedPanelHovering.value = false
      isPinnedPanelKeepOpen.value = false
    }
  }, [pinnedClipboardHistory])

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

  // Create sensors at the top level
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { tolerance: 10, delay: 300 },
  })

  // Always call useSensors with both sensors to maintain hook order
  const sensors = useSensors(pointerSensor)

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

  const inLargeViewItem = useMemo(() => {
    if (showLargeViewHistoryId.value) {
      const item = clipboardHistory.find(
        item => item.historyId === showLargeViewHistoryId.value
      )
      if (item) {
        if (showLargeViewClipId.value) {
          showLargeViewClipId.value = null
        }
        return item
      } else {
        showLargeViewHistoryId.value = null
      }
    }
  }, [showLargeViewHistoryId.value, clipboardHistory])

  const hasIsDeleting = (historyId: UniqueIdentifier) => {
    return (
      // Keyboard delete confirmation - only for the specific keyboard selected item
      (showConfirmationKeyboardDelete &&
        historyId === keyboardItemIdDelete &&
        historyId === keyboardSelectedItemId.value) ||
      // Mouse delete confirmation - only when keyboard delete is NOT active
      (showConfirmation &&
        !showConfirmationKeyboardDelete &&
        selectedHistoryItems.includes(historyId)) ||
      // Single item delete confirmation
      historyId === showHistoryDeleteConfirmationId.value ||
      // Hovering delete confirmation - only when keyboard delete is NOT active
      (showConfirmation &&
        !showConfirmationKeyboardDelete &&
        historyId === hoveringHistoryIdDelete) ||
      // Drag over trash
      historyId === dragOverTrashId ||
      (Boolean(dragOverTrashId) &&
        Boolean(activeDragId) &&
        selectedHistoryItems.includes(historyId)) ||
      // Menu deleting
      (isMenuDeleting && selectedHistoryItems.includes(historyId))
    )
  }

  const isMainWindow = window.isMainWindow
  const isHistoryWindow = window.isHistoryWindow

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
            const activeId = isPinnedItem ? getActiveIdFromPinned(active.id) : active.id

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
            const id = isPinnedItem ? getActiveIdFromPinned(active.id) : active.id
            createClipBoardItemId.value = dragOverBoardId
            createClipHistoryItemIds.value =
              selectedHistoryItems.length > 0
                ? Array.from(new Set([...selectedHistoryItems, id]))
                : [id]

            setTimeout(() => {
              setDragOverBoardId(null)
              setActiveDragId(null)
              setSelectedHistoryItems([])
            }, 400)
          } else if (active?.id && dragOverClipId) {
            const activeId = isPinnedItem ? getActiveIdFromPinned(active.id) : active.id
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
            createClipBoardItemId.value = null
            setTimeout(() => {
              setDragOverPinnedId(null)
              setDragOverBoardId(null)
              setDragOverTrashId(null)
              setActiveDragId(null)
            }, 300)
          }
        }}
      >
        <SplitView
          minSize={260}
          maxSize={700}
          showEndPanelOnly={
            (isSwapPanels && isSplitPanelView && isHistoryWindow) ||
            (!isSwapPanels && isSplitPanelView && isMainWindow) ||
            (!isHistoryPanelVisibleOnly && isSavedClipsPanelVisibleOnly)
          }
          showStartPanelOnly={
            (isSwapPanels && isSplitPanelView && isMainWindow) ||
            (!isSwapPanels && isSplitPanelView && isHistoryWindow) ||
            (isHistoryPanelVisibleOnly && !isSavedClipsPanelVisibleOnly)
          }
          defaultSize={getDefaultPanelWidth()}
          key={
            isSwapPanels
              ? isSplitPanelView
                ? 'swap'
                : 'swap-split'
              : isSplitPanelView
                ? 'no-swap'
                : 'no-swap-split'
          }
          swapPanes={isSwapPanels}
          onResize={setPanelSize}
          autoSaveId={isSplitPanelView ? 'app-main-panel-splited' : 'app-main-panel'}
        >
          <SplitPanePrimary
            isSplitPanelView={isSplitPanelView || isHistoryPanelVisibleOnly}
          >
            <Box
              className={`${
                isSplitPanelView || isHistoryPanelVisibleOnly || isSimplifiedLayout
                  ? 'h-[calc(100vh-40px)]'
                  : 'h-[calc(100vh-70px)] shadow-sm rounded-xl'
              } flex flex-col ${
                isSimplifiedLayout
                  ? 'bg-slate-200/90 dark:bg-slate-800'
                  : 'bg-slate-200/90 dark:bg-slate-800'
              } dark:border-gray-700 dark:shadow-gray-700/[.8] pb-6 pt-4 px-3 pr-3`}
            >
              <AutoSize disableWidth>
                {({ height }: { height: number }) =>
                  isPrismLoaded &&
                  height &&
                  height > 0 && (
                    <Box
                      className={`flex flex-col ${
                        isSimplifiedLayout
                          ? 'h-[calc(100vh-70px)]'
                          : 'h-[calc(100vh-95px)]'
                      } relative`}
                      id="side-panel_tour"
                    >
                      <Box
                        className="flex flex-row bg-gray-100 dark:bg-gray-700 rounded-md p-0 items-center h-[40px] mb-3"
                        id="history-find_tour"
                      >
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
                              } py-1 min-h-[28px] bg-orange-50 dark:bg-orange-800/40 mt-0 my-2 rounded-md relative w-full h-full`}
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
                              className="text-md ring-offset-0 bg-gray-100 dark:bg-gray-700 border-r-0 border-t-0 border-b-0"
                            />
                            <ClipboardHistoryListFilter
                              setHistoryFilters={setHistoryFilters}
                              historyFilters={historyFilters}
                              avaliableCodeLanguages={historyDetectLanguagesEnabledList}
                              codeFilters={codeFilters}
                              appFilters={appFilters}
                              setAppFilters={setAppFilters}
                              setCodeFilters={setCodeFilters}
                            >
                              <Button
                                variant="ghost"
                                className="relative cursor-pointer px-1 mr-2"
                              >
                                <ListFilter
                                  size={20}
                                  className={`${
                                    !historyFilters.length
                                      ? 'text-slate-400 hover:text-slate-400/70'
                                      : 'text-blue-500 hover:text-blue-500/70'
                                  } `}
                                />
                                {historyFilters.length > 0 && (
                                  <Badge className="absolute right-[-10px] top-[-10px] bg-blue-500 hover:bg-blue-500">
                                    {historyFilters.length}
                                  </Badge>
                                )}
                              </Button>
                            </ClipboardHistoryListFilter>
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
                            <Text className="text-xs text-center dark:text-gray-800 bg-gray-300 dark:bg-gray-500 rounded-full px-3 cursor-pointer pointer-events-auto">
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
                                    theme: isDark ? 'os-theme-light' : 'os-theme-dark',
                                    autoHide: 'move',
                                  },
                                }}
                              >
                                <Box
                                  className={`flex flex-col gap-1 relative ${
                                    activeDragId && !isDragPinnedHistory
                                      ? 'opacity-20'
                                      : ''
                                  }`}
                                >
                                  {isShowHistoryPinned &&
                                    pinnedClipboardHistory
                                      .sort(
                                        (a, b) =>
                                          a.pinnedOrderNumber - b.pinnedOrderNumber
                                      )
                                      .map((item, index) => {
                                        const historyId = item.historyId
                                        return (
                                          <Box key={historyId}>
                                            <ClipboardHistoryRow
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
                                                index ===
                                                pinnedClipboardHistory.length - 1
                                              }
                                              onMovePinnedUpDown={move => {
                                                movePinnedClipboardHistoryUpDown(move)
                                              }}
                                              isLinkCardPreviewEnabled={
                                                isAutoPreviewLinkCardsEnabled
                                              }
                                              isAutoGenerateLinkCardsEnabled={
                                                isAutoGenerateLinkCardsEnabled
                                              }
                                              isLargeView={
                                                historyId === showLargeViewHistoryId.value
                                              }
                                              largeViewItemId={
                                                showLargeViewHistoryId.value
                                              }
                                              setLargeViewItemId={historyId => {
                                                showLargeViewHistoryId.value = historyId
                                              }}
                                              setSelectHistoryItem={setSelectHistoryItem}
                                              selectedHistoryItems={selectedHistoryItems}
                                              setSelectedHistoryItems={
                                                setSelectedHistoryItems
                                              }
                                              onCopy={setCopiedItem}
                                              onCopyPaste={setPastedItem}
                                              pastingCountDown={
                                                historyId === pastedItemValue
                                                  ? pastingCountDown
                                                  : historyId === specialPastedItemValue
                                                    ? specialPastingCountDown
                                                    : undefined
                                              }
                                              isPasted={
                                                historyId === pastedItemValue ||
                                                historyId === specialPastedItemValue
                                              }
                                              isCopied={
                                                historyId === copiedItemValue ||
                                                historyId === specialCopiedItemValue
                                              }
                                              isSaved={historyId === savingItem}
                                              setSavingItem={setSavingItem}
                                              isDeleting={hasIsDeleting(historyId)}
                                              isSelected={selectedHistoryItems.includes(
                                                historyId
                                              )}
                                              setBrokenImageItem={setBrokenImageItem}
                                              isBrokenImage={brokenImageItems.includes(
                                                historyId
                                              )}
                                              showTimeAgo={false}
                                              isExpanded={expandedItems.includes(
                                                historyId
                                              )}
                                              isWrapText={wrappedTextItems.includes(
                                                historyId
                                              )}
                                              searchTerm={
                                                hasSearchOrFilter
                                                  ? debouncedSearchTerm
                                                  : ''
                                              }
                                              showSelectHistoryItems={
                                                showSelectHistoryItems
                                              }
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
                                                isSingleClickToCopyPaste
                                              }
                                              historyPreviewLineLimit={
                                                historyPreviewLineLimit
                                              }
                                            />
                                          </Box>
                                        )
                                      })}
                                </Box>
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
                                            runSequencePaste(
                                              pinnedClipboardHistory.map(
                                                ({ historyId }) => historyId
                                              )
                                            )
                                          }}
                                        />
                                      ) : (
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
                                              checked={
                                                copyPasteSequencePinnedDelay === 10
                                              }
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
                                                  item =>
                                                    !selectedPinnedItems.includes(item)
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

                      {clipboardHistory.length > 0 || hasSearchOrFilter ? (
                        <SimpleBar
                          style={{
                            height:
                              height -
                              (hasSearchOrFilter
                                ? 115
                                : pinnedClipboardHistory.length === 0
                                  ? 85
                                  : pinnedPanelHeight
                                    ? pinnedPanelHeight + 103
                                    : 85),
                          }}
                          ref={ref => {
                            scrollBarRef.current = ref
                          }}
                          onScroll={(_e: Event, isScroll) => {
                            setIsScrolling(isScroll)
                          }}
                          className={`animate-in fade-in mr-[-10px] ${
                            hasSearchOrFilter ? 'mt-[20px]' : ''
                          }`}
                        >
                          {({ scrollableNodeRef, contentNodeRef }) => {
                            return (
                              <div
                                className="pr-[10px] relative h-full"
                                id="history-list_tour"
                              >
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
                                          resetKeyboardNavigation()
                                        }}
                                      >
                                        <Text className="text-mute text-xs text-center px-3">
                                          {currentTopItemTimeAgo}
                                        </Text>
                                      </ButtonGhost>
                                    </ToolTip>
                                  </Box>
                                )}

                                {newClipboardHistoryCount > 0 && !hasSearchOrFilter && (
                                  <Box className="absolute top-2 z-100 ml-[-5px] cursor-pointer animate-in fade-in fade-out duration-300 flex justify-center w-full pointer-events-none">
                                    <ToolTip
                                      text={t('Update history list', { ns: 'common' })}
                                      isDisabled={Boolean(activeDragId)}
                                      className="animate-in fade-in fade-out duration-300"
                                      isCompact
                                      delayDuration={2000}
                                      side="top"
                                      asChild
                                      sideOffset={3}
                                    >
                                      <ButtonGhost
                                        className="pointer-events-auto"
                                        onClick={() => {
                                          updateClipboardHistory()
                                        }}
                                      >
                                        <Text className="text-xs text-center dark:text-slate-800 bg-blue-200 dark:bg-blue-400 rounded-full px-3 cursor-pointer pointer-events-auto">
                                          + {newClipboardHistoryCount}{' '}
                                          {t('new clips', { ns: 'dashboard' })}
                                        </Text>
                                      </ButtonGhost>
                                    </ToolTip>
                                  </Box>
                                )}

                                {!isHistoryEnabled && !hasSearchOrFilter && (
                                  <Box className="absolute bottom-2 z-100 ml-[-5px] animate-in fade-in fade-out duration-300 flex flex-col justify-center items-center w-full pointer-events-none">
                                    <ToolTip
                                      text={t('Turn on history capture', {
                                        ns: 'dashboard',
                                      })}
                                      isDisabled={Boolean(activeDragId)}
                                      className="animate-in fade-in fade-out duration-300"
                                      isCompact
                                      delayDuration={2000}
                                      side="top"
                                      asChild
                                      sideOffset={6}
                                    >
                                      <ButtonGhost
                                        className="pointer-events-auto"
                                        onClick={() => {
                                          setIsHistoryEnabled(true)
                                        }}
                                      >
                                        <Text className="text-xs text-center bg-yellow-200 dark:bg-yellow-800 rounded-full px-3 cursor-pointer pointer-events-auto">
                                          {t('History capture is off', {
                                            ns: 'dashboard',
                                          })}
                                        </Text>
                                      </ButtonGhost>
                                    </ToolTip>
                                    {clipboardHistory.length > 0 && (
                                      <Text className="text-xs text-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 mt-2">
                                        {t('Last update', { ns: 'dashboard' })}:{' '}
                                        {clipboardHistory[0].timeAgo}
                                      </Text>
                                    )}
                                  </Box>
                                )}

                                {isHistoryEnabled &&
                                  !hasSearchOrFilter &&
                                  !isHistoryAutoUpdateOnCaputureEnabled && (
                                    <Box className="absolute bottom-2 z-100 ml-[-5px] animate-in fade-in fade-out duration-300 flex flex-col justify-center items-center w-full pointer-events-none">
                                      <ToolTip
                                        text={t('Turn On auto update', {
                                          ns: 'dashboard',
                                        })}
                                        isDisabled={Boolean(activeDragId)}
                                        className="animate-in fade-in fade-out duration-300"
                                        isCompact
                                        delayDuration={2000}
                                        side="top"
                                        asChild
                                        sideOffset={10}
                                      >
                                        <ButtonGhost
                                          className="pointer-events-auto"
                                          onClick={() => {
                                            setIsHistoryAutoUpdateOnCaputureEnabled(true)
                                          }}
                                        >
                                          <Text className="text-xs text-center bg-yellow-200 dark:bg-yellow-800 rounded-full px-3 cursor-pointer pointer-events-auto">
                                            {t('Auto update is Off', { ns: 'dashboard' })}
                                          </Text>
                                        </ButtonGhost>
                                      </ToolTip>
                                    </Box>
                                  )}

                                <InfiniteLoader
                                  isItemLoaded={index =>
                                    index < clipboardHistory.length &&
                                    !!clipboardHistory[index]
                                  }
                                  threshold={10}
                                  itemCount={clipboardHistory.length + 1}
                                  loadMoreItems={loadMoreClipBoardHistory}
                                >
                                  {({ onItemsRendered, ref }) => {
                                    return (
                                      <VariableSizeList
                                        overscanCount={10}
                                        height={height - (hasSearchOrFilter ? 60 : 85)}
                                        itemCount={clipboardHistory.length}
                                        width="100%"
                                        itemSize={getRowHeight}
                                        itemKey={index =>
                                          clipboardHistory[index].historyId ??
                                          'id-${index}'
                                        }
                                        onItemsRendered={e => {
                                          if (e.visibleStartIndex > 10) {
                                            const currentTopItem =
                                              clipboardHistory[e.visibleStartIndex]
                                            if (currentTopItem?.timeAgo) {
                                              if (
                                                currentTopItemTimeAgo !==
                                                currentTopItem.timeAgo
                                              ) {
                                                setCurrentTopItemTimeAgo(
                                                  currentTopItem.timeAgo
                                                )
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
                                        outerRef={mergeRefs(
                                          historyListSimpleBarRef,
                                          scrollableNodeRef
                                        )}
                                        innerRef={contentNodeRef}
                                      >
                                        {({ index, style }) => {
                                          const clipboard = clipboardHistory[index]
                                          const { historyId, showTimeAgo, timeAgo } =
                                            clipboard

                                          return (
                                            <ClipboardHistoryRow
                                              isScrolling={isScrolling}
                                              isLargeView={
                                                historyId === showLargeViewHistoryId.value
                                              }
                                              isWindows={isWindows}
                                              isAutoGenerateLinkCardsEnabled={
                                                isAutoGenerateLinkCardsEnabled
                                              }
                                              largeViewItemId={
                                                showLargeViewHistoryId.value
                                              }
                                              isLinkCardPreviewEnabled={
                                                isAutoPreviewLinkCardsEnabled
                                              }
                                              setLargeViewItemId={historyId => {
                                                showLargeViewHistoryId.value = historyId
                                              }}
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
                                              setSelectHistoryItem={setSelectHistoryItem}
                                              selectedHistoryItems={selectedHistoryItems}
                                              setSelectedHistoryItems={
                                                setSelectedHistoryItems
                                              }
                                              onCopy={setCopiedItem}
                                              onCopyPaste={setPastedItem}
                                              pastingCountDown={
                                                historyId === pastedItemValue
                                                  ? pastingCountDown
                                                  : historyId === specialPastedItemValue
                                                    ? specialPastingCountDown
                                                    : undefined
                                              }
                                              isPasted={
                                                historyId === pastedItemValue ||
                                                historyId === specialPastedItemValue
                                              }
                                              isKeyboardSelected={
                                                (currentNavigationContext.value ===
                                                  'history' ||
                                                  currentNavigationContext.value ===
                                                    null) &&
                                                historyId === keyboardSelectedItemId.value
                                              }
                                              isCopied={
                                                historyId === copiedItemValue ||
                                                historyId === specialCopiedItemValue
                                              }
                                              isSaved={historyId === savingItem}
                                              setSavingItem={setSavingItem}
                                              key={historyId}
                                              isDeleting={hasIsDeleting(historyId)}
                                              isOverPinned={
                                                historyId === dragOverPinnedId ||
                                                (Boolean(dragOverPinnedId) &&
                                                  Boolean(activeDragId) &&
                                                  selectedHistoryItems.includes(
                                                    historyId
                                                  ))
                                              }
                                              isSelected={selectedHistoryItems.includes(
                                                historyId
                                              )}
                                              setBrokenImageItem={setBrokenImageItem}
                                              isBrokenImage={brokenImageItems.includes(
                                                historyId
                                              )}
                                              showTimeAgo={showTimeAgo}
                                              timeAgo={timeAgo}
                                              isExpanded={expandedItems.includes(
                                                historyId
                                              )}
                                              isWrapText={wrappedTextItems.includes(
                                                historyId
                                              )}
                                              searchTerm={
                                                hasSearchOrFilter
                                                  ? debouncedSearchTerm
                                                  : ''
                                              }
                                              showSelectHistoryItems={
                                                showSelectHistoryItems
                                              }
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
                                                isSingleClickToCopyPaste
                                              }
                                              historyPreviewLineLimit={
                                                historyPreviewLineLimit
                                              }
                                              index={index}
                                              setKeyboardHistorySelectedItemId={
                                                setKeyboardHistorySelectedItemId
                                              }
                                              style={style}
                                            />
                                          )
                                        }}
                                      </VariableSizeList>
                                    )
                                  }}
                                </InfiniteLoader>
                              </div>
                            )
                          }}
                        </SimpleBar>
                      ) : (
                        !isClipboardInfiniteHistoryLoading &&
                        infiniteClipboardHistory?.pages?.flat().length === 0 && (
                          <Flex
                            style={{ height: height - 85 }}
                            className="flex items-center flex-col gap-3 justify-center"
                          >
                            <Text className="animate-in fade-in duration-600 text-slate-300 text-xs bg-slate-100 rounded-full px-3 dark:text-slate-600 dark:bg-slate-900">
                              {t('No Clipboard History', { ns: 'dashboard' })}
                            </Text>
                          </Flex>
                        )
                      )}
                      <Portal>
                        <DragOverlay dropAnimation={dropAnimationConfig}>
                          {activeDragId ? (
                            <ClipboardHistoryRow
                              index={1}
                              isWindows={isWindows}
                              isAutoGenerateLinkCardsEnabled={false}
                              isWrapText={wrappedTextItems.includes(activeDragId)}
                              isExpanded={expandedItems.includes(activeDragId)}
                              style={{ zIndex: 999 }}
                              showSelectHistoryItems={showSelectHistoryItems}
                              setSelectHistoryItem={setSelectHistoryItem}
                              isDark={isDark}
                              isBrokenImage={brokenImageItems.includes(activeDragId)}
                              setBrokenImageItem={setBrokenImageItem}
                              isDragPreview
                              isDeleting={
                                activeDragId === dragOverTrashId ||
                                (Boolean(dragOverTrashId) &&
                                  selectedHistoryItems.includes(activeDragId))
                              }
                              selectedItemsCount={
                                selectedHistoryItems.length &&
                                selectedHistoryItems.includes(activeDragId)
                                  ? selectedHistoryItems.length
                                  : selectedHistoryItems.length + 1
                              }
                              clipboard={clipboardHistory.find(clip => {
                                return !isDragPinnedHistory
                                  ? clip.historyId === activeDragId
                                  : clip.historyId ===
                                      activeDragId.toString().split('::pinned')[0]
                              })}
                              isSingleClickToCopyPaste={isSingleClickToCopyPaste}
                              historyPreviewLineLimit={historyPreviewLineLimit}
                            />
                          ) : null}
                        </DragOverlay>
                      </Portal>

                      {isMainWindow && (
                        <Tabs
                          className="min-w-full flex flex-row justify-center h-10 items-center gap-2 mt-2"
                          value={location.pathname}
                          onValueChange={pathname => {
                            navigate(pathname, { replace: true })
                          }}
                        >
                          {!activeDragId && (
                            <ClipboardHistoryIconMenu
                              isDeleting={isMenuDeleting}
                              isDark={isDark}
                              setIsDeleting={setIsMenuDeleting}
                              setSelectHistoryItem={setSelectHistoryItem}
                              onDelete={(clearSearchAndFilter = false) => {
                                if (clearSearchAndFilter) {
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
                                }
                                doRefetchFindClipboardHistory()
                              }}
                              showSelectHistoryItems={showSelectHistoryItems}
                              setSelectedHistoryItems={setSelectedHistoryItems}
                              setShowSelectHistoryItems={setShowSelectHistoryItems}
                              selectedHistoryItems={selectedHistoryItems}
                            />
                          )}
                          <TabsList
                            className="self-center bg-transparent"
                            id="tabs-history_tour"
                          >
                            {!activeDragId ? (
                              <>
                                <TabsTrigger
                                  value="/history"
                                  className="min-w-[90px] data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-600"
                                >
                                  {panelSize < getDefaultPanelWidth()
                                    ? t('History', { ns: 'common' })
                                    : t('Clipboard History', { ns: 'common' })}
                                </TabsTrigger>
                                <TabsTrigger
                                  value="/menu"
                                  className="min-w-[90px] data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-600"
                                >
                                  {panelSize < getDefaultPanelWidth()
                                    ? t('Menu', { ns: 'common' })
                                    : t('Paste Menu', { ns: 'common' })}
                                </TabsTrigger>
                              </>
                            ) : (
                              <TabsTrigger value="" className="p-0.5">
                                <TrashHistory id={TRASH_ID} />
                              </TabsTrigger>
                            )}
                          </TabsList>
                        </Tabs>
                      )}
                      {isHistoryWindow && (
                        <Box className="flex-1 mt-1">
                          <Flex className="justify-center items-center">
                            {!activeDragId ? (
                              <Box className={isWindows ? 'mt-0' : 'mt-1'}>
                                <ClipboardHistoryWindowIcons
                                  isDeleting={isMenuDeleting}
                                  isDark={isDark}
                                  setIsDeleting={setIsMenuDeleting}
                                  setSelectHistoryItem={setSelectHistoryItem}
                                  onDelete={(clearSearchAndFilter = false) => {
                                    if (clearSearchAndFilter) {
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
                                    }
                                    doRefetchFindClipboardHistory()
                                  }}
                                  showSelectHistoryItems={showSelectHistoryItems}
                                  setSelectedHistoryItems={setSelectedHistoryItems}
                                  setShowSelectHistoryItems={setShowSelectHistoryItems}
                                  selectedHistoryItems={selectedHistoryItems}
                                />
                              </Box>
                            ) : (
                              <TrashHistory id={TRASH_ID} />
                            )}
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  )
                }
              </AutoSize>
            </Box>
          </SplitPanePrimary>
          <SplitPaneSecondary>
            {!showLargeViewHistoryId.value && !showLargeViewClipId.value ? (
              <Box
                className={`${
                  isSplitPanelView || isSimplifiedLayout
                    ? 'h-[calc(100vh-40px)]'
                    : 'h-[calc(100vh-70px)] shadow-sm rounded-xl border'
                } flex flex-col ${
                  !isSimplifiedLayout
                    ? 'bg-gray-50 border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 dark:shadow-gray-700/[.7]'
                    : ''
                }`}
              >
                <AutoSize disableWidth>
                  {({ height }: { height: number }) => {
                    return (
                      height &&
                      height > 0 && (
                        <Box
                          className={`${
                            isSplitPanelView ? 'pl-1 pr-0' : 'p-2'
                          } pt-0 py-4 pr-0 pb-0 m-0 select-none ${
                            isSimplifiedLayout ? 'pl-0 pr-0' : ''
                          }`}
                        >
                          <SimpleBar
                            className="simplebar-dashboard"
                            style={{
                              height:
                                isSplitPanelView || isSimplifiedLayout
                                  ? height - 5
                                  : height - 10,
                            }}
                            onScroll={(_e: Event, isScroll) => {
                              setIsScrolling(isScroll)
                            }}
                          >
                            <Flex
                              style={{
                                height:
                                  isSplitPanelView || isSimplifiedLayout
                                    ? height - 5
                                    : height - 10,
                              }}
                              className="flex items-start flex-col justify-start p-0"
                            >
                              <Dashboard
                                historyDragActive={Boolean(activeDragId)}
                                isDark={isDark}
                                dragOverBoardId={dragOverBoardId}
                              />
                            </Flex>
                          </SimpleBar>
                        </Box>
                      )
                    )
                  }}
                </AutoSize>
              </Box>
            ) : (
              <Box
                className={`${
                  isSplitPanelView || isSimplifiedLayout
                    ? 'h-[calc(100vh-40px)]'
                    : 'h-[calc(100vh-70px)] shadow-sm rounded-xl border'
                } flex flex-col ${
                  isSimplifiedLayout
                    ? 'bg-gray-50 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-700/[.7]'
                    : 'bg-red-50'
                }`}
              >
                <AutoSize disableWidth>
                  {({ height }: { height: number }) => {
                    return (
                      height &&
                      height > 0 && (
                        <Box className="p-4 py-3 select-auto relative pt-5 mt-3">
                          <Button
                            variant="ghost"
                            className="z-10 px-2 absolute top-[-2px] right-[10px] text-slate-400 cursor-pointer hover:bg-slate-100 dark:text-slate-500 hover:dark:bg-slate-700"
                            onClick={() => {
                              showLargeViewClipId.value = null
                              showLargeViewHistoryId.value = null
                            }}
                          >
                            <X size={22} />
                          </Button>

                          <SimpleBar
                            style={{ height: height - 40 }}
                            autoHide={false}
                            className="simplebar-large-view"
                            onScroll={(_e: Event, isScroll) => {
                              setIsScrolling(isScroll)
                            }}
                          >
                            <Flex style={{ height: height - 85 }}>
                              {showLargeViewClipId.value && (
                                <ClipCardLargeView
                                  clipId={showLargeViewClipId.value}
                                  isHistoryDragActive={Boolean(activeDragId)}
                                  isDark={isDark}
                                />
                              )}
                              {inLargeViewItem && (
                                <ClipboardHistoryLargeView
                                  setLargeViewItemId={historyId => {
                                    showLargeViewHistoryId.value = historyId
                                  }}
                                  setSelectHistoryItem={setSelectHistoryItem}
                                  onCopy={setCopiedItem}
                                  onCopyPaste={setPastedItem}
                                  pastingCountDown={
                                    inLargeViewItem.historyId === pastedItemValue
                                      ? pastingCountDown
                                      : inLargeViewItem.historyId ===
                                          specialPastedItemValue
                                        ? specialPastingCountDown
                                        : null
                                  }
                                  isPasted={
                                    inLargeViewItem.historyId === pastedItemValue ||
                                    inLargeViewItem.historyId === specialPastedItemValue
                                  }
                                  isCopied={
                                    inLargeViewItem.historyId === copiedItemValue ||
                                    inLargeViewItem.historyId === specialCopiedItemValue
                                  }
                                  isSaved={inLargeViewItem.historyId === savingItem}
                                  isMp3={
                                    inLargeViewItem.isLink &&
                                    inLargeViewItem.value?.endsWith('.mp3')
                                  }
                                  setSavingItem={setSavingItem}
                                  isDeleting={
                                    inLargeViewItem.historyId === dragOverTrashId ||
                                    (Boolean(dragOverTrashId) &&
                                      Boolean(activeDragId) &&
                                      selectedHistoryItems.includes(
                                        inLargeViewItem.historyId
                                      )) ||
                                    (isMenuDeleting &&
                                      selectedHistoryItems.includes(
                                        inLargeViewItem.historyId
                                      ))
                                  }
                                  isSelected={selectedHistoryItems.includes(
                                    inLargeViewItem.historyId
                                  )}
                                  setBrokenImageItem={setBrokenImageItem}
                                  isBrokenImage={brokenImageItems.includes(
                                    inLargeViewItem.historyId
                                  )}
                                  showTimeAgo={inLargeViewItem.showTimeAgo}
                                  timeAgo={inLargeViewItem.timeAgo}
                                  searchTerm={
                                    hasSearchOrFilter ? debouncedSearchTerm : ''
                                  }
                                  invalidateClipboardHistoryQuery={() => {
                                    invalidateClipboardHistoryQuery()
                                    doRefetchFindClipboardHistory()
                                  }}
                                  setExpanded={setExpanded}
                                  isDark={isDark}
                                  clipboard={inLargeViewItem}
                                  removeLinkMetaData={removeLinkMetaData}
                                  generateLinkMetaData={generateLinkMetaData}
                                />
                              )}
                            </Flex>
                          </SimpleBar>
                        </Box>
                      )
                    )
                  }}
                </AutoSize>
              </Box>
            )}
          </SplitPaneSecondary>
        </SplitView>
      </DndContext>
    </MainContainer>
  )
}
