/**
 * Detect Element Resize.
 * https://github.com/sdecima/javascript-detect-element-resize
 * Sebastian Decima
 *
 * Forked from version 0.5.3; includes the following modifications:
 * 1) Guard against unsafe 'window' and 'document' references (to support SSR).
 * 2) Defer initialization code via a top-level function wrapper (to support SSR).
 * 3) Avoid unnecessary reflows by not measuring size for scroll events bubbling from children.
 * 4) Add nonce for style element.
 * 5) Use 'export' statement over 'module.exports' assignment
 **/

// Check `document` and `window` in case of server-side rendering
let windowObject
if (typeof window !== 'undefined') {
  windowObject = window

  // eslint-disable-next-line no-restricted-globals
} else if (typeof self !== 'undefined') {
  // eslint-disable-next-line no-restricted-globals
  windowObject = self
} else {
  windowObject = global
}

let cancelFrame = null
let requestFrame = null

const TIMEOUT_DURATION = 20

const clearTimeoutFn = windowObject.clearTimeout
const setTimeoutFn = windowObject.setTimeout

const cancelAnimationFrameFn =
  windowObject.cancelAnimationFrame ||
  windowObject.mozCancelAnimationFrame ||
  windowObject.webkitCancelAnimationFrame

const requestAnimationFrameFn =
  windowObject.requestAnimationFrame ||
  windowObject.mozRequestAnimationFrame ||
  windowObject.webkitRequestAnimationFrame

if (cancelAnimationFrameFn == null || requestAnimationFrameFn == null) {
  // For environments that don't support animation frame,
  // fallback to a setTimeout based approach.
  cancelFrame = clearTimeoutFn
  requestFrame = function requestAnimationFrameViaSetTimeout(callback) {
    return setTimeoutFn(callback, TIMEOUT_DURATION)
  }
} else {
  // Counter intuitively, environments that support animation frames can be trickier.
  // Chrome's "Throttle non-visible cross-origin iframes" flag can prevent rAFs from being called.
  // In this case, we should fallback to a setTimeout() implementation.
  cancelFrame = function cancelFrame([animationFrameID, timeoutID]) {
    cancelAnimationFrameFn(animationFrameID)
    clearTimeoutFn(timeoutID)
  }
  requestFrame = function requestAnimationFrameWithSetTimeoutFallback(callback) {
    const animationFrameID = requestAnimationFrameFn(function animationFrameCallback() {
      // eslint-disable-next-line no-use-before-define
      clearTimeoutFn(timeoutID)
      callback()
    })

    const timeoutID = setTimeoutFn(function timeoutCallback() {
      cancelAnimationFrameFn(animationFrameID)
      callback()
    }, TIMEOUT_DURATION)

    return [animationFrameID, timeoutID]
  }
}

