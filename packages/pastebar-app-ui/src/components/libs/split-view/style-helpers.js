import { cx } from '@emotion/css'
import { assertNever, isNumber } from 'emery'

export { cache, injectGlobal, keyframes } from '@emotion/css'
export { classNames, tokenSchema, transition }

/**
 * Do not edit directly
 * Generated on Tue, 08 Aug 2023 02:28:13 GMT
 */

const tokenSchema = {
  animation: {
    duration: {
      short: 'var(--ksv-animation-duration-short)',
      regular: 'var(--ksv-animation-duration-regular)',
      long: 'var(--ksv-animation-duration-long)',
      xlong: 'var(--ksv-animation-duration-xlong)',
    },
    easing: {
      easeInOut: 'var(--ksv-animation-easing-ease-in-out)',
      easeIn: 'var(--ksv-animation-easing-ease-in)',
      easeOut: 'var(--ksv-animation-easing-ease-out)',
    },
  },
  size: {
    alias: {
      focusRing: 'var(--ksv-size-alias-focus-ring)',
      focusRingGap: 'var(--ksv-size-alias-focus-ring-gap)',
      singleLineHeight: 'var(--ksv-size-alias-single-line-height)',
      singleLineWidth: 'var(--ksv-size-alias-single-line-width)',
    },
    element: {
      xsmall: 'var(--ksv-size-element-xsmall)',
      small: 'var(--ksv-size-element-small)',
      regular: 'var(--ksv-size-element-regular)',
      medium: 'var(--ksv-size-element-medium)',
      large: 'var(--ksv-size-element-large)',
      xlarge: 'var(--ksv-size-element-xlarge)',
    },
    icon: {
      small: 'var(--ksv-size-icon-small)',
      regular: 'var(--ksv-size-icon-regular)',
      medium: 'var(--ksv-size-icon-medium)',
      large: 'var(--ksv-size-icon-large)',
    },
    container: {
      xsmall: 'var(--ksv-size-container-xsmall)',
      small: 'var(--ksv-size-container-small)',
      medium: 'var(--ksv-size-container-medium)',
      large: 'var(--ksv-size-container-large)',
      xlarge: 'var(--ksv-size-container-xlarge)',
    },
    dialog: {
      xsmall: 'var(--ksv-size-dialog-xsmall)',
      small: 'var(--ksv-size-dialog-small)',
      medium: 'var(--ksv-size-dialog-medium)',
      large: 'var(--ksv-size-dialog-large)',
    },
    border: {
      regular: 'var(--ksv-size-border-regular)',
      medium: 'var(--ksv-size-border-medium)',
      large: 'var(--ksv-size-border-large)',
    },
    radius: {
      full: 'var(--ksv-size-radius-full)',
      xsmall: 'var(--ksv-size-radius-xsmall)',
      small: 'var(--ksv-size-radius-small)',
      regular: 'var(--ksv-size-radius-regular)',
      medium: 'var(--ksv-size-radius-medium)',
      large: 'var(--ksv-size-radius-large)',
      xlarge: 'var(--ksv-size-radius-xlarge)',
    },
    shadow: {
      small: 'var(--ksv-size-shadow-small)',
      medium: 'var(--ksv-size-shadow-medium)',
      large: 'var(--ksv-size-shadow-large)',
    },
    space: {
      xsmall: 'var(--ksv-size-space-xsmall)',
      small: 'var(--ksv-size-space-small)',
      regular: 'var(--ksv-size-space-regular)',
      medium: 'var(--ksv-size-space-medium)',
      large: 'var(--ksv-size-space-large)',
      xlarge: 'var(--ksv-size-space-xlarge)',
      xxlarge: 'var(--ksv-size-space-xxlarge)',
    },
    scale: {
      0: 'var(--ksv-size-scale-0)',
      10: 'var(--ksv-size-scale-10)',
      25: 'var(--ksv-size-scale-25)',
      40: 'var(--ksv-size-scale-40)',
      50: 'var(--ksv-size-scale-50)',
      65: 'var(--ksv-size-scale-65)',
      75: 'var(--ksv-size-scale-75)',
      85: 'var(--ksv-size-scale-85)',
      100: 'var(--ksv-size-scale-100)',
      115: 'var(--ksv-size-scale-115)',
      125: 'var(--ksv-size-scale-125)',
      130: 'var(--ksv-size-scale-130)',
      150: 'var(--ksv-size-scale-150)',
      160: 'var(--ksv-size-scale-160)',
      175: 'var(--ksv-size-scale-175)',
      200: 'var(--ksv-size-scale-200)',
      225: 'var(--ksv-size-scale-225)',
      250: 'var(--ksv-size-scale-250)',
      275: 'var(--ksv-size-scale-275)',
      300: 'var(--ksv-size-scale-300)',
      325: 'var(--ksv-size-scale-325)',
      350: 'var(--ksv-size-scale-350)',
      400: 'var(--ksv-size-scale-400)',
      450: 'var(--ksv-size-scale-450)',
      500: 'var(--ksv-size-scale-500)',
      550: 'var(--ksv-size-scale-550)',
      600: 'var(--ksv-size-scale-600)',
      675: 'var(--ksv-size-scale-675)',
      700: 'var(--ksv-size-scale-700)',
      800: 'var(--ksv-size-scale-800)',
      900: 'var(--ksv-size-scale-900)',
      1000: 'var(--ksv-size-scale-1000)',
      1200: 'var(--ksv-size-scale-1200)',
      1250: 'var(--ksv-size-scale-1250)',
      1600: 'var(--ksv-size-scale-1600)',
      1700: 'var(--ksv-size-scale-1700)',
      2000: 'var(--ksv-size-scale-2000)',
      2400: 'var(--ksv-size-scale-2400)',
      3000: 'var(--ksv-size-scale-3000)',
      3400: 'var(--ksv-size-scale-3400)',
      3600: 'var(--ksv-size-scale-3600)',
      4600: 'var(--ksv-size-scale-4600)',
      5000: 'var(--ksv-size-scale-5000)',
      6000: 'var(--ksv-size-scale-6000)',
    },
  },
  typography: {
    fontFamily: {
      base: 'var(--ksv-typography-font-family-base)',
      code: 'var(--ksv-typography-font-family-code)',
    },
    fontWeight: {
      regular: 'var(--ksv-typography-font-weight-regular)',
      medium: 'var(--ksv-typography-font-weight-medium)',
      semibold: 'var(--ksv-typography-font-weight-semibold)',
      bold: 'var(--ksv-typography-font-weight-bold)',
    },
    lineheight: {
      large: 'var(--ksv-typography-lineheight-large)',
      medium: 'var(--ksv-typography-lineheight-medium)',
      small: 'var(--ksv-typography-lineheight-small)',
    },
    text: {
      small: {
        size: 'var(--ksv-typography-text-small-size)',
        lineheight: 'var(--ksv-typography-text-small-lineheight)',
        baselineTrim: 'var(--ksv-typography-text-small-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-text-small-capheight-trim)',
        capheight: 'var(--ksv-typography-text-small-capheight)',
      },
      regular: {
        size: 'var(--ksv-typography-text-regular-size)',
        lineheight: 'var(--ksv-typography-text-regular-lineheight)',
        baselineTrim: 'var(--ksv-typography-text-regular-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-text-regular-capheight-trim)',
        capheight: 'var(--ksv-typography-text-regular-capheight)',
      },
      medium: {
        size: 'var(--ksv-typography-text-medium-size)',
        lineheight: 'var(--ksv-typography-text-medium-lineheight)',
        baselineTrim: 'var(--ksv-typography-text-medium-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-text-medium-capheight-trim)',
        capheight: 'var(--ksv-typography-text-medium-capheight)',
      },
      large: {
        size: 'var(--ksv-typography-text-large-size)',
        lineheight: 'var(--ksv-typography-text-large-lineheight)',
        baselineTrim: 'var(--ksv-typography-text-large-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-text-large-capheight-trim)',
        capheight: 'var(--ksv-typography-text-large-capheight)',
      },
    },
    heading: {
      small: {
        size: 'var(--ksv-typography-heading-small-size)',
        lineheight: 'var(--ksv-typography-heading-small-lineheight)',
        baselineTrim: 'var(--ksv-typography-heading-small-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-heading-small-capheight-trim)',
        capheight: 'var(--ksv-typography-heading-small-capheight)',
      },
      regular: {
        size: 'var(--ksv-typography-heading-regular-size)',
        lineheight: 'var(--ksv-typography-heading-regular-lineheight)',
        baselineTrim: 'var(--ksv-typography-heading-regular-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-heading-regular-capheight-trim)',
        capheight: 'var(--ksv-typography-heading-regular-capheight)',
      },
      medium: {
        size: 'var(--ksv-typography-heading-medium-size)',
        lineheight: 'var(--ksv-typography-heading-medium-lineheight)',
        baselineTrim: 'var(--ksv-typography-heading-medium-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-heading-medium-capheight-trim)',
        capheight: 'var(--ksv-typography-heading-medium-capheight)',
      },
      large: {
        size: 'var(--ksv-typography-heading-large-size)',
        lineheight: 'var(--ksv-typography-heading-large-lineheight)',
        baselineTrim: 'var(--ksv-typography-heading-large-baseline-trim)',
        capheightTrim: 'var(--ksv-typography-heading-large-capheight-trim)',
        capheight: 'var(--ksv-typography-heading-large-capheight)',
      },
    },
  },
  color: {
    alias: {
      blanket: 'var(--ksv-color-alias-blanket)',
      backgroundIdle: 'var(--ksv-color-alias-background-idle)',
      backgroundDisabled: 'var(--ksv-color-alias-background-disabled)',
      backgroundHovered: 'var(--ksv-color-alias-background-hovered)',
      backgroundFocused: 'var(--ksv-color-alias-background-focused)',
      backgroundPressed: 'var(--ksv-color-alias-background-pressed)',
      backgroundSelected: 'var(--ksv-color-alias-background-selected)',
      backgroundSelectedHovered: 'var(--ksv-color-alias-background-selected-hovered)',
      focusRing: 'var(--ksv-color-alias-focus-ring)',
      borderIdle: 'var(--ksv-color-alias-border-idle)',
      borderHovered: 'var(--ksv-color-alias-border-hovered)',
      borderPressed: 'var(--ksv-color-alias-border-pressed)',
      borderFocused: 'var(--ksv-color-alias-border-focused)',
      borderDisabled: 'var(--ksv-color-alias-border-disabled)',
      borderSelected: 'var(--ksv-color-alias-border-selected)',
      borderInvalid: 'var(--ksv-color-alias-border-invalid)',
      foregroundIdle: 'var(--ksv-color-alias-foreground-idle)',
      foregroundHovered: 'var(--ksv-color-alias-foreground-hovered)',
      foregroundPressed: 'var(--ksv-color-alias-foreground-pressed)',
      foregroundFocused: 'var(--ksv-color-alias-foreground-focused)',
      foregroundDisabled: 'var(--ksv-color-alias-foreground-disabled)',
      foregroundSelected: 'var(--ksv-color-alias-foreground-selected)',
    },
    background: {
      canvas: 'var(--ksv-color-background-canvas)',
      surface: 'var(--ksv-color-background-surface)',
      surfaceSecondary: 'var(--ksv-color-background-surface-secondary)',
      surfaceTertiary: 'var(--ksv-color-background-surface-tertiary)',
      inverse: 'var(--ksv-color-background-inverse)',
      accent: 'var(--ksv-color-background-accent)',
      accentEmphasis: 'var(--ksv-color-background-accent-emphasis)',
      positive: 'var(--ksv-color-background-positive)',
      positiveEmphasis: 'var(--ksv-color-background-positive-emphasis)',
      caution: 'var(--ksv-color-background-caution)',
      cautionEmphasis: 'var(--ksv-color-background-caution-emphasis)',
      critical: 'var(--ksv-color-background-critical)',
      criticalEmphasis: 'var(--ksv-color-background-critical-emphasis)',
      pending: 'var(--ksv-color-background-pending)',
      pendingEmphasis: 'var(--ksv-color-background-pending-emphasis)',
      highlight: 'var(--ksv-color-background-highlight)',
      highlightEmphasis: 'var(--ksv-color-background-highlight-emphasis)',
    },
    border: {
      muted: 'var(--ksv-color-border-muted)',
      neutral: 'var(--ksv-color-border-neutral)',
      emphasis: 'var(--ksv-color-border-emphasis)',
      accent: 'var(--ksv-color-border-accent)',
      positive: 'var(--ksv-color-border-positive)',
      caution: 'var(--ksv-color-border-caution)',
      critical: 'var(--ksv-color-border-critical)',
      pending: 'var(--ksv-color-border-pending)',
      highlight: 'var(--ksv-color-border-highlight)',
    },
    foreground: {
      neutral: 'var(--ksv-color-foreground-neutral)',
      neutralEmphasis: 'var(--ksv-color-foreground-neutral-emphasis)',
      neutralSecondary: 'var(--ksv-color-foreground-neutral-secondary)',
      neutralTertiary: 'var(--ksv-color-foreground-neutral-tertiary)',
      onEmphasis: 'var(--ksv-color-foreground-on-emphasis)',
      inverse: 'var(--ksv-color-foreground-inverse)',
      inverseSecondary: 'var(--ksv-color-foreground-inverse-secondary)',
      accent: 'var(--ksv-color-foreground-accent)',
      positive: 'var(--ksv-color-foreground-positive)',
      caution: 'var(--ksv-color-foreground-caution)',
      critical: 'var(--ksv-color-foreground-critical)',
      pending: 'var(--ksv-color-foreground-pending)',
      highlight: 'var(--ksv-color-foreground-highlight)',
    },
    shadow: {
      muted: 'var(--ksv-color-shadow-muted)',
      regular: 'var(--ksv-color-shadow-regular)',
      emphasis: 'var(--ksv-color-shadow-emphasis)',
    },
    scale: {
      black: 'var(--ksv-color-scale-black)',
      white: 'var(--ksv-color-scale-white)',
      amber1: 'var(--ksv-color-scale-amber1)',
      amber2: 'var(--ksv-color-scale-amber2)',
      amber3: 'var(--ksv-color-scale-amber3)',
      amber4: 'var(--ksv-color-scale-amber4)',
      amber5: 'var(--ksv-color-scale-amber5)',
      amber6: 'var(--ksv-color-scale-amber6)',
      amber7: 'var(--ksv-color-scale-amber7)',
      amber8: 'var(--ksv-color-scale-amber8)',
      amber9: 'var(--ksv-color-scale-amber9)',
      amber10: 'var(--ksv-color-scale-amber10)',
      amber11: 'var(--ksv-color-scale-amber11)',
      green1: 'var(--ksv-color-scale-green1)',
      green2: 'var(--ksv-color-scale-green2)',
      green3: 'var(--ksv-color-scale-green3)',
      green4: 'var(--ksv-color-scale-green4)',
      green5: 'var(--ksv-color-scale-green5)',
      green6: 'var(--ksv-color-scale-green6)',
      green7: 'var(--ksv-color-scale-green7)',
      green8: 'var(--ksv-color-scale-green8)',
      green9: 'var(--ksv-color-scale-green9)',
      green10: 'var(--ksv-color-scale-green10)',
      green11: 'var(--ksv-color-scale-green11)',
      indigo1: 'var(--ksv-color-scale-indigo1)',
      indigo2: 'var(--ksv-color-scale-indigo2)',
      indigo3: 'var(--ksv-color-scale-indigo3)',
      indigo4: 'var(--ksv-color-scale-indigo4)',
      indigo5: 'var(--ksv-color-scale-indigo5)',
      indigo6: 'var(--ksv-color-scale-indigo6)',
      indigo7: 'var(--ksv-color-scale-indigo7)',
      indigo8: 'var(--ksv-color-scale-indigo8)',
      indigo9: 'var(--ksv-color-scale-indigo9)',
      indigo10: 'var(--ksv-color-scale-indigo10)',
      indigo11: 'var(--ksv-color-scale-indigo11)',
      pink1: 'var(--ksv-color-scale-pink1)',
      pink2: 'var(--ksv-color-scale-pink2)',
      pink3: 'var(--ksv-color-scale-pink3)',
      pink4: 'var(--ksv-color-scale-pink4)',
      pink5: 'var(--ksv-color-scale-pink5)',
      pink6: 'var(--ksv-color-scale-pink6)',
      pink7: 'var(--ksv-color-scale-pink7)',
      pink8: 'var(--ksv-color-scale-pink8)',
      pink9: 'var(--ksv-color-scale-pink9)',
      pink10: 'var(--ksv-color-scale-pink10)',
      pink11: 'var(--ksv-color-scale-pink11)',
      purple1: 'var(--ksv-color-scale-purple1)',
      purple2: 'var(--ksv-color-scale-purple2)',
      purple3: 'var(--ksv-color-scale-purple3)',
      purple4: 'var(--ksv-color-scale-purple4)',
      purple5: 'var(--ksv-color-scale-purple5)',
      purple6: 'var(--ksv-color-scale-purple6)',
      purple7: 'var(--ksv-color-scale-purple7)',
      purple8: 'var(--ksv-color-scale-purple8)',
      purple9: 'var(--ksv-color-scale-purple9)',
      purple10: 'var(--ksv-color-scale-purple10)',
      purple11: 'var(--ksv-color-scale-purple11)',
      red1: 'var(--ksv-color-scale-red1)',
      red2: 'var(--ksv-color-scale-red2)',
      red3: 'var(--ksv-color-scale-red3)',
      red4: 'var(--ksv-color-scale-red4)',
      red5: 'var(--ksv-color-scale-red5)',
      red6: 'var(--ksv-color-scale-red6)',
      red7: 'var(--ksv-color-scale-red7)',
      red8: 'var(--ksv-color-scale-red8)',
      red9: 'var(--ksv-color-scale-red9)',
      red10: 'var(--ksv-color-scale-red10)',
      red11: 'var(--ksv-color-scale-red11)',
      slate1: 'var(--ksv-color-scale-slate1)',
      slate2: 'var(--ksv-color-scale-slate2)',
      slate3: 'var(--ksv-color-scale-slate3)',
      slate4: 'var(--ksv-color-scale-slate4)',
      slate5: 'var(--ksv-color-scale-slate5)',
      slate6: 'var(--ksv-color-scale-slate6)',
      slate7: 'var(--ksv-color-scale-slate7)',
      slate8: 'var(--ksv-color-scale-slate8)',
      slate9: 'var(--ksv-color-scale-slate9)',
      slate10: 'var(--ksv-color-scale-slate10)',
      slate11: 'var(--ksv-color-scale-slate11)',
    },
  },
}

