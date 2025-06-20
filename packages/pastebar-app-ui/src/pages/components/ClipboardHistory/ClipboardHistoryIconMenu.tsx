import { UniqueIdentifier } from '@dnd-kit/core'
import { confirm, message } from '@tauri-apps/api/dialog'
import HistoryIcon from '~/assets/icons/history'
import {
  clipboardHistoryStore,
  createClipHistoryItemIds,
  hasDashboardItemCreate,
  hoveringHistoryRowId,
  settingsStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  CalendarX,
  CopyCheck,
  CopyMinus,
  CopyPlus,
  CopyX,
  FileCog,
  TrashIcon,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Badge, Button, Flex, Shortcut, Text } from '~/components/ui'

import {
  useClearClipboardHistoryOlderThan,
  useClearRecentClipboardHistory,
  useDeleteClipboardHistoryByIds,
} from '~/hooks/queries/use-history-items'

import { CreateDashboardItemType } from '~/types/menu'

type ClipboardHistoryIconMenuProps = {
  selectedHistoryItems: UniqueIdentifier[]
  setShowSelectHistoryItems: (show: boolean) => void
  isDark: boolean
  isDeleting: boolean
  onDelete: (clearSearchAndFilter?: boolean) => void
  setIsDeleting: (isDeleting: boolean) => void
  setSelectedHistoryItems: (ids: UniqueIdentifier[]) => void
  setSelectHistoryItem: (id: UniqueIdentifier) => void
  showSelectHistoryItems: boolean
}

