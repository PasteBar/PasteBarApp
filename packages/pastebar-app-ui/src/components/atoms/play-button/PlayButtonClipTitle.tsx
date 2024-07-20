import { UniqueIdentifier } from '@dnd-kit/core'
import { playerStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { Check, Pause, Play, Plus, Volume, Volume2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ButtonGhost } from '~/components/ui'

import ToolTip from '../tooltip'

const PlayButtonClipTitle = ({
  src,
  id,
  isMp3File,
  isKeyAltPressed,
}: {
  src: string | undefined
  id: UniqueIdentifier | undefined
  isPinned?: boolean
  title?: string
  isMp3File?: boolean
  isKeyAltPressed: boolean
  isStarred?: boolean
  isPinnedBoard?: boolean
}) => {
  const {
    currentSongIndex,
    playerSongs,
    pauseSong,
    addSong,
    playSong,
    removeSong,
    isPlaying,
  } = useAtomValue(playerStoreAtom)

  const { t } = useTranslation()

  if (!id || !src) return null

  const isCurrentSong =
    playerSongs[currentSongIndex]?.id === id &&
    'clip' === playerSongs[currentSongIndex]?.sourceType
  const isCurrentSongPlaying = isCurrentSong && isPlaying
  const isSongAdded = playerSongs.some(song => song.id === id)

  return (
    <ButtonGhost
      className="hover:bg-transparent hover:text-green-600 group"
      onClick={(e: Event) => {
        e.stopPropagation()
        e.preventDefault()
        if (isCurrentSongPlaying) {
          if (isKeyAltPressed) {
            removeSong(id)
            return
          }
          pauseSong()
          return
        }
        if (isSongAdded) {
          !isKeyAltPressed && playSong(id)
          return
        }
        isKeyAltPressed
          ? addSong({
              songUrl: src,
              isFile: isMp3File,
              id,
              sourceType: 'clip',
              play: false,
            })
          : addSong({
              songUrl: src,
              isFile: isMp3File,
              id,
              sourceType: 'clip',
              play: true,
            })
      }}
    >
      {isCurrentSongPlaying ? (
        <ToolTip
          text={
            isKeyAltPressed
              ? t('Remove from Player', { ns: 'common' })
              : t('Pause', { ns: 'common' })
          }
          delayDuration={2000}
          isCompact
          side="bottom"
          sideOffset={10}
        >
          {isKeyAltPressed ? (
            <X size={16} className="text-yellow-600" />
          ) : (
            <Pause size={16} className="group-hover:text-amber-600 text-amber-600" />
          )}
        </ToolTip>
      ) : isSongAdded ? (
        <ToolTip
          text={
            isKeyAltPressed ? t('Added', { ns: 'common' }) : t('Play', { ns: 'common' })
          }
          delayDuration={2000}
          isCompact
          side="bottom"
          sideOffset={10}
        >
          {isKeyAltPressed ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <Play size={16} className="group-hover:text-amber-600" />
          )}
        </ToolTip>
      ) : (
        <ToolTip
          text={
            isKeyAltPressed
              ? t('Add To Player', { ns: 'common' })
              : t('Play', { ns: 'common' })
          }
          delayDuration={2000}
          isCompact
          side="bottom"
          sideOffset={10}
        >
          {isKeyAltPressed ? (
            <Plus size={16} className="group-hover:text-green-600" />
          ) : (
            <Play size={16} className="group-hover:text-amber-600" />
          )}
        </ToolTip>
      )}
    </ButtonGhost>
  )
}

export default PlayButtonClipTitle
