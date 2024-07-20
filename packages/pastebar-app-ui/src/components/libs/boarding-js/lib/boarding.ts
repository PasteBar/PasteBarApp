import {
  ALLOW_KEYBOARD_CONTROL,
  CLASS_NO_CLICK_BODY,
  CLASS_STRICT_CLICK_BODY,
  OVERLAY_PADDING,
  OVERLAY_RADIUS,
  SHOULD_ANIMATE_OVERLAY,
  SHOULD_OUTSIDE_CLICK_CLOSE,
  SHOULD_OUTSIDE_CLICK_NEXT,
  SHOULD_STRICT_CLICK_HANDLE,
} from './common/constants'
import { assertIsElement } from './common/utils'
import HighlightElement from './core/highlight-element'
import Overlay, { BoardingExitReason } from './core/overlay'
import Popover from './core/popover'
import {
  BoardingOptions,
  BoardingStepDefinition,
  BoardingSteps,
} from './types/boarding-types'

type HighlightSelector = BoardingStepDefinition | string | HTMLElement

enum MovementType {
  Start,
  Highlight,
  PrepareNext,
  Next,
  PreparePrevious,
  Previous,
}

type Movement =
  | {
      movement:
        | MovementType.Start
        | MovementType.Next
        | MovementType.PrepareNext
        | MovementType.PreparePrevious
        | MovementType.Previous
      index: number
    }
  | {
      movement: MovementType.Highlight
      selector: HighlightSelector
    }

/**
 * Plugin class that drives the plugin
 */
class Boarding {
  /**
   * Bool, whether the boarding session is currently active
   */
  public isActivated: boolean
  /**
   * Index of the currently active step
   */
  public currentStep: number

  options // type will get inferred with default values being required
  private steps: BoardingSteps
  private lastMovementRequested?: Movement
  private currentMovePrevented: Movement | false

  private overlay: Overlay

  constructor(options?: BoardingOptions) {
    const {
      strictClickHandling = SHOULD_STRICT_CLICK_HANDLE, // Whether to only allow clicking the highlighted element
      animate = SHOULD_ANIMATE_OVERLAY, // Whether to animate or not
      padding = OVERLAY_PADDING, // Spacing around the element from the overlay
      radius = OVERLAY_RADIUS, // Rounded corners for cutout
      scrollIntoViewOptions = {
        behavior: 'auto',
        block: 'center',
      }, // Options to be passed to `scrollIntoView`
      allowClose = SHOULD_OUTSIDE_CLICK_CLOSE, // Whether to close overlay on click outside the element
      keyboardControl = ALLOW_KEYBOARD_CONTROL, // Whether to allow controlling through keyboard or not
      overlayClickNext = SHOULD_OUTSIDE_CLICK_NEXT, // Whether to move next on click outside the element
      ...defaultOptions
    } = { ...options }

    this.options = {
      strictClickHandling,
      animate,
      padding,
      radius,
      scrollIntoViewOptions,
      allowClose,
      keyboardControl,
      overlayClickNext,
      ...defaultOptions,
    }

    this.isActivated = false
    this.steps = [] // steps to be presented if any
    this.currentStep = 0 // index for the currently highlighted step
    this.currentMovePrevented = false // If the current move was prevented

    this.overlay = new Overlay({
      animate: this.options.animate,
      padding: this.options.padding,
      radius: this.options.radius,
      onReset: this.options.onReset,
      opacity: this.options.opacity,
      onOverlayClick: () => {
        // Perform the 'Next' operation when clicked outside the highlighted element
        if (this.options.overlayClickNext) {
          this.next()
          return
        }
        // Remove the overlay If clicked outside the highlighted element
        if (this.options.allowClose) {
          this.reset(false, 'cancel')
          return
        }
      },
    })

    // bind this class to eventHandlers
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onClick = this.onClick.bind(this)
  }

  /**
   * Initiates highlighting steps from first step
   * @param index at which highlight is to be started
   */
  public start(index = 0) {
    this.lastMovementRequested = {
      movement: MovementType.Start,
      index: index,
    }

    if (!this.steps || this.steps.length === 0) {
      console.log('There are no steps defined to iterate')
      return
    }
    this.steps[index].prepareElement?.('init')
    if (this.currentMovePrevented) {
      return
    }

    this.handleStart(index)
  }

