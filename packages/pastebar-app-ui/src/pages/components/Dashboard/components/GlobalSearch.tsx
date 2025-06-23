import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useSignal } from '@preact/signals-react'
import { Portal } from '@radix-ui/react-portal'
import createFilteredFlatBoardTree from '~/libs/create-filtered-flat-board-tree'
import createMenuTree from '~/libs/create-menu-tree'
import {
  collectionsStoreAtom,
  isNavBarHovering,
  recentSearchTerm,
  resetKeyboardNavigation,
  settingsStoreAtom,
  uiStoreAtom,
} from '~/store'
import clsx from 'clsx'
import { useAtomValue } from 'jotai/react'
import { Search, Settings } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import mergeRefs from '~/components/atoms/merge-refs'
import SimpleBar from '~/components/libs/simplebar-react'
import {
  Accordion,
  AccordionItem,
  Badge,
  Box,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '~/components/ui'

import {
  useFetchCollectionWithClips,
  useFetchCollectionWithMenuItems,
} from '~/hooks/queries/use-collections'
import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'
import { useDebounce } from '~/hooks/use-debounce'

import { Item } from '~/types/menu'

import MenuCollapsibleItem from '../../Menu/MenuItem'
import { Board, BoardComponentMemorized } from './Board'

const FILTER = {
  CLIPS: 'clips',
  BOARDS: 'boards',
  MENUS: 'menus',
} as const

// Utility function for selection styles
const getSelectionStyles = (isSelected: boolean) =>
  clsx(
    'rounded-md transition-colors',
    isSelected &&
      'bg-blue-100 dark:bg-blue-900/30 ring-2 outline-none scale-[.98] ring-blue-400 dark:!ring-blue-600 ring-offset-1 ring-offset-white dark:ring-offset-gray-800'
  )

export function GlobalSearch({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<string>(FILTER.CLIPS)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const searchHistoryInputRef = useRef<HTMLElement>()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const deletingMenuItemIds = useSignal<string[] | null>(null)
  const showEditMenuItemId = useSignal<string | null>(null)
  const showMultiSelectItems = useSignal(false)
  const isCreatingMenuItem = useSignal(false)
  const { isWindows } = useAtomValue(uiStoreAtom)

  const {
    setIsAutoCloseOnCopyPaste,
    isAutoCloseOnCopyPaste,
    setIsSearchNameOrLabelOnly,
    isSearchNameOrLabelOnly,
  } = useAtomValue(settingsStoreAtom)

  const [copiedItem, handleCopyClipItem] = useCopyClipItem({})
  const [pastedItem] = usePasteClipItem({})

  const { clipItems, tabs, setCurrentTab } = useAtomValue(collectionsStoreAtom)
  const { collectionWithClips, fetchCollectionWithClips } = useFetchCollectionWithClips()
  const { collectionWithMenuItems, fetchCollectionWithMenuItems } =
    useFetchCollectionWithMenuItems()

  const navigate = useNavigate()
  const { menuItems } = useAtomValue(collectionsStoreAtom)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const [showSearchModal, setShowSearchModal] = useState(false)

  // Reset all keyboard navigation when search opens

  const toggleSearch = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    setShowSearchModal(show => {
      const newShow = !show
      resetKeyboardNavigation()
      return newShow
    })
    searchHistoryInputRef.current?.focus()
  }

  const hasSearch = useMemo(() => {
    return debouncedSearchTerm.length > 1
  }, [debouncedSearchTerm])

  const menuItemsFiltered = useMemo(() => {
    if (debouncedSearchTerm.length <= 1 || !showSearchModal) {
      return {
        results: [],
        count: 0,
      }
    }

    const menus = menuItems.length > 0 ? menuItems : collectionWithMenuItems?.items || []
    const data = menus.length > 0 ? createMenuTree(menus, null, false) : []

    // Pre-compute lowercase search term
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase()

    const hasMatchingDescendant = (item: Item) => {
      if (item.name.toLowerCase().includes(lowerSearchTerm)) {
        return true
      }
      if (
        item.value?.toLowerCase().includes(lowerSearchTerm) &&
        !isSearchNameOrLabelOnly
      ) {
        return true
      }
      return item.children?.some(hasMatchingDescendant) ?? false
    }

    const flattenTree = (tree: Item[], depth = 0): Item[] => {
      let flatList: Item[] = []

      tree.forEach(item => {
        const isMatchOrHasMatchingDescendant = hasMatchingDescendant(item)

        const menuItemFound = menus.find(menuItem => menuItem.itemId === item.id)

        if (menuItemFound && isMatchOrHasMatchingDescendant) {
          const newItem = { ...menuItemFound, indent: depth, id: item.id }
          flatList.push(newItem)

          if (item.children && item.children?.length > 0) {
            const childrenFlatList = flattenTree(item.children, depth + 1)
            flatList = flatList.concat(childrenFlatList)
          }
        }
      })

      return flatList
    }

    const results = flattenTree(data as Item[])

    return {
      results,
      count: results.length,
    }
  }, [
    menuItems,
    debouncedSearchTerm,
    showSearchModal,
    collectionWithMenuItems?.items,
    isSearchNameOrLabelOnly,
  ])

  const clipItemsFiltered = useMemo(() => {
    if (debouncedSearchTerm.length <= 1 || !showSearchModal) {
      return {
        results: [],
        count: 0,
      }
    }

    const clips = clipItems.length > 0 ? clipItems : collectionWithClips?.clips || []

    return createFilteredFlatBoardTree(
      clips,
      debouncedSearchTerm,
      tabs,
      isSearchNameOrLabelOnly
    ) as {
      results: Board[]
      count: number
    }
  }, [
    clipItems,
    debouncedSearchTerm,
    showSearchModal,
    collectionWithClips,
    isSearchNameOrLabelOnly,
  ])

  const boardsFiltered = useMemo(() => {
    if (debouncedSearchTerm.length <= 1 || !showSearchModal) {
      return {
        results: [],
        count: 0,
      }
    }

    const clips = clipItems.length > 0 ? clipItems : collectionWithClips?.clips || []

    return createFilteredFlatBoardTree(
      clips,
      debouncedSearchTerm,
      tabs,
      isSearchNameOrLabelOnly,
      true
    )
  }, [
    clipItems,
    debouncedSearchTerm,
    showSearchModal,
    collectionWithClips,
    isSearchNameOrLabelOnly,
  ])

  const closeGlobalSearchNavigateHistory = () => {
    navigate('/history', { replace: true })
    setShowSearchModal(false)
  }

  const closeGlobalSearchNavigateMenu = () => {
    navigate('/menu', { replace: true })
    setShowSearchModal(false)
  }

  // Create flattened item lists for navigation
  const flattenedItems = useMemo(() => {
    const clips: Array<{
      id: UniqueIdentifier
      type: 'clip'
      data: any
      boardIndex: number
    }> = []
    const boards: Array<{ id: UniqueIdentifier; type: 'board'; data: any }> = []
    const menus: Array<{ id: UniqueIdentifier; type: 'menu'; data: any }> = []

    // Flatten clips from all boards
    clipItemsFiltered.results.forEach((board, boardIndex) => {
      board.children?.forEach(clip => {
        clips.push({
          id: clip.id,
          type: 'clip',
          data: clip,
          boardIndex,
        })
      })
    })

    // Flatten boards
    boardsFiltered.results.forEach(board => {
      boards.push({
        id: board.id,
        type: 'board',
        data: board,
      })
    })

    // Flatten menus
    menuItemsFiltered.results.forEach(menu => {
      menus.push({
        id: menu.itemId,
        type: 'menu',
        data: menu,
      })
    })

    return { clips, boards, menus }
  }, [clipItemsFiltered.results, boardsFiltered.results, menuItemsFiltered.results])

  // Get current items array and total count
  const getCurrentItems = () => {
    if (filter === FILTER.CLIPS) return flattenedItems.clips
    if (filter === FILTER.BOARDS) return flattenedItems.boards
    if (filter === FILTER.MENUS) return flattenedItems.menus
    return []
  }

  const getTotalItemsCount = () => {
    return getCurrentItems().length
  }

  // Get available tabs with items
  const getAvailableTabs = () => {
    const tabs = []
    if (flattenedItems.clips.length > 0) tabs.push(FILTER.CLIPS)
    if (flattenedItems.boards.length > 0) tabs.push(FILTER.BOARDS)
    if (flattenedItems.menus.length > 0) tabs.push(FILTER.MENUS)
    return tabs
  }

  // Handle copying selected item
  const handleCopySelectedItem = useCallback(async () => {
    const currentItems = getCurrentItems()
    if (
      currentItems.length === 0 ||
      selectedIndex < 0 ||
      selectedIndex >= currentItems.length
    )
      return

    const selectedItem = currentItems[selectedIndex]

    if (selectedItem.type === 'clip') {
      handleCopyClipItem(selectedItem.id)
      setTimeout(() => {
        setShowSearchModal(false)
      }, 1000)
    } else if (selectedItem.type === 'board') {
      // For boards, navigate to the board
      const boardData = selectedItem.data
      if (boardData && boardData.tabId) {
        setCurrentTab(boardData.tabId)
        closeGlobalSearchNavigateHistory()
      }
    } else if (selectedItem.type === 'menu') {
      // For menus, copy the menu item value
      const menuData = selectedItem.data
      if (menuData?.value) {
        handleCopyClipItem(selectedItem.id)
        setTimeout(() => {
          setShowSearchModal(false)
        }, 1000)
      }
    }
  }, [
    selectedIndex,
    getCurrentItems,
    handleCopyClipItem,
    setCurrentTab,
    closeGlobalSearchNavigateHistory,
  ])

  useEffect(() => {
    if (!showSearchModal) {
      recentSearchTerm.value = searchTerm
      setSearchTerm('')
    }
  }, [showSearchModal])

  useEffect(() => {
    if (hasSearch && clipItems.length === 0) {
      fetchCollectionWithClips()
    }
    if (hasSearch && menuItems.length === 0) {
      fetchCollectionWithMenuItems()
    }
  }, [hasSearch, fetchCollectionWithClips, fetchCollectionWithMenuItems])

  useHotkeys(['meta+k', 'ctrl+k', 'alt+k'], toggleSearch, {}, [])
  useHotkeys('/', toggleSearch, {}, [])

  // Extract keyboard handler with minimal dependencies
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentItems = getCurrentItems()
      const totalItems = currentItems.length
      const availableTabs = getAvailableTabs()

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        if (totalItems > 0) {
          setSelectedIndex(prev => (prev === -1 ? 0 : (prev + 1) % totalItems))
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        if (totalItems > 0) {
          setSelectedIndex(prev =>
            prev === -1 ? totalItems - 1 : (prev - 1 + totalItems) % totalItems
          )
        }
      } else if (e.key === 'Tab' && !e.shiftKey) {
        if (availableTabs.length > 1) {
          e.preventDefault()
          e.stopPropagation()
          const currentTabIndex = availableTabs.indexOf(filter)
          const nextTabIndex = (currentTabIndex + 1) % availableTabs.length
          setFilter(availableTabs[nextTabIndex])
          setSelectedIndex(-1)
        }
      } else if (e.key === 'Tab' && e.shiftKey) {
        if (availableTabs.length > 1) {
          e.preventDefault()
          e.stopPropagation()
          const currentTabIndex = availableTabs.indexOf(filter)
          const prevTabIndex =
            (currentTabIndex - 1 + availableTabs.length) % availableTabs.length
          setFilter(availableTabs[prevTabIndex])
          setSelectedIndex(-1)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        if (selectedIndex >= 0) {
          handleCopySelectedItem()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setShowSearchModal(false)
      } else if (e.key === 'PageUp') {
        e.preventDefault()
        e.stopPropagation()
      } else if (e.key === 'PageDown') {
        e.preventDefault()
        e.stopPropagation()
      } else if (e.key === 'Home') {
        e.preventDefault()
        e.stopPropagation()
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [filter, selectedIndex, handleCopySelectedItem, flattenedItems]
  )

  // Separate effect for event listener management
  useEffect(() => {
    if (!showSearchModal) return

    // Add listener with high priority (capture phase)
    document.addEventListener('keydown', handleGlobalKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true)
    }
  }, [showSearchModal, handleGlobalKeyDown])

  useEffect(() => {
    if (!hasSearch || flattenedItems.clips.length > 0) {
      setFilter(FILTER.CLIPS)
    } else if (flattenedItems.boards.length > 0) {
      setFilter(FILTER.BOARDS)
    } else if (flattenedItems.menus.length > 0) {
      setFilter(FILTER.MENUS)
    }
  }, [
    flattenedItems.clips.length,
    flattenedItems.boards.length,
    flattenedItems.menus.length,
    hasSearch,
  ])

  // Reset selected index when search term or filter changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [debouncedSearchTerm, filter])

  // Scroll to selected item when index changes
  useEffect(() => {
    if (scrollContainerRef.current && showSearchModal && selectedIndex >= 0) {
      // Get the actual DOM element from SimpleBar component
      const simpleBarElement = (scrollContainerRef.current as any)?.el
      const container = simpleBarElement?.querySelector('.simplebar-content-wrapper')
      const selectedElement = container?.querySelector(`.search-item-${selectedIndex}`)
      if (selectedElement && container) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()
        const isAbove = elementRect.top < containerRect.top
        const isBelow = elementRect.bottom > containerRect.bottom

        if (isAbove || isBelow) {
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }
  }, [selectedIndex, showSearchModal])

  useEffect(() => {
    if (showSearchModal && (copiedItem || pastedItem) && isAutoCloseOnCopyPaste) {
      setTimeout(() => {
        setShowSearchModal(false)
      }, 1000)
    }
  }, [copiedItem, pastedItem, showSearchModal])

  return (
    <>
      <Popover
        defaultOpen={false}
        modal={false}
        open={showSearchModal}
        onOpenChange={() => {
          const newShow = !showSearchModal
          setShowSearchModal(newShow)
          resetKeyboardNavigation()
        }}
      >
        <PopoverAnchor asChild>
          <Box
            id="navbar-search_tour"
            className="flex flex-row bg-slate-100 dark:bg-slate-800 rounded-md p-0 items-center relative ml-2"
          >
            <Input
              placeholder={`${t('GlobalSearch:::Search', { ns: 'navbar' })} ...`}
              type="search"
              id="global-search"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
              }}
              ref={mergeRefs(searchHistoryInputRef)}
              onFocus={() => {
                isNavBarHovering.value = true
                setShowSearchModal(true)
              }}
              iconLeft={<Search className="h-4 w-4" />}
              classNameInput="w-full pr-0 h-7"
              className="text-md min-w-[120px] max-w-[220px] ring-offset-0 py-1 bg-slate-100 dark:bg-slate-800 border-r-0 border-t-0 border-b-0 h-8"
            />
            {!showSearchModal && (
              <Flex
                className="absolute right-2 text-slate-400/90 animate-in animate-out fade-in-out hover:text-slate-500 cursor-pointer"
                onClick={() => {
                  setShowSearchModal(true)
                  searchHistoryInputRef.current?.focus()
                }}
                title={t('GlobalSearch:::Press / key to search', { ns: 'navbar' })}
              >
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="rounded-md flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-[2px]"
                >
                  <line x1="16" x2="8" y1="5" y2="18" />
                </svg>
              </Flex>
            )}
          </Box>
        </PopoverAnchor>
        <PopoverContent
          className="overflow-hidden bg-gray-50 p-4 py-2 pb-3 pt-2 flex items-center flex-col w-fit rounded-md shadow-lg relative dark:bg-slate-800"
          sideOffset={4}
          onOpenAutoFocus={e => {
            e.preventDefault()
            // Keep focus on the input when modal opens
            setTimeout(() => {
              searchHistoryInputRef.current?.focus()
            }, 0)
          }}
          onInteractOutside={e => {
            e.preventDefault()
          }}
          onCloseAutoFocus={e => {
            e.preventDefault()
            setSearchTerm('')
            ;(document.activeElement as HTMLElement).blur()
          }}
        >
          <>
            <Box
              className="esc-key flex opacity-90 hover:opacity-100 hover:bg-opacity-100 justify-end w-[38px] h-[24px] rounded-sm top-2 left-2 absolute z-50 bg-slate-100/90 dark:bg-slate-900/90 cursor-pointer"
              onClick={() => {
                setShowSearchModal(false)
              }}
              title={t('Press ESC key to close', { ns: 'common' })}
            ></Box>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Box
                  className="flex opacity-90 hover:opacity-100 hover:bg-opacity-100 top-2 right-2 absolute z-50 text-slate-400 bg-slate-100/90 dark:bg-slate-900/90 cursor-pointer"
                  onClick={() => {
                    setShowSearchModal(false)
                  }}
                  title={t('GlobalSearch:::Search Options', { ns: 'navbar' })}
                >
                  <Settings size={14} />
                </Box>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled className="p-0 justify-center text-[13px]">
                  {t('GlobalSearch:::Search Options', { ns: 'navbar' })}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={e => {
                    e.preventDefault()
                    setIsAutoCloseOnCopyPaste(!isAutoCloseOnCopyPaste)
                  }}
                >
                  <Flex className="mr-2">
                    <Text
                      className={`!text-[13px] mr-1 !font-medium ${
                        !isAutoCloseOnCopyPaste ? 'text-slate-900/50' : ''
                      }`}
                    >
                      {t('GlobalSearch:::Auto Close on Copy & Paste', { ns: 'navbar' })}
                    </Text>
                  </Flex>
                  <Switch checked={isAutoCloseOnCopyPaste} className="ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.preventDefault()
                    setIsSearchNameOrLabelOnly(!isSearchNameOrLabelOnly)
                  }}
                >
                  <Flex className="mr-2">
                    <Text
                      className={`!text-[13px] mr-1 flex-col !items-start !font-medium ${
                        !isSearchNameOrLabelOnly ? 'text-slate-900/50' : ''
                      }`}
                    >
                      {t('GlobalSearch:::Search Name or Label Only', { ns: 'navbar' })}
                      <span className="text-muted-foreground opacity-70 !text-[12px] block">
                        {t('GlobalSearch:::Excludes clip or menu values', {
                          ns: 'navbar',
                        })}
                      </span>
                    </Text>
                  </Flex>
                  <Switch checked={isSearchNameOrLabelOnly} className="ml-auto" />
                </DropdownMenuItem>{' '}
              </DropdownMenuContent>
            </DropdownMenu>
            {hasSearch && (
              <Tabs
                className="flex flex-row z-10 select-none pb-1.5 mb-1"
                value={filter}
                onValueChange={val => {
                  setFilter(val)
                }}
              >
                <TabsList className="self-center px-1 py-1 bg-slate-200 dark:bg-slate-900">
                  <TabsTrigger
                    value={FILTER.CLIPS}
                    className="!text-xs py-1 data-[state=active]:text-slate-300 text-gray-400 hover:text-blue-400 data-[state=active]:hover:text-slate-300 dark:data-[state=active]:bg-slate-600"
                  >
                    {t('Clips:::Clips', { ns: 'dashboard' })}
                    <Badge
                      variant="outline"
                      className="text-[12px] ml-1 py-0.5 bg-slate-100 text-gray-400 dark:bg-slate-700 dark:text-gray-400 !font-mono border-0"
                    >
                      {flattenedItems.clips.length > 99
                        ? '99+'
                        : flattenedItems.clips.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value={FILTER.BOARDS}
                    className="!text-xs py-1 data-[state=active]:text-slate-300 text-gray-400 hover:text-blue-400 data-[state=active]:hover:text-slate-300 dark:data-[state=active]:bg-slate-600"
                  >
                    {t('Boards', { ns: 'dashboard' })}
                    <Badge
                      variant="outline"
                      className="text-[12px] ml-1 py-0.5 bg-slate-100 text-gray-400 dark:bg-slate-700 dark:text-gray-400 !font-mono border-0"
                    >
                      {flattenedItems.boards.length > 99
                        ? '99+'
                        : flattenedItems.boards.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value={FILTER.MENUS}
                    className="!text-xs py-1 data-[state=active]:text-slate-300 text-gray-400 hover:text-blue-400 data-[state=active]:hover:text-slate-300 dark:data-[state=active]:bg-slate-600"
                  >
                    {t('Menus', { ns: 'menus' })}
                    <Badge
                      variant="outline"
                      className="text-[12px] ml-1 py-0.5 bg-slate-100 text-gray-400 dark:bg-slate-700 dark:text-gray-400 !font-mono border-0"
                    >
                      {flattenedItems.menus.length > 99
                        ? '99+'
                        : flattenedItems.menus.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <SimpleBar
              ref={mergeRefs(scrollContainerRef)}
              className="flex-col"
              style={{
                height: 'auto',
                maxHeight: 'calc(100vh - 200px)',
                width: 420,
              }}
              autoHide={false}
              role="listbox"
              aria-label="Search results"
              aria-activedescendant={
                selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined
              }
            >
              {filter === FILTER.CLIPS &&
                clipItemsFiltered.results
                  ?.reduce((resultArray, item, index) => {
                    const chunkIndex = Math.floor(index / 1)

                    if (!resultArray[chunkIndex]) {
                      resultArray[chunkIndex] = []
                    }

                    resultArray[chunkIndex].push(item as Board)

                    return resultArray
                  }, [] as Board[][])
                  .map((boardGroup: Board[], groupIndex) => {
                    return (
                      <Box key={`${groupIndex}`} className="mt-1 mb-2">
                        {boardGroup.map((board: Board, index) => {
                          // Find if any clips in this board are selected
                          const currentItems = getCurrentItems()
                          let selectedClipId = null

                          if (selectedIndex >= 0 && selectedIndex < currentItems.length) {
                            const selectedItem = currentItems[selectedIndex]
                            if (
                              selectedItem?.type === 'clip' &&
                              selectedItem?.boardIndex === groupIndex
                            ) {
                              selectedClipId = selectedItem.id
                            }
                          }

                          return (
                            <Box
                              key={`${groupIndex}-${index}`}
                              className={clsx(
                                'rounded-md transition-colors',
                                `search-item-${groupIndex}`
                              )}
                              role="group"
                              aria-label={`Board: ${board.name}`}
                            >
                              <BoardComponentMemorized
                                board={board}
                                isDark={isDark}
                                closeGlobalSearch={closeGlobalSearchNavigateHistory}
                                setCurrentTab={setCurrentTab}
                                globalSearchTerm={debouncedSearchTerm}
                                isHistoryDragActive={false}
                                currentTabLayout={'auto'}
                                order={board.orderNumber}
                                isLastBoard={index === boardGroup.length - 1}
                                selectedItemIds={[]}
                                setSelectedItemId={() => {}}
                                keyboardSelectedClipId={{
                                  value: selectedClipId as UniqueIdentifier,
                                }}
                              />
                            </Box>
                          )
                        })}
                      </Box>
                    )
                  })}

              {filter === FILTER.BOARDS &&
                boardsFiltered.results
                  ?.reduce((resultArray, item, index) => {
                    const chunkIndex = Math.floor(index / 1)

                    if (!resultArray[chunkIndex]) {
                      resultArray[chunkIndex] = []
                    }

                    resultArray[chunkIndex].push(item as Board)

                    return resultArray
                  }, [] as Board[][])
                  .map((boardGroup: Board[], groupIndex) => {
                    return (
                      <Box key={`${groupIndex}`} className="mt-1 mb-2">
                        {boardGroup.map((board: Board, index) => {
                          // Check if this board is the currently selected item
                          const currentItems = getCurrentItems()
                          const isSelected =
                            selectedIndex >= 0 &&
                            currentItems[selectedIndex]?.type === 'board' &&
                            currentItems[selectedIndex]?.id === board.id
                          const boardGlobalIndex = currentItems.findIndex(
                            item => item.id === board.id
                          )
                          return (
                            <Box
                              key={`${groupIndex}-${index}`}
                              className={clsx(
                                `search-item-${boardGlobalIndex}`,
                                getSelectionStyles(isSelected)
                              )}
                              role="option"
                              aria-selected={isSelected}
                              id={isSelected ? `search-item-${selectedIndex}` : undefined}
                            >
                              <BoardComponentMemorized
                                board={board}
                                isDark={isDark}
                                globalSearchTerm={debouncedSearchTerm}
                                setCurrentTab={setCurrentTab}
                                closeGlobalSearch={closeGlobalSearchNavigateHistory}
                                isHistoryDragActive={false}
                                isGlobalSearchBoardsOnly={true}
                                currentTabLayout={'auto'}
                                order={board.orderNumber}
                                isLastBoard={index === boardGroup.length - 1}
                                selectedItemIds={[]}
                                setSelectedItemId={() => {}}
                                keyboardSelectedClipId={{ value: null }}
                              />
                            </Box>
                          )
                        })}
                      </Box>
                    )
                  })}
              {filter === FILTER.MENUS && (
                <Accordion
                  type="single"
                  collapsible
                  className="flex items-center flex-col"
                >
                  {menuItemsFiltered.results.map((item, i) => {
                    // Check if this menu item is the currently selected item
                    const currentItems = getCurrentItems()
                    const isSelected =
                      selectedIndex >= 0 &&
                      currentItems[selectedIndex]?.type === 'menu' &&
                      currentItems[selectedIndex]?.id === item.itemId
                    const menuGlobalIndex = currentItems.findIndex(
                      menuItem => menuItem.id === item.itemId
                    )
                    return (
                      <AccordionItem key={`${item.itemId}`} value={item.itemId}>
                        <Box
                          className={clsx(
                            `search-item-${menuGlobalIndex}`,
                            getSelectionStyles(isSelected)
                          )}
                          role="option"
                          aria-selected={isSelected}
                          id={isSelected ? `search-item-${selectedIndex}` : undefined}
                        >
                          <MenuCollapsibleItem
                            label={item.name}
                            globalSearchTerm={debouncedSearchTerm}
                            closeGlobalSearch={closeGlobalSearchNavigateMenu}
                            isLastItem={i === menuItemsFiltered.results.length - 1}
                            deletingMenuItemIds={deletingMenuItemIds}
                            isFirstItem={i === 0}
                            isDark={isDark}
                            showEditMenuItemId={showEditMenuItemId}
                            hasChildren={item.hasChildren}
                            isSeparator={item.isSeparator}
                            showMultiSelectItems={showMultiSelectItems}
                            hasSelectedItems={false}
                            id={item.itemId}
                            item={item}
                            isClip={item.isClip}
                            isForm={item.isForm && item.isClip}
                            isWebRequest={item.isWebRequest && item.isClip}
                            isWebScraping={item.isWebScraping && item.isClip}
                            isCommand={item.isCommand && item.isClip}
                            isCreatingMenuItem={isCreatingMenuItem}
                            indent={item.indent}
                            onFolderClose={() => {}}
                            onFolderOpen={() => {}}
                            isClosedFolder={false}
                            isSelected={false}
                            hasMultipleSelectedItems={false}
                            isOpen={false}
                          >
                            <></>
                          </MenuCollapsibleItem>
                        </Box>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}
              {!hasSearch ? (
                <Box className="text-gray-400/90 dark:text-gray-600 text-center mb-2 mt-2">
                  {t('GlobalSearch:::Type what you looking for', { ns: 'navbar' })}...
                </Box>
              ) : (
                <>
                  {flattenedItems.clips.length === 0 &&
                  flattenedItems.boards.length === 0 &&
                  flattenedItems.menus.length === 0 ? (
                    <Box className="text-gray-400/90 dark:text-gray-600 text-center mb-1">
                      {t('GlobalSearch:::Nothing found in clips, boards or menus.', {
                        ns: 'navbar',
                      })}
                    </Box>
                  ) : (
                    <>
                      {flattenedItems.clips.length === 0 && filter === FILTER.CLIPS && (
                        <Box className="text-gray-400/90 dark:text-gray-600 text-center mb-1">
                          {t('GlobalSearch:::Nothing found in clips.', {
                            ns: 'navbar',
                          })}
                        </Box>
                      )}

                      {flattenedItems.boards.length === 0 && filter === FILTER.BOARDS && (
                        <Box className="text-gray-400/90 dark:text-gray-600 text-center mb-1">
                          {t('GlobalSearch:::Nothing found in boards.', {
                            ns: 'navbar',
                          })}
                        </Box>
                      )}

                      {flattenedItems.menus.length === 0 && filter === FILTER.MENUS && (
                        <Box className="text-gray-400/90 dark:text-gray-600 text-center mb-1">
                          {t('GlobalSearch:::Nothing found in menus.', {
                            ns: 'navbar',
                          })}
                        </Box>
                      )}
                    </>
                  )}
                </>
              )}
            </SimpleBar>
            <Portal>
              <Box
                className={`body-overlay bg-black/30 dark:bg-black/70 rounded-lg ${
                  isWindows ? 'mb-1 mx-1 !mt-[43px]' : ''
                }`}
                onClick={() => {
                  setShowSearchModal(false)
                }}
              />
            </Portal>
          </>
        </PopoverContent>
      </Popover>
    </>
  )
}
