import { open as openUrl } from '@tauri-apps/api/shell'
import i18n from '~/locales'
import { themeStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'
import { ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Modal from '~/components/molecules/modal'
import { Button, Flex } from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

type Props = {
  open: boolean
  onClose: () => void
}

export default function ModalContactSupportForm({ open, onClose }: Props) {
  const { t } = useTranslation()
  const showContinueInBrowser = useSignal(false)
  const { themeDark } = useAtomValue(themeStoreAtom)
  const isDark = themeDark()

  const contactUrl = `${
    import.meta.env.VITE_CONTACT_SERVER_URL
  }/contact/?source=app&locale=${i18n.language}&dark=${isDark ? 'true' : 'false'}`

  const openPaymentInBrowser = () => {
    openUrl(contactUrl)
  }

  return (
    <Modal open={open} handleClose={onClose} isLargeModal noFooter={true}>
      <Modal.Body
        className="dark:bg-green-950/30 bg-green-50/30 flex flex-col items-start p-0 relative"
        style={{
          height: 'calc(100vh - 180px)',
        }}
      >
        <Modal.Content className="!pt-3 mb-0 w-full !pb-2 grow !max-h-700">
          <iframe
            src={contactUrl}
            className="rounded-md border-0 bg-transparent dark:border-slate-800/70"
            style={{ width: 520, height: 'calc(100vh - 210px)' }}
          />
        </Modal.Content>

        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            onClose()
          }}
          className="text-slate-300 dark:hover:bg-slate-700 hover:bg-slate-600 absolute top-[-1 px] right-[-63px] w-14"
        >
          <X size={26} />
        </Button>
        <Flex className="items-center w-full gap-1 absolute bottom-[-50px] left-0">
          {!showContinueInBrowser.value ? (
            <>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  onClose()
                }}
                className="text-slate-200 dark:hover:bg-slate-700 hover:bg-slate-600 opacity-70 hover:opacity-100 h-10"
              >
                {t('Cancel', { ns: 'common' })}
              </Button>

              <Button
                variant="link"
                type="button"
                onClick={() => {
                  openPaymentInBrowser()
                  showContinueInBrowser.value = true
                }}
                className="h-10 text-slate-300 opacity-80 hover:opacity-100"
              >
                {t('Open contact form in browser', { ns: 'common' })}
                <ExternalLink size={16} className="ml-1.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  showContinueInBrowser.value = false
                }}
                className="h-10 text-slate-300 opacity-80 hover:opacity-100"
              >
                {t('Stay here', { ns: 'common' })}
              </Button>

              <Button
                variant="link"
                type="button"
                onClick={() => {
                  showContinueInBrowser.value = false
                  onClose()
                }}
                className="h-10 text-slate-300 opacity-80 hover:opacity-100"
              >
                {t('Close modal and continue in browser', { ns: 'common' })}
              </Button>
            </>
          )}
        </Flex>
      </Modal.Body>
    </Modal>
  )
}
