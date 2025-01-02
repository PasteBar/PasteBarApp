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
  clipboardHistoryIdsURLErrors: UniqueIdentifier[]
  addToClipboardHistoryIdsURLErrors: (historyId: UniqueIdentifier) => void
  addToGenerateLinkMetaDataInProgress: (historyId: UniqueIdentifier) => void
  removeToGenerateLinkMetaDataInProgress: (historyId: UniqueIdentifier) => void
  clipboardHistoryGenerateLinkMetaDataInProgress: UniqueIdentifier[]
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
    clipboardHistoryIdsURLErrors: [],
    newClipboardHistory: [],
    foundClipboardHistory: [],
    clipboardHistoryGenerateLinkMetaDataInProgress: [],
    newClipboardHistoryCount: 0,
    historyListSimpleBar: null,
    addToGenerateLinkMetaDataInProgress: (historyId: UniqueIdentifier) => {
      set(() => ({
        clipboardHistoryGenerateLinkMetaDataInProgress: [
          ...get().clipboardHistoryGenerateLinkMetaDataInProgress,
          historyId,
        ],
      }))
    },
    removeToGenerateLinkMetaDataInProgress: (historyId: UniqueIdentifier) => {
      set(() => ({
        clipboardHistoryGenerateLinkMetaDataInProgress:
          get().clipboardHistoryGenerateLinkMetaDataInProgress.filter(
            id => id !== historyId
          ),
      }))
    },
    addToClipboardHistoryIdsURLErrors: (historyId: UniqueIdentifier) => {
      set(() => ({
        clipboardHistoryIdsURLErrors: [...get().clipboardHistoryIdsURLErrors, historyId],
      }))
    },
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
      try {
        const clipboard = get().clipboardHistory.find(
          clipboard => clipboard.historyId === historyId
        )
        const options = clipboard?.historyOptions
          ? JSON.parse(clipboard.historyOptions)
          : {}

        options.noLinkCard = true
        await invokeFetcher('update_clipboard_history_by_id', {
          historyId,
          updatedData: {
            historyOptions: JSON.stringify(options),
          },
        })
        return await invokeFetcher('delete_link_metadata', {
          historyId,
        })
      } catch (error) {
        console.error(`Error removing link metadata for historyId ${historyId}:`, error)
      }
    },
    async generateLinkMetaData(
      historyId: UniqueIdentifier,
      url: string,
      isPreviewOnly = false
    ) {
      if (url.endsWith('.mp3')) {
        const metadata = await invokeFetcher('fetch_link_metadata', {
          historyId,
          url,
          isPreviewOnly,
        })
        return await invokeFetcher('fetch_link_track_metadata', {
          previewMetadata: metadata,
          isPreviewOnly,
          historyId: historyId.toString(),
          url,
        })
      }

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
