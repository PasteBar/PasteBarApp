import useIsomorphicLayoutEffect from './hooks/useIsomorphicEffect'
import useUniqueId from './hooks/useUniqueId'
import { PanelGroupContext } from './PanelContexts'
import {
  PanelCallbackRef,
  PanelData,
  PanelOnCollapse,
  PanelOnResize,
  Units,
} from './types'
import { getAvailableGroupSizePixels } from './utils/group'
import {
  createElement,
  CSSProperties,
  ElementType,
  ForwardedRef,
  forwardRef,
  ReactNode,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from './vendor/react'

export type PanelProps = {
  children?: ReactNode
  className?: string
  collapsedSize?: number
  collapsible?: boolean
  defaultSize?: number | null
  id?: string | null
  maxSize?: number | null
  minSizePixels?: number
  minSize?: number
  onCollapse?: PanelOnCollapse | null
  onResize?: PanelOnResize | null
  order?: number | null
  style?: CSSProperties
  tagName?: ElementType
}

export type ImperativePanelHandle = {
  collapse: () => void
  expand: () => void
  getCollapsed(): boolean
  getId(): string
  getSize(units?: Units): number
  getSizePixels(): number
  resize: (percentage: number, units?: Units) => void
}

function PanelWithForwardedRef({
  children = null,
  className: classNameFromProps = '',
  collapsedSize = 0,
  collapsible = false,
  defaultSize = null,
  forwardedRef,
  id: idFromProps = null,
  maxSize = null,
  minSizePixels,
  minSize,
  onCollapse = null,
  onResize = null,
  order = null,
  style: styleFromProps = {},
  tagName: Type = 'div',
}: PanelProps & {
  forwardedRef: ForwardedRef<ImperativePanelHandle>
}) {
  const context = useContext(PanelGroupContext)
  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`)
  }

  const panelId = useUniqueId(idFromProps)

  const {
    collapsePanel,
    expandPanel,
    getPanelSize,
    getPanelSizePixels,
    getPanelStyle,
    registerPanel,
    resizePanel,
    units,
    unregisterPanel,
  } = context

  if (minSize == null) {
    if (units === 'percentages') {
      // Mimics legacy default value for percentage based panel groups
      minSize = 10
    } else {
      // There is no meaningful minimum pixel default we can provide
      minSize = 0
    }
  }

  // Use a ref to guard against users passing inline props
  const callbacksRef = useRef<{
    onCollapse: PanelOnCollapse | null
    onResize: PanelOnResize | null
  }>({ onCollapse, onResize })
  useEffect(() => {
    callbacksRef.current.onCollapse = onCollapse
    callbacksRef.current.onResize = onResize
  })

  const style = getPanelStyle(panelId, defaultSize)

  const committedValuesRef = useRef<{
    size: number
  }>({
    size: parseSizeFromStyle(style),
  })

  const panelDataRef = useRef<{
    callbacksRef: PanelCallbackRef
    collapsedSize: number
    collapsible: boolean
    defaultSize: number | null
    id: string
    idWasAutoGenerated: boolean
    maxSize: number | null
    minSizePixels: number | undefined
    minSize: number
    order: number | null
  }>({
    callbacksRef,
    collapsedSize,
    collapsible,
    defaultSize,
    id: panelId,
    idWasAutoGenerated: idFromProps == null,
    maxSize,
    minSizePixels,
    minSize,
    order,
  })

  useIsomorphicLayoutEffect(() => {
    committedValuesRef.current.size = parseSizeFromStyle(style)

    panelDataRef.current.callbacksRef = callbacksRef
    panelDataRef.current.collapsedSize = collapsedSize
    panelDataRef.current.collapsible = collapsible
    panelDataRef.current.defaultSize = defaultSize
    panelDataRef.current.id = panelId
    panelDataRef.current.idWasAutoGenerated = idFromProps == null
    panelDataRef.current.maxSize = maxSize
    panelDataRef.current.minSize = minSize as number
    panelDataRef.current.minSizePixels = minSizePixels as number
    panelDataRef.current.order = order
  })

  useIsomorphicLayoutEffect(() => {
    registerPanel(panelId, panelDataRef as PanelData)

    return () => {
      unregisterPanel(panelId)
    }
  }, [order, panelId, registerPanel, unregisterPanel])

  useImperativeHandle(
    forwardedRef,
    () => ({
      collapse: () => collapsePanel(panelId),
      expand: () => expandPanel(panelId),
      getCollapsed() {
        return committedValuesRef.current.size === 0
      },
      getId() {
        return panelId
      },
      getSize(units) {
        return getPanelSize(panelId, units)
      },
      getSizePixels() {
        return getPanelSizePixels(panelId)
      },
      resize: (percentage: number, units) => resizePanel(panelId, percentage, units),
    }),
    [collapsePanel, expandPanel, getPanelSize, getPanelSizePixels, panelId, resizePanel]
  )

  return createElement(Type, {
    children,
    className: classNameFromProps,
    'data-panel': '',
    'data-panel-collapsible': collapsible || undefined,
    'data-panel-id': panelId,
    'data-panel-size': parseFloat('' + style.flexGrow).toFixed(1),
    id: `data-panel-id-${panelId}`,
    style: {
      ...style,
      ...styleFromProps,
    },
  })
}

export const Panel = forwardRef<ImperativePanelHandle, PanelProps>(
  (props: PanelProps, ref: ForwardedRef<ImperativePanelHandle>) =>
    createElement(PanelWithForwardedRef, { ...props, forwardedRef: ref })
)

PanelWithForwardedRef.displayName = 'Panel'
Panel.displayName = 'forwardRef(Panel)'

// HACK
function parseSizeFromStyle(style: CSSProperties): number {
  const { flexGrow } = style
  if (typeof flexGrow === 'string') {
    return parseFloat(flexGrow)
  } else {
    return flexGrow as number
  }
}