function createDetectElementResize(nonce) {
  let animationKeyframes
  let animationName
  let animationStartEvent
  let animationStyle
  let checkTriggers
  let resetTriggers
  let scrollListener

  const attachEvent = typeof document !== 'undefined' && document.attachEvent
  if (!attachEvent) {
    resetTriggers = function (element) {
      const triggers = element.__resizeTriggers__,
        expand = triggers.firstElementChild,
        contract = triggers.lastElementChild,
        expandChild = expand.firstElementChild
      contract.scrollLeft = contract.scrollWidth
      contract.scrollTop = contract.scrollHeight
      expandChild.style.width = expand.offsetWidth + 1 + 'px'
      expandChild.style.height = expand.offsetHeight + 1 + 'px'
      expand.scrollLeft = expand.scrollWidth
      expand.scrollTop = expand.scrollHeight
    }

    checkTriggers = function (element) {
      return (
        element.offsetWidth !== element.__resizeLast__.width ||
        element.offsetHeight !== element.__resizeLast__.height
      )
    }

    scrollListener = function (e) {
      // Don't measure (which forces) reflow for scrolls that happen inside of children!
      if (
        e.target.className &&
        typeof e.target.className.indexOf === 'function' &&
        e.target.className.indexOf('contract-trigger') < 0 &&
        e.target.className.indexOf('expand-trigger') < 0
      ) {
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const element = this
      resetTriggers(this)
      if (this.__resizeRAF__) {
        cancelFrame(this.__resizeRAF__)
      }
      this.__resizeRAF__ = requestFrame(function animationFrame() {
        if (checkTriggers(element)) {
          element.__resizeLast__.width = element.offsetWidth
          element.__resizeLast__.height = element.offsetHeight
          element.__resizeListeners__.forEach(function forEachResizeListener(fn) {
            fn.call(element, e)
          })
        }
      })
    }

    /* Detect CSS Animations support to detect element display/re-attach */
    let animation = false
    let keyframeprefix = ''
    animationStartEvent = 'animationstart'
    const domPrefixes = 'Webkit Moz O ms'.split(' ')
    let startEvents =
      'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' ')
    let pfx = ''
    {
      const elm = document.createElement('fakeelement')
      if (elm.style.animationName !== undefined) {
        animation = true
      }

      if (animation === false) {
        for (let i = 0; i < domPrefixes.length; i++) {
          if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
            pfx = domPrefixes[i]
            keyframeprefix = '-' + pfx.toLowerCase() + '-'
            animationStartEvent = startEvents[i]
            animation = true
            break
          }
        }
      }
    }

    animationName = 'resizeanim'
    animationKeyframes =
      '@' +
      keyframeprefix +
      'keyframes ' +
      animationName +
      ' { from { opacity: 0; } to { opacity: 0; } } '
    animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; '
  }

  const createStyles = function (doc) {
    if (!doc.getElementById('detectElementResize')) {
      //opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
      const css =
          (animationKeyframes ? animationKeyframes : '') +
          '.resize-triggers { ' +
          (animationStyle ? animationStyle : '') +
          'visibility: hidden; opacity: 0; } ' +
          '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
        head = doc.head || doc.getElementsByTagName('head')[0],
        style = doc.createElement('style')

      style.id = 'detectElementResize'
      style.type = 'text/css'

      if (nonce != null) {
        style.setAttribute('nonce', nonce)
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css
      } else {
        style.appendChild(doc.createTextNode(css))
      }

      head.appendChild(style)
    }
  }

  const addResizeListener = function (element, fn) {
    if (attachEvent) {
      element.attachEvent('onresize', fn)
    } else {
      if (!element.__resizeTriggers__) {
        const doc = element.ownerDocument
        const elementStyle = windowObject.getComputedStyle(element)
        if (elementStyle && elementStyle.position === 'static') {
          element.style.position = 'relative'
        }
        createStyles(doc)
        element.__resizeLast__ = {}
        element.__resizeListeners__ = []
        ;(element.__resizeTriggers__ = doc.createElement('div')).className =
          'resize-triggers'
        const expandTrigger = doc.createElement('div')
        expandTrigger.className = 'expand-trigger'
        expandTrigger.appendChild(doc.createElement('div'))
        const contractTrigger = doc.createElement('div')
        contractTrigger.className = 'contract-trigger'
        element.__resizeTriggers__.appendChild(expandTrigger)
        element.__resizeTriggers__.appendChild(contractTrigger)
        element.appendChild(element.__resizeTriggers__)
        resetTriggers(element)
        element.addEventListener('scroll', scrollListener, true)

        /* Listen for a css animation to detect element display/re-attach */
        if (animationStartEvent) {
          element.__resizeTriggers__.__animationListener__ = function animationListener(
            e
          ) {
            if (e.animationName === animationName) {
              resetTriggers(element)
            }
          }
          element.__resizeTriggers__.addEventListener(
            animationStartEvent,
            element.__resizeTriggers__.__animationListener__
          )
        }
      }
      element.__resizeListeners__.push(fn)
    }
  }

  const removeResizeListener = function (element, fn) {
    if (attachEvent) {
      element.detachEvent('onresize', fn)
    } else {
      element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1)
      if (!element.__resizeListeners__.length) {
        element.removeEventListener('scroll', scrollListener, true)
        if (element.__resizeTriggers__.__animationListener__) {
          element.__resizeTriggers__.removeEventListener(
            animationStartEvent,
            element.__resizeTriggers__.__animationListener__
          )
          element.__resizeTriggers__.__animationListener__ = null
        }
        try {
          element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__)
        } catch (e) {
          // Preact compat; see developit/preact-compat/issues/228
        }
      }
    }
  }

  return {
    addResizeListener,
    removeResizeListener,
  }
}

export { createDetectElementResize }
