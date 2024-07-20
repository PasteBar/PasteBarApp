import { useCallback, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core/dist/types'
import { signal } from '@preact/signals-react'
import { invoke } from '@tauri-apps/api/tauri'
import { settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

type UseClipboardProps = {
  successDuration?: number
  delay?: number
  onCopied?: () => void
}

type UseClipboardPasteProps = {
  successDuration?: number
  delay?: number
  onPasted?: () => void
}

export const copiedItem = signal<UniqueIdentifier>('')
export const copyInProgressItem = signal<UniqueIdentifier>('')

export const useCopyClipItem = ({
  delay = 800,
  onCopied = () => {},
}: UseClipboardProps): [
  UniqueIdentifier,
  (id: UniqueIdentifier) => void,
  (ids: UniqueIdentifier[], isReverse?: boolean) => Promise<void>,
  UniqueIdentifier,
] => {
  const { copyPasteSequencePinnedDelay, copyPasteSequenceIsReversOrder } =
    useAtomValue(settingsStoreAtom)
  const handleCopy = (itemId: UniqueIdentifier): Promise<void> => {
    copyInProgressItem.value = itemId
    return new Promise((resolve, reject) => {
      if (itemId && !copiedItem.value) {
        copiedItem.value = itemId
        setTimeout(() => {
          invoke('copy_clip_item', { itemId, copyFromMenu: false })
            .then(res => {
              if (res === 'ok') {
                requestAnimationFrame(() => {
                  copiedItem.value = ''
                  copyInProgressItem.value = ''
                  onCopied()
                  resolve()
                })
              } else {
                copiedItem.value = ''
                copyInProgressItem.value = ''
                console.error('Failed to copy clip item', res)
                reject()
              }
            })
            .catch(err => {
              copiedItem.value = ''
              copyInProgressItem.value = ''
              console.error('Failed to copy clip item', err)
              reject()
            })
        }, delay)
      } else {
        copyInProgressItem.value = ''
      }
    })
  }

  const runSequenceCopyCopy = async (itemIds: UniqueIdentifier[]) => {
    if (copyPasteSequenceIsReversOrder) {
      itemIds = itemIds.reverse()
    }

    for (const itemId of itemIds) {
      handleCopy(itemId)
      await new Promise(resolve =>
        setTimeout(resolve, copyPasteSequencePinnedDelay * 1000)
      )
    }
  }

  return [copiedItem.value, handleCopy, runSequenceCopyCopy, copyInProgressItem.value]
}

export const pastedItem = signal<UniqueIdentifier>('')
export const pastedItemCountDown = signal<number>(0)

export const usePasteClipItem = ({
  delay = 800,
  onPasted = () => {},
}: UseClipboardPasteProps): [
  UniqueIdentifier,
  number,
  (id: UniqueIdentifier, delayInSec?: number, isCopyOnly?: boolean) => void,
  (ids: UniqueIdentifier[], isReverse?: boolean) => Promise<void>,
] => {
  const { copyPasteDelay, copyPasteSequencePinnedDelay, copyPasteSequenceIsReversOrder } =
    useAtomValue(settingsStoreAtom)
  const countdownRef = useRef<NodeJS.Timeout>()

  const executePasteAction = (
    itemId: UniqueIdentifier,
    delay = 0,
    isCopyOnly = false
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      invoke('copy_paste_clip_item', { itemId, delay, isCopyOnly })
        .then(res => {
          requestAnimationFrame
          if (res === 'ok') {
            resolve()
          } else {
            pastedItem.value = ''
            console.error('Failed to copy history item', res)
            reject()
          }
        })
        .catch(err => {
          pastedItem.value = ''
          console.error('Failed to copy history item', err)
          reject()
        })
    })
  }

  const pasteCountdown = useCallback(
    (initialCount: number, intervalMs = 1000): Promise<void> => {
      clearInterval(countdownRef.current)
      return new Promise(resolve => {
        pastedItemCountDown.value = initialCount
        countdownRef.current = setInterval(() => {
          if (pastedItemCountDown.value > 0) {
            if (pastedItemCountDown.value === 1) {
              resolve()
            }
            pastedItemCountDown.value -= 1
          } else {
            clearInterval(countdownRef.current)
          }
        }, intervalMs)
      })
    },
    [pastedItem.value]
  )

  const handlePaste = (
    itemId: UniqueIdentifier,
    delayInSec?: number,
    isCopyOnly?: boolean
  ): Promise<void> => {
    return new Promise(async resolve => {
      delayInSec = delayInSec ?? copyPasteDelay

      if (itemId) {
        pastedItem.value = itemId

        if (delayInSec > 0) {
          await pasteCountdown(delayInSec)
        }
        await executePasteAction(itemId, 0, isCopyOnly)
        setTimeout(() => {
          requestAnimationFrame(() => {
            onPasted()
            resolve()
            pastedItem.value = ''
          })
        }, delay)
      } else {
        pastedItem.value = ''
        resolve()
      }
    })
  }

  const runSequencePasteItems = async (itemIds: UniqueIdentifier[]) => {
    if (copyPasteSequenceIsReversOrder) {
      itemIds = itemIds.reverse()
    }
    for (const historyId of itemIds) {
      await handlePaste(historyId, copyPasteSequencePinnedDelay)
    }
  }

  return [pastedItem.value, pastedItemCountDown.value, handlePaste, runSequencePasteItems]
}
