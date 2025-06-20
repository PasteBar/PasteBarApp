import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import { message } from '@tauri-apps/api/dialog'
import { MainContainer } from '~/layout/Layout'
import createMenuTree from '~/libs/create-menu-tree'
import {
  collectionsStoreAtom,
  creatingNewMenuItem,
  isCreatingMenuItem,
  isMenuNameEditing,
  MAX_MENU_LABEL_LENGTH,
  resetMenuCreateOrEdit,
  settingsStoreAtom,
  showEditMenuItemId,
  showLinkedMenuId,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { Eye, EyeOff, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import { findNewChildrenOrderByParentIdAndDragIds } from '~/lib/utils'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import { Tree, useDynamicTree } from '~/components/libs/react-arborist'
import SimpleBar from '~/components/libs/simplebar-react'
import {
  SplitPanePrimary,
  SplitPaneSecondary,
  SplitView,
} from '~/components/libs/split-view'
import CollectionsDropDown from '~/components/molecules/collections-dropdown'
import {
  MenuCursor,
  MenuDragPreview,
  MenuNode,
  MenuRow,
  MenuTreeContainer,
} from '~/components/organisms/menu-tree'
import {
  Accordion,
  AccordionItem,
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Text,
} from '~/components/ui'

import {
  useGetCollections,
  useGetCollectionWithClips,
  useGetCollectionWithMenuItems,
  useUpdateMovedMenuItemsInCollection,
} from '~/hooks/queries/use-collections'
import {
  useCreateItem,
  useLinkClipIdToMenuItem,
  useUpdateMenuItemById,
} from '~/hooks/queries/use-items'
import { useDebounce } from '~/hooks/use-debounce'
import { useSignal } from '~/hooks/use-signal'

import { CreateItemType, CreateMenuItem, Item, MenuItem } from '~/types/menu'

import MenuAddMenu from '../components/Menu/components/MenuAddMenu'
import MenuCardMain from '../components/Menu/components/MenuCardMain'
import { MenuIconMenu } from '../components/Menu/components/MenuIconMenu'
import MenuCollapsibleItem from '../components/Menu/MenuItem'

export default function PasteMenuPage() {
  useGetCollections()
  useGetCollectionWithClips()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { updateMenuItemById } = useUpdateMenuItemById()
  const { isSwapPanels, setReturnRoute, setPanelSize, panelSize, getDefaultPanelWidth } =
    useAtomValue(uiStoreAtom)

  const { updateMovedMenuItems } = useUpdateMovedMenuItemsInCollection()
  const { isCollectionWithItemLoading, isCollectionWithItemSuccess } =
    useGetCollectionWithMenuItems()
  const { currentCollectionId, menuItems, isMenuLoaded, getCurrentCollectionTitle } =
    useAtomValue(collectionsStoreAtom)
  const { data, setData } = useDynamicTree()
  const { themeDark } = useAtomValue(themeStoreAtom)
  const { isSimplifiedLayout } = useAtomValue(settingsStoreAtom)

  const [term, setTerm] = useState('')
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState([''])
  const [closedFolderItemIds, setClosedFolderItemIds] = useState([''])

  const { createNewItem } = useCreateItem(false)
  const { linkClipIdToMenuItem } = useLinkClipIdToMenuItem(false)

  const debouncedSearchTerm = useDebounce(term, 300)

  const deletingMenuItemIds = useSignal<string[] | null>(null)
  const showMultiSelectItems = useSignal(false)
  const showNotActiveMenuItems = useSignal(false)
  const searchMenuInputRef = useRef<HTMLInputElement | null>(null)
  const scollToRef = useRef<HTMLDivElement>(null)
  const isDark = themeDark()

  const menuFullyLoaded = useMemo(() => {
    return isMenuLoaded && !isCollectionWithItemLoading && isCollectionWithItemSuccess
  }, [isMenuLoaded, isCollectionWithItemLoading, isCollectionWithItemSuccess])

  const showNotActiveMenuItemsValue = useMemo(
    () => showNotActiveMenuItems.value,
    [showNotActiveMenuItems.value]
  )

  const activeMenuItems = useMemo(() => {
    return menuItems.filter(item => item.isActive)
  }, [menuItems])

  useEffect(() => {
    setReturnRoute(location.pathname)
    resetMenuCreateOrEdit()
  }, [])

  useEffect(() => {
    if (showEditMenuItemId?.value) {
      const isFolder = menuItems?.find(
        ({ itemId }) => itemId === showEditMenuItemId.value
      )?.isFolder
      if (!isFolder && !isMenuNameEditing.value) {
        setOpenItemId(showEditMenuItemId.value)
      }
    }
  }, [showEditMenuItemId?.value, isMenuNameEditing.value])

  useEffect(() => {
    setData(
      menuItems.length > 0
        ? createMenuTree(menuItems, null, showNotActiveMenuItemsValue)
        : []
    )
  }, [menuItems, showNotActiveMenuItemsValue])

  const inactiveMenuItems = useMemo(() => {
    return menuItems.filter(item => !item.isActive)
  }, [menuItems])

  const orderedMenuItems = useMemo(() => {
    const hasMatchingDescendant = (item: Item) => {
      if (item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
        return true
      }
      return item.children?.some(hasMatchingDescendant) ?? false
    }

    const flattenTree = (tree: Item[], depth = 0): Item[] => {
      let flatList: Item[] = []

      tree.forEach(item => {
        const isMatchOrHasMatchingDescendant = hasMatchingDescendant(item)

        const menuItemFound = menuItems.find(menuItem => menuItem.itemId === item.id)

        if (menuItemFound && isMatchOrHasMatchingDescendant) {
          const newItem = {
            ...menuItemFound,
            indent: depth,
            id: item.id,
            hasChildren: item.children && item.children.length > 0,
          }
          flatList.push(newItem)

          if (
            item.children &&
            item.children?.length > 0 &&
            !closedFolderItemIds.includes(item.id ?? '')
          ) {
            const childrenFlatList = flattenTree(item.children, depth + 1)
            flatList = flatList.concat(childrenFlatList)
          }
        }
      })

      return flatList
    }

    return flattenTree(data as Item[])
  }, [
    data,
    menuItems,
    closedFolderItemIds,
    showNotActiveMenuItemsValue,
    debouncedSearchTerm,
  ])

  useEffect(() => {
    async function doCreateNewMenuItem() {
      if (creatingNewMenuItem.value) {
        const {
          type,
          parentId,
          clipId,
          historyId,
          text = '',
          clipboardHistoryItem,
          orderNumber = 0,
        } = creatingNewMenuItem.value as CreateMenuItem

        const nameFromMetadata = clipboardHistoryItem?.linkMetadata?.linkTitle
        const newName = nameFromMetadata
          ? nameFromMetadata
          : type === CreateItemType.FOLDER
            ? t('New Submenu', { ns: 'menus' })
            : type === CreateItemType.ITEM
              ? t('New Menu', { ns: 'menus' })
              : type === CreateItemType.DISABLED
                ? t('New Disabled Menu', { ns: 'menus' })
                : ''

        const isLinkToClip = clipId ? true : false

        const numberOfNewMenuItem =
          orderedMenuItems.filter(({ name }) => name.startsWith(newName)).length ?? 0

        const isImage = clipboardHistoryItem?.isImage

        const newMenuData =
          historyId && clipboardHistoryItem?.historyId
            ? {
                historyId,
                name: clipboardHistoryItem?.value
                  ? clipboardHistoryItem.value
                      .substring(0, 50)
                      .replace(/\n\t/g, '')
                      .replace(/\s+/g, ' ')
                      .trim()
                  : !isImage
                    ? numberOfNewMenuItem > 0
                      ? `${newName} (${numberOfNewMenuItem})`
                      : newName
                    : `${t('Image size', {
                        ns: 'common',
                      })} (${clipboardHistoryItem?.imageWidth}x${clipboardHistoryItem?.imageHeight})`,
                isClip: false,
                isMenu: true,
                value: '',
                isActive: true,
                description: null,
                detectedLanguage: clipboardHistoryItem?.detectedLanguage ?? null,
                isImage: clipboardHistoryItem?.isImage ?? false,
                imageDataUrl: clipboardHistoryItem?.imageDataUrl ?? null,
                imagePathFullRes: clipboardHistoryItem?.imagePathFullRes ?? null,
                imageHeight: clipboardHistoryItem?.imageHeight ?? null,
                imageWidth: clipboardHistoryItem?.imageWidth ?? null,
                imagePreviewHeight: clipboardHistoryItem?.imagePreviewHeight ?? null,
                isLink: clipboardHistoryItem?.isLink ?? false,
                links: clipboardHistoryItem?.links ?? null,
                isImageData: clipboardHistoryItem?.isImageData ?? false,
                isMasked: clipboardHistoryItem?.isMasked ?? false,
                isVideo: clipboardHistoryItem?.isVideo ?? false,
                isCode: clipboardHistoryItem?.isCode ?? false,
                isText: clipboardHistoryItem?.isText ?? false,
                hasEmoji: clipboardHistoryItem?.hasEmoji ?? false,
                hasMaskedWords: clipboardHistoryItem?.hasMaskedWords ?? false,
                hasMultiLineCopy: false,
                showDescription: false,
                isDeleted: false,
                indent: 0,
                parentId: parentId ?? null,
                tabId: null,
                collectionId: currentCollectionId,
                createdAt: 0,
                orderNumber: orderNumber + 1,
              }
            : {
                name:
                  numberOfNewMenuItem > 0
                    ? `${newName} (${numberOfNewMenuItem})`
                    : newName,
                isClip: isLinkToClip,
                isMenu: true,
                value: text,
                description: null,
                isActive: true,
                isFolder: type === CreateItemType.FOLDER,
                isSeparator: type === CreateItemType.SEPARATOR,
                isDisabled: type === CreateItemType.DISABLED,
                isText: true,
                isDeleted: false,
                indent: 0,
                parentId: parentId ?? null,
                tabId: null,
                collectionId: currentCollectionId,
                createdAt: 0,
                orderNumber: orderNumber + 1,
              }

        const newMenuId = !isLinkToClip
          ? await createNewItem({
              item: newMenuData,
            })
          : await linkClipIdToMenuItem({
              clipId,
              item: newMenuData,
            })

        if (clipboardHistoryItem?.linkMetadata?.metadataId && !isLinkToClip) {
          await invoke('copy_link_metadata_to_new_item_id', {
            metadataId: clipboardHistoryItem.linkMetadata.metadataId,
            itemId: newMenuId,
          })
        }

        const newMenuTree = createMenuTree(menuItems, null, true)

        newMenuTree.unshift({
          ...newMenuData,
          id: newMenuId,
        })

        const newFolderItemsOrder = findNewChildrenOrderByParentIdAndDragIds(
          newMenuTree as MenuItem[],
          parentId ?? null,
          [newMenuId],
          parentId && orderNumber > 0 ? orderNumber - 1 : orderNumber
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

        isCreatingMenuItem.value = false
        creatingNewMenuItem.value = null
        setSelectedItemIds([])
        if (
          CreateItemType.FOLDER !== type &&
          CreateItemType.DISABLED !== type &&
          CreateItemType.SEPARATOR !== type
        ) {
          setOpenItemId(newMenuId)
        }
        if (CreateItemType.SEPARATOR !== type && !isLinkToClip) {
          showEditMenuItemId.value = newMenuId
          isMenuNameEditing.value = true
        }
      }
    }

    doCreateNewMenuItem()
  }, [creatingNewMenuItem.value])

  useEffect(() => {
    if (showLinkedMenuId.value) {
      setOpenItemId(showLinkedMenuId.value)

      setTimeout(() => {
        showLinkedMenuId.value = null
      }, 2000)
    }
  }, [showLinkedMenuId.value, scollToRef?.current])

  useEffect(() => {
    if (scollToRef?.current) {
      scollToRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, [scollToRef?.current])

  return (
    <MainContainer>
      <SplitView
        minSize={260}
        maxSize={700}
        defaultSize={getDefaultPanelWidth()}
        key={isSwapPanels ? 'swap' : 'no-swap'}
        swapPanes={isSwapPanels}
        onResize={setPanelSize}
        autoSaveId="app-main-panel"
      >
        <SplitPanePrimary>
          <Box
            className={`${
              isSimplifiedLayout
                ? 'h-[calc(100vh-40px)]'
                : 'h-[calc(100vh-70px)] shadow-sm rounded-xl'
            } flex flex-col ${
              isSimplifiedLayout
                ? 'bg-slate-200/90 dark:bg-gray-800'
                : 'bg-slate-200/90 dark:bg-gray-800'
            }  dark:border-gray-700 dark:shadow-slate-700/[.8] pb-4 pt-4 px-3 pr-3`}
          >
            <AutoSize disableWidth>
              {({ height }: { height: number }) =>
                height &&
                height > 0 &&
                !isCollectionWithItemLoading &&
                currentCollectionId && (
                  <Box
                    className={`flex flex-col ${
                      isSimplifiedLayout ? 'h-[calc(100vh-70px)]' : 'h-[calc(100vh-95px)]'
                    } relative`}
                    id="side-panel_tour"
                  >
                    {data.length > 0 ? (
                      <Box
                        className="flex flex-row bg-gray-100 dark:bg-gray-700 rounded-md p-0 items-center h-[40px] mb-2"
                        id="menu-find_tour"
                      >
                        <Input
                          placeholder={`${t('Find in menu', { ns: 'menus' })}...`}
                          type="search"
                          ref={searchMenuInputRef}
                          onChange={e => {
                            setTerm(e.target.value)
                          }}
                          iconLeft={<Search className="h-4 w-4" />}
                          classNameInput="w-full pr-0"
                          className="text-md ring-offset-0 bg-gray-100 dark:bg-gray-700 border-r-0 border-t-0 border-b-0"
                        />
                      </Box>
                    ) : (
                      menuFullyLoaded &&
                      menuItems.length === 0 && (
                        <Flex
                          style={{ height: height - 85 }}
                          className="flex items-center flex-col gap-3 justify-center"
                        >
                          <Text className="animate-in fill-mode-forwards fade-in text-slate-300 text-xs bg-slate-100 rounded-full px-3 dark:text-slate-600 dark:bg-slate-900">
                            {t('No Menu Items', { ns: 'menus' })}
                          </Text>
                        </Flex>
                      )
                    )}
                    <SimpleBar
                      style={{
                        maxHeight: isSimplifiedLayout ? height - 5 : height - 93,
                      }}
                      autoHide={true}
                    >
                      <Tree
                        data={data}
                        rowHeight={33}
                        selectedIds={selectedItemIds}
                        closedFolderItemIds={closedFolderItemIds}
                        renderCursor={MenuCursor}
                        renderContainer={MenuTreeContainer}
                        renderDragPreview={MenuDragPreview}
                        onMove={({ dragIds, index: orderNumber, parentId }) => {
                          const newFolderItemsOrder =
                            findNewChildrenOrderByParentIdAndDragIds(
                              data as MenuItem[],
                              parentId,
                              dragIds as string[],
                              orderNumber
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
                        onSelect={e => {
                          const newSelectedIds = e.map(i => i.id)
                          const hasSameElements =
                            newSelectedIds.length === selectedItemIds.length &&
                            newSelectedIds.every(id => selectedItemIds.includes(id))

                          if (!hasSameElements) {
                            setSelectedItemIds(newSelectedIds)
                          }
                        }}
                        onFolderClose={id => {
                          setClosedFolderItemIds(prev => [...prev, id])
                        }}
                        onFolderOpen={id => {
                          setClosedFolderItemIds(prev => prev.filter(i => i !== id))
                        }}
                        onRename={async ({ id, name }) => {
                          if (name.length < 1) {
                            await message(
                              t('Menu label cannot be empty.', { ns: 'menus' }),
                              'PasteBar'
                            )
                            return
                          }
                          if (name.length > MAX_MENU_LABEL_LENGTH) {
                            await message(
                              `${t('Menu label is too long. Max length is', {
                                ns: 'menus',
                              })} ${MAX_MENU_LABEL_LENGTH}.`,
                              'PasteBar'
                            )
                            return
                          }

                          const isClip = menuItems.find(
                            menuItem => menuItem.itemId === id
                          )?.isClip

                          if (isClip) {
                            await message(
                              t(
                                'Menu is link to a clip and cannot be renamed. Please rename its linked clip.',
                                {
                                  ns: 'menus',
                                }
                              ),
                              'PasteBar'
                            )
                            return
                          }

                          await updateMenuItemById({
                            updatedItem: {
                              itemId: id,
                              name,
                            },
                          })
                        }}
                        onSearchClear={() => {
                          setTerm('')
                          if (searchMenuInputRef?.current) {
                            searchMenuInputRef.current.value = ''
                            searchMenuInputRef?.current?.focus()
                          }
                        }}
                        searchMatch={(node, searchTerm) => {
                          const name = node.data.name
                          if (typeof name === 'string') {
                            return name.toLowerCase().includes(searchTerm.toLowerCase())
                          } else return false
                        }}
                        renderRow={MenuRow}
                        searchTerm={debouncedSearchTerm}
                        disableDrop={() => {
                          return false
                        }}
                      >
                        {MenuNode}
                      </Tree>
                      {!debouncedSearchTerm &&
                        activeMenuItems.length > 1 &&
                        data.length > 0 && (
                          <Text className="!text-gray-400/80 border-t border-gray-300/70 dark:border-gray-600/70 !block text-center !text-[12px] mt-2 pt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            {t('Drag items to reorder, double click to rename', {
                              ns: 'menus',
                            })}
                          </Text>
                        )}
                    </SimpleBar>
                    <Box className="flex-1 mt-3" />
                    <Tabs
                      className="min-w-full flex flex-row justify-center h-10 items-center gap-2"
                      value={location.pathname}
                      onValueChange={pathname => {
                        navigate(pathname, { replace: true })
                      }}
                    >
                      <TabsList
                        className="self-center bg-transparent"
                        id="tabs-menu_tour"
                      >
                        <TabsTrigger value="/history" className="min-w-[90px]">
                          {panelSize < getDefaultPanelWidth()
                            ? t('History', { ns: 'common' })
                            : t('Clipboard History', { ns: 'common' })}
                        </TabsTrigger>
                        <TabsTrigger value="/menu" className="min-w-[90px]">
                          {panelSize < getDefaultPanelWidth()
                            ? t('Menu', { ns: 'common' })
                            : t('Paste Menu', { ns: 'common' })}
                        </TabsTrigger>
                      </TabsList>

                      <MenuIconMenu
                        deletingMenuItemIds={deletingMenuItemIds}
                        menuItems={menuItems}
                        collectionId={currentCollectionId}
                        onDelete={() => {
                          setTerm('')
                          if (
                            searchMenuInputRef?.current &&
                            searchMenuInputRef.current.value
                          ) {
                            searchMenuInputRef.current.value = ''
                            searchMenuInputRef?.current?.focus()
                          }
                        }}
                        showMultiSelectItems={showMultiSelectItems}
                        setSelectedItemIds={setSelectedItemIds}
                        selectedItemIds={selectedItemIds}
                      />
                    </Tabs>
                  </Box>
                )
              }
            </AutoSize>
          </Box>
        </SplitPanePrimary>
        <SplitPaneSecondary>
          {menuFullyLoaded && (
            <Box
              className={`${
                isSimplifiedLayout
                  ? 'h-[calc(100vh-40px)]'
                  : 'h-[calc(100vh-70px)] shadow-sm rounded-xl border'
              } select-none flex flex-col ${
                !isSimplifiedLayout
                  ? 'bg-slate-50 border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 dark:shadow-slate-700/[.7]'
                  : ''
              }`}
            >
              <AutoSize disableWidth>
                {({ height }) => {
                  return (
                    height && (
                      <Box
                        className={`p-4 py-4 pb-2 select-auto ${
                          isSimplifiedLayout ? 'pl-0 pr-0' : ''
                        }`}
                        id="menu-main-list_tour"
                      >
                        <Flex className="justify-center relative h-8 pt-2 select-none">
                          {inactiveMenuItems.length > 0 && (
                            <Button
                              variant="ghost"
                              id="toggle-inactive-menu-items_tour"
                              className="bg-slate-200 p-1.5 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-700/80 dark:text-slate-300 rounded-sm flex items-center group absolute top-1 left-1"
                              onClick={() => {
                                showNotActiveMenuItems.value =
                                  !showNotActiveMenuItemsValue
                              }}
                            >
                              <ToolTip
                                asChild
                                side="bottom"
                                isCompact
                                sideOffset={12}
                                text={t('Toggle inactive menu items', {
                                  ns: 'menus',
                                })}
                              >
                                <Box className="relative">
                                  {showNotActiveMenuItemsValue ? (
                                    <EyeOff
                                      size={20}
                                      className="transition-colors group-hover:text-slate-400 dark:group-hover:text-slate-300/80 dark:text-slate-500"
                                    />
                                  ) : (
                                    <Eye
                                      size={20}
                                      className="transition-colors group-hover:text-slate-400 dark:group-hover:text-slate-500 dark:text-slate-300/80"
                                    />
                                  )}

                                  <Badge
                                    className={`absolute right-[-16px] top-[-17px] ${
                                      !showNotActiveMenuItemsValue
                                        ? 'bg-slate-300/80 dark:bg-slate-700 dark:text-slate-200/80 text-slate-500'
                                        : 'bg-slate-400/80 dark:bg-slate-600 text-slate-100 dark:text-slate-400/80'
                                    }`}
                                    variant={`${
                                      !showNotActiveMenuItemsValue ? 'outline' : 'default'
                                    }`}
                                  >
                                    {inactiveMenuItems.length}
                                  </Badge>
                                </Box>
                              </ToolTip>
                            </Button>
                          )}
                          {!isCreatingMenuItem.value || activeMenuItems.length === 0 ? (
                            <Box className="text-[13px] select-none">
                              {activeMenuItems.length > 0 ? (
                                <Text className="gap-1">
                                  <span className="font-semibold">
                                    {activeMenuItems.length}
                                  </span>
                                  <span>
                                    {inactiveMenuItems.length > 0
                                      ? t('active', { ns: 'menus' })
                                      : ''}{' '}
                                    {t('menu items in', { ns: 'menus' })}
                                  </span>
                                  <CollectionsDropDown>
                                    <span className="font-semibold underline cursor-pointer select-none">
                                      {getCurrentCollectionTitle()}
                                    </span>
                                  </CollectionsDropDown>
                                </Text>
                              ) : (
                                <Text className="gap-1">
                                  <span>
                                    {t('No {{hasActive}} menu items in', {
                                      ns: 'menus',
                                      hasActive:
                                        inactiveMenuItems.length > 0
                                          ? t('active', { ns: 'menus' })
                                          : '',
                                    })}
                                  </span>
                                  <CollectionsDropDown>
                                    <span className="font-semibold underline cursor-pointer">
                                      {getCurrentCollectionTitle()}
                                    </span>
                                  </CollectionsDropDown>
                                </Text>
                              )}
                            </Box>
                          ) : (
                            <Box className="text-[13px]">
                              <Text className="text-center">
                                {t('Select item to add a menu after', {
                                  ns: 'menus',
                                })}
                              </Text>
                            </Box>
                          )}
                          {activeMenuItems.length > 0 && (
                            <MenuAddMenu
                              isMainCreateMenu
                              isDark={isDark}
                              showEditMenuItemId={showEditMenuItemId}
                              isCreatingMenuItem={isCreatingMenuItem}
                            />
                          )}
                        </Flex>

                        {activeMenuItems.length === 0 && (
                          <Flex className="mt-6 flex-col select-none">
                            <Box>
                              <MenuAddMenu
                                isFistItemsCreateMenu
                                isDark={isDark}
                                showEditMenuItemId={showEditMenuItemId}
                                isCreatingMenuItem={isCreatingMenuItem}
                              />
                              <Text className="text-sm mt-4 !text-slate-500">
                                {t('Create Menu', { ns: 'menus' })}
                              </Text>
                            </Box>
                          </Flex>
                        )}

                        <Spacer h={2} />
                        <SimpleBar
                          style={{
                            height: isSimplifiedLayout ? height - 5 : height - 75,
                          }}
                          autoHide={true}
                          className="select-none"
                        >
                          <Accordion
                            type="single"
                            collapsible
                            value={openItemId ?? ''}
                            className="flex items-center flex-col select-none"
                          >
                            {orderedMenuItems.map(
                              (item, i) =>
                                item.itemId && (
                                  <AccordionItem
                                    key={`${item.itemId}`}
                                    ref={
                                      showLinkedMenuId.value === item.itemId
                                        ? scollToRef
                                        : null
                                    }
                                    value={item.itemId}
                                  >
                                    <MenuCollapsibleItem
                                      label={item.name}
                                      setOpenItemId={setOpenItemId}
                                      setSelectedItemIds={setSelectedItemIds}
                                      isLastItem={i === orderedMenuItems.length - 1}
                                      deletingMenuItemIds={deletingMenuItemIds}
                                      isFirstItem={i === 0}
                                      showEditMenuItemId={showEditMenuItemId}
                                      hasChildren={item.hasChildren}
                                      isSeparator={item.isSeparator}
                                      showMultiSelectItems={showMultiSelectItems}
                                      hasSelectedItems={selectedItemIds.length > 0}
                                      isDark={isDark}
                                      deselectItemById={itemId => {
                                        setSelectedItemIds(
                                          selectedItemIds.filter(id => id !== itemId)
                                        )
                                      }}
                                      selectItemById={id => {
                                        setSelectedItemIds(prev => [...prev, id])
                                      }}
                                      id={item.itemId}
                                      item={item}
                                      isClip={item.isClip}
                                      isForm={item.isForm && item.isClip}
                                      isWebRequest={item.isWebRequest && item.isClip}
                                      isWebScraping={item.isWebScraping && item.isClip}
                                      isCommand={item.isCommand && item.isClip}
                                      isCreatingMenuItem={isCreatingMenuItem}
                                      indent={item.indent}
                                      onFolderClose={id => {
                                        setClosedFolderItemIds(prev => [...prev, id])
                                      }}
                                      onFolderOpen={id => {
                                        setClosedFolderItemIds(prev =>
                                          prev.filter(i => i !== id)
                                        )
                                      }}
                                      isClosedFolder={closedFolderItemIds.includes(
                                        item.itemId
                                      )}
                                      isSelected={selectedItemIds.includes(item.itemId)}
                                      hasMultipleSelectedItems={
                                        selectedItemIds.length > 1
                                      }
                                      isOpen={openItemId === item.itemId}
                                    >
                                      <MenuCardMain
                                        menuName={item.name}
                                        isDisabled={item.isDisabled}
                                        isMenuEdit={
                                          showEditMenuItemId.value === item.itemId
                                        }
                                        isActive={item.isActive}
                                        isDark={isDark}
                                        isMenu={item.isMenu}
                                        isCode={item.isCode}
                                        isSeparator={item.isSeparator}
                                        isFolder={item.isFolder}
                                        isText={item.isText}
                                        isClip={item.isClip}
                                        deletingMenuItemIds={deletingMenuItemIds}
                                        item={item}
                                      />
                                    </MenuCollapsibleItem>
                                  </AccordionItem>
                                )
                            )}
                          </Accordion>
                          <Spacer h={3} />
                        </SimpleBar>
                      </Box>
                    )
                  )
                }}
              </AutoSize>
            </Box>
          )}
        </SplitPaneSecondary>
      </SplitView>
    </MainContainer>
  )
}
