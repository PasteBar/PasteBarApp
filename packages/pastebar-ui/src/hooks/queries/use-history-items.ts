import { useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/tauri'
import { CLIPBOARD_HISTORY_SCROLL_PAGE_SIZE, clipboardHistoryStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

import { hasEmoji } from '~/lib/utils'

import { ClipboardHistoryItem, UpdatedClipboardHistoryData } from '~/types/history'

import { useInvokeMutation, useInvokeQuery } from './use-invoke'

export function useGetClipboardHistoriesWithinDateRange() {
  const { data: getClipboardHistoriesWithinDateRange } = useInvokeQuery<
    { start_date: Date; end_date: Date },
    ClipboardHistoryItem[]
  >('get_clipboard_histories_within_date_range')

  return {
    getClipboardHistoriesWithinDateRange,
  }
}

export function useGetPinnedClipboardHistories() {
  const { data: pinnedClipboardHistory = [] } = useInvokeQuery<
    Record<string, unknown>,
    ClipboardHistoryItem[]
  >('get_clipboard_history_pinned')

  pinnedClipboardHistory.forEach(clipboard => {
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
  })

  return {
    pinnedClipboardHistory,
  }
}

export function useUpdateClipboardHistoryById() {
  const queryClient = useQueryClient()

  const { mutate: updateClipboardHistoryById } = useInvokeMutation<
    { historyId: UniqueIdentifier; updatedData: UpdatedClipboardHistoryData },
    string
  >('update_clipboard_history_by_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('update clipboard error', data)
      }
    },
  })

  return {
    updateClipboardHistoryById,
  }
}

export function useUpdateClipboardHistoryByIds() {
  const queryClient = useQueryClient()

  const { mutate: updateClipboardHistoryByIds } = useInvokeMutation<
    { historyIds: UniqueIdentifier[]; updatedData: UpdatedClipboardHistoryData },
    string
  >('update_clipboard_history_by_ids', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('update clipboard error', data)
      }
    },
  })

  return {
    updateClipboardHistoryByIds,
  }
}

export function usePinnedClipboardHistoryByIds() {
  const queryClient = useQueryClient()

  const { mutate: pinnedClipboardHistoryByIds } = useInvokeMutation<
    { historyIds: UniqueIdentifier[]; isPinned: boolean },
    string
  >('update_pinned_clipboard_history_by_ids', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('update clipboard error', data)
      }
    },
  })

  return {
    pinnedClipboardHistoryByIds,
  }
}

export function useUnpinAllClipboardHistory() {
  const queryClient = useQueryClient()

  const { mutate: unPinAllClipboardHistory } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('unpin_all_clipboard_history_items', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('update clipboard error', data)
      }
    },
  })

  return {
    unPinAllClipboardHistory,
  }
}
export function useMovePinnedClipboardHistoryUpDown() {
  const queryClient = useQueryClient()

  const { mutate: movePinnedClipboardHistoryUpDown } = useInvokeMutation<
    { historyId: UniqueIdentifier; moveUp?: boolean; moveDown?: boolean },
    string
  >('move_pinned_item_up_down', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('update clipboard error', data)
      }
    },
  })

  return {
    movePinnedClipboardHistoryUpDown,
  }
}

export function useInfiniteClipboardHistory() {
  const queryClient = useQueryClient()
  const {
    data: infiniteClipboardHistory,
    isLoading: isClipboardInfiniteHistoryLoading,
    isFetched: isClipboardInfiniteHistoryFetched,
    fetchNextPage: fetchNextClipboardHistoryPage,
    isFetchingNextPage: isClipboardHistoryFetchingNextPage,
    error: isClipboardInfiniteHistoryError,
  } = useInfiniteQuery({
    queryKey: ['get_clipboard_history'],
    queryFn: ({ pageParam }) => {
      const { limit = CLIPBOARD_HISTORY_SCROLL_PAGE_SIZE, offset = 0 } = pageParam ?? {}
      return invoke('get_clipboard_history', {
        limit,
        offset,
      })
    },
    initialPageParam: { limit: CLIPBOARD_HISTORY_SCROLL_PAGE_SIZE, offset: 0 },
    getNextPageParam: (_lastPage, allPages: unknown[]) => {
      const offset = allPages?.reduce<number>(
        (total, page) => total + ((page as unknown[] | undefined)?.length ?? 0),
        0
      )
      return offset ? { limit: CLIPBOARD_HISTORY_SCROLL_PAGE_SIZE, offset } : null
    },
  })

  const { setClipboardHistory } = useAtomValue(clipboardHistoryStoreAtom)

  useEffect(() => {
    if (Array.isArray(infiniteClipboardHistory?.pages)) {
      const forceUpdate = !infiniteClipboardHistory?.pages.flat().length
      setClipboardHistory(
        infiniteClipboardHistory?.pages.flat() as ClipboardHistoryItem[],
        forceUpdate
      )
    }
  }, [infiniteClipboardHistory])

  return {
    infiniteClipboardHistory,
    invalidateClipboardHistoryQuery: () => {
      queryClient.invalidateQueries({
        queryKey: ['get_clipboard_history'],
      })
      queryClient.invalidateQueries({
        queryKey: ['get_clipboard_history_pinned'],
      })
    },
    isClipboardInfiniteHistoryLoading,
    isClipboardInfiniteHistoryFetched,
    fetchNextClipboardHistoryPage,
    isClipboardHistoryFetchingNextPage,
    isClipboardInfiniteHistoryError,
  }
}

