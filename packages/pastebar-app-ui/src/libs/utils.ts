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

export function checkIfsemverValid(semver: string) {
  const semverPattern = /^\d+\.\d+\.\d+$/
  return semverPattern.test(semver)
}

export function semverCompare(v1: string | null, v2: string) {
  if (!v1 || !checkIfsemverValid(v1)) {
    return -1
  }
  const v1parts = v1.split('.')
  const v2parts = v2.split('.')

  for (let i = 0; i < v1parts.length; i++) {
    const p1 = parseInt(v1parts[i], 10)
    const p2 = parseInt(v2parts[i], 10)

    if (p1 > p2) {
      return 1
    } else if (p1 < p2) {
      return -1
    }
  }

  return 0
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
