import { useEffect } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { clipboardHistoryStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'

import { ensureUrlPrefix } from '~/lib/utils'

import { Box } from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

import { LinkMetadata } from '~/types/history'

import Spinner from '../spinner'
import LinkCard from './link-card'

interface PreviewLinkCardProps {
  onHide?: () => void
  generateLinkUrl?: string | null
  historyId?: UniqueIdentifier | null | undefined
  itemId?: UniqueIdentifier | null | undefined
}

function PreviewLinkCard({
  itemId,
  historyId,
  generateLinkUrl,
  onHide,
}: PreviewLinkCardProps) {
  const { generateLinkMetaData } = useAtomValue(clipboardHistoryStoreAtom)
  const genarateLinkCardInProgress = useSignal<boolean>(false)

  const previewLinkMetaData = useSignal<LinkMetadata>({
    linkTitle: null,
    linkFavicon: null,
    linkDescription: null,
    linkUrl: null,
    linkDomain: null,
    linkImage: null,
    linkTrackTitle: null,
    linkTrackArtist: null,
    linkTrackAlbum: null,
    linkTrackYear: null,
    linkIsTrack: null,
  })

  useEffect(() => {
    if (
      generateLinkUrl &&
      !genarateLinkCardInProgress.value &&
      previewLinkMetaData.value.linkTitle === null
    ) {
      genarateLinkCardInProgress.value = true
      generateLinkMetaData('previewOnly', ensureUrlPrefix(generateLinkUrl), true)?.then(
        meta => {
          genarateLinkCardInProgress.value = false
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
    return (
      <Box className="max-w-md w-16 pl-1 py-2 dark:bg-gray-800 border-slate-100 dark:border-slate-900/20 border-transparent border rounded-md justify-center flex items-center">
        <Spinner size="medium" />
      </Box>
    )
  }

  return (
    <Box className="max-w-md dark:border-slate-900/20 border-transparent border rounded-md">
      <LinkCard
        onHide={onHide}
        title={previewLinkMetaData.value.linkTitle}
        trackTitle={previewLinkMetaData.value.linkTrackTitle}
        trackArtist={previewLinkMetaData.value.linkTrackArtist}
        trackAlbum={previewLinkMetaData.value.linkTrackAlbum}
        trackYear={previewLinkMetaData.value.linkTrackYear}
        isTrack={previewLinkMetaData.value.linkIsTrack}
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
