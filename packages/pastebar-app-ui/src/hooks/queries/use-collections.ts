import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { collectionsStoreAtom, settingsStoreAtom } from '~/store'
import {
  isCollectionPinModalOpenAtom,
  collectionPinModalPropsAtom,
} from '~/store/uiStore'
import { useAtomValue, useSetAtom } from 'jotai'

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
  const { protectedCollections, screenLockPassCode } =
    useAtomValue(settingsStoreAtom)
  const { collections, updateCurrentCollectionId } = useAtomValue(collectionsStoreAtom)

  const setIsCollectionPinModalOpen = useSetAtom(isCollectionPinModalOpenAtom)
  const setCollectionPinModalProps = useSetAtom(collectionPinModalPropsAtom)

  const { mutate: invokeSelectCollectionById, isSuccess: selectCollectionByIdSuccess } =
    useInvokeMutation<Record<string, unknown>, string>('select_collection_by_id', {
      onSuccess: async (data, variables) => {
        if (data === 'ok') {
          // The actual update to currentCollectionId in collectionsStoreAtom
          // might be implicitly handled by backend or needs explicit call here
          // For now, assume backend handles state post 'select_collection_by_id'
          // and query invalidations refresh the frontend state.
          // If direct update is needed:
          // const { selectCollection } = variables as { selectCollection: { collectionId: string } };
          // updateCurrentCollectionId(selectCollection.collectionId);

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
          console.log('select collection error', data)
        }
      },
    })

  const selectCollectionById = (params: {
    selectCollection: { collectionId: string }
  }) => {
    const { collectionId } = params.selectCollection
    const isProtected = protectedCollections.includes(collectionId)
    const targetCollection = collections.find(c => c.collectionId === collectionId)

    if (isProtected && screenLockPassCode && targetCollection) {
      const onConfirmSuccessCallback = () => {
        // This function is called by the modal on successful PIN verification.
        // It should now perform the actual collection switch.
        // We can call updateCurrentCollectionId directly if it's available and appropriate,
        // OR we can call invokeSelectCollectionById, but that might re-trigger this logic.
        // Direct state update via updateCurrentCollectionId is cleaner if it also handles
        // necessary backend calls or cache invalidations implicitly or explicitly.
        // For now, let's assume updateCurrentCollectionId is sufficient for frontend state.
        // The PinPromptModal previously called updateCurrentCollectionId.
        // If invokeSelectCollectionById is called, ensure it doesn't lead to a loop.
        // A more robust way might be to have a separate "forceSelect" or "internalSelect"
        // that bypasses this PIN check, but for now, direct update to store is assumed.
        if (updateCurrentCollectionId) {
             updateCurrentCollectionId(collectionId)
             // Manually trigger necessary invalidations if updateCurrentCollectionId doesn't do it.
             // This part is crucial and was handled by invokeSelectCollectionById's onSuccess.
             // Replicating that here or ensuring updateCurrentCollectionId covers it.
             queryClient.invalidateQueries({ queryKey: ['get_collections'] })
             queryClient.invalidateQueries({ queryKey: ['get_active_collection_with_clips'] })
             queryClient.invalidateQueries({ queryKey: ['get_active_collection_with_menu_items'] })
             invoke('build_system_menu') // Also ensure this is called.
        } else {
            // Fallback or error if updateCurrentCollectionId is not on collectionsStoreAtom
            // This would be a contract violation with collectionsStoreAtom
            console.error("updateCurrentCollectionId not available on collectionsStoreAtom");
            // As a fallback, we could call invokeSelectCollectionById, but this is not ideal
            // as it might re-trigger the PIN prompt if not careful.
            // For now, we assume updateCurrentCollectionId is the way.
        }
      }

      setCollectionPinModalProps({
        title: `Unlock Collection: ${targetCollection.title}`,
        onConfirmSuccess: onConfirmSuccessCallback,
      })
      setIsCollectionPinModalOpen(true)
    } else {
      // Not protected or no PIN set, proceed as normal
      invokeSelectCollectionById(params)
    }
  }

  return {
    selectCollectionByIdSuccess,
    selectCollectionById, // This is now our wrapped function
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
