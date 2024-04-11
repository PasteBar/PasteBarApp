import { useQueryClient } from '@tanstack/react-query'
import { collectionsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

import { useInvokeMutation } from './use-invoke'

export function useUpdateTabById() {
  const queryClient = useQueryClient()

  const { mutate: updateTabById } = useInvokeMutation<Record<string, unknown>, string>(
    'update_tab',
    {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        } else {
          console.log('update tab error', data)
        }
      },
    }
  )

  return {
    updateTabById,
  }
}

export function useUpdateTabs() {
  const queryClient = useQueryClient()

  const { mutate: updateTabs } = useInvokeMutation<Record<string, unknown>, string>(
    'update_tabs',
    {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        } else {
          console.log('update tab error', data)
        }
      },
    }
  )

  return {
    updateTabs,
  }
}

export function useCreateTab() {
  const queryClient = useQueryClient()
  const { setCurrentTab } = useAtomValue(collectionsStoreAtom)

  const { mutate: createNewTab, isSuccess: createNewTabSuccess } = useInvokeMutation<
    Record<string, unknown>,
    string
  >('create_tab', {
    onSuccess: data => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ['get_active_collection_with_clips'],
        })
        setTimeout(() => {
          setCurrentTab(data)
        }, 100)
      } else {
        console.log('create tab error', data)
      }
    },
  })

  return {
    createNewTab,
    createNewTabSuccess,
  }
}

export function useDeleteTabById() {
  const queryClient = useQueryClient()

  const { mutate: deleteItemById } = useInvokeMutation<Record<string, unknown>, string>(
    'delete_tab',
    {
      onSuccess: data => {
        if (data === 'ok') {
          queryClient.invalidateQueries({
            queryKey: ['get_active_collection_with_clips'],
          })
        } else {
          console.log('delete tab error', data)
        }
      },
    }
  )

  return {
    deleteItemById,
  }
}
