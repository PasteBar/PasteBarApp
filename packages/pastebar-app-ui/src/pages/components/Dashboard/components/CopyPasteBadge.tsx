import { Signal } from '@preact/signals-react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge, Box } from '~/components/ui'

export const CopyPasteBadge = ({
  id,
  isCopiedOrPasted,
  pastedItemCountDown,
  isCopied,
  pastedText,
  copyOrPasteFieldId,
}: {
  id: string | undefined
  isCopiedOrPasted: boolean
  pastedItemCountDown: number | null
  isCopied: boolean
  pastedText: string
  copyOrPasteFieldId: Signal<string | null>
}) => {
  const { t } = useTranslation()
  if (copyOrPasteFieldId.value !== id || !isCopiedOrPasted) {
    return null
  }

  let badgeContent
  if (!pastedItemCountDown) {
    badgeContent = (
      <span className="flex items-center justify-center text-[10px] uppercase font-semibold text-white pr-1.5 py-0">
        <Check size={14} className="mr-1" />
        {isCopied
          ? t('Copied', { ns: 'common' })
          : pastedText
            ? t('Pasted', { ns: 'common' })
            : ''}
      </span>
    )
  } else if (pastedItemCountDown > 0) {
    badgeContent = t('Paste in {{pastingCountDown}}...', {
      ns: 'common',
      pastingCountDown: pastedItemCountDown,
    })
  }

  return (
    <Box className="w-full h-full border border-green-700 bg-green-100/80 dark:bg-green-800 absolute right-0 top-0 flex items-center justify-center pointer-events-none px-2 !rounded-md z-100 animate-in fade-in transition-opacity">
      <Badge
        className={`${
          !pastedItemCountDown
            ? 'bg-green-700 dark:bg-green-800 dark:text-white'
            : 'ml-1 bg-green-700 dark:bg-green-800 dark:text-white !px-2'
        } fade-in-animation py-[2px] whitespace-nowrap`}
      >
        {badgeContent}
      </Badge>
    </Box>
  )
}