export const ClipboardHistoryIconMenu = ({
  selectedHistoryItems,
  setShowSelectHistoryItems,
  isDeleting,
  onDelete,
  setIsDeleting,
  isDark,
  setSelectHistoryItem,
  setSelectedHistoryItems,
  showSelectHistoryItems,
}: ClipboardHistoryIconMenuProps) => {
  const { t } = useTranslation()
  const { deleteClipboardHistoryByIds } = useDeleteClipboardHistoryByIds()
  const { clearRecentClipboardHistory } = useClearRecentClipboardHistory()
  const { clearClipboardHistoryOlderThan } = useClearClipboardHistoryOlderThan()
  const navigate = useNavigate()
  const {
    isHistoryEnabled,
    setIsHistoryEnabled,
    isHistoryAutoUpdateOnCaputureEnabled,
    setIsHistoryAutoUpdateOnCaputureEnabled,
    isKeepPinnedOnClearEnabled,
    isKeepStarredOnClearEnabled,
  } = useAtomValue(settingsStoreAtom)

  useHotkeys(['alt+s'], () => {
    setShowSelectHistoryItems(!showSelectHistoryItems)
  })

  useHotkeys(['control+s'], () => {
    if (hoveringHistoryRowId.value) {
      setSelectHistoryItem(hoveringHistoryRowId.value)
    }
  })

  useHotkeys(['alt+h', 'meta+h'], () => {
    setIsHistoryEnabled(!isHistoryEnabled)
  })

  useHotkeys(['alt+a', 'meta+a'], () => {
    setIsHistoryAutoUpdateOnCaputureEnabled(!isHistoryAutoUpdateOnCaputureEnabled)
  })

  useHotkeys(['alt+u', 'meta+u'], () => {
    clipboardHistoryStore.getState().updateClipboardHistory()
  })

  useHotkeys(['alt+d', 'control+d'], () => {
    setSelectedHistoryItems([])
  })

  const isMainWindow = window.isMainWindow

  const clearHistoryItems = async (
    durationType: 'days' | 'weeks' | 'months' | 'year' | 'hour',
    olderThen: string,
    isRecent: boolean = false
  ) => {
    const durationTypeMap = {
      hour:
        olderThen === '1'
          ? t('Hour', { ns: 'calendar' })
          : t('Hours', { ns: 'calendar' }),
      days:
        olderThen === '1' ? t('Day', { ns: 'calendar' }) : t('Days', { ns: 'calendar' }),
      weeks:
        olderThen === '1'
          ? t('Week', { ns: 'calendar' })
          : t('Weeks', { ns: 'calendar' }),
      months:
        olderThen === '1'
          ? t('Month', { ns: 'calendar' })
          : t('Months', { ns: 'calendar' }),
      year:
        olderThen === '1'
          ? t('Year', { ns: 'calendar' })
          : t('Years', { ns: 'calendar' }),
    } as const

    const isClearAll = olderThen === '0' && durationType === 'days'

    const comfirmMessage = isClearAll
      ? t('Do you really want to remove ALL clipboard history items?', { ns: 'history' })
      : isRecent
        ? t(
            'Do you want to remove all recent clipboard history older than {{olderThen}} {{durationType}}',
            { ns: 'history', olderThen, durationType: durationTypeMap[durationType] }
          )
        : t(
            'Do you want to remove clipboard history items older than {{olderThen}} {{durationType}}',
            { ns: 'history', olderThen, durationType: durationTypeMap[durationType] }
          )

    const confirmed = await confirm(comfirmMessage, {
      title: t('{{isAll}} Clipboard History', {
        ns: 'history',
        isAll: isClearAll
          ? t('Clear All', { ns: 'history' })
          : t('Clear', { ns: 'history' }),
      }).trim(),
      okLabel: t('{{isAll}} Clipboard History', {
        ns: 'history',
        isAll: isClearAll
          ? t('Clear All', { ns: 'history' })
          : t('Clear', { ns: 'history' }),
      }).trim(),
      cancelLabel: t('Cancel', { ns: 'common' }),
    })

    if (confirmed) {
      try {
        if (isClearAll) {
          const confirmedClearAll = await confirm(
            t('Please confirm your action!', { ns: 'common' }),
            {
              title: t('Confirm Clear All History', { ns: 'history' }),
              okLabel: t('Confirm', { ns: 'common' }),
              cancelLabel: t('Cancel', { ns: 'common' }),
            }
          )
          if (!confirmedClearAll) {
            return
          }
        }
        if (isRecent) {
          await clearRecentClipboardHistory({
            durationType,
            duration: olderThen,
            keepPinned: isKeepPinnedOnClearEnabled,
            keepStarred: isKeepStarredOnClearEnabled,
          })
        } else {
          await clearClipboardHistoryOlderThan({
            durationType,
            olderThen,
            keepPinned: isKeepPinnedOnClearEnabled,
            keepStarred: isKeepStarredOnClearEnabled,
          })
        }
        setTimeout(() => {
          setSelectedHistoryItems([])
          setShowSelectHistoryItems(false)
          setIsDeleting(false)
          onDelete(isClearAll)
        }, 400)
        await message(
          t("All done! History's been cleared.", { ns: 'history' }),
          'Success'
        )
      } catch (e) {
        console.error(e)
        await message(
          t('Something goes wrong! Please try again.', { ns: 'common' }),
          'Error'
        )
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="light"
          id="history-menu-button_tour"
          className="w-10 text-gray-400 hover:text-gray-500 hover:dark:text-gray-400 dark:text-gray-500 bg-transparent p-1 relative hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
        >
          <HistoryIcon
            className="w-5 max-w-[22px] min-w-[16px] stroke-[1.3px]"
            lightingColor={isDark ? '#0f182a' : '#f1f5f9'}
          />
          {selectedHistoryItems.length > 0 && (
            <Badge variant="gray" className="absolute left-[-10px] top-[-10px]">
              {selectedHistoryItems.length}
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
          {showSelectHistoryItems ? (
            <DropdownMenuItem
              onClick={() => {
                setShowSelectHistoryItems(false)
              }}
            >
              <CopyX className="mr-2 h-4 w-4" />
              <Text className="mr-2">{t('Hide Muli Select', { ns: 'common' })}</Text>
              <DropdownMenuShortcut>
                <Shortcut keys="ALT+S" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                setShowSelectHistoryItems(true)
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
            disabled={selectedHistoryItems.length === 0}
            onClick={() => {
              setSelectedHistoryItems([])
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
            disabled={selectedHistoryItems.length === 0}
            onClick={() => {
              hasDashboardItemCreate.value = CreateDashboardItemType.CLIP
              createClipHistoryItemIds.value = Array.from(
                new Set([...selectedHistoryItems])
              )
              setTimeout(() => {
                setSelectedHistoryItems([])
              }, 400)
            }}
          >
            <CopyPlus className="mr-2 h-4 w-4" />
            <Text>{t('Add to Board', { ns: 'dashboard' })}</Text>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={selectedHistoryItems.length === 0}
            onClick={async e => {
              if (isDeleting) {
                await deleteClipboardHistoryByIds({ historyIds: selectedHistoryItems })
                setTimeout(() => {
                  onDelete()
                  setSelectedHistoryItems([])
                  setShowSelectHistoryItems(false)
                  setIsDeleting(false)
                }, 400)
              } else {
                e.preventDefault()
                setIsDeleting(true)
                setTimeout(() => {
                  setIsDeleting(false)
                }, 3000)
              }
            }}
          >
            <TrashIcon className={`mr-2 h-4 w-4 ${isDeleting ? 'text-red-500' : ''}`} />
            <Flex>
              <Text className={`mr-1 ${isDeleting ? '!text-red-500' : ''}`}>
                {!isDeleting
                  ? t('Delete', { ns: 'common' })
                  : t('Click to Confirm', { ns: 'common' })}
              </Text>
              {selectedHistoryItems.length > 0 && (
                <>
                  {isDeleting ? (
                    <Badge
                      variant="destructive"
                      className="bg-red-500 ml-1 py-0 font-semibold"
                    >
                      {selectedHistoryItems.length}
                    </Badge>
                  ) : (
                    <Badge
                      variant="graySecondary"
                      className="bg-grey-200 text-grey-500 ml-1 py-0 font-semibold"
                    >
                      {selectedHistoryItems.length}
                    </Badge>
                  )}
                </>
              )}
            </Flex>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CalendarX className="mr-2 h-4 w-4" />
              <Text>{t('Clear History', { ns: 'history' })} ...</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Text>{t('Days', { ns: 'calendar' })}</Text>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('days', '1', true)
                      }}
                    >
                      {t('last', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        {t('Day', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('days', '3', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        3 {t('Days2', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('days', '5', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        5 {t('Days3', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('days', '7', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        7 {t('Days3', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Text>{t('Weeks', { ns: 'calendar' })}</Text>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('weeks', '1', true)
                      }}
                    >
                      {t('last2', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        {t('Week2', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('weeks', '2', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        2 {t('Weeks', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('weeks', '3', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        3 {t('Weeks', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('weeks', '4', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        4 {t('Weeks', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Text>{t('Months', { ns: 'calendar' })}</Text>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('months', '1', true)
                      }}
                    >
                      {t('last', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        {t('Month', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('months', '2', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        2 {t('Months', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('months', '3', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        3 {t('Months', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('months', '6', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        6 {t('Months2', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Text>{t('Years', { ns: 'calendar' })}</Text>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('year', '1', true)
                      }}
                    >
                      {t('last', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        {t('Year', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('year', '2', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        2 {t('Years', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        clearHistoryItems('year', '3', true)
                      }}
                    >
                      {t('last3', { ns: 'calendar' })}
                      <Text className="font-semibold ml-1">
                        3 {t('Years', { ns: 'calendar' })}
                      </Text>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Text>{t('Older then', { ns: 'calendar' })}</Text>...
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Text>{t('Days', { ns: 'calendar' })}</Text>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('days', '1')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            1 {t('Day', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('days', '3')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            3 {t('Days', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('days', '5')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            5 {t('Days', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('days', '7')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            7 {t('Days', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Text>{t('Weeks', { ns: 'calendar' })}</Text>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('weeks', '1')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            1 {t('Week', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('weeks', '2')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            2 {t('Weeks', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('weeks', '3')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            3 {t('Weeks', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('weeks', '4')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            4 {t('Weeks', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Text>{t('Months', { ns: 'calendar' })}</Text>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('months', '1')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            1 {t('Month', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('months', '2')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            2 {t('Months', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('months', '3')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            3 {t('Months', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('months', '6')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            6 {t('Months2', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Text>{t('Years2', { ns: 'calendar' })}</Text>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('year', '1')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            1 {t('Year', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('year', '2')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            2 {t('Years', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            clearHistoryItems('year', '3')
                          }}
                        >
                          {t('older then', { ns: 'calendar' })}
                          <Text className="font-semibold ml-1">
                            3 {t('Years', { ns: 'calendar' })}
                          </Text>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  clearHistoryItems('hour', '1', true)
                }}
              >
                {t('last', { ns: 'calendar' })}
                <Text className="font-semibold ml-1">
                  {t('Hour', { ns: 'calendar' })}
                </Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  clearHistoryItems('hour', '2', true)
                }}
              >
                {t('last3', { ns: 'calendar' })}
                <Text className="font-semibold ml-1">
                  2 {t('Hours', { ns: 'calendar' })}
                </Text>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  clearHistoryItems('days', '0')
                }}
              >
                <Text className="font-semibold">
                  {t('Clear All History', { ns: 'history' })}
                </Text>
              </DropdownMenuItem>
              {isMainWindow && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      navigate('/app-settings/history', { replace: true })
                    }}
                  >
                    <FileCog className="mr-2 h-4 w-4" />
                    <Text>{t('Auto-Clear Settings', { ns: 'history' })} ...</Text>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
