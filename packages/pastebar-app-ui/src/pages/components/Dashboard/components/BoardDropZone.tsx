import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { createClipBoardItemId, hasDashboardItemCreate } from '~/store'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHoverIntent } from 'react-use-hoverintent'

import mergeRefs from '~/components/atoms/merge-refs'
import Spinner from '~/components/atoms/spinner'
import { Box, Text } from '~/components/ui'

import { Card, CardContent } from './BaseCard'
import { Board, BoardDragData } from './Board'

interface BoardDropZoneProps {
  isNewClip?: boolean
  isCreatingClip?: boolean
  board: Board
}

function BoardDropZoneComponent({
  board,
  isNewClip,
  isCreatingClip,
}: BoardDropZoneProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({
    id: board.id,
    data: {
      type: 'board',
      board,
    } satisfies BoardDragData,
  })

  const [isHovering, hoverRef] = useHoverIntent({
    timeout: 100,
    sensitivity: 500,
    interval: 100,
  })

  return (
    <Card
      className={`bg-secondary flex flex-col flex-shrink-0 m-2`}
      onClick={() => {
        if (isOver) {
          return
        }
        if (isNewClip) {
          createClipBoardItemId.value = board.id
          hasDashboardItemCreate.value = null
        }
      }}
      ref={mergeRefs(isNewClip ? hoverRef : null)}
    >
      <CardContent className="overflow-hidden m-0 p-0 ">
        <Box className="flex flex-grow flex-col gap-3 overflow-hidden p-1">
          <Box
            ref={setNodeRef}
            className={`flex flex-row items-center justify-center border-2 border-dashed rounded-md w-full h-12 ${
              isHovering ? 'cursor-pointer' : ''
            } ${
              isOver || isHovering
                ? 'bg-slate-50/50 dark:bg-slate-700/50 border-blue-400'
                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-500'
            }`}
          >
            {!isCreatingClip ? (
              <Text className="!text-sm !font-medium !text-blue-500 text-center">
                {isOver ? (
                  t('Drop To Add', { ns: 'dashboard' })
                ) : isHovering ? (
                  t('Click To Add', { ns: 'dashboard' })
                ) : (
                  <Plus
                    size={23}
                    className={`${
                      isOver || isHovering ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                )}
              </Text>
            ) : (
              <Spinner />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export const BoardDropZone = memo(BoardDropZoneComponent)
