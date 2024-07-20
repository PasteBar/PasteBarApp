import { CLASS_POPOVER_TIP } from '../common/constants'
import { assertVarIsNotFalsy } from '../common/utils'
import HighlightElement from './highlight-element'
import Popover from './popover'

const sideHierarchy = ['top', 'bottom', 'left', 'right'] as const

export type Sides = (typeof sideHierarchy)[number]
export type Alignments = 'start' | 'end' | 'center'

interface SideCheckResult {
  side: Sides
  value: number
  isOptimal: boolean
}

/**
 * Responsible for finding the best position for the popup
 */
class SmartPosition {
  private highlightElement: HighlightElement
  private popover: Popover
  private padding: number
  /** padding + offset */
  private finalOffset: number

  constructor(
    highlightElement: HighlightElement,
    popover: Popover,
    padding: number,
    offset: number
  ) {
    this.highlightElement = highlightElement
    this.popover = popover

    this.padding = padding
    this.finalOffset = padding + offset
  }

  public setBestPosition(alignment: Alignments, preferredSide?: Sides) {
    const position = this.findOptimalPosition(alignment, preferredSide)

    const popoverWrapper = this.popover.getPopoverElements()?.popoverWrapper
    assertVarIsNotFalsy(popoverWrapper)

    popoverWrapper.style.left =
      typeof position.left === 'number' ? `${position.left}px` : 'auto'
    popoverWrapper.style.right =
      typeof position.right === 'number' ? `${position.right}px` : 'auto'
    popoverWrapper.style.top =
      typeof position.top === 'number' ? `${position.top}px` : 'auto'
    popoverWrapper.style.bottom =
      typeof position.bottom === 'number' ? `${position.bottom}px` : 'auto'
  }

  /**
   * @returns DOMRect of element that should be highlighted
   */
  private getHighlightElemRect() {
    const highlightDomRect = this.highlightElement.getDOMRect()

    return highlightDomRect
  }
  /**
   * Calculates the popoer dimensions, but also takes the margin into account
   * @returns Popover width + height
   */
  private getPopoverDimensions() {
    const popoverElements = this.popover.getPopoverElements()
    const popoverRect = popoverElements?.popoverWrapper.getBoundingClientRect()
    const popoverTipRect = popoverElements?.popoverTip.getBoundingClientRect()

    assertVarIsNotFalsy(popoverRect)
    assertVarIsNotFalsy(popoverTipRect)

    // note that we only add margins ONCE because it only matters as a margin to the highlightElement, not the viewport
    return {
      width: popoverRect.width + this.finalOffset,
      height: popoverRect.height + this.finalOffset,
      tipSize: popoverTipRect.width,
    }
  }

  private checkIfSideOptimal(position: Sides): SideCheckResult {
    const popoverDimensions = this.getPopoverDimensions()
    const elemRect = this.getHighlightElemRect()

    switch (position) {
      case 'top':
        const top = elemRect.top - popoverDimensions.height

        return {
          side: 'top',
          value: top,
          isOptimal: top >= 0,
        }

      case 'bottom':
        const bottom = window.innerHeight - (elemRect.bottom + popoverDimensions.height)

        return {
          side: 'bottom',
          value: bottom,
          isOptimal: bottom >= 0,
        }
      case 'left':
        const left = elemRect.left - popoverDimensions.width

        return {
          side: 'left',
          value: left,
          isOptimal: left >= 0,
        }
      case 'right':
        const right = window.innerWidth - (elemRect.right + popoverDimensions.width)

        return {
          side: 'right',
          value: right,
          isOptimal: right >= 0,
        }
    }
  }

  /**
   * Find the best side to place the popover at
   */
  private findOptimalSide(sideHierarchyIndex: number = 0): SideCheckResult | 'none' {
    const currentPositionToCheck = sideHierarchy[sideHierarchyIndex]
    const result = this.checkIfSideOptimal(currentPositionToCheck)
    if (!result.isOptimal) {
      // check if we just calculated the last possible side without finding an optimal one
      if (sideHierarchyIndex === sideHierarchy.length - 1) {
        return 'none'
      }
      return this.findOptimalSide(sideHierarchyIndex + 1)
    }

    return result
  }

