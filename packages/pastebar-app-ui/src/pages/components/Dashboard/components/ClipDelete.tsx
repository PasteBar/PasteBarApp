import { useEffect } from 'react'
import { type UniqueIdentifier } from '@dnd-kit/core'
import { collectionsStoreAtom, showDeleteClipConfirmationId } from '~/store'
import { useAtomValue } from 'jotai'
import { Trash } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import {
  Button,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Text,
} from '~/components/ui'

import { useDeleteItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

export function ClipDelete({
  clipId,
  onComplete,
}: {
  clipId: UniqueIdentifier
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const showDeleteConfirmation = useSignal(false)

  const cancelDelete = () => {
    showDeleteConfirmation.value = false
    showDeleteClipConfirmationId.value = null
  }

  useEffect(() => {
    return () => {
      cancelDelete()
    }
  }, [])

  const { currentCollectionId } = useAtomValue(collectionsStoreAtom)
  const { deleteItemById } = useDeleteItemById()
  return (
    <Popover defaultOpen={false} open={showDeleteConfirmation.value}>
      <PopoverAnchor asChild>
        <Button
          variant="ghost"
          title={t('Delete Clip', { ns: 'dashboard' })}
          onClick={() => {
            showDeleteConfirmation.value = true
            showDeleteClipConfirmationId.value = clipId
          }}
          className="px-2 h-7 w-full py-0 text-red-500 dark:!text-red-600 hover:text-red-500 bg-transparent hover:bg-red-100 opacity-80 hover:opacity-100"
        >
          <Trash size={16} />
          <Text className="ml-1 !text-red-500 dark:!text-red-600 !font-medium">
            {t('Delete', { ns: 'common' })}
          </Text>
        </Button>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={16}
        align="center"
        className="p-3 bg-gray-100 border-gray-200 dark:bg-gray-900 dark:border-gray-950 w-60"
        onEscapeKeyDown={() => {
          cancelDelete()
        }}
        onPointerDownOutside={() => {
          cancelDelete()
        }}
      >
        {showDeleteConfirmation.value && (
          <Flex className="flex-col">
            <Text color="black" size="sm" className="!inline-block">
              {t('Are you sure you want to delete?', { ns: 'dashboard' })}
            </Text>
            <Spacer h={3} />
            <Flex>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-500 dark:hover:text-gray-400 hover:text-gray-600 mr-3 border-gray-100 hover:border-gray-200 dark:bg-gray-900 dark:border-gray-900 dark:hover:border-gray-900 dark:hover:bg-gray-800"
                onClick={() => {
                  cancelDelete()
                }}
              >
                {t('Cancel', { ns: 'common' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-100 hover:bg-opacity-80 hover:bg-red-200 text-red-500 hover:text-red-600 border-red-200 dark:bg-red-900 dark:border-red-900 dark:hover:border-red-900 dark:hover:bg-red-800 dark:text-red-300 dark:hover:text-red-200"
                onClick={() => {
                  deleteItemById({
                    itemId: clipId,
                    collectionId: currentCollectionId,
                  })
                  onComplete()
                }}
              >
                {t('Delete Clip', { ns: 'dashboard' })}
              </Button>
            </Flex>
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  )
}
