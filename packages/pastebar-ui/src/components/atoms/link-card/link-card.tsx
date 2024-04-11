import { memo } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { open } from '@tauri-apps/api/shell'
import { clipboardHistoryStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'
import { CreditCard, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import { Button, ButtonGhost } from '~/components/ui'

import ToolTip from '../tooltip'

interface Props {
  historyId?: UniqueIdentifier | null
  itemId?: UniqueIdentifier | null
  description?: string | null
  favicon?: string | null
  domain?: string | null
  image?: string | null
  imageWidth?: number
  noBorder?: boolean
  isPreview?: boolean
  link?: string | null
  isDisabled?: boolean
  title?: string | null
}

function LinkCard({
  historyId,
  description,
  favicon,
  isPreview,
  image,
  noBorder = false,
  imageWidth = 24,
  title,
  domain,
  link,
  isDisabled,
}: Props) {
  const { t } = useTranslation()
  const { removeLinkMetaData, generateLinkMetaData } = useAtomValue(
    clipboardHistoryStoreAtom
  )

  const queryClient = useQueryClient()

  return (
    <div
      className={`w-full relative max-w-full flex select-none bg-white/80 rounded-md dark:bg-gray-800 border-slate-100 dark:border-slate-700/80 ${
        noBorder ? '' : 'border'
      } ${
        isDisabled ? 'opacity-40 pointer-events-none bg-gray-100 dark:bg-gray-900' : ''
      }`}
    >
      {image && (
        <div
          className={`h-auto w-${imageWidth} flex-none bg-cover text-center overflow-hidden`}
          style={{ backgroundImage: `url('${image}')` }}
        ></div>
      )}
      <div className="px-3 py-2 flex flex-col justify-between leading-normal overflow-clip w-full">
        <div
          className="text-gray-900 dark:text-gray-300 font-semibold text-lg line-clamp-2 leading-tight hover:underline cursor-pointer"
          onClick={() => {
            link && open(ensureUrlPrefix(link))
          }}
          title={title ?? ''}
        >
          {title}
        </div>
        {description && (
          <p
            className="text-gray-700 dark:text-gray-400 text-md line-clamp-2 mt-2"
            title={description}
          >
            {description}
          </p>
        )}
        {domain && (
          <div className="flex items-center mt-2">
            {favicon && <img className="w-[16px] h-[16px] mr-2" src={favicon} />}
            <p
              className="text-gray-400 dark:text-gray-500 text-sm font-semibold cursor-pointer hover:underline"
              onClick={() => {
                open(ensureUrlPrefix(domain))
              }}
              title={`${t('Open', { ns: 'common' })} ${domain}`}
            >
              {domain}
            </p>
          </div>
        )}
        <div className="flex items-center absolute bottom-0 right-0 dark:text-slate-500 cursor-pointer border-0 border-red-200">
          {isPreview && historyId ? (
            <ButtonGhost
              className="dark:hover:text-blue-500 text-slate-500 hover:text-blue-600 hover:bg-transparent px-3 py-2"
              title={t('Add Link Card', { ns: 'common' })}
              onClick={async () => {
                await generateLinkMetaData(historyId.toString(), ensureUrlPrefix(link))
                queryClient.invalidateQueries({
                  queryKey: ['get_clipboard_history'],
                })
                queryClient.invalidateQueries({
                  queryKey: ['get_clipboard_history_pinned'],
                })
              }}
            >
              <Plus size={12} className="mr-[2px]" />
              <CreditCard size={14} />
            </ButtonGhost>
          ) : (
            historyId && (
              <ButtonGhost
                className="dark:hover:text-red-500 text-slate-300 dark:text-slate-600 hover:text-red-600 hover:bg-transparent px-3 py-2"
                title={t('Remove Link Card', { ns: 'common' })}
                onClick={async () => {
                  await removeLinkMetaData(historyId.toString())
                  queryClient.invalidateQueries({
                    queryKey: ['get_clipboard_history'],
                  })
                  queryClient.invalidateQueries({
                    queryKey: ['get_clipboard_history_pinned'],
                  })
                }}
              >
                <X size={14} />
              </ButtonGhost>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(LinkCard)
