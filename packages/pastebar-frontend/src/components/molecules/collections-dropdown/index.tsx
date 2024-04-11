// import clsx from 'clsx'
import { ReactElement } from 'react'
import { collectionsStoreAtom, settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { Settings } from 'lucide-react'
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
} from '../../ui'

export default function CollectionsDropDown({ children }: { children: ReactElement }) {
  const { currentCollectionId, collections } = useAtomValue(collectionsStoreAtom)
  const { selectCollectionById } = useSelectCollectionById()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { isShowDisabledCollectionsOnNavBarMenu } = useAtomValue(settingsStoreAtom)

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
            minWidth: '200px',
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
                    selectCollectionById({
                      selectCollection: {
                        collectionId,
                      },
                    })
                  }}
                >
                  <span className={isSelected ? 'font-semibold' : ''}>{title}</span>
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
