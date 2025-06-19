// import clsx from 'clsx'
import { ReactElement } from 'react'
import {
  collectionsStoreAtom,
  openProtectedContentModal,
  pendingProtectedCollectionId,
  settingsStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { LockKeyhole, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import SimpleBar from '~/components/libs/simplebar-react'

import { useSelectCollectionById } from '~/hooks/queries/use-collections'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
} from '../../ui'

export default function CollectionsDropDown({ children }: { children: ReactElement }) {
  const { currentCollectionId, collections } = useAtomValue(collectionsStoreAtom)
  const { selectCollectionById } = useSelectCollectionById()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const {
    protectedCollections,
    hasPinProtectedCollections,
    isShowDisabledCollectionsOnNavBarMenu,
  } = useAtomValue(settingsStoreAtom)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex m-0 p-0" asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent forceMount sideOffset={8} align="center">
        <DropdownMenuItem disabled className="flex justify-center py-0.5">
          {t('Switch collections', { ns: 'collections' })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SimpleBar
          className="code-filter"
          style={{
            height: 'auto',
            maxHeight: '400px',
            width: '100%',
            minWidth: '220px',
          }}
          autoHide={false}
        >
          <DropdownMenuRadioGroup value={currentCollectionId ?? ''}>
            {collections
              .filter(
                ({ isEnabled }) => isShowDisabledCollectionsOnNavBarMenu || isEnabled
              )
              .sort((a, b) => {
                if (isShowDisabledCollectionsOnNavBarMenu) {
                  if (a.isEnabled && !b.isEnabled) {
                    return -1
                  }
                  if (!a.isEnabled && b.isEnabled) {
                    return 1
                  }
                }
                return a.createdAt - b.createdAt
              })
              .map(({ collectionId, isEnabled, title, isSelected }) => (
                <DropdownMenuRadioItem
                  key={collectionId}
                  value={collectionId}
                  disabled={!isEnabled}
                  onClick={() => {
                    const isProtectedCollection =
                      hasPinProtectedCollections &&
                      protectedCollections.includes(collectionId)

                    if (isProtectedCollection) {
                      pendingProtectedCollectionId.value = collectionId
                      openProtectedContentModal.value = true
                    } else {
                      selectCollectionById({
                        selectCollection: { collectionId },
                      })
                    }
                  }}
                >
                  <Flex
                    className={`${
                      isSelected ? 'font-semibold' : ''
                    } items-center justify-start gap-2`}
                  >
                    {hasPinProtectedCollections &&
                    protectedCollections.includes(collectionId) ? (
                      <>
                        <span className="truncate max-w-[150px]">{title}</span>
                        <LockKeyhole
                          size={12}
                          className="text-gray-600 dark:text-gray-500 flex-shrink-0"
                        />
                      </>
                    ) : (
                      <span className="truncate max-w-[210px]">{title}</span>
                    )}
                  </Flex>
                </DropdownMenuRadioItem>
              ))}
          </DropdownMenuRadioGroup>
        </SimpleBar>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            navigate('/app-settings/collections', { replace: true })
          }}
        >
          <Settings className="mr-2" size={14} />
          {t('Manage Collections', { ns: 'collections' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
