import { useEffect, useMemo, useRef } from 'react'
import { playerStoreAtom } from '~/store'
import { useAtomValue } from 'jotai/react'

import { useDebounce } from '~/hooks/use-debounce'

export const PlayerAudioContainer = () => {
  const {
    setAudioPlayerRef,
    setDuration,
    setIsPlaying,
    isPlaying,
    setIsReady,
    handleNext,
    setFirstRun,
    setVolume,
    playerSongs,
    isFirstRun,
    currentSongIndex,
    setCurrentProgress,
    setBuffered,
    volume,
  } = useAtomValue(playerStoreAtom)

  const handleBufferProgress: React.ReactEventHandler<HTMLAudioElement> = e => {
    const audio = e.currentTarget
    const dur = audio.duration
    if (dur > 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (audio.buffered.start(audio.buffered.length - 1 - i) < audio.currentTime) {
          const bufferedLength = audio.buffered.end(audio.buffered.length - 1 - i)
          setBuffered(bufferedLength)
          break
        }
      }
    }
  }

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setAudioPlayerRef(audioRef)
  }, [audioRef])

  const currentSong = useMemo(() => {
    return playerSongs[currentSongIndex]
  }, [playerSongs, currentSongIndex])

  const debouncedCurrentSong = useDebounce(currentSong, 300)

  useEffect(() => {
    if (
      debouncedCurrentSong?.src &&
      audioRef?.current &&
      !isFirstRun &&
      audioRef.current.src !== debouncedCurrentSong.src
    ) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setBuffered(0)
      }
      audioRef.current.src = debouncedCurrentSong.src
      setTimeout(() => {
        try {
          audioRef?.current?.play()
        } catch (error) {
          console.error(error)
        }
      }, 300)
    }
  }, [debouncedCurrentSong, audioRef])

  return (
    <audio
      hidden
      id="audio-player"
      ref={audioRef}
      preload="metadata"
      onLoadStart={() => {
        setIsReady(false)
      }}
      onDurationChange={e => setDuration(e.currentTarget.duration)}
      onPause={() => {
        setIsPlaying(false)
      }}
      onPlaying={() => {
        setIsPlaying(true)
      }}
      onEnded={handleNext}
      onCanPlay={e => {
        e.currentTarget.volume = volume
        setIsReady(true)
      }}
      onTimeUpdate={e => {
        setCurrentProgress(e.currentTarget.currentTime)
      }}
      onProgress={handleBufferProgress}
      onVolumeChange={e => setVolume(e.currentTarget.volume)}
    >
      <source type="audio/mpeg" />
    </audio>
  )
}
