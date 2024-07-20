import { useEffect } from 'react'

/**
 * A simple React hook for differentiating single and double clicks on the same component.
 *
 * @param {node} ref Dom node to watch for double clicks
 * @param {number} [latency=300] The amount of time (in milliseconds) to wait before differentiating a single from a double click
 * @param {function} onSingleClick A callback function for single click events
 * @param {function} onDoubleClick A callback function for double click events
 */
const useDoubleClick = ({
  ref,
  latency = 300,
  onSingleClick = () => null,
  onDoubleClick = () => null,
}: {
  ref: React.RefObject<HTMLElement> | null
  latency?: number
  onSingleClick?: (e: KeyboardEvent) => void
  onDoubleClick?: (e: KeyboardEvent) => void
}) => {
  useEffect(() => {
    const clickRef = ref?.current
    let clickCount = 0
    const handleClick = (e: Event) => {
      clickCount += 1

      // @ts-expect-error
      const timeout = e.shiftKey ? 100 : latency

      setTimeout(() => {
        if (clickCount === 1) onSingleClick(e as KeyboardEvent)
        else if (clickCount === 2) onDoubleClick(e as KeyboardEvent)

        clickCount = 0
      }, timeout)
    }

    // Add event listener for click events
    clickRef?.addEventListener('click', handleClick)

    // Remove event listener
    return () => {
      clickRef?.removeEventListener('click', handleClick)
    }
  })
}

export default useDoubleClick
