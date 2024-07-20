import { useMemo } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { Signal } from '@preact/signals-react'
import { invoke } from '@tauri-apps/api'
import { showDeleteMenuItemsConfirmation } from '~/store'
import {
  CopyCheck,
  CopyMinus,
  CopyX,
  Eye,
  EyeOff,
  ListRestart,
  MenuSquare,
  Pointer,
  PointerOff,
  TrashIcon,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Badge, Button, Flex, Shortcut, Text } from '~/components/ui'

import {
  useDeleteMenuItemsByIds,
  useUpdateMenuItemsByIds,
} from '~/hooks/queries/use-items'

import { Item } from '~/types/menu'

type MenuIconMenuProps = {
  selectedItemIds: string[]
  menuItems: Item[]
  onDelete: () => void
  collectionId: UniqueIdentifier | null
  showMultiSelectItems: Signal<boolean>
  deletingMenuItemIds: Signal<string[] | null>
  setSelectedItemIds: (ids: string[]) => void
}

export const MenuIconMenu = ({
  menuItems,
  selectedItemIds,
  onDelete,
  showMultiSelectItems,
  collectionId,
  setSelectedItemIds,
}: MenuIconMenuProps) => {
  const { t } = useTranslation()
  const { deleteMenuItemsByIds } = useDeleteMenuItemsByIds()
  const { updateMenuItemsByIds } = useUpdateMenuItemsByIds()

  useHotkeys(['alt+s'], () => {
    showMultiSelectItems.value = !showMultiSelectItems.value
  })

  useHotkeys(['alt+d'], () => {
    setSelectedItemIds([])
  })

  const selectedItemsWithoutFolders = useMemo(() => {
    return selectedItemIds.filter(id => {
      const menuItem = menuItems.find(({ itemId }) => itemId === id)
      return (
        menuItem &&
        menuItems.filter(({ parentId }) => parentId === menuItem.itemId).length === 0
      )
    })
  }, [selectedItemIds, menuItems])

  const selectedItemsInactive = useMemo(() => {
    return selectedItemIds.filter(id => {
      const menuItem = menuItems.find(({ itemId }) => itemId === id)
      return menuItem && menuItem.isActive === false
    })
  }, [selectedItemIds, menuItems])

  const selectedItemsActive = useMemo(() => {
    return selectedItemIds.filter(id => {
      const menuItem = menuItems.find(({ itemId }) => itemId === id)
      return menuItem && menuItem.isActive === true
    })
  }, [selectedItemIds, menuItems])

  const selectedItemsEnabled = useMemo(() => {
    return selectedItemIds.filter(id => {
      const menuItem = menuItems.find(({ itemId }) => itemId === id)
      return menuItem && menuItem.isDisabled === false
    })
  }, [selectedItemIds, menuItems])

  const selectedItemsDisabled = useMemo(() => {
    return selectedItemIds.filter(id => {
      const menuItem = menuItems.find(({ itemId }) => itemId === id)
      return menuItem && menuItem.isDisabled === true
    })
  }, [selectedItemIds, menuItems])

  return (
    <DropdownMenu onOpenChange={() => {}}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="light"
          id="menu-icon-menu-button_tour"
          className="w-10 text-slate-400 hover:text-slate-500 hover:dark:text-slate-400 dark:text-slate-500 bg-slate-100 p-1 relative hover:bg-slate-100/70 dark:bg-slate-900 dark:hover:bg-slate-700/70"
        >
          <MenuSquare className="stroke-[1.3px]" size={22} />
          {selectedItemIds.length > 1 && (
            <Badge variant="slate" className="absolute right-[-10px] top-[-10px]">
              {selectedItemIds.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={10}
        align="start"
        shadow="shadow-[0_-2px_12px_0_rgb(0,0,0,0.1)]"
      >
        <DropdownMenuGroup>
          {showMultiSelectItems.value ? (
            <DropdownMenuItem
              onClick={() => {
                showMultiSelectItems.value = false
              }}
            >
              <CopyX className="mr-2 h-4 w-4" />
              <Text>{t('Hide Muli Select', { ns: 'common' })}</Text>
              <DropdownMenuShortcut>
                <Shortcut keys="ALT+S" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                showMultiSelectItems.value = true
              }}
            >
              <CopyCheck className="mr-2 h-4 w-4" />
              <Text className="mr-2">{t('Multi Select', { ns: 'common' })}</Text>
              <DropdownMenuShortcut>
                <Shortcut keys="ALT+S" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={selectedItemIds.length === 0}
            onClick={() => {
              setSelectedItemIds([])
            }}
          >
            <CopyMinus className="mr-2 h-4 w-4" />
            <Text className="mr-1">{t('Deselect All', { ns: 'common' })}</Text>
            <DropdownMenuShortcut>
              <Shortcut keys="ALT+D" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              invoke('build_system_menu')
            }}
          >
            <ListRestart className="mr-2 h-4 w-4" />
            <Text className="mr-1">{t('Rebuild Menu', { ns: 'common' })}</Text>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {selectedItemsDisabled.length > 0 && (
            <DropdownMenuItem
              onClick={async () => {
                await updateMenuItemsByIds({
                  updatedData: {
                    isDisabled: false,
                  },
                  itemIds: selectedItemIds,
                })
                setSelectedItemIds([])
                showMultiSelectItems.value = false
              }}
            >
              <Pointer className="mr-2 h-4 w-4" />
              <Text className="mr-1">{t('Make Enabled', { ns: 'common' })}</Text>
              <Badge variant="slate" className="ml-1 py-0 font-semibold">
                {selectedItemsDisabled.length}
              </Badge>
            </DropdownMenuItem>
          )}

          {selectedItemsEnabled.length > 0 && (
            <DropdownMenuItem
              onClick={async () => {
                await updateMenuItemsByIds({
                  updatedData: {
                    isActive: false,
                  },
                  itemIds: selectedItemIds,
                })
                setSelectedItemIds([])
                showMultiSelectItems.value = false
              }}
            >
              <PointerOff className="mr-2 h-4 w-4" />
              <Text className="mr-1">{t('Make Disabled', { ns: 'common' })}</Text>
              <Badge variant="slate" className="ml-1 py-0 font-semibold">
                {selectedItemsEnabled.length}
              </Badge>
            </DropdownMenuItem>
          )}

          {(selectedItemsEnabled.length > 0 || selectedItemsDisabled.length > 0) && (
            <DropdownMenuSeparator />
          )}

          {selectedItemsActive.length > 0 && (
            <DropdownMenuItem
              onClick={async () => {
                await updateMenuItemsByIds({
                  updatedData: {
                    isActive: false,
                  },
                  itemIds: selectedItemIds,
                })
                setSelectedItemIds([])
                showMultiSelectItems.value = false
              }}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              <Text className="mr-1">{t('Make Inactive', { ns: 'common' })}</Text>
              <Badge variant="slate" className="ml-1 py-0 font-semibold">
                {selectedItemsActive.length}
              </Badge>
            </DropdownMenuItem>
          )}

          {selectedItemsInactive.length > 0 && (
            <DropdownMenuItem
              onClick={async () => {
                await updateMenuItemsByIds({
                  updatedData: {
                    isActive: true,
                  },
                  itemIds: selectedItemIds,
                })
                setSelectedItemIds([])
                showMultiSelectItems.value = false
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              <Text className="mr-1">{t('Make Active', { ns: 'common' })}</Text>
              <Badge variant="slate" className="ml-1 py-0 font-semibold">
                {selectedItemsInactive.length}
              </Badge>
            </DropdownMenuItem>
          )}

          {(selectedItemsInactive.length > 0 || selectedItemsActive.length > 0) && (
            <DropdownMenuSeparator />
          )}
          <DropdownMenuItem
            disabled={selectedItemsWithoutFolders.length === 0}
            onClick={async e => {
              if (showDeleteMenuItemsConfirmation.value) {
                await deleteMenuItemsByIds({
                  itemIds: selectedItemsWithoutFolders,
                  collectionId,
                })
                setTimeout(() => {
                  onDelete()
                  setSelectedItemIds([])
                  showMultiSelectItems.value = false
                  showDeleteMenuItemsConfirmation.value = false
                }, 400)
              } else {
                e.preventDefault()
                showDeleteMenuItemsConfirmation.value = true
                setTimeout(() => {
                  showDeleteMenuItemsConfirmation.value = false
                }, 3000)
              }
            }}
          >
            <TrashIcon
              className={`mr-2 h-4 w-4 ${
                showDeleteMenuItemsConfirmation.value
                  ? 'text-red-500 dark:text-red-600'
                  : ''
              }`}
            />
            <Flex>
              <Text
                className={`mr-1 ${
                  showDeleteMenuItemsConfirmation.value
                    ? '!text-red-500 dark:!text-red-600'
                    : ''
                }`}
              >
                {!showDeleteMenuItemsConfirmation.value
                  ? t('Delete', { ns: 'common' })
                  : t('Click to Confirm', { ns: 'common' })}
              </Text>
              {selectedItemsWithoutFolders.length > 0 && (
                <>
                  {showDeleteMenuItemsConfirmation.value ? (
                    <Badge
                      variant="destructive"
                      className="bg-red-500 ml-1 py-0 font-semibold"
                    >
                      {selectedItemsWithoutFolders.length}
                    </Badge>
                  ) : (
                    <Badge variant="slate" className="ml-1 py-0 font-semibold">
                      {selectedItemsWithoutFolders.length}
                    </Badge>
                  )}
                </>
              )}
            </Flex>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