  /**
   * Normalize the position on an axis in case it would overflow
   * @param alignment one of start, center or end
   * @param popoverLength the length of the popover on the axis in question (x = width, y = height)
   * @param pos the position on the axis (x = left, y = top)
   * @param end the max value on the axis (x = maxWidth, y = maxHeight)
   * @param elementLength the length of the element on the axis in question (x = width, y = height)
   * @param padding extra space that should be considered when touching boundries such as "end" or "0"
   * @returns
   */
  private normalizeAlignment(
    alignment: Alignments,
    popoverLength: number, // popover height or width
    pos: number, // element top or left
    end: number, // window height or width
    elementLength: number, // popover height or width
    extraPadding: number
  ) {
    switch (alignment) {
      case 'start':
        return Math.max(
          Math.min(pos - this.padding, end - popoverLength - extraPadding),
          extraPadding
        )
      case 'end':
        return Math.max(
          Math.min(
            pos - popoverLength + elementLength + this.padding,
            end - popoverLength - extraPadding
          ),
          extraPadding
        )
      case 'center':
        const posCentered = pos - popoverLength / 2 + elementLength / 2
        return Math.min(
          Math.max(extraPadding, posCentered),
          end - extraPadding - popoverLength
        )
    }
  }

  /**
   * Find the optimal position for the popover
   */
  private findOptimalPosition(
    alignment: Alignments,
    preferredSide?: Sides
  ): {
    top?: number
    bottom?: number
    left?: number
    right?: number
  } {
    let foundSideResult: SideCheckResult | 'none'
    // check if prefferd side is optimal
    if (preferredSide) {
      foundSideResult = this.checkIfSideOptimal(preferredSide)
      // if preffered side was not optimal -> check all sides the standard way
      if (!foundSideResult.isOptimal) {
        foundSideResult = this.findOptimalSide()
      }
    } else {
      // check all sides the standard way
      foundSideResult = this.findOptimalSide()
    }

    if (foundSideResult === 'none') {
      // TODO: responsive handling if popover has no space
      // for now just center in the screen
      const popoverDimensions = this.getPopoverDimensions()

      // reset previous classes
      this.clearPopoverTipPosition()

      return {
        left: window.innerWidth / 2 - (popoverDimensions.width - this.finalOffset) / 2,
        bottom: 10,
      }
    } else {
      const popoverDimensions = this.getPopoverDimensions()
      const elemRect = this.getHighlightElemRect()

      const position: ReturnType<typeof this.findOptimalPosition> = {}

      const popoverRealWidth = popoverDimensions.width - this.finalOffset // get the real dimension without the margin
      const popoverRealHeight = popoverDimensions.height - this.finalOffset // get the real dimension without the margin
      switch (foundSideResult.side) {
        case 'top':
          position.top = Math.min(
            foundSideResult.value,
            window.innerHeight - popoverRealHeight - popoverDimensions.tipSize
          )
          position.left = this.normalizeAlignment(
            alignment,
            popoverRealWidth,
            elemRect.left,
            window.innerWidth,
            elemRect.width,
            popoverDimensions.tipSize
          )
          this.setPopoverTipPosition(
            alignment,
            foundSideResult.side,
            elemRect.left,
            elemRect.width
          )
          break
        case 'bottom':
          position.bottom = Math.min(
            foundSideResult.value,
            window.innerHeight - popoverRealHeight - popoverDimensions.tipSize
          )
          position.left = this.normalizeAlignment(
            alignment,
            popoverRealWidth,
            elemRect.left,
            window.innerWidth,
            elemRect.width,
            popoverDimensions.tipSize
          )
          this.setPopoverTipPosition(
            alignment,
            foundSideResult.side,
            elemRect.left,
            elemRect.width
          )
          break
        case 'left':
          position.left = Math.min(
            foundSideResult.value,
            window.innerWidth - popoverRealWidth - popoverDimensions.tipSize
          )
          position.top = this.normalizeAlignment(
            alignment,
            popoverRealHeight,
            elemRect.top,
            window.innerHeight,
            elemRect.height,
            popoverDimensions.tipSize
          )
          this.setPopoverTipPosition(
            alignment,
            foundSideResult.side,
            elemRect.top,
            elemRect.height
          )
          break
        case 'right':
          position.right = Math.min(
            foundSideResult.value,
            window.innerWidth - popoverRealWidth - popoverDimensions.tipSize
          )
          position.top = this.normalizeAlignment(
            alignment,
            popoverRealHeight,
            elemRect.top,
            window.innerHeight,
            elemRect.height,
            popoverDimensions.tipSize
          )
          this.setPopoverTipPosition(
            alignment,
            foundSideResult.side,
            elemRect.top,
            elemRect.height
          )
          break
      }
      return position
    }
  }

