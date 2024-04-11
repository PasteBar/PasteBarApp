import { useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { clipboardHistoryStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'

import { ensureUrlPrefix } from '~/lib/utils'

import { Box } from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

import { LinkMetadata } from '~/types/history'

import LinkCard from './link-card'

interface PreviewLinkCardProps {
  generateLinkUrl?: string | null
  historyId?: UniqueIdentifier | null | undefined
  itemId?: UniqueIdentifier | null | undefined
}

function PreviewLinkCard({ itemId, historyId, generateLinkUrl }: PreviewLinkCardProps) {
  const { generateLinkMetaData } = useAtomValue(clipboardHistoryStoreAtom)

  const previewLinkMetaData = useSignal<LinkMetadata>({
    linkTitle: null,
    linkFavicon: null,
    linkDescription: null,
    linkUrl: null,
    linkDomain: null,
    linkImage: null,
  })

  useEffect(() => {
    if (generateLinkUrl && previewLinkMetaData.value.linkTitle === null) {
      generateLinkMetaData('previewOnly', ensureUrlPrefix(generateLinkUrl), true)?.then(
        meta => {
          if (!meta) {
            return
          }
          previewLinkMetaData.value = meta
        }
      )
    }
  }, [])

  if (
    !previewLinkMetaData.value.linkTitle &&
    !previewLinkMetaData.value.linkDescription
  ) {
    return null
  }

  return (
    <Box className="max-w-md dark:border-slate-900/20 border-transparent border rounded-md">
      <LinkCard
        title={previewLinkMetaData.value.linkTitle}
        description={previewLinkMetaData.value.linkDescription}
        favicon={previewLinkMetaData.value.linkFavicon}
        noBorder={true}
        link={generateLinkUrl}
        isPreview={true}
        historyId={historyId}
        itemId={itemId}
        image={previewLinkMetaData.value.linkImage}
        domain={previewLinkMetaData.value.linkDomain}
      />
    </Box>
  )
}

export default PreviewLinkCard
