import { showEditTabs, showOrganizeLayout } from '~/store'
import { FolderEdit, Layout } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
} from '~/components/ui'

interface TabsContextMenuProps {
  tabId: string
}

export default function TabsContextMenu({ tabId }: TabsContextMenuProps) {
  const { t } = useTranslation()
  if (tabId == null) {
    return null
  }
  return (
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            showOrganizeLayout.value = true
          }}
        >
          {t('Organize Layout', { ns: 'contextMenus' })}
          <div className="ml-auto pl-3">
            <Layout size={15} />
          </div>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            showEditTabs.value = true
          }}
        >
          {t('Edit Tabs', { ns: 'contextMenus' })}
          <div className="ml-auto pl-3">
            <FolderEdit size={15} />
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  )
}
