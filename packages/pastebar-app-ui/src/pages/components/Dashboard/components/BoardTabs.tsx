import { useEffect, useMemo, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { invoke } from '@tauri-apps/api/tauri'
import createBoardTree from '~/libs/create-board-tree'
import {
  activeOverTabId,
  addSelectedTextToClipBoard,
  clipboardHistoryStoreAtom,
  collectionsStoreAtom,
  createBoardItemId,
  createClipBoardItemId,
  createClipHistoryItemIds,
  createFirstBoard,
  creatingClipItemBoardId,
  editBoardItemId,
  hasDashboardItemCreate,
  isWindowsOS,
  newBoardItemId,
  newClipItemId,
  resetKeyboardNavigation,
  settingsStoreAtom,
  showClipsMoveOnBoardId,
  showEditClipId,
  showEditTabs,
  showOrganizeLayout,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  ArrowRightLeft,
  Check,
  Grid2x2,
  Grid3x3,
  Grip,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Plus,
  Rows,
  Square,
  StretchHorizontal,
  Trash,
  X,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Trans, useTranslation } from 'react-i18next'

import { bgColor } from '~/lib/utils'

import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import {
  Badge,
  Box,
  Button,
  ContextMenu,
  ContextMenuTrigger,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '~/components/ui'

import { useUpdateMovedClipsInCollection } from '~/hooks/queries/use-collections'
import { useCreateItem } from '~/hooks/queries/use-items'
import {
  useCreateTab,
  useDeleteTabById,
  useUpdateTabById,
} from '~/hooks/queries/use-tabs'
import { useSignal } from '~/hooks/use-signal'

import { CreateDashboardItemType, Tabs as TabsType } from '~/types/menu'

import { CLIP, TAB } from '../Dashboard'
import { ClipSelectedIconMenu } from './ClipSelectedIconMenu'
import ColorSelector from './ColorSelector'
import TabsContextMenu from './context-menus/TabsContextMenu'
import CreateDashBoardMenu from './create-new-menu'

const MINIMAL_TAB_NAME_LENGTH = 1
const MAX_TAB_NAME_LENGTH = 50

export type TabType = 'tab'

export interface TabDragData {
  type: TabType
  tabId: string
}

export default function BoardTabs({
  tabs,
  selectedItemIds,
  setSelectedItemIds,
  pinnedItemIds,
  currentTab,
  setCurrentTab,
  isKeyboardNavigationDisabled,
}: {
  tabs: TabsType[]
  currentTab: string
  selectedItemIds: UniqueIdentifier[]
  pinnedItemIds: UniqueIdentifier[]
  setSelectedItemIds: (ids: UniqueIdentifier[]) => void
  setCurrentTab: (tab: string) => void
  isKeyboardNavigationDisabled?: boolean
}) {
  const { clipboardHistory } = useAtomValue(clipboardHistoryStoreAtom)
  const { isSimplifiedLayout } = useAtomValue(settingsStoreAtom)
  const { isSplitPanelView } = useAtomValue(uiStoreAtom)
  const { t } = useTranslation()
  const { updateTabById } = useUpdateTabById()
  const contextMenuButtonRef = useRef<HTMLButtonElement>(null)
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
  const contextMenuOpen = useSignal(false)
  const { updateMovedClips } = useUpdateMovedClipsInCollection()

  const visibleTabs = useMemo(() => tabs.filter(tab => !tab.tabIsHidden), [tabs])

  useHotkeys(
    [...Array(10).keys()].map(i => `${isWindowsOS.value ? 'alt' : 'ctrl'}+${i}`),
    (event, _handler) => {
      event.preventDefault()
      const keyNumber = parseInt(event.key, 10)
      const tabIndex = keyNumber === 0 ? 9 : keyNumber - 1

      if (tabIndex >= 0 && tabIndex < visibleTabs.length) {
        const tabToSelect = visibleTabs[tabIndex]
        if (tabToSelect && tabToSelect.tabId !== currentTab) {
          setCurrentTab(tabToSelect.tabId)
        }
      }
    },
    {
      enabled: visibleTabs.length > 0,
    },
    [visibleTabs, setCurrentTab, currentTab]
  )

  useEffect(() => {
    if (hasDashboardItemCreate.value) {
      hasDashboardItemCreate.value = null
    }
  }, [])

  const { createNewItem } = useCreateItem(createClipBoardItemId.value === null)
  const { currentCollectionId, clipItems } = useAtomValue(collectionsStoreAtom)

  const currentTabColor = tabs.find(tab => tab.tabId === currentTab)?.tabColor

  async function onCreateNewItemType(
    type: CreateDashboardItemType,
    parentId: UniqueIdentifier | null = null
  ) {
    hasDashboardItemCreate.value = type
    if (type === CreateDashboardItemType.BOARD) {
      const targetTabBoardTree = createBoardTree(
        clipItems,
        currentTab,
        parentId ? parentId?.toString() : null
      )

      const newBoardData = {
        name: t('New Board', { ns: 'dashboard' }),
        isBoard: true,
        tabId: currentTab,
        showDescription: true,
        color: currentTabColor,
        borderWidth: 0,
        parentId,
        collectionId: currentCollectionId,
        orderNumber: 0,
      }

      const newBoardId = await createNewItem({
        item: newBoardData,
      })

      targetTabBoardTree
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .unshift({
          ...newBoardData,
          id: newBoardId,
          layout: '',
          type: 'board',
          color: null,
          showDescription: true,
          layoutItemsMaxWidth: '',
          layoutSplit: 1,
          description: '',
        })

      const updatedMoveClips = targetTabBoardTree.map((board, i) => ({
        itemId: board.id,
        parentId: parentId,
        tabId: board.tabId,
        collectionId: currentCollectionId,
        orderNumber: i,
      }))

      updateMovedClips({ updatedMoveClips })

      newBoardItemId.value = newBoardId
    } else if (type === CreateDashboardItemType.CLIP) {
      hasDashboardItemCreate.value = type
    }
  }

  async function doCreateNewClip(
    historyId: UniqueIdentifier | null,
    boardId: UniqueIdentifier | null = null
  ): Promise<null | string> {
    return new Promise(async (resolve, reject) => {
      if (!boardId) {
        reject('No board id')
      }

      const clipboardItem = historyId
        ? clipboardHistory.find(item => item.historyId === historyId)
        : null

      const isImage = clipboardItem?.isImage

      const boardColor = clipItems.find(board => board.itemId === boardId)?.color

      const nameFromMetadata =
        clipboardItem?.linkMetadata?.linkTrackArtist &&
        clipboardItem?.linkMetadata?.linkTrackTitle
          ? `${clipboardItem?.linkMetadata?.linkTrackTitle} - ${clipboardItem?.linkMetadata?.linkTrackArtist}`
          : clipboardItem?.linkMetadata?.linkTitle
            ? clipboardItem?.linkMetadata?.linkTitle
            : null

      const newClipData = {
        historyId,
        name: nameFromMetadata
          ? nameFromMetadata
          : clipboardItem?.value
            ? clipboardItem.value
                .substring(0, 50)
                .replace(/\n\t/g, '')
                .replace(/\s+/g, ' ')
                .trim()
            : !isImage
              ? t('New Clip', { ns: 'dashboard' })
              : `${t('Image size', {
                  ns: 'common',
                })} (${clipboardItem?.imageWidth}x${clipboardItem?.imageHeight})`,
        isClip: true,
        value: addSelectedTextToClipBoard.value ?? '',
        description: null,
        detectedLanguage: clipboardItem?.detectedLanguage ?? null,
        isImage: clipboardItem?.isImage ?? false,
        imageDataUrl: clipboardItem?.imageDataUrl ?? null,
        imagePathFullRes: clipboardItem?.imagePathFullRes ?? null,
        imageHeight: clipboardItem?.imageHeight ?? null,
        imageWidth: clipboardItem?.imageWidth ?? null,
        imagePreviewHeight: clipboardItem?.imagePreviewHeight ?? null,
        isLink: clipboardItem?.isLink ?? false,
        links: clipboardItem?.links ?? null,
        isImageData: clipboardItem?.isImageData ?? false,
        isMasked: clipboardItem?.isMasked ?? false,
        isVideo: clipboardItem?.isVideo ?? false,
        isCode: clipboardItem?.isCode ?? false,
        isText: clipboardItem?.isText ?? false,
        hasEmoji: clipboardItem?.hasEmoji ?? false,
        hasMaskedWords: clipboardItem?.hasMaskedWords ?? false,
        hasMultiLineCopy: false,
        tabId: currentTab,
        showDescription: false,
        color: boardColor,
        borderWidth: 2,
        parentId: boardId,
        collectionId: currentCollectionId,
        createdAt: 0,
        orderNumber: 0,
      }

      const newClipId = await createNewItem({
        item: newClipData,
      })

      if (clipboardItem?.linkMetadata?.metadataId) {
        await invoke('copy_link_metadata_to_new_item_id', {
          metadataId: clipboardItem.linkMetadata.metadataId,
          itemId: newClipId,
        })
      }

      if (addSelectedTextToClipBoard.value) {
        addSelectedTextToClipBoard.value = null
      }

      const targetBoardTree = createBoardTree(clipItems, currentTab, boardId?.toString())

      targetBoardTree
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .unshift({
          ...newClipData,
          id: newClipId,
          type: 'clip',
        })

      const updatedMoveClips = targetBoardTree.map((item, i) => ({
        itemId: item.id,
        parentId: item.parentId,
        tabId: item.tabId,
        collectionId: currentCollectionId,
        orderNumber: i,
      }))

      setTimeout(async () => {
        await updateMovedClips({ updatedMoveClips })
        resolve(newClipId)
      }, 600)
    })
  }

  useEffect(() => {
    async function processClips() {
      let newClipId: string | null = null
      if (createClipBoardItemId.value && !creatingClipItemBoardId.value) {
        // Set the flag immediately to prevent duplicate processing
        creatingClipItemBoardId.value = createClipBoardItemId.value

        for (const historyId of createClipHistoryItemIds.value ?? [null]) {
          newClipId = await doCreateNewClip(historyId, createClipBoardItemId.value)
        }
        setTimeout(() => {
          creatingClipItemBoardId.value = null
          createClipBoardItemId.value = null
          createClipHistoryItemIds.value = null
          addSelectedTextToClipBoard.value = null
          newClipItemId.value = newClipId
        }, 300)
      }
    }

    if (createClipBoardItemId.value !== null) {
      resetKeyboardNavigation()
      processClips()
    }
  }, [createClipBoardItemId.value])

  useEffect(() => {
    async function processBoard() {
      await onCreateNewItemType(CreateDashboardItemType.BOARD, createBoardItemId.value)
      createFirstBoard.value = false
      createBoardItemId.value = null
    }
    if (createBoardItemId.value || createFirstBoard.value) {
      processBoard()
    }
  }, [createBoardItemId.value, createFirstBoard.value])

  const { tabLayoutSplit: currentTabLayoutSplit, tabLayout: currentTabLayoutBoard } =
    tabs.find(tab => tab.tabId === currentTab) ?? {}

  const isFirstTab =
    tabs.length === 0 && !hasDashboardItemCreate.value && !showEditTabs.value

  return (
    <>
      <Tabs
        className={`flex ${bgColor(
          currentTabColor
        )} main-boards-tabs rounded-lg py-0 mx-1.5 ${
          isFirstTab
            ? 'flex-col items-center justify-center pb-2 mb-1'
            : isSimplifiedLayout && !isSplitPanelView
              ? 'mb-3 mr-1.5 ml-0'
              : 'mb-3 mr-3'
        }`}
        onValueChange={tabId => {
          setCurrentTab(tabId)
        }}
        value={currentTab}
      >
        <ContextMenu
          onOpenChange={isOpen => {
            contextMenuOpen.value = isOpen
          }}
        >
          <ContextMenuTrigger
            ref={contextMenuTriggerRef}
            className="flex w-full"
            disabled={isFirstTab}
          >
            {!isFirstTab && (
              <Flex
                className="justify-start dashboard-tabs w-full"
                id="dashboard-tabs_tour"
              >
                <SimpleBar style={{ width: '97%' }}>
                  {!showEditTabs.value ? (
                    <TabsList
                      className="bg-transparent pr-0.5"
                      disableKeyboardNavigation={isKeyboardNavigationDisabled}
                    >
                      {tabs.map(
                        ({ tabId, tabName, tabIsHidden, tabOrderNumber }) =>
                          tabId &&
                          !tabIsHidden && (
                            <SortableTab
                              key={tabId}
                              tabId={tabId}
                              currentTabColor={currentTabColor ?? 'slate'}
                              tabOrderNumber={tabOrderNumber}
                              tabName={
                                tabName
                                  ? tabName
                                  : `${t('Tab', { ns: 'dashboard' })} ${
                                      tabOrderNumber + 1
                                    }`
                              }
                              currentTab={currentTab}
                            />
                          )
                      )}
                      {hasDashboardItemCreate.value === CreateDashboardItemType.TAB && (
                        <CreateNewTab newTabOrderNumber={tabs.length + 1} />
                      )}
                    </TabsList>
                  ) : (
                    <TabsList
                      className="bg-transparent pr-0.5"
                      disableKeyboardNavigation={isKeyboardNavigationDisabled}
                    >
                      {tabs.map(
                        ({ tabId, tabName, tabIsHidden, tabColor, tabOrderNumber }) =>
                          tabId &&
                          !tabIsHidden && (
                            <EditTab
                              key={tabId}
                              tabColor={tabColor}
                              tabId={tabId}
                              tabName={
                                tabName
                                  ? tabName
                                  : `${t('Tab', { ns: 'dashboard' })} ${
                                      tabOrderNumber + 1
                                    }`
                              }
                              currentTab={currentTab}
                            />
                          )
                      )}
                      {hasDashboardItemCreate.value === CreateDashboardItemType.TAB ? (
                        <CreateNewTab newTabOrderNumber={tabs.length + 1} />
                      ) : (
                        <Button
                          variant="outline"
                          size="mini"
                          title={t('Add a Tab', { ns: 'dashboard' })}
                          className="px-1.5 ml-1 h-8 border-0 opacity-80 hover:opacity-100 hover:text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-600"
                          onClick={() => {
                            onCreateNewItemType(CreateDashboardItemType.TAB)
                          }}
                        >
                          <Plus size={18} />
                        </Button>
                      )}
                    </TabsList>
                  )}
                </SimpleBar>
              </Flex>
            )}
            <Box className="flex flex-row p-1 !mt-0 mr-0.5">
              {showOrganizeLayout.value ? (
                <>
                  {currentTabLayoutSplit && (
                    <Flex className="mr-2">
                      {currentTabLayoutSplit > 1 && (
                        <Badge
                          onClick={() => {
                            updateTabById({
                              updatedTab: {
                                tabLayoutSplit:
                                  currentTabLayoutSplit > 3
                                    ? 1
                                    : currentTabLayoutSplit + 1,
                                tabId: currentTab,
                              },
                            })
                          }}
                          variant="outline"
                          className="bg-white border border-white dark:bg-slate-500 dark:border-slate-500 cursor-pointer px-1.5 mr-1"
                        >
                          <Text className="font-mono text-slate-400 font-semibold">
                            {currentTabLayoutSplit}
                          </Text>
                        </Badge>
                      )}

                      <Button
                        variant="light"
                        title={t('Board Layout Split', { ns: 'dashboard' })}
                        onClick={() => {
                          updateTabById({
                            updatedTab: {
                              tabLayoutSplit:
                                currentTabLayoutSplit > 3 ? 1 : currentTabLayoutSplit + 1,
                              tabId: currentTab,
                            },
                          })
                        }}
                        className={`px-1 py-2 bg-gray-50 dark:bg-slate-600/90 cursor-pointer opacity-80 hover:opacity-100 hover:text-grey-500 ${
                          currentTabLayoutSplit === 4 ? 'w-12' : 'w-8'
                        } h-8`}
                      >
                        {currentTabLayoutSplit === 1 && (
                          <Rows size={18} className="opacity-70" />
                        )}
                        {currentTabLayoutSplit === 2 && (
                          <Grid2x2 size={18} className="opacity-70" />
                        )}
                        {currentTabLayoutSplit === 3 && (
                          <Grid3x3 size={18} className="opacity-70" />
                        )}
                        {currentTabLayoutSplit === 4 && (
                          <>
                            <LayoutGrid size={18} className="opacity-70" />
                            <LayoutGrid size={18} className="opacity-70 ml-[-2px]" />
                          </>
                        )}
                      </Button>
                    </Flex>
                  )}
                  <Flex className="mr-2">
                    <Badge
                      onClick={() => {
                        const newLayout =
                          currentTabLayoutBoard === 'full'
                            ? 'auto'
                            : currentTabLayoutBoard === 'auto' || !currentTabLayoutBoard
                              ? 'full'
                              : 'auto'
                        updateTabById({
                          updatedTab: {
                            tabLayoutSplit: currentTabLayoutSplit,
                            tabLayout: newLayout,
                            tabId: currentTab,
                          },
                        })
                      }}
                      variant="outline"
                      className="bg-white border border-white dark:bg-slate-500 dark:border-slate-500 cursor-pointer px-1.5 mr-1"
                    >
                      <Text className="font-mono text-slate-400 font-semibold">
                        {currentTabLayoutBoard ? currentTabLayoutBoard : 'auto'}
                      </Text>
                    </Badge>

                    <Button
                      variant="light"
                      title={t('Board Layout Height', { ns: 'dashboard' })}
                      onClick={() => {
                        const newLayout =
                          currentTabLayoutBoard === 'full' || !currentTabLayoutBoard
                            ? 'auto'
                            : currentTabLayoutBoard === 'auto'
                              ? 'full'
                              : 'auto'
                        updateTabById({
                          updatedTab: {
                            tabLayoutSplit: currentTabLayoutSplit,
                            tabLayout: newLayout,
                            tabId: currentTab,
                          },
                        })
                      }}
                      className={`px-1 py-2 bg-gray-50 dark:bg-slate-600/90 cursor-pointer opacity-80 hover:opacity-100 hover:text-grey-500 w-8 h-8`}
                    >
                      {(currentTabLayoutBoard === 'auto' || !currentTabLayoutBoard) && (
                        <StretchHorizontal size={18} className="opacity-70" />
                      )}
                      {currentTabLayoutBoard === 'full' && (
                        <Square size={18} className="opacity-70" />
                      )}
                    </Button>
                  </Flex>
                  <Button
                    variant="light"
                    size="mini"
                    className="px-3 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80"
                    onClick={() => {
                      showOrganizeLayout.value = false
                      showClipsMoveOnBoardId.value = null
                    }}
                  >
                    <Text className="whitespace-nowrap">
                      {t('Done Organize', { ns: 'dashboard' })}
                    </Text>
                    <div className="ml-auto pl-1.5">
                      <Check size={15} />
                    </div>
                  </Button>
                </>
              ) : showEditTabs.value ? (
                <Button
                  variant="light"
                  size="mini"
                  className="px-3 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80"
                  onClick={() => {
                    showEditTabs.value = false
                    showClipsMoveOnBoardId.value = null
                  }}
                >
                  <Text className="whitespace-nowrap">
                    {t('Done Edit Tabs', { ns: 'dashboard' })}
                  </Text>
                  <div className="ml-auto pl-1.5">
                    <Check size={15} />
                  </div>
                </Button>
              ) : hasDashboardItemCreate.value === CLIP ? (
                <Button
                  variant="light"
                  size="mini"
                  className="px-3 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80"
                  onClick={() => {
                    hasDashboardItemCreate.value = null
                    addSelectedTextToClipBoard.value = null
                  }}
                >
                  <Text className="whitespace-nowrap">
                    {t('Done Create Clip', { ns: 'dashboard' })}
                  </Text>
                  <div className="ml-auto pl-1.5">
                    <Check size={15} />
                  </div>
                </Button>
              ) : editBoardItemId.value != null || showEditClipId.value != null ? (
                <Button
                  variant="light"
                  size="mini"
                  className="px-3 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80"
                  onClick={() => {
                    editBoardItemId.value = null
                    showEditClipId.value = null
                  }}
                >
                  <Text className="whitespace-nowrap">
                    {t('Done Edit', { ns: 'dashboard' })}
                  </Text>
                  <div className="ml-auto pl-1.5">
                    <Check size={15} />
                  </div>
                </Button>
              ) : (
                <>
                  {selectedItemIds.length > 0 && (
                    <Box className="animate-in fade-in duration-300">
                      <ClipSelectedIconMenu
                        selectedItemIds={selectedItemIds}
                        hasPinnedItemsInSelected={selectedItemIds.some(id =>
                          pinnedItemIds.includes(id)
                        )}
                        hasFavoriteItemsInSelected={selectedItemIds.some(
                          id => clipItems.find(clip => clip.itemId === id)?.isFavorite
                        )}
                        setSelectedItemIds={setSelectedItemIds}
                      />
                    </Box>
                  )}
                  {tabs.length > 0 && (
                    <>
                      <CreateDashBoardMenu
                        totalTabs={tabs.length}
                        onCreateNewItemType={onCreateNewItemType}
                        isFirstTab={false}
                      />

                      <Button
                        variant={'ghost'}
                        size="mini"
                        id="dashboard-tabs-context-menu_tour"
                        className="px-1 py-1 text-secondary-foreground/50 cursor-pointer !mt-0 flex w-[30px]"
                        onClick={() => {
                          const x =
                            contextMenuButtonRef?.current?.getBoundingClientRect().x
                          const y =
                            contextMenuButtonRef?.current?.getBoundingClientRect().y

                          contextMenuTriggerRef?.current?.dispatchEvent(
                            new MouseEvent('contextmenu', {
                              bubbles: true,
                              clientX: x && x + 20,
                              clientY: y && y + 20,
                            })
                          )
                        }}
                        ref={contextMenuButtonRef}
                      >
                        <ToolTip
                          text={t('Tabs Menu', { ns: 'dashboard' })}
                          delayDuration={2000}
                          isCompact
                          side="bottom"
                          sideOffset={10}
                        >
                          <MoreVertical size={20} />
                        </ToolTip>
                      </Button>
                    </>
                  )}
                </>
              )}
            </Box>
          </ContextMenuTrigger>
          <TabsContextMenu tabId={currentTab} />
        </ContextMenu>
        {isFirstTab && (
          <CreateDashBoardMenu onCreateNewItemType={onCreateNewItemType} isFirstTab />
        )}
      </Tabs>
      {isFirstTab && (
        <Text className="text-sm mt-2 !text-slate-500 items-center justify-center mx-1.5 mr-3">
          {t('Create Tab', { ns: 'dashboard' })}
        </Text>
      )}
    </>
  )
}

function CreateNewTab({ newTabOrderNumber }: { newTabOrderNumber: number }) {
  const { t } = useTranslation()
  const { createNewTab } = useCreateTab()
  const { currentCollectionId } = useAtomValue(collectionsStoreAtom)

  const nameError = useSignal(false)
  const nameEdit = useSignal('')
  const tabColor = useSignal<string | null>(null)
  return (
    <Flex className="ml-1.5">
      <Box className="w-[22px] mr-1">
        <ColorSelector
          color={tabColor.value}
          type={TAB}
          itemId={null}
          onColorChange={color => {
            tabColor.value = color
          }}
        />
      </Box>
      <ToolTip
        open={nameError.value}
        text={
          nameEdit.value.length <= MINIMAL_TAB_NAME_LENGTH
            ? t('Too short', { ns: 'dashboard' })
            : t('Too long', { ns: 'dashboard' })
        }
        side="bottom"
        className="bg-rose-50 text-red-500 dark:bg-rose-900 dark:text-red-50 border-rose-100 dark:border-rose-950 text-base font-semibold border !px-2 !py-1.5"
      >
        <InputField
          small
          autoFocus
          className="bg-white rounded-md text-sm font-semibold max-w-[200px] min-w-[140px]"
          placeholder={t('Enter tab name', { ns: 'dashboard' })}
          onKeyDown={async e => {
            e.stopPropagation()
            if (
              e.key === 'Enter' &&
              (nameEdit.value.length <= MINIMAL_TAB_NAME_LENGTH ||
                nameEdit.value.length > MAX_TAB_NAME_LENGTH)
            ) {
              nameError.value = true
            } else if (e.key === 'Enter') {
              await createNewTab({
                tab: {
                  tabName: nameEdit.value,
                  tabColor: tabColor.value,
                  collectionId: currentCollectionId,
                  tabOrderNumber: newTabOrderNumber,
                },
              })
            }
          }}
          value={nameEdit.value}
          onChange={e => {
            if (
              (nameError.value &&
                e.target.value.length > MINIMAL_TAB_NAME_LENGTH &&
                e.target.value.length <= MAX_TAB_NAME_LENGTH) ||
              (nameError.value && e.target.value.length === 0)
            ) {
              nameError.value = false
            }
            nameEdit.value = e.target.value
          }}
        />
      </ToolTip>
      <Button
        variant="outline"
        size="mini"
        className="ml-1 px-1.5 h-8 text-blue-500 dark:text-blue-300 border-0"
        onClick={async () => {
          if (!nameError.value) {
            await createNewTab({
              tab: {
                tabName: nameEdit.value,
                tabColor: tabColor.value,
                collectionId: currentCollectionId,
                tabOrderNumber: newTabOrderNumber,
              },
            })
          }
        }}
      >
        <ToolTip
          text={t('Create tab', { ns: 'dashboard' })}
          isCompact
          side="bottom"
          sideOffset={10}
        >
          <Check size={18} />
        </ToolTip>
      </Button>
      <Button
        variant="outline"
        size="mini"
        className="ml-1 px-1.5 h-8 text-gray-400 border-0"
        onClick={() => {
          hasDashboardItemCreate.value = null
        }}
      >
        <ToolTip
          text={t('Cancel', { ns: 'dashboard' })}
          isCompact
          side="bottom"
          sideOffset={10}
        >
          <X size={18} />
        </ToolTip>
      </Button>
    </Flex>
  )
}

export function EditTab({
  tabId,
  tabName,
  tabColor,
  currentTab,
}: {
  tabId: string
  currentTab: string
  tabColor: string | null
  tabName: string | undefined
}) {
  const { t } = useTranslation()
  const renameError = useSignal(false)
  const renameEdit = useSignal('')
  const isEditing = useSignal(false)

  if (!tabName) {
    return null
  }

  useEffect(() => {
    if (isEditing.value) {
      isEditing.value = false
    }
  }, [currentTab])

  const deleteError = useSignal(false)
  const showDeleteConfirmation = useSignal(false)

  const { tabHasBoards, setCurrentTab } = useAtomValue(collectionsStoreAtom)
  const { deleteItemById } = useDeleteTabById()
  const { updateTabById } = useUpdateTabById()

  return (
    <Flex
      key={tabId}
      className={`inline-flex items-center whitespace-nowrap rounded-sm px-1.5 pr-2 ${
        isEditing.value ? '' : 'py-1.5'
      } ${
        currentTab === tabId && !isEditing.value ? 'bg-white dark:bg-gray-900/60' : ''
      } ${showDeleteConfirmation.value ? 'bg-red-100/80 dark:bg-red-900/70' : ''} ${
        deleteError.value ? 'bg-yellow-100/80 dark:bg-yellow-900/70' : ''
      } text-sm font-medium ring-offset-background transition-none  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset disabled:pointer-events-none disabled:opacity-50 justify-start max-w-[260px]`}
    >
      {!isEditing.value ? (
        <>
          <ColorSelector
            color={tabColor}
            itemId={tabId}
            onOpen={() => {
              setCurrentTab(tabId)
            }}
            updateById={updateTabById}
            type={TAB}
          />
          <Box
            className="text-ellipsis overflow-hidden first-letter:uppercase border-dashed border-b border-gray-400"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation
              isEditing.value = true
            }}
            title={tabName}
          >
            {tabName}
          </Box>

          <Box
            onClick={() => {
              isEditing.value = true
            }}
            title={t('Edit tab name', { ns: 'dashboard' })}
            className="ml-0.5 pr-0 pl-1.5 py-0 text-primary/50 h-auto cursor-pointer relative opacity-80 hover:opacity-100"
          >
            <Pencil size={14} />
          </Box>
          <Popover
            defaultOpen={false}
            open={showDeleteConfirmation.value || deleteError.value}
          >
            <PopoverAnchor asChild>
              <Box
                className="ml-0.5 pr-0 pl-1.5 py-0 text-primary/50 h-auto cursor-pointer opacity-70 hover:opacity-100 hover:text-red-500"
                title={t('Delete tab', { ns: 'dashboard' })}
                onClick={() => {
                  if (tabHasBoards(tabId)) {
                    deleteError.value = true
                  } else {
                    showDeleteConfirmation.value = true
                  }
                }}
              >
                {<Trash size={14} />}
              </Box>
            </PopoverAnchor>
            <PopoverContent
              sideOffset={16}
              align="center"
              className={`p-3 ${
                deleteError.value
                  ? 'bg-amber-100 border-amber-200 dark:bg-yellow-800 dark:border-gray-900'
                  : 'bg-gray-100 border-gray-200 dark:bg-gray-900 dark:border-gray-950'
              } w-64`}
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
                    {t('Tab is Not Empty', { ns: 'dashboard' })}
                  </Text>
                  <Spacer h={1} />
                  <Text color="black" size="sm">
                    {t(
                      "You'll need to clear this tab of all boards before it can be deleted.",
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
                        i18nKey="Are you sure you want to delete <strong>{{tabName}}</strong> tab?"
                        values={{ tabName }}
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
                        <div>{t('Cancel', { ns: 'common' })}</div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-100 hover:bg-opacity-80 hover:bg-red-200 text-red-500 hover:text-red-600 border-red-200 dark:bg-red-900 dark:border-red-900 dark:hover:border-red-900 dark:hover:bg-red-800 dark:text-red-300 dark:hover:text-red-200 whitespace-nowrap"
                        onClick={async () => {
                          await deleteItemById({
                            tabId,
                          })
                          showEditTabs.value = false
                          showClipsMoveOnBoardId.value = null
                        }}
                      >
                        {t('Delete Tab', { ns: 'dashboard' })}
                      </Button>
                    </Flex>
                  </Flex>
                )
              )}
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <>
          <ToolTip
            open={renameError.value}
            asChild
            text={
              renameEdit.value.length <= MINIMAL_TAB_NAME_LENGTH
                ? t('Too short', { ns: 'dashboard' })
                : t('Too long', { ns: 'dashboard' })
            }
            side="bottom"
            className="bg-rose-50 text-red-500 dark:bg-rose-900 dark:text-red-50 border-rose-100 dark:border-rose-950 text-base font-semibold border !px-2 !py-1.5"
          >
            <InputField
              small
              autoFocus
              className="bg-white rounded-md text-sm font-semibold max-w-[200px] min-w-[120px]"
              placeholder={t('Enter tab name', { ns: 'dashboard' })}
              onKeyDown={async e => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  isEditing.value = false
                } else if (
                  e.key === 'Enter' &&
                  (renameEdit.value.length <= MINIMAL_TAB_NAME_LENGTH ||
                    renameEdit.value.length > MAX_TAB_NAME_LENGTH)
                ) {
                  renameError.value = true
                } else if (e.key === 'Enter') {
                  await updateTabById({
                    updatedTab: {
                      tabName: renameEdit.value,
                      tabId,
                    },
                  })
                  setTimeout(() => {
                    isEditing.value = false
                  }, 200)
                }
              }}
              defaultValue={tabName}
              onChange={e => {
                if (
                  (renameError.value &&
                    e.target.value.length > MINIMAL_TAB_NAME_LENGTH &&
                    e.target.value.length <= MAX_TAB_NAME_LENGTH) ||
                  (renameError.value && e.target.value.length === 0)
                ) {
                  renameError.value = false
                } else if (
                  e.target.value.length <= MINIMAL_TAB_NAME_LENGTH ||
                  e.target.value.length > MAX_TAB_NAME_LENGTH
                ) {
                  renameError.value = true
                }
                renameEdit.value = e.target.value
              }}
            />
          </ToolTip>
          <ToolTip
            text={t('Rename', { ns: 'common' })}
            isCompact
            side="bottom"
            sideOffset={10}
            asChild
          >
            <Box tabIndex={0}>
              <Button
                variant="outline"
                size="mini"
                className="ml-1 px-1.5 h-8 text-blue-500 dark:text-blue-300 border-0"
                onClick={async () => {
                  if (!renameError.value) {
                    await updateTabById({
                      updatedTab: {
                        tabName: renameEdit.value,
                        tabId,
                      },
                    })
                    setTimeout(() => {
                      isEditing.value = false
                    }, 200)
                  }
                }}
              >
                <Check size={18} />
              </Button>
            </Box>
          </ToolTip>
          <ToolTip
            text={t('Cancel', { ns: 'common' })}
            isCompact
            side="bottom"
            sideOffset={10}
            asChild
          >
            <Box tabIndex={0}>
              <Button
                variant="outline"
                size="mini"
                className="ml-1 px-1.5 h-8 text-gray-400 border-0"
                onClick={() => {
                  isEditing.value = false
                }}
              >
                <X size={18} />
              </Button>
            </Box>
          </ToolTip>
        </>
      )}
    </Flex>
  )
}

