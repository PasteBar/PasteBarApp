import { useEffect, useMemo, useState } from 'react'
import { Signal } from '@preact/signals-react'
import {
  addSelectedTextToMenu,
  clipboardHistoryStoreAtom,
  createMenuItemFromClipId,
  createMenuItemFromHistoryId,
  creatingNewMenuItem,
  resetMenuCreateOrEdit,
} from '~/store'
import { useAtomValue } from 'jotai/react'
import {
  Check,
  ClipboardList,
  Folder,
  History,
  LayoutList,
  Minus,
  Plus,
  PointerOff,
  Search,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import ToolTip from '~/components/atoms/tooltip'
import { CodeViewerMemo } from '~/components/code-viewer'
import SimpleBar from '~/components/libs/simplebar-react'
import { Badge, Box, Button, ButtonGhost, Flex, Input, Text } from '~/components/ui'

import { useFetchCollectionWithClips } from '~/hooks/queries/use-collections'
import { useInfiniteClipboardHistory } from '~/hooks/queries/use-history-items'
import { useDebounce } from '~/hooks/use-debounce'

import { CreateItemType, Item } from '~/types/menu'

const { FOLDER, ITEM, SEPARATOR, DISABLED } = CreateItemType

type FilteredItem = {
  isImage?: boolean
  isLink?: boolean
  detectedLanguage?: string
  name: string
  id: string
}

export default function MenuAddMenu({
  isCreatingMenuItem,
  currentMenuItemId,
  parentId,
  orderNumber,
  showEditMenuItemId,
  isMainCreateMenu,
  isDark,
  isFistItemsCreateMenu,
}: {
  isMainCreateMenu?: boolean
  isFistItemsCreateMenu?: boolean
  parentId?: string | null
  currentMenuItemId?: string
  showEditMenuItemId: Signal<string | null>
  orderNumber?: number
  isDark: boolean
  isCreatingMenuItem: Signal<boolean>
}) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHistoryTerm, setSearchHistoryTerm] = useState('')
  const { clipboardHistory } = useAtomValue(clipboardHistoryStoreAtom)

  const { fetchNextClipboardHistoryPage } = useInfiniteClipboardHistory()
  const { collectionWithClips, fetchCollectionWithClips } = useFetchCollectionWithClips()

  const clipItems = (collectionWithClips?.clips as Item[]) || []

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedSearchHistoryTerm = useDebounce(searchHistoryTerm, 300)

  const clipItemsFiltered: FilteredItem[] = useMemo(() => {
    if (debouncedSearchTerm.length < 1) {
      return clipItems
        .filter(item => item.isClip)
        .sort((a, b) => (a.updatedAt && b.updatedAt ? b.updatedAt - a.updatedAt : 0))
        .slice(0, 50)
        .map(({ name, itemId }) => ({
          name: name.length > 50 ? `${name.substring(0, 50)}...` : name,
          id: itemId,
        })) as FilteredItem[]
    }

    return clipItems
      .filter(
        item =>
          item.isClip &&
          item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
      .sort((a, b) => (a.updatedAt && b.updatedAt ? b.updatedAt - a.updatedAt : 0))
      .slice(0, 50)
      .map(({ name, itemId }) => ({
        name: name.length > 50 ? `${name.substring(0, 50)}...` : name,
        id: itemId,
      })) as FilteredItem[]
  }, [clipItems, debouncedSearchTerm])

  const historyItemsFiltered: FilteredItem[] = useMemo(() => {
    if (debouncedSearchHistoryTerm.length < 1) {
      return clipboardHistory
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 50)
        .map(
          ({
            value,
            historyId,
            isImage,
            imageWidth,
            imageHeight,
            detectedLanguage,
            isLink,
          }) => ({
            isImage,
            isLink,
            detectedLanguage,
            name:
              value?.length && value?.length > 80
                ? `${value?.substring(0, 80)}...`
                : isImage
                  ? `${t('Image', { ns: 'common' })} (${imageWidth}x${imageHeight})`
                  : value,
            id: historyId,
          })
        ) as FilteredItem[]
    }

    return clipboardHistory
      .filter(item =>
        item?.value
          ? item?.value?.toLowerCase().includes(debouncedSearchHistoryTerm.toLowerCase())
          : 'Image'.toLocaleLowerCase().includes(debouncedSearchHistoryTerm.toLowerCase())
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 50)
      .map(
        ({
          value,
          historyId,
          isImage,
          imageWidth,
          imageHeight,
          detectedLanguage,
          isLink,
        }) => ({
          isImage,
          isLink,
          detectedLanguage,
          name:
            value?.length && value?.length > 80
              ? `${value?.substring(0, 80)}...`
              : isImage
                ? `${t('Image', { ns: 'common' })} (${imageWidth}x${imageHeight})`
                : value,
          value,
          id: historyId,
        })
      ) as FilteredItem[]
  }, [clipboardHistory, debouncedSearchHistoryTerm])

  useEffect(() => {
    if (!clipboardHistory.length) {
      fetchNextClipboardHistoryPage()
    }

    fetchCollectionWithClips()
  }, [])

  function DoneEditOrAdd() {
    resetMenuCreateOrEdit()
    isCreatingMenuItem.value = false
    createMenuItemFromHistoryId.value = null
    createMenuItemFromClipId.value = null
  }

  return (
    <DropdownMenu modal={false} defaultOpen={isFistItemsCreateMenu}>
      <DropdownMenuTrigger
        asChild
        disabled={
          Boolean(createMenuItemFromHistoryId.value) ||
          Boolean(createMenuItemFromClipId.value) ||
          Boolean(addSelectedTextToMenu.value)
        }
      >
        {isMainCreateMenu ? (
          <>
            {!isCreatingMenuItem.value ? (
              <>
                {!showEditMenuItemId.value ? (
                  <ButtonGhost
                    className="bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-700/80 p-1.5 text-slate-500 dark:text-slate-300 rounded-sm flex items-center group absolute top-1 right-1"
                    id="add-menu-item__tour"
                    onClick={() => {
                      isCreatingMenuItem.value = true
                    }}
                  >
                    <ToolTip
                      asChild
                      side="bottom"
                      isCompact
                      sideOffset={12}
                      text={t('Add item', {
                        ns: 'menus',
                      })}
                    >
                      <Plus
                        size={20}
                        className="transition-colors group-hover:text-slate-400"
                      />
                    </ToolTip>
                  </ButtonGhost>
                ) : (
                  <ButtonGhost
                    variant="light"
                    size="mini"
                    className="px-3 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80 py-1.5 absolute top-1 right-1 rounded-sm"
                    onClick={() => {
                      DoneEditOrAdd()
                    }}
                  >
                    <Text className="whitespace-nowrap">
                      {t('Done Edit', { ns: 'common' })}
                    </Text>
                    <div className="ml-auto pl-1.5">
                      <Check size={15} />
                    </div>
                  </ButtonGhost>
                )}
              </>
            ) : (
              <Button
                variant="light"
                size="mini"
                className="px-3 bg-yellow-200 hover:bg-yellow-200/80 dark:bg-yellow-700 dark:hover:bg-yellow-700/80 py-1.5 absolute top-1 right-1 rounded-sm"
                onClick={() => {
                  DoneEditOrAdd()
                }}
              >
                <Text className="whitespace-nowrap">
                  {t('Done Adding', { ns: 'common' })}
                </Text>
                <div className="ml-auto pl-1.5">
                  <Check size={15} />
                </div>
              </Button>
            )}
          </>
        ) : (
          <Box
            id="add-menu-item__tour"
            className="flex group flex-row items-center cursor-pointer justify-center border-2 border-dashed rounded-md p-1.5 hover:border-blue-400 hover:dark:border-blue-500 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:border-slate-500 dark:text-slate-300"
            onClick={() => {
              if (
                !createMenuItemFromHistoryId.value &&
                !createMenuItemFromClipId.value &&
                !addSelectedTextToMenu.value
              ) {
                return
              }

              if (addSelectedTextToMenu.value) {
                creatingNewMenuItem.value = {
                  orderNumber,
                  currentMenuItemId,
                  parentId,
                  type: ITEM,
                  text: addSelectedTextToMenu.value,
                }
                addSelectedTextToMenu.value = ''
                return
              }

              const historyItem = clipboardHistory.find(
                ({ historyId }) => historyId === createMenuItemFromHistoryId.value
              )
              const clipItem = clipItems.find(
                ({ itemId }) => itemId === createMenuItemFromClipId.value
              )

              createMenuItemFromHistoryId.value = null
              createMenuItemFromClipId.value = null

              if (historyItem) {
                creatingNewMenuItem.value = {
                  orderNumber,
                  currentMenuItemId,
                  parentId,
                  type: ITEM,
                  clipboardHistoryItem: historyItem,
                  historyId: historyItem.historyId.toString(),
                }
              } else if (clipItem) {
                creatingNewMenuItem.value = {
                  orderNumber,
                  currentMenuItemId,
                  parentId,
                  type: ITEM,
                  clipId: clipItem.itemId,
                }
              }
            }}
          >
            <Plus
              size={20}
              className="group-hover:text-blue-400 dark:group-hover:text-blue-300 text-slate-400"
            />
          </Box>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={isFistItemsCreateMenu ? 12 : 0}>
        <DropdownMenuItem
          disabled
          className="py-0.5 pb-1 flex justify-center border-b border-gray-200 dark:border-gray-600 text-slate-500 dark:text-slate-400"
        >
          {isFistItemsCreateMenu
            ? t('Add First Item', { ns: 'menus' })
            : t('Add Item', { ns: 'menus' })}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="outline-none flex items-center"
          onClick={() => {
            creatingNewMenuItem.value = {
              orderNumber,
              currentMenuItemId,
              parentId,
              type: ITEM,
            }
          }}
        >
          <LayoutList size={16} className="mr-2" />
          <span>{t('Menu Item', { ns: 'menus' })}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="outline-none flex items-center"
          onClick={() => {
            creatingNewMenuItem.value = {
              orderNumber,
              currentMenuItemId,
              parentId,
              type: FOLDER,
            }
          }}
        >
          <Folder size={16} className="mr-2" />
          <span>{t('Submenu', { ns: 'menus' })}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="outline-none flex items-center"
          onClick={() => {
            creatingNewMenuItem.value = {
              orderNumber,
              currentMenuItemId,
              parentId,
              type: SEPARATOR,
            }
          }}
        >
          <Minus size={16} className="mr-2" />
          <span>{t('Separator', { ns: 'menus' })}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="outline-none flex items-center"
          onClick={() => {
            creatingNewMenuItem.value = {
              orderNumber,
              currentMenuItemId,
              parentId,
              type: DISABLED,
            }
          }}
        >
          <PointerOff size={16} className="mr-2" />
          <span>{t('Disabled Item', { ns: 'menus' })}</span>
        </DropdownMenuItem>

        {(historyItemsFiltered.length > 0 || clipItemsFiltered.length > 0) && (
          <DropdownMenuSeparator />
        )}

        {historyItemsFiltered.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <History size={16} className="mr-2" />
              <span>{t('Recent History', { ns: 'common' })}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-60">
              <Flex
                className="focus:bg-transparent px-1 py-0.5 pb-1"
                onKeyDown={e => e.stopPropagation()}
              >
                <Input
                  placeholder={`${t('Find History', { ns: 'common' })} ...`}
                  type="search"
                  autoFocus
                  onChange={e => {
                    setSearchHistoryTerm(e.target.value)
                  }}
                  value={searchHistoryTerm}
                  iconLeft={<Search className="h-4 w-4" />}
                  classNameInput="w-full pr-0 h-7"
                  className="text-md w-[260px] ring-offset-0 py-1 bg-slate-100 dark:bg-slate-700 border-r-0 border-t-0 border-b-0 h-8"
                />
              </Flex>
              <SimpleBar
                className="code-filter"
                style={{ height: 'auto', maxHeight: '260px' }}
                autoHide={false}
              >
                {historyItemsFiltered.map(
                  ({ name, id, isImage, detectedLanguage, isLink }, i) => (
                    <DropdownMenuItem
                      key={id}
                      onKeyDown={e => e.stopPropagation()}
                      className={`${
                        i > 0 ? 'border-t' : ''
                      } border-slate-100 dark:border-slate-800/90 ml-1 rounded-none`}
                      onClick={() => {
                        creatingNewMenuItem.value = {
                          orderNumber,
                          currentMenuItemId,
                          parentId,
                          type: ITEM,
                          clipboardHistoryItem: clipboardHistory.find(
                            ({ historyId }) => historyId === id
                          ),
                          historyId: id,
                        }
                      }}
                    >
                      {detectedLanguage ? (
                        <Box className="text-sm overflow-hidden text-ellipsis">
                          <CodeViewerMemo
                            isDark={isDark}
                            searchTerm=""
                            isLargeView={false}
                            isShowMore={false}
                            isWrapped={true}
                            value={name ?? ''}
                            language={detectedLanguage}
                          />
                          <Badge
                            variant="secondary"
                            className="absolute right-1 bottom-1"
                          >
                            {detectedLanguage}
                          </Badge>
                        </Box>
                      ) : (
                        <Box className="relative overflow-hidden text-ellipsis">
                          <code className="text-sm line-clamp-2">{name}</code>
                          {isImage && (
                            <Badge
                              variant="secondary"
                              className="absolute right-1 bottom-1"
                            >
                              {t('Type:::Image', { ns: 'common' })}
                            </Badge>
                          )}
                          {isLink && (
                            <Badge
                              variant="secondary"
                              className="absolute right-1 bottom-1"
                            >
                              {t('Type:::Link', { ns: 'common' })}
                            </Badge>
                          )}
                        </Box>
                      )}
                    </DropdownMenuItem>
                  )
                )}
              </SimpleBar>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {clipItemsFiltered.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ClipboardList size={16} className="mr-2" />
              <span>{t('Link to Clip', { ns: 'menus' })}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <Flex
                className="focus:bg-transparent px-1 py-0.5 pb-1"
                onKeyDown={e => e.stopPropagation()}
              >
                <Input
                  placeholder={`${t('Find Clip', { ns: 'common' })} ...`}
                  type="search"
                  autoFocus
                  onChange={e => {
                    setSearchTerm(e.target.value)
                  }}
                  value={searchTerm}
                  iconLeft={<Search className="h-4 w-4" />}
                  classNameInput="w-full pr-0 h-7"
                  className="text-md w-[260px] ring-offset-0 py-1 bg-slate-100 dark:bg-slate-700 border-r-0 border-t-0 border-b-0 h-8"
                />
              </Flex>
              <SimpleBar
                className="code-filter"
                style={{ height: 'auto', maxHeight: '260px' }}
                autoHide={false}
              >
                {clipItemsFiltered.map(({ id, name }, i) => (
                  <DropdownMenuItem
                    key={id ?? i}
                    onKeyDown={e => e.stopPropagation()}
                    className={`${
                      i > 0 ? 'border-t' : ''
                    } border-slate-100 dark:border-slate-800/90 ml-1 rounded-none`}
                    onClick={() => {
                      creatingNewMenuItem.value = {
                        orderNumber,
                        currentMenuItemId,
                        parentId,
                        type: ITEM,
                        clipId: id,
                      }
                    }}
                  >
                    <span>{name}</span>
                  </DropdownMenuItem>
                ))}
              </SimpleBar>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
