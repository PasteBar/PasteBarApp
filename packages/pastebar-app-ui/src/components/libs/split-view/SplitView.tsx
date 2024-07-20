import {
  ForwardedRef,
  forwardRef,
  ForwardRefExoticComponent,
  HTMLAttributes,
  Ref,
  useEffect,
  useRef,
  useState,
} from 'react'
import { css } from '@emotion/css'
import { useId, useUpdateEffect } from '@react-aria/utils'
import { clamp } from '@react-stately/utils'
import { GripVertical } from 'lucide-react'

import { SplitViewProvider, useSplitView } from './context'
import { resetGlobalCursorStyle, setGlobalCursorStyle } from './cursor'
import panelStyles from './panel.module.css'
import { defaultStorage } from './storage'
import { classNames, tokenSchema, transition } from './style-helpers'
import {
  CursorState,
  ResizeEvent,
  SplitPanePrimaryProps,
  SplitPaneSecondaryProps,
  SplitViewProps,
} from './types'
import {
  getPercentage,
  getPosition,
  getPrimaryPane,
  getPrimaryPaneId,
  getResizeHandle,
  getResizeHandleId,
  getSecondaryPane,
  getSecondaryPaneId,
  px,
} from './utils'

const MAX_WIDTH_PROP = '--primary-pane-max-width'
const MAX_WIDTH_VAR = `var(${MAX_WIDTH_PROP})`
const MIN_WIDTH_PROP = '--primary-pane-min-width'
const MIN_WIDTH_VAR = `var(${MIN_WIDTH_PROP})`
const WIDTH_PROP = '--primary-pane-width'
const WIDTH_VAR = `var(${WIDTH_PROP})`
const SNAP_REGION_PX = 32
const KEYBOARD_ARROW_STEPS = 10

const visuallyHiddenStyles = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  width: '1px',
  whiteSpace: 'nowrap',
} as const

type ResizeHandleProps = HTMLAttributes<HTMLDivElement>

const SplitViewResizeHandle = forwardRef(function SplitViewResizeHandle(
  props: ResizeHandleProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { activity, id, isCollapsed } = useSplitView()

  return (
    <div
      {...props}
      ref={forwardedRef}
      aria-controls={getPrimaryPaneId(id)}
      aria-label="Resize" // FIXME: localize
      aria-orientation="vertical"
      id={getResizeHandleId(id)}
      role="separator"
      tabIndex={0}
      data-split-view-resize-handle
      data-split-view-activity={activity}
      data-split-view-collapsed={isCollapsed || undefined}
      className={`animate-in panel-resize_tour ${css({
        backgroundColor: 'var("--tw-red-500")',
        boxSizing: 'border-box',
        cursor: 'ew-resize',
        flexShrink: 0,
        opacity: 0,
        outline: 0,
        position: 'relative',
        touchAction: 'none',
        animationDuration: '0.3s',
        transition: transition('opacity'),
        userSelect: 'none',
        width: 14,
        zIndex: 1,

        // hide visually when collapsed. still allow keyboard focus
        '&[data-split-view-collapsed]:not([data-split-view-activity])':
          visuallyHiddenStyles,

        // increase hit area
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: `calc(${tokenSchema.size.space.small} * -1)`,
        },

        // drag indicator
        '&::after': {
          backgroundColor: tokenSchema.color.alias.backgroundHovered,
          content: '""',
          insetBlock: 0,
          insetInline: `calc(${tokenSchema.size.border.medium} * -1)`,
          opacity: 0,
          position: 'absolute',
          transition: transition('opacity'),
        },
        // delay transition to avoid unexpected flicker, the user may just be
        // mousing between panes; this way we ensure intent
        '&:hover': {
          opacity: 1,
          backgroundColor: tokenSchema.color.border.neutral,
          transitionDelay: tokenSchema.animation.duration.regular,

          '&::after': {
            opacity: 1,
            transitionDelay: tokenSchema.animation.duration.regular,
          },
        },
        '&[data-split-view-activity]::after': {
          backgroundColor: tokenSchema.color.background.accentEmphasis,
          insetInline: `calc(${tokenSchema.size.border.regular} * -1)`,
          opacity: 1,
        },
      })}`}
    >
      <GripVertical
        className={`${panelStyles.HorizontalIcon} text-slate-300 dark:text-slate-500`}
        type="resize-horizontal"
        width="16px"
      />
    </div>
  )
})