export function SortableTab({
  tabId,
  tabName,
  currentTabColor,
}: {
  tabId: string
  currentTab: string
  tabOrderNumber: number
  currentTabColor: string | null | undefined
  tabName: string | undefined
}) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: tabId,
    animateLayoutChanges: () => false,
    data: {
      type: TAB,
      tabId,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  const tabActiveDarkBgColor =
    currentTabColor !== 'slate'
      ? `dark:data-[state=active]:bg-${currentTabColor}-700`
      : 'dark:data-[state=active]:bg-slate-600'

  return (
    <TabsTrigger
      key={tabId}
      value={tabId}
      style={style}
      asChild={isDragging}
      {...(!showOrganizeLayout.value ? listeners : {})}
      ref={setNodeRef}
      className={`${tabActiveDarkBgColor} data-[state=active]:bg-${currentTabColor}-50 ${
        isDragging || activeOverTabId.value === tabId
          ? 'border-2 border-dashed border-blue-400 py-1'
          : 'transition-none'
      }`}
    >
      <Flex className="justify-start max-w-[260px]">
        <Box
          className="text-ellipsis overflow-hidden first-letter:uppercase"
          title={tabName}
        >
          {tabName}
        </Box>
        {(showOrganizeLayout.value || isDragging) && (
          <Box
            {...listeners}
            className="pr-0 pl-1.5 py-0 text-primary/50 h-auto cursor-grab relative"
          >
            {isDragging ? <ArrowRightLeft size={14} /> : <Grip size={14} />}
          </Box>
        )}
      </Flex>
    </TabsTrigger>
  )
}
