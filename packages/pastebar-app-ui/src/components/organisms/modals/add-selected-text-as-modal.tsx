import { themeStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import { CodeViewerMemo } from '~/components/code-viewer'
import Modal from '~/components/molecules/modal'
import { Box, Button, Text } from '~/components/ui'

type Props = {
  open: boolean
  selectedText: string
  onConfirmMenu: (text: string) => void
  onConfirmClip: (text: string) => void
  onClose: () => void
}

export default function ModalConfirmationAddSelectedTextAs({
  open,
  selectedText,
  onClose,
  onConfirmMenu,
  onConfirmClip,
}: Props) {
  const { t } = useTranslation()
  const { themeDark } = useAtomValue(themeStoreAtom)

  const isDark = themeDark()

  return (
    <Modal open={open} handleClose={onClose}>
      <Modal.Body>
        <Modal.Header handleClose={onClose}>
          <h1 className="m-0">{t('Add to Clips or Menu', { ns: 'common' })}</h1>
        </Modal.Header>
        <Modal.Content className="!pt-2">
          <Box className="bg-slate-200/70 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800/70 px-2 pt-1">
            <CodeViewerMemo
              isDark={isDark}
              maxHeight={350}
              isLargeView={true}
              isShowMore={true}
              isWrapped={true}
              language="text"
              value={selectedText}
            />
          </Box>

          <Spacer h={4} />
          <Text className="font-light">
            {t(
              'You can add the selected text to your clips or menu. Please select the option below.',
              { ns: 'collections' }
            )}
          </Text>
        </Modal.Content>
        <Modal.Footer className="flex-col !pt-0 !pb-3">
          <div className="flex w-full justify-center gap-x-3">
            <Button
              variant="light"
              type="submit"
              onClick={() => {
                onConfirmClip(selectedText)
              }}
              className="w-full bg-blue-300 hover:bg-blue-500 hover:text-white dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t('Add Clip', { ns: 'common' })}
            </Button>
            <Button
              variant="light"
              type="submit"
              onClick={() => {
                onConfirmMenu(selectedText)
              }}
              className="w-full bg-blue-300 hover:bg-blue-500 hover:text-white dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t('Add Menu', { ns: 'common' })}
            </Button>
          </div>
          <div className="flex w-full justify-center mt-3">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              className="hover:bg-slate-200 dark:hover:bg-slate-900"
            >
              {t('Cancel', { ns: 'common' })}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}
