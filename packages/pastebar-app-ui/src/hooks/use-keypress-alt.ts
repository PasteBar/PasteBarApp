import { useEffect } from 'react'
import { isKeyAltPressed } from '~/store'

export default function useKeyPressAlt() {
  const targetKey = ['Alt', 'Meta']

  function hasAltKey(event: KeyboardEvent) {
    return targetKey.includes(event.key)
  }

  function downHandler(event: KeyboardEvent) {
    if (hasAltKey(event)) {
      isKeyAltPressed.value = true
    }
  }

  function upHandler(event: KeyboardEvent) {
    if (hasAltKey(event)) {
      isKeyAltPressed.value = false
    }
  }

  function focusHandler() {
    isKeyAltPressed.value = false
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

  return isKeyAltPressed
}
