import { UniqueIdentifier } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { open } from '@tauri-apps/api/shell'
import { invoke } from '@tauri-apps/api/tauri'
import { clipboardHistoryStoreAtom, playerStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'
import { CreditCard, Music, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import { ButtonGhost } from '~/components/ui'
import YoutubeEmbed from '~/components/video-player/YoutubeEmbed'

import { useSignal } from '~/hooks/use-signal'

interface Props {
  historyId?: UniqueIdentifier | null
  itemId?: UniqueIdentifier | null
  description?: string | null
  onHide?: () => void
  favicon?: string | null
  domain?: string | null
  image?: string | null
  imageWidth?: number
  isTrack?: boolean | null
  isVideo?: boolean | null
  videoSrc?: string | null
  trackTitle?: string | null
  trackArtist?: string | null
  trackAlbum?: string | null
  trackYear?: string | null
  noBorder?: boolean
  isPreview?: boolean
  link?: string | null
  isDisabled?: boolean
  title?: string | null
}

function LinkCard({
  historyId,
  itemId,
  description,
  favicon,
  isPreview,
  image,
  isTrack,
  isVideo,
  videoSrc,
  trackAlbum,
  trackArtist,
  trackTitle,
  trackYear,
  onHide = () => {},
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

  const { currentSongIndex, playerSongs, isPlaying } = useAtomValue(playerStoreAtom)
  const playVideo = useSignal(false)

  const queryClient = useQueryClient()

  const id = historyId ?? itemId
  const sourceType = historyId ? 'history' : 'clip'

  const isCurrentSong =
    playerSongs[currentSongIndex]?.id === id &&
    sourceType === playerSongs[currentSongIndex]?.sourceType
  const isCurrentSongPlaying = isCurrentSong && isPlaying

  if (playVideo.value && videoSrc) {
    return <YoutubeEmbed url={videoSrc} />
  }

  return (
    <div
      className={`w-full relative max-w-full mt-1 flex select-none bg-white/80 rounded-md dark:bg-gray-800 border-slate-100 dark:border-slate-700/80 ${
        noBorder ? '' : 'border'
      } ${
        isDisabled ? 'opacity-40 pointer-events-none bg-gray-100 dark:bg-gray-900' : ''
      }`}
    >
      {image && (
        <div
          className={`h-auto w-${imageWidth} flex-none bg-cover relative text-center overflow-hidden link-card-image`}
          style={{ backgroundImage: `url('${image}')` }}
        >
          {isVideo && (
            <button
              type="button"
              onClick={() => {
                playVideo.value = true
              }}
              className="lty-playbtn !opacity-80 hover:!opacity-100"
            />
          )}
        </div>
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
        {isTrack && (
          <div className="mt-3 p-2 mb-1 bg-gray-100 dark:bg-gray-700 rounded-md relative">
            {isCurrentSongPlaying ? (
              <div className="playing-sound mr-2 absolute bottom-1.5 right-1.5">
                <span className="playing__bar playing__bar1"></span>
                <span className="playing__bar playing__bar2"></span>
                <span className="playing__bar playing__bar3"></span>
              </div>
            ) : (
              <Music
                size={14}
                className="text-gray-500 dark:text-gray-400 mr-2 absolute bottom-1.5 right-0"
              />
            )}

            {trackTitle && (
              <div className="flex items-center">
                <p
                  className="text-sm text-gray-600 dark:text-gray-300"
                  title={trackTitle}
                >
                  {trackTitle}
                  {trackArtist && (
                    <span>
                      {' - '}
                      <strong className="font-semibold">{trackArtist}</strong>
                    </span>
                  )}
                </p>
              </div>
            )}
            {trackAlbum && (
              <div className="flex items-center">
                <p
                  className="text-sm text-gray-400 dark:text-gray-400 truncate"
                  title={trackAlbum}
                >
                  {trackAlbum}
                  {trackYear && ` (${trackYear})`}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center absolute top-[-5px] right-[-5px] dark:text-slate-500 cursor-pointer border-0 border-red-200">
          {isPreview && historyId ? (
            <ButtonGhost
              className="dark:hover:text-blue-500 text-slate-500 hover:text-blue-600 hover:bg-transparent px-2 pr-3 mr-1 py-2 bg-opacity-80 bg-white dark:bg-slate-800"
              title={t('Add Link Card', { ns: 'common' })}
              onClick={async () => {
                onHide()
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

export default LinkCard
