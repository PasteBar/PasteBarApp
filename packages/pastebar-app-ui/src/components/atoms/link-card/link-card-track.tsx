import { UniqueIdentifier } from '@dnd-kit/core'
import { playerStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'
import { Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  historyId?: UniqueIdentifier | null
  itemId?: UniqueIdentifier | null
  onHide?: () => void
  trackTitle?: string | null
  trackArtist?: string | null
  trackAlbum?: string | null
  trackYear?: string | null
}

function LinkCardTrackOnly({
  historyId,
  itemId,
  trackAlbum,
  trackArtist,
  trackTitle,
  trackYear,
}: Props) {
  const { currentSongIndex, playerSongs, isPlaying } = useAtomValue(playerStoreAtom)

  const id = historyId ?? itemId
  const sourceType = historyId ? 'history' : 'clip'

  const isCurrentSong =
    playerSongs[currentSongIndex]?.id === id &&
    sourceType === playerSongs[currentSongIndex]?.sourceType
  const isCurrentSongPlaying = isCurrentSong && isPlaying

  if (!trackTitle) {
    return null
  }

  return (
    <div className="mt-1.5 p-2 mb-1 bg-gray-100 dark:bg-gray-700 rounded-md relative">
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
          <p className="text-sm text-gray-600 dark:text-gray-300" title={trackTitle}>
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
  )
}

export default LinkCardTrackOnly
