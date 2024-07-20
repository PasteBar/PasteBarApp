import { useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { UseMutateFunction } from '@tanstack/react-query'
import { availableColors } from '~/store'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { bgColor, borderColor } from '~/lib/utils'

import { Box, Flex, Popover, PopoverAnchor, PopoverContent, Text } from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

import { BOARD, CLIP, TAB } from '../Dashboard'

const BORDER_WIDTHS = {
  board: [0, 1, 2, 3],
  clip: [0, 1, 2, 3, 4, 5],
}

type ColorSelectProps = {
  color: string | null
  borderWidth?: number
  itemId: string | UniqueIdentifier | null
  type: typeof CLIP | typeof BOARD | typeof TAB
  onBorderWidthChange?: (width: number) => void
  onColorChange?: (color: string) => void
  onOpen?: () => void
  updateById?: UseMutateFunction<string, Error, Record<string, unknown>, unknown>
}

const ColorSelect = ({
  color,
  itemId,
  updateById,
  borderWidth,
  onOpen,
  onBorderWidthChange,
  onColorChange,
  type,
}: ColorSelectProps) => {
  const { t } = useTranslation()
  const isShowColorSelect = useSignal(false)

  useEffect(() => {
    if (isShowColorSelect.value && onOpen) {
      onOpen()
    }
  }, [isShowColorSelect.value])

  return (
    <Popover defaultOpen={false} open={isShowColorSelect.value}>
      <PopoverAnchor asChild>
        <Box
          className={`w-[22px] h-[22px] mr-1.5 cursor-pointer ${bgColor(
            color,
            '200'
          )} ${borderColor(
            color,
            '300',
            '600'
          )} border rounded-sm flex items-center justify-center`}
          title={t('Change color', { ns: 'dashboard' })}
          onClick={() => {
            isShowColorSelect.value = !isShowColorSelect.value
          }}
        >
          <ChevronDown size={13} className={`text-${color}-500 dark:text-${color}-300`} />
        </Box>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={16}
        align="center"
        className="p-3 bg-gray-100 border-gray-200 dark:bg-gray-900 dark:border-gray-950 pt-0"
        onEscapeKeyDown={() => {
          isShowColorSelect.value = false
        }}
        onPointerDownOutside={() => {
          isShowColorSelect.value = false
        }}
      >
        <Box>
          <Flex className="text-center py-1.5 mt-0.5 uppercase">
            <Text weight="medium" size="xs" className="!text-slate-400">
              {t('Select Color', { ns: 'dashboard' })}
            </Text>
          </Flex>
          <Box className="m-auto grid grid-cols-8 gap-3">
            {availableColors.map(_color => (
              <Box
                key={_color}
                onClick={async () => {
                  if (itemId && updateById) {
                    if (type === TAB) {
                      await updateById({
                        updatedTab: {
                          tabColor: _color,
                          tabId: itemId,
                        },
                      })
                    } else if (type === BOARD || type === CLIP) {
                      await updateById({
                        updatedItem: {
                          color: _color,
                          itemId: itemId,
                        },
                      })
                    }
                  } else if (onColorChange) {
                    onColorChange(_color)
                  }
                  isShowColorSelect.value = false
                }}
                className={`bg-${_color}-400 dark:bg-${_color}-700 w-6 h-6 flex justify-center cursor-pointer rounded-sm`}
              >
                {_color === color && (
                  <Check
                    size={16}
                    strokeWidth={4}
                    className="w-3 h-3 m-auto text-white"
                  />
                )}
              </Box>
            ))}
          </Box>
          {(type === BOARD || type === CLIP) && (
            <>
              <Flex className="text-center py-1.5 pt-2 uppercase">
                <Text weight="medium" size="xs" className="!text-slate-400">
                  {t('Border Width', { ns: 'dashboard' })}
                </Text>
              </Flex>
              <Box
                className={`m-auto items-center justify-items-center grid ${
                  type === BOARD ? 'grid-cols-4 px-10' : 'grid-cols-6 gap-1'
                }`}
              >
                {BORDER_WIDTHS[type].map(width => (
                  <Box
                    key={width}
                    onClick={async () => {
                      if (itemId && updateById) {
                        await updateById({
                          updatedItem: {
                            borderWidth: width,
                            itemId: itemId,
                          },
                        })
                      } else if (onBorderWidthChange) {
                        onBorderWidthChange(width)
                      }
                    }}
                    className={`bg-${color}-50 dark:bg-${color}-900 w-[28px] h-[26px] flex justify-center cursor-pointer border border-${color}-200 dark:border-${color}-700 ${
                      type !== BOARD
                        ? `border-[${
                            width > 0 ? 1 : 0
                          }px] border-l-${color}-500 border-l-[${width}px]`
                        : `border-[${width}px]`
                    }  rounded-lg `}
                  >
                    {borderWidth === width ? (
                      <Check
                        size={18}
                        strokeWidth={4}
                        className="w-3 h-3 m-auto text-slate-400"
                      />
                    ) : (
                      <Text size="xs" className="text-slate-400 !font-medium">
                        {width}
                      </Text>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </PopoverContent>
    </Popover>
  )
}

export default ColorSelect