  /**
   * Highlights the given element
   * @param selector Query selector, htmlelement or a step definition
   */
  public highlight(selector: HighlightSelector) {
    this.lastMovementRequested = {
      movement: MovementType.Highlight,
      selector: selector,
    }

    // convert argument to step definition
    const stepDefinition: BoardingStepDefinition =
      typeof selector === 'object' && 'element' in selector
        ? selector
        : { element: selector }

    stepDefinition.prepareElement?.('init')
    if (this.currentMovePrevented) {
      return
    }

    this.handleHighlight(selector)
  }

  /**
   * Prevents the current move. Useful in `prepareElement`, `onNext`, `onPrevious` if you want to
   * perform some asynchronous task and manually move to next step
   */
  public preventMove() {
    // first check if there was even a move request before calling this method
    if (this.lastMovementRequested !== undefined) {
      // check whether preventMove was already called for the last move
      if (this.currentMovePrevented !== this.lastMovementRequested) {
        // check if move was already prevented from another step
        if (!this.currentMovePrevented) {
          // create a new OBJ reference in memory for === comparison, but keeping the lastMovementRequested.ref around for even more detailed comparison
          const newMovePrevented = { ...this.lastMovementRequested }
          this.currentMovePrevented = newMovePrevented
          this.lastMovementRequested = newMovePrevented
        } else {
          console.warn(
            'Tried to call Boarding.preventMove, but move has already been prevented, and not been continued or reset yet'
          )
        }
      } else {
        console.warn(
          'Boarding.preventMove was called multiple times for the same move, which has no effect.'
        )
      }
    } else {
      console.warn(
        'Tried to call Boarding.preventMove before, but no move was requested so far.'
      )
    }
  }

  /**
   * If preventMove was called, you can use this method to continue where the movement was stopped.
   * It's a smart method that chooses the correct method from: `next`, `previous`, `start` and `highlight`
   */
  public async continue() {
    // setTimout foces the continue to always be executed async from the original (this is necessary, so a user can't make the mistake of calling preventMove and continue synchronously which would cause issues)
    setTimeout(() => {
      if (this.currentMovePrevented === this.lastMovementRequested) {
        // reset, we are continuing
        this.currentMovePrevented = false

        // move to where we left of
        switch (this.lastMovementRequested.movement) {
          case MovementType.Start:
            this.handleStart(this.lastMovementRequested.index)
            break
          case MovementType.Highlight:
            this.handleHighlight(this.lastMovementRequested.selector)
            break
          case MovementType.PrepareNext:
            this.handleNext()
            break
          case MovementType.Next:
            this.moveNext()
            break
          case MovementType.PreparePrevious:
            this.handlePrevious()
            break
          case MovementType.Previous:
            this.movePrevious()
            break
        }
      } else {
        console.warn(
          'Boarding.continue was probably called too late, since the last preventMove was called from a different step (or never called at all).'
        )
      }
    }, 0)
  }

  /**
   * If Boarding.preventMove was called, use this method to reset currentMovePrevented
   */
  public clearMovePrevented() {
    this.currentMovePrevented = false
  }

  /**
   * Moves to the next step if possible
   * otherwise resets the overlay
   */
  public next() {
    if (this.currentMovePrevented) {
      return
    }

    this.lastMovementRequested = {
      movement: MovementType.PrepareNext,
      index: this.currentStep,
    }

    // call prepareElement for coming element if available
    this.steps[this.currentStep + 1]?.prepareElement?.('next')
    // check if prepareElement wants to stop
    if (this.currentMovePrevented) {
      // this.currentStep += 1
      // this.next()
      return
    }

    this.handleNext()
  }

  /**
   * Moves to the previous step if possible
   * otherwise resets the overlay
   */
  public previous() {
    if (this.currentMovePrevented) {
      return
    }

    this.lastMovementRequested = {
      movement: MovementType.PreparePrevious,
      index: this.currentStep,
    }

    // call prepareElement for coming element if available
    this.steps[this.currentStep - 1]?.prepareElement?.('prev')
    // check if prepareElement wants to stop
    if (this.currentMovePrevented) {
      return
    }

    this.handlePrevious()
  }