/** Helper function for resolving animation tokens.  */
function transition(prop, options = {}) {
  let { delay = 0, duration = 'short', easing = 'easeInOut' } = options
  let easingValue = easing === 'linear' ? 'linear' : tokenSchema.animation.easing[easing]
  let durationValue = resolveDuration(duration)
  if (Array.isArray(prop)) {
    return prop.map(p => transition(p, options)).join(', ')
  }
  return (
    `${prop} ${durationValue} ${easingValue}` +
    (delay ? ` ${resolveDuration(delay)}` : '')
  )
}
function resolveDuration(duration) {
  return isNumber(duration) ? `${duration}ms` : tokenSchema.animation.duration[duration]
}

const classNamePrefix = 'ksv'
const resetClassName = voussoirClassName('reset')
function voussoirClassName(className) {
  return `${classNamePrefix}:${className}`
}

/**
 * A thin wrapper around [Emotion's `cx`
 * function](https://emotion.sh/docs/@emotion/css#cx) that includes the reset
 * class name.
 */
function classNames(...inputs) {
  let resolved = cx(inputs)
  if (resolved.includes(resetClassName)) {
    return resolved
  }
  return cx(resetClassName, resolved)
}

function mapResponsiveValue(propResolver, value) {
  if (value == null) {
    return null
  }

  // NOTE: grid layout primitive supports array values
  if (typeof value === 'object' && !Array.isArray(value)) {
    return objectToArray(propResolver, value)
  }
  return propResolver(value)
}
function objectToArray(propResolver, value) {
  const valueArray = []
  for (let i = 0; i < breakpointNames.length; i++) {
    const key = breakpointNames[i]
    valueArray.push(value[key] != null ? propResolver(value[key]) : null)
  }
  return valueArray
}

