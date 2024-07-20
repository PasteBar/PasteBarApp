import { type UniqueIdentifier } from '@dnd-kit/core'
import { collectionsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { Trash } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

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

export function BoardDelete({
  boardName,
  boardId,
}: {
  boardName: string
  isNewBoard: boolean
  boardId: UniqueIdentifier
}) {
  const { t } = useTranslation()
  const deleteError = useSignal(false)
  const showDeleteConfirmation = useSignal(false)

  const { currentCollectionId, isBoardHasChildren } = useAtomValue(collectionsStoreAtom)
  const { deleteItemById } = useDeleteItemById()
  return (
    <Popover defaultOpen={false} open={showDeleteConfirmation.value || deleteError.value}>
      <PopoverAnchor asChild>
        <Button
          variant="light"
          title={t('Delete board', { ns: 'dashboard' })}
          onClick={() => {
            if (isBoardHasChildren(boardId)) {
              deleteError.value = true
            } else {
              showDeleteConfirmation.value = true
            }
          }}
          className={`px-2.5 ${
            isBoardHasChildren(boardId)
              ? 'text-primary/30 hover:text-primary/50 hover:bg-amber-100 dark:hover:bg-amber-900'
              : 'text-red-400  hover:text-red-500 hover:bg-red-100 dark:text-red-600 dark:hover:bg-red-900 opacity-80 hover:opacity-100'
          } animate-in fade-in bg-gray-50 cursor-pointer`}
        >
          <Trash size={16} />
        </Button>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={16}
        align="center"
        className={`p-3 ${
          deleteError.value
            ? 'bg-amber-100 border-amber-200 dark:bg-yellow-800 dark:border-gray-900'
            : 'bg-gray-100 border-gray-200 dark:bg-gray-900 dark:border-gray-950'
        } w-60`}
        onEscapeKeyDown={() => {
          showDeleteConfirmation.value = false
          deleteError.value = false
        }}
        onPointerDownOutside={() => {
          showDeleteConfirmation.value = false
          deleteError.value = false
        }}
      >
        {deleteError.value ? (
          <Flex className="flex-col">
            <Text justify="left" size="md" weight="bold" color="waning">
              {t('Board is Not Empty', { ns: 'dashboard' })}
            </Text>
            <Spacer h={1} />
            <Text color="black" size="sm">
              {t(
                "You'll need to clear this board of all clips and subboards before it can be deleted.",
                { ns: 'dashboard' }
              )}
            </Text>
            <Spacer h={3} />
            <Button
              variant="secondary"
              size="mini"
              className="py-1 px-4 bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700/80"
              onClick={() => {
                deleteError.value = false
              }}
            >
              {t('Got it', { ns: 'common' })}
            </Button>
          </Flex>
        ) : (
          showDeleteConfirmation.value && (
            <Flex className="flex-col">
              <Text color="black" size="sm" className="!inline-block text-center">
                <Trans
                  i18nKey="Are you sure you want to delete <strong>{{boardName}}</strong> board?"
                  values={{ boardName }}
                  ns="dashboard"
                />
              </Text>
              <Spacer h={3} />
              <Flex>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-500 dark:hover:text-gray-400 hover:text-gray-600 mr-3 border-gray-100 hover:border-gray-200 dark:bg-gray-900 dark:border-gray-900 dark:hover:border-gray-900 dark:hover:bg-gray-800"
                  onClick={() => {
                    showDeleteConfirmation.value = false
                  }}
                >
                  {t('Cancel', { ns: 'common' })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-100 whitespace-nowrap hover:bg-opacity-80 hover:bg-red-200 text-red-500 hover:text-red-600 border-red-200 dark:bg-red-900 dark:border-red-900 dark:hover:border-red-900 dark:hover:bg-red-800 dark:text-red-300 dark:hover:text-red-200"
                  onClick={() => {
                    deleteItemById({
                      itemId: boardId,
                      collectionId: currentCollectionId,
                    })
                  }}
                >
                  {t('Delete Board', { ns: 'dashboard' })}
                </Button>
              </Flex>
            </Flex>
          )
        )}
      </PopoverContent>
    </Popover>
  )
}
