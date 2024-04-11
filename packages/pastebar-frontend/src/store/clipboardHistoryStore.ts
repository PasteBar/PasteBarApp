import { UniqueIdentifier } from '@dnd-kit/core/dist/types'
import { timeAgoCache, timeAgoInstance } from '~/locales/locales'
import { atomWithStore } from 'jotai-zustand'
import { createStore } from 'zustand/vanilla'

import { hasEmoji } from '~/lib/utils'

import { invokeFetcher } from '~/hooks/queries/use-invoke'

import { ClipboardHistoryItem, LinkMetadata } from '~/types/history'

import { settingsStore } from './settingsStore'

export interface ClipboardHistoryStoreState {
  scrollToTopHistoryList: (force?: boolean) => void
  historyListSimpleBar: React.RefObject<HTMLElement> | null
  clipboardHistory: ClipboardHistoryItem[]
  newClipboardHistory: ClipboardHistoryItem[]
  foundClipboardHistory: ClipboardHistoryItem[]
  newClipboardHistoryCount: number
  setHistoryListSimpleBar: (historyListSimpleBar: React.RefObject<HTMLElement>) => void
  generateLinkMetaData: (
    historyId: UniqueIdentifier,
    url: string,
    isPreviewOnly?: boolean
  ) => Promise<LinkMetadata | void>
  removeLinkMetaData: (historyId: UniqueIdentifier) => Promise<void>
  updateClipboardHistory: () => void
  setClipboardHistory: (
    history: ClipboardHistoryItem[],
    force?: boolean,
    isFound?: boolean,
    isPinned?: boolean
  ) => void
}

export const clipboardHistoryStore = createStore<ClipboardHistoryStoreState>()(
  (set, get) => ({
    clipboardHistory: [],
    newClipboardHistory: [],
    foundClipboardHistory: [],
    newClipboardHistoryCount: 0,
    historyListSimpleBar: null,
    scrollToTopHistoryList(force = false) {
      const { historyListSimpleBar } = get()
      if (
        historyListSimpleBar?.current &&
        (settingsStore.getState().isHistoryAutoUpdateOnCaputureEnabled || force)
      ) {
        historyListSimpleBar?.current.scrollTo({ top: 0, behavior: 'auto' })
      }
    },
    setHistoryListSimpleBar(historyListSimpleBar: React.RefObject<HTMLElement>) {
      set(() => ({
        historyListSimpleBar,
      }))
    },
    async removeLinkMetaData(historyId: UniqueIdentifier) {
      return await invokeFetcher('delete_link_metadata', {
        historyId,
      })
    },
    async generateLinkMetaData(
      historyId: UniqueIdentifier,
      url: string,
      isPreviewOnly = false
    ) {
      return await invokeFetcher('fetch_link_metadata', {
        historyId,
        url,
        isPreviewOnly,
      })
    },
    setClipboardHistory: (
      clipboardHistory: ClipboardHistoryItem[],
      force = false,
      isFound = false
    ) => {
      let previousTimeAgo: string | null = null
      const now = Date.now()

      const _clipboardHistory =
        !settingsStore.getState().isHistoryAutoUpdateOnCaputureEnabled &&
        get().clipboardHistory.length > 0 &&
        !force
          ? get().clipboardHistory
          : clipboardHistory

      _clipboardHistory.forEach((clipboard, i) => {
        if (clipboard.links) {
          try {
            clipboard.arrLinks = JSON.parse(clipboard.links as string)
          } catch (e) {
            clipboard.arrLinks = []
          }
        }

        if (clipboard.hasEmoji) {
          clipboard.hasEmoji = hasEmoji(clipboard.value as string)
        }

        const updatedAt = clipboard.updatedAt

        let cacheEntry = timeAgoCache.get(updatedAt)

        if (!cacheEntry || now - cacheEntry.timestamp > 60 * 1000 || i === 0) {
          const clipboardItemTimeAgo = timeAgoInstance().format(updatedAt, {
            round: 'floor',
          })
          const clipboardItemTimeAgoShort = timeAgoInstance().format(
            updatedAt,
            'twitter-first-minute',
            { round: 'floor' }
          )

          cacheEntry = {
            timestamp: now,
            timeAgo: clipboardItemTimeAgo,
            timeAgoShort: clipboardItemTimeAgoShort,
          }

          timeAgoCache.set(updatedAt, cacheEntry)
        }

        clipboard.timeAgo = cacheEntry.timeAgo
        clipboard.timeAgoShort = cacheEntry.timeAgoShort
        clipboard.showTimeAgo = i === 0 || cacheEntry.timeAgo !== previousTimeAgo

        previousTimeAgo = cacheEntry.timeAgo
      })

      if (
        !settingsStore.getState().isHistoryAutoUpdateOnCaputureEnabled &&
        get().clipboardHistory.length > 0 &&
        !force
      ) {
        const firstItemId = _clipboardHistory[0].historyId

        const newClipboardHistoryCount = clipboardHistory.findIndex(
          item => item.historyId === firstItemId
        )

        set(() => ({
          newClipboardHistoryCount,
          newClipboardHistory: clipboardHistory,
        }))
        return
      }

      set(() => ({
        [isFound ? 'foundClipboardHistory' : 'clipboardHistory']: _clipboardHistory,
        newClipboardHistory: [],
        newClipboardHistoryCount: 0,
      }))
    },
    updateClipboardHistory: () => {
      const { newClipboardHistory, scrollToTopHistoryList, setClipboardHistory } = get()
      setClipboardHistory(
        newClipboardHistory.length > 0 ? newClipboardHistory : get().clipboardHistory,
        true
      )
      scrollToTopHistoryList(true)
    },
  })
)

export const clipboardHistoryStoreAtom = atomWithStore(clipboardHistoryStore)

if (import.meta.env.TAURI_DEBUG) {
  // @ts-expect-error
  window.clipboardHistoryStore = clipboardHistoryStore
}
