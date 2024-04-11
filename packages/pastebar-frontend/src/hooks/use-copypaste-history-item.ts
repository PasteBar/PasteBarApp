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

export const useCopyPasteHistoryItem = ({
  delay = 800,
  onCopied = () => {},
}: UseClipboardProps): [
  UniqueIdentifier,
  (id: UniqueIdentifier) => void,
  (ids: UniqueIdentifier[], isReverse?: boolean) => Promise<void>,
] => {
  const { copyPasteSequencePinnedDelay, copyPasteSequenceIsReversOrder } =
    useAtomValue(settingsStoreAtom)
  const handleCopy = (historyId: UniqueIdentifier) => {
    if (historyId && !copiedItem.value) {
      copiedItem.value = historyId
      setTimeout(() => {
        invoke('copy_history_item', { historyId })
          .then(res => {
            if (res === 'ok') {
              requestAnimationFrame(() => {
                copiedItem.value = ''
                onCopied()
              })
            } else {
              copiedItem.value = ''
              console.error('Failed to copy history item', res)
            }
          })
          .catch(err => {
            copiedItem.value = ''
            console.error('Failed to copy history item', err)
          })
      }, delay)
    }
  }

  const runSequenceCopy = async (historyIds: UniqueIdentifier[]) => {
    if (copyPasteSequenceIsReversOrder) {
      historyIds = historyIds.reverse()
    }

    for (const historyId of historyIds) {
      handleCopy(historyId)
      await new Promise(resolve =>
        setTimeout(resolve, copyPasteSequencePinnedDelay * 1000)
      )
    }
  }

  return [copiedItem.value, handleCopy, runSequenceCopy]
}

export const pastedItem = signal<UniqueIdentifier>('')
export const pastedItemCountDown = signal<number>(0)

export const usePasteHistoryItem = ({
  delay = 800,
  onPasted = () => {},
}: UseClipboardPasteProps): [
  UniqueIdentifier,
  number,
  (id: UniqueIdentifier, delayInSec?: number) => void,
  (ids: UniqueIdentifier[], isReverse?: boolean) => Promise<void>,
] => {
  const { copyPasteDelay, copyPasteSequencePinnedDelay, copyPasteSequenceIsReversOrder } =
    useAtomValue(settingsStoreAtom)
  const countdownRef = useRef<NodeJS.Timeout>()

  const executePasteAction = (historyId: UniqueIdentifier, delay = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      invoke('copy_paste_history_item', { historyId, delay })
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
    historyId: UniqueIdentifier,
    delayInSec?: number
  ): Promise<void> => {
    return new Promise(async resolve => {
      delayInSec = delayInSec ?? copyPasteDelay

      if (historyId) {
        pastedItem.value = historyId

        if (delayInSec > 0) {
          await pasteCountdown(delayInSec)
        }
        await executePasteAction(historyId)
        setTimeout(() => {
          requestAnimationFrame(() => {
            onPasted()
            resolve()
          })
        }, delay)
      } else {
        pastedItem.value = ''
        resolve()
      }
    })
  }

  const runSequencePaste = async (historyIds: UniqueIdentifier[]) => {
    if (copyPasteSequenceIsReversOrder) {
      historyIds = historyIds.reverse()
    }
    for (const historyId of historyIds) {
      await handlePaste(historyId, copyPasteSequencePinnedDelay)
    }
  }

  return [pastedItem.value, pastedItemCountDown.value, handlePaste, runSequencePaste]
}
