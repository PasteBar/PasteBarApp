import { useEffect, useState } from 'react'
import { dialog, invoke } from '@tauri-apps/api'
import { join } from '@tauri-apps/api/path'
import i18n from '~/locales'
import { LANGUAGES } from '~/locales/languges'
import {
  clipNotesDelays,
  clipNotesSizes,
  fontSizeIncrements,
  settingsStore, // Import the Zustand store instance for getState()
  settingsStoreAtom,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { MessageSquare, MessageSquareDashed } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import Spacer from '~/components/atoms/spacer'
import ToolTipNotes from '~/components/atoms/tooltip-notes'
import { Icons } from '~/components/icons'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import {
  Badge,
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

import md from '~/store/example.md?raw'

// Helper component for Custom Database Location settings
function CustomDatabaseLocationSettings() {
  const { t } = useTranslation()
  const {
    customDbPath,
    // isCustomDbPathValid is checked via settingsStore.getState() after validation
    customDbPathError: storeCustomDbPathError, // Renamed to avoid conflict with local error state
    dbRelocationInProgress,
    validateCustomDbPath,
    applyCustomDbPath,
    revertToDefaultDbPath,
    relaunchApp,
  } = useAtomValue(settingsStoreAtom)

  const [isCustomLocationEnabled, setIsCustomLocationEnabled] = useState(!!customDbPath)
  const [selectedDbPath, setSelectedDbPath] = useState<string | null>(null)
  const [dbOperation, setDbOperation] = useState<'copy' | 'none'>('none') // Default to 'none' (use new location)

  const [isApplying, setIsApplying] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setValidationError(null) // Clear local validation error when customDbPath changes
    setIsCustomLocationEnabled(!!customDbPath) // Update toggle state based on customDbPath
    setSelectedDbPath(null) // Reset selected path when customDbPath changes
  }, [customDbPath])

  // Effect to react to validation errors from the store
  useEffect(() => {
    const state = settingsStore.getState()
    if (selectedDbPath && storeCustomDbPathError && !state.isCustomDbPathValid) {
      setValidationError(storeCustomDbPathError)
    } else if (state.isCustomDbPathValid) {
      setValidationError(null)
    }
  }, [storeCustomDbPathError, selectedDbPath])

  // Handle toggle change
  const handleToggleChange = async () => {
    const newState = !isCustomLocationEnabled

    if (!newState && customDbPath) {
      // If turning off and there's a custom path, ask for confirmation
      const confirmed = await dialog.confirm(
        t(
          'Are you sure you want to go back to the default data folder? This will remove the custom location setting.',
          { ns: 'settings' }
        )
      )
      if (confirmed) {
        setIsCustomLocationEnabled(newState)
        handleRevert()
      }
      // If not confirmed, explicitly keep the switch active (don't change state)
      // The switch should remain in its current state (true)
      return
    } else {
      // For enabling or when there's no custom path, proceed normally
      setIsCustomLocationEnabled(newState)
    }

    setOperationError(null)
    setValidationError(null)
  }

  const handleBrowse = async () => {
    setOperationError(null)
    setValidationError(null)
    try {
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: t('Select Data Directory', { ns: 'settings' }),
      })
      if (typeof selected === 'string') {
        const status: any = await invoke('cmd_check_custom_data_path', {
          pathStr: selected,
        })
        let finalPath = selected

        if (status === 'NotEmpty') {
          // For NotEmpty status, check if it's a regular folder with files or if it already contains PasteBar data
          // If it's IsPastebarDataAndNotEmpty, the backend already handles it separately
          const confirmSubfolder = await dialog.confirm(
            t(
              'The selected folder is not empty and does not contain PasteBar data files. Do you want to create a "pastebar-data" subfolder to store the data?',
              { ns: 'settings' }
            )
          )
          if (confirmSubfolder) {
            finalPath = await join(selected, 'pastebar-data')
          } else {
            // User chose not to create subfolder, cancel the operation
            return
          }
        } else if (status === 'IsPastebarDataAndNotEmpty') {
          await dialog.message(
            t(
              'This folder already contains PasteBar data. The application will use this existing data after restart.',
              { ns: 'settings' }
            )
          )
        }

        setSelectedDbPath(finalPath)
        // Validate the path if it's different from current
        if (finalPath !== customDbPath) {
          await validateCustomDbPath(finalPath)
        }
      }
    } catch (error) {
      console.error('Error handling directory selection:', error)
      setOperationError(
        t('An error occurred during directory processing.', { ns: 'settings' })
      )
    }
  }

  const handleApply = async () => {
    if (!selectedDbPath || selectedDbPath === customDbPath) {
      setOperationError(
        t('Please select a new directory different from the current one.', {
          ns: 'settings',
        })
      )
      return
    }
    setIsApplying(true)
    setOperationError(null)
    setValidationError(null)

    await validateCustomDbPath(selectedDbPath)
    const currentStoreState = settingsStore.getState()

    if (!currentStoreState.isCustomDbPathValid) {
      setValidationError(
        currentStoreState.customDbPathError ||
          t('Invalid directory selected.', { ns: 'settings' })
      )
      setIsApplying(false)
      return
    }

    const confirmed = await dialog.confirm(
      t(
        'Are you sure you want to {{operation}} the database to "{{path}}"? The application will restart.',
        {
          ns: 'settings',
          operation: t(dbOperation, { ns: 'settings' }),
          path: selectedDbPath,
        }
      )
    )
    if (confirmed) {
      try {
        await applyCustomDbPath(selectedDbPath, dbOperation)
        // Consider using a toast notification here
        relaunchApp()
      } catch (error: any) {
        setOperationError(
          error.message ||
            t('Failed to apply custom database location.', { ns: 'settings' })
        )
      } finally {
        setIsApplying(false)
      }
    } else {
      setIsApplying(false)
    }
  }

  const handleRevert = async () => {
    setOperationError(null)
    setValidationError(null)

    setIsReverting(true)
    try {
      // Only remove the custom DB path setting, don't move any files
      await revertToDefaultDbPath()
      // Consider using a toast notification here
      relaunchApp()
    } catch (error: any) {
      setOperationError(
        error.message ||
          t('Failed to revert to default database location.', { ns: 'settings' })
      )
    } finally {
      setIsReverting(false)
    }
  }

  const isLoading = dbRelocationInProgress || isApplying || isReverting
  const currentPathDisplay = customDbPath || t('Default', { ns: 'settings' })
  const isPathUnchanged = selectedDbPath === customDbPath

  return (
    <Box className="animate-in fade-in max-w-xl mt-4">
      <Card
        className={`${
          !isCustomLocationEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="animate-in fade-in text-md font-medium w-full">
            {t('Custom Application Data Location', { ns: 'settings' })}
          </CardTitle>
          <Switch
            checked={isCustomLocationEnabled}
            className="ml-auto"
            onCheckedChange={handleToggleChange}
          />
        </CardHeader>

        <CardContent>
          <Text className="text-sm text-muted-foreground">
            {t(
              'Enable custom data location to store application data in a directory of your choice instead of the default location.',
              { ns: 'settings' }
            )}
          </Text>

          {isCustomLocationEnabled && (
            <div className="space-y-4 mt-4">
              <Text className="text-sm text-muted-foreground">
                {t('Current database location', { ns: 'settings' })}:{' '}
                <span className="font-semibold">{currentPathDisplay}</span>
              </Text>

              {selectedDbPath && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border">
                  <Text className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {t('Selected directory', { ns: 'settings' })}:
                  </Text>
                  <Text className="text-sm text-blue-700 dark:text-blue-200 break-all">
                    {selectedDbPath}
                  </Text>
                </div>
              )}

              {validationError && (
                <Text className="text-sm text-red-500">{validationError}</Text>
              )}

              <Button onClick={handleBrowse} disabled={isLoading} variant="outline">
                {dbRelocationInProgress && !isApplying && !isReverting ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {selectedDbPath
                  ? t('Change Directory...', { ns: 'settings' })
                  : t('Select Directory...', { ns: 'settings' })}
              </Button>

              {selectedDbPath && (
                <Flex className="items-center space-x-4">
                  <Text className="text-sm">
                    {t('Operation when applying new path', { ns: 'settings' })}:
                  </Text>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dbOperation"
                      value="copy"
                      checked={dbOperation === 'copy'}
                      onChange={() => setDbOperation('copy')}
                      disabled={isLoading}
                      className="form-radio accent-primary"
                    />
                    <TextNormal size="sm">
                      {t('Copy data', { ns: 'settings' })}
                    </TextNormal>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dbOperation"
                      value="none"
                      checked={dbOperation === 'none'}
                      onChange={() => setDbOperation('none')}
                      disabled={isLoading}
                      className="form-radio accent-primary"
                    />
                    <TextNormal size="sm">
                      {t('Use new location', { ns: 'settings' })}
                    </TextNormal>
                  </label>
                </Flex>
              )}

              {operationError && (
                <Text className="text-sm text-red-500">{operationError}</Text>
              )}

              <Flex className="space-x-2">
                {selectedDbPath && (
                  <Button
                    onClick={handleApply}
                    disabled={
                      isLoading || !selectedDbPath || isPathUnchanged || !!validationError
                    }
                  >
                    {isApplying ? (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('Apply and Restart', { ns: 'settings' })}
                  </Button>
                )}
                {customDbPath && ( // Only show revert button if a custom path is currently set
                  <Button
                    onClick={handleRevert}
                    disabled={isLoading}
                    variant="secondary" // Base variant
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white dark:text-slate-100" // Destructive-like styling
                  >
                    {isReverting ? (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('Revert to Default and Restart', { ns: 'settings' })}
                  </Button>
                )}
              </Flex>
              <Text className="text-xs text-muted-foreground pt-2">
                {t(
                  'Changing the database location requires an application restart to take effect.',
                  { ns: 'settings' }
                )}
              </Text>
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default function UserPreferences() {
  const { t } = useTranslation()

  const {
    isSkipAutoStartPrompt,
    setIsSkipAutoStartPrompt,
    isShowCollectionNameOnNavBar,
    setIsShowCollectionNameOnNavBar,
    isHideCollectionsOnNavBar,
    setIsHideCollectionsOnNavBar,
    isShowNavBarItemsOnHoverOnly,
    setIsShowNavBarItemsOnHoverOnly,
    isClipNotesHoverCardsEnabled,
    setIsClipNotesHoverCardsEnabled,
    clipNotesMaxHeight,
    clipNotesMaxWidth,
    setClipNotesMaxHeight,
    setClipNotesMaxWidth,
    clipNotesHoverCardsDelayMS,
    setClipNotesHoverCardsDelayMS,
    isShowDisabledCollectionsOnNavBarMenu,
    setIsShowDisabledCollectionsOnNavBarMenu,
    setIsHideMacOSDockIcon,
    isHideMacOSDockIcon,
    isKeepMainWindowClosedOnRestartEnabled,
    setIsKeepMainWindowClosedOnRestartEnabled,
    hotKeysShowHideMainAppWindow,
    hotKeysShowHideQuickPasteWindow,
    setHotKeysShowHideMainAppWindow,
    setHotKeysShowHideQuickPasteWindow,
    // Custom DB Path states and actions (customDbPath, isCustomDbPathValid, etc.)
    // are now handled in the CustomDatabaseLocationSettings component.
    // relaunchApp is also used there.
  } = useAtomValue(settingsStoreAtom)

  const { setFontSize, fontSize, setIsSwapPanels, isSwapPanels, returnRoute, isMacOSX } =
    useAtomValue(uiStoreAtom)

  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false)
  // Local states for DB path input, operation, and confirmations have been moved to CustomDatabaseLocationSettings

  const { setTheme, theme } = useTheme()
  const { mode, setMode, themeDark } = useAtomValue(themeStoreAtom)

  useEffect(() => {
    if (theme !== mode) {
      setMode(theme)
    }
  }, [theme, mode, setMode]) // Added mode and setMode to dependency array

  useEffect(() => {
    invoke('is_autostart_enabled').then(isEnabled => {
      setIsAutoStartEnabled(Boolean(isEnabled))
    })
  }, [])

  const isDark = themeDark()

  const [mainAppHotkey, setMainAppHotkey] = useState('')
  const [quickPasteHotkey, setQuickPasteHotkey] = useState('')

  const [isEditingMainApp, setIsEditingMainApp] = useState(false)
  const [isEditingQuickPaste, setIsEditingQuickPaste] = useState(false)

  useEffect(() => {
    if (hotKeysShowHideMainAppWindow !== mainAppHotkey) {
      setMainAppHotkey(hotKeysShowHideMainAppWindow)
    }
    if (hotKeysShowHideQuickPasteWindow !== quickPasteHotkey) {
      setQuickPasteHotkey(hotKeysShowHideQuickPasteWindow)
    }
  }, [hotKeysShowHideMainAppWindow, hotKeysShowHideQuickPasteWindow])
  // Removed mainAppHotkey, quickPasteHotkey from local state dependencies in the original thought process,
  // as they are set inside this effect. The effect correctly depends on props.

  const handleKeyDown = (
    event: KeyboardEvent | React.KeyboardEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    event.preventDefault()
    const { ctrlKey, shiftKey, altKey, metaKey, key } = event

    if (key === 'Escape' || key === 'Esc' || key === 'Backspace') {
      setter('')
      return
    }

    if (key === 'Enter') {
      if (setter === setMainAppHotkey) {
        setHotKeysShowHideMainAppWindow(mainAppHotkey)
        setIsEditingMainApp(false)
      } else {
        setHotKeysShowHideQuickPasteWindow(quickPasteHotkey)
        setIsEditingQuickPaste(false)
      }
      return
    }

    const pressedKeys = []
    let hasModifier = false
    let hasNonModifier = false

    if (ctrlKey) {
      pressedKeys.push('Ctrl')
      hasModifier = true
    }
    if (shiftKey) {
      pressedKeys.push('Shift')
      hasModifier = true
    }
    if (altKey) {
      pressedKeys.push('Alt')
      hasModifier = true
    }
    if (metaKey) {
      pressedKeys.push('Cmd')
      hasModifier = true
    }

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      pressedKeys.push(key.toUpperCase())
      hasNonModifier = true
    }

    if (hasModifier && hasNonModifier) {
      setter(pressedKeys.join('+'))
    }
  }

  function convertMsToSeconds(milliseconds: number) {
    const seconds = milliseconds / 1000
    const formattedSeconds = Number.isInteger(seconds)
      ? seconds.toString()
      : seconds.toFixed(1)
    const translatedUnit = seconds === 1 ? ' ' + t('second') : ' ' + t('seconds')
    return formattedSeconds + translatedUnit
  }
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

              <SimpleBar style={{ maxHeight: height - 85 }} autoHide={true}>
                <Box className="animate-in fade-in max-w-xl">
                  <Card
                    className={`${
                      !isAutoStartEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
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
                  <Card
                    className={`${
                      !isKeepMainWindowClosedOnRestartEnabled
                        ? 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        : ''
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Application Starts with Main Window Hidden', {
                          ns: 'settings2',
                        })}
                      </CardTitle>
                      <Switch
                        checked={isKeepMainWindowClosedOnRestartEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsKeepMainWindowClosedOnRestartEnabled(
                            !isKeepMainWindowClosedOnRestartEnabled
                          )
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Keep the main application window hidden when the app restarts. You can reopen it using the menu bar or taskbar menu, or using global hotkeys.',
                          { ns: 'settings2' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                {/* ------------- Custom Database Location Settings Card ------------- */}
                <CustomDatabaseLocationSettings />
                {/* ------------------------------------------------------------------ */}

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
                              className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
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
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
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
                      !isShowNavBarItemsOnHoverOnly
                        ? 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        : ''
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Show navbar elements on hover only', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isShowNavBarItemsOnHoverOnly}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsShowNavBarItemsOnHoverOnly(!isShowNavBarItemsOnHoverOnly)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Display navbar items only when the mouse hovers over the navigation bar to minimize visible UI elements',
                          {
                            ns: 'settings2',
                          }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isHideCollectionsOnNavBar &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Hide collections menu on the navbar', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isHideCollectionsOnNavBar}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsHideCollectionsOnNavBar(!isHideCollectionsOnNavBar)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t('Hide collections menu dropdown on the navigation bar', {
                          ns: 'settings2',
                        })}
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
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
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
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
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

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                        {t('Global System OS Hotkeys', { ns: 'settings2' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground mb-4">
                        {t(
                          'Set system OS hotkeys to show/hide the main app window and quick paste window',
                          { ns: 'settings2' }
                        )}
                      </Text>
                      <Box className="mb-4">
                        <InputField
                          label={t('Show/Hide Main App Window', { ns: 'settings2' })}
                          defaultValue={mainAppHotkey}
                          autoFocus={isEditingMainApp}
                          disabled={!isEditingMainApp}
                          onKeyDown={e =>
                            isEditingMainApp && handleKeyDown(e, setMainAppHotkey)
                          }
                          readOnly={!isEditingMainApp}
                          placeholder={
                            mainAppHotkey || isEditingMainApp
                              ? t('Press keys', { ns: 'settings2' })
                              : t('No keys set', { ns: 'settings2' })
                          }
                        />
                        <Flex className="mt-2 gap-2 justify-start">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (isEditingMainApp) {
                                setHotKeysShowHideMainAppWindow(mainAppHotkey)
                                setIsEditingMainApp(false)
                                setTimeout(() => {
                                  window.location.reload()
                                }, 300)
                              } else {
                                if (isEditingQuickPaste) {
                                  setQuickPasteHotkey(hotKeysShowHideQuickPasteWindow)
                                  setIsEditingQuickPaste(false)
                                }
                                setIsEditingMainApp(true)
                              }
                            }}
                          >
                            {isEditingMainApp
                              ? t('Done', { ns: 'common' })
                              : !mainAppHotkey
                                ? t('Set', { ns: 'settings2' })
                                : t('Change', { ns: 'settings2' })}
                          </Button>
                          {isEditingMainApp && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMainAppHotkey(hotKeysShowHideMainAppWindow)
                                setIsEditingMainApp(false)
                              }}
                            >
                              {t('Cancel', { ns: 'common' })}
                            </Button>
                          )}
                        </Flex>
                      </Box>
                      <Box>
                        <InputField
                          label={t('Show/Hide Quick Paste Window', { ns: 'settings2' })}
                          defaultValue={quickPasteHotkey}
                          disabled={!isEditingQuickPaste}
                          autoFocus={isEditingQuickPaste}
                          onKeyDown={e =>
                            isEditingQuickPaste && handleKeyDown(e, setQuickPasteHotkey)
                          }
                          readOnly={!isEditingQuickPaste}
                          placeholder={
                            quickPasteHotkey || isEditingQuickPaste
                              ? t('Press keys', { ns: 'settings2' })
                              : t('No keys set', { ns: 'settings2' })
                          }
                        />
                        <Flex className="mt-2 gap-2 justify-start">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (isEditingQuickPaste) {
                                setHotKeysShowHideQuickPasteWindow(quickPasteHotkey)
                                setIsEditingQuickPaste(false)
                                setTimeout(() => {
                                  window.location.reload()
                                }, 300)
                              } else {
                                if (isEditingMainApp) {
                                  setMainAppHotkey(hotKeysShowHideMainAppWindow)
                                  setIsEditingMainApp(false)
                                }
                                setIsEditingQuickPaste(true)
                              }
                            }}
                          >
                            {isEditingQuickPaste
                              ? t('Done', { ns: 'common' })
                              : !quickPasteHotkey
                                ? t('Set', { ns: 'settings2' })
                                : t('Change', { ns: 'settings2' })}
                          </Button>
                          {isEditingQuickPaste && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setQuickPasteHotkey(hotKeysShowHideQuickPasteWindow)
                                setIsEditingQuickPaste(false)
                              }}
                            >
                              {t('Cancel', { ns: 'common' })}
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {isMacOSX && (
                  <Box className="animate-in fade-in max-w-xl mt-4">
                    <Card
                      className={`${
                        !isHideMacOSDockIcon &&
                        'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                      }`}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="animate-in fade-in text-md font-medium w-full flex">
                          {t('Hide the App Dock Icon', {
                            ns: 'settings2',
                          })}
                          <Badge className="ml-2" variant="pro">
                            {t('App restart required', {
                              ns: 'settings2',
                            })}
                          </Badge>
                        </CardTitle>
                        <Switch
                          checked={isHideMacOSDockIcon}
                          className="ml-auto"
                          onCheckedChange={() => {
                            setIsHideMacOSDockIcon(!isHideMacOSDockIcon)
                          }}
                        />
                      </CardHeader>
                      <CardContent>
                        <Text className="text-sm text-muted-foreground">
                          {t(
                            'Remove PasteBar app icon from the macOS Dock while keeping the app running in the background. The app remains accessible via the menu bar icon. Requires an app restart to take effect.',
                            { ns: 'settings2' }
                          )}
                        </Text>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isClipNotesHoverCardsEnabled &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Enable Clip Title Hover Show with Delay', {
                          ns: 'settings',
                        })}
                      </CardTitle>
                      <Switch
                        checked={isClipNotesHoverCardsEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsClipNotesHoverCardsEnabled(!isClipNotesHoverCardsEnabled)
                        }}
                      />
                    </CardHeader>

                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'This option lets you control the display and timing of hover notes on clips. You can choose to show notes instantly or with a delay to prevent unintended popups.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                      <Flex className="gap-2 flex-wrap items-start justify-start mt-4 mb-4">
                        {clipNotesDelays.map((delay, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            disabled={!isClipNotesHoverCardsEnabled}
                            onClick={() => {
                              setClipNotesHoverCardsDelayMS(delay)
                            }}
                            className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                              clipNotesHoverCardsDelayMS === delay
                                ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                : ''
                            } dark:text-slate-200 px-2 !py-0.5`}
                          >
                            {convertMsToSeconds(delay)}
                          </Button>
                        ))}
                      </Flex>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={
                          clipNotesHoverCardsDelayMS === 2000 ||
                          !isClipNotesHoverCardsEnabled
                        }
                        onClick={() => {
                          setClipNotesHoverCardsDelayMS(2000)
                        }}
                        className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                      >
                        {t('Reset', { ns: 'common' })}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="max-w-xl mt-4 animate-in fade-in">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Clip Notes Popup Maximum Dimensions', {
                          ns: 'settings',
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'This option lets you customize the maximum width and height of the popup that displays clip notes, ensuring it fits comfortably within your desired size.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>

                      <ToolTipNotes
                        text={md}
                        side="top"
                        isDark={isDark}
                        delayDuration={clipNotesHoverCardsDelayMS}
                        classNameTrigger="inline-flex items-start"
                        sideOffset={0}
                        maxWidth={clipNotesMaxWidth}
                        maxHeight={clipNotesMaxHeight}
                        asChild
                      >
                        <Text className="text-sm text-muted-foreground mt-3 underline cursor-pointer">
                          {t('Preview current popup size on hover.', {
                            ns: 'settings',
                          })}
                        </Text>
                      </ToolTipNotes>
                      <Flex className="gap-2 flex-wrap items-start justify-start mt-4 mb-4">
                        {clipNotesSizes.map((size, index) => {
                          const isSelected =
                            size.width === clipNotesMaxWidth &&
                            size.height === clipNotesMaxHeight

                          return (
                            <Button
                              key={index}
                              variant="ghost"
                              onClick={() => {
                                setClipNotesMaxWidth(size.width)
                                setClipNotesMaxHeight(size.height)
                              }}
                              className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                                isSelected
                                  ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                  : ''
                              } dark:text-slate-200 px-4 !py-0.5`}
                            >
                              {size.iconSize && (
                                <MessageSquare size={size.iconSize} className="mr-2" />
                              )}
                              {t(size.title, { ns: 'settings' })}
                            </Button>
                          )
                        })}

                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (
                              !clipNotesSizes.some(
                                size =>
                                  size.width === clipNotesMaxWidth &&
                                  size.height === clipNotesMaxHeight
                              )
                            ) {
                              return
                            }
                            setClipNotesMaxWidth(440)
                            setClipNotesMaxHeight(240)
                          }}
                          className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                            !clipNotesSizes.some(
                              size =>
                                size.width === clipNotesMaxWidth &&
                                size.height === clipNotesMaxHeight
                            )
                              ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                              : ''
                          } dark:text-slate-200 px-4 !py-0.5`}
                        >
                          <MessageSquareDashed size={21} className="mr-2" />
                          {t('Custom', { ns: 'settings' })}
                        </Button>
                      </Flex>
                      <Flex className="w-full gap-10 my-4 items-start justify-start">
                        <InputField
                          className="text-md !w-36"
                          type="number"
                          step="20"
                          max={800}
                          min={100}
                          small
                          label={t('Maximum width', { ns: 'common' })}
                          value={clipNotesMaxWidth}
                          onBlur={() => {
                            if (clipNotesMaxWidth < 100) {
                              setClipNotesMaxWidth(100)
                            } else if (clipNotesMaxWidth > 800) {
                              setClipNotesMaxWidth(800)
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value
                            if (value === '') {
                              return
                            } else {
                              const number = parseInt(value)
                              if (number) {
                                setClipNotesMaxWidth(number)
                              }
                            }
                          }}
                        />
                        <InputField
                          className="text-md !w-36"
                          type="number"
                          step="20"
                          max={600}
                          min={100}
                          small
                          label={t('Maximum height', { ns: 'common' })}
                          value={clipNotesMaxHeight}
                          onBlur={() => {
                            if (clipNotesMaxHeight < 100) {
                              setClipNotesMaxHeight(100)
                            } else if (clipNotesMaxHeight > 600) {
                              setClipNotesMaxHeight(600)
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value
                            if (value === '') {
                              return
                            } else {
                              const number = parseInt(value)
                              if (number) {
                                setClipNotesMaxHeight(number)
                              }
                            }
                          }}
                        />
                      </Flex>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={clipNotesMaxWidth === 220 && clipNotesMaxHeight === 120}
                        onClick={() => {
                          setClipNotesMaxWidth(220)
                          setClipNotesMaxHeight(120)
                        }}
                        className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                      >
                        {t('Reset', { ns: 'common' })}
                      </Button>
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
              </SimpleBar>
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
