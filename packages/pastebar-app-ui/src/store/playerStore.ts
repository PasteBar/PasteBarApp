import { UniqueIdentifier } from '@dnd-kit/core'
import { emit, listen } from '@tauri-apps/api/event'
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri'
import { atomWithStore } from 'jotai-zustand'
import { debounce } from 'lodash-es'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import { showInvalidTrackWarningAddSong } from './signalStore'

export type SongSourceType = 'clip' | 'history' | 'file'

export type Song = {
  title: string
  id: UniqueIdentifier
  sourceType: SongSourceType
  isValidated?: boolean
  path?: string
  src: string
}

export interface PlayerStoreState {
  audioPlayerRef: React.RefObject<HTMLAudioElement> | null
  setAudioPlayerRef: (audioPlayerRef: React.RefObject<HTMLAudioElement>) => void
  setSongList: (songs: Song[]) => void
  trustedAudioIds: UniqueIdentifier[]
  addTrustedAudioId: (id: UniqueIdentifier) => void
  currentSongIndex: number
  playSong: (songId: UniqueIdentifier) => void
  setCurrentSongIndex: (index: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  isSongWithIdAndTypePlaying: (
    songId: UniqueIdentifier,
    sourceType: SongSourceType
  ) => boolean
  playerSongs: Song[]
  addSong: ({
    songUrl,
    id,
    isFile,
    sourceType,
    play,
    name,
  }: {
    songUrl: string
    id: UniqueIdentifier
    isFile?: boolean
    sourceType: SongSourceType
    play: boolean
    name?: string
  }) => void
  isReady: boolean
  handleNext: () => void
  getCurrentSong: () => Song | undefined
  repeat: 'none' | 'one' | 'all'
  setRepeat: (repeat: 'none' | 'one' | 'all') => void
  clearPlayerSongs: () => void
  togglePlayPause: () => void
  continuePlay: () => void
  removeSong: (songId: UniqueIdentifier) => void
  pauseSong: () => void
  setFirstRun: (isFirstRun: boolean) => void
  isFirstRun: boolean
  handlePrev: () => void
  checkIfOnLine: () => boolean
  stopPlaying: () => void
  downloadSong: (song: Song) => void
  handleBufferProgress: (e: React.ReactEventHandler<HTMLAudioElement>) => void
  setIsReady: (isReady: boolean) => void
  setCurrentProgress: (progress: number) => void
  setDragProgress: (progress: number) => void
  setBuffered: (buffered: number) => void
  setVolume: (volume: number) => void
  duration: number
  currentProgress: number
  buffered: number
  volume: number
  isPlaying: boolean
  setDuration: (duration: number) => void
}
const initialState: PlayerStoreState = {
  audioPlayerRef: null,
  currentSongIndex: -1,
  playerSongs: [],
  isReady: false,
  isFirstRun: true,
  repeat: 'none',
  trustedAudioIds: [],
  addTrustedAudioId: () => {},
  continuePlay: () => {},
  getCurrentSong: () => undefined,
  setRepeat: () => {},
  togglePlayPause: () => {},
  setFirstRun: () => {},
  playSong: () => {},
  stopPlaying: () => {},
  removeSong: () => {},
  pauseSong: () => {},
  downloadSong: () => {},
  isSongWithIdAndTypePlaying: () => false,
  setSongList: () => {},
  clearPlayerSongs: () => {},
  setIsPlaying: () => {},
  handleNext: () => {},
  handlePrev: () => {},
  checkIfOnLine: () => true,
  addSong: () => {},
  handleBufferProgress: () => {},
  setIsReady: () => {},
  setDragProgress: () => {},
  setCurrentProgress: () => {},
  setBuffered: () => {},
  setVolume: () => {},
  duration: 0,
  currentProgress: 0,
  buffered: 0,
  volume: 0.3,
  isPlaying: false,
  setDuration: () => {},
  setAudioPlayerRef: () => {},
  setCurrentSongIndex: () => {},
}

export const playerStore = createStore<PlayerStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addTrustedAudioId: (id: UniqueIdentifier) => {
        set(state => {
          return {
            trustedAudioIds: [...state.trustedAudioIds, id],
          }
        })
      },
      isSongWithIdAndTypePlaying: (songId, sourceType) => {
        return (
          get().playerSongs[get().currentSongIndex]?.id === songId &&
          get().playerSongs[get().currentSongIndex]?.sourceType === sourceType
        )
      },
      setRepeat: (repeat: 'none' | 'one' | 'all') => {
        set(() => ({ repeat }))
      },
      setFirstRun: (isFirstRun: boolean) => {
        set(() => ({ isFirstRun }))
      },
      downloadSong: async (song: Song) => {
        if (!song || !song.src) {
          return
        }
        const { src, path } = song as Song

        invoke('download_audio', { urlOrPath: path ? path : src })
      },
      stopPlaying: () => {
        const player = get().audioPlayerRef?.current
        if (!player) return
        player.pause()
        player.src = ''

        set(() => ({
          currentProgress: 0,
          currentSongIndex: -1,
          duration: 0,
          isPlaying: false,
          isReady: false,
        }))
      },
      pauseSong: () => {
        if (get().isPlaying) {
          get().audioPlayerRef?.current?.pause()
          set(() => ({
            isPlaying: false,
          }))
        }
      },
      getCurrentSong: () => {
        return get().playerSongs[get().currentSongIndex]
      },
      togglePlayPause: () => {
        if (get().isPlaying) {
          get().audioPlayerRef?.current?.pause()
          set(() => ({
            isPlaying: false,
          }))
        } else {
          if (get().currentSongIndex === -1) {
            get().playSong(get().playerSongs[0].id)
          } else {
            get().audioPlayerRef?.current?.play()
            set(() => ({
              isPlaying: true,
            }))
          }
        }
      },
      continuePlay: () => {
        if (!get().isPlaying) {
          get().audioPlayerRef?.current?.play()
          set(() => ({
            isPlaying: false,
          }))
        }
      },
      removeSong: (songId: UniqueIdentifier) => {
        set(state => {
          const index = state.playerSongs.findIndex(song => song.id === songId)
          const newSongs = state.playerSongs.filter(song => song.id !== songId)
          if (state.currentSongIndex === index) {
            get().setCurrentSongIndex(-1)
            if (get().isPlaying) {
              get().stopPlaying()
            }
          }
          return {
            playerSongs: newSongs,
            currentSongIndex:
              state.currentSongIndex === index ? -1 : state.currentSongIndex,
          }
        })
      },
      playSong: (songId: UniqueIdentifier) => {
        const isCurrentSong = get().playerSongs[get().currentSongIndex]?.id === songId
        const index = get().playerSongs.findIndex(song => song.id === songId)
        const song = get().playerSongs[index]
        const player = get().audioPlayerRef?.current

        if (!song?.id) {
          return
        }

        if (!player) {
          setTimeout(() => {
            get().playSong(songId)
          }, 800)
          return
        }

        if (get().isFirstRun) {
          get().setFirstRun(false)
        }

        if (isCurrentSong && !get().isPlaying) {
          get().setIsPlaying(true)
          emit('audio-player', {
            command: 'Playing',
          })
          player.play()
          emit('audio-player', {
            command: 'Playing',
          })

          return
        }

        get().setCurrentSongIndex(index)

        if (song?.src && player.src !== song.src) {
          if (get().isPlaying) {
            player.pause()
            player.currentTime = 0
            get().setBuffered(0)
          }
          player.src = song.src
          setTimeout(() => {
            try {
              get().setIsPlaying(true)
              player.play()
              emit('audio-player', {
                command: 'Playing',
              })
            } catch (error) {
              console.error(error)
            }
          }, 300)
        } else {
          player.pause()
          player.currentTime = 0
          get().setBuffered(0)
          get().setIsPlaying(true)
          player.play()
          emit('audio-player', {
            command: 'Playing',
          })
        }
      },
      setCurrentSongIndex: (index: number) => {
        set(() => ({
          currentSongIndex: index,
        }))
      },
      setAudioPlayerRef: (audioPlayerRef: React.RefObject<HTMLAudioElement>) =>
        set(() => ({
          audioPlayerRef,
        })),
      clearPlayerSongs: () => {
        set(() => ({
          buffered: 0,
          currentProgress: 0,
          currentSongIndex: -1,
          duration: 0,
          isPlaying: false,
          isReady: false,
          playerSongs: [],
        }))
      },
      addSong: async ({
        songUrl,
        id,
        isFile,
        sourceType,
        play = false,
        name,
      }: {
        songUrl: string
        id: UniqueIdentifier
        isFile?: boolean
        sourceType: SongSourceType
        play: boolean
        name?: string
      }) => {
        try {
          // check if song alread exists in the list
          const sameSongExists = get().playerSongs.find(song => song.id === id)

          if (sameSongExists) {
            if (play) {
              get().playSong(id)
            }
            return
          }

          let url = songUrl

          if (!isFile) {
            const _url = new URL(url)

            if (!_url.protocol) {
              _url.protocol = 'https:'
            } else if (_url.protocol === 'http:') {
              _url.protocol = 'https:'
            }
            url = _url.toString()
          }

          const audioInfo = (await invoke('validate_audio', {
            urlOrPath: isFile ? songUrl : url,
          })) as {
            is_valid: true
            title: string
            src: string
            error?: string
            artist: string
          }

          if (audioInfo.is_valid || get().trustedAudioIds.includes(id)) {
            const urlOrPath = isFile ? convertFileSrc(audioInfo.src) : audioInfo.src

            const songWithSameSrcExists = get().playerSongs.find(
              song => song.src === urlOrPath
            )

            if (songWithSameSrcExists) {
              get().removeSong(songWithSameSrcExists.id)
            }

            let titleFromPathOrUrl
            if (isFile) {
              const pathParts = audioInfo.src.split(/[\\/]/)
              const fileName = pathParts[pathParts.length - 1]
              titleFromPathOrUrl = fileName
                .replace('.mp3', '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
            } else {
              titleFromPathOrUrl = new URL(urlOrPath).pathname
                .split('/')
                .join(' ')
                .replace('.mp3', '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
            }

            const title =
              audioInfo.title && audioInfo.artist
                ? `${audioInfo.title} - ${audioInfo.artist}`
                : audioInfo.title
                  ? audioInfo.title
                  : audioInfo.artist
                    ? audioInfo.artist
                    : name
                      ? name
                      : titleFromPathOrUrl

            const song: Song = {
              title,
              id,
              sourceType,
              path: isFile ? audioInfo.src : undefined,
              src: urlOrPath,
              isValidated: true,
            }

            set(state => {
              return {
                playerSongs: [...state.playerSongs, song],
              }
            })

            if (play) {
              get().playSong(id)
            }
          } else {
            showInvalidTrackWarningAddSong.value = {
              songUrl,
              id,
              isFile,
              sourceType,
              play,
              name,
            }
          }
        } catch (e) {
          showInvalidTrackWarningAddSong.value = {
            songUrl,
            id,
            isFile,
            sourceType,
            play,
            name,
          }
        }
      },
      setSongList: (songs: Song[]) => {
        set(() => ({
          playerSongs: songs,
        }))
      },
      setIsPlaying: (isPlaying: boolean) => {
        set(() => ({
          isPlaying,
        }))
      },
      handleNext: () => {
        set(state => {
          const nextIndex = (state.currentSongIndex + 1) % state.playerSongs.length
          if (get().isFirstRun) {
            get().setFirstRun(false)
          }
          if (state.repeat === 'one') {
            get().playSong(state.playerSongs[state.currentSongIndex].id)
            return {
              currentSongIndex: state.currentSongIndex,
            }
          }
          if (
            state.repeat === 'all' &&
            state.currentSongIndex === state.playerSongs.length - 1
          ) {
            return {
              currentSongIndex: 0,
            }
          }
          return {
            currentSongIndex: nextIndex,
          }
        })
      },
      handlePrev: () => {
        set(state => {
          const prevIndex = state.currentSongIndex - 1
          if (get().isFirstRun) {
            get().setFirstRun(false)
          }
          if (state.repeat === 'one') {
            get().playSong(state.playerSongs[state.currentSongIndex].id)
            return {
              currentSongIndex: state.currentSongIndex,
            }
          }
          if (state.repeat === 'all' && prevIndex < 0) {
            return {
              currentSongIndex: state.playerSongs.length - 1,
            }
          }

          return {
            currentSongIndex: prevIndex < 0 ? state.playerSongs.length - 1 : prevIndex,
          }
        })
      },
      setIsReady: (isReady: boolean) => {
        set(() => ({
          isReady,
        }))
      },
      checkIfOnLine: () => {
        return navigator.onLine
      },
      setCurrentProgress: (progress: number) => {
        set(() => ({
          currentProgress: progress,
        }))
      },
      setDragProgress: debounce((progress: number) => {
        const player = get().audioPlayerRef?.current
        if (!player) return
        player.currentTime = progress
      }, 100),
      setDuration: (duration: number) => {
        set(() => ({
          duration,
        }))
      },
      setBuffered: (buffered: number) => {
        set(() => ({
          buffered,
        }))
      },
      setVolume: (volume: number) => {
        set(() => ({
          volume,
        }))
      },
    }),
    {
      name: 'player-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        playerSongs: state.playerSongs,
        addTrustedAudioId: state.addTrustedAudioId,
        volume: state.volume,
      }),
    }
  )
)

export const listenToAudioPlayerEvents = listen('audio-player', async event => {
  if (window.isHistoryWindow && event.windowLabel !== 'history') {
    playerStore.getState().stopPlaying()
  }
  if (window.isMainWindow && event.windowLabel !== 'main') {
    playerStore.getState().stopPlaying()
  }
})

export const playerStoreAtom = atomWithStore(playerStore)
