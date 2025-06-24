import { useCallback, useEffect, useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { Signal } from '@preact/signals-react'
import { useHotkeys } from 'react-hotkeys-hook'

const useDeleteConfirmationTimer = ({
  onConfirmedDelete,
  hoveringHistoryRowId,
  onConfirmedReset,
  selectedHistoryItems,
  timerDuration = 3000,
}: {
  onConfirmedDelete: () => Promise<void>
  onConfirmedReset?: () => void
  selectedHistoryItems: UniqueIdentifier[]
  hoveringHistoryRowId: Signal<UniqueIdentifier | null>
  timerDuration?: number
}) => {
  const timerRef = useRef(null) as React.MutableRefObject<NodeJS.Timeout | null>
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [hoveringHistoryIdDelete, seHoveringHistoryIdDelete] =
    useState<UniqueIdentifier | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    seHoveringHistoryIdDelete(null)
    setShowConfirmation(false)
    onConfirmedReset?.()
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (selectedHistoryItems.length === 0) {
      seHoveringHistoryIdDelete(hoveringHistoryRowId.value)
    }

    setShowConfirmation(true)

    timerRef.current = setTimeout(() => {
      resetTimer()
    }, timerDuration)
  }, [timerDuration, resetTimer, selectedHistoryItems, hoveringHistoryRowId])

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

      if (showConfirmation) {
        await onConfirmedDelete()
        resetTimer()
      } else {
        startTimer()
      }
    },
    {
      enableOnFormTags: false,
      enabled: selectedHistoryItems.length > 0,
    }
  )

  return {
    showConfirmation,
    hoveringHistoryIdDelete,
    resetTimer,
  }
}

export default useDeleteConfirmationTimer
