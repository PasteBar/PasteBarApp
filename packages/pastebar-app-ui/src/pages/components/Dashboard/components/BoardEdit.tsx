import { useEffect } from 'react'
import { type UniqueIdentifier } from '@dnd-kit/core'
import {
  closeEdit,
  isBoardNameEditing,
  isFullyExpandViewBoard,
  MAX_ITEM_NAME_LENGTH,
  showBoardNameNotSavedError,
  showExpandViewBoardId,
} from '~/store'
import { Check, Expand, Pencil, Plus, Shrink, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ToolTip from '~/components/atoms/tooltip'
import InputField from '~/components/molecules/input'
import TextArea from '~/components/molecules/textarea'
import { Box, Button, Flex, Text } from '~/components/ui'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { BOARD } from '../Dashboard'
import ColorSelector from './ColorSelector'

export function BoardEdit({
  boardName = '',
  boardSubtitle,
  isNewBoard,
  scrollRef,
  boardId,
  boardColor,
  boardBorderWidth,
}: {
  boardName: string
  boardSubtitle: string
  isNewBoard: boolean
  scrollRef?: React.RefObject<HTMLDivElement>
  boardId: UniqueIdentifier
  boardColor: string | null
  boardBorderWidth: number
}) {
  const { t } = useTranslation()
  const renameError = useSignal(false)
  const renameEdit = useSignal('')
  const subtitleEdit = useSignal('')
  const isNameEditing = useSignal(isBoardNameEditing.value)
  const isSubtitleEditing = useSignal(false)

  useEffect(() => {
    if (isNewBoard) {
      isNameEditing.value = true
    }
  }, [isNewBoard])

  useEffect(() => {
    renameError.value = false
    renameEdit.value = boardName
    isBoardNameEditing.value = isNameEditing.value
  }, [isNameEditing.value])

  useEffect(() => {
    subtitleEdit.value = boardSubtitle
    isBoardNameEditing.value = isSubtitleEditing.value
  }, [isSubtitleEditing.value])

  const { updateItemById } = useUpdateItemById()

  useEffect(() => {
    if (isNameEditing.value) {
      scrollRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, [isNameEditing.value, scrollRef?.current])

  const isEditing = isNameEditing.value || isSubtitleEditing.value

  return (
    <Flex className="flex-col w-full">
      <Flex className="justify-start w-full">
        {!isNameEditing.value ? (
          <>
            <Box className="min-w-[24px]">
              <ColorSelector
                color={boardColor}
                borderWidth={boardBorderWidth}
                type={BOARD}
                itemId={boardId}
                updateById={updateItemById}
              />
            </Box>
            <Text
              className={`!font-medium text-sm text-ellipsis !block overflow-hidden whitespace-nowrap border-dashed border-b border-${
                boardColor ? boardColor : 'slate'
              }-400 first-letter:uppercase hover:border-gray-400`}
              onClick={() => {
                if (isBoardNameEditing.value) {
                  showBoardNameNotSavedError.value = true
                  return
                }

                isNameEditing.value = true
              }}
              color="black"
            >
              {boardName}
            </Text>
            <Box
              onClick={() => {
                if (isBoardNameEditing.value) {
                  showBoardNameNotSavedError.value = true
                  return
                }

                isNameEditing.value = true
              }}
              title={t('Rename', { ns: 'dashboard' })}
              className="ml-1 pr-0 pl-1 pt-[1px] text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100"
            >
              <Pencil size={14} />
            </Box>

            {!isEditing && (
              <Flex className="items-center justify-center ml-auto pr-1 pl-2 py-0 gap-2">
                {showExpandViewBoardId.value !== boardId ? (
                  <Box
                    onClick={() => {
                      showExpandViewBoardId.value = boardId
                    }}
                    title={t('Expand Edit', { ns: 'common' })}
                    className="text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100"
                  >
                    <Expand size={16} />
                  </Box>
                ) : (
                  <Box
                    onClick={() => {
                      showExpandViewBoardId.value = null
                      isFullyExpandViewBoard.value = false
                    }}
                    title={t('Close Expand Edit', { ns: 'common' })}
                    className="text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100"
                  >
                    <Shrink size={16} />
                  </Box>
                )}
                <Box
                  onClick={() => {
                    closeEdit()
                  }}
                  title={t('Close Edit', { ns: 'dashboard' })}
                  className="text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100"
                >
                  <XCircle size={18} />
                </Box>
              </Flex>
            )}
          </>
        ) : (
          <>
            <ToolTip
              open={renameError.value || showBoardNameNotSavedError.value}
              asChild
              text={
                showBoardNameNotSavedError.value
                  ? t('Unsaved title', { ns: 'dashboard' })
                  : renameEdit.value.length > MAX_ITEM_NAME_LENGTH &&
                    t('Too long', { ns: 'dashboard' })
              }
              side="bottom"
              className="bg-rose-50 text-red-500 dark:bg-rose-900 dark:text-red-50 border-rose-100 dark:border-rose-950 text-base font-semibold border !px-2 !py-1.5"
            >
              <InputField
                small
                autoFocus
                className="bg-white rounded-md text-sm font-semibold max-w-[200px] min-w-[120px]"
                placeholder={t('Enter board title', { ns: 'dashboard' })}
                onKeyDown={async e => {
                  e.stopPropagation()
                  if (e.key === 'Escape') {
                    showBoardNameNotSavedError.value = false
                    isNameEditing.value = false
                  } else if (
                    e.key === 'Enter' &&
                    renameEdit.value.length > MAX_ITEM_NAME_LENGTH
                  ) {
                    renameError.value = true
                  } else if (e.key === 'Enter') {
                    await updateItemById({
                      updatedItem: {
                        name: renameEdit.value,
                        itemId: boardId,
                      },
                    })
                    showBoardNameNotSavedError.value = false

                    setTimeout(() => {
                      isNameEditing.value = false
                    }, 200)
                  }
                }}
                defaultValue={boardName}
                onFocus={e => {
                  if (boardName === t('New Board', { ns: 'dashboard' })) {
                    e.target.select()
                  }
                }}
                onChange={e => {
                  if (showBoardNameNotSavedError.value) {
                    showBoardNameNotSavedError.value = false
                  }
                  if (
                    renameError.value &&
                    e.target.value.length <= MAX_ITEM_NAME_LENGTH &&
                    renameError.value &&
                    e.target.value.length > 0
                  ) {
                    renameError.value = false
                  }
                  renameEdit.value = e.target.value
                }}
              />
            </ToolTip>
            <ToolTip
              text={t('Save', { ns: 'common' })}
              isCompact
              side="bottom"
              sideOffset={10}
              asChild
            >
              <Box tabIndex={0}>
                <Button
                  variant="outline"
                  size="mini"
                  className="ml-1 px-1.5 h-8 text-blue-500 dark:!text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700 dark:hover:!text-blue-300 border-0"
                  onClick={async () => {
                    if (renameEdit.value.length > MAX_ITEM_NAME_LENGTH) {
                      renameError.value = true
                      return
                    }

                    if (!renameError.value) {
                      await updateItemById({
                        updatedItem: {
                          name: renameEdit.value,
                          itemId: boardId,
                        },
                      })
                      showBoardNameNotSavedError.value = false

                      setTimeout(() => {
                        isNameEditing.value = false
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
                    showBoardNameNotSavedError.value = false
                    isNameEditing.value = false
                  }}
                >
                  <X size={18} />
                </Button>
              </Box>
            </ToolTip>
          </>
        )}
      </Flex>
      <Flex className="justify-start w-full mt-1 text-gray-500">
        {!isSubtitleEditing.value ? (
          !boardSubtitle ? (
            <>
              <Plus size={17} />
              <Text
                className="!text-mute ml-1.5 text-sm border-dashed border-b border-gray-400"
                onClick={() => {
                  if (isBoardNameEditing.value) {
                    showBoardNameNotSavedError.value = true
                    return
                  }
                  isSubtitleEditing.value = true
                }}
              >
                {t('Subtitle', { ns: 'dashboard' })}
              </Text>
            </>
          ) : (
            <Box
              className="!font-normal dark:text-slate-300 text-[12px] hover:underline decoration-1 decoration-gray-400 !decoration-dashed !underline-offset-4"
              onClick={() => {
                if (isBoardNameEditing.value) {
                  showBoardNameNotSavedError.value = true
                  return
                }
                isSubtitleEditing.value = true
              }}
            >
              {boardSubtitle}
              <Box
                title={t('Edit subtitle', { ns: 'dashboard' })}
                className="ml-0.5 pl-1 !inline-flex items-center text-primary/50 cursor-pointer opacity-80 hover:opacity-100"
              >
                <Pencil size={11} />
              </Box>
            </Box>
          )
        ) : (
          <Flex className="justify-start items-end flex-col mt-1 text-gray-500">
            <ToolTip
              open={showBoardNameNotSavedError.value}
              asChild
              text={
                showBoardNameNotSavedError.value
                  ? t('Unsaved subtitle', { ns: 'dashboard' })
                  : undefined
              }
              side="top"
              className="bg-rose-50 text-red-500 text-base font-semibold border border-rose-100 w-full"
            >
              <TextArea
                tabIndex={0}
                enableEmoji={false}
                className="bg-white rounded-md text-sm w-full mr-2 min-w-[120px]"
                placeholder={t('Enter board subtitle or description', {
                  ns: 'dashboard',
                })}
                rows={2}
                autoFocus
                enableEmojiInside={true}
                label=""
                maxRows={6}
                value={subtitleEdit.value}
                onKeyDown={e => {
                  e.stopPropagation()
                }}
                onChange={e => {
                  if (showBoardNameNotSavedError.value) {
                    showBoardNameNotSavedError.value = false
                  }

                  subtitleEdit.value = e.target.value
                }}
              />
            </ToolTip>
            <Flex className="items-start mt-1">
              <ToolTip
                text={t('Save', { ns: 'common' })}
                isCompact
                side="bottom"
                sideOffset={10}
                asChild
              >
                <Box tabIndex={0}>
                  <Button
                    variant="outline"
                    size="mini"
                    className="ml-1 px-1.5 h-8 text-blue-500 dark:!text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700 dark:hover:!text-blue-300 border-0"
                    onClick={async () => {
                      await updateItemById({
                        updatedItem: {
                          description: subtitleEdit.value,
                          itemId: boardId,
                        },
                      })
                      setTimeout(() => {
                        if (showBoardNameNotSavedError.value) {
                          showBoardNameNotSavedError.value = false
                        }
                        isSubtitleEditing.value = false
                      }, 200)
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
                      if (showBoardNameNotSavedError.value) {
                        showBoardNameNotSavedError.value = false
                      }
                      isSubtitleEditing.value = false
                    }}
                  >
                    <X size={18} />
                  </Button>
                </Box>
              </ToolTip>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
