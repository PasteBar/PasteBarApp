import { useCallback, useRef } from 'react'

interface LongPressOptions {
  delay?: number
  threshold?: number
  cancelOnMove?: boolean
  preventDefault?: boolean
}

interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchCancel: (e: React.TouchEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function useLongPress(
  callback: () => void,
  options: LongPressOptions = {}
): LongPressHandlers {
  const {
    delay = 600,
    threshold = 10,
    cancelOnMove = true,
    preventDefault = true,
  } = options

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isLongPressTriggeredRef = useRef(false)
  const isTouchRef = useRef(false)

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    startPositionRef.current = null
    isLongPressTriggeredRef.current = false
    isTouchRef.current = false
  }, [])

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent multiple simultaneous long press handlers
      if (timeoutRef.current) {
        clear()
      }

      // Only handle left mouse button for mouse events
      if ('button' in e && e.button !== 0) {
        return
      }

      // Determine if this is a touch event
      isTouchRef.current = 'touches' in e

      // Get the starting position
      const touch = 'touches' in e ? e.touches[0] : e
      startPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }

      if (preventDefault) {
        e.preventDefault()
      }

      // Set up the long press timer
      timeoutRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true
        callback()
        clear()
      }, delay)
    },
    [callback, clear, delay, preventDefault]
  )

  const move = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!cancelOnMove || !startPositionRef.current || !timeoutRef.current) {
        return
      }

      // Get current position
      const touch = 'touches' in e ? e.touches[0] : e
      const currentX = touch.clientX
      const currentY = touch.clientY

      // Calculate distance moved
      const deltaX = Math.abs(currentX - startPositionRef.current.x)
      const deltaY = Math.abs(currentY - startPositionRef.current.y)

      // Cancel if moved beyond threshold
      if (deltaX > threshold || deltaY > threshold) {
        clear()
      }
    },
    [cancelOnMove, clear, threshold]
  )

  const end = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent default only if long press was triggered
      if (isLongPressTriggeredRef.current && preventDefault) {
        e.preventDefault()
      }
      clear()
    },
    [clear, preventDefault]
  )

  const cancel = useCallback(() => {
    clear()
  }, [clear])

  // Prevent context menu on long press
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isLongPressTriggeredRef.current || timeoutRef.current) {
      e.preventDefault()
    }
  }, [])

  return {
    onMouseDown: start as (e: React.MouseEvent) => void,
    onMouseUp: end as (e: React.MouseEvent) => void,
    onMouseLeave: cancel,
    onMouseMove: cancelOnMove ? (move as (e: React.MouseEvent) => void) : undefined,
    onTouchStart: start as (e: React.TouchEvent) => void,
    onTouchEnd: end as (e: React.TouchEvent) => void,
    onTouchMove: move as (e: React.TouchEvent) => void,
    onTouchCancel: cancel,
    onContextMenu: preventDefault ? handleContextMenu : undefined,
  }
}

// Higher-order function version for backward compatibility
export function useLongPressHOF() {
  return function (callback: () => void, options?: LongPressOptions) {
    return useLongPress(callback, options)
  }
}
