import { UniqueIdentifier } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { newBoardItemId, newClipItemId } from '~/store'

import { LinkMetadata } from '~/types/history'

import { useInvokeMutation, useInvokeQuery } from './use-invoke'

export function useGetLinkMetadataByItemId(
  isLink: boolean | undefined,
  itemId: UniqueIdentifier | undefined
) {
  if (!itemId) {
    return { metadataLinkByItemId: undefined, invalidateLinkMetadataByItemId: () => {} }
  }

  const queryClient = useQueryClient()
  const { data: metadataLinkByItemId } = useInvokeQuery<
    {
      itemId: UniqueIdentifier
      useQueryOptions: {
        enabled: boolean
        refetchOnWindowFocus: boolean
        staleTime: number
      }
    },
    LinkMetadata
  >('get_link_metadata_by_item_id', {
    itemId,
    useQueryOptions: {
      enabled: Boolean(isLink),
      staleTime: 60 * (60 * 1000),
      refetchOnWindowFocus: false,
    },
  })

  return {
    invalidateLinkMetadataByItemId: () => {
      queryClient.invalidateQueries({
        queryKey: ['get_link_metadata_by_item_id', { itemId }],
      })
    },
    metadataLinkByItemId,
  }
}

export function useUpdateItemById() {
  const queryClient = useQueryClient()

  const { mutate: updateItemById, isPending: updateItemByIdPending } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('update_item_by_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
      } else {
        console.log('update item error', data)
      }
    },
  })

  return {
    updateItemByIdPending,
    invalidateCollectionWithClips: () => {
      queryClient.invalidateQueries({
        queryKey: ['get_active_collection_with_clips'],
      })
    },
    updateItemById,
  }
}

export function useAddImageToItemById() {
  const queryClient = useQueryClient()

  const { mutate: addImageToItemById } = useInvokeMutation<
    { itemId: UniqueIdentifier; imagePath: string },
    string
  >('add_image_to_item_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_menu_items'],
        })
      } else {
        console.log('add image to item error', data)
      }
    },
  })

  return {
    addImageToItemById,
  }
}

export function useUploadImageToItemById() {
  const queryClient = useQueryClient()

  const { mutateAsync: uploadImageToItemById, reset: uploadImageToItemReset } =
    useInvokeMutation<
      { itemId: UniqueIdentifier; buffer: number[]; fileType: string },
      string
    >('upload_image_file_to_item_id', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_menu_items'],
          })
        } else {
          console.log('upload image to item error', data)
        }
      },
    })

  return {
    uploadImageToItemReset,
    uploadImageToItemById,
  }
}

export function useUpdateItemValueByHistoryId() {
  const queryClient = useQueryClient()

  const { mutate: updateItemValueByHistoryId } = useInvokeMutation<
    { historyId: UniqueIdentifier; itemId: UniqueIdentifier },
    string
  >('update_item_value_by_history_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
      } else {
        console.log('update item value by history id error', data)
      }
    },
  })

  return {
    updateItemValueByHistoryId,
  }
}

export function useUpdateItemByIds() {
  const queryClient = useQueryClient()

  const { mutate: updateItemByIds, isPending: updateItemByIdsPending } =
    useInvokeMutation<Record<string, unknown>, string>('update_items_by_ids', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        } else {
          console.log('update items by ids error', data)
        }
      },
    })

  return {
    updateItemByIdsPending,
    updateItemByIds,
  }
}

export function useUpdateMenuItemsByIds() {
  const queryClient = useQueryClient()

  const { mutate: updateMenuItemsByIds, isPending: updateMenuItemsByIdsPending } =
    useInvokeMutation<Record<string, unknown>, string>('update_menu_items_by_ids', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_menu_items'],
          })
        } else {
          console.log('update menu items by ids error', data)
        }
      },
    })

  return {
    updateMenuItemsByIds,
    updateMenuItemsByIdsPending,
  }
}

export function useUpdateMenuItemById() {
  const queryClient = useQueryClient()

  const { mutate: updateMenuItemById, isPending: updateMenuItemByIdPending } =
    useInvokeMutation<Record<string, unknown>, string>('update_menu_item_by_id', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_menu_items'],
          })
        } else {
          console.log('update menu item error', data)
        }
      },
    })

  return {
    updateMenuItemByIdPending,
    updateMenuItemById,
  }
}

export function useCreateItem(invalidate = true) {
  const queryClient = useQueryClient()

  const { mutateAsync: createNewItem, isSuccess: createNewItemSuccess } =
    useInvokeMutation<Record<string, unknown>, string>('create_item', {
      onSuccess: data => {
        if (data && invalidate) {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        }
      },
    })

  return {
    createNewItem,
    createNewItemSuccess,
  }
}

export function useLinkClipIdToMenuItem(invalidate = true) {
  const queryClient = useQueryClient()

  const { mutateAsync: linkClipIdToMenuItem, isSuccess: linkClipIdToMenuItemSuccess } =
    useInvokeMutation<Record<string, unknown>, string>('link_clip_to_menu_item', {
      onSuccess: data => {
        if (data && invalidate) {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        }
      },
    })

  return {
    linkClipIdToMenuItem,
    linkClipIdToMenuItemSuccess,
  }
}