  /**
   * Check if there is a next step
   */
  public hasNextStep() {
    return !!this.steps[this.currentStep + 1]
  }

  /**
   * Check if there is a previous step
   */
  public hasPreviousStep() {
    return !!this.steps[this.currentStep - 1]
  }

  /**
   * Resets the steps if any and clears the overlay
   * @param immediate immediately unmount overlay or animate out
   * @param exitReason report the reason reset is called to `onReset`. This string has no other functionallity and is purely of informational purpose inside `onReset`
   */
  public reset(immediate = false, exitReason: BoardingExitReason = 'cancel') {
    this.currentStep = 0
    this.isActivated = false
    this.overlay.clear(immediate, exitReason)
    this.removeEventListeners()
    // remove strict click handling classes, in case they got added
    document.body.classList.remove(CLASS_NO_CLICK_BODY, CLASS_STRICT_CLICK_BODY)
    // reset step tracking
    this.lastMovementRequested = undefined
    this.currentMovePrevented = false
  }

  /**
   * Checks if there is any highlighted element or not
   */
  public hasHighlightedElement() {
    return !!this.overlay.currentHighlightedElement
  }

  /**
   * Gets the currently highlighted element in overlay
   */
  public getHighlightedElement() {
    return this.overlay.currentHighlightedElement
  }

  /**
   * Gets the element that was highlighted before currently highlighted element
   */
  public getLastHighlightedElement() {
    return this.overlay.previouslyHighlightedElement
  }

  /**
   * Defines steps to be highlighted
   */
  public defineSteps(stepDefinitions: BoardingSteps) {
    this.steps = stepDefinitions
  }

  /**
   * Getter for steps property
   */
  public getSteps() {
    return this.steps
  }

  /**
   * Handle `start` logic
   */
  private handleStart(index: number) {
    const element = this.prepareElementFromStep(index)
    if (!element) {
      console.log(
        `The step with starting index ${index} could not resolve to an element.`
      )
      this.currentStep = 0
      this.options.onStart?.(undefined)
      this.next()
      return
    }

    this.currentStep = index
    this.options.onStart?.(element)
    this.activateBoarding(element)
  }

  /**
   * Handle `highlight` logic
   */
  private handleHighlight(selector: HighlightSelector) {
    // convert argument to step definition
    const stepDefinition: BoardingStepDefinition =
      typeof selector === 'object' && 'element' in selector
        ? selector
        : { element: selector }

    const element = this.prepareElementFromStep(stepDefinition)
    if (!element) {
      console.log(
        `The step with element ${stepDefinition.element} could not resolve to an element.`
      )
      this.next()
      // this.handleNext()
      return
    }

    this.activateBoarding(element)
  }

  /**
   * Handle `next` step event
   */
  private handleNext() {
    this.lastMovementRequested = {
      movement: MovementType.Next,
      index: this.currentStep,
    }

    // Call the bound `onNext` handler if available
    const currentElem = this.prepareElementFromStep(this.currentStep)

    if (!currentElem) {
      console.log(
        `The step with index ${this.currentStep} could not resolve to an element.`
      )
      // this.reset(false, 'cancel')
      // return
    }

    currentElem?.onNext()

    if (this.currentMovePrevented) {
      return
    }

    this.moveNext()
  }

  /**
   * Handle `previous` step event
   */
  private handlePrevious() {
    this.lastMovementRequested = {
      movement: MovementType.Previous,
      index: this.currentStep,
    }

    // Call the bound `onPrevious` handler if available
    const currentStep = this.prepareElementFromStep(this.currentStep)

    currentStep?.onPrevious()

    if (this.currentMovePrevented) {
      return
    }

    this.movePrevious()
  }

  /**
   * Move to next element (after all other internal logic has completed)
   */
  private moveNext() {
    const nextElem = this.prepareElementFromStep(this.currentStep + 1)
    if (!nextElem) {
      const isLast = !this.hasNextStep()
      if (isLast) {
        this.reset(false, 'finish')
        return
      }
      this.currentStep += 1
      this.next()
      return
    }

    this.setStrictClickHandlingRules(nextElem)
    this.overlay.highlight(nextElem)
    this.currentStep += 1
  }