export function SplitView(props: SplitViewProps) {
  const {
    autoSaveId,
    children,
    showStartPanelOnly = false,
    showEndPanelOnly = false,
    defaultSize,
    isCollapsed,
    minSize,
    maxSize,
    onCollapseChange,
    onResize,
    swapPanes,
    reversed,
    storage = defaultStorage,
  } = props
  const [startPane, endPane] = swapPanes ? [children[1], children[0]] : children

  const id = useId(props.id)

  const [isReversed, setReversed] = useState(reversed)
  const [isDragging, setDragging] = useState(false)
  // const [collapseRequested, setCollapseRequested] = useState(false);
  const [handleIsFocused, setHandleFocus] = useState(false)
  const [size, setSize] = useState<number>(() => {
    let size = defaultSize
    if (autoSaveId) {
      const savedSize = storage.getItem(autoSaveId)
      if (savedSize) {
        size = Number.parseInt(savedSize)
      }
    }
    return size
  })

  const wrapperRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const moveRef = useRef(0)

  // reverse drag logic when the primary pane is on the right or if the locale
  // direction is right-to-left
  useEffect(() => {
    const resizeHandle = getResizeHandle(id)
    const primaryPane = getPrimaryPane(id)
    const secondaryPane = getSecondaryPane(id)
    setReversed(
      reversed
        ? resizeHandle?.previousElementSibling === primaryPane
        : resizeHandle?.previousElementSibling === secondaryPane
    )
  }, [reversed, id])

  // sync size with subscribers
  useUpdateEffect(() => onResize?.(size), [size])
  useEffect(() => {
    wrapperRef.current?.style.setProperty(WIDTH_PROP, px(size))
    moveRef.current = size

    if (autoSaveId) {
      storage.setItem(autoSaveId, px(size))
    }
  }, [autoSaveId, onResize, size, storage])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const resizeHandle = getResizeHandle(id)
    const primaryPane = getPrimaryPane(id)

    if (!wrapper || !resizeHandle || !primaryPane) {
      return
    }

    let collapseRequested = false
    const collapseAllowed = typeof isCollapsed === 'boolean'

    const onMove = (e: ResizeEvent) => {
      e.preventDefault()

      let delta = getPosition(e) - offsetRef.current
      if (isReversed) delta = delta * -1
      let nextWidth = size + delta

      // snap to the default width when the user drags near it
      if (Math.abs(nextWidth - defaultSize) < SNAP_REGION_PX / 2) {
        nextWidth = defaultSize
      }

      // soft collapse the primary pane when smaller than half of its min-size.
      // collapse state is committed when the drag handle is released.
      if (collapseAllowed) {
        collapseRequested = nextWidth <= minSize / 2
      }
      if (collapseRequested) {
        primaryPane.style.setProperty('width', '0px')
        moveRef.current = size
      } else {
        moveRef.current = nextWidth
        primaryPane.style.removeProperty('width')
      }

      wrapper.style.setProperty(WIDTH_PROP, px(moveRef.current))

      let cursorStyle: CursorState = 'horizontal'
      if (moveRef.current < minSize) {
        cursorStyle = 'horizontal-min'
      }
      if (moveRef.current > maxSize) {
        cursorStyle = 'horizontal-max'
      }
      setGlobalCursorStyle(cursorStyle, Boolean(isReversed))
    }

    const stopDragging = () => {
      resizeHandle.blur()
      setDragging(false)
      resetGlobalCursorStyle()

      if (collapseRequested) {
        onCollapseChange?.(!isCollapsed)
        primaryPane.style.removeProperty('width')
      } else {
        setSize(clamp(moveRef.current, minSize, maxSize))
      }

      collapseRequested = false

      document.body.removeEventListener('mousemove', onMove)
      document.body.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', stopDragging)
      window.removeEventListener('touchend', stopDragging)
    }

    const startDragging = (e: ResizeEvent) => {
      if ('button' in e && e.button !== 0) {
        return
      }
      if ('touches' in e && e.touches.length !== 1) {
        return
      }

      setDragging(true)
      offsetRef.current = getPosition(e)

      document.body.addEventListener('mousemove', onMove)
      document.body.addEventListener('touchmove', onMove)
      window.addEventListener('mouseup', stopDragging)
      window.addEventListener('touchend', stopDragging)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) {
        return
      }

      // allow 10 steps between the min and max
      const step = Math.round((maxSize - minSize) / KEYBOARD_ARROW_STEPS)
      const increment = () => setSize(size => Math.min(size + step, maxSize))
      const decrement = () => setSize(size => Math.max(size - step, minSize))

      switch (e.key) {
        case 'Enter':
          if (collapseAllowed) {
            e.preventDefault()
            onCollapseChange?.(!isCollapsed)
          }
          break
        case 'Home':
          e.preventDefault()
          setSize(minSize)
          break
        case 'End':
          e.preventDefault()
          setSize(maxSize)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (isReversed) {
            increment()
          } else {
            decrement()
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (isReversed) {
            decrement()
          } else {
            increment()
          }
      }
    }

    const options = { passive: true }
    const onDoubleClick = (e: MouseEvent) => {
      // reset to the default size when the drag handle is double-clicked. the
      // guard is to prevent this from firing when the user keeps the mouse down
      // after the second click and begins to drag, which yields some really
      // weird behavior.
      if (e.clientX === offsetRef.current) {
        setSize(defaultSize)
      }
    }

    resizeHandle.addEventListener('contextmenu', stopDragging)
    resizeHandle.addEventListener('dblclick', onDoubleClick)
    resizeHandle.addEventListener('keydown', onKeyDown)
    resizeHandle.addEventListener('mousedown', startDragging, options)
    resizeHandle.addEventListener('touchstart', startDragging, options)

    return () => {
      resizeHandle.removeEventListener('contextmenu', stopDragging)
      resizeHandle.removeEventListener('dblclick', onDoubleClick)
      resizeHandle.removeEventListener('keydown', onKeyDown)
      resizeHandle.removeEventListener('mousedown', startDragging)
      resizeHandle.removeEventListener('touchstart', startDragging)
    }
  }, [
    maxSize,
    minSize,
    defaultSize,
    id,
    isReversed,
    size,
    onCollapseChange,
    isCollapsed,
    swapPanes,
  ])

  if (showStartPanelOnly) {
    return <div className="w-full">{startPane}</div>
  }

  if (showEndPanelOnly) {
    return <div className="w-full split-view-end">{endPane}</div>
  }

  return (
    <SplitViewProvider
      value={{
        id,
        isCollapsed,
        activity: isDragging ? 'pointer' : handleIsFocused ? 'keyboard' : undefined,
      }}
    >
      <div
        ref={wrapperRef}
        className={classNames(
          css({
            display: 'flex',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            [MIN_WIDTH_PROP]: px(minSize),
            [MAX_WIDTH_PROP]: px(maxSize),
            [WIDTH_PROP]: px(defaultSize),
          })
        )}
      >
        {startPane}

        <SplitViewResizeHandle
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={getPercentage(size, minSize, maxSize)}
          onBlur={() => setHandleFocus(false)}
          onFocus={() => setHandleFocus(true)}
        />
        {endPane}
      </div>
    </SplitViewProvider>
  )
}

