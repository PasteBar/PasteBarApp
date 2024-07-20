import { CLASS_CUTOUT } from '../common/constants'

export interface CutoutDefinition {
  hightlightBox: {
    x: number
    y: number
    width: number
    height: number
  }
  padding?: number
  radius?: number
  fillColor?: string
  opacity?: number
  animated?: boolean
}

export function generateSvgCutoutPathString({
  hightlightBox,
  padding = 0,
  radius = 0,
}: CutoutDefinition) {
  const windowX = window.innerWidth
  const windowY = window.innerHeight

  const highlightBoxWidthBase = hightlightBox.width + padding * 2
  const highlightBoxHeightBase = hightlightBox.height + padding * 2

  // prevent glitches when highlightBox is too small for radius
  const limitedRadius = Math.min(
    radius,
    highlightBoxWidthBase / 2,
    highlightBoxHeightBase / 2
  )
  // no value below 0 allowed + round down
  const normalizedRadius = Math.floor(Math.max(limitedRadius, 0))

  const highlightBoxX = hightlightBox.x - padding + normalizedRadius
  const highlightBoxY = hightlightBox.y - padding
  const highlightBoxWidth = highlightBoxWidthBase - normalizedRadius * 2
  const highlightBoxHeight = highlightBoxHeightBase - normalizedRadius * 2

  return `M${windowX},0L0,0L0,${windowY}L${windowX},${windowY}L${windowX},0Z
    M${highlightBoxX},${highlightBoxY} h${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},${normalizedRadius} v${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},${normalizedRadius} h-${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},-${normalizedRadius} v-${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},-${normalizedRadius} z`
}

export function createSvgCutout({
  hightlightBox,
  padding = 0,
  fillColor = 'rgb(0,0,0)',
  opacity = 1,
  animated = true,
}: CutoutDefinition) {
  const windowX = window.innerWidth
  const windowY = window.innerHeight

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add(CLASS_CUTOUT)
  if (animated) {
    svg.classList.add(`${CLASS_CUTOUT}-animated`)
  }
  svg.setAttribute('viewBox', `0 0 ${windowX} ${windowY}`)
  svg.setAttribute('xmlSpace', 'preserve')
  svg.setAttribute('xmlnsXlink', 'http://www.w3.org/1999/xlink')
  svg.setAttribute('version', '1.1')
  // https://github.com/josias-r/boarding.js/issues/10
  svg.setAttribute('preserveAspectRatio', 'xMinYMin slice')
  svg.style.fillRule = 'evenodd'
  svg.style.clipRule = 'evenodd'
  svg.style.strokeLinejoin = 'round'
  svg.style.strokeMiterlimit = '2'
  svg.style.zIndex = '10000'
  // styles

  // https://github.com/josias-r/boarding.js/issues/10
  // svg.style.width = "100%";
  // svg.style.height = "100%";

  const cutoutPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  // path
  cutoutPath.setAttribute('d', generateSvgCutoutPathString({ hightlightBox, padding }))
  // path styles
  cutoutPath.style.fill = fillColor
  cutoutPath.style.opacity = `${opacity}`
  cutoutPath.style.pointerEvents = 'auto'
  cutoutPath.style.cursor = 'default'

  svg.appendChild(cutoutPath)
  return svg
}
