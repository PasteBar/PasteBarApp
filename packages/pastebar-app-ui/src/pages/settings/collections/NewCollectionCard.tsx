import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import InputField from '~/components/molecules/input'
import TextArea from '~/components/molecules/textarea'
import { Box, Button, Checkbox, Flex, TextNormal } from '~/components/ui'

import { useCreateNewCollection } from '~/hooks/queries/use-collections'

export default function NewCollectionCard({
  showAddNewCollection,
}: {
  showAddNewCollection?: boolean
}) {
  const { t } = useTranslation()
  const { createNewCollection, createNewCollectionSuccess } = useCreateNewCollection()
  const [collectionTitleEdit, setCollectionTitleEdit] = useState('')
  const [addDefaultItems, setAddDefaultItems] = useState(true)
  const [collectionDescriptionEdit, setCollectionDescriptionEdit] = useState('')
  const navigate = useNavigate()

  const [isNewCollection, setNewCollection] = useState(showAddNewCollection)

  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (createNewCollectionSuccess) {
      setCollectionTitleEdit('')
      setCollectionDescriptionEdit('')
      setNewCollection(false)
      navigate('/history', { replace: true })
    }
  }, [createNewCollectionSuccess])

  useEffect(() => {
    setCollectionTitleEdit('')
    setCollectionDescriptionEdit('')
    setAddDefaultItems(true)
  }, [isNewCollection])

  return (
    <Card
      key="new-collection"
      className={`${
        !isNewCollection
          ? 'opacity-80 justify-center items-center bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-700 min-h-[130px]'
          : 'border-blue-300 border-2'
      }`}
    >
      {isNewCollection ? (
        <>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="animate-in fade-in text-md w-full">
              <InputField
                small
                autoFocus={true}
                error={error ? t('Title too short', { ns: 'collections' }) : undefined}
                name="title"
                maxLength={50}
                onKeyDown={e => {
                  e.stopPropagation()
                  if (e.key === 'Enter') {
                    if (collectionTitleEdit.length < 3) {
                      setError(true)
                      return
                    }

                    createNewCollection({
                      createCollection: {
                        title: collectionTitleEdit,
                        isSelected: false,
                        description: collectionDescriptionEdit,
                      },
                    })
                  }
                }}
                placeholder={t('Enter collection title', { ns: 'collections' })}
                label={t('Collection Title', { ns: 'collections' })}
                value={collectionTitleEdit}
                onChange={e => {
                  if (error && e.target.value.length > 3) setError(false)
                  setCollectionTitleEdit(e.target.value)
                }}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TextArea
              enableEmojiInside
              enableEmoji={false}
              placeholder={t('Add a description for your collection', {
                ns: 'collections',
              })}
              rows={2}
              maxRows={4}
              maxLength={200}
              label={t('Description', { ns: 'collections' })}
              value={collectionDescriptionEdit}
              onChange={e => {
                setCollectionDescriptionEdit(e.target.value)
              }}
            />
            <Flex className="items-center justify-start mt-2 ml-[-8px]">
              <Checkbox
                color="default"
                checked={addDefaultItems}
                classNameLabel="py-1"
                onChange={isChecked => {
                  setAddDefaultItems(isChecked)
                }}
              >
                <TextNormal size="sm">
                  {t('Add default menu, tab and board', { ns: 'collections' })}
                </TextNormal>
              </Checkbox>
            </Flex>
          </CardContent>
          <CardFooter className="flex flex-row items-center justify-between space-y-0">
            <Box />
            <Flex className="min-h-[30px]">
              <Button
                size="xs"
                variant="link"
                onClick={() => {
                  setNewCollection(false)
                }}
              >
                {t('Cancel', { ns: 'common' })}
              </Button>

              <Button
                size="xs"
                className="bg-blue-100 text-blue-600 hover:bg-blue-100/50 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-800/50"
                onClick={async () => {
                  if (collectionTitleEdit.length < 3) {
                    setError(true)
                    return
                  }

                  await createNewCollection({
                    addDefaultMenuTabBoard: addDefaultItems,
                    createCollection: {
                      title: collectionTitleEdit,
                      isSelected: false,
                      description: collectionDescriptionEdit,
                    },
                  })
                }}
              >
                {t('Create', { ns: 'common' })}
              </Button>
            </Flex>
          </CardFooter>
        </>
      ) : (
        <Flex className="flex-row gap-3">
          <Button
            variant="ghost"
            className="rounded-md hover:dark:bg-blue-700/80 hover:bg-blue-200/80"
            onClick={() => {
              setNewCollection(true)
            }}
          >
            <Plus width={20} className="mr-1" />
            <TextNormal className="text-[15px] !font-semibold">
              {t('Add Collection', { ns: 'collections' })}
            </TextNormal>
          </Button>
        </Flex>
      )}
    </Card>
  )
}
