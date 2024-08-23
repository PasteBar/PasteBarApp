import { useEffect, useRef, useState } from 'react'
import {
  Active,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { playerStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { ArrowUpDown, Pause, Play, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import SimpleBar from '~/components/libs/simplebar-react'
import {
  Badge,
  Button,
  ButtonGhost,
  Flex,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
  Text,
} from '~/components/ui'

import mergeRefs from '../atoms/merge-refs'
import ToolTip from '../atoms/tooltip'
import { SimpleBarOptions } from '../libs/simplebar-react/simplebar-core'
import { formatDurationDisplay, PlayerUI } from './PlayerUI'

export const PlayerMenu = ({
  isShowNavBarItems = true,
}: {
  isShowNavBarItems?: boolean
}) => {
  const {
    currentSongIndex,
    setCurrentSongIndex,
    playerSongs,
    setSongList,
    playSong,
    clearPlayerSongs,
    isPlaying,
    removeSong,
    currentProgress,
  } = useAtomValue(playerStoreAtom)

  const elapsedDisplay = formatDurationDisplay(currentProgress)
  const currentSongRef = useRef<HTMLLIElement>(null)
  const scrollBarRef = useRef<SimpleBarOptions | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const { t } = useTranslation()

  const isHistoryWindow = window.isHistoryWindow

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 600,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [active, setActive] = useState<(Active & { src: string }) | null>(null)

  useEffect(() => {
    if (currentSongRef.current) {
      if (currentSongIndex > 5) {
        currentSongRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [currentSongIndex])

  return (
    <MenubarMenu>
      <MenubarTrigger
        className={`font-normal px-2.5 ${isShowNavBarItems ? 'opacity-1' : 'opacity-0'}`}
        onMouseOver={() => {
          if (confirmClear) {
            setConfirmClear(false)
          }
        }}
      >
        <Flex>
          {isPlaying ? (
            <>
              <Play size={15} className="mx-1 fill-gray-200 dark:fill-gray-800" />
              <span className="w-10 text-xs pt-[1px]">{elapsedDisplay}</span>
            </>
          ) : (
            <>
              <Pause size={15} className="mx-1" />
              {currentSongIndex > 0 ? (
                <span className="w-10 text-xs pt-[1px] opacity-50">{elapsedDisplay}</span>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-100 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 cursor-pointer px-1.5"
                >
                  <Text className="dark:!text-gray-400 font-semibold">
                    {playerSongs.length}
                  </Text>
                </Badge>
              )}
            </>
          )}
        </Flex>
      </MenubarTrigger>
      <MenubarContent
        className={`mr-2 pt-3 ${isHistoryWindow ? 'w-[310px]' : 'w-[510px]'} relative`}
      >
        {confirmClear && (
          <div className="flex items-center gap-4 flex-col justify-center px-2.5 py-2.5 absolute top-0 left-0 right-0 bottom-0 animate-in fade-in-100 bg-black dark:bg-gray-950 bg-opacity-60 dark:bg-opacity-70 z-100">
            <Button
              variant="light"
              className="hover:bg-amber-500 dark:hover:bg-amber-700 bg-amber-600 dark:bg-amber-800 text-white dark:text-gray-50"
              onClick={() => {
                clearPlayerSongs()
                setConfirmClear(false)
              }}
            >
              {t('Remove all tracks', { ns: 'common' })}
            </Button>
            <Button
              variant="ghost"
              className="text-gray-50 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-800"
              onClick={() => {
                setConfirmClear(false)
              }}
            >
              {t('Cancel', { ns: 'common' })}
            </Button>
          </div>
        )}

        <ButtonGhost
          size="xs"
          className={`z-100 absolute top-1.5 right-2 rounded-md ${
            confirmClear ? 'hover:bg-gray-700' : ''
          } dark:hover:bg-gray-800`}
          onClick={() => {
            if (confirmClear) {
              setConfirmClear(false)
            } else {
              setConfirmClear(true)
            }
          }}
        >
          <ToolTip text={t('Clear Tracks', { ns: 'common' })} isCompact>
            <X size={22} className="dark:text-gray-500 text-gray-400" />
          </ToolTip>
        </ButtonGhost>
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={({ active }: { active: Active & { src: string } }) => {
            setActive(active)
          }}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              const oldIndex = playerSongs.findIndex(song => song.id === active.id)
              const newIndex = playerSongs.findIndex(song => song.id === over.id)

              const newSongList = arrayMove(playerSongs, oldIndex, newIndex)
              setSongList(newSongList)

              if (oldIndex === currentSongIndex) {
                setCurrentSongIndex(newIndex)
              } else if (
                (oldIndex < currentSongIndex && newIndex >= currentSongIndex) ||
                (oldIndex > currentSongIndex && newIndex <= currentSongIndex)
              ) {
                setCurrentSongIndex(currentSongIndex + (oldIndex < newIndex ? -1 : 1))
              }
            }
            setActive(null)
          }}
          onDragCancel={() => {
            setActive(null)
          }}
        >
          <SortableContext
            items={playerSongs.map(({ id }) => id)}
            strategy={verticalListSortingStrategy}
          >
            <SimpleBar
              className="code-filter"
              ref={ref => {
                scrollBarRef.current = ref
              }}
              style={{
                height: 'auto',
                maxHeight: '400px',
                width: '100%',
              }}
              autoHide={true}
            >
              <ul className="pl-1">
                {playerSongs.map((song, index) => (
                  <SortableSong
                    key={song.id}
                    song={song}
                    index={index}
                    removeSong={removeSong}
                    hasDragged={!!active}
                    isPlaying={isPlaying}
                    currentSongIndex={currentSongIndex}
                    playSong={playSong}
                    currentProgress={currentProgress}
                    currentSongRef={currentSongRef}
                  />
                ))}
              </ul>
            </SimpleBar>
          </SortableContext>
        </DndContext>
        <div className="mt-2">
          <PlayerUI />
        </div>
      </MenubarContent>
    </MenubarMenu>
  )
}

export function SortableSong({
  song,
  index,
  currentSongIndex,
  isPlaying,
  hasDragged,
  removeSong,
  playSong,
  currentProgress,
  currentSongRef,
}: {
  song: { title: string; src: string; id: UniqueIdentifier }
  index: number
  isPlaying: boolean
  removeSong: (id: UniqueIdentifier) => void
  currentSongIndex: number
  hasDragged: boolean
  playSong: (id: UniqueIdentifier) => void
  currentProgress: number
  currentSongRef: React.RefObject<HTMLLIElement>
}) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: song.id,
    animateLayoutChanges: () => false,
    data: {
      type: 'Song',
      id: song.id,
      src: song.src,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <li
      key={song.id}
      className="mb-1 ml-1 mt-2 group"
      ref={mergeRefs(setNodeRef, currentSongRef)}
      style={style}
      {...listeners}
    >
      <div
        onClick={() => {
          playSong(song.id)
        }}
        className={`flex animate-in relative duration-100 items-center py-2.5 px-3 w-full justify-evenly rounded-lg cursor-pointer ${
          isDragging
            ? 'border-dashed border-2 z-100 !border-blue-500 !bg-blue-50/50 dark:!bg-blue-900/50 dark:!border-blue-500/50'
            : 'z-1 border-transparent'
        } ${
          currentSongIndex === index
            ? 'bg-gray-100 text-amber-600 font-semibold dark:bg-gray-800 '
            : !hasDragged &&
              'hover:dark:border-gray-800 group hover:border-gray-200 hover:dark:bg-gray-800/70 hover:bg-gray-100/70'
        }`}
      >
        {!isDragging ? (
          <>
            {index === currentSongIndex ? (
              <>{!isPlaying ? <Pause size={18} /> : <Play size={18} />}</>
            ) : (
              <span className="text-sm opacity-20 pl-1">{index + 1}</span>
            )}
          </>
        ) : (
          <ArrowUpDown
            size={index === currentSongIndex ? 18 : 16}
            className={index === currentSongIndex ? '' : 'opacity-50 text-gray-500'}
          />
        )}
        <h2 className="flex-1 px-4 line-clamp-2 text-[15px] pr-6">{song.title}</h2>
        {index === currentSongIndex ? (
          <button
            className="text-sm absolute right-3"
            onClick={() => {
              removeSong(song.id)
            }}
          >
            <span className="group-hover:hidden">
              {formatDurationDisplay(currentProgress)}
            </span>
            <span className="w-[40px] hidden group-hover:flex justify-end group-hover:opacity-100 opacity-0 text-amber-600 hover:text-amber-400">
              <X size={20} />
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              removeSong(song.id)
            }}
            className={`${
              index === currentSongIndex ? 'opacity-100' : 'opacity-0'
            } absolut right-2 hover:opacity-100 group-hover:opacity-100 text-gray-400 hover:text-gray-400`}
          >
            <X size={20} />
          </button>
        )}
      </div>
    </li>
  )
}
