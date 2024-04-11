import { clsx, type ClassValue } from 'clsx'
import { atom } from 'jotai'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isEmailNotUrl(input: string) {
  if (!input && typeof input !== 'string') {
    return false
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const urlPattern = /^https?:\/\//

  if (!urlPattern.test(input)) {
    return emailPattern.test(input)
  }
  return false
}

export function atomWithWebStorage<Value>(
  key: string,
  initialValue: Value,
  storage = localStorage
) {
  const storedValue = storage.getItem(key)
  const isString = typeof initialValue === 'string'

  const storageValue = storedValue
    ? isString
      ? storedValue
      : storedValue === 'true'
    : undefined

  const baseAtom = atom(storageValue ?? initialValue)

  return atom(
    get => get(baseAtom) as Value,
    (_get, set, nextValue: Value) => {
      set(baseAtom, nextValue)
      storage.setItem(key, nextValue && nextValue.toString())
    }
  )
}