// Styled components
// -----------------------------------------------------------------------------

export const SplitPanePrimary: ForwardRefExoticComponent<
  SplitPanePrimaryProps & { ref?: Ref<HTMLDivElement> }
> = forwardRef(function SplitPanePrimary(
  props: SplitPanePrimaryProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { activity, id, isCollapsed } = useSplitView()

  // it feels like `aria-expanded` should be on the primary pane (which is
  // controlled by the "separator"), but it's actually not supported:
  // https://github.com/w3c/aria-practices/issues/129
  // https://www.w3.org/TR/wai-aria-1.1/#aria-expanded
  return (
    <div
      ref={forwardedRef}
      id={getPrimaryPaneId(id)}
      data-split-pane="primary"
      data-split-view-activity={activity}
      data-split-view-collapsed={isCollapsed || undefined}
      className={classNames(
        css({
          containerType: 'inline-size',
          overflow: 'hidden',
          width: `clamp(${MIN_WIDTH_VAR},${WIDTH_VAR},${MAX_WIDTH_VAR})`,
          // prevent the secondary pane from collapsing completely, regardless of
          // consumer preference. losing the drag handle is a bad experience.
          maxWidth: props.isSplitPanelView ? '100%' : `calc(100% - 100px)`,

          // hide when collapsed
          '&[data-split-view-collapsed]': {
            visibility: 'hidden',
            width: 0,
          },
          // support transition when not dragging
          '&:not([data-split-view-activity])': {
            transition: transition('width'),
          },
          // disable interactive elements during drag
          '&[data-split-view-activity=pointer]': {
            pointerEvents: 'none',
          },
        })
      )}
    >
      {props.children}
    </div>
  )
})

export const SplitPaneSecondary: ForwardRefExoticComponent<
  SplitPaneSecondaryProps & { ref?: Ref<HTMLDivElement> }
> = forwardRef(function SplitPaneSecondary(
  props: SplitPaneSecondaryProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { id, activity } = useSplitView()

  if (props.disabled) {
    return props.children
  }

  return (
    <div
      ref={forwardedRef}
      id={getSecondaryPaneId(id)}
      data-split-pane="secondary"
      data-split-view-activity={activity}
      className={classNames(
        css({
          containerType: 'inline-size',
          flex: `1 1 0`,
          // prevent the secondary pane from collapsing completely, regardless of
          // consumer preference. losing the drag handle is a bad experience.
          minWidth: `100px`,
          overflow: 'hidden',

          // disable interactive elements during drag
          '&[data-split-view-activity=pointer]': {
            pointerEvents: 'none',
          },
        })
      )}
    >
      {props.children}
    </div>
  )
})
