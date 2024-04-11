import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { collectionsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

import { Collection, Item, Tabs } from '~/types/menu'

import { useInvokeMutation, useInvokeQuery } from './use-invoke'

export function useGetCollections() {
  const {
    data: collections,
    isLoading: isCollectionsLoading,
    error: isCollectionsError,
  } = useInvokeQuery<Record<string, unknown>, Collection[]>('get_collections', {})

  const { setCollections } = useAtomValue(collectionsStoreAtom)

  useEffect(() => {
    if (Array.isArray(collections)) {
      setCollections(collections)
    }
  }, [collections])

  return {
    collections,
    isCollectionsLoading,
    isCollectionsError,
  }
}

export function useGetCollectionWithMenuItems() {
  const {
    data: collectionWithItems,
    isLoading: isCollectionWithItemLoading,
    isSuccess: isCollectionWithItemSuccess,
    error: isCollectionWithItemError,
  } = useInvokeQuery<
    Record<string, unknown>,
    {
      collection: Collection
      items: Item[]
    }
  >('get_active_collection_with_menu_items', {})

  const queryClient = useQueryClient()
  const { setMenuItems } = useAtomValue(collectionsStoreAtom)

  useEffect(() => {
    if (collectionWithItems?.items) {
      setMenuItems(collectionWithItems?.items)
    }
  }, [collectionWithItems, collectionWithItems?.items])

  return {
    collectionWithItems,
    invalidateCollectionWithMenuItems: () => {
      queryClient.invalidateQueries({
        queryKey: ['get_active_collection_with_menu_items'],
      })
    },
    isCollectionWithItemSuccess,
    isCollectionWithItemLoading,
    isCollectionWithItemError,
  }
}

export function useFetchCollectionWithMenuItems() {
  const {
    data: collectionWithMenuItems,
    isLoading: isCollectionWithItemLoading,
    refetch: fetchCollectionWithMenuItems,
    error: isCollectionWithItemError,
  } = useInvokeQuery<
    Record<string, unknown>,
    {
      collection: Collection
      items: Item[]
    }
  >('get_active_collection_with_menu_items', {
    useQueryOptions: {
      enabled: false,
      refetchOnWindowFocus: false,
    },
  })

  return {
    collectionWithMenuItems,
    fetchCollectionWithMenuItems,
    isCollectionWithItemLoading,
    isCollectionWithItemError,
  }
}

export function useGetCollectionWithClips() {
  const {
    data: collectionWithClips,
    isLoading: isCollectionWithClipsLoading,
    refetch: fetchCollectionWithClips,
    isFetched: isCollectionWithClipsLoadingFinished,
    error: isCollectionWithClipsError,
  } = useInvokeQuery<
    Record<string, unknown>,
    {
      collection: Collection
      tabs: Tabs[]
      clips: Item[]
    }
  >('get_active_collection_with_clips', {})

  const { setClipItems, setTabs } = useAtomValue(collectionsStoreAtom)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (collectionWithClips?.clips) {
      setClipItems(collectionWithClips?.clips)
    }
    if (collectionWithClips?.tabs) {
      setTabs(collectionWithClips?.tabs)
    }
  }, [collectionWithClips?.clips, collectionWithClips?.tabs])

  return {
    collectionWithClips,
    invalidateCollectionWithClips: () => {
      queryClient.invalidateQueries({
        queryKey: ['get_active_collection_with_clips'],
      })
    },
    isCollectionWithClipsLoading,
    fetchCollectionWithClips,
    isCollectionWithClipsLoadingFinished,
    isCollectionWithClipsError,
  }
}

export function useFetchCollectionWithClips() {
  const {
    data: collectionWithClips,
    isLoading: isCollectionWithClipsLoading,
    refetch: fetchCollectionWithClips,
    isFetched: isCollectionWithClipsLoadingFinished,
    error: isCollectionWithClipsError,
  } = useInvokeQuery<
    Record<string, unknown>,
    {
      collection: Collection
      tabs: Tabs[]
      clips: Item[]
    }
  >('get_active_collection_with_clips', {
    useQueryOptions: {
      enabled: false,
      refetchOnWindowFocus: false,
    },
  })

  return {
    collectionWithClips,
    isCollectionWithClipsLoading,
    fetchCollectionWithClips,
    isCollectionWithClipsLoadingFinished,
    isCollectionWithClipsError,
  }
}

export function useUpdateMovedMenuItemsInCollection() {
  const queryClient = useQueryClient()

  const { mutate: updateMovedMenuItems, isSuccess: updateMovedMenuItemsSuccess } =
    useInvokeMutation<Record<string, unknown>, string>(
      'update_moved_menu_items_in_collection',
      {
        onSuccess: async data => {
          if (data === 'ok') {
            queryClient.invalidateQueries({
              queryKey: ['get_active_collection_with_menu_items'],
            })
          } else {
            console.log('Move menu items update error', data)
          }
        },
        onError: error => {
          console.log('Move menu items update error', error)
        },
      }
    )

  return {
    updateMovedMenuItemsSuccess,
    updateMovedMenuItems,
  }
}

export function useUpdateMovedClipsInCollection() {
  const queryClient = useQueryClient()

  const { mutate: updateMovedClips, isSuccess: updateMovedClipsSuccess } =
    useInvokeMutation<Record<string, unknown>, string>(
      'update_moved_clips_in_collection',
      {
        onSuccess: async data => {
          if (data === 'ok') {
            queryClient.invalidateQueries({
              queryKey: ['get_active_collection_with_clips'],
            })
          } else {
            console.log('Move menu items update error', data)
          }
        },
        onError: error => {
          console.log('Move menu items update error', error)
        },
      }
    )

  return {
    updateMovedClipsSuccess,
    updateMovedClips,
  }
}

export function useUpdateCollectionById() {
  const queryClient = useQueryClient()

  const { mutate: updateCollectionById } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('update_collection_by_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_collections'],
        })
      } else {
        console.log('update collection error', data)
      }
    },
    onError: error => {
      console.log('update collection error', error)
    },
  })

  return {
    updateCollectionById,
  }
}

export function useSelectCollectionById() {
  const queryClient = useQueryClient()

  const { mutate: selectCollectionById, isSuccess: selectCollectionByIdSuccess } =
    useInvokeMutation<Record<string, unknown>, string>('select_collection_by_id', {
      onSuccess: async data => {
        if (data === 'ok') {
          await invoke('build_system_menu')
          queryClient.invalidateQueries({
            queryKey: ['get_collections'],
          })
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_menu_items'],
          })
        } else {
          console.log('update collection error', data)
        }
      },
    })

  return {
    selectCollectionByIdSuccess,
    selectCollectionById,
  }
}

export function useCreateNewCollection() {
  const queryClient = useQueryClient()

  const { mutate: createNewCollection, isSuccess: createNewCollectionSuccess } =
    useInvokeMutation<Record<string, unknown>, string>('create_collection', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_collections'],
          })
        } else {
          console.log('update collection error', data)
        }
      },
    })

  return {
    createNewCollection,
    createNewCollectionSuccess,
  }
}

export function useDeleteCollectionById() {
  const queryClient = useQueryClient()

  const { mutate: deleteCollectionById } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('delete_collection_by_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_collections'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_menu_items'],
        })
      } else {
        console.log('update collection error', data)
      }
    },
  })

  return {
    deleteCollectionById,
  }
}
