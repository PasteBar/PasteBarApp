import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import { onUpdaterEvent } from '@tauri-apps/api/updater'
import { appWindow } from '@tauri-apps/api/window'
import { LANGUAGES } from '~/locales/languges'
import { GlobalSearch } from '~/pages/components/Dashboard/components/GlobalSearch'
import {
  APP_TOURS,
  availableVersionBody,
  availableVersionDate,
  availableVersionNumber,
  clipboardHistoryStoreAtom,
  collectionsStoreAtom,
  isAppLocked,
  isCreatingMenuItem,
  isNavBarHovering,
  onBoardingTourSingleElements,
  openAboutPasteBarModal,
  openContactUsFormModal,
  openOnBoardingTourName,
  playerStoreAtom,
  settingsStoreAtom,
  showInvalidTrackWarningAddSong,
  showRestartAfterUpdate,
  showUpdateAppIsLatest,
  showUpdateAvailable,
  showUpdateChecking,
  showUpdateError,
  showUpdateErrorDownloadError,
  showUpdateErrorDownloadingUpdate,
  showUpdateErrorPermissionDenied,
  showUpdateErrorQuitAppToFinish,
  showUpdateInstalling,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import {
  BellOff,
  BellRing,
  Check,
  Columns2,
  Download,
  ExternalLink,
  FileCog,
  LibrarySquare,
  Maximize,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Repeat1,
  Settings,
  SkipBack,
  SkipForward,
  TabletSmartphone,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '~/components/ui/menubar'
import { useToast } from '~/components/ui/use-toast'
import ToolTip from '~/components/atoms/tooltip'
import { Icons } from '~/components/icons'
import SimpleBar from '~/components/libs/simplebar-react'
import { SocialContacts } from '~/components/organisms/modals/SocialContacts'
import { ThemeModeToggle } from '~/components/theme-mode-toggle'
import { Badge, Box, Button, Flex, Shortcut, Text } from '~/components/ui'

import { useSelectCollectionById } from '~/hooks/queries/use-collections'
import { useDeleteItemById } from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

import { PlayerMenu } from '../components/audio-player/PlayerMenu'
import Logo from './Logo'
import { TranslatedBoardingSteps } from './Tour'

export function NavBar() {
  const { t, i18n } = useTranslation()
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { systemTheme } = useTheme()
  const { setSystemTheme, themeDark, deviceId } = useAtomValue(themeStoreAtom)
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

  const { currentCollectionId, collections, pinnedClips } =
    useAtomValue(collectionsStoreAtom)
  const { selectCollectionById } = useSelectCollectionById()
  const isDark = themeDark()

  useEffect(() => {
    invoke('is_autostart_enabled').then(isEnabled => {
      setIsAutoStartEnabled(Boolean(isEnabled))
    })
    const listenToOnUpdaterEventUnlisten = onUpdaterEvent(({ error, status }) => {
      if (import.meta.env.TAURI_DEBUG) {
        console.log('Updater status', status)
        console.log('Updater error', error)
      }
    })

    return () => {
      listenToOnUpdaterEventUnlisten.then(unlisten => {
        unlisten()
      })
    }
  }, [])

  useEffect(() => {
    if (systemTheme) {
      setSystemTheme(systemTheme)
    }
  }, [systemTheme])

  const minimizeWindow = () => appWindow?.minimize()
  const maximizeWindow = async () => {
    if (await appWindow?.isMaximized()) {
      appWindow?.unmaximize()
    } else {
      appWindow?.maximize()
    }
  }
  const hideWindow = () => {
    setIsHideMainWindow(true)
    appWindow.hide()
  }
  const closeWindow = () => {
    appWindow.close()
  }

  const { deleteItemById } = useDeleteItemById()

  const {
    isShowCollectionNameOnNavBar,
    isShowDisabledCollectionsOnNavBarMenu,
    setIsShowCollectionNameOnNavBar,
    setIsHideCollectionsOnNavBar,
    setIsShowNavBarItemsOnHoverOnly,
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
    isShowNavBarItemsOnHoverOnly,
    isHideCollectionsOnNavBar,
  } = useAtomValue(settingsStoreAtom)

  const { deleteClipboardHistoryItem } = useAtomValue(clipboardHistoryStoreAtom)

  const {
    fontSize,
    decreaseFontSize,
    increaseFontSize,
    resetFontSize,
    setIsSwapPanels,
    isShowPinned,
    isSplitPanelView,
    setIsHideMainWindow,
    toggleIsSplitPanelView,
    toggleHistoryQuickPasteWindow,
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

  useHotkeys(['alt+c'], () => {
    navigate('/app-settings/collections', { replace: true })
  })

  useHotkeys(['alt+h'], () => {
    navigate('/app-settings/history', { replace: true })
  })

  useHotkeys(['alt+u'], () => {
    navigate('/app-settings/preferences', { replace: true })
  })

  useHotkeys(['ctrl+q'], () => {
    if (isWindows) {
      closeWindow()
    }
  })

  useHotkeys(['meta+q'], () => {
    if (!isWindows) {
      closeWindow()
    }
  })

  useHotkeys(['alt+n', 'ctrl+n', 'meta+n'], async () => {
    await toggleIsSplitPanelView()
  })

  useHotkeys(['alt+p', 'ctrl+p', 'meta+p'], async () => {
    await toggleHistoryQuickPasteWindow()
  })

  useHotkeys('ctrl+w', () => {
    if (isWindows) {
      hideWindow()
    }
  })

  useEffect(() => {
    if (isCreatingMenuItem.value) {
      navigate('/menu', { replace: true })
    }
  }, [isCreatingMenuItem.value])

  const buildDate = dayjs(BUILD_DATE).format('MMMM, YYYY')

  useEffect(() => {
    if (window.plausible && deviceId) {
      window.plausible('App Start', { props: { deviceId } })
    }
  }, [deviceId, window.plausible])

  useEffect(() => {
    if (showUpdateErrorQuitAppToFinish.value) {
      const updateRestart = toast({
        title: t('Download Completed', { ns: 'updater' }),
        id: 'update-download-completed',
        description: (
          <Box>
            {t('Download Completed Quit and Manually Install', { ns: 'updater' })}
            <Flex className="justify-between">
              <Button
                autoFocus
                className="bg-green-800 dark:bg-green-700 dark:hover:bg-green-600 hover:bg-green-500 px-4 mt-3 text-white"
                onClick={closeWindow}
              >
                {t('Quit PasteBar', { ns: 'updater' })}
              </Button>

              <Flex className="gap-3">
                <Button
                  variant="outline"
                  className="dark:text-gray-400 px-4 mt-3 text-gray-200 hover:bg-transparent hover:dark:bg-transparent hover:text-gray-50 hover:dark:text-gray-300"
                  onClick={() => {
                    updateRestart.dismiss()
                  }}
                >
                  {t('Cancel', { ns: 'common' })}
                </Button>
              </Flex>
            </Flex>
          </Box>
        ),
        className: 'bg-green-600 dark:bg-green-900 text-white',
        onDismiss: () => {
          showUpdateErrorQuitAppToFinish.value = false
          showUpdateErrorPermissionDenied.value = false
          showUpdateError.value = false
        },
        duration: 0,
      })
    } else if (showUpdateErrorPermissionDenied.value || showUpdateError.value) {
      const updateError = toast({
        title: showUpdateErrorPermissionDenied.value
          ? t('Update: Permission Denied', { ns: 'updater' })
          : t('Update Error', { ns: 'updater' }),
        id: showUpdateErrorPermissionDenied.value
          ? 'update-permission-denied'
          : 'update-error',
        description: (
          <Box>
            {showUpdateErrorPermissionDenied.value
              ? t('Permission Denied Message', { ns: 'updater' })
              : t('General Update Error', { ns: 'updater' })}
            <Flex className="justify-between">
              <Button
                autoFocus
                className="bg-orange-600 dark:bg-orange-700 dark:hover:bg-orange-800 hover:bg-orange-600 px-4 mt-3 text-white"
                onClick={async () => {
                  try {
                    showUpdateErrorDownloadError.value = false
                    showUpdateErrorDownloadingUpdate.value = true
                    const res = await invoke('download_and_execute')

                    if (res === 'ok') {
                      updateError.dismiss()
                      showUpdateErrorQuitAppToFinish.value = true
                    } else {
                      showUpdateErrorDownloadError.value = true
                    }
                    showUpdateErrorDownloadingUpdate.value = false
                  } catch (error) {
                    showUpdateErrorDownloadError.value = true
                    showUpdateErrorDownloadingUpdate.value = false
                    console.error('Download and execute error', error)
                  }
                }}
              >
                {!showUpdateErrorDownloadError.value ? (
                  showUpdateErrorDownloadingUpdate.value ? (
                    <Flex>
                      {t('Downloading...', { ns: 'updater' })}
                      <RefreshCw className="animate-spin opacity-75 ml-2" size="14" />
                    </Flex>
                  ) : (
                    t('Download Update', { ns: 'updater' })
                  )
                ) : (
                  t('Download Error! Try again', { ns: 'updater' })
                )}
              </Button>
              <Flex className="gap-3">
                <Button
                  variant="outline"
                  className="dark:text-gray-400 px-4 mt-3 text-gray-200 hover:bg-transparent hover:dark:bg-transparent hover:text-gray-50 hover:dark:text-gray-300"
                  onClick={() => {
                    updateError.dismiss()
                  }}
                >
                  {t('Skip Download', { ns: 'updater' })}
                </Button>
              </Flex>
            </Flex>
          </Box>
        ),
        className: 'bg-amber-600 dark:bg-amber-900 text-white',
        onDismiss: () => {
          showUpdateErrorPermissionDenied.value = false
          showUpdateError.value = false
        },
        duration: 0,
      })
    }
  }, [
    showUpdateErrorPermissionDenied.value,
    showUpdateError.value,
    showUpdateErrorDownloadingUpdate.value,
    showUpdateErrorDownloadError.value,
    showUpdateErrorQuitAppToFinish.value,
    showUpdateErrorDownloadError.value,
  ])

  const isShowNavBarItems = isShowNavBarItemsOnHoverOnly ? isNavBarHovering.value : true

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
      onMouseEnter={() => {
        if (isShowNavBarItemsOnHoverOnly) {
          isNavBarHovering.value = true
        }
      }}
      onMouseLeave={() => {
        if (isShowNavBarItemsOnHoverOnly) {
          isNavBarHovering.value = false
        }
      }}
      onClick={() => {
        if (isShowNavBarItemsOnHoverOnly) {
          isNavBarHovering.value = true
        }
      }}
      id="navbar-panel_tour"
    >
      <Menubar
        data-tauri-drag-region
        className={`border-0 !h-full border-b border-slate-200/50 dark:border-slate-500/50 rounded-b-none bg-gray-50 pl-3 hover:bg-white dark:hover:bg-gray-950 active:cursor-move active:bg-white transform duration-300 dark:bg-gray-900 dark:text-slate-300`}
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
            <Text className="font-semibold">{t('PasteBar', { ns: 'common' })}</Text>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                openAboutPasteBarModal.value = true
              }}
            >
              {t('About PasteBar', { ns: 'common' })}
              <MenubarShortcut>
                <ToolTip
                  text={t('Build on {{buildDate}}', { ns: 'common', buildDate })}
                  isCompact
                  side="right"
                >
                  v{APP_VERSION}
                </ToolTip>
              </MenubarShortcut>
            </MenubarItem>

            <MenubarSub>
              <MenubarSubTrigger>
                {t('Settings', { ns: 'settings' })} ...
              </MenubarSubTrigger>
              <MenubarSubContent className="w-[230px] dark:text-slate-300">
                <MenubarItem
                  onClick={() => {
                    navigate('/app-settings/history', { replace: true })
                  }}
                >
                  {t('Clipboard History Settings', { ns: 'settings' })}
                  <MenubarShortcut>
                    <Shortcut keys="ALT+H" />
                  </MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    navigate('/app-settings/collections', { replace: true })
                  }}
                >
                  {t('Manage Collections', { ns: 'settings' })}
                  <MenubarShortcut>
                    <Shortcut keys="ALT+С" />
                  </MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    navigate('/app-settings/preferences', { replace: true })
                  }}
                >
                  {t('User Preferences', { ns: 'settings' })}
                  <MenubarShortcut>
                    <Shortcut keys="ALT+U" />
                  </MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    navigate('/app-settings/security', { replace: true })
                  }}
                >
                  {t('Security', { ns: 'settings' })}
                </MenubarItem>
                <MenubarSeparator />
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
                    <MenubarSeparator />
                    <MenubarItem
                      onClick={() => {
                        navigate('/app-settings/history', { replace: true })
                      }}
                    >
                      <FileCog className="mr-2 h-4 w-4" />
                      {t('All History Settings', { ns: 'history' })} ...
                    </MenubarItem>
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
                  <MenubarSubContent className="w-[235px] dark:text-slate-300">
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
                  {t('Refresh Application UI', { ns: 'settings' })}
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
              {t('Lock App Screen', { ns: 'navbar' })}
              <MenubarShortcut className="ml-2">
                <Shortcut keys="CTRL+L" />
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={hideWindow}>
              {t('Close Main Window', { ns: 'navbar' })}
              <MenubarShortcut>
                <Shortcut keys="CTRL+W" />
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={closeWindow}>
              {t('Quit', { ns: 'common' })}
              <MenubarShortcut>
                <Shortcut keys="CTRL+Q" />
              </MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger
            className={`font-normal px-2.5 whitespace-nowrap ${
              isShowNavBarItems ? 'opacity-1' : 'opacity-0'
            }`}
            id="navbar-view_tour"
          >
            {t('View', { ns: 'navbar' })}
          </MenubarTrigger>
          <MenubarContent>
            {isSplitPanelView ? (
              <MenubarItem
                onClick={() => {
                  navigate('/history', { replace: true })
                }}
              >
                {t('Clip Boards', { ns: 'common' })}
                <MenubarShortcut>
                  <Shortcut keys="CTRL+B" />
                </MenubarShortcut>
              </MenubarItem>
            ) : (
              <MenubarItem
                onClick={() => {
                  navigate('/history', { replace: true })
                }}
              >
                {t('Clipboard History', { ns: 'common' })}
                <MenubarShortcut>
                  <Shortcut keys="CTRL+B" />
                </MenubarShortcut>
              </MenubarItem>
            )}
            <MenubarItem
              onClick={() => {
                navigate('/menu', { replace: true })
              }}
            >
              {t('Paste Menu', { ns: 'common' })}
              <MenubarShortcut>
                <Shortcut keys="CTRL+M" />
              </MenubarShortcut>
            </MenubarItem>

            <MenubarItem
              onClick={async () => {
                await toggleIsSplitPanelView()
              }}
            >
              {isSplitPanelView
                ? t('Close History Window', { ns: 'common' })
                : t('Split History Window', { ns: 'common' })}
              <MenubarShortcut className="ml-2">
                <Shortcut keys="CTRL+N" />
              </MenubarShortcut>
            </MenubarItem>

            <MenubarItem
              onClick={async () => {
                await toggleHistoryQuickPasteWindow()
              }}
            >
              {t('Quick Paste Window', { ns: 'quickpaste' })}
              <MenubarShortcut className="ml-2">
                <Shortcut keys="CTRL+P" />
              </MenubarShortcut>
            </MenubarItem>

            {playerSongs.length > 0 && (
              <>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>
                    {t('Audio Player', { ns: 'navbar' })} ...
                    <Badge variant="outline" className="ml-1.5 !font-normal">
                      {playerSongs.length}
                    </Badge>
                  </MenubarSubTrigger>
                  <MenubarSubContent className="w-[235px] dark:text-slate-300">
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
              </>
            )}

            <MenubarSeparator />

            <MenubarSub>
              <MenubarSubTrigger>{t('Options', { ns: 'navbar' })} ...</MenubarSubTrigger>
              <MenubarSubContent className="w-[235px] dark:text-slate-300">
                <MenubarCheckboxItem
                  checked={isSwapPanels}
                  onClick={() => {
                    setIsSwapPanels(!isSwapPanels)
                  }}
                >
                  {t('Swap Panels Layout', { ns: 'navbar' })}
                  <MenubarShortcut>
                    <Shortcut keys="CTRL+P" />
                  </MenubarShortcut>
                </MenubarCheckboxItem>

                <MenubarCheckboxItem
                  checked={isShowNavBarItemsOnHoverOnly}
                  onClick={() => {
                    setIsShowNavBarItemsOnHoverOnly(!isShowNavBarItemsOnHoverOnly)
                  }}
                >
                  {t('Show Navbar Items Hover', { ns: 'settings2' })}
                </MenubarCheckboxItem>

                <MenubarCheckboxItem
                  checked={isHideCollectionsOnNavBar}
                  onClick={() => {
                    setIsHideCollectionsOnNavBar(!isHideCollectionsOnNavBar)
                  }}
                >
                  {t('Hide Collections Navbar', { ns: 'settings2' })}
                </MenubarCheckboxItem>

                <MenubarCheckboxItem
                  checked={isShowCollectionNameOnNavBar}
                  onClick={() => {
                    setIsShowCollectionNameOnNavBar(!isShowCollectionNameOnNavBar)
                  }}
                >
                  {t('Show Collections Name', { ns: 'navbar' })}
                </MenubarCheckboxItem>

                <MenubarCheckboxItem
                  checked={isShowDisabledCollectionsOnNavBarMenu}
                  onClick={() => {
                    setIsShowDisabledCollectionsOnNavBarMenu(
                      !isShowDisabledCollectionsOnNavBarMenu
                    )
                  }}
                >
                  {t('Show Disabled Collections', { ns: 'settings' })}
                </MenubarCheckboxItem>

                <MenubarSeparator />
                <MenubarCheckboxItem
                  checked={isAutoStartEnabled}
                  onClick={async () => {
                    await invoke('autostart', { enabled: !isAutoStartEnabled })
                    setIsAutoStartEnabled(!isAutoStartEnabled)
                  }}
                >
                  {t('Enable Auto Start', { ns: 'settings' })}
                </MenubarCheckboxItem>
              </MenubarSubContent>
            </MenubarSub>

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
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>
                {t('Language', { ns: 'navbar' })} ...
                {/* {LANGUAGES.filter(({ code }) => code === i18n.language).map(
                  ({ flag }) => (
                    <span className="flags ml-2">{flag}</span>
                  )
                )} */}
              </MenubarSubTrigger>
              <MenubarSubContent>
                {LANGUAGES.map(
                  ({
                    code,
                    name,
                    flag,
                  }: {
                    code: string
                    name: string
                    flag: string
                  }) => (
                    <MenubarCheckboxItem
                      key={code}
                      checked={i18n.language === code}
                      className={`pr-6 ${i18n.language === code ? 'font-semibold' : ''}`}
                      onClick={() => {
                        i18n.changeLanguage(code)
                      }}
                    >
                      <span className="flags mr-3">{flag}</span> {name}
                    </MenubarCheckboxItem>
                  )
                )}
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>

        {collections.length > 0 && !isHideCollectionsOnNavBar && (
          <MenubarMenu>
            <MenubarTrigger
              className={`font-normal min-w-fit px-2.5 ${
                isShowNavBarItems ? 'opacity-1' : 'opacity-0'
              }`}
              id="navbar-collections_tour"
            >
              <Flex className="flex justify-start items-center whitespace-nowrap overflow-hidden">
                <LibrarySquare className="mr-1.5 text-slate-500" size={18} />
                <Box className="overflow-hidden text-ellipsis max-w-[16rem]">
                  {isShowCollectionNameOnNavBar
                    ? collections.find(
                        ({ collectionId }) => collectionId === currentCollectionId
                      )?.title ?? t('Collections', { ns: 'collections' })
                    : t('Collections', { ns: 'collections' })}
                </Box>
              </Flex>
            </MenubarTrigger>
            <MenubarContent forceMount>
              <MenubarItem inset disabled className="py-0.5">
                {t('Switch collections', { ns: 'collections' })}
              </MenubarItem>
              <MenubarSeparator />
              <SimpleBar
                className="code-filter"
                style={{
                  height: 'auto',
                  maxHeight: '400px',
                  width: '100%',
                  minWidth: '200px',
                }}
                autoHide={false}
              >
                <MenubarRadioGroup value={currentCollectionId ?? ''}>
                  {collections
                    .filter(
                      ({ isEnabled }) =>
                        isShowDisabledCollectionsOnNavBarMenu || isEnabled
                    )
                    .sort((a, b) => {
                      if (isShowDisabledCollectionsOnNavBarMenu) {
                        if (a.isEnabled && !b.isEnabled) {
                          return -1
                        }
                        if (!a.isEnabled && b.isEnabled) {
                          return 1
                        }
                      }
                      return a.createdAt - b.createdAt
                    })
                    .map(({ collectionId, isEnabled, isSelected, title }) => (
                      <MenubarRadioItem
                        key={collectionId}
                        value={collectionId}
                        disabled={!isEnabled}
                        onClick={() => {
                          selectCollectionById({
                            selectCollection: {
                              collectionId,
                            },
                          })
                        }}
                      >
                        <span className={isSelected ? 'font-semibold' : ''}>{title}</span>
                      </MenubarRadioItem>
                    ))}
                </MenubarRadioGroup>
              </SimpleBar>
              <MenubarSeparator />
              <MenubarItem
                onClick={() => {
                  navigate('/app-settings/collections', { replace: true })
                }}
              >
                <Settings className="mr-2" size={14} />
                {t('Manage Collections', { ns: 'collections' })}
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  navigate('/app-settings/collections/new', { replace: true })
                }}
              >
                <Plus className="mr-2" size={15} />
                {t('Add Collection', { ns: 'collections' })}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        )}

        <div
          data-tauri-drag-region
          className={`inline-flex h-full w-full items-center justify-center ${
            isShowNavBarItems ? 'opacity-1' : 'opacity-0'
          }`}
        >
          {!isSplitPanelView ? (
            <Button
              onClick={() => {
                toggleIsSplitPanelView()
              }}
              id="navbar-toggle-history-split"
              title={t('Split History Window', { ns: 'common' })}
              variant="ghost"
              className="relative h-7 focus:outline-none px-2 mr-0 ml-2 !bg-slate-50 text-slate-400 dark:!bg-slate-900 dark:hover:!bg-slate-800 hover:text-slate-600 dark:text-slate-400"
            >
              <TabletSmartphone size={19} className="stroke-[1.8px]" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                toggleIsSplitPanelView()
              }}
              id="navbar-toggle-history-split"
              title={t('Close History Window', { ns: 'common' })}
              variant="ghost"
              className="relative h-7 focus:outline-none px-2 mr-0 ml-2 !bg-slate-50 text-slate-400 dark:!bg-slate-900 dark:hover:!bg-slate-800 hover:text-slate-600 dark:text-slate-400"
            >
              <Columns2 size={19} className="stroke-[1.8px]" />
            </Button>
          )}
          <GlobalSearch isDark={isDark} />
          {!isShowPinned ? (
            <Button
              onClick={() => {
                setIsShowPinned(true)
              }}
              id="navbar-pinned_tour"
              title={t('Show Pinned', { ns: 'pinned' })}
              variant="ghost"
              className="relative h-7 focus:outline-none px-2 mx-2 !bg-slate-50 text-slate-400 dark:!bg-slate-900 dark:hover:!bg-slate-800 hover:text-slate-600 dark:text-slate-400"
            >
              <Icons.pin size={18} />
              {pinnedClips.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-orange-100 dark:bg-orange-900/80 dark:border-orange-950 border absolute border-orange-50 cursor-pointer px-1.5 left-[30px] top"
                >
                  <Text className="font-mono !text-orange-400 font-semibold">
                    {pinnedClips.length}
                  </Text>
                </Badge>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsShowPinned(false)
              }}
              id="navbar-pinned_tour"
              title={t('Hide Pinned', { ns: 'pinned' })}
              variant="ghost"
              className="relative h-7 focus:outline-none px-2 mx-2 !bg-slate-50 text-slate-400 dark:!bg-slate-900 dark:hover:!bg-slate-800 hover:text-slate-600 dark:text-slate-400"
            >
              <Icons.pinoff size={18} />
            </Button>
          )}
        </div>

        <div data-tauri-drag-region className="inline-flex h-full justify-end">
          {showUpdateAvailable.value ? (
            <MenubarMenu>
              <MenubarTrigger
                id="updater-trigger"
                onClick={() => {
                  if (showUpdateErrorPermissionDenied.value) {
                    showUpdateErrorPermissionDenied.value = false
                  }
                }}
                className={`
                  ${isShowNavBarItems ? 'opacity-100' : 'opacity-0'}
                  ${
                    showUpdateError.value
                      ? 'bg-red-100/70 dark:bg-red-900/70'
                      : showRestartAfterUpdate.value
                        ? 'bg-amber-100/70 dark:bg-amber-900/70'
                        : 'bg-teal-100/70 dark:bg-teal-900/70'
                  }
                `}
              >
                <ToolTip
                  text={t('Version {{newVersion}} is available', {
                    ns: 'updater',
                    newVersion: availableVersionNumber.value,
                  })}
                  sideOffset={16}
                  side="left"
                >
                  <Flex className="flex justify-start items-center whitespace-nowrap overflow-hidden">
                    <Box className="overflow-hidden text-ellipsis max-w-[16rem] mr-2 text-[13px]">
                      {showUpdateError.value ? (
                        <Text>{t('Update Install Error', { ns: 'updater' })}</Text>
                      ) : showRestartAfterUpdate.value ? (
                        <Text>{t('Restart to Finish', { ns: 'updater' })}</Text>
                      ) : showUpdateInstalling.value ? (
                        <Text>{t('Installing Update', { ns: 'updater' })}</Text>
                      ) : (
                        <Text>{t('Update Available', { ns: 'updater' })}</Text>
                      )}
                    </Box>
                    {showUpdateInstalling.value ? (
                      <RefreshCw className="animate-spin opacity-75 ml-auto" size="14" />
                    ) : (
                      <Download size={15} />
                    )}
                  </Flex>
                </ToolTip>
              </MenubarTrigger>
              <MenubarContent
                className={`${
                  showUpdateInstalling.value || showUpdateErrorPermissionDenied.value
                    ? 'hidden'
                    : ''
                }`}
              >
                {!showUpdateInstalling.value ? (
                  <MenubarItem
                    className="!font-semibold"
                    onClick={e => {
                      e.preventDefault()
                      if (showRestartAfterUpdate.value) {
                        relaunchApp()
                      } else {
                        showUpdateError.value = false
                        showUpdateInstalling.value = false
                        checkForUpdate(true)
                        installUpdate()
                      }
                    }}
                  >
                    {!showRestartAfterUpdate.value
                      ? showUpdateError.value
                        ? t('Try Install Again', { ns: 'updater' })
                        : t('Install Update', { ns: 'updater' })
                      : t('Restart to Update', { ns: 'updater' })}
                    <MenubarShortcut className="ml-auto pl-2">
                      v{availableVersionNumber.value}
                    </MenubarShortcut>
                  </MenubarItem>
                ) : (
                  <MenubarItem
                    className="!font-semibold"
                    onClick={e => {
                      e.preventDefault()
                      if (showUpdateInstalling.value) {
                        showUpdateInstalling.value = false
                        showUpdateError.value = false
                        return
                      }
                      installUpdate()
                    }}
                  >
                    <Box className="mr-1">{t('Downloading...', { ns: 'updater' })}</Box>
                    <Download className="ml-auto" size="14" />
                  </MenubarItem>
                )}

                <MenubarSeparator />
                {availableVersionBody.value && (
                  <MenubarSub>
                    <MenubarSubTrigger>
                      {t('View Changes', { ns: 'updater' })} ...
                    </MenubarSubTrigger>
                    <MenubarSubContent className="max-w-[480px] dark:text-slate-300">
                      {availableVersionNumber.value && (
                        <MenubarItem disabled className="!opacity-60">
                          <Box>
                            <Box className="text-sm">
                              {availableVersionDate.value &&
                                t('Release date {{date}}', {
                                  ns: 'updater',
                                  date: availableVersionDate.value,
                                })}
                            </Box>
                          </Box>
                        </MenubarItem>
                      )}
                      <MenubarSeparator />

                      <div className="px-3 py-2">
                        <OverlayScrollbarsComponent
                          options={{
                            scrollbars: {
                              theme: isDark ? 'os-theme-light' : 'os-theme-dark',
                              autoHide: 'move',
                            },
                          }}
                          style={{
                            maxHeight: 400,
                            maxWidth: '100%',
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: availableVersionBody.value,
                            }}
                            className="note-content release-notes"
                          />
                        </OverlayScrollbarsComponent>
                      </div>
                    </MenubarSubContent>
                  </MenubarSub>
                )}

                <MenubarItem
                  onClick={() => {
                    setUpdaterRemindLater()
                  }}
                >
                  {t('Remind Me Later', { ns: 'updater' })}
                  <MenubarShortcut className="ml-auto pl-2">
                    <BellRing size={14} />
                  </MenubarShortcut>
                </MenubarItem>
                <>
                  <MenubarSeparator />
                  <MenubarItem
                    onClick={() => {
                      setUpdaterSkipVersion(availableVersionNumber.value)
                    }}
                  >
                    {t('Skip This Version', { ns: 'updater' })}
                    <MenubarShortcut className="ml-auto pl-2">
                      <BellOff size={14} />
                    </MenubarShortcut>
                  </MenubarItem>
                </>
              </MenubarContent>
            </MenubarMenu>
          ) : (
            <>
              {playerSongs.length > 0 && (
                <PlayerMenu isShowNavBarItems={isShowNavBarItems} />
              )}
              <MenubarMenu>
                <MenubarTrigger
                  className={`font-normal px-2.5 whitespace-nowrap ${
                    isShowNavBarItems ? 'opacity-1' : 'opacity-0'
                  }`}
                  id="navbar-help_tour"
                >
                  {t('Help', { ns: 'help' })}
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarSub>
                    <MenubarSubTrigger>
                      {t('App Guided Tours', { ns: 'help' })}
                    </MenubarSubTrigger>
                    <MenubarSubContent className="dark:text-slate-300">
                      <MenubarItem
                        onClick={() => {
                          openOnBoardingTourName.value = APP_TOURS.historyPanelTour
                        }}
                      >
                        {t('Clipboard History Tour', { ns: 'help' })}
                        {appToursCompletedList.includes(APP_TOURS.historyPanelTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour completed', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-green-50 border-green-200 text-green-600 dark:bg-green-900 dark:border-green-800 dark:text-green-200"
                          >
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : appToursSkippedList.includes(APP_TOURS.historyPanelTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour skipped', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-yellow-50 border-yellow-400 text-yellow-600 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200"
                          >
                            <X className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1.5 !font-normal">
                            6
                          </Badge>
                        )}
                      </MenubarItem>
                      <MenubarItem
                        onClick={() => {
                          openOnBoardingTourName.value = APP_TOURS.dashboardClipsTour
                        }}
                      >
                        {t('Boards and Clips Tour', { ns: 'help' })}
                        {appToursCompletedList.includes(APP_TOURS.dashboardClipsTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour completed', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-green-50 border-green-200 text-green-600 dark:bg-green-900 dark:border-green-800 dark:text-green-200"
                          >
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : appToursSkippedList.includes(APP_TOURS.dashboardClipsTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour skipped', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-yellow-50 border-yellow-400 text-yellow-600 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200"
                          >
                            <X className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1.5 !font-normal">
                            8
                          </Badge>
                        )}
                      </MenubarItem>
                      <MenubarItem
                        onClick={() => {
                          openOnBoardingTourName.value = APP_TOURS.menuTour
                        }}
                      >
                        {t('Paste Menu Tour', { ns: 'help' })}
                        {appToursCompletedList.includes(APP_TOURS.menuTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour completed', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-green-50 border-green-200 text-green-600 dark:bg-green-900 dark:border-green-800 dark:text-green-200"
                          >
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : appToursSkippedList.includes(APP_TOURS.menuTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour skipped', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-yellow-50 border-yellow-400 text-yellow-600 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200"
                          >
                            <X className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1.5 !font-normal">
                            10
                          </Badge>
                        )}
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem
                        onClick={() => {
                          openOnBoardingTourName.value = APP_TOURS.navBarTour
                        }}
                      >
                        {t('Navigation Bar Tour', { ns: 'help' })}
                        {appToursCompletedList.includes(APP_TOURS.navBarTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour completed', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-green-50 border-green-200 text-green-600 dark:bg-green-900 dark:border-green-800 dark:text-green-200"
                          >
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : appToursSkippedList.includes(APP_TOURS.navBarTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour skipped', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-yellow-50 border-yellow-400 text-yellow-600 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200"
                          >
                            <X className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1.5 !font-normal">
                            9
                          </Badge>
                        )}
                      </MenubarItem>
                      <MenubarItem
                        onClick={() => {
                          openOnBoardingTourName.value = APP_TOURS.settingsTour
                        }}
                      >
                        {t('PasteBar Settings Tour', { ns: 'help' })}
                        {appToursCompletedList.includes(APP_TOURS.settingsTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour completed', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-green-50 border-green-200 text-green-600 dark:bg-green-900 dark:border-green-800 dark:text-green-200"
                          >
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : appToursSkippedList.includes(APP_TOURS.settingsTour) ? (
                          <Badge
                            variant="outline"
                            title={t('Tour skipped', { ns: 'help' })}
                            className="ml-1.5 !font-normal bg-yellow-50 border-yellow-400 text-yellow-600 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200"
                          >
                            <X className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1.5 !font-normal">
                            6
                          </Badge>
                        )}
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarSub>
                        <MenubarSubTrigger>
                          {t('Guided Tours Options', { ns: 'help' })}
                        </MenubarSubTrigger>
                        <MenubarSubContent className="dark:text-slate-300">
                          <MenubarItem
                            onClick={() => {
                              const tours = Object.values(APP_TOURS)
                              setAppToursCompletedList([...tours])
                            }}
                          >
                            {t('Mark All Completed', { ns: 'help' })}
                          </MenubarItem>
                          <MenubarItem
                            onClick={() => {
                              setAppToursCompletedList([])
                              setAppToursSkippedList([])
                            }}
                          >
                            {t('Reset All Tours', { ns: 'help' })}
                          </MenubarItem>
                        </MenubarSubContent>
                      </MenubarSub>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>
                      {t('Feature Highlights', { ns: 'help' })}
                    </MenubarSubTrigger>
                    <MenubarSubContent className="dark:text-slate-300">
                      <MenubarSub>
                        <MenubarSubTrigger>
                          {t('Clipboard History', { ns: 'help' })}
                        </MenubarSubTrigger>
                        <MenubarSubContent className="dark:text-slate-300">
                          {(
                            t(APP_TOURS.historyPanelTour, {
                              returnObjects: true,
                              defaultValue: [],
                              lng: 'en',
                              ns: 'tours',
                            }) as TranslatedBoardingSteps[]
                          ).map((step, index) => (
                            <MenubarItem
                              key={index}
                              onClick={() => {
                                openOnBoardingTourName.value = APP_TOURS.historyPanelTour
                                onBoardingTourSingleElements.value = step.element
                              }}
                            >
                              {t(step.popover.title, { ns: 'help' })}
                            </MenubarItem>
                          ))}
                        </MenubarSubContent>
                      </MenubarSub>
                      <MenubarSub>
                        <MenubarSubTrigger>
                          {t('Boards and Clips', { ns: 'help' })}
                        </MenubarSubTrigger>
                        <MenubarSubContent className="dark:text-slate-300">
                          {(
                            t(APP_TOURS.dashboardClipsTour, {
                              returnObjects: true,
                              defaultValue: [],
                              ns: 'tours',
                              lng: 'en',
                            }) as TranslatedBoardingSteps[]
                          ).map((step, index) => (
                            <MenubarItem
                              key={index}
                              onClick={() => {
                                openOnBoardingTourName.value =
                                  APP_TOURS.dashboardClipsTour
                                onBoardingTourSingleElements.value = step.element
                              }}
                            >
                              {t(step.popover.title, { ns: 'help' })}
                            </MenubarItem>
                          ))}
                        </MenubarSubContent>
                      </MenubarSub>
                      <MenubarSub>
                        <MenubarSubTrigger>
                          {t('Paste Menu', { ns: 'help' })}
                        </MenubarSubTrigger>
                        <MenubarSubContent className="dark:text-slate-300">
                          {(
                            t(APP_TOURS.menuTour, {
                              returnObjects: true,
                              defaultValue: [],
                              ns: 'tours',
                              lng: 'en',
                            }) as TranslatedBoardingSteps[]
                          ).map((step, index) => (
                            <MenubarItem
                              key={index}
                              onClick={() => {
                                openOnBoardingTourName.value = APP_TOURS.menuTour
                                onBoardingTourSingleElements.value = step.element
                              }}
                            >
                              {t(step.popover.title, { ns: 'help' })}
                            </MenubarItem>
                          ))}
                        </MenubarSubContent>
                      </MenubarSub>
                      <MenubarSeparator />
                      <MenubarSub>
                        <MenubarSubTrigger>
                          {t('Navigation Bar', { ns: 'help' })}
                        </MenubarSubTrigger>
                        <MenubarSubContent className="dark:text-slate-300">
                          {(
                            t(APP_TOURS.navBarTour, {
                              returnObjects: true,
                              defaultValue: [],
                              ns: 'tours',
                              lng: 'en',
                            }) as TranslatedBoardingSteps[]
                          ).map((step, index) => (
                            <MenubarItem
                              key={index}
                              onClick={() => {
                                openOnBoardingTourName.value = APP_TOURS.navBarTour
                                onBoardingTourSingleElements.value = step.element
                              }}
                            >
                              {t(step.popover.title, { ns: 'help' })}
                            </MenubarItem>
                          ))}
                        </MenubarSubContent>
                      </MenubarSub>
                      <MenubarSub>
                        <MenubarSubTrigger>
                          {t('PasteBar Settings', { ns: 'help' })}
                        </MenubarSubTrigger>
                        <MenubarSubContent className="dark:text-slate-300">
                          {(
                            t(APP_TOURS.settingsTour, {
                              returnObjects: true,
                              defaultValue: [],
                              lng: 'en',
                              ns: 'tours',
                            }) as TranslatedBoardingSteps[]
                          ).map((step, index) => (
                            <MenubarItem
                              key={index}
                              onClick={() => {
                                openOnBoardingTourName.value = APP_TOURS.settingsTour
                                onBoardingTourSingleElements.value = step.element
                              }}
                            >
                              {t(step.popover.title, { ns: 'help' })}
                            </MenubarItem>
                          ))}
                        </MenubarSubContent>
                      </MenubarSub>
                    </MenubarSubContent>
                    <MenubarSeparator />
                    {!showUpdateAvailable.value ? (
                      <MenubarItem
                        onClick={e => {
                          e.preventDefault()
                          checkForUpdate(true)
                        }}
                      >
                        {showUpdateAppIsLatest.value
                          ? t('No Update Available', { ns: 'updater' })
                          : showUpdateChecking.value
                            ? t('Checking for Update...', { ns: 'updater' })
                            : t('Check for Update', { ns: 'updater' })}
                      </MenubarItem>
                    ) : !showUpdateInstalling.value ? (
                      <MenubarItem
                        className="!font-semibold"
                        onClick={e => {
                          e.preventDefault()
                          if (showRestartAfterUpdate.value) {
                            relaunchApp()
                          } else {
                            showUpdateError.value = false
                            showUpdateInstalling.value = false
                            checkForUpdate(true)
                            installUpdate()
                          }
                        }}
                      >
                        {showUpdateError.value ? (
                          <Text>{t('Try Install Again', { ns: 'updater' })}</Text>
                        ) : showRestartAfterUpdate.value ? (
                          t('Restart', { ns: 'updater' })
                        ) : (
                          t('Install Update', { ns: 'updater' })
                        )}
                        <MenubarShortcut className="ml-auto pl-2">
                          v{availableVersionNumber.value}
                        </MenubarShortcut>
                      </MenubarItem>
                    ) : (
                      <MenubarItem
                        className="!font-semibold"
                        onClick={e => {
                          e.preventDefault()
                          installUpdate()
                        }}
                      >
                        <Box className="mr-2">
                          {t('Installing Update', { ns: 'updater' })}
                        </Box>
                        <RefreshCw
                          className="animate-spin opacity-75 ml-auto"
                          size="14"
                        />
                      </MenubarItem>
                    )}

                    <MenubarSeparator />
                    <MenubarSub>
                      <MenubarSubTrigger>
                        {t('Support and Feedback', { ns: 'help' })}
                      </MenubarSubTrigger>
                      <MenubarSubContent className="dark:text-slate-300">
                        <MenubarItem
                          onClick={() => {
                            openContactUsFormModal.value = true
                          }}
                        >
                          {t('Contact Us Form', { ns: 'help' })}
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem disabled className="pb-0">
                          <Text className="text-sm mb-2 flex justify-center items-center w-full">
                            {t('Stay in touch', { ns: 'common' })}
                            <ExternalLink className="w-[13px] h-[13px] ml-1" />
                          </Text>
                        </MenubarItem>
                        <MenubarItem>
                          <SocialContacts
                            className="!gap-2 grid grid-cols-4 items-center justify-center w-full"
                            showContactForm={false}
                          />
                        </MenubarItem>
                      </MenubarSubContent>
                    </MenubarSub>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </>
          )}

          <Button
            onClick={minimizeWindow}
            title={t('Window:::Minimize Window', { ns: 'navbar' })}
            variant="ghost"
            className={`h-8 focus:outline-none ${
              isShowNavBarItems ? 'opacity-1' : 'opacity-0'
            }`}
          >
            <Icons.minimize className="h-3 w-3" />
          </Button>
          <Button
            onClick={maximizeWindow}
            title={t('Window:::Maximize Window', { ns: 'navbar' })}
            variant="ghost"
            className={`h-8 focus:outline-none ${
              isShowNavBarItems ? 'opacity-1' : 'opacity-0'
            }`}
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            onClick={hideWindow}
            id="navbar-close-window_tour"
            variant="ghost"
            className="h-8 focus:outline-none"
            title={t('Window:::Close Window', { ns: 'navbar' })}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Menubar>
    </div>
  )
}
