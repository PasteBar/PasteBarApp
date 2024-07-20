import { Signal } from '@preact/signals-react'
import Logo from '~/layout/Logo'
import { settingsStoreAtom } from '~/store'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai/react'
import { ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import Modal from '~/components/molecules/modal'
import { Button, Flex, Text } from '~/components/ui'

import { SocialContacts } from './SocialContacts'

type Props = {
  open: boolean
  showUpdateAppIsLatest: Signal
  showUpdateChecking: Signal
  onClose: () => void
}

export default function ModalAboutPasteBar({
  open,
  onClose,
  showUpdateAppIsLatest,
  showUpdateChecking,
}: Props) {
  const { t } = useTranslation()

  const { checkForUpdate } = useAtomValue(settingsStoreAtom)

  const buildDate = dayjs(BUILD_DATE).format('MMMM, YYYY')

  return (
    <Modal open={open} handleClose={onClose} positionTop={true}>
      <Modal.Body className="min-w-[400px] relative">
        <Button
          variant="link"
          type="button"
          onClick={onClose}
          className="hover:bg-slate-200 px-2 absolute right-1.5 top-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:dark:text-slate-400 hover:bg-transparent dark:hover:bg-transparent"
        >
          <X className="w-5 h-5" />
        </Button>
        <Modal.Content>
          <Flex className="w-full flex-col gap-1 mt-1">
            <Flex className="h-fit w-full items-center">
              <Logo width={80} height={80} />
            </Flex>
            <Text className="font-semibold text-2xl">
              {t('PasteBar', { ns: 'common' })}
            </Text>
            <Text className="font-light text-center">
              {t('Version', { ns: 'common' })}: {APP_VERSION}
            </Text>
            <Text className="font-light text-center">
              {t('Build on {{buildDate}}', { ns: 'common', buildDate })}
            </Text>
            <a
              href={`https://${t('www.site', { ns: 'common' })}`}
              target="_blank"
              className="underline !text-blue-600 dark:!text-blue-400 cursor-pointer"
            >
              {t('www.site', { ns: 'common' })}
            </a>

            <Spacer h={3} />
            <div className="flex w-full justify-center items-center gap-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  checkForUpdate(true)
                  showUpdateAppIsLatest.value = true
                }}
                className="hover:bg-blue-600 hover:text-white dark:bg-gray-700/50 bg-gray-200/50 dark:hover:bg-blue-600"
              >
                {showUpdateAppIsLatest.value
                  ? t('No Update Available', { ns: 'updater' })
                  : showUpdateChecking.value
                    ? t('Checking for Update...', { ns: 'updater' })
                    : t('Check for Update', { ns: 'updater' })}
              </Button>
            </div>
          </Flex>
        </Modal.Content>
        <Modal.Footer className="flex-col items-center !pt-0 !pb-5 relative">
          <Text className="text-sm mb-2 opacity-50 flex justify-center items-center ">
            {t('Stay in touch', { ns: 'common' })}
            <ExternalLink className="w-[13px] h-[13px] ml-1" />
          </Text>
          <SocialContacts />
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}
