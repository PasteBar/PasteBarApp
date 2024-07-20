import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api'
import { platform, version } from '@tauri-apps/api/os'
import preferecesImageMonterey from '~/assets/gifs/pastebar-accessibility-settings-monterey.gif'
import preferecesImageVentura from '~/assets/gifs/pastebar-accessibility-settings-ventura.gif'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Modal from '~/components/molecules/modal'
import { Badge, Box, Button, Flex, Text } from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

type Props = {
  open: boolean
  onClose: () => void
}

export default function ModalOSXSystemPermissions({ open, onClose }: Props) {
  const { t } = useTranslation()
  const isSettingsOpen = useSignal(false)
  const isTrusted = useSignal(false)
  const isSuccessfulyAdded = useSignal<boolean | null>(null)
  const osxVersion = useSignal<number>(14)

  useEffect(() => {
    platform().then(os => {
      if (os === 'darwin') {
        version().then(ver => {
          osxVersion.value = parseInt(ver)
        })
      }
      const interval = setInterval(async () => {
        isTrusted.value = await invoke('check_osx_accessibility_preferences')
        if (isTrusted.value) {
          isSuccessfulyAdded.value = true
          clearInterval(interval)
        }
      }, 1000)
      return () => clearInterval(interval)
    })
  }, [])

  useEffect(() => {
    if (isSuccessfulyAdded.value === null) return
    if (isSuccessfulyAdded.value) {
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }, [isSuccessfulyAdded.value])

  return (
    <Modal open={open} handleClose={onClose} isLargeModal>
      <Modal.Body className="dark:bg-green-950/30 bg-green-50/30 relative">
        <Modal.Header handleClose={onClose}>
          <h1 className="font-semibold text-center w-full">
            {t('Enable PasteBar in Accessibility Settings', { ns: 'common' })}
          </h1>
        </Modal.Header>
        {isSuccessfulyAdded.value !== true ? (
          <Modal.Content className="!pt-2 w-full !pb-2 justify-start items-center flex flex-col gap-3">
            <Text>
              {t('Please add PasteBar to the list of apps in', {
                ns: 'common',
              })}
            </Text>

            <Badge
              className={`!flex w-fit text-[16px] px-6 my-2 text-center cursor-pointer ${
                isSuccessfulyAdded.value === false
                  ? 'hover:bg-red-600 dark:hover:bg-red-700 bg-red-600 dark:bg-red-700'
                  : 'hover:bg-green-600 dark:hover:bg-green-700'
              }`}
              variant="slate"
              onClick={() => {
                isSettingsOpen.value = true
                isSuccessfulyAdded.value = null
                invoke('open_osx_accessibility_preferences')
              }}
            >
              {osxVersion.value >= 13
                ? t('System Settings -> Privacy & Security -> Accessibility', {
                    ns: 'common',
                  })
                : t('System Preferences -> Security & Privacy -> Accessibility', {
                    ns: 'common',
                  })}
            </Badge>
            {osxVersion.value ? (
              <img
                src={
                  osxVersion.value >= 13
                    ? preferecesImageVentura
                    : preferecesImageMonterey
                }
                draggable={false}
                decoding="async"
                className="animate-in fade-in max-w-full max-h-[380px] rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
              />
            ) : (
              <Box className="flex items-center w-[580px] h-[380px] justify-center bg-gray-300 rounded-lg animate-pulse dark:bg-gray-700" />
            )}

            {isSuccessfulyAdded.value === false ? (
              <Text className="text-sm w-[90%]" color="danger">
                {t(
                  'Permission Check Failed: PasteBar has not been successfully added to Accessibility settings. Please grant the required permissions and click Done again.',
                  { ns: 'common' }
                )}
              </Text>
            ) : (
              <Text className="text-sm w-[90%]">
                {t(
                  'This permission ensures PasteBar can access the clipboard and perform copy and paste operations across applications.',
                  { ns: 'common' }
                )}
              </Text>
            )}
          </Modal.Content>
        ) : (
          <Modal.Content className="!pt-2 w-full !pb-2 justify-start items-center flex flex-col gap-3">
            <Text>
              {t('PasteBar was successfuly added to Accessibility settings', {
                ns: 'common',
              })}
            </Text>

            <Badge className="!flex w-fit text-md px-10" variant="pro">
              {t('Success!', {
                ns: 'common',
              })}
            </Badge>
            {osxVersion.value ? (
              <Flex className="relative">
                <Check
                  size="182"
                  className="text-green-500 z-100 dark:bg-green-50/20 bg-green-300/20 rounded-full p-4 absolute animate-in fade-in duration-1000 dark:text-green-500"
                />
                <img
                  src={
                    osxVersion.value >= 13
                      ? preferecesImageVentura
                      : preferecesImageMonterey
                  }
                  draggable={false}
                  decoding="async"
                  className="opacity-30 max-w-full max-h-[380px] rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                />
              </Flex>
            ) : (
              <Box className="flex items-center w-[580px] h-[380px] justify-center bg-gray-300 rounded-lg animate-pulse dark:bg-gray-700" />
            )}

            <Text className="text-sm w-[80%]">
              {t(
                'PasteBar application now can access the clipboard and perform copy and paste operations across applications.',
                { ns: 'common' }
              )}
            </Text>
          </Modal.Content>
        )}
        <Modal.Footer className="flex-col !pt-0 !pb-5">
          {isSuccessfulyAdded.value ? (
            <div className="flex w-full justify-center mt-3 gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={async () => {
                  onClose()
                }}
                className={`h-10 ${
                  isSettingsOpen.value
                    ? 'dark:text-green-950 text-white bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-900'
                }`}
              >
                {t('Close', { ns: 'common' })}
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-center mt-3 gap-3">
              <Button
                size="sm"
                autoFocus
                onClick={() => {
                  isSettingsOpen.value = true
                  isSuccessfulyAdded.value = null
                  invoke('open_osx_accessibility_preferences')
                }}
                className="dark:text-green-950 text-white bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 h-10"
              >
                {t('Open Accessibility', { ns: 'common' })}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={async () => {
                  isTrusted.value = await invoke('check_osx_accessibility_preferences')
                  isSuccessfulyAdded.value = null
                  if (isTrusted.value) {
                    isSuccessfulyAdded.value = true
                  } else {
                    isSuccessfulyAdded.value = false
                  }
                  isSettingsOpen.value = false
                }}
                className={`h-10 ${
                  isSettingsOpen.value
                    ? 'dark:text-green-950 text-white bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-900'
                }`}
              >
                {t('Done', { ns: 'common' })}
              </Button>
            </div>
          )}
        </Modal.Footer>
        {!isSuccessfulyAdded.value && (
          <Flex className="justify-center items-center bottom-[-45px] absolute w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose()
              }}
              className="hover:bg-slate-500 text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 h-6 py-4"
            >
              {t('Later', { ns: 'common' })}
            </Button>
          </Flex>
        )}
      </Modal.Body>
    </Modal>
  )
}
