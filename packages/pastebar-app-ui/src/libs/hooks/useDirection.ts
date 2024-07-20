import { useEffect } from 'react'
import { themeStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

import type { Direction } from '~/types/theme'

function useDirection(): [
  direction: Direction,
  updateDirection: (dir: Direction) => void,
] {
  const { direction, setDirection } = useAtomValue(themeStoreAtom)

  const updateDirection = (dir: Direction) => {
    setDirection(dir)
  }

  useEffect(() => {
    if (window === undefined) {
      return
    }
    const root = window.document.documentElement
    root.setAttribute('dir', direction)
  }, [direction])

  return [direction, updateDirection]
}

export default useDirection
