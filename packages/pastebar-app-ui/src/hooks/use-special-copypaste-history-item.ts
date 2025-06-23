import { useCallback, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core/dist/types'
import { signal } from '@preact/signals-react'
import { invoke } from '@tauri-apps/api/tauri'
import { settingsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

import { applyTransform, TEXT_TRANSFORMS } from '~/lib/text-transforms'

// Signals for tracking special copy/paste operations
export const specialCopiedItem = signal<UniqueIdentifier>('')
export const specialPastedItem = signal<UniqueIdentifier>('')
export const specialPastedItemCountDown = signal<number>(0)

interface UseSpecialCopyPasteOptions {
  delay?: number
}

export const useSpecialCopyPasteHistoryItem = ({
  delay = 800,
}: UseSpecialCopyPasteOptions = {}) => {
  const { copyPasteDelay } = useAtomValue(settingsStoreAtom)
  const countdownRef = useRef<NodeJS.Timeout>()

  // Special copy function - applies transformation and copies to clipboard
  const specialCopy = async (
    historyId: UniqueIdentifier,
    value: string,
    transformId: string
  ): Promise<void> => {
    try {
      if (!value || !historyId) {
        console.warn('No value or historyId to copy')
        return
      }

      // Set the signal to show UI feedback
      specialCopiedItem.value = historyId

      // Apply the text transformation - this will throw if it fails
      const transformedText = await applyTransform(value, transformId)

      // Only copy if transformation was successful
      setTimeout(() => {
        invoke('copy_text', { text: transformedText })
          .then(res => {
            if (res === 'ok') {
              requestAnimationFrame(() => {
                specialCopiedItem.value = ''
              })
            } else {
              specialCopiedItem.value = ''
              console.error('Failed to copy transformed text', res)
            }
          })
          .catch(err => {
            specialCopiedItem.value = ''
            console.error('Failed to copy transformed text', err)
          })
      }, delay)
    } catch (error) {
      // Clear UI feedback immediately on transformation error
      specialCopiedItem.value = ''
      console.error('Failed to special copy - transformation error:', error)
      // Don't copy anything to clipboard when transformation fails
      throw error
    }
  }

  // Countdown helper for paste operations
  const pasteCountdown = useCallback(
    (initialCount: number, intervalMs = 1000): Promise<void> => {
      clearInterval(countdownRef.current)
      return new Promise(resolve => {
        specialPastedItemCountDown.value = initialCount
        countdownRef.current = setInterval(() => {
          if (specialPastedItemCountDown.value > 0) {
            if (specialPastedItemCountDown.value === 1) {
              resolve()
            }
            specialPastedItemCountDown.value -= 1
          } else {
            clearInterval(countdownRef.current)
          }
        }, intervalMs)
      })
    },
    []
  )

  // Execute paste action with transformed text
  const executePasteAction = (text: string, delay = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      invoke('copy_paste', { text, delay })
        .then(res => {
          if (res === 'ok') {
            resolve()
          } else {
            console.error('Failed to paste transformed text', res)
            reject()
          }
        })
        .catch(err => {
          console.error('Failed to paste transformed text', err)
          reject()
        })
    })
  }

  // Special paste function - applies transformation and pastes directly
  const specialPaste = async (
    historyId: UniqueIdentifier,
    value: string,
    transformId: string,
    delaySeconds?: number
  ): Promise<void> => {
    try {
      delaySeconds = delaySeconds ?? copyPasteDelay
      
      if (!value || !historyId) {
        console.warn('No value or historyId to paste')
        return
      }

      // Set the signal to show UI feedback
      specialPastedItem.value = historyId

      // Apply the text transformation - this will throw if it fails
      const transformedText = await applyTransform(value, transformId)

      // Handle countdown if delay is specified (only if transformation succeeded)
      if (delaySeconds > 0) {
        await pasteCountdown(delaySeconds)
      }

      // Execute paste with transformed text (only if transformation succeeded)
      await executePasteAction(transformedText, 0)
      
      // Clear the signal after a short delay
      setTimeout(() => {
        requestAnimationFrame(() => {
          specialPastedItem.value = ''
          specialPastedItemCountDown.value = 0
        })
      }, delay)
    } catch (error) {
      // Clear UI feedback immediately on transformation error
      specialPastedItem.value = ''
      specialPastedItemCountDown.value = 0
      console.error('Failed to special paste - transformation error:', error)
      // Don't paste anything when transformation fails
      throw error
    }
  }

  return {
    specialCopy,
    specialPaste,
    availableTransforms: TEXT_TRANSFORMS,
    specialCopiedItem: specialCopiedItem.value,
    specialPastedItem: specialPastedItem.value,
    specialPastedItemCountDown: specialPastedItemCountDown.value,
  }
}
