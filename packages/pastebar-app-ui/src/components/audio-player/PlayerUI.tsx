import { playerStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'
import {
  Disc3,
  Download,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'

import ToolTip from '../atoms/tooltip'
import { ButtonGhost } from '../ui'
import AudioProgressBar from './AudioProgressBar'
import IconButton from './IconButton'
import VolumeInput from './VolumeInput'

export function formatDurationDisplay(duration: number) {
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = Math.floor(duration % 60)

  const parts = []

  if (hours > 0) {
    parts.push(hours.toString())
  }

  parts.push(minutes.toString().padStart(2, '0'))
  parts.push(seconds.toString().padStart(2, '0'))

  return parts.join(':')
}

export function PlayerUI() {
  const {
    isReady,
    audioPlayerRef,
    duration,
    currentProgress,
    setDragProgress,
    buffered,
    volume,
    downloadSong,
    repeat,
    setRepeat,
    handleNext,
    playerSongs,
    currentSongIndex,
    togglePlayPause,
    handlePrev,
    setVolume,
    isPlaying,
  } = useAtomValue(playerStoreAtom)

  const durationDisplay = formatDurationDisplay(duration)
  const elapsedDisplay = formatDurationDisplay(currentProgress)
  const currentSong = playerSongs[currentSongIndex]
  const { t } = useTranslation()
  const isHistoryWindow = window.isHistoryWindow

  useHotkeys(['space'], () => {
    if (playerSongs.length > 0) {
      togglePlayPause()
    }
  })

  useHotkeys(['up'], () => {
    if (playerSongs.length > 0) {
      handlePrev()
    }
  })

  useHotkeys(['down'], () => {
    if (playerSongs.length > 0) {
      handleNext()
    }
  })

  const handleMuteUnmute = () => {
    if (!audioPlayerRef?.current) return

    if (audioPlayerRef?.current.volume !== 0) {
      audioPlayerRef.current.volume = 0
    } else {
      audioPlayerRef.current.volume = 1
    }
  }

  const handleVolumeChange = (volumeValue: number) => {
    if (!audioPlayerRef?.current) return
    audioPlayerRef.current.volume = volumeValue
    setVolume(volumeValue)
  }

  if (!audioPlayerRef?.current) {
    return null
  }

  return (
    <div className="text-slate-400 p-3 relative">
      <AudioProgressBar
        duration={duration}
        currentProgress={currentProgress}
        hasTrack={currentSongIndex !== -1}
        buffered={buffered}
        onChange={e => {
          setDragProgress(e.currentTarget.valueAsNumber)
        }}
      />

      {/* <div className="flex flex-col items-center justify-center">
        <div className="text-center mb-1">
          <p className="text-amber-600 font-bold text-[13px]">
            {currentSong?.title ?? 'Select a song'}
          </p>
        </div>
      </div> */}
      <div className="grid grid-cols-3 items-center mt-1.5">
        {!isHistoryWindow ? (
          <div className="flex items-center w-full justify-between">
            <span className="text-[13px] text-gray-600 dark:text-gray-400">
              {elapsedDisplay}/{durationDisplay}
            </span>
            <ButtonGhost
              className="pl-2 py-2 rounded-lg hover:bg-transparent"
              onClick={() => {
                if (repeat === 'none') {
                  setRepeat('one')
                } else if (repeat === 'one') {
                  setRepeat('all')
                } else {
                  setRepeat('none')
                }
              }}
            >
              <ToolTip
                isCompact
                text={
                  repeat === 'none'
                    ? t('Repeat off', { ns: 'common' })
                    : repeat === 'one'
                      ? t('Repeat 1', { ns: 'common' })
                      : t('Repeat all', { ns: 'common' })
                }
              >
                {repeat === 'none' && (
                  <Repeat size={20} className="mr-6 dark:text-gray-500 text-gray-400" />
                )}
                {repeat === 'one' && (
                  <Repeat1
                    size={20}
                    className="mr-6 dark:text-amber-600 text-amber-600"
                  />
                )}
                {repeat === 'all' && (
                  <Repeat size={20} className="mr-6 dark:text-amber-600 text-amber-600" />
                )}
              </ToolTip>
            </ButtonGhost>
          </div>
        ) : (
          <ToolTip text={t('Download mp3', { ns: 'common' })} isCompact>
            <ButtonGhost
              className="pl-2 py-2 rounded-lg hover:bg-transparent"
              disabled={!currentSong}
              onClick={() => {
                downloadSong(currentSong)
              }}
            >
              <Download size={20} className="dark:text-gray-400 text-gray-400 " />
            </ButtonGhost>
          </ToolTip>
        )}
        <div
          className={`flex items-center gap-3 justify-self-center ${
            isHistoryWindow ? 'mr-2' : 'mr-4'
          }`}
        >
          <IconButton
            onClick={handlePrev}
            disabled={currentSongIndex === 0 && repeat === 'none'}
            intent="secondary"
          >
            <SkipBack size={22} />
          </IconButton>
          <IconButton
            disabled={!isReady}
            onClick={togglePlayPause}
            key={isPlaying ? 'pause' : isReady ? 'play' : 'loading'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            size="lg"
          >
            {!isReady && currentSong ? (
              <Disc3 size={30} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={26} />
            ) : (
              <Play size={26} />
            )}
          </IconButton>
          <IconButton
            onClick={handleNext}
            disabled={currentSongIndex === playerSongs.length - 1 && repeat === 'none'}
            intent="secondary"
          >
            <SkipForward size={22} />
          </IconButton>
        </div>

        <div
          className={`flex items-center justify-between ${
            isHistoryWindow ? 'ml-12' : ''
          }`}
        >
          {!isHistoryWindow ? (
            <>
              <div className="flex gap-3 items-center justify-self-end">
                <IconButton intent="secondary" size="sm" onClick={handleMuteUnmute}>
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </IconButton>

                <VolumeInput volume={volume} onVolumeChange={handleVolumeChange} />
              </div>
              <ToolTip text={t('Download mp3', { ns: 'common' })} isCompact>
                <ButtonGhost
                  className="pl-2 py-2 rounded-lg hover:bg-transparent"
                  disabled={!currentSong}
                  onClick={() => {
                    downloadSong(currentSong)
                  }}
                >
                  <Download size={20} className="dark:text-gray-400 text-gray-400 " />
                </ButtonGhost>
              </ToolTip>
            </>
          ) : (
            <IconButton intent="secondary" size="sm" onClick={handleMuteUnmute}>
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </IconButton>
          )}
        </div>
      </div>
    </div>
  )
}