  /**
   * Move to preivous element (after all other internal logic has completed)
   */
  private movePrevious() {
    const previousElem = this.prepareElementFromStep(this.currentStep - 1)
    if (!previousElem) {
      if (!this.hasPreviousStep()) {
        this.currentStep = 0
        this.next()
        return
      }
      this.currentStep -= 1
      this.previous()
      return
    }

    this.setStrictClickHandlingRules(previousElem)
    this.overlay.highlight(previousElem)
    this.currentStep -= 1
  }

  /**
   * Everything that needs to happen everytime boarding is activated (started tour, or highlighted specific element)
   */
  private activateBoarding(element: HighlightElement) {
    // attach eventListeners BEFORE setting highlighting element
    this.attachEventListeners()

    this.isActivated = true
    this.setStrictClickHandlingRules(element)
    this.overlay.highlight(element)
  }

  /**
   * Defines the current rules for which elements are allowed to be clicked
   * @param element HighlightElement for the current step
   */
  private setStrictClickHandlingRules(element: HighlightElement) {
    // set body classes
    const customStrictHandling = element.getStrictClickHandling()
    const strictClickHandling =
      customStrictHandling === undefined
        ? this.options.strictClickHandling
        : customStrictHandling

    document.body.classList.remove(CLASS_NO_CLICK_BODY, CLASS_STRICT_CLICK_BODY)
    if (strictClickHandling === 'block-all') {
      document.body.classList.add(CLASS_NO_CLICK_BODY)
    } else if (strictClickHandling) {
      document.body.classList.add(CLASS_STRICT_CLICK_BODY)
    }
  }

  /**
   * Binds any DOM events listeners
   * @todo: add throttling in all the listeners
   */
  private attachEventListeners() {
    window.addEventListener('keyup', this.onKeyUp, false)

    // Binding both touch and click results in popup getting shown and then immediately get hidden.
    // Adding the check to not bind the click event if the touch is supported i.e. on mobile devices
    // Issue: https://github.com/kamranahmedse/driver.js/issues/150
    if (!('ontouchstart' in document.documentElement)) {
      window.addEventListener('click', this.onClick, false)
    } else {
      window.addEventListener('touchstart', this.onClick, false)
    }
  }

  /**
   * Removes all DOM events listeners
   */
  private removeEventListeners() {
    window.removeEventListener('keyup', this.onKeyUp, false)

    window.removeEventListener('click', this.onClick, false)
    window.removeEventListener('touchstart', this.onClick, false)
  }

  /**
   * Removes the popover if clicked outside the highlighted element
   * or outside the
   */
  private onClick(e: MouseEvent | TouchEvent) {
    if (!this.overlay.currentHighlightedElement) {
      return
    }
    assertIsElement(e.target)

    const highlightedElement = this.overlay.currentHighlightedElement
    const clickedHighlightedElement = highlightedElement.getElement().contains(e.target)

    const clickedUnknown = !clickedHighlightedElement

    // with strict click handling any click that is not the active element (or a UI element of boarding.js) is ignored
    if (this.options.strictClickHandling && clickedUnknown) {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()
      return
    }
  }

  /**
   * Clears the overlay on escape key process
   */
  private onKeyUp(event: KeyboardEvent) {
    event.preventDefault()
    event.stopPropagation()

    // Ignore if boarding is not active or keyboard control is disabled
    if (!this.isActivated || !this.options.keyboardControl) {
      return
    }

    // If escape was pressed and it is allowed to click outside to close -> reset
    if (event.key === 'Escape' && this.options.allowClose) {
      this.reset(false, 'cancel')
      return
    }

    // Ignore if there is no highlighted element or there is a highlighted element
    // without popover or if the popover does not allow buttons or if the buttons are disabled
    const highlightedElement = this.getHighlightedElement()
    const popover = highlightedElement?.getPopover()
    const popoverShowBtns = popover?.getShowButtons()
    const popoverDisabledBtns = popover?.getDisabledButtons()

    if (!popoverShowBtns) {
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      if (
        !popoverDisabledBtns?.includes('next') &&
        (popoverShowBtns === true || popoverShowBtns.includes('next'))
      ) {
        this.next()
      }
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      if (
        !popoverDisabledBtns?.includes('previous') &&
        (popoverShowBtns === true || popoverShowBtns.includes('previous'))
      ) {
        this.previous()
      }
    }
  }

