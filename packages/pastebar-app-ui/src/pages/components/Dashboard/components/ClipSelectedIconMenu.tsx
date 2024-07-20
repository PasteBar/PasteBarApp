import { UniqueIdentifier } from '@dnd-kit/core'
import ClipIcon from '~/assets/icons/clip'
import { collectionsStoreAtom, isDeletingSelectedClips, settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import {
  Clipboard,
  ClipboardPaste,
  CopyMinus,
  Pin,
  PinOff,
  Shuffle,
  Star,
  StarOff,
  TrashIcon,
  Waypoints,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Badge, Button, Flex, Text } from '~/components/ui'

import { useDeleteItemsByIds, useUpdateItemByIds } from '~/hooks/queries/use-items'
import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'

type ClipSelectedIconMenuProps = {
  selectedItemIds: UniqueIdentifier[]
  hasPinnedItemsInSelected: boolean
  hasFavoriteItemsInSelected: boolean
  setSelectedItemIds: (ids: UniqueIdentifier[]) => void
}

export const ClipSelectedIconMenu = ({
  selectedItemIds,
  hasPinnedItemsInSelected,
  hasFavoriteItemsInSelected,
  setSelectedItemIds,
}: ClipSelectedIconMenuProps) => {
  const { deleteItemsByIds } = useDeleteItemsByIds()

  const { t } = useTranslation()
  const [, , , runSequencePasteItems] = usePasteClipItem({})
  const [, , runSequenceCopyItems] = useCopyClipItem({})

  const { updateItemByIds } = useUpdateItemByIds()

  const {
    copyPasteSequencePinnedDelay,
    setCopyPasteSequencePinnedDelay,
    copyPasteSequenceIsReversOrder,
    setCopyPasteSequenceIsReversOrder,
  } = useAtomValue(settingsStoreAtom)

  const { currentCollectionId: collectionId } = useAtomValue(collectionsStoreAtom)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="animate-in fade-in">
        <Button
          variant="ghost"
          size="mini"
          className="ml-1 mr-0.5 px-1.5 py-1 w-[32px] h-[32px] bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 bg-opacity-80 text-secondary-foreground/50 cursor-pointer !mt-0 hover:bg-opacity-100 relative rounded-sm"
        >
          <ClipIcon className="w-[24px]" lightingColor="white" />
          {selectedItemIds.length > 0 && (
            <Badge variant="slate" className="absolute left-[-12px] top-[-12px]">
              {selectedItemIds.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-52"
        sideOffset={10}
        align="center"
        shadow="shadow-[0_-2px_12px_0_rgb(0,0,0,0.1)]"
      >
        <DropdownMenuItem
          disabled={selectedItemIds.length === 0}
          onClick={() => {
            setSelectedItemIds([])
          }}
        >
          <CopyMinus className="mr-2 h-4 w-4" />
          <Text className="mr-1">{t('Deselect All', { ns: 'common' })}</Text>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={selectedItemIds.length === 0}
          onClick={async () => {
            await runSequenceCopyItems([...selectedItemIds])
            setSelectedItemIds([])
          }}
        >
          <Clipboard className="mr-2 h-4 w-4" />
          <Text className="mr-1">{t('Sequence Copy', { ns: 'common' })}</Text>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={selectedItemIds.length === 0}
          onClick={async () => {
            await runSequencePasteItems([...selectedItemIds])
            setSelectedItemIds([])
          }}
        >
          <ClipboardPaste className="mr-2 h-4 w-4" />
          <Text className="mr-1">{t('Sequence Paste', { ns: 'common' })}</Text>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Flex className="flex w-full">
              <Waypoints className="mr-2 h-4 w-4" />
              <Text>{t('Next Delay', { ns: 'common' })}</Text>
              <Badge variant="slate" className="ml-auto py-0 bg-slate-200 text-slate-500">
                {copyPasteSequencePinnedDelay}s
              </Badge>
            </Flex>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem
              className="text-center items-center justify-center py-0.5"
              disabled
            >
              {t('Sequence Next Delay', { ns: 'common' })}
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequencePinnedDelay === 1}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequencePinnedDelay(1)
              }}
            >
              <Text>1 {t('second', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequencePinnedDelay === 2}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequencePinnedDelay(2)
              }}
            >
              <Text>2 {t('seconds', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequencePinnedDelay === 3}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequencePinnedDelay(3)
              }}
            >
              <Text>3 {t('seconds', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequencePinnedDelay === 4}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequencePinnedDelay(4)
              }}
            >
              <Text>4 {t('seconds', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequencePinnedDelay === 5}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequencePinnedDelay(5)
              }}
            >
              <Text>5 {t('seconds', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequencePinnedDelay === 10}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequencePinnedDelay(10)
              }}
            >
              <Text>10 {t('seconds', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Flex className="flex w-full">
              <Shuffle className="mr-2 h-4 w-4" />
              <Text>{t('Reverse Order', { ns: 'common' })}...</Text>
              <Badge className="ml-auto py-0 bg-slate-200 text-slate-500" variant="slate">
                {copyPasteSequenceIsReversOrder ? 'Yes' : 'No'}
              </Badge>
            </Flex>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem
              className="text-center items-center justify-center py-0.5"
              disabled
            >
              <Text>{t('Sequence Reverse Order', { ns: 'common' })}</Text>
            </DropdownMenuItem>

            <DropdownMenuCheckboxItem
              checked={!copyPasteSequenceIsReversOrder}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequenceIsReversOrder(false)
              }}
            >
              <Text>{t('No', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={copyPasteSequenceIsReversOrder}
              onSelect={e => {
                e.preventDefault()
                setCopyPasteSequenceIsReversOrder(true)
              }}
            >
              <Text>{t('Yes', { ns: 'common' })}</Text>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            updateItemByIds({
              updatedData: {
                isPinned: true,
              },
              itemIds: selectedItemIds,
            })
            setSelectedItemIds([])
          }}
        >
          <Pin className="mr-2 h-4 w-4" />
          <Text>{t('Pin Selected', { ns: 'common' })}</Text>
        </DropdownMenuItem>

        {hasPinnedItemsInSelected && (
          <DropdownMenuItem
            onClick={() => {
              updateItemByIds({
                updatedData: {
                  isPinned: false,
                },
                itemIds: selectedItemIds,
              })
              setSelectedItemIds([])
            }}
          >
            <PinOff className="mr-2 h-4 w-4" />
            <Text>{t('UnPin Selected', { ns: 'common' })}</Text>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            updateItemByIds({
              updatedData: {
                isFavorite: true,
              },
              itemIds: selectedItemIds,
            })
            setSelectedItemIds([])
          }}
        >
          <Star className="mr-2 h-4 w-4" />
          <Text>{t('Star Selected', { ns: 'common' })}</Text>
        </DropdownMenuItem>
        {hasFavoriteItemsInSelected && (
          <DropdownMenuItem
            onClick={() => {
              updateItemByIds({
                updatedData: {
                  isFavorite: false,
                },
                itemIds: selectedItemIds,
              })
              setSelectedItemIds([])
            }}
          >
            <StarOff className="mr-2 h-4 w-4" />
            <Text>{t('Remove Selected Star', { ns: 'common' })}</Text>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={selectedItemIds.length === 0}
          onClick={async e => {
            if (isDeletingSelectedClips.value) {
              await deleteItemsByIds({ itemIds: selectedItemIds, collectionId })
              setTimeout(() => {
                setSelectedItemIds([])
                isDeletingSelectedClips.value = false
              }, 400)
            } else {
              e.preventDefault()
              isDeletingSelectedClips.value = true
              setTimeout(() => {
                isDeletingSelectedClips.value = false
              }, 3000)
            }
          }}
        >
          <TrashIcon
            className={`mr-2 h-4 w-4 ${
              isDeletingSelectedClips.value ? 'text-red-500' : ''
            }`}
          />
          <Flex className="text-red-400">
            <Text
              className={`mr-1 ${isDeletingSelectedClips.value ? '!text-red-500' : ''}`}
            >
              {!isDeletingSelectedClips.value
                ? t('Delete', { ns: 'common' })
                : t('Click to Confirm', { ns: 'common' })}
            </Text>
            {selectedItemIds.length > 0 && (
              <>
                {isDeletingSelectedClips.value ? (
                  <Badge
                    variant="destructive"
                    className="bg-red-500 ml-1 py-0 font-semibold"
                  >
                    {selectedItemIds.length}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-slate-200 text-slate-500 ml-1 py-0 font-semibold"
                  >
                    {selectedItemIds.length}
                  </Badge>
                )}
              </>
            )}
          </Flex>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
