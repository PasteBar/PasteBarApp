export const OVERLAY_OPACITY = 0.75
export const OVERLAY_RADIUS = 5
export const OVERLAY_PADDING = 10
export const POPOVER_OFFSET = 10

export const SHOULD_ANIMATE_OVERLAY = true
export const SHOULD_OUTSIDE_CLICK_CLOSE = true
export const ALLOW_KEYBOARD_CONTROL = true
export const SHOULD_OUTSIDE_CLICK_NEXT = false

export const ID_POPOVER = 'boarding-popover-item'

const CLASS_BTN_GROUP = 'boarding-btn-group'

export const CLASS_POPOVER_TIP = 'boarding-popover-tip'
const CLASS_POPOVER_TITLE = 'boarding-popover-title'
const CLASS_POPOVER_DESCRIPTION = 'boarding-popover-description'
const CLASS_POPOVER_FOOTER = 'boarding-popover-footer'
export const CLASS_POPOVER_FOOTER_HIDDEN = 'boarding-popover-footer-hidden'
export const CLASS_POPOVER_NO_ELEMENT = ''
const CLASS_CLOSE_BTN = 'boarding-close-btn'
const CLASS_NEXT_STEP_BTN = 'boarding-next-btn'
const CLASS_PREV_STEP_BTN = 'boarding-prev-btn'
const CLASS_NAVIGATION_BTNS = 'boarding-navigation-btns'
export const CLASS_CUTOUT = 'boarding-coutout-svg'
export const CLASS_ACTIVE_HIGHLIGHTED_ELEMENT = 'boarding-highlighted-element'

export const SHOULD_STRICT_CLICK_HANDLE = true
export const CLASS_NO_CLICK_BODY = 'boarding-no-pointer-events'
export const CLASS_STRICT_CLICK_BODY = 'boarding-strict-pointer-events'

export const CLASS_BTN_DISABLED = 'boarding-disabled'
export const CLASS_CLOSE_ONLY_BTN = 'boarding-close-only-btn'

// NOTE: It must match the one set in the animations in CSS file
export const ANIMATION_DURATION_MS = 300

/**
 * Method that generates all the popover html elements
 * @param className className will be added to the wrapper
 * @returns object containing all the popover elements
 */
export const POPOVER_ELEMENT = (className = '') => {
  // create elements required
  const popoverWrapper = document.createElement('div')
  popoverWrapper.id = ID_POPOVER
  popoverWrapper.className =
    className +
    ' bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 w-72 dark:text-gray-200 text-gray-800'

  const popoverTip = document.createElement('div')
  popoverTip.classList.add(CLASS_POPOVER_TIP)

  const popoverTitle = document.createElement('div')
  popoverTitle.classList.add(CLASS_POPOVER_TITLE)
  popoverTitle.innerText = 'Popover Title'

  const popoverDescription = document.createElement('div')
  popoverDescription.classList.add(CLASS_POPOVER_DESCRIPTION)
  popoverDescription.innerText = 'Popover Description'

  const popoverFooter = document.createElement('div')
  popoverFooter.classList.add(CLASS_POPOVER_FOOTER)

  const popoverCloseBtn = document.createElement('button')
  popoverCloseBtn.classList.add(CLASS_CLOSE_BTN)
  popoverCloseBtn.innerText = 'Close'

  const popoverFooterBtnGroup = document.createElement('span')
  popoverFooterBtnGroup.classList.add(CLASS_BTN_GROUP, CLASS_NAVIGATION_BTNS)

  const popoverFooterCounter = document.createElement('span')
  popoverFooterCounter.classList.add('boarding-footer-counter')

  const popoverPrevBtn = document.createElement('button')
  popoverPrevBtn.classList.add(CLASS_PREV_STEP_BTN)
  popoverPrevBtn.innerText = '&larr; Previous'

  const popoverNextBtn = document.createElement('button')
  popoverNextBtn.classList.add(CLASS_NEXT_STEP_BTN)
  popoverNextBtn.innerText = 'Next &rarr;'

  // piece it all together
  popoverFooterBtnGroup.appendChild(popoverPrevBtn)
  popoverFooterBtnGroup.appendChild(popoverNextBtn)

  popoverFooter.appendChild(popoverCloseBtn)
  popoverFooter.appendChild(popoverFooterCounter)
  popoverFooter.appendChild(popoverFooterBtnGroup)

  popoverWrapper.appendChild(popoverTip)
  popoverWrapper.appendChild(popoverTitle)
  popoverWrapper.appendChild(popoverDescription)
  popoverWrapper.appendChild(popoverFooter)

  return {
    popoverWrapper,
    popoverTip,
    popoverTitle,
    popoverDescription,
    popoverFooter,
    popoverPrevBtn,
    popoverNextBtn,
    popoverCloseBtn,
    popoverFooterCounter,
    popoverFooterBtnGroup,
  }
}

export type PopoverElements = ReturnType<typeof POPOVER_ELEMENT>
