import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import i18n from '~/locales'
import { LANGUAGES } from '~/locales/languges'
import {
  fontSizeIncrements,
  settingsStoreAtom,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import Spacer from '~/components/atoms/spacer'
import { Icons } from '~/components/icons'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Flex,
  Switch,
  Text,
  TextNormal,
} from '~/components/ui'

export default function UserPreferences() {
  const { t } = useTranslation()
  const {
    isSkipAutoStartPrompt,
    setIsSkipAutoStartPrompt,
    isShowCollectionNameOnNavBar,
    setIsShowCollectionNameOnNavBar,
    isShowDisabledCollectionsOnNavBarMenu,
    setIsShowDisabledCollectionsOnNavBarMenu,
  } = useAtomValue(settingsStoreAtom)

  const { setFontSize, fontSize, setIsSwapPanels, isSwapPanels } =
    useAtomValue(uiStoreAtom)

  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false)

  const { setTheme, theme } = useTheme()
  const { mode, setMode } = useAtomValue(themeStoreAtom)

  useEffect(() => {
    if (theme !== mode) {
      setMode(theme)
    }
  }, [theme])

  useEffect(() => {
    invoke('is_autostart_enabled').then(isEnabled => {
      setIsAutoStartEnabled(Boolean(isEnabled))
    })
  }, [])

  const { returnRoute } = useAtomValue(uiStoreAtom)

  return (
    <AutoSize disableWidth>
      {({ height }) => {
        return (
          height && (
            <Box className="p-4 py-6 select-none min-w-[320px]">
              <Box className="text-xl my-2 mx-2 flex items-center justify-between">
                <Text className="light">{t('User Preferences', { ns: 'settings' })}</Text>
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
              </Box>
              <Spacer h={3} />
              <Box className="animate-in fade-in max-w-xl">
                <Card
                  className={`${
                    !isAutoStartEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="animate-in fade-in text-md font-medium border-red-300 border-1 w-full">
                      {t('Application Auto Start', { ns: 'settings' })}
                    </CardTitle>
                    <Switch
                      checked={isAutoStartEnabled}
                      className="ml-auto"
                      onCheckedChange={async () => {
                        await invoke('autostart', { enabled: !isAutoStartEnabled })
                        setIsAutoStartEnabled(!isAutoStartEnabled)
                      }}
                    />
                  </CardHeader>
                  <CardContent>
                    <Text className="text-sm text-muted-foreground">
                      {t('Enable application auto start on system boot', {
                        ns: 'settings',
                      })}
                    </Text>

                    {!isAutoStartEnabled && (
                      <Flex className="items-center justify-start mt-2 ml-[-12px]">
                        <Checkbox
                          color="default"
                          checked={isSkipAutoStartPrompt}
                          classNameLabel="py-1"
                          onChange={() => {
                            setIsSkipAutoStartPrompt(!isSkipAutoStartPrompt)
                          }}
                        >
                          <TextNormal size="sm">
                            {t('Skip auto start prompt on app launch', {
                              ns: 'settings',
                            })}
                          </TextNormal>
                        </Checkbox>
                      </Flex>
                    )}
                  </CardContent>
                </Card>
              </Box>

              <Box className="animate-in fade-in max-w-xl mt-4">
                <Card>
                  <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                    <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                      {t('Application UI Fonts Scale', { ns: 'settings' })}
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t('Change the application user interface font size scale', {
                          ns: 'settings',
                        })}
                      </Text>
                    </CardTitle>
                    <Flex className="gap-3 flex-wrap items-start justify-start">
                      {fontSizeIncrements.map((size, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          onClick={() => {
                            setFontSize(size)
                          }}
                          className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                            fontSize === size
                              ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                              : ''
                          } dark:text-slate-200 px-2 !py-0.5`}
                        >
                          {size}
                        </Button>
                      ))}
                    </Flex>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={fontSize === '100%'}
                      onClick={() => {
                        setFontSize('100%')
                      }}
                      className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                    >
                      {t('Reset', { ns: 'common' })}
                    </Button>
                  </CardContent>
                </Card>
              </Box>

              <Box className="animate-in fade-in max-w-xl mt-4">
                <Card>
                  <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1 mb-4">
                    <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                      {t('Application UI Color Theme', { ns: 'settings' })}
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t('Change the application user interface color theme', {
                          ns: 'settings',
                        })}
                      </Text>
                    </CardTitle>
                    <Flex className="gap-3 flex-wrap items-start justify-start">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setTheme('light')
                        }}
                        className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                          theme === 'light'
                            ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                            : ''
                        } dark:text-slate-200 px-3 !py-0.5`}
                      >
                        <span className="flex tems-end">
                          <Icons.sun className="mr-2" size={18} />
                        </span>
                        <span>{t('Theme:::Light', { ns: 'navbar' })}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setTheme('dark')
                        }}
                        className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                          theme === 'dark'
                            ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                            : ''
                        } dark:text-slate-200 px-3 !py-0.5`}
                      >
                        <span className="flex tems-end">
                          <Icons.moon className="mr-2" size={17} />
                        </span>
                        <span>{t('Theme:::Dark', { ns: 'navbar' })}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setTheme('system')
                        }}
                        className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                          theme === 'system'
                            ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                            : ''
                        } dark:text-slate-200 px-3 !py-0.5`}
                      >
                        <span className="tems-end flex w-[1.5rem] ">
                          <Icons.sunmoon className="mr-2" width={14} height={14} />
                        </span>
                        <span>{t('Theme:::System', { ns: 'navbar' })}</span>
                      </Button>
                    </Flex>
                  </CardHeader>
                </Card>
              </Box>

              <Box className="animate-in fade-in max-w-xl mt-4">
                <Card>
                  <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1 mb-4">
                    <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                      {t('Application UI Language', { ns: 'settings' })}
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t('Change the application user interface language', {
                          ns: 'settings',
                        })}
                      </Text>
                    </CardTitle>
                    <Flex className="gap-3 flex-wrap items-start justify-start">
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
                          <Button
                            key={code}
                            variant="ghost"
                            onClick={() => {
                              i18n.changeLanguage(code)
                            }}
                            className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                              i18n.language === code
                                ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                : ''
                            } dark:text-slate-200 px-3 !py-0.5`}
                          >
                            <span className="flags mr-3">{flag}</span> {name}
                          </Button>
                        )
                      )}
                    </Flex>
                  </CardHeader>
                </Card>
              </Box>

              <Box className="animate-in fade-in max-w-xl mt-4">
                <Card
                  className={`${
                    !isSwapPanels && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="animate-in fade-in text-md font-medium border-red-300 border-1 w-full">
                      {t('Swap Panels Layout', { ns: 'common' })}
                    </CardTitle>
                    <Switch
                      checked={isSwapPanels}
                      className="ml-auto"
                      onCheckedChange={async () => {
                        setIsSwapPanels(!isSwapPanels)
                      }}
                    />
                  </CardHeader>
                  <CardContent>
                    <Text className="text-sm text-muted-foreground">
                      {t(
                        'Switch the layout position of panels in Clipboard History and Paste Menu views',
                        { ns: 'settings' }
                      )}
                    </Text>
                  </CardContent>
                </Card>
              </Box>

              <Box className="animate-in fade-in max-w-xl mt-4">
                <Card
                  className={`${
                    !isShowCollectionNameOnNavBar &&
                    'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="animate-in fade-in text-md font-medium border-red-300 border-1 w-full">
                      {t('Show collection name on the navbar', { ns: 'settings' })}
                    </CardTitle>
                    <Switch
                      checked={isShowCollectionNameOnNavBar}
                      className="ml-auto"
                      onCheckedChange={() => {
                        setIsShowCollectionNameOnNavBar(!isShowCollectionNameOnNavBar)
                      }}
                    />
                  </CardHeader>
                  <CardContent>
                    <Text className="text-sm text-muted-foreground">
                      {t(
                        'Display full name of selected collection on the navigation bar',
                        { ns: 'settings' }
                      )}
                    </Text>
                  </CardContent>
                </Card>
              </Box>

              <Box className="animate-in fade-in max-w-xl mt-4">
                <Card
                  className={`${
                    !isShowDisabledCollectionsOnNavBarMenu &&
                    'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="animate-in fade-in text-md font-medium border-red-300 border-1 w-full">
                      {t('Show disabled collections on the navbar list', {
                        ns: 'settings',
                      })}
                    </CardTitle>
                    <Switch
                      checked={isShowDisabledCollectionsOnNavBarMenu}
                      className="ml-auto"
                      onCheckedChange={() => {
                        setIsShowDisabledCollectionsOnNavBarMenu(
                          !isShowDisabledCollectionsOnNavBarMenu
                        )
                      }}
                    />
                  </CardHeader>
                  <CardContent>
                    <Text className="text-sm text-muted-foreground">
                      {t(
                        'Display disabled collections name on the navigation bar under collections menu',
                        { ns: 'settings' }
                      )}
                    </Text>
                  </CardContent>
                </Card>
              </Box>

              <Spacer h={6} />
              <Link to={returnRoute} replace>
                <Button
                  variant="ghost"
                  className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                  size="sm"
                >
                  {t('Back', { ns: 'common' })}
                </Button>
              </Link>
              <Spacer h={4} />
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