export function useUnLinkClipIdToMenuItem(invalidate = true) {
  const queryClient = useQueryClient()

  const {
    mutateAsync: unlinkClipIdToMenuItem,
    isSuccess: unlinkClipIdToMenuItemSuccess,
  } = useInvokeMutation<{ clipId: UniqueIdentifier }, string>(
    'unlink_clip_to_menu_item',
    {
      onSuccess: data => {
        if (data && invalidate) {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_menu_items'],
          })
        }
      },
    }
  )

  return {
    unlinkClipIdToMenuItem,
    unlinkClipIdToMenuItemSuccess,
  }
}

export function useDuplicateItem() {
  const queryClient = useQueryClient()

  const { mutateAsync: duplicateItem, isSuccess: duplicateItemSuccess } =
    useInvokeMutation<
      {
        itemId: UniqueIdentifier
        boardId: UniqueIdentifier
        collectionId: UniqueIdentifier
        tabId: UniqueIdentifier
      },
      string
    >('duplicate_item', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        }
      },
    })

  return {
    duplicateItem,
    duplicateItemSuccess,
  }
}

export function useDuplicateMenuItem() {
  const queryClient = useQueryClient()

  const { mutateAsync: duplicateMenuItem, isSuccess: duplicateMenuItemSuccess } =
    useInvokeMutation<
      {
        itemId: UniqueIdentifier
        collectionId: UniqueIdentifier
        parentId: string | null
        orderNumber: number
      },
      string
    >('duplicate_menu_item', {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_menu_items'],
          })
        }
      },
    })

  return {
    duplicateMenuItem,
    duplicateMenuItemSuccess,
  }
}

export function useDeleteItemById() {
  const queryClient = useQueryClient()

  const { mutate: deleteItemById } = useInvokeMutation<Record<string, unknown>, string>(
    'delete_item_by_id',
    {
      onSuccess: data => {
        if (data === 'ok') {
          if (newBoardItemId.value) {
            newBoardItemId.value = null
          }
          if (newClipItemId.value) {
            newClipItemId.value = null
          }
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        } else {
          console.log('delete item error', data)
        }
      },
    }
  )

  return {
    deleteItemById,
  }
}

export function useDeleteMenuItemById() {
  const queryClient = useQueryClient()

  const { mutate: deleteMenuItemById } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('delete_menu_item_by_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_menu_items'],
        })
      } else {
        console.log('delete menu item error', data)
      }
    },
  })

  return {
    deleteMenuItemById,
  }
}

export function useDeleteMenuItemsByIds() {
  const queryClient = useQueryClient()

  const { mutate: deleteMenuItemsByIds } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('delete_menu_items_by_ids', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_menu_items'],
        })
      } else {
        console.log('delete menu items error', data)
      }
    },
  })

  return {
    deleteMenuItemsByIds,
  }
}

export function useDeleteClipImageByItemId() {
  const queryClient = useQueryClient()

  const { mutate: deleteClipImageByItemId } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('delete_image_by_item_by_id', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_menu_items'],
        })
      } else {
        console.log('delete image by item id error', data)
      }
    },
  })

  return {
    deleteClipImageByItemId,
  }
}

export function useDeleteItemsByIds() {
  const queryClient = useQueryClient()

  const { mutate: deleteItemsByIds } = useInvokeMutation<
    { itemIds: UniqueIdentifier[]; collectionId: string | null },
    string
  >('delete_items_by_ids', {
    onSuccess: data => {
      if (data === 'ok') {
        if (newBoardItemId.value) {
          newBoardItemId.value = null
        }
        if (newClipItemId.value) {
          newClipItemId.value = null
        }
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
      } else {
        console.log('delete items error', data)
      }
    },
  })

  return {
    deleteItemsByIds,
  }
}

export function usePinnedClipsByIds() {
  const queryClient = useQueryClient()

  const { mutate: updatePinnedClipsByIds } = useInvokeMutation<
    { itemIds: UniqueIdentifier[]; isPinned: boolean },
    string
  >('update_pinned_items_by_ids', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
      } else {
        console.log('update clip items error', data)
      }
    },
  })

  return {
    updatePinnedClipsByIds,
  }
}

export function useUnpinAllClips() {
  const queryClient = useQueryClient()

  const { mutate: unPinAllClips } = useInvokeMutation<Record<string, unknown>, string>(
    'unpin_all_items_clips',
    {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        } else {
          console.log('unpin all clips error', data)
        }
      },
    }
  )

  return {
    unPinAllClips,
  }
}
export function useMovePinnedClipUpDown() {
  const queryClient = useQueryClient()

  const { mutate: movePinnedClipUpDown } = useInvokeMutation<
    { itemId: UniqueIdentifier; moveUp?: boolean; moveDown?: boolean },
    string
  >('move_pinned_clip_item_up_down', {
    onSuccess: data => {
      if (data === 'ok') {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
      } else {
        console.log('unpin all clips error', data)
      }
    },
  })

  return {
    movePinnedClipUpDown,
  }
}
