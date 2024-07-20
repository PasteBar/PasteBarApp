import { OVERLAY_OPACITY } from '../common/constants'
import {
  assertVarIsNotFalsy,
  attachHighPrioClick,
  checkOptionalValue,
  easeInOutQuad,
} from '../common/utils'
import { BoardingSharedOptions } from '../types/boarding-types'
import { createSvgCutout, CutoutDefinition, generateSvgCutoutPathString } from './cutout'
import HighlightElement from './highlight-element'

/** The top-level options that are shared between multiple classes that overlay supports */
type OverlaySupportedSharedOptions = Pick<
  BoardingSharedOptions,
  'animate' | 'padding' | 'radius'
>

/** Identifier for different exist reasons that causing onReset, such as cancel or finish */
export type BoardingExitReason = 'cancel' | 'finish'

/** The options of overlay that will come from the top-level */
export interface OverlayTopLevelOptions {
  /**
   * Is called when the overlay is about to reset
   */
  onReset?: (
    element: HighlightElement,
    /** What caused the reset? Did the user cancel, finish .. */
    exitReason: BoardingExitReason
  ) => void
  /**
   * Opacity for the overlay
   * @default 0.75
   */
  opacity?: number
}

interface OverlayOptions extends OverlaySupportedSharedOptions, OverlayTopLevelOptions {
  /**
   * Click handler attached to overlay element
   */
  onOverlayClick: () => void
}

type AnimatableCutoutDefinition = Pick<
  CutoutDefinition,
  'padding' | 'hightlightBox' | 'radius'
>

/**
 * Responsible for overlay creation and manipulation i.e.
 * cutting out the visible part, animating between the sections etc
 */
class Overlay {
  private options // type will get inferred with default values being required
  private cutoutSVGElement?: SVGSVGElement
  private currentTransitionInProgress?: () => void
  private activeSvgCutoutDefinition?: AnimatableCutoutDefinition
  private highlightElemRect?: DOMRect

  public currentHighlightedElement?: HighlightElement
  public previouslyHighlightedElement?: HighlightElement

  constructor(options: OverlayOptions) {
    this.options = {
      // padding: Padding default will come from outside, as it affects more then just the overlay
      opacity: OVERLAY_OPACITY,
      ...options,
    }
  }

  /**
   * Highlights the dom element on the screen
   */
  public highlight(element: HighlightElement) {
    // if (!element || !element.node) {
    //   console.warn(
    //     "Invalid element to highlight. Must be an instance of `Element`"
    //   );
    //   return;
    // }

    // If highlighted element is not changed from last time
    if (element.isSame(this.currentHighlightedElement)) {
      return
    }

    // TODO: implement unmount animation again
    // // There might be hide timer from last time
    // // which might be getting triggered
    // window.clearTimeout(this.hideTimer);

    // Trigger the hook for highlight started
    element.onBeforeHighlighted()

    // Old element has been deselected
    if (
      this.currentHighlightedElement &&
      !this.currentHighlightedElement.isSame(this.previouslyHighlightedElement)
    ) {
      this.currentHighlightedElement.onDeselected()
    }

    // transition to new element + start tracking element on screen
    this.startElementTracking(this.currentHighlightedElement || element, element)

    this.previouslyHighlightedElement = this.currentHighlightedElement
    this.currentHighlightedElement = element

    // Element has been highlighted
    element.onHighlighted()
  }

  /**
   * Removes the overlay and cancel any listeners
   * @param immediate immediately unmount overlay or animate out
   */
  public clear(immediate = false, exitReason: BoardingExitReason) {
    // Callback for when overlay is about to be reset
    if (this.currentHighlightedElement) {
      this.options.onReset?.(this.currentHighlightedElement, exitReason)
    }

    // Deselect the highlighted element if any
    this.currentHighlightedElement?.onDeselected()

    // Unset highlightedElements
    this.currentHighlightedElement = undefined
    this.previouslyHighlightedElement = undefined

    // // Clear any existing timers and remove node
    // window.clearTimeout(this.hideTimer);

    // stop tracking element
    this.cancelElementTracking()

    if (this.options.animate && !immediate) {
      // this.node.style.opacity = "0";
      // this.hideTimer = this.window.setTimeout(
      //   this.removeNode,
      //   ANIMATION_DURATION_MS
      // );
      // TODO: implement unmount animation again
      this.unmountCutoutElement()
    } else {
      this.unmountCutoutElement()
    }
  }

  /**
   * Initialize requestAnimationFrame tracking of active element
   */
  private startElementTracking(
    fromElement: HighlightElement,
    toElement: HighlightElement
  ) {
    const duration = 400
    const start = Date.now()

    const animateOverlay = () => {
      const ellapsed = Date.now() - start
      // this will be false, if startElementTracking gets called a second time -> prevents multiple transitions to run at the same time
      if (this.currentTransitionInProgress === animateOverlay) {
        // transition
        if (this.options.animate && ellapsed < duration) {
          this.transitionCutoutToPosition(ellapsed, duration, fromElement, toElement)
        } else {
          // once transition is finished, just track the element on the screen
          this.trackElementOnScreen()
        }

        this.refreshSvgAndPopover()
        window.requestAnimationFrame(animateOverlay)
      }
    }
    this.currentTransitionInProgress = animateOverlay

    window.requestAnimationFrame(animateOverlay)
  }