export function useFindClipboardHistory({
  query = '',
  filters = [],
  codeFilters = [],
}: {
  query?: string
  filters?: string[]
  codeFilters?: string[]
}) {
  const queryClient = useQueryClient()
  const {
    data: foundClipboardHistory,
    refetch: refetchFindClipboardHistory,
    isLoading: isFoundClipboardHistoryLoading,
    isFetched: isFlundClipboardHistoryFetched,
    error: isFoundClipboardHistoryError,
  } = useInvokeQuery<Record<string, unknown>, ClipboardHistoryItem[]>(
    'find_clipboard_histories_by_value_or_filters',
    {
      query,
      filters,
      codeFilters,
      useQueryOptions: {
        enabled: false,
        refetchOnWindowFocus: false,
      },
    }
  )

  const { setClipboardHistory } = useAtomValue(clipboardHistoryStoreAtom)

  useEffect(() => {
    if (Array.isArray(foundClipboardHistory)) {
      setClipboardHistory(foundClipboardHistory, true, true)
    }
  }, [foundClipboardHistory])

  return {
    foundClipboardHistory,
    invalidateFindClipboardHistoryQuery: () => {
      queryClient.invalidateQueries({
        queryKey: ['find_clipboard_histories_by_value_or_filters'],
      })
    },
    refetchFindClipboardHistory,
    isFoundClipboardHistoryLoading,
    isFlundClipboardHistoryFetched,
    isFoundClipboardHistoryError,
  }
}

export function useSearchClipboardHistory({
  query = '',
  filters = [],
}: {
  query?: string
  filters?: string[]
}) {
  const queryClient = useQueryClient()
  const {
    data: foundClipboardHistory,
    refetch: refetchSearchClipboardHistory,
    isLoading: isFoundClipboardHistoryLoading,
    isFetched: isFlundClipboardHistoryFetched,
    error: isFoundClipboardHistoryError,
  } = useInvokeQuery<Record<string, unknown>, ClipboardHistoryItem[]>(
    'search_clipboard_histories_by_value_or_filters',
    {
      query,
      filters,
      useQueryOptions: {
        enabled: false,
        refetchOnWindowFocus: false,
      },
    }
  )

  return {
    foundClipboardHistory,
    invalidateSearchClipboardHistoryQuery: () => {
      queryClient.invalidateQueries({
        queryKey: ['search_clipboard_histories_by_value_or_filters'],
      })
    },
    refetchSearchClipboardHistory,
    isFoundClipboardHistoryLoading,
    isFlundClipboardHistoryFetched,
    isFoundClipboardHistoryError,
  }
}

export function useGetClipboardHistoryById() {
  const { data: clipboardHistoryById } = useInvokeQuery<
    { history_id: UniqueIdentifier },
    ClipboardHistoryItem
  >('get_clipboard_history_by_id')

  return {
    clipboardHistoryById,
  }
}

export function useDeleteClipboardHistoryByIds() {
  const queryClient = useQueryClient()
  const { mutate: deleteClipboardHistoryByIds } = useInvokeMutation<
    Record<UniqueIdentifier, unknown>,
    UniqueIdentifier
  >('delete_clipboard_history_by_ids', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('update clipboard error', data)
      }
    },
  })

  return {
    deleteClipboardHistoryByIds,
  }
}

export function useClearClipboardHistoryOlderThan() {
  const queryClient = useQueryClient()
  const { mutate: clearClipboardHistoryOlderThan } = useInvokeMutation<
    { durationType: string; olderThen: string },
    UniqueIdentifier
  >('clear_clipboard_history_older_than', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_clipboard_history_pinned'],
        })
      } else {
        console.log('clear clipboard error', data)
      }
    },
  })

  return {
    clearClipboardHistoryOlderThan,
  }
}
