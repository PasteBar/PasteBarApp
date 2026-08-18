import { useEffect, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import {
  closeEdit,
  forceSaveClipNameEditingError,
  forceSaveEditClipName,
  isClipNameEditing,
  showLargeViewClipId,
  themeStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai/react'
import {
  Check,
  Expand,
  MessageSquarePlus,
  MessageSquareText,
  Pencil,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ToolTip from '~/components/atoms/tooltip'
import ToolTipNotes from '~/components/atoms/tooltip-notes'
import InputField from '~/components/molecules/input'
import TextArea from '~/components/molecules/textarea'
import { Box, Button, ButtonGhost, Flex, Text } from '~/components/ui'

import { MAX_ITEM_NAME_LENGTH, MINIMAL_ITEM_NAME_LENGTH } from '~/store/constants'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { CLIP } from '../Dashboard'
import ColorSelector from './ColorSelector'

export function ClipEditName({
  clipId,
  color,
  isEditOnly,
  isLargeView,
  description,
  borderWidth,
  name,
}: {
  clipId: UniqueIdentifier
  borderWidth: number | undefined
  isEditOnly?: boolean
  name: string | undefined
  isLargeView: boolean | undefined
  description: string | null
  color: string | undefined
}) {
  const { t } = useTranslation()
  const renameError = useSignal(false)
  const renameEdit = useSignal(name ?? '')
  const noteEdit = useSignal('')

  const { themeDark } = useAtomValue(themeStoreAtom)
  const isDark = themeDark()

  const { updateItemById } = useUpdateItemById()
  const isNameEditing = useSignal(isClipNameEditing.value)
  const isNoteEditing = useSignal(false)

  useEffect(() => {
    renameError.value = false
    isClipNameEditing.value = isNameEditing.value
  }, [isNameEditing.value])

  useEffect(() => {
    if (name === t('New Clip', { ns: 'dashboard' })) {
      isNameEditing.value = true
    }
  }, [name])

  useEffect(() => {
    noteEdit.value = description ?? ''
    isClipNameEditing.value = isNoteEditing.value
  }, [isNoteEditing.value])

  useEffect(() => {
    if (isEditOnly) {
      isNameEditing.value = true
    }
  }, [isEditOnly])

  useEffect(() => {
    if (renameError.value) {
      forceSaveClipNameEditingError.value = true
    } else {
      forceSaveClipNameEditingError.value = false
    }
  }, [renameError.value])

  useEffect(() => {
    if (forceSaveEditClipName.value) {
      forceSaveEditClipName.value = false
      forceSaveClipNameEditingError.value = false
      if (!isNameEditing.value && !isNoteEditing.value) {
        return
      }
      if (!renameEdit.value.length || renameEdit.value.length > MAX_ITEM_NAME_LENGTH) {
        renameError.value = true
        return
      }

      if (isNoteEditing.value) {
        updateItemById({
          updatedItem: {
            description: noteEdit.value,
            itemId: clipId,
          },
        })
        setTimeout(() => {
          isNoteEditing.value = false
        }, 200)
      }

      if (!renameError.value) {
        updateItemById({
          updatedItem: {
            name: renameEdit.value,
            itemId: clipId,
          },
        })
        setTimeout(() => {
          isNameEditing.value = false
        }, 200)
      }
    }
  }, [forceSaveEditClipName.value])

  return (
    <Flex className="justify-start w-full">
      {!isNameEditing.value ? (
        <Flex className="justify-start mr-1 w-full">
          {!isNoteEditing.value && (
            <>
              <Box className="min-w-[24px]">
                <ColorSelector
                  color={color ?? null}
                  borderWidth={borderWidth}
                  type={CLIP}
                  itemId={clipId}
                  updateById={updateItemById}
                />
              </Box>
              <Text
                className={`text-sm text-ellipsis pl-1 overflow-hidden whitespace-nowrap border-dashed border-b min-w-[40px] border-${
                  color ? color : 'slate'
                }-400 hover:border-gray-400`}
                onClick={() => {
                  isNameEditing.value = true
                }}
                color="black"
              >
                {name}
              </Text>
              <Box
                onClick={() => {
                  isNameEditing.value = true
                }}
                className="ml-1 pr-0 pl-1 pt-[1px] text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100"
              >
                <ToolTip
                  text={t('Rename', { ns: 'dashboard' })}
                  isCompact
                  side="bottom"
                  sideOffset={10}
                  asChild
                >
                  <Pencil size={14} />
                </ToolTip>
              </Box>
            </>
          )}
          <Box
            title={
              description && !isNoteEditing.value
                ? t('Edit Note', { ns: 'dashboard' })
                : undefined
            }
            className={`${
              !isNoteEditing.value ? 'ml-1' : ''
            } pr-0 pl-1 pt-[1px]  text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100`}
          >
            {description ? (
              <ToolTipNotes
                text={isNoteEditing.value ? noteEdit.value : description}
                side="right"
                isDark={isDark}
                align="end"
                alignOffset={130}
                maxWidth={320}
                sideOffset={-10}
                asChild
              >
                <MessageSquareText
                  size={16}
                  onClick={() => {
                    isNoteEditing.value = true
                  }}
                />
              </ToolTipNotes>
            ) : (
              <ToolTip
                text={t('Add note', { ns: 'dashboard' })}
                isCompact
                side="bottom"
                sideOffset={10}
                asChild
                isDisabled={isNoteEditing.value}
              >
                <MessageSquarePlus
                  size={16}
                  onClick={() => {
                    isNoteEditing.value = true
                  }}
                />
              </ToolTip>
            )}
          </Box>
          {!isClipNameEditing.value && (
            <Flex className="ml-auto px-1.5 items-center justify-center">
              <ButtonGhost
                className="hover:bg-transparent mr-1.5"
                onClick={() => {
                  showLargeViewClipId.value = isLargeView ? null : clipId
                }}
              >
                <ToolTip
                  text={
                    true
                      ? t('Close Expand Edit', { ns: 'common' })
                      : t('Expand Edit', { ns: 'common' })
                  }
                  delayDuration={2000}
                  isCompact
                  side="bottom"
                  sideOffset={10}
                >
                  <Expand size={13} />
                </ToolTip>
              </ButtonGhost>

              <ButtonGhost
                className="hover:bg-transparent"
                onClick={() => {
                  closeEdit()
                }}
              >
                <ToolTip
                  text={t('Close Edit', { ns: 'common' })}
                  delayDuration={2000}
                  isCompact
                  side="bottom"
                  sideOffset={10}
                >
                  <X size={18} />
                </ToolTip>
              </ButtonGhost>
            </Flex>
          )}
          {isNoteEditing.value && (
            <Flex className="w-full justify-start items-center">
              <TextArea
                tabIndex={0}
                enableEmoji={false}
                className="bg-white w-full ml-2 rounded-md text-sm min-w-[120px]"
                classNameArea="!pb-1"
                placeholder={t('Enter clip note', { ns: 'dashboard' })}
                rows={1}
                autoFocus
                autoCorrect="off"
                spellCheck={false}
                enableEmojiInside={true}
                label=""
                maxRows={5}
                value={noteEdit.value}
                onKeyDown={async e => {
                  e.stopPropagation()
                  if (e.key === 'Escape') {
                    isNoteEditing.value = false
                  }
                }}
                defaultValue={description ?? ''}
                onChange={e => {
                  noteEdit.value = e.target.value
                }}
              />
              <Flex className="ml-2">
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
                            description: noteEdit.value,
                            itemId: clipId,
                          },
                        })
                        setTimeout(() => {
                          isNoteEditing.value = false
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
                        isNoteEditing.value = false
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
      ) : (
        <>
          <ToolTip
            open={renameError.value}
            asChild
            classNameTrigger="w-full"
            text={
              renameEdit.value.length <= MINIMAL_ITEM_NAME_LENGTH
                ? t('Too short', { ns: 'dashboard' })
                : t('Too long', { ns: 'dashboard' })
            }
            side="bottom"
            className="bg-rose-50 text-red-500 dark:bg-rose-900 dark:text-red-50 border-rose-100 dark:border-rose-950 text-base font-semibold border !px-2 !py-1.5"
          >
            <InputField
              small
              autoFocus
              className="bg-white rounded-md text-sm font-semibold w-full min-w-[120px]"
              placeholder={t('Enter clip name', { ns: 'dashboard' })}
              onBlur={async () => {
                if (
                  !renameEdit.value.length ||
                  renameEdit.value.length > MAX_ITEM_NAME_LENGTH
                ) {
                  renameError.value = true
                }
              }}
              onKeyDown={async e => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  isNameEditing.value = false
                } else if (
                  e.key === 'Enter' &&
                  (!renameEdit.value.length ||
                    renameEdit.value.length > MAX_ITEM_NAME_LENGTH)
                ) {
                  renameError.value = true
                } else if (e.key === 'Enter') {
                  await updateItemById({
                    updatedItem: {
                      name: renameEdit.value,
                      itemId: clipId,
                    },
                  })
                  setTimeout(() => {
                    isNameEditing.value = false
                    if (isEditOnly) {
                      closeEdit()
                    }
                  }, 300)
                }
              }}
              defaultValue={name}
              onFocus={e => {
                e.target.select()
              }}
              onChange={e => {
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
          <Flex className="ml-1">
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
                  className="px-1.5 h-8 text-blue-500 dark:!text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700 dark:hover:!text-blue-300 border-0"
                  onClick={async () => {
                    if (
                      !renameEdit.value.length ||
                      renameEdit.value.length > MAX_ITEM_NAME_LENGTH
                    ) {
                      renameError.value = true
                      return
                    }

                    if (!renameError.value) {
                      await updateItemById({
                        updatedItem: {
                          name: renameEdit.value,
                          itemId: clipId,
                        },
                      })
                      setTimeout(() => {
                        isNameEditing.value = false
                        if (isEditOnly) {
                          closeEdit()
                        }
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
                    isNameEditing.value = false
                    if (isEditOnly) {
                      closeEdit()
                    }
                  }}
                >
                  <X size={18} />
                </Button>
              </Box>
            </ToolTip>
          </Flex>
        </>
      )}
    </Flex>
  )
}
