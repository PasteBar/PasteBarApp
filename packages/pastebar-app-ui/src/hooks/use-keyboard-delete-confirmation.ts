import { useCallback, useEffect, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { Signal } from '@preact/signals-react'
import { useHotkeys } from 'react-hotkeys-hook'

const useKeyboardDeleteConfirmation = ({
  onConfirmedDelete,
  keyboardSelectedItemId,
  onConfirmedReset,
  selectedHistoryItems,
  timerDuration = 3000,
}: {
  onConfirmedDelete: () => Promise<void>
  onConfirmedReset?: () => void
  selectedHistoryItems: UniqueIdentifier[]
  keyboardSelectedItemId: Signal<UniqueIdentifier | null>
  timerDuration?: number
}) => {
  const timerRef = useRef(null) as React.MutableRefObject<NodeJS.Timeout | null>
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [keyboardItemIdDelete, setKeyboardItemIdDelete] =
    useState<UniqueIdentifier | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setKeyboardItemIdDelete(null)
    setShowConfirmation(false)
    onConfirmedReset?.()
  }, [onConfirmedReset])

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Only proceed if there's a keyboard selected item and no multi-selection
    if (!keyboardSelectedItemId.value || selectedHistoryItems.length > 0) {
      return
    }

    setKeyboardItemIdDelete(keyboardSelectedItemId.value)
    setShowConfirmation(true)

    timerRef.current = setTimeout(() => {
      resetTimer()
    }, timerDuration)
  }, [timerDuration, resetTimer, selectedHistoryItems, keyboardSelectedItemId])

  // Reset confirmation when the keyboard selected item changes
  useEffect(() => {
    if (showConfirmation && keyboardItemIdDelete !== keyboardSelectedItemId.value) {
      resetTimer()
    }
  }, [keyboardSelectedItemId.value, showConfirmation, keyboardItemIdDelete, resetTimer])

  // Reset confirmation when there are selected items (multi-selection mode)
  useEffect(() => {
    if (showConfirmation && selectedHistoryItems.length > 0) {
      resetTimer()
    }
  }, [selectedHistoryItems.length, showConfirmation, resetTimer])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useHotkeys(
    ['delete', 'backspace'],
    async e => {
      e.preventDefault()

      // Only handle keyboard delete when there's a keyboard selected item and no multi-selection
      if (!keyboardSelectedItemId.value || selectedHistoryItems.length > 0) {
        return
      }

      if (showConfirmation) {
        await onConfirmedDelete()
        resetTimer()
      } else {
        startTimer()
      }
    },
    {
      enableOnFormTags: false,
    }
  )

  return {
    showConfirmation,
    keyboardItemIdDelete,
    resetTimer,
  }
}

export default useKeyboardDeleteConfirmation
