import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import Modal from '~/components/molecules/modal'
import { Button, Checkbox, Text } from '~/components/ui'

type Props = {
  open: boolean
  setIsDeleteAllItemsInCollection: Dispatch<SetStateAction<boolean>>
  onConfirm: () => void
  onClose: () => void
}

export default function ModalConfirmationCollectionDelete({
  open,
  onClose,
  setIsDeleteAllItemsInCollection,
  onConfirm,
}: Props) {
  const { t } = useTranslation()
  return (
    <Modal open={open} handleClose={onClose}>
      <Modal.Body>
        <Modal.Header handleClose={onClose}>
          <h1 className="m-0">{t('Confirm Delete', { ns: 'common' })}</h1>
        </Modal.Header>
        <Modal.Content>
          <Text className="font-semibold">
            {t('Are you sure you want to delete this collection?', { ns: 'collections' })}
          </Text>
          <Spacer h={3} />
          <Text className="font-light">
            {t(
              'Deleting the collection will remove it permanently. You can also choose to delete all menu and clips items within the collection by checking the box below.',
              { ns: 'collections' }
            )}
          </Text>
          <Spacer h={3} />
          <Checkbox
            color="danger"
            onChange={isChecked => {
              setIsDeleteAllItemsInCollection(isChecked)
            }}
          >
            {t('Delete all menu items within this collection', { ns: 'collections' })}
          </Checkbox>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-x-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t('Cancel', { ns: 'common' })}
            </Button>
            <Button variant="danger" type="submit" onClick={onConfirm}>
              {t('Delete Collection', { ns: 'collections' })}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}
