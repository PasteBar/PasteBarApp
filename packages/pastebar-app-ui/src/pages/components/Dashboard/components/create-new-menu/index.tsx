import { Folder, GalleryVertical, PanelTop, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import ToolTip from '~/components/atoms/tooltip'
import { Box, Button } from '~/components/ui'

import { CreateDashboardItemType } from '~/types/menu'

const { CLIP, TAB, BOARD } = CreateDashboardItemType

export default function CreateDashBoardMenu({
  onCreateNewItemType,
  isFirstTab,
}: {
  totalTabs?: number
  onCreateNewItemType: (type: CreateDashboardItemType) => void
  isFirstTab: boolean
}) {
  const { t } = useTranslation()
  return (
    <DropdownMenu defaultOpen={isFirstTab} modal={false}>
      <DropdownMenuTrigger className="mr-1.5 rounded-sm flex" asChild>
        {isFirstTab ? (
          <Box
            id="dashboard-tabs-create-button_tour"
            className="flex w-20 group flex-row items-center cursor-pointer justify-center border-2 border-dashed rounded-md p-1.5 hover:border-blue-400 hover:dark:border-blue-500 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:border-slate-500 dark:text-slate-300 border-slate-300"
          >
            <Plus
              size={20}
              className="group-hover:text-blue-400 dark:group-hover:text-blue-300 text-slate-400"
            />
          </Box>
        ) : (
          <Button
            variant="ghost"
            id="dashboard-tabs-create-button_tour"
            size="mini"
            className="ml-1.5 mr-1 px-1 py-1 w-[30px] bg-slate-100 hover:bg-opacity-100 bg-opacity-80 dark:bg-gray-500/70 dark:hover:bg-slate-500 text-secondary-foreground/50 cursor-pointer !mt-0 flex"
          >
            <ToolTip
              text={`${t('Add New', { ns: 'contextMenus' })} ...`}
              isDisabled={isFirstTab}
              delayDuration={2000}
              isCompact
              side="bottom"
              sideOffset={10}
            >
              <Plus size={20} />
            </ToolTip>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={!isFirstTab ? 'end' : 'center'}
        alignOffset={-28}
        sideOffset={isFirstTab ? 12 : 8}
      >
        {!isFirstTab && (
          <DropdownMenuItem
            className="outline-none flex items-center"
            onClick={() => {
              onCreateNewItemType(TAB)
            }}
          >
            <Folder size={16} className="mr-2" />
            <span>{t('Add Tab', { ns: 'contextMenus' })}</span>
          </DropdownMenuItem>
        )}

        {!isFirstTab && (
          <DropdownMenuItem
            className="outline-none flex items-center"
            onClick={() => {
              onCreateNewItemType(BOARD)
            }}
          >
            <PanelTop size={16} className="mr-2" />
            <span>{t('Add Board', { ns: 'contextMenus' })}</span>
          </DropdownMenuItem>
        )}

        {!isFirstTab ? (
          <DropdownMenuItem
            className="outline-none flex items-center"
            onClick={() => {
              onCreateNewItemType(CLIP)
            }}
          >
            <GalleryVertical size={16} className="mr-2" />
            <span>{t('Add Clip', { ns: 'contextMenus' })}</span>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              disabled
              className="flex justify-center py-0.5 dark:text-gray-400 text-gray-500"
            >
              {t('Dashboard', { ns: 'contextMenus' })}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="outline-none flex items-center"
              onClick={() => {
                onCreateNewItemType(TAB)
              }}
            >
              <Folder size={16} className="mr-2" />
              <span>{t('Add First Tab', { ns: 'contextMenus' })}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
