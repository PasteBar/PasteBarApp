import { useCallback, useEffect } from 'react'

const KEY_NAME_ESC = 'Escape'
const KEY_EVENT_TYPE = 'keyup'

export default function useEscapeKeyPress(handleClose: (isPressed: boolean) => void) {
  const handleEscKey = useCallback(
    (event: KeyboardEvent) => {
      handleClose(event.key === KEY_NAME_ESC)
    },
    [handleClose]
  )

  useEffect(() => {
    document.addEventListener(KEY_EVENT_TYPE, handleEscKey, false)

    return () => {
      document.removeEventListener(KEY_EVENT_TYPE, handleEscKey, false)
    }
  }, [])
}
