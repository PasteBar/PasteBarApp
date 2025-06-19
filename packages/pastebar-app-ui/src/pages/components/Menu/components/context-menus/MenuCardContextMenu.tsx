import { Signal } from '@preact/signals-react'
import createMenuTree from '~/libs/create-menu-tree'
import {
  collectionsStoreAtom,
  isCreatingMenuItem,
  isMenuNameEditing,
  showDeleteMenuConfirmationId,
  showEditClipId,
  showEditMenuItemId,
  showLinkedClipId,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  CheckSquare2,
  ClipboardEdit,
  Copy,
  Eye,
  EyeOff,
  Locate,
  Pencil,
  PlusSquare,
  Pointer,
  PointerOff,
  TrashIcon,
  XSquare,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { findNewChildrenOrderByParentIdAndDragIds } from '~/lib/utils'

import {
  Box,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  Flex,
  Text,
} from '~/components/ui'

import { useUpdateMovedMenuItemsInCollection } from '~/hooks/queries/use-collections'
import {
  useDeleteMenuItemById,
  useDuplicateMenuItem,
  useUpdateMenuItemById,
} from '~/hooks/queries/use-items'

interface MenuCardContextMenuProps {
  id: string
  itemParentId: string | null
  itemOrderNumber: number
  isSelected: boolean | undefined
  isDisabled: boolean | undefined
  isActive: boolean | undefined
  isFolder: boolean | undefined
  isOpen: boolean | undefined
  isImage: boolean | undefined
  isClip: boolean | undefined
  isSeparator: boolean | undefined
  setOpenItemId?: (id: string | null) => void
  hasChildren: boolean | undefined
  deletingMenuItemIds: Signal<string[] | null>
  deselectItemById?: (id: string) => void
  setSelectedItemIds?: (ids: string[]) => void
  selectItemById?: (id: string) => void
}

export default function MenuCardContextMenu({
  id,
  isSelected,
  deletingMenuItemIds,
  itemParentId,
  isDisabled,
  isImage,
  isClip,
  isSeparator,
  isActive,
  isFolder,
  isOpen,
  setOpenItemId,
  itemOrderNumber,
  hasChildren,
  deselectItemById,
  setSelectedItemIds,
  selectItemById,
}: MenuCardContextMenuProps) {
  const { t } = useTranslation()
  const { duplicateMenuItem } = useDuplicateMenuItem()
  const { deleteMenuItemById } = useDeleteMenuItemById()
  const { updateMenuItemById } = useUpdateMenuItemById()
  const { updateMovedMenuItems } = useUpdateMovedMenuItemsInCollection()
  const navigate = useNavigate()

  const { menuItems, currentCollectionId } = useAtomValue(collectionsStoreAtom)

  return (
    <ContextMenuPortal>
      <ContextMenuContent className="w-[150px]">
        {!isActive ? (
          <>
            <ContextMenuItem disabled className="flex justify-center py-0">
              {t('Menu is Not Active', { ns: 'contextMenus' })}
            </ContextMenuItem>
            <ContextMenuSeparator />

            <ContextMenuItem
              onClick={() => {
                updateMenuItemById({
                  updatedItem: {
                    itemId: id,
                    isActive: true,
                  },
                })
              }}
            >
              {t('Activate', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <Eye size={15} className="ml-auto" />
              </div>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : isClip ? (
          <>
            <ContextMenuItem disabled className="flex justify-center py-0">
              {t('Link To Clip', { ns: 'contextMenus' })}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : isFolder ? (
          <>
            <ContextMenuItem disabled className="flex justify-center py-0">
              {t('Submenu', { ns: 'contextMenus' })}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : isSeparator ? (
          <>
            <ContextMenuItem disabled className="flex justify-center py-0">
              {t('Separator', { ns: 'contextMenus' })}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : (
          <>
            <ContextMenuItem disabled className="flex justify-center py-0">
              {t('Menu', { ns: 'contextMenus' })}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {!isSelected ? (
          <ContextMenuItem
            onClick={() => {
              selectItemById?.(id)
            }}
          >
            {t('Select', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <CheckSquare2 size={15} />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onClick={() => {
              deselectItemById?.(id)
            }}
          >
            {t('Deselect', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <XSquare size={15} />
            </div>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />
        {showEditMenuItemId.value !== id && !isClip && (
          <ContextMenuItem
            disabled={!isActive || isCreatingMenuItem.value}
            onClick={() => {
              showEditMenuItemId.value = id
              isMenuNameEditing.value = true
            }}
          >
            {t('Edit Label', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <Pencil size={14} />
            </div>
          </ContextMenuItem>
        )}

        {!isClip && !isFolder && showEditMenuItemId.value !== id && (
          <ContextMenuItem
            disabled={!isActive || isCreatingMenuItem.value}
            onClick={() => {
              showEditMenuItemId.value = id
            }}
          >
            {!isImage
              ? t('Edit Value', { ns: 'contextMenus' })
              : t('Edit Image', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <ClipboardEdit size={15} />
            </div>
          </ContextMenuItem>
        )}

        {isClip && (
          <>
            <ContextMenuItem
              disabled={!isActive || isCreatingMenuItem.value}
              onClick={() => {
                showEditClipId.value = id
                showLinkedClipId.value = id
                navigate('/history', { replace: true })
              }}
            >
              {t('Edit Clip', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <ClipboardEdit size={15} />
              </div>
            </ContextMenuItem>

            <ContextMenuItem
              disabled={!isActive || isCreatingMenuItem.value}
              onClick={() => {
                showLinkedClipId.value = id
                navigate('/history', { replace: true })
              }}
            >
              {t('Locate Clip', { ns: 'contextMenus' })}
              <div className="ml-auto">
                <Locate size={15} />
              </div>
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          disabled={!isActive}
          onClick={async () => {
            setSelectedItemIds && setSelectedItemIds([id])
            isCreatingMenuItem.value = true
          }}
        >
          {t('Add New Item', { ns: 'contextMenus' })}
          <div className="ml-auto pl-3">
            <PlusSquare size={15} />
          </div>
        </ContextMenuItem>

        {!isClip && (
          <ContextMenuItem
            disabled={!isActive}
            onClick={async () => {
              if (!currentCollectionId) {
                return
              }

              const newMenuId = await duplicateMenuItem({
                itemId: id,
                parentId: itemParentId ?? null,
                orderNumber: itemOrderNumber + 2,
                collectionId: currentCollectionId,
              })

              const newMenuTree = createMenuTree(menuItems)

              newMenuTree.unshift({
                name:
                  t('Copy of ', { ns: 'common' }) +
                    (newMenuTree.find(item => item.id === id)?.name ?? '') ||
                  t('Menu', { ns: 'common' }),
                parentId: itemParentId ?? null,
                orderNumber: itemOrderNumber + 2,
                id: newMenuId,
              })

              const newFolderItemsOrder = findNewChildrenOrderByParentIdAndDragIds(
                newMenuTree,
                itemParentId ?? null,
                [newMenuId],
                itemOrderNumber + 2
              )

              const updatedMoveMenuItems = newFolderItemsOrder?.map(
                ({ id, parentId, orderNumber }) => ({
                  itemId: id,
                  parentId,
                  tabId: null,
                  collectionId: currentCollectionId,
                  orderNumber,
                })
              )

              updateMovedMenuItems({ updatedMoveMenuItems })
            }}
          >
            {t('Duplicate', { ns: 'contextMenus' })}
            <div className="ml-auto pl-3">
              <Copy size={15} />
            </div>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {isDisabled ? (
          <ContextMenuItem
            disabled={!isActive}
            onClick={() => {
              updateMenuItemById({
                updatedItem: {
                  itemId: id,
                  isDisabled: false,
                },
              })
            }}
          >
            {t('Make Enabled', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <Pointer size={15} className="ml-auto" />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            disabled={!isActive}
            onClick={() => {
              updateMenuItemById({
                updatedItem: {
                  itemId: id,
                  isDisabled: true,
                },
              })
              if (isOpen) {
                setOpenItemId?.(null)
              }
            }}
          >
            {t('Make Disabled', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <PointerOff size={15} className="ml-auto" />
            </div>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {isActive && (
          <ContextMenuItem
            onClick={() => {
              updateMenuItemById({
                updatedItem: {
                  itemId: id,
                  isActive: false,
                },
              })
              if (isOpen) {
                setOpenItemId?.(null)
              }
            }}
          >
            {t('Make Inactive', { ns: 'contextMenus' })}
            <div className="ml-auto">
              <EyeOff size={15} className="ml-auto" />
            </div>
          </ContextMenuItem>
        )}

        <Box className="group">
          <ContextMenuItem
            className={
              showDeleteMenuConfirmationId.value === id
                ? '!bg-red-100 dark:!bg-red-900'
                : ''
            }
            onClick={e => {
              if (showDeleteMenuConfirmationId.value === id) {
                deleteMenuItemById({
                  itemId: id,
                  collectionId: currentCollectionId,
                })

                deletingMenuItemIds.value =
                  deletingMenuItemIds.value?.filter(deletingId => deletingId !== id) ?? []
                deselectItemById?.(id)
                showDeleteMenuConfirmationId.value === null
              } else {
                e.preventDefault()
                showDeleteMenuConfirmationId.value = id
                deletingMenuItemIds.value = deletingMenuItemIds.value
                  ? [...deletingMenuItemIds.value, id]
                  : [id]
                setTimeout(() => {
                  showDeleteMenuConfirmationId.value = null
                  deletingMenuItemIds.value =
                    deletingMenuItemIds.value?.filter(deletingId => deletingId !== id) ??
                    []
                }, 3000)
              }
            }}
          >
            <Box>
              <Flex>
                <Text className="!text-red-500">
                  {showDeleteMenuConfirmationId.value !== id
                    ? t('Delete', { ns: 'common' })
                    : t('Click to Confirm', { ns: 'common' })}
                </Text>
                {!showDeleteMenuConfirmationId.value && (
                  <div className="ml-auto pl-3">
                    <TrashIcon size={15} className="!text-red-500" />
                  </div>
                )}
              </Flex>
              {hasChildren && (
                <Box className="p-0">
                  <Text className="!text-gray-400/80 text-[10px] group-hover:!text-amber-500">
                    {t('Submenus will move up one level after delete', { ns: 'common2' })}
                  </Text>
                </Box>
              )}
            </Box>
          </ContextMenuItem>
        </Box>
      </ContextMenuContent>
    </ContextMenuPortal>
  )
}