// Utils
// ----------------------------------------------------------------------------
function get(val, path) {
  for (const part of path.split('.')) {
    if (
      typeof val !== 'object' ||
      val === null ||
      !Object.prototype.hasOwnProperty.call(val, part)
    ) {
      return
    }
    val = val[part]
  }
  return val
}
function maybeTokenByKey(path, keyOrValue) {
  var _get
  if (typeof keyOrValue !== 'string') {
    return keyOrValue
  }

  // let folks go rouge, why not?
  path = keyOrValue.includes('.') ? keyOrValue : `${path}.${keyOrValue}`
  return (_get = get(tokenSchema, path)) !== null && _get !== void 0 ? _get : keyOrValue
}
function resolvePropWithPath(prop, path) {
  const resolver = value => maybeTokenByKey(path, value)
  return [prop, resolver]
}

// default
const identity = value => value
function resolveProp(prop, fn = identity) {
  return [prop, fn]
}

// common
function border(prop) {
  const resolver = value => {
    const color = maybeTokenByKey('color.border', value)
    return `${tokenSchema.size.border.regular} solid ${color}`
  }
  return [prop, resolver]
}
function isDimensionKey(value) {
  let [prop, key] = value.split('.')
  if (!prop || !key) {
    return false
  }
  // @ts-expect-error
  return !!tokenSchema.size[prop][key]
}
function sizeResolver(value) {
  if (typeof value === 'number') {
    if (value === 0) {
      return `${value}px`
    }
    assertNever(value)
  }
  if (isDimensionKey(value)) {
    let [prop, key] = value.split('.')
    // @ts-expect-error
    return tokenSchema.size[prop][key]
  }
  if (
    value === 'auto' ||
    value === 'inherit' ||
    value === '100%' ||
    value === '100vh' ||
    value === '100vw'
  ) {
    return value
  }
  assertNever(value)
}
function size(cssProp) {
  return [cssProp, sizeResolver]
}
function space(prop) {
  return resolvePropWithPath(prop, 'size.space')
}
function radius(prop) {
  return resolvePropWithPath(prop, 'size.radius')
}

