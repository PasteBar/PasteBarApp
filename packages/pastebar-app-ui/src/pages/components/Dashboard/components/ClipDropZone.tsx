import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Box, Text } from '~/components/ui'

interface ClipDropZoneProps {
  isOver: boolean
}

function ClipDropZoneComponent({ isOver }: ClipDropZoneProps) {
  const { t } = useTranslation()
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dropRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    })
  }, [dropRef])

  return (
    <Box
      ref={dropRef}
      className={`flex flex-row items-center justify-center border-2 my-2 border-dashed rounded-md w-full h-16 ${
        isOver
          ? 'bg-slate-50/50 dark:bg-slate-700/50 border-blue-400'
          : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-500'
      }`}
    >
      <Text className="!text-sm !font-medium !text-blue-500 text-center">
        {isOver ? (
          t('Drop To Add', { ns: 'common' })
        ) : (
          <Plus size={23} className={`${isOver ? 'text-blue-400' : 'text-slate-400'}`} />
        )}
      </Text>
    </Box>
  )
}

export const ClipDropZone = ClipDropZoneComponent
