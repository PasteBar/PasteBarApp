import { useEffect } from 'react'
import { isKeyAltPressed, isKeyCtrlPressed } from '~/store'

export default function useKeyPressAltCtrl() {
  const altKeys = ['Alt', 'Meta']
  const ctrlKeys = ['Control']

  function hasAltKey(event: KeyboardEvent) {
    return altKeys.includes(event.key)
  }

  function hasCtrlKey(event: KeyboardEvent) {
    return ctrlKeys.includes(event.key)
  }

  function downHandler(event: KeyboardEvent) {
    if (hasAltKey(event)) {
      isKeyAltPressed.value = true
    }
    if (hasCtrlKey(event)) {
      isKeyCtrlPressed.value = true
    }
  }

  function upHandler(event: KeyboardEvent) {
    if (hasAltKey(event)) {
      isKeyAltPressed.value = false
    }
    if (hasCtrlKey(event)) {
      isKeyCtrlPressed.value = false
    }
  }

  function focusHandler() {
    isKeyAltPressed.value = false
    isKeyCtrlPressed.value = false
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)
    window.addEventListener('focus', focusHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
      window.removeEventListener('focus', focusHandler)
    }
  }, [])

  return { isKeyAltPressed, isKeyCtrlPressed }
}
