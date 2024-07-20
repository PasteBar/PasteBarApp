import { useState } from 'react'

import { Panel, PanelProps } from '~/components/libs/react-resizable-panels/src'

import ResizeHandle from './ResizeHandle'

export default function ResizePanel({
  children,
  isLastPanel = false,
  fixedSize,
  hasPanel = true,
  hasResizeHandle = true,
  isVertical = false,
  isCollapsible = false,
  ...props
}: {
  children: React.ReactNode
  isCollapsible?: boolean
  hasPanel?: boolean
  fixedSize?: number
  hasResizeHandle?: boolean
  isVertical?: boolean
  isLastPanel?: boolean
} & PanelProps) {
  const [size, setSize] = useState(fixedSize ? fixedSize : 0)

  if (!hasPanel) {
    return children
  }

  return (
    <>
      <Panel
        style={{ width: `${size}%` }}
        collapsible={isCollapsible}
        onResize={size => {
          if (fixedSize) {
            return
          }
          setSize(size)
        }}
        {...props}
      >
        {children}
      </Panel>
      {!isLastPanel && hasResizeHandle && <ResizeHandle isVertical={isVertical} />}
    </>
  )
}
