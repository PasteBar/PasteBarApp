import { useEffect, useState } from 'react'
import createMenuTree from '~/libs/create-menu-tree'
import { collectionsStoreAtom, settingsStoreAtom, uiStoreAtom } from '~/store'
import { useAtom, useAtomValue } from 'jotai'
import { CheckSquare, ChevronDown, ListFilter, LockKeyhole, Trash, Trash2 } from 'lucide-react' // Added ChevronDown, ListFilter
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useHoverIntent } from 'react-use-hoverintent'
import AutoSize from 'react-virtualized-auto-sizer'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge' // Added Badge import
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu' // Added DropdownMenu components
import { Switch } from '~/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import mergeRefs from '~/components/atoms/merge-refs'
import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import { useDynamicTree } from '~/components/libs/react-arborist'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import TextArea from '~/components/molecules/textarea'
import ModalConfirmationCollectionDelete from '~/components/organisms/modals/collection-delete-confirm-modal'
import { Box, Button, Flex, Text } from '~/components/ui'

import {
  useDeleteCollectionById,
  useGetCollections,
  useGetCollectionWithMenuItems,
  useSelectCollectionById,
  useUpdateCollectionById,
  useUpdateMovedMenuItemsInCollection,
} from '~/hooks/queries/use-collections'
import { useSignal } from '~/hooks/use-signal'

import NewCollectionCard from './NewCollectionCard'

