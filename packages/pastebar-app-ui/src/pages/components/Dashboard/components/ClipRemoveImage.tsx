import { type UniqueIdentifier } from '@dnd-kit/core'
import { showDeleteImageClipConfirmationId } from '~/store'
import { Trash } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import {
  Box,
  Button,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Text,
} from '~/components/ui'

import { useDeleteClipImageByItemId } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

export function ClipRemoveImage({
  id,
  isMenu,
}: {
  id: UniqueIdentifier
  isMenu?: boolean
}) {
  const showDeleteConfirmation = useSignal(false)
  const { t } = useTranslation()

  const cancelDelete = () => {
    showDeleteConfirmation.value = false
    showDeleteImageClipConfirmationId.value = null
  }

  const { deleteClipImageByItemId } = useDeleteClipImageByItemId()
  return (
    <Popover defaultOpen={false} open={showDeleteConfirmation.value}>
      <PopoverAnchor asChild>
        <Box tabIndex={0} className="focus:outline-none">
          <ToolTip
            text={t('Remove image', { ns: 'dashboard' })}
            isCompact
            side="bottom"
            sideOffset={10}
            asChild
          >
            <Button
              variant="outline"
              size="mini"
              className="p-1.5 border-0 bg-red-50/80 flex items-center justify-center hover:bg-red-50/100"
              onClick={() => {
                showDeleteConfirmation.value = true
                showDeleteImageClipConfirmationId.value = id
              }}
            >
              <Trash size={20} className="text-red-600 cursor-pointer" />
            </Button>
          </ToolTip>
        </Box>
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
            {isMenu ? (
              <Text
                color="black"
                size="sm"
                className="!inline-block text-center mb-2 font-semibold"
              >
                {t('Are you sure you want to remove image from the menu?', {
                  ns: 'menus',
                })}
              </Text>
            ) : (
              <Text
                color="black"
                size="sm"
                className="!inline-block text-center mb-2 font-semibold"
              >
                {t('Are you sure you want to remove image from the clip?', {
                  ns: 'dashboard',
                })}
              </Text>
            )}
            <Text color="black" size="sm" className="italic text-center">
              {t('This action cannot be undone.', { ns: 'dashboard' })}
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
                  deleteClipImageByItemId({
                    itemId: id,
                  })
                  cancelDelete()
                }}
              >
                {t('Remove', { ns: 'common' })}
              </Button>
            </Flex>
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  )
}
