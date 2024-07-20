import { useEffect } from 'react'
import { appWindow, WebviewWindow } from '@tauri-apps/api/window'
import {
  clipboardHistoryStoreAtom,
  collectionsStoreAtom,
  isAppLocked,
  playerStoreAtom,
  settingsStoreAtom,
  showInvalidTrackWarningAddSong,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  Download,
  Minus,
  Pause,
  Pin,
  PinOff,
  Play,
  Plus,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '~/components/ui/menubar'
import { useToast } from '~/components/ui/use-toast'
import { Icons } from '~/components/icons'
import { ThemeModeToggle } from '~/components/theme-mode-toggle'
import { Badge, Box, Button, Flex, Shortcut, Text } from '~/components/ui'

import { useDeleteItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { PlayerMenu } from '../components/audio-player/PlayerMenu'
import Logo from './Logo'

export function NavBarHistoryWindow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { systemTheme } = useTheme()
  const isWindowOnTop = useSignal(false)
  const { setSystemTheme, deviceId } = useAtomValue(themeStoreAtom)
  const {
    playerSongs,
    isPlaying,
    clearPlayerSongs,
    addTrustedAudioId,
    addSong,
    downloadSong,
    getCurrentSong,
    removeSong,
    handleNext,
    repeat,
    setRepeat,
    handlePrev,
    togglePlayPause,
  } = useAtomValue(playerStoreAtom)

  const { currentCollectionId } = useAtomValue(collectionsStoreAtom)

  useEffect(() => {
    if (systemTheme) {
      setSystemTheme(systemTheme)
    }
  }, [systemTheme])

  const minimizeWindow = () => appWindow?.minimize()

  const onTopWindow = () => {
    appWindow?.setAlwaysOnTop(true)
    isWindowOnTop.value = true
  }
  const offTopWindow = () => {
    appWindow?.setAlwaysOnTop(false)
    isWindowOnTop.value = false
  }

  const closeWindow = () => {
    appWindow.close()
  }

  const { deleteItemById } = useDeleteItemById()

  const {
    isShowCollectionNameOnNavBar,
    isShowDisabledCollectionsOnNavBarMenu,
    setIsShowCollectionNameOnNavBar,
    copyPasteDelay,
    setCopyPasteDelay,
    setIsHistoryEnabled,
    isHistoryEnabled,
    setUpdaterSkipVersion,
    setUpdaterRemindLater,
    relaunchApp,
    checkForUpdate,
    installUpdate,
    appToursCompletedList,
    appToursSkippedList,
    setAppToursCompletedList,
    setAppToursSkippedList,
    setIsHistoryAutoUpdateOnCaputureEnabled,
    isHistoryAutoUpdateOnCaputureEnabled,
    setIsShowDisabledCollectionsOnNavBarMenu,
  } = useAtomValue(settingsStoreAtom)

  const { deleteClipboardHistoryItem } = useAtomValue(clipboardHistoryStoreAtom)

  const {
    fontSize,
    decreaseFontSize,
    increaseFontSize,
    resetFontSize,
    setIsSwapPanels,
    toggleIsSplitPanelView,
    isWindows,
    setIsShowPinned,
    isSwapPanels,
  } = useAtomValue(uiStoreAtom)

  useHotkeys(['alt+b', 'ctrl+b', 'meta+b'], () => {
    navigate('/history', { replace: true })
  })

  useHotkeys(['alt+m', 'ctrl+m', 'meta+m'], () => {
    navigate('/menu', { replace: true })
  })

  useHotkeys(['alt+l', 'ctrl+l', 'meta+l'], () => {
    isAppLocked.value = true
  })

  useHotkeys(['ctrl+alt+p', 'ctrl+meta+p'], () => {
    setIsSwapPanels(!isSwapPanels)
  })

  useHotkeys(['alt+p', 'ctrl+p', 'meta+p'], e => {
    e.preventDefault()
    if (playerSongs.length > 0) {
      togglePlayPause()
    }
  })

  useHotkeys(['alt+]', 'ctrl+]', 'meta+]'], () => {
    if (playerSongs.length > 0) {
      handleNext()
    }
  })

  useHotkeys(['alt+[', 'ctrl+[', 'meta+['], () => {
    if (playerSongs.length > 0) {
      handlePrev()
    }
  })

  useHotkeys('ctrl+q', () => {
    if (isWindows) {
      closeWindow()
    }
  })

  useHotkeys(['alt+n', 'ctrl+n', 'meta+n'], async () => {
    await toggleIsSplitPanelView()
  })

  useHotkeys('ctrl+w', () => {
    if (isWindows) {
      closeWindow()
    }
  })

  useEffect(() => {
    if (window.plausible && deviceId) {
      window.plausible('History Separate Window', {
        props: { deviceId },
      })
    }
  }, [deviceId, window.plausible])

  useEffect(() => {
    if (showInvalidTrackWarningAddSong.value) {
      const invalidTrackWarning = toast({
        title: t('Security Alert: MP3 Verification Failed', { ns: 'common' }),
        id: 'update-download-completed',
        description: (
          <Box>
            {t(
              "We couldn't confirm this file's safety. Failed ID3 tag verification and integrity check. MP3 files can potentially contain malware. Please be cautious.",
              { ns: 'common' }
            )}
            <Text className="font-semibold mt-2 !text-yellow-300 dark:!text-yellow-500 ">
              {t(
                'Adding this file to the player is not recommended unless you trust the source.',
                { ns: 'common' }
              )}
            </Text>

            <Flex className="justify-between">
              <Button
                autoFocus
                className="bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 hover:bg-yellow-800 px-4 mt-3 text-white"
                onClick={() => {
                  if (showInvalidTrackWarningAddSong.value?.id) {
                    addTrustedAudioId(showInvalidTrackWarningAddSong.value?.id)
                    addSong(showInvalidTrackWarningAddSong.value)
                  }
                  invalidTrackWarning.dismiss()
                }}
              >
                {t('Trust and Play', { ns: 'common' })}
              </Button>

              <Button
                autoFocus
                className="bg-red-800 dark:bg-red-700 dark:hover:bg-red-600 hover:bg-red-500 px-4 mt-3 text-white"
                onClick={async () => {
                  if (showInvalidTrackWarningAddSong.value?.sourceType === 'clip') {
                    deleteItemById({
                      itemId: showInvalidTrackWarningAddSong.value?.id,
                      collectionId: currentCollectionId,
                    })
                  } else if (
                    showInvalidTrackWarningAddSong.value?.sourceType === 'history'
                  ) {
                    deleteClipboardHistoryItem(showInvalidTrackWarningAddSong.value?.id)
                  }
                  invalidTrackWarning.dismiss()
                }}
              >
                {t('Delete', { ns: 'common' })}
              </Button>

              <Flex className="gap-3">
                <Button
                  variant="outline"
                  className="dark:text-gray-400 px-4 mt-3 text-gray-200 hover:bg-transparent hover:dark:bg-transparent hover:text-gray-50 hover:dark:text-gray-300"
                  onClick={() => {
                    invalidTrackWarning.dismiss()
                  }}
                >
                  {t('Cancel', { ns: 'common' })}
                </Button>
              </Flex>
            </Flex>
          </Box>
        ),
        className: 'bg-amber-600 dark:bg-amber-900 text-white',
        onDismiss: () => {
          showInvalidTrackWarningAddSong.value = null
        },
        duration: 0,
      })
    }
  }, [showInvalidTrackWarningAddSong.value])

  return (
    <div
      data-tauri-drag-region
      className="h-[41px] absolute top-0 left-0 w-full"
      id="navbar-panel_tour"
    >
      <Menubar
        className="border-0 !h-full border-b border-slate-200/50 dark:border-slate-500/50 rounded-b-none bg-gray-50 pl-3 hover:bg-white dark:hover:bg-gray-950 active:cursor-move active:bg-white transform duration-300 dark:bg-gray-900 dark:text-slate-300"
        data-tauri-drag-region
      >
        <div className="inline-flex h-fit w-fit items-center text-cyan-500 relative">
          <div
            className="absolute top-0 bottom-0 left-0 right-0 cursor-move"
            data-tauri-drag-region
          />
          <Logo width={28} height={28} />
        </div>

        <MenubarMenu>
          <MenubarTrigger
            className="md m-0 px-2.5 text-sm font-semibold whitespace-nowrap"
            id="navbar-pastebar_tour"
          >
            <Text className="font-semibold">{t('History', { ns: 'common' })}</Text>
          </MenubarTrigger>
          <MenubarContent>
            {playerSongs.length > 0 && (
              <MenubarSub>
                <MenubarSubTrigger>
                  {t('Audio Player', { ns: 'navbar' })} ...
                  <Badge variant="outline" className="ml-1.5 !font-normal">
                    {playerSongs.length}
                  </Badge>
                </MenubarSubTrigger>
                <MenubarSubContent className="dark:text-slate-300 max-w-[220px]">
                  {getCurrentSong() && (
                    <>
                      <MenubarItem disabled>{getCurrentSong()?.title}</MenubarItem>
                      <MenubarSeparator />
                    </>
                  )}
                  <MenubarItem
                    onClick={e => {
                      e.preventDefault()
                      togglePlayPause()
                    }}
                  >
                    {isPlaying ? (
                      <Flex>
                        <Pause size="14" className="mr-2" />
                        {t('Pause Playing', { ns: 'common' })}
                      </Flex>
                    ) : (
                      <Flex>
                        <Play size="14" className="mr-2" />
                        {t('Play', { ns: 'common' })}
                      </Flex>
                    )}
                    <MenubarShortcut>
                      <Shortcut keys="CTRL+P" />
                    </MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem
                    onClick={e => {
                      e.preventDefault()
                      handleNext()
                    }}
                  >
                    <Flex>
                      <SkipForward size="14" className="mr-2" />
                      {t('Next Track', { ns: 'common' })}
                    </Flex>
                    <MenubarShortcut>
                      <Shortcut keys="CTRL+]" />
                    </MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem
                    onClick={e => {
                      e.preventDefault()
                      handleNext()
                    }}
                  >
                    <Flex>
                      <SkipBack size="14" className="mr-2" />
                      {t('Previous Track', { ns: 'common' })}
                    </Flex>
                    <MenubarShortcut>
                      <Shortcut keys="CTRL+[" />
                    </MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />

                  <MenubarItem
                    onClick={e => {
                      e.preventDefault()
                      if (repeat === 'none') {
                        setRepeat('one')
                      } else if (repeat === 'one') {
                        setRepeat('all')
                      } else {
                        setRepeat('none')
                      }
                    }}
                  >
                    {repeat === 'none' && (
                      <Flex>
                        <Repeat size="14" className="mr-2" />
                        {t('Repeat off', { ns: 'common' })}
                      </Flex>
                    )}
                    {repeat === 'one' && (
                      <Flex>
                        <Repeat1 size="14" className="mr-2" />
                        {t('Repeat 1', { ns: 'common' })}
                      </Flex>
                    )}
                    {repeat === 'all' && (
                      <Flex>
                        <Repeat size="14" className="mr-2" />
                        {t('Repeat all', { ns: 'common' })}
                      </Flex>
                    )}
                  </MenubarItem>

                  <MenubarSub>
                    <MenubarSubTrigger>
                      <Flex>
                        <X size="14" className="mr-2" />
                        {t('Clear Tracks', { ns: 'common' })} ...
                      </Flex>
                    </MenubarSubTrigger>
                    <MenubarSubContent className="dark:text-slate-300">
                      {getCurrentSong() && (
                        <MenubarItem
                          onClick={() => {
                            removeSong(getCurrentSong()?.id as string)
                          }}
                        >
                          {t('Remove current track', { ns: 'common' })}
                        </MenubarItem>
                      )}
                      <MenubarItem
                        onClick={() => {
                          clearPlayerSongs()
                        }}
                      >
                        {t('Remove all tracks', { ns: 'common' })}
                      </MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  {getCurrentSong() && (
                    <>
                      <MenubarSeparator />
                      <MenubarItem
                        onClick={e => {
                          const song = getCurrentSong()
                          if (song) {
                            downloadSong(song)
                          }
                        }}
                      >
                        <Flex>
                          <Download size="14" className="mr-2" />
                          {t('Download mp3', { ns: 'common' })}
                        </Flex>
                      </MenubarItem>
                    </>
                  )}
                </MenubarSubContent>
              </MenubarSub>
            )}
            <MenubarSub>
              <MenubarSubTrigger>{t('View', { ns: 'navbar' })}</MenubarSubTrigger>
              <MenubarSubContent className="dark:text-slate-300">
                {!isWindowOnTop.value ? (
                  <MenubarItem onClick={onTopWindow}>
                    {t('Window:::Pin Window', { ns: 'navbar' })}
                    <Pin className="stroke-[1.8px] ml-auto" size={15} />
                  </MenubarItem>
                ) : (
                  <MenubarItem onClick={offTopWindow}>
                    {t('Window:::UnPin Window', { ns: 'navbar' })}
                    <PinOff className="stroke-[1.8px] ml-auto" size={15} />
                  </MenubarItem>
                )}

                <MenubarItem onClick={minimizeWindow}>
                  {t('Window:::Minimize Window', { ns: 'navbar' })}
                  <Icons.minimize width="10" height="10" className="ml-auto" />
                </MenubarItem>
                <MenubarSeparator />

                <ThemeModeToggle />

                <MenubarSeparator />
                <MenubarItem
                  disabled={fontSize === '125%'}
                  onClick={e => {
                    e.preventDefault()
                    increaseFontSize()
                  }}
                >
                  {t('Increase UI Font Size', { ns: 'settings' })}{' '}
                  <Plus width="1em" height="18" className="ml-auto" />
                </MenubarItem>
                <MenubarItem
                  disabled={fontSize === '85%'}
                  onClick={e => {
                    e.preventDefault()
                    decreaseFontSize()
                  }}
                >
                  {t('Decrease UI Font Size', { ns: 'settings' })}{' '}
                  <Minus width="1em" height="18" className="ml-auto" />
                </MenubarItem>
                <MenubarItem
                  disabled={fontSize === '100%'}
                  onClick={e => {
                    e.preventDefault()
                    resetFontSize()
                  }}
                >
                  {t('Reset Font Size', { ns: 'settings' })}
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger>
                {t('Settings', { ns: 'settings' })} ...
              </MenubarSubTrigger>
              <MenubarSubContent className="dark:text-slate-300">
                <MenubarSub>
                  <MenubarSubTrigger>
                    {t('Capture History', { ns: 'history' })} ...
                  </MenubarSubTrigger>
                  <MenubarSubContent className="dark:text-slate-300 text-slate-800">
                    <MenubarCheckboxItem
                      checked={isHistoryEnabled}
                      onClick={e => {
                        e.preventDefault()
                        setIsHistoryEnabled(!isHistoryEnabled)
                      }}
                    >
                      <Text
                        className={`mr-2 ${
                          !isHistoryEnabled ? 'text-slate-900/50' : 'text-slate-800'
                        }`}
                      >
                        {t('Enable Capture History', { ns: 'history' })}
                      </Text>
                      <MenubarShortcut className="ml-auto">
                        <Shortcut keys="CTRL+H" />
                      </MenubarShortcut>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem
                      checked={isHistoryAutoUpdateOnCaputureEnabled}
                      onClick={e => {
                        e.preventDefault()
                        setIsHistoryAutoUpdateOnCaputureEnabled(
                          !isHistoryAutoUpdateOnCaputureEnabled
                        )
                      }}
                    >
                      <Text
                        className={`mr-2 ${
                          !isHistoryAutoUpdateOnCaputureEnabled
                            ? 'text-slate-900/50'
                            : 'text-slate-800'
                        }`}
                      >
                        {t('Auto Update on Capture', { ns: 'history' })}
                      </Text>
                      <MenubarShortcut className="ml-auto">
                        <Shortcut keys="CTRL+A" />
                      </MenubarShortcut>
                    </MenubarCheckboxItem>
                  </MenubarSubContent>
                </MenubarSub>

                <MenubarSub>
                  <MenubarSubTrigger>
                    <>
                      {t('Paste Delay', { ns: 'contextMenus' })}
                      ...
                      {copyPasteDelay && (
                        <Badge
                          className="ml-2 py-0 bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          variant="outline"
                        >
                          {copyPasteDelay}s
                        </Badge>
                      )}
                    </>
                  </MenubarSubTrigger>
                  <MenubarSubContent className="dark:text-slate-300">
                    <MenubarCheckboxItem
                      checked={copyPasteDelay === 1}
                      onSelect={() => {
                        setCopyPasteDelay(1)
                      }}
                    >
                      <Text>1 {t('second', { ns: 'common' })}</Text>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem
                      checked={copyPasteDelay === 2}
                      onSelect={() => {
                        setCopyPasteDelay(2)
                      }}
                    >
                      <Text>2 {t('seconds', { ns: 'common' })}</Text>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem
                      checked={copyPasteDelay === 3}
                      onSelect={() => {
                        setCopyPasteDelay(3)
                      }}
                    >
                      <Text>3 {t('seconds', { ns: 'common' })}</Text>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem
                      checked={copyPasteDelay === 4}
                      onSelect={() => {
                        setCopyPasteDelay(4)
                      }}
                    >
                      <Text>4 {t('seconds', { ns: 'common' })}</Text>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem
                      checked={copyPasteDelay === 5}
                      onSelect={() => {
                        setCopyPasteDelay(5)
                      }}
                    >
                      <Text>5 {t('seconds', { ns: 'common' })}</Text>
                    </MenubarCheckboxItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem
                  onClick={() => {
                    window.location.reload()
                  }}
                >
                  {t('Refresh UI', { ns: 'settings' })}
                  <MenubarShortcut>
                    <Shortcut keys="ALT+R" />
                  </MenubarShortcut>
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem
              onClick={() => {
                isAppLocked.value = true
              }}
            >
              {t('Lock', { ns: 'navbar' })}
              <MenubarShortcut className="ml-auto">
                <Shortcut keys="CTRL+L" />
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                const main = WebviewWindow.getByLabel('main')
                if (main) {
                  main?.show()
                  main?.setFocus()
                }
              }}
            >
              {t('Open PasteBar', { ns: 'navbar' })}
              <MenubarShortcut>
                <Shortcut keys="CTRL+O" />
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={closeWindow}>
              {t('Close History', { ns: 'navbar' })}
              <MenubarShortcut>
                <Shortcut keys="CTRL+W" />
              </MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <div
          data-tauri-drag-region
          className="inline-flex h-full w-full items-center justify-center"
        ></div>

        <div data-tauri-drag-region className="inline-flex h-full justify-end">
          {playerSongs.length > 0 && <PlayerMenu />}
          {!isWindowOnTop.value ? (
            <Button
              onClick={onTopWindow}
              title={t('Window:::Pin Window', { ns: 'navbar' })}
              variant="ghost"
              className="h-8 focus:outline-none"
            >
              <Pin className="stroke-[1.8px]" size={16} />
            </Button>
          ) : (
            <Button
              onClick={offTopWindow}
              title={t('Window:::UnPin Window', { ns: 'navbar' })}
              variant="ghost"
              className="h-8 focus:outline-none"
            >
              <PinOff className="stroke-[1.8px]" size={16} />
            </Button>
          )}
          <Button
            onClick={closeWindow}
            id="navbar-close-window_tour"
            variant="ghost"
            className="h-8 focus:outline-none"
            title={t('Close History Window', { ns: 'common' })}
          >
            <X className="stroke-[1.8px]" size={18} />
          </Button>
        </div>
      </Menubar>
    </div>
  )
}