  /**
   * Reset the popover position classes.
   */
  private clearPopoverTipPosition() {
    const popoverTipElem = this.popover.getPopoverElements()?.popoverTip
    assertVarIsNotFalsy(popoverTipElem)

    // reset previous classes
    popoverTipElem.className = CLASS_POPOVER_TIP + ' '
  }

  /** interprete the arrow direction for the popover arrow tip */
  private setPopoverTipPosition(
    alignment: Alignments,
    popoverside: Sides,
    /** When right/left = element.top, when top/bottom = element.left */
    elementPosSecondaryAxis: number,
    /** When right/left = element.height, when top/bottom = element.width */
    elementLength: number
  ) {
    const popoverElem = this.popover.getPopoverElements()?.popoverWrapper
    const popoverTipElem = this.popover.getPopoverElements()?.popoverTip
    assertVarIsNotFalsy(popoverElem)
    assertVarIsNotFalsy(popoverTipElem)

    // not tipside is the OPPOSITe of what you might think
    let tipSide = popoverside
    let tipAlignment = alignment

    const popOverDimensions = popoverElem.getBoundingClientRect()

    switch (popoverside) {
      case 'top':
        if (elementPosSecondaryAxis + elementLength <= 0) {
          tipSide = 'right'
          tipAlignment = 'end'
        }
        //
        else if (elementPosSecondaryAxis + elementLength - popOverDimensions.width <= 0) {
          tipAlignment = 'start'
        }
        if (elementPosSecondaryAxis >= window.innerWidth) {
          tipSide = 'left'
          tipAlignment = 'end'
        }
        //
        else if (elementPosSecondaryAxis + popOverDimensions.width >= window.innerWidth) {
          tipAlignment = 'end'
        }
        break
      case 'bottom':
        if (elementPosSecondaryAxis + elementLength <= 0) {
          tipSide = 'right'
          tipAlignment = 'start'
        }
        //
        else if (elementPosSecondaryAxis + elementLength - popOverDimensions.width <= 0) {
          tipAlignment = 'start'
        }
        if (elementPosSecondaryAxis >= window.innerWidth) {
          tipSide = 'left'
          tipAlignment = 'start'
        }
        //
        else if (elementPosSecondaryAxis + popOverDimensions.width >= window.innerWidth) {
          tipAlignment = 'end'
        }
        break
      case 'left':
        if (elementPosSecondaryAxis + elementLength <= 0) {
          tipSide = 'bottom'
          tipAlignment = 'end'
        }
        //
        else if (
          elementPosSecondaryAxis + elementLength - popOverDimensions.height <=
          0
        ) {
          tipAlignment = 'start'
        }

        if (elementPosSecondaryAxis >= window.innerHeight) {
          tipSide = 'top'
          tipAlignment = 'end'
        }
        //
        else if (
          elementPosSecondaryAxis + popOverDimensions.height >=
          window.innerHeight
        ) {
          tipAlignment = 'end'
        }
        break
      case 'right':
        if (elementPosSecondaryAxis + elementLength <= 0) {
          tipSide = 'bottom'
          tipAlignment = 'start'
        }
        //
        else if (
          elementPosSecondaryAxis + elementLength - popOverDimensions.height <=
          0
        ) {
          tipAlignment = 'start'
        }
        if (elementPosSecondaryAxis >= window.innerHeight) {
          tipSide = 'top'
          tipAlignment = 'start'
        }
        //
        else if (
          elementPosSecondaryAxis + popOverDimensions.height >=
          window.innerHeight
        ) {
          tipAlignment = 'end'
        }
        break
    }
    // reset previous classes
    this.clearPopoverTipPosition()

    popoverTipElem.classList.add(
      `boarding-tipside-${tipSide}`,
      `boarding-tipalign-${tipAlignment}`
    )
  }
}

export default SmartPosition