// Config
// ----------------------------------------------------------------------------

const defaultStyleProps = {
  // color
  backgroundColor: resolvePropWithPath('backgroundColor', 'color.background'),
  boxShadow: ['boxShadow', boxShadowResolver],
  // dimension
  height: size('height'),
  maxHeight: size('maxHeight'),
  minHeight: size('minHeight'),
  maxWidth: size('maxWidth'),
  minWidth: size('minWidth'),
  width: size('width'),
  // space
  margin: space('margin'),
  marginStart: space('marginInlineStart'),
  marginEnd: space('marginInlineEnd'),
  marginTop: space('marginBlockStart'),
  marginBottom: space('marginBlockEnd'),
  marginX: space('marginInline'),
  marginY: space('marginBlock'),
  padding: space('padding'),
  paddingStart: space('paddingInlineStart'),
  paddingEnd: space('paddingInlineEnd'),
  paddingTop: space('paddingBlockStart'),
  paddingBottom: space('paddingBlockEnd'),
  paddingX: space('paddingInline'),
  paddingY: space('paddingBlock'),
  // border
  border: border('border'),
  borderStart: border('borderInlineStart'),
  borderEnd: border('borderInlineEnd'),
  borderTop: border('borderTop'),
  borderBottom: border('borderBottom'),
  borderColor: resolvePropWithPath('borderColor', 'color.border'),
  borderStartColor: resolvePropWithPath('borderInlineStartColor', 'color.border'),
  borderEndColor: resolvePropWithPath('borderInlineEndColor', 'color.border'),
  borderTopColor: resolvePropWithPath('borderTopColor', 'color.border'),
  borderBottomColor: resolvePropWithPath('borderBottomColor', 'color.border'),
  borderStyle: resolveProp('borderStyle'),
  borderStartStyle: resolveProp('borderInlineStartStyle'),
  borderEndStyle: resolveProp('borderInlineEndStyle'),
  borderTopStyle: resolveProp('borderTopStyle'),
  borderBottomStyle: resolveProp('borderBottomStyle'),
  borderWidth: resolvePropWithPath('borderWidth', 'size.border'),
  borderStartWidth: resolvePropWithPath('borderInlineStartWidth', 'size.border'),
  borderEndWidth: resolvePropWithPath('borderInlineEndWidth', 'size.border'),
  borderTopWidth: resolvePropWithPath('borderTopWidth', 'size.border'),
  borderBottomWidth: resolvePropWithPath('borderBottomWidth', 'size.border'),
  borderRadius: radius('borderRadius'),
  borderTopStartRadius: radius('borderStartStartRadius'),
  borderTopEndRadius: radius('borderStartEndRadius'),
  borderBottomStartRadius: radius('borderEndStartRadius'),
  borderBottomEndRadius: radius('borderEndEndRadius'),
  borderTopRadius: radius(['borderStartStartRadius', 'borderStartEndRadius']),
  borderBottomRadius: radius(['borderEndStartRadius', 'borderEndEndRadius']),
  borderStartRadius: radius(['borderStartStartRadius', 'borderEndStartRadius']),
  borderEndRadius: radius(['borderEndEndRadius', 'borderStartEndRadius']),
  // position
  inset: space('inset'),
  insetBottom: space('insetBlockEnd'),
  insetEnd: space('insetInlineEnd'),
  insetStart: space('insetInlineStart'),
  insetTop: space('insetBlockStart'),
  insetX: space('insetInline'),
  insetY: space('insetBlock'),
  position: resolveProp('position'),
  zIndex: resolveProp('zIndex'),
  // flex child
  order: resolveProp('order'),
  alignSelf: resolveProp('alignSelf'),
  flex: resolveProp('flex', flexResolver),
  flexBasis: size('flexBasis'),
  flexGrow: resolveProp('flexGrow', flexResolver),
  flexShrink: resolveProp('flexShrink', flexResolver),
  justifySelf: resolveProp('justifySelf'),
  // grid child
  gridArea: resolveProp('gridArea'),
  gridColumn: resolveProp('gridColumn'),
  gridColumnEnd: resolveProp('gridColumnEnd'),
  gridColumnStart: resolveProp('gridColumnStart'),
  gridRow: resolveProp('gridRow'),
  gridRowEnd: resolveProp('gridRowEnd'),
  gridRowStart: resolveProp('gridRowStart'),
  // misc. non-theme related
  cursor: resolveProp('cursor'),
  opacity: resolveProp('opacity'),
  pointerEvents: resolveProp('pointerEvents'),
  overflow: resolveProp('overflow'),
  userSelect: resolveProp('userSelect'),
}

// Unique
// ----------------------------------------------------------------------------

function flexResolver(value) {
  if (typeof value === 'boolean') {
    return value ? '1' : undefined
  }
  return '' + value
}
function boxShadowResolver(value) {
  const sizeToColorKey = {
    small: 'muted',
    medium: 'regular',
    large: 'emphasis',
  }
  const [sizeKey, maybeColorKey] = value.split(' ')
  const color = maybeTokenByKey(
    'color.shadow',
    maybeColorKey !== null && maybeColorKey !== void 0
      ? maybeColorKey
      : sizeToColorKey[sizeKey]
  )
  const size = maybeTokenByKey('size.shadow', sizeKey)
  return `${size} ${color}`
}
