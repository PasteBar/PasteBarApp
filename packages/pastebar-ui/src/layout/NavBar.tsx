import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import { appWindow } from '@tauri-apps/api/window'
import { LANGUAGES } from '~/locales/languges'
import {
  collectionsStoreAtom,
  settingsStoreAtom,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { FileCog, LibrarySquare, Maximize, Minus, Plus, Settings, X } from 'lucide-react'
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
import { Icons } from '~/components/icons'
import { ThemeModeToggle } from '~/components/theme-mode-toggle'
import { Badge, Box, Button, Flex, Shortcut, Text } from '~/components/ui'

import { useSelectCollectionById } from '~/hooks/queries/use-collections'

import Logo from './Logo'

export function NavBar() {
  const { t, i18n } = useTranslation()
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false)
  const navigate = useNavigate()

  const { systemTheme } = useTheme()
  const { setSystemTheme, themeDark } = useAtomValue(themeStoreAtom)

  const { currentCollectionId, collections } = useAtomValue(collectionsStoreAtom)
  const isDark = themeDark()

  useEffect(() => {
    invoke('is_autostart_enabled').then(isEnabled => {
      setIsAutoStartEnabled(Boolean(isEnabled))
    })
  }, [])

  useEffect(() => {
    if (systemTheme) {
      invoke('set_icon', { name: 'main', isDark: systemTheme === 'dark' })
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
  const hideWindow = () => appWindow.hide()
  const closeWindow = () => appWindow.close()

  const {
    isShowCollectionNameOnNavBar,
    isShowDisabledCollectionsOnNavBarMenu,
    setIsShowCollectionNameOnNavBar,
    copyPasteDelay,
    setCopyPasteDelay,
    setIsHistoryEnabled,
    isHistoryEnabled,
    setIsHistoryAutoUpdateOnCaputureEnabled,
    isHistoryAutoUpdateOnCaputureEnabled,
    setIsShowDisabledCollectionsOnNavBarMenu,
  } = useAtomValue(settingsStoreAtom)

  const {
    fontSize,
    decreaseFontSize,
    increaseFontSize,
    resetFontSize,
    setIsSwapPanels,
    isShowPinned,
    setIsShowPinned,
    isSwapPanels,
  } = useAtomValue(uiStoreAtom)

  useHotkeys(['alt+b'], () => {
    navigate('/history', { replace: true })
  })

  useHotkeys(['alt+m'], () => {
    navigate('/menu', { replace: true })
  })

  useHotkeys(['alt+p'], () => {
    setIsSwapPanels(!isSwapPanels)
  })

  return (
    <div data-tauri-drag-region className="h-[41px] absolute top-0 left-0 w-full">
      <Menubar className="border-0 !h-full border-b border-slate-200/50 dark:border-slate-500/50 rounded-b-none bg-gray-50 pl-3 hover:bg-white dark:hover:bg-gray-950 active:cursor-move active:bg-white transform duration-300 dark:bg-gray-900 dark:text-slate-300">
        <MenubarMenu>
          <div className="inline-flex h-fit w-fit items-center text-cyan-500">
            <Logo width={28} height={28} data-tauri-drag-region />
          </div>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="md m-0 px-2.5 text-sm font-semibold whitespace-nowrap">
            <Text className="font-semibold">{t('PasteBar', { ns: 'common' })}</Text>
          </MenubarTrigger>
          <MenubarContent className="w-[200px]">
            <MenubarItem>{t('About PasteBar', { ns: 'common' })}</MenubarItem>

            <MenubarItem
              onClick={() => {
                navigate('/app-settings/license', { replace: true })
              }}
            >
              {t('Check for Updates', { ns: 'common' })}
            </MenubarItem>
            <MenubarSeparator />
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
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    navigate('/app-settings/security', { replace: true })
                  }}
                >
                  {t('Security', { ns: 'settings' })}
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    navigate('/app-settings/license', { replace: true })
                  }}
                >
                  {t('License', { ns: 'settings' })}
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
                        <Shortcut keys="ALT+H" />
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
                        <Shortcut keys="ALT+A" />
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
            <MenubarItem onClick={hideWindow}>
              {t('Close Main Window', { ns: 'navbar' })}
              <MenubarShortcut>⌘W</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={closeWindow}>
              {t('Quit', { ns: 'common' })}
              <MenubarShortcut>⌘Q</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-normal px-2.5">
            {t('View', { ns: 'navbar' })}
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                navigate('/history', { replace: true })
              }}
            >
              {t('Clipboard History', { ns: 'common' })}
              <MenubarShortcut>⌘B</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                navigate('/menu', { replace: true })
              }}
            >
              {t('Paste Menu', { ns: 'common' })}
              <MenubarShortcut>⌘M</MenubarShortcut>
            </MenubarItem>
            <MenubarShortcut />
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
                  <MenubarShortcut>⌘P</MenubarShortcut>
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

        {collections.length > 0 && (
          <MenubarMenu>
            <MenubarTrigger className="font-normal min-w-fit px-2.5">
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
              <MenubarItem
                onClick={() => {
                  navigate('/app-settings/collections', { replace: true })
                }}
              >
                <Settings className="mr-2" size={14} />
                {t('Manage Collections', { ns: 'collections' })}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        )}

        <div
          data-tauri-drag-region
          className="inline-flex h-full w-full items-center justify-center"
        >
          {!isShowPinned ? (
            <Button
              onClick={() => {
                setIsShowPinned(true)
              }}
              title={t('Show Pinned', { ns: 'pinned' })}
              variant="ghost"
              className="relative h-7 focus:outline-none px-2 mx-2 !bg-slate-50 text-slate-400 dark:!bg-slate-900 dark:hover:!bg-slate-800 hover:text-slate-600 dark:text-slate-400"
            >
              <Icons.pin className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsShowPinned(false)
              }}
              title={t('Hide Pinned', { ns: 'pinned' })}
              variant="ghost"
              className="relative h-7 focus:outline-none px-2 mx-2 !bg-slate-50 text-slate-400 dark:!bg-slate-900 dark:hover:!bg-slate-800 hover:text-slate-600 dark:text-slate-400"
            >
              <Icons.pinoff className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div data-tauri-drag-region className="inline-flex h-full justify-end">
          <Button
            onClick={minimizeWindow}
            title={t('Window:::Minimize Window', { ns: 'navbar' })}
            variant="ghost"
            className="h-8 focus:outline-none"
          >
            <Icons.minimize className="h-3 w-3" />
          </Button>
          <Button
            onClick={maximizeWindow}
            title={t('Window:::Maximize Window', { ns: 'navbar' })}
            variant="ghost"
            className="h-8 focus:outline-none"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            onClick={hideWindow}
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
