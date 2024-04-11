import { useEffect } from 'react'
import { Pin, PinOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import {
  Button,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Text,
} from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

export function UnPinAll({
  onConfirm,
  onCancel,
  onOpen = () => {},
  buttonClassName,
}: {
  buttonClassName: string
  onOpen: (isOpen: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const showConfirmation = useSignal(false)

  useEffect(() => {
    onOpen(showConfirmation.value)
  }, [showConfirmation.value])

  return (
    <Popover defaultOpen={false} open={showConfirmation.value}>
      <PopoverAnchor asChild>
        <Button
          variant="ghost"
          size="mini"
          title={showConfirmation.value ? '' : t('UnPin All', { ns: 'common' })}
          onClick={() => {
            showConfirmation.value = true
          }}
          className={buttonClassName}
        >
          <Flex className="font-medium text-sm gap-1 !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-400">
            <Pin size={15} className="group-hover:hidden" />
            <PinOff
              size={15}
              className="hidden group-hover:block opacity-0 group-hover:opacity-100"
            />
          </Flex>
        </Button>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={12}
        align="center"
        className="px-2 py-1 pb-2 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-900 w-fit mr-2"
        onEscapeKeyDown={() => {
          showConfirmation.value = false
        }}
        onPointerDownOutside={() => {
          showConfirmation.value = false
        }}
      >
        {showConfirmation.value && (
          <Flex className="flex-col">
            <Text color="black" size="sm" className="!inline-block">
              {t('Are you sure?', { ns: 'common' })}
            </Text>
            <Spacer h={1} />
            <Flex>
              <Button
                variant="outline"
                size="mini"
                autoFocus={false}
                className="text-gray-500 hover:text-gray-600 mr-2 border-gray-100 hover:border-gray-200 dark:text-gray-400 dark:border-gray-800 hover:dark:bg-gray-700 px-1.5 py-0.5 text-sm"
                onClick={() => {
                  showConfirmation.value = false
                  onCancel()
                }}
              >
                {t('Cancel', { ns: 'common' })}
              </Button>
              <Button
                variant="outline"
                size="mini"
                autoFocus={false}
                className="bg-orange-100 hover:bg-opacity-80 hover:bg-orange-200 !text-orange-500/80 dark:!text-orange-400/80 hover:!text-orange-500 dark:hover:!text-orange-300 dark:hover:border-orange-500/70 border-orange-200 dark:bg-orange-900/40 dark:border-orange-900 px-1.5 py-0.5 text-sm"
                onClick={() => {
                  showConfirmation.value = false
                  onConfirm()
                }}
              >
                {t('UnPin All', { ns: 'common' })}
              </Button>
            </Flex>
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  )
}