  /**
   * This method calculates the animated new position of the cutout (called for each frame by requestAnimationFrame)
   */
  private transitionCutoutToPosition(
    ellapsed: number,
    duration: number,
    fromElement: HighlightElement,
    toElement: HighlightElement
  ) {
    const fromDefinition: AnimatableCutoutDefinition = this.activeSvgCutoutDefinition
      ? {
          ...this.activeSvgCutoutDefinition,
          hightlightBox: { ...this.activeSvgCutoutDefinition.hightlightBox }, // deep copy in case it was mutated
        }
      : {
          hightlightBox: fromElement.getDOMRect(),
          padding: fromElement.getCustomPadding(),
          radius: fromElement.getCustomRadius(),
        }

    const toRect = toElement.getDOMRect()
    const toPadding = checkOptionalValue(
      this.options.padding,
      toElement.getCustomPadding()
    )
    const toRadius = checkOptionalValue(this.options.radius, toElement.getCustomRadius())
    const fromPadding = checkOptionalValue(this.options.padding, fromDefinition.padding)
    const fromRadius = checkOptionalValue(this.options.radius, fromDefinition.radius)

    const x = easeInOutQuad(
      ellapsed,
      fromDefinition.hightlightBox.x,
      toRect.x - fromDefinition.hightlightBox.x,
      duration
    )
    const y = easeInOutQuad(
      ellapsed,
      fromDefinition.hightlightBox.y,
      toRect.y - fromDefinition.hightlightBox.y,
      duration
    )
    const width = easeInOutQuad(
      ellapsed,
      fromDefinition.hightlightBox.width,
      toRect.width - fromDefinition.hightlightBox.width,
      duration
    )
    const height = easeInOutQuad(
      ellapsed,
      fromDefinition.hightlightBox.height,
      toRect.height - fromDefinition.hightlightBox.height,
      duration
    )
    const padding = easeInOutQuad(
      ellapsed,
      fromPadding,
      toPadding - fromPadding,
      duration
    )
    const radius = easeInOutQuad(ellapsed, fromRadius, toRadius - fromRadius, duration)

    const newCutoutPosition: AnimatableCutoutDefinition = {
      hightlightBox: { x: x, y: y, width: width, height: height },
      padding: padding,
      radius,
    }
    this.activeSvgCutoutDefinition = newCutoutPosition
    this.updateCutoutPosition(newCutoutPosition)
  }

  /**
   * Stop tracking active highlight element on screen
   */
  private cancelElementTracking() {
    this.currentTransitionInProgress = undefined // will cancel the requestAnimationFrame loop
    this.activeSvgCutoutDefinition = undefined // set back to default
    this.highlightElemRect = undefined // set back to default
  }

  /**
   * Get active element on screen ad set cutoutposition to it
   */
  private trackElementOnScreen() {
    if (this.currentHighlightedElement) {
      const rect = this.currentHighlightedElement.getDOMRect()
      if (JSON.stringify(rect) !== JSON.stringify(this.highlightElemRect)) {
        const newCutoutPosition: AnimatableCutoutDefinition = {
          hightlightBox: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          padding: checkOptionalValue(
            this.options.padding,
            this.currentHighlightedElement.getCustomPadding()
          ),
          radius: checkOptionalValue(
            this.options.radius,
            this.currentHighlightedElement.getCustomRadius()
          ),
        }
        // update cutout
        this.updateCutoutPosition(newCutoutPosition)
        // update activeSvgCutoutDefinition cache
        this.activeSvgCutoutDefinition = newCutoutPosition
      }
      this.highlightElemRect = rect
    }
  }

  /**
   * Update popover position and SVG viewBox
   */
  private refreshSvgAndPopover() {
    assertVarIsNotFalsy(this.cutoutSVGElement)
    assertVarIsNotFalsy(this.currentHighlightedElement)
    // update svg viewBox
    const windowX = window.innerWidth
    const windowY = window.innerHeight
    this.cutoutSVGElement.setAttribute('viewBox', `0 0 ${windowX} ${windowY}`)

    this.currentHighlightedElement.getPopover()?.refresh()
  }

  /**
   * Get's the overlay SVG element - required so we can highlight it for the strict click handler
   */
  public getOverlayElement() {
    return this.cutoutSVGElement
  }

  private mountCutoutElement(cutoutDefinition: CutoutDefinition) {
    if (this.cutoutSVGElement) {
      console.error('Already mounted SVG')
      return
    }
    const newSvgElement = createSvgCutout(cutoutDefinition)
    this.cutoutSVGElement = newSvgElement
    document.body.appendChild(newSvgElement)

    // attach eventListener (using util method, to ensure no external libraries will ever "hear" the click)
    attachHighPrioClick(this.cutoutSVGElement, e => {
      const target = e.target as SVGElement
      if (target.tagName === 'path') {
        this.options.onOverlayClick()
      }
    })
  }

  private unmountCutoutElement() {
    if (!this.cutoutSVGElement) {
      return
    }

    // rm from body
    document.body.removeChild(this.cutoutSVGElement)
    // rm from memory
    this.cutoutSVGElement = undefined
  }

  /**
   * Generate a SVG cutout <Path> based on definition passed as argument
   */
  private updateCutoutPosition(definition: AnimatableCutoutDefinition) {
    const cutoutBoxSettings: CutoutDefinition = {
      hightlightBox: definition.hightlightBox,
      padding: definition.padding,
      opacity: this.options.opacity,
      radius: definition.radius,
      animated: this.options.animate,
    }

    // mount svg if its not mounted already
    if (!this.cutoutSVGElement) {
      this.mountCutoutElement(cutoutBoxSettings)
    } else {
      // otherwise update existing SVG path
      const pathElement = this.cutoutSVGElement.firstElementChild as SVGPathElement | null

      if (pathElement?.tagName === 'path') {
        pathElement.setAttribute('d', generateSvgCutoutPathString(cutoutBoxSettings))
      } else {
        console.error('No existing path found on SVG but we want one :(')
      }
    }
  }
}

export default Overlay
