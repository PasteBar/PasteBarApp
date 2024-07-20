import { useEffect, useRef } from 'react'
import { Event, listen, TauriEvent } from '@tauri-apps/api/event'
import { LogicalSize, WebviewWindow } from '@tauri-apps/api/window'
import AddPathPopup from '~/assets/icons/add-path-popup'
import i18n from '~/locales'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import {
  Box,
  Button,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Text,
} from '~/components/ui'

import { useSignal } from '~/hooks/use-signal'

export function ClipAddPath({ onCallBack }: { onCallBack: (path: string) => void }) {
  const { t } = useTranslation()
  const showAddConfirmation = useSignal(false)
  const dropZoneRef = useRef<HTMLDivElement | null>(null)
  const webviewRef = useRef<WebviewWindow | null>(null)

  useEffect(() => {
    const listenToFileDropUnlisten = listen(
      'tauri://file-drop',
      (event: Event<string[]>) => {
        if (event.payload?.length > 0) {
          onCallBack(event.payload[0])
          showAddConfirmation.value = false
          webviewRef.current?.close()
        }
      }
    )
    return () => {
      listenToFileDropUnlisten.then(unlisten => {
        unlisten()
      })
    }
  }, [])

  const cancelAdd = () => {
    showAddConfirmation.value = false
    webviewRef.current?.close()
  }

  return (
    <Popover
      defaultOpen={false}
      open={showAddConfirmation.value}
      modal
      onOpenChange={isOpen => {
        if (!isOpen) {
          webviewRef.current?.close()
        }
      }}
    >
      <PopoverAnchor asChild>
        <Box tabIndex={0} className="focus:outline-none">
          <ToolTip
            text={t('Drag & Drop Path', { ns: 'dashboard' })}
            isCompact
            side="bottom"
            sideOffset={10}
            asChild
          >
            <Box tabIndex={0}>
              <Button
                variant="outline"
                size="mini"
                className="ml-1 px-1 h-10 w-10 text-slate-400 border-0 hover:text-blue-400 cl"
                onClick={() => {
                  showAddConfirmation.value = true
                }}
              >
                <AddPathPopup width={22} height={23} className="scale-y-[-1]" />
              </Button>
            </Box>
          </ToolTip>
        </Box>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={10}
        align="center"
        onOpenAutoFocus={() => {
          setTimeout(() => {
            dropZoneRef.current?.focus()
            dropZoneRef.current?.click()
          }, 300)
        }}
        className="bg-gray-100 w-72 shadow-xl p-2"
        onEscapeKeyDown={() => {
          cancelAdd()
        }}
        onPointerDownOutside={() => {
          cancelAdd()
        }}
      >
        {showAddConfirmation.value && (
          <Flex className="flex-col p-1 rounded-md" ref={dropZoneRef}>
            <Text
              color="black"
              size="sm"
              className="!inline-block text-center pointer-events-none !font-semibold"
            >
              {t(
                'We need to open a new window where you can drag & drop file, path or application.',
                { ns: 'dashboard' }
              )}
            </Text>
            <Spacer h={3} />
            <Flex>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-500 hover:text-gray-600 mr-3 border-transparent hover:border-gray-200"
                onClick={() => {
                  cancelAdd()
                }}
              >
                {t('Cancel', { ns: 'common' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-200 hover:bg-opacity-80 hover:bg-slate-200 text-slate-500 hover:text-slate-600 border-slate-200"
                onClick={() => {
                  const webview = new WebviewWindow('drop-path', {
                    skipTaskbar: true,
                    title: t('Drop Zone', { ns: 'common' }),
                    alwaysOnTop: true,
                    fileDropEnabled: true,
                    decorations: true,
                    resizable: false,
                    minimizable: false,
                    visible: false,
                    center: true,
                    titleBarStyle: 'visible',
                    url: 'drop-path.html?' + i18n.language,
                  })

                  webview.once(TauriEvent.WINDOW_CLOSE_REQUESTED, function () {
                    showAddConfirmation.value = false
                    webviewRef?.current?.close()
                  })

                  webview.once('tauri://created', function () {
                    webview.setCursorVisible(false)
                    webview.setFocus()
                    webview.setSize(new LogicalSize(260, 260))
                    webview.center()
                    webview.show()
                  })
                  webview.once('tauri://error', function () {
                    webviewRef?.current?.close()
                  })

                  webviewRef.current = webview
                }}
              >
                {t('Open Window', { ns: 'common' })}
              </Button>
            </Flex>
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  )
}