  /**
   * Prepares the step received from the user and returns an instance
   * of HighlightElement
   * @param currentStepOrIndex An index is expected in case the its a step from the steps array. Otherwise a full step definition can be passed as a one-off case
   */
  private prepareElementFromStep(currentStepOrIndex: number | BoardingStepDefinition) {
    const currentStep =
      typeof currentStepOrIndex === 'number'
        ? (this.steps[currentStepOrIndex] as BoardingStepDefinition | undefined)
        : currentStepOrIndex
    const index = typeof currentStepOrIndex === 'number' ? currentStepOrIndex : 0
    const stepsCount = typeof currentStepOrIndex === 'number' ? this.steps.length : 1

    // we reached the end or maybe the user called "previous" on the first element
    if (currentStep === undefined) {
      return null
    }

    // If the given element is a query selector or a DOM element?
    const domElement =
      typeof currentStep.element === 'string'
        ? document.querySelector<HTMLElement>(currentStep.element)
        : currentStep.element
    if (!domElement) {
      console.warn(`Element to highlight ${currentStep.element} not found`)
      return null
    }

    let popover: Popover | null = null
    if (currentStep.popover?.title) {
      const mergedClassNames = [this.options.className, currentStep.popover.className]
        .filter(c => c)
        .join(' ')

      popover = new Popover({
        // general options
        padding: this.options.padding,
        offset: this.options.offset,
        animate: this.options.animate,
        meta: currentStep.meta,
        scrollIntoViewOptions:
          currentStep.scrollIntoViewOptions === undefined
            ? this.options.scrollIntoViewOptions
            : currentStep.scrollIntoViewOptions,
        // popover options
        title: currentStep.popover.title,
        description: currentStep.popover.description,
        // hybrid options
        prefferedSide: currentStep.popover.prefferedSide || this.options.prefferedSide,
        alignment: currentStep.popover.alignment || this.options.alignment,
        showButtons:
          currentStep.popover.showButtons === undefined
            ? this.options.showButtons
            : currentStep.popover.showButtons,
        disableButtons:
          currentStep.popover.disableButtons === undefined
            ? this.options.disableButtons
            : currentStep.popover.disableButtons,
        onPopoverRender:
          currentStep.popover.onPopoverRender === undefined
            ? this.options.onPopoverRender
            : currentStep.popover.onPopoverRender,
        doneBtnText: currentStep.popover.doneBtnText || this.options.doneBtnText,
        closeBtnText: currentStep.popover.closeBtnText || this.options.closeBtnText,
        nextBtnText: currentStep.popover.nextBtnText || this.options.nextBtnText,
        startBtnText: currentStep.popover.startBtnText || this.options.startBtnText,
        prevBtnText: currentStep.popover.prevBtnText || this.options.prevBtnText,
        className: mergedClassNames,
        // inferred options
        totalCount: stepsCount,
        currentIndex: index,
        isFirst: index === 0,
        isLast: stepsCount === 0 || index === stepsCount - 1, // Only one item or last item
        // click events
        onNextClick: () => {
          this.next()
        },
        onPreviousClick: () => {
          this.previous()
        },
        onCloseClick: () => {
          this.reset(false, 'cancel')
        },
      })
    }

    return new HighlightElement({
      highlightDomElement: domElement,
      options: {
        scrollIntoViewOptions:
          currentStep.scrollIntoViewOptions === undefined
            ? this.options.scrollIntoViewOptions
            : currentStep.scrollIntoViewOptions,
        onBeforeHighlighted:
          currentStep.onBeforeHighlighted || this.options.onBeforeHighlighted,
        onHighlighted: currentStep.onHighlighted || this.options.onHighlighted,
        onDeselected: currentStep.onDeselected || this.options.onDeselected,
        onNext: currentStep.onNext || this.options.onNext,
        onPrevious: currentStep.onPrevious || this.options.onPrevious,
        strictClickHandling: currentStep.strictClickHandling,
        padding: currentStep.padding, // note this is ONLY the stepLvl padding, the "custom padding", so we can later check if it exists using getCustomPadding
        radius: currentStep.radius, // note this is ONLY the stepLvl radius, the "custom radius", so we can later check if it exists using getCustomRadius
      },
      popover,
    })
  }
}

export default Boarding
