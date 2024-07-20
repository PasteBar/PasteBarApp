import { UniqueIdentifier } from '@dnd-kit/core'
import { playerStoreAtom, SongSourceType } from '~/store'
import { useAtomValue } from 'jotai'
import { Check, Music, Pause, Play, Plus, Volume, Volume2, X } from 'lucide-react'

const PlayButton = ({
  src,
  id,
  isPinned,
  isStarred,
  isClip,
  hasLinkCard,
  isPinnedBoard,
  type,
}: {
  src: string | undefined
  id: UniqueIdentifier | undefined
  type: SongSourceType
  isPinned?: boolean
  isClip?: boolean
  hasLinkCard?: string | false | null | undefined
  isStarred?: boolean
  isPinnedBoard?: boolean
}) => {
  const {
    currentSongIndex,
    playerSongs,
    pauseSong,
    stopPlaying,
    addSong,
    playSong,
    removeSong,
    isPlaying,
  } = useAtomValue(playerStoreAtom)

  if (!id || !src) return null

  const isCurrentSong =
    playerSongs[currentSongIndex]?.id === id &&
    type === playerSongs[currentSongIndex]?.sourceType
  const isCurrentSongPlaying = isCurrentSong && isPlaying
  const isSongAdded = playerSongs.some(song => song.id === id)

  return (
    <div className="flex items-center my-[2px]">
      <button
        className="text-slate-400 pr-1 group ml-[-2px]"
        onClick={() => {
          if (isCurrentSongPlaying) {
            pauseSong()
            return
          }
          if (isSongAdded) {
            playSong(id)
            return
          }
          addSong({
            songUrl: src,
            id,
            sourceType: type,
            play: true,
          })
        }}
      >
        {isCurrentSongPlaying ? (
          <Pause size="14" className="group-hover:text-amber-600 text-amber-600" />
        ) : (
          <Play size="14" className="group-hover:text-amber-600" />
        )}
      </button>
      <button
        className="text-slate-400 group"
        onClick={() => {
          if (isSongAdded) {
            removeSong(id)
            return
          }

          addSong({
            songUrl: src,
            id,
            sourceType: type,
            play: false,
          })
        }}
      >
        {isSongAdded ? (
          <>
            <Check size="15" className="text-green-600 group-hover:hidden" />
            <X size="15" className="text-yellow-600 group-hover:block hidden" />
          </>
        ) : (
          <Plus size="15" className="group-hover:text-green-600" />
        )}
      </button>
      {isCurrentSong && !isClip && (
        <button
          onClick={() => {
            stopPlaying()
          }}
          className={`${
            isPlaying ? 'text-amber-600 dark:text-amber-500' : 'text-gray-500'
          }
          absolute z-99 ${hasLinkCard ? 'hidden' : 'top-1'} ${
            !isPinnedBoard && (isPinned || isStarred)
              ? 'right-5'
              : isPinnedBoard && isStarred
                ? 'right-5'
                : 'right-1.5'
          }`}
        >
          {isPlaying ? (
            <div className="playing-sound">
              <span className="playing__bar playing__bar1"></span>
              <span className="playing__bar playing__bar2"></span>
              <span className="playing__bar playing__bar3"></span>
            </div>
          ) : (
            <Music size="16" />
          )}
        </button>
      )}
    </div>
  )
}

export default PlayButton
