import { UniqueIdentifier } from '@dnd-kit/core'
import { Clip } from '~/pages/components/Dashboard/components/ClipCard'
import { atomWithStore } from 'jotai-zustand'
import { debounce } from 'lodash-es'
import { createStore } from 'zustand/vanilla'

import { Collection, Item, Tabs } from '~/types/menu'

import { isFullyExpandViewBoard, showExpandViewBoardId } from './signalStore'

export interface CollectionsStoreState {
  collections: Collection[]
  menuItems: Item[]
  isMenuLoaded: boolean
  clipItems: Item[]
  pinnedClips: Clip[]
  tabs: Tabs[]
  tabsLoaded: boolean
  currentTab: string
  setIsMenuLoaded: (isMenuLoaded: boolean) => void
  isBoardHasChildren: (boardId: UniqueIdentifier) => boolean
  setCurrentTab: (tabId: string) => void
  getTabLastBorderIndex: (tabId: string) => number
  tabHasBoards: (tabId: string) => boolean
  getCurrentTab: () => string
  setTabs: (tabs: Tabs[]) => void
  setTabsByOrder: (tabs: Tabs[]) => void
  setMenuItems: (menuItems: Item[]) => void
  setClipItems: (clipItems: Item[]) => void
  setClipItemsDebounced: (clipItems: Item[]) => void
  getCurrentCollectionTitle: () => string | undefined
  currentCollectionId: string | null
  setCollections: (collections: Collection[]) => void
}

export const collectionsStore = createStore<CollectionsStoreState>()((set, get) => ({
  collections: [],
  tabs: [],
  tabsLoaded: false,
  isMenuLoaded: false,
  pinnedClips: [],
  currentCollectionId: null,
  currentTab: '',
  menuItems: [],
  clipItems: [],
  getTabLastBorderIndex: (tabId: string) => {
    const { clipItems } = get()
    const tabBoards = clipItems.filter(item => item.isBoard && item.tabId === tabId)
    const lastBoardIndex = tabBoards.reduce((prev, curr) => {
      return prev.orderNumber > curr.orderNumber ? prev : curr
    }, tabBoards[0])?.orderNumber
    return lastBoardIndex || 0
  },
  setIsMenuLoaded: (isMenuLoaded: boolean) => {
    set(() => ({
      isMenuLoaded,
    }))
  },
  getCurrentTab: () => {
    return get().currentTab || get().tabs[0]?.tabId
  },
  setClipItemsDebounced: debounce(
    (clipItems: Item[]) => {
      set(() => ({
        pinnedClips: clipItems
          .filter(item => item.isPinned && item.isClip)
          .sort((a, b) => a.pinnedOrderNumber - b.pinnedOrderNumber)
          .map(item => {
            return {
              id: item.itemId as UniqueIdentifier,
              name: item.name as string,
              parentId: item.parentId as UniqueIdentifier,
              orderNumber: item.orderNumber as number,
              pinnedOrderNumber: item.pinnedOrderNumber as number,
              isPinned: item.isPinned as boolean,
              isLink: item.isLink as boolean,
              createdAt: item.createdAt as number,
              isFavorite: item.isFavorite as boolean,
              color:
                item.color ??
                clipItems.find(clipItem => clipItem.itemId === item.parentId)?.color ??
                'slate',
              borderWidth: item.borderWidth as number,
              value: item.value as string,
              tabId: item.tabId as string,
              type: 'clip',
            }
          }),
        clipItems,
      }))
    },
    300,
    { leading: true }
  ),
  setMenuItems: (menuItems: Item[]) => {
    set(() => ({
      isMenuLoaded: true,
      menuItems,
    }))
  },
  setClipItems: (clipItems: Item[]) => {
    set(() => ({
      pinnedClips: clipItems
        .filter(item => item.isPinned && item.isClip)
        .sort((a, b) => a.pinnedOrderNumber - b.pinnedOrderNumber)
        .map(item => {
          return {
            id: item.itemId as UniqueIdentifier,
            name: item.name as string,
            parentId: item.parentId as UniqueIdentifier,
            orderNumber: item.orderNumber as number,
            createdAt: item.createdAt as number,
            isPinned: item.isPinned as boolean,
            isLink: item.isLink as boolean,
            isFavorite: item.isFavorite as boolean,
            color:
              item.color ??
              clipItems.find(clipItem => clipItem.itemId === item.parentId)?.color ??
              'slate',
            borderWidth: item.borderWidth as number,
            value: item.value as string,
            tabId: item.tabId as string,
            type: 'clip',
          }
        }),
      clipItems,
    }))
  },
  isBoardHasChildren: (boardId: UniqueIdentifier) => {
    const { clipItems } = get()
    return clipItems.some(item => item.parentId === boardId)
  },
  tabHasBoards: (tabId: string) => {
    const { clipItems } = get()
    return clipItems.some(item => item.tabId === tabId && item.isBoard)
  },
  setTabsByOrder: (tabs: Tabs[]) => {
    set({
      tabs: tabs.sort((a, b) => a.tabOrderNumber - b.tabOrderNumber),
    })
  },
  setTabs: (tabs: Tabs[]) => {
    const selectedCollection = get().currentCollectionId
    const storedCollectionCurrentTab = localStorage.getItem('currentTabs')
    const storedCurrentTab = storedCollectionCurrentTab?.startsWith(
      selectedCollection + ':::'
    )
      ? storedCollectionCurrentTab.split(':::')[1]
      : ''

    const currentFoundTab = tabs.find(tab => tab.tabId === storedCurrentTab)?.tabId
    const existedCurrentTab = tabs.find(tab => tab.tabId === get().currentTab)?.tabId
    const currentTab = existedCurrentTab || currentFoundTab || tabs[0]?.tabId

    const sortedTabs = tabs.sort((a, b) => {
      return a.tabOrderNumber - b.tabOrderNumber
    })

    set({
      currentTab,
      tabsLoaded: true,
      tabs: sortedTabs,
    })
  },
  setCurrentTab: (tabId: string) => {
    const selectedCollection = get().currentCollectionId
    if (showExpandViewBoardId.value) {
      showExpandViewBoardId.value = null
      isFullyExpandViewBoard.value = false
    }

    if (selectedCollection) {
      localStorage.setItem('currentTabs', `${selectedCollection}:::${tabId}`)
    }

    set(() => ({
      currentTab: tabId,
    }))
  },
  getCurrentCollectionTitle: () => {
    const { collections, currentCollectionId } = get()
    return collections.find(collection => collection.collectionId === currentCollectionId)
      ?.title
  },
  setCollections: (collections: Collection[]) => {
    const selectedCollection = collections.find(
      (collection: Collection) => collection.isSelected
    )

    set(() => ({
      collections,
      currentCollectionId: selectedCollection?.collectionId || null,
    }))
  },
}))

export const collectionsStoreAtom = atomWithStore(collectionsStore)

if (import.meta.env.TAURI_DEBUG) {
  // @ts-expect-error
  window.collectionsStore = collectionsStore
}
