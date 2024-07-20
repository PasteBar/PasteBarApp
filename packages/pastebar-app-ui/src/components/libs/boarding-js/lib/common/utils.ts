export function easeInOutQuad(
  elapsed: number,
  initialValue: number,
  amountOfChange: number,
  duration: number
): number {
  if ((elapsed /= duration / 2) < 1) {
    return (amountOfChange / 2) * elapsed * elapsed + initialValue
  }
  return (-amountOfChange / 2) * (--elapsed * (elapsed - 2) - 1) + initialValue
}

/**
 * Subscribe a click eventhandler at the earlist possible moment and at the same time prevent all other pointer-events,
 * to make sure no external-library every knows the click happened
 * @param element Element (or its children) that should be listened for click events
 * @param handler the function that will get executed once a click happens on the requested element
 * @param preventDefaultConditon Allow to conditionally let a click event through (stopPropagation will still get called, but the default action will not be prevented)
 *
 * Note: For all current use-cases: garbage collection will take of "removeEventListener", since element will get removed from the dom without reference at some point
 * For future use-cases where this is not possible anymore, we could return a "removeAllEventListeners" method
 */
export function attachHighPrioClick(
  element: HTMLElement | SVGElement,
  handler: (e: MouseEvent | PointerEvent) => void,
  preventDefaultConditon?: (target: HTMLElement) => boolean | undefined | void
) {
  const listener = (
    e: MouseEvent | PointerEvent,
    finalHandler?: (e: MouseEvent | PointerEvent) => void
  ) => {
    const target = e.target as HTMLElement
    if (element.contains(target)) {
      if (!preventDefaultConditon || preventDefaultConditon(target)) {
        e.preventDefault()
      }
      e.stopPropagation()
      e.stopImmediatePropagation()

      finalHandler?.(e)
    }
  }

  const useCapture = true // we want to be the absolute first one to hear about the event

  // events to disable
  document.addEventListener('pointerdown', listener, useCapture)
  document.addEventListener('mousedown', listener, useCapture)
  document.addEventListener('pointerup', listener, useCapture)
  document.addEventListener('mouseup', listener, useCapture)
  // actual click handler
  document.addEventListener(
    'click',
    e => {
      listener(e, handler)
    },
    useCapture
  )
}

/**
 * Mark all items partial except a few in TS
 */
export type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<T>

/**
 * Mark only a few items partial in TS
 */
export type PartialSome<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * TS runtime check to make sure we are working with an Element
 */
export function assertIsElement(e: any | null): asserts e is Element {
  if (!e || !('nodeType' in e && e.nodeType === 1 && typeof e.nodeName === 'string')) {
    console.error('Html Element expected')
  }
}

/**
 * Receives two arguments. If the second one is "undefined", return the first one, otherwise return the second one.
 */
export function checkOptionalValue<T1 extends any>(argOriginal: T1, argOptional?: T1) {
  if (typeof argOptional === 'undefined') {
    return argOriginal
  }
  return argOptional
}

type Falsy = false | 0 | '' | null | undefined
/**
 * TS runtime check to ensure var is not falsy
 */
export function assertVarIsNotFalsy<T extends any>(
  e?: T
): asserts e is T extends Falsy ? never : T {
  if (!e) {
    console.error(`Variable was expected to not be falsy, but isntead was: ${e}`)
  }
}

/**
 * Checks if an element is visible in viewport
 */
function isInView(element: HTMLElement) {
  const rect = element.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Brings the element to middle of the view port if not in view
 */
export function bringInView(
  element?: HTMLElement,
  scrollIntoViewOptions?: ScrollIntoViewOptions
) {
  if (!element || isInView(element)) {
    return
  }

  element.scrollIntoView(scrollIntoViewOptions)
}