export default function ManageCollectionsSection({
  showAddNewCollection,
}: {
  showAddNewCollection?: boolean
}) {
  const { t } = useTranslation()
  const {
    isShowCollectionNameOnNavBar,
    setIsShowCollectionNameOnNavBar,
    screenLockPassCode,
    protectedCollections,
    setProtectedCollections,
  } = useAtomValue(settingsStoreAtom)
  // collections is already available from collectionsStoreAtom further down
  // const collectionsAtom = useAtomValue(collectionsStoreAtom)

  useGetCollections()
  useUpdateMovedMenuItemsInCollection()
  useGetCollectionWithMenuItems()
  const { updateCollectionById } = useUpdateCollectionById()
  const { selectCollectionById } = useSelectCollectionById()
  const { deleteCollectionById } = useDeleteCollectionById()
  const { currentCollectionId, menuItems, collections } =
    useAtomValue(collectionsStoreAtom)
  const { returnRoute } = useAtomValue(uiStoreAtom)

  const [isHovering, hoverRef] = useHoverIntent({
    timeout: 10,
    sensitivity: 10,
    interval: 20,
  })

  const { setData } = useDynamicTree()
  const [error, setError] = useState<boolean>()

  const [collectionTitleEdit, setCollectionTitleEdit] = useState('')
  const [isDeleteAllItemsInCollection, setIsDeleteAllItemsInCollection] = useState(false)
  const [collectionDescriptionEdit, setCollectionDescriptionEdit] = useState('')
  const openConfirmationDeleteCollectionModal = useSignal(false)
  const [collectionCardEditId, setCollectionCardEditId] = useState<string | null>(null)
  const [confirmDeleteCollectionId, setConfirmDeleteCollectionId] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (collectionCardEditId) {
      const collection = collections.find(
        ({ collectionId }) => collectionId === collectionCardEditId
      )
      if (collection) {
        setCollectionTitleEdit(collection.title)
        setCollectionDescriptionEdit(collection.description ?? '')
      }
    } else {
      setCollectionTitleEdit('')
      setConfirmDeleteCollectionId(null)
      setCollectionDescriptionEdit('')
    }
  }, [collectionCardEditId])

  useEffect(() => {
    setData(menuItems.length > 0 ? createMenuTree(menuItems) : [])
  }, [menuItems, menuItems.length])

  return (
    <AutoSize disableWidth>
      {({ height }) => {
        return (
          height && (
            <Box className="p-4 py-6 select-auto">
              <Box className="text-xl my-2 flex items-center justify-between px-2">
                <Text className="light">
                  {t('Manage Collections', { ns: 'collections' })}
                </Text>
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
              </Box>
              <Spacer h={3} />
              <SimpleBar style={{ maxHeight: height - 85 }} autoHide={true}>
                <Box className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 animate-in fade-in">
                  <NewCollectionCard showAddNewCollection={showAddNewCollection} />
                  {collections.map(({ collectionId, title, description, isEnabled }) => {
                    const isCardEdit = collectionCardEditId === collectionId
                    const isSelected = currentCollectionId === collectionId
                    return (
                      <Card
                        key={collectionId}
                        className={`${isSelected && 'border-teal-500 border-2'} ${
                          !isEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="animate-in fade-in text-md font-medium">
                            {isCardEdit ? (
                              <InputField
                                className="text-md"
                                error={
                                  error
                                    ? t('Title too short', { ns: 'collections' })
                                    : undefined
                                }
                                maxLength={50}
                                small
                                onKeyDown={e => {
                                  e.stopPropagation()
                                  if (e.key === 'Enter') {
                                    if (collectionTitleEdit.length < 3) {
                                      setError(true)
                                      return
                                    }

                                    updateCollectionById({
                                      updatedCollection: {
                                        collectionId,
                                        title: collectionTitleEdit,
                                        isEnabled,
                                        description: collectionDescriptionEdit,
                                      },
                                    })

                                    setTimeout(() => {
                                      setCollectionCardEditId(null)
                                    }, 100)
                                  }
                                }}
                                label={t('Collection Title', { ns: 'collections' })}
                                placeholder={t('Enter collection title', {
                                  ns: 'collections',
                                })}
                                value={collectionTitleEdit}
                                onChange={e => {
                                  if (error && e.target.value.length > 3) {
                                    setError(false)
                                  }

                                  setCollectionTitleEdit(e.target.value)
                                }}
                              />
                            ) : (
                              <Text
                                className={`${
                                  isSelected
                                    ? isEnabled
                                      ? 'text-teal-600 dark:text-teal-600'
                                      : 'text-slate-500 dark:text-slate-300'
                                    : 'hover:text-slate-500'
                                } !font-medium ${
                                  isEnabled ? 'cursor-pointer' : 'text-muted-foreground'
                                }`}
                                onClick={() => {
                                  if (isEnabled && !isSelected) {
                                    selectCollectionById({
                                      selectCollection: {
                                        collectionId,
                                      },
                                    })
                                  }
                                }}
                              >
                                {title}
                              </Text>
                            )}
                          </CardTitle>
                          {!isCardEdit && isEnabled && (
                            <>
                              {isSelected ? (
                                <ToolTip
                                  text={t('Current Collection', { ns: 'collections' })}
                                  isCompact
                                >
                                  <CheckSquare className="text-teal-600 h-6" size={20} />
                                </ToolTip>
                              ) : (
                                <Button
                                  className="text-sm box"
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    selectCollectionById({
                                      selectCollection: {
                                        collectionId,
                                      },
                                    })
                                  }}
                                >
                                  {t('Select', { ns: 'common' })}
                                </Button>
                              )}
                            </>
                          )}
                        </CardHeader>
                        <CardContent>
                          {isCardEdit ? (
                            <TextArea
                              className="text-md"
                              enableEmoji={false}
                              enableEmojiInside
                              maxLength={200}
                              rows={2}
                              maxRows={4}
                              label={t('Description', { ns: 'collections' })}
                              value={collectionDescriptionEdit}
                              onChange={e => {
                                setCollectionDescriptionEdit(e.target.value)
                              }}
                            />
                          ) : (
                            <Text className="text-sm text-muted-foreground">
                              {description}
                            </Text>
                          )}
                        </CardContent>
                        <CardFooter className="flex flex-row items-center justify-between space-y-0">
                          <Box>
                            {!isCardEdit ? (
                              !isSelected && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Box>
                                      <Switch
                                        checked={isEnabled}
                                        disabled={isSelected}
                                        onCheckedChange={(isEnabled: boolean) => {
                                          updateCollectionById({
                                            updatedCollection: {
                                              collectionId,
                                              isEnabled,
                                            },
                                          })
                                        }}
                                      />
                                    </Box>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <Text className="text-sm">
                                      {isEnabled
                                        ? t('Enabled', { ns: 'common' })
                                        : t('Disabled', { ns: 'common' })}
                                    </Text>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            ) : !isSelected ? (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setConfirmDeleteCollectionId(collectionId)
                                  openConfirmationDeleteCollectionModal.value = true
                                }}
                                className={`${
                                  confirmDeleteCollectionId
                                    ? 'bg-red-100 dark:bg-red-800 hover:bg-red-100 text-red-600 hover:text-color-dark dark:text-red-200'
                                    : 'bg-red-50/50 dark:bg-red-800 text-red-500 hover:bg-red-100 hover:text-color-dark dark:text-red-200'
                                }`}
                              >
                                <Trash size="16" />
                              </Button>
                            ) : (
                              <ToolTip
                                isCompact
                                className="bg-warning-100 dark:bg-warning-800"
                                text={
                                  <Text justify="center" color="danger">
                                    {t(
                                      'You need to select a different collection before deleting the current one.',
                                      { ns: 'collections' }
                                    )}
                                  </Text>
                                }
                                delayDuration={300}
                                maxWidth={190}
                                open={isHovering}
                                sideOffset={16}
                              >
                                <Button
                                  size="xs"
                                  ref={mergeRefs(hoverRef)}
                                  variant="ghost"
                                  className={'bg-slate-50 dark:bg-slate-800'}
                                >
                                  <Trash2 size="16" className="opacity-20" />
                                </Button>
                              </ToolTip>
                            )}
                          </Box>
                          <Flex className="min-h-[30px]">
                            {isCardEdit && (
                              <Button
                                size="xs"
                                variant="link"
                                className="text-slate-500"
                                onClick={() => {
                                  setCollectionCardEditId(null)
                                }}
                                disabled={!isEnabled}
                              >
                                {t('Cancel', { ns: 'common' })}
                              </Button>
                            )}
                            {isEnabled && (
                              <Button
                                size="xs"
                                variant={!isCardEdit ? 'light' : 'default'}
                                className={
                                  isCardEdit
                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-100/50 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-800/50'
                                    : ''
                                }
                                onClick={() => {
                                  if (!isCardEdit) {
                                    setCollectionCardEditId(collectionId)
                                  } else {
                                    if (collectionTitleEdit.length < 3) {
                                      setError(true)
                                      return
                                    }

                                    updateCollectionById({
                                      updatedCollection: {
                                        collectionId,
                                        title: collectionTitleEdit,
                                        isEnabled,
                                        description: collectionDescriptionEdit,
                                      },
                                    })

                                    setTimeout(() => {
                                      setCollectionCardEditId(null)
                                    }, 100)
                                  }
                                }}
                                disabled={!isEnabled}
                              >
                                {isCardEdit
                                  ? t('Save', { ns: 'common' })
                                  : t('Edit', { ns: 'common' })}
                              </Button>
                            )}
                          </Flex>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </Box>
                <Spacer h={5} />
                <Text className="light">
                  {t('Collection Options', { ns: 'collections' })}
                </Text>
                <Box className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 animate-in fade-in mt-4">
                  <Card
                    className={`${
                      !isShowCollectionNameOnNavBar &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium border-red-300 border-1 w-full">
                        {t('Show collection name on the navbar', { ns: 'collections' })}
                      </CardTitle>
                      <Switch
                        checked={isShowCollectionNameOnNavBar}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsShowCollectionNameOnNavBar(!isShowCollectionNameOnNavBar)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Display full name of selected collection on the navigation bar',
                          { ns: 'collections' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>

                  {screenLockPassCode && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="animate-in fade-in text-md font-medium border-red-300 border-1 w-full">
                          <Flex align="center" gap={2}>
                            <LockKeyhole size={18} />
                            {t('Protect Collections with PIN', { ns: 'collections' })}
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Text className="text-sm text-muted-foreground mb-3">
                          {t(
                            'Choose which collections require PIN entry for access.',
                            { ns: 'collections' }
                          )}
                        </Text>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {t('Select Collections', { ns: 'collections' })}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                            <DropdownMenuLabel>
                              {t('Mark collections as protected', { ns: 'collections' })}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {collections.map(collection => (
                              <DropdownMenuCheckboxItem
                                key={collection.collectionId}
                                checked={protectedCollections.includes(collection.collectionId)}
                                onCheckedChange={checked => {
                                  const currentProtectedIds = [...protectedCollections]
                                  if (checked) {
                                    if (!currentProtectedIds.includes(collection.collectionId)) {
                                      currentProtectedIds.push(collection.collectionId)
                                    }
                                  } else {
                                    const index = currentProtectedIds.indexOf(
                                      collection.collectionId
                                    )
                                    if (index > -1) {
                                      currentProtectedIds.splice(index, 1)
                                    }
                                  }
                                  setProtectedCollections(currentProtectedIds)
                                }}
                              >
                                {collection.title}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Box className="mt-4">
                          <Text className="text-sm font-medium mb-1">
                            {t('Currently Protected', { ns: 'collections' })}:
                          </Text>
                          {protectedCollections.length > 0 ? (
                            <Flex wrap="wrap" gap={2}>
                              {protectedCollections.map(id => {
                                const collection = collections.find(c => c.collectionId === id)
                                return collection ? (
                                  <Badge key={id} variant="secondary" className="font-normal">
                                    {collection.title}
                                  </Badge>
                                ) : null
                              })}
                            </Flex>
                          ) : (
                            <Text className="text-sm text-muted-foreground">
                              {t('None', { ns: 'common' })}
                            </Text>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
                <Spacer h={6} />
              </SimpleBar>

              <ModalConfirmationCollectionDelete
                open={openConfirmationDeleteCollectionModal.value}
                setIsDeleteAllItemsInCollection={setIsDeleteAllItemsInCollection}
                onClose={() => {
                  openConfirmationDeleteCollectionModal.value = false
                  setIsDeleteAllItemsInCollection(false)
                  setConfirmDeleteCollectionId(null)
                }}
                onConfirm={() => {
                  if (confirmDeleteCollectionId) {
                    deleteCollectionById({
                      deleteCollection: {
                        deleteAllItemsInCollection: isDeleteAllItemsInCollection,
                        collectionId: confirmDeleteCollectionId,
                      },
                    })
                    openConfirmationDeleteCollectionModal.value = false
                    setIsDeleteAllItemsInCollection(false)
                    setConfirmDeleteCollectionId(null)
                  }
                }}
              />
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
