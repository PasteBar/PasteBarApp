import { useEffect, useState } from 'react'

export function useLocalStorage(
  storageKey: string,
  fallbackState: string | null | undefined | boolean | number
) {
  const [value, setValue] = useState(
    localStorage.getItem(storageKey)
      ? JSON.parse(localStorage.getItem(storageKey) ?? '{}')
      : fallbackState
  )

  useEffect(() => {
    if (value === null) {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, JSON.stringify(value))
    }
  }, [value, storageKey])

  return [value, setValue]
}
