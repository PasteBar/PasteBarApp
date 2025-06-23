import { UniqueIdentifier } from '@dnd-kit/core'
import { confirm, message } from '@tauri-apps/api/dialog'
import {
  clipboardHistoryStore,
  createClipHistoryItemIds,
  hasDashboardItemCreate,
  hoveringHistoryRowId,
  settingsStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { CalendarX, CopyCheck, CopyPlus, CopyX, TrashIcon } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
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
import { Badge, Button, Flex, Text } from '~/components/ui'

import {
  useClearClipboardHistoryOlderThan,
  useClearRecentClipboardHistory,
  useDeleteClipboardHistoryByIds,
} from '~/hooks/queries/use-history-items'

import { CreateDashboardItemType } from '~/types/menu'

type ClipboardHistoryWindowIconsProps = {
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

export const ClipboardHistoryWindowIcons = ({
  selectedHistoryItems,
  setShowSelectHistoryItems,
  isDeleting,
  onDelete,
  setIsDeleting,
  setSelectHistoryItem,
  setSelectedHistoryItems,
  showSelectHistoryItems,
}: ClipboardHistoryWindowIconsProps) => {
  const { t } = useTranslation()
  const { deleteClipboardHistoryByIds } = useDeleteClipboardHistoryByIds()
  const { clearClipboardHistoryOlderThan } = useClearClipboardHistoryOlderThan()
  const { clearRecentClipboardHistory } = useClearRecentClipboardHistory()
  const {
    isHistoryEnabled,
    setIsHistoryEnabled,
    isHistoryAutoUpdateOnCaputureEnabled,
    setIsHistoryAutoUpdateOnCaputureEnabled,
  } = useAtomValue(settingsStoreAtom)

  useHotkeys(['alt+s'], () => {
    setShowSelectHistoryItems(!showSelectHistoryItems)
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
          await clearRecentClipboardHistory({ durationType, duration: olderThen })
        } else {
          await clearClipboardHistoryOlderThan({ durationType, olderThen })
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
    <Flex className="gap-3">
      <ToolTip
        asChild
        text={
          showSelectHistoryItems ? (
            <Text>{t('Hide Muli Select', { ns: 'common' })}</Text>
          ) : (
            <Text>{t('Multi Select', { ns: 'common' })}</Text>
          )
        }
        isCompact
      >
        <Button
          variant="light"
          onClick={() => {
            if (showSelectHistoryItems) {
              setShowSelectHistoryItems(false)
              setSelectedHistoryItems([])
            } else {
              setShowSelectHistoryItems(true)
            }
          }}
          className="w-10 text-slate-400 hover:text-slate-500 hover:dark:text-slate-400 dark:text-slate-500 bg-slate-100 p-1 relative hover:bg-slate-100/70 dark:bg-slate-900 dark:hover:bg-slate-700/70"
        >
          {showSelectHistoryItems ? <CopyX size={20} /> : <CopyCheck size={20} />}
          {selectedHistoryItems.length > 0 && (
            <Badge
              variant="slate"
              className="absolute left-[-10px] top-[-10px] hover:bg-slate-500"
            >
              {selectedHistoryItems.length}
            </Badge>
          )}
        </Button>
      </ToolTip>
      <ToolTip
        asChild
        text={
          selectedHistoryItems.length > 0 && isDeleting ? (
            <Text>{t('Click to Confirm', { ns: 'common' })}</Text>
          ) : (
            <Text>{t('Delete', { ns: 'common' })}</Text>
          )
        }
        isCompact
      >
        <Button
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
          className={`w-10 ${
            isDeleting
              ? 'bg-red-100 hover:bg-red-100/70 dark:bg-red-900 dark:hover:bg-red-700/70'
              : 'bg-slate-100 hover:bg-slate-100/70 dark:bg-slate-900 dark:hover:bg-slate-700/70'
          } ${
            selectedHistoryItems.length > 0
              ? 'text-red-400 hover:text-red-500 hover:dark:text-red-400 dark:text-red-500'
              : 'text-slate-400 hover:text-slate-500 hover:dark:text-slate-400 dark:text-slate-500'
          } p-1 relative`}
        >
          {isDeleting ? (
            <TrashIcon className={`${isDeleting ? 'text-red-500' : ''}`} size={20} />
          ) : (
            <TrashIcon className={`${isDeleting ? 'text-red-500' : ''}`} size={20} />
          )}
          {selectedHistoryItems.length > 0 && isDeleting && (
            <Badge
              variant="destructive"
              className="absolute left-[-10px] top-[-10px] hover:bg-red-500"
            >
              {selectedHistoryItems.length}
            </Badge>
          )}
        </Button>
      </ToolTip>
      <ToolTip
        asChild
        text={<Text>{t('Add to Board', { ns: 'dashboard' })}</Text>}
        isCompact
      >
        <Button
          variant="light"
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
          className="w-10 text-slate-400 hover:text-slate-500 hover:dark:text-slate-400 dark:text-slate-500 bg-slate-100 p-1 relative hover:bg-slate-100/70 dark:bg-slate-900 dark:hover:bg-slate-700/70"
        >
          <CopyPlus size={20} />
          {selectedHistoryItems.length > 0 && (
            <Badge
              variant="slate"
              className="absolute left-[-10px] top-[-10px] hover:bg-slate-500"
            >
              {selectedHistoryItems.length}
            </Badge>
          )}
        </Button>
      </ToolTip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="light"
            id="history-menu-button_tour"
            className="w-10 text-slate-400 hover:text-slate-500 hover:dark:text-slate-400 dark:text-slate-500 bg-slate-100 relative hover:bg-slate-100/70 dark:bg-slate-900 dark:hover:bg-slate-700/70"
          >
            <ToolTip text={<Text>{t('Clear History', { ns: 'common' })}</Text>} isCompact>
              <CalendarX size={20} />
            </ToolTip>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={10}
          align="start"
          shadow="shadow-[0_-2px_12px_0_rgb(0,0,0,0.1)]"
        >
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
                <Text className="font-semibold ml-1">{t('Day', { ns: 'calendar' })}</Text>
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

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              clearHistoryItems('hour', '1', true)
            }}
          >
            {t('last', { ns: 'calendar' })}
            <Text className="font-semibold ml-1">{t('Hour', { ns: 'calendar' })}</Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              clearHistoryItems('hour', '2', true)
            }}
          >
            {t('last3', { ns: 'calendar' })}
            <Text className="font-semibold ml-1">2 {t('Hours', { ns: 'calendar' })}</Text>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  )
}
