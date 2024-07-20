import { HTMLAttributes, ReactNode } from 'react'

export type HorizontalSize = {
  width: number
  scaledWidth: number
}
export type VerticalSize = {
  height: number
  scaledHeight: number
}
export type Size = HorizontalSize & VerticalSize

type BaseProps = {
  nonce?: string
  tagName?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onResize'>

export type HeightOnlyProps = BaseProps & {
  children: (size: VerticalSize) => ReactNode
  defaultHeight?: number
  disableHeight?: boolean
  disableWidth: true
  onResize?: (size: VerticalSize) => void
}

export type WidthOnlyProps = BaseProps & {
  children: (size: HorizontalSize) => ReactNode
  defaultWidth?: number
  disableHeight: boolean
  disableWidth?: boolean
  onResize?: (size: HorizontalSize) => void
}

export type HeightAndWidthProps = BaseProps & {
  children: (size: Size) => ReactNode
  defaultHeight?: number
  defaultWidth?: number
  disableHeight?: boolean
  disableWidth?: boolean
  onResize?: (size: Size) => void
}

export type Props = HeightOnlyProps | WidthOnlyProps | HeightAndWidthProps

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHeightAndWidthProps(props: any): props is HeightAndWidthProps {
  return props && props.disableHeight !== true && props.disableWidth !== true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHeightOnlyProps(props: any): props is HeightOnlyProps {
  return props && props.disableHeight !== true && props.disableWidth === true
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isWidthOnlyProps(props: any): props is WidthOnlyProps {
  return props && props.disableHeight === true && props.disableWidth !== true
}
