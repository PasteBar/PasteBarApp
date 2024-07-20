import { CLASS_ACTIVE_HIGHLIGHTED_ELEMENT } from '../common/constants'
import { bringInView } from '../common/utils'
import { BoardingSharedOptions } from '../types/boarding-types'
import Popover from './popover'

/** The options of popover that will come from the top-level but can also be overwritten */
export interface HighlightElementHybridOptions
  extends Partial<
    Pick<
      BoardingSharedOptions,
      'padding' | 'radius' | 'strictClickHandling' | 'scrollIntoViewOptions'
    >
  > {
  /**
   * Callback to be called when element is about to be highlighted
   */
  onBeforeHighlighted?: (element: HighlightElement) => void
  /**
   * Callback to be called when element has been highlighted
   */
  onHighlighted?: (element: HighlightElement) => void
  /**
   * Callback to be called when element has been deselected
   */
  onDeselected?: (element: HighlightElement) => void
  /**
   * Is called when the next element is about to be highlighted
   */
  onNext?: (element: HighlightElement) => void
  /**
   * Is called when the previous element is about to be highlighted
   */
  onPrevious?: (element: HighlightElement) => void
}
interface HighlightElementOptions extends HighlightElementHybridOptions {}

/**
 * Wrapper around DOMElements to enrich them
 * with the functionality necessary
 */
class HighlightElement {
  options // type will get inferred with default values being required;
  highlightDomElement: HTMLElement
  popover: Popover | null
  /** A cached for the last known DOMRect, which is used as a fallback position for the popover when the element gets removed */
  private lastKnownDomRect?: DOMRect

  constructor({
    options,
    highlightDomElement,
    popover,
  }: {
    options: HighlightElementOptions
    highlightDomElement: HTMLElement
    popover: Popover | null
  }) {
    this.highlightDomElement = highlightDomElement
    this.options = options
    this.popover = popover
  }

  /**
   * Checks if the given element has the same underlying DOM element as the current one
   */
  public isSame(element?: HighlightElement | null) {
    if (!element || !element.highlightDomElement) {
      return false
    }

    return element.highlightDomElement === this.highlightDomElement
  }

  /**
   * Gets the DOM Element behind that this class resolves around
   */
  public getElement() {
    return this.highlightDomElement
  }
  /**
   * Gets the popover that is connected to the element
   */
  public getPopover() {
    return this.popover
  }

  /**
   * Gets the popover that is connected to the element
   */
  public getStrictClickHandling() {
    return this.options.strictClickHandling
  }

  /**
   * Is called when element is about to be deselected
   * i.e. when moving the focus to next element of closing
   */
  public onDeselected() {
    // hide popover
    this.popover?.hide()

    // remove active class
    this.getElement().classList.remove(CLASS_ACTIVE_HIGHLIGHTED_ELEMENT)

    this.options.onDeselected?.(this)
  }

  /**
   * Is called when the element is about to be highlighted
   */
  public onBeforeHighlighted() {
    this.options.onBeforeHighlighted?.(this)
  }

  /**
   * Is called when the element has been successfully highlighted
   */
  public onHighlighted() {
    if (this.options.scrollIntoViewOptions !== 'no-scroll') {
      bringInView(this.highlightDomElement, this.options.scrollIntoViewOptions)
    }

    // Show the popover once the item has been
    // brought in the view, this would allow us to handle
    // the cases where the container has scroll overflow
    this.popover?.show(this)

    // add active class
    this.getElement().classList.add(CLASS_ACTIVE_HIGHLIGHTED_ELEMENT)

    this.options.onHighlighted?.(this)
  }

  /**
   * Return the element's custom padding option if available
   */
  public getCustomPadding() {
    return this.options.padding
  }

  /**
   * Return the element's custom radius option if available
   */
  public getCustomRadius() {
    return this.options.radius
  }

  /**
   * Is called when the element is about to be highlighted
   */
  public onNext() {
    this.options.onNext?.(this)
  }
  /**
   * Is called when the element is about to be highlighted
   */
  public onPrevious() {
    this.options.onPrevious?.(this)
  }

  /**
   * Retrieve the last known DOMRect of the highlighted element from cache
   */
  public getDOMRect() {
    // We get the popover, to possibly mark it w/ CLASS_POPOVER_NO_ELEMENT
    // Note: Popover might not exist, for boarding.highlight w/out popover, therefore no asserIsNotFalsy

    const element = this.getElement()
    const domRect = element.getBoundingClientRect()

    // if element is not connected to the DOM, fallback to cached version if available
    if (!element.isConnected) {
      // mark popover as "no element found"
      return this.lastKnownDomRect || domRect
    }

    // make sure CLASS_POPOVER_NO_ELEMENT is not there
    this.lastKnownDomRect = domRect
    return domRect
  }
}

export default HighlightElement
