import { useEffect, useRef } from 'react'
import { type UniqueIdentifier } from '@dnd-kit/core'
import { Event, listen, TauriEvent } from '@tauri-apps/api/event'
import { LogicalSize, WebviewWindow } from '@tauri-apps/api/window'
import i18n from '~/locales'
import { PlusSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Spacer from '~/components/atoms/spacer'
import Spinner from '~/components/atoms/spinner'
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

import {
  useAddImageToItemById,
  useUploadImageToItemById,
} from '~/hooks/queries/use-items'
import { useSignal } from '~/hooks/use-signal'

export function ClipAddImage({ id }: { id: UniqueIdentifier }) {
  const { t } = useTranslation()
  const showAddConfirmation = useSignal(false)
  const { addImageToItemById } = useAddImageToItemById()
  const { uploadImageToItemById, uploadImageToItemReset } = useUploadImageToItemById()
  const webviewRef = useRef<WebviewWindow | null>(null)
  const dropZoneRef = useRef<HTMLDivElement | null>(null)
  const isImageUploadPending = useSignal(false)

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      dropZoneRef.current?.classList.add('bg-blue-50', '!border-blue-400')
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDragLeave = (e: DragEvent) => {
      dropZoneRef.current?.classList.remove('bg-blue-50', '!border-blue-400')
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer?.files[0]
      if (!file) {
        uploadImageToItemReset()
      } else {
        const reader = new FileReader()
        const fileType = file.type
        reader.readAsArrayBuffer(file)
        reader.onload = async event => {
          const fileContent = event.target?.result
          if (fileContent) {
            const bufferArray = Array.from(new Uint8Array(fileContent as ArrayBuffer))
            isImageUploadPending.value = true

            requestAnimationFrame(async () => {
              try {
                await uploadImageToItemById({
                  itemId: id,
                  buffer: bufferArray,
                  fileType,
                })
              } catch (error) {
                console.error('Error during file upload', error)
              }
              isImageUploadPending.value = false
            })
          }

          uploadImageToItemReset()
          showAddConfirmation.value = false
          webviewRef.current?.close()
        }
      }
    }

    if (!dropZoneRef.current) return
    dropZoneRef.current?.addEventListener('dragenter', handleDragEnter)
    dropZoneRef.current?.addEventListener('dragleave', handleDragLeave)
    dropZoneRef.current?.addEventListener('dragover', handleDragEnter)
    dropZoneRef.current?.addEventListener('drop', handleDrop)

    const children = dropZoneRef.current?.children ?? []
    for (const child of children) {
      child.addEventListener('dragover', handleDragEnter as EventListener)
      child.addEventListener('dragenter', handleDragEnter as EventListener)
      child.addEventListener('dragleave', handleDragLeave as EventListener)
      child.addEventListener('drop', handleDrop as EventListener)
    }

    return () => {
      dropZoneRef.current?.removeEventListener('dragenter', handleDragEnter)
      dropZoneRef.current?.removeEventListener('dragleave', handleDragLeave)
      dropZoneRef.current?.removeEventListener('dragover', handleDragEnter)
      dropZoneRef.current?.removeEventListener('drop', handleDrop)

      const children = dropZoneRef.current?.children ?? []
      for (const child of children) {
        child.removeEventListener('dragover', handleDragEnter as EventListener)
        child.removeEventListener('dragenter', handleDragEnter as EventListener)
        child.removeEventListener('dragleave', handleDragLeave as EventListener)
        child.removeEventListener('drop', handleDrop as EventListener)
      }
    }
  }, [dropZoneRef.current])

  useEffect(() => {
    const listenToFileDropUnlisten = listen(
      'tauri://file-drop',
      (event: Event<string[]>) => {
        if (event.payload?.length > 0) {
          addImageToItemById({
            itemId: id,
            imagePath: event.payload[0],
          })
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
    uploadImageToItemReset()
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
            text={t('Add image', { ns: 'dashboard' })}
            isCompact
            side="bottom"
            sideOffset={10}
            asChild
          >
            <Button
              variant="outline"
              size="mini"
              className="p-1.5 border-0 bg-slate-100 flex items-center justify-center hover:bg-slate-50/100 text-slate-400 hover:text-slate-500"
              onClick={() => {
                showAddConfirmation.value = true
              }}
            >
              <PlusSquare size={26} className="cursor-pointer" />
            </Button>
          </ToolTip>
        </Box>
      </PopoverAnchor>
      <PopoverContent
        sideOffset={16}
        align="center"
        autoFocus
        onOpenAutoFocus={() => {
          setTimeout(() => {
            dropZoneRef.current?.focus()
            dropZoneRef.current?.click()
          }, 300)
        }}
        className="p-1.5 bg-gray-100 border-gray-200 dark:bg-gray-900 dark:border-gray-950 w-72 shadow-xl z-100"
        onEscapeKeyDown={() => {
          cancelAdd()
        }}
        onPointerDownOutside={() => {
          cancelAdd()
        }}
      >
        {showAddConfirmation.value && (
          <Flex
            className="flex-col drop-zone p-1.5 border-2 border-slate-300 border-dashed rounded-md"
            ref={dropZoneRef}
          >
            <Spacer h={2} />
            {isImageUploadPending.value ? (
              <Spinner size="large" />
            ) : (
              <Text
                color="black"
                size="sm"
                className="!inline-block text-center pointer-events-none !font-semibold drop-zone"
              >
                {t('Drop image file here, or use a separate window for drag and drop.', {
                  ns: 'dashboard',
                })}
              </Text>
            )}
            <Spacer h={5} className="drop-zone" />
            <Flex className="drop-zone">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-500 drop-zone hover:text-gray-600 mr-3 border-transparent hover:border-gray-200"
                onClick={() => {
                  cancelAdd()
                }}
              >
                {t('Cancel', { ns: 'common' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-200 drop-zone hover:bg-opacity-80 hover:bg-slate-200 text-slate-500 hover:text-slate-600 border-slate-200"
                onClick={() => {
                  const webview = new WebviewWindow('drop-image', {
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
                    url: 'drop-image.html?' + i18n.language,
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
                    // }
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
            <Spacer h={2} />
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  )
}
