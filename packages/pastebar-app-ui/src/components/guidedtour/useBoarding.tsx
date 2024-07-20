import { useCallback, useEffect, useRef } from 'react'

import { Boarding, BoardingOptions, BoardingSteps } from '../libs/boarding-js/lib'
import HighlightElement from '../libs/boarding-js/lib/core/highlight-element'

interface UseBoardingProps {
  steps: BoardingSteps
  options?: Partial<BoardingOptions>
  onStart?: (element: HighlightElement | undefined) => void
  onNext?: (element: HighlightElement) => void
  onPrevious?: (element: HighlightElement) => void
  onEnd?: (element: HighlightElement, reason: string) => void
  onHighlighted?: (element: HighlightElement) => void
  onBeforeHighlighted?: (element: HighlightElement) => void
  onDeselected?: (element: HighlightElement) => void
}

const useBoarding = ({
  steps,
  options,
  onStart,
  onNext,
  onPrevious,
  onEnd,
  onHighlighted,
  onBeforeHighlighted,
  onDeselected,
}: UseBoardingProps) => {
  const boardingRef = useRef<Boarding | null>(null)

  const addBoardingCSS = async (href: string) => {
    const existingLink = document.getElementById('boardingCSSLink')
    if (existingLink) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.id = 'boardingCSSLink'
      link.type = 'text/css'
      link.href = href

      link.onload = () => {
        resolve()
      }
      link.onerror = () => reject(new Error(`Failed to load CSS at ${href}`)) // Reject the promise if there's an error

      document.head.appendChild(link)
    })
  }

  const removeBoardingCSS = () => {
    const link = document.getElementById('boardingCSSLink')
    if (link) {
      link.remove()
    }
  }

  const onReset = useCallback(
    (element: HighlightElement, reason: string) => {
      removeBoardingCSS()
      if (onEnd) {
        onEnd(element as HighlightElement, reason)
      }
    },
    [onEnd]
  )

  useEffect(() => {
    if (boardingRef.current) {
      boardingRef.current.defineSteps(steps)
      if (!boardingRef.current.isActivated) {
        boardingRef.current?.start()
      }
      return
    }

    const boarding = new Boarding({
      ...options,
      onStart,
      onNext,
      onPrevious,
      onReset: onReset,
      onHighlighted,
      onBeforeHighlighted,
      onDeselected,
    })

    boarding.defineSteps(steps)
    boardingRef.current = boarding
  }, [
    steps,
    options,
    onStart,
    onNext,
    onPrevious,
    onEnd,
    onHighlighted,
    onBeforeHighlighted,
    onDeselected,
  ])

  const startBoarding = useCallback(() => {
    if (boardingRef.current) {
      const loadCssandStart = async () => {
        await addBoardingCSS('/assets/styles/boarding.css')
        boardingRef.current?.start()
      }
      loadCssandStart()
    }
  }, [])

  const resetBoarding = useCallback(() => {
    removeBoardingCSS()

    if (boardingRef.current) {
      boardingRef.current.reset(true)
      boardingRef.current = null
    }
  }, [])

  return {
    startBoarding,
    resetBoarding,
    boarding: boardingRef.current,
  }
}

export default useBoarding
