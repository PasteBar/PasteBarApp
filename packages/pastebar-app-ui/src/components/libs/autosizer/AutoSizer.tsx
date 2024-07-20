import { Component, createElement, CSSProperties, ReactElement } from 'react'

import { HeightAndWidthProps, Props, Size } from './types'
import {
  createDetectElementResize,
  DetectElementResize,
} from './vendor/detectElementResize'

type State = {
  height: number
  scaledHeight: number
  scaledWidth: number
  width: number
}

export class AutoSizer extends Component<Props, State> {
  state = {
    height: (this.props as HeightAndWidthProps).defaultHeight || 0,
    scaledHeight: (this.props as HeightAndWidthProps).defaultHeight || 0,
    scaledWidth: (this.props as HeightAndWidthProps).defaultWidth || 0,
    width: (this.props as HeightAndWidthProps).defaultWidth || 0,
  }

  _autoSizer: HTMLElement | null = null
  _detectElementResize: DetectElementResize | null = null
  _parentNode: HTMLElement | null = null
  _resizeObserver: ResizeObserver | null = null
  _timeoutId: number | null = null

  componentDidMount() {
    const { nonce } = this.props

    if (
      this._autoSizer &&
      this._autoSizer.parentNode &&
      this._autoSizer.parentNode.ownerDocument &&
      this._autoSizer.parentNode.ownerDocument.defaultView &&
      this._autoSizer.parentNode instanceof
        this._autoSizer.parentNode.ownerDocument.defaultView.HTMLElement
    ) {
      // Delay access of parentNode until mount.
      // This handles edge-cases where the component has already been unmounted before its ref has been set,
      // As well as libraries like react-lite which have a slightly different lifecycle.
      this._parentNode = this._autoSizer.parentNode

      // Defer requiring resize handler in order to support server-side rendering.
      // See issue #41
      if (this._parentNode != null) {
        if (typeof ResizeObserver !== 'undefined') {
          this._resizeObserver = new ResizeObserver(() => {
            // Guard against "ResizeObserver loop limit exceeded" error;
            // could be triggered if the state update causes the ResizeObserver handler to run long.
            // See https://github.com/bvaughn/react-virtualized-auto-sizer/issues/55
            // @ts-expect-error
            this._timeoutId = setTimeout(this._onResize, 0)
          })
          this._resizeObserver.observe(this._parentNode)
        } else {
          this._detectElementResize = createDetectElementResize(nonce)
          this._detectElementResize.addResizeListener(this._parentNode, this._onResize)
        }

        this._onResize()
      }
    }
  }

  componentWillUnmount() {
    if (this._parentNode) {
      if (this._detectElementResize) {
        this._detectElementResize.removeResizeListener(this._parentNode, this._onResize)
      }

      if (this._timeoutId !== null) {
        clearTimeout(this._timeoutId)
      }

      if (this._resizeObserver) {
        this._resizeObserver.observe(this._parentNode)
        this._resizeObserver.disconnect()
      }
    }
  }

  render(): ReactElement {
    const {
      children,
      defaultHeight,
      defaultWidth,
      disableHeight = false,
      disableWidth = false,
      nonce,
      onResize,
      style = {},
      tagName = 'div',
      ...rest
    } = this.props as HeightAndWidthProps

    const { height, scaledHeight, scaledWidth, width } = this.state

    // Outer div should not force width/height since that may prevent containers from shrinking.
    // Inner component should overflow and use calculated width/height.
    // See issue #68 for more information.
    const childParams: Partial<Size> = {}

    if (!disableHeight) {
      if (height === 0) {
        childParams.height = defaultHeight
        childParams.scaledHeight = defaultHeight
      } else {
        childParams.height = height
        childParams.scaledHeight = scaledHeight
      }
    }

    if (!disableWidth) {
      if (width === 0) {
        childParams.width = defaultWidth
        childParams.scaledWidth = defaultWidth
      } else {
        childParams.width = width
        childParams.scaledWidth = scaledWidth
      }
    }

    return (
      <div ref={this._setRef} {...rest}>
        {children(childParams as Size)}
      </div>
    )
  }

  _onResize = () => {
    this._timeoutId = null

    const { disableHeight, disableWidth, onResize } = this.props as HeightAndWidthProps

    if (this._parentNode) {
      // Guard against AutoSizer component being removed from the DOM immediately after being added.
      // This can result in invalid style values which can result in NaN values if we don't handle them.
      // See issue #150 for more context.

      const style = window.getComputedStyle(this._parentNode) || {}
      const paddingLeft = parseFloat(style.paddingLeft ?? '0')
      const paddingRight = parseFloat(style.paddingRight ?? '0')
      const paddingTop = parseFloat(style.paddingTop ?? '0')
      const paddingBottom = parseFloat(style.paddingBottom ?? '0')

      const rect = this._parentNode.getBoundingClientRect()
      const scaledHeight = rect.height - paddingTop - paddingBottom
      const scaledWidth = rect.width - paddingLeft - paddingRight

      const height = this._parentNode.offsetHeight - paddingTop - paddingBottom
      const width = this._parentNode.offsetWidth - paddingLeft - paddingRight

      if (
        (!disableHeight &&
          (this.state.height !== height || this.state.scaledHeight !== scaledHeight)) ||
        (!disableWidth &&
          (this.state.width !== width || this.state.scaledWidth !== scaledWidth))
      ) {
        this.setState({
          height,
          width,
          scaledHeight,
          scaledWidth,
        })

        if (typeof onResize === 'function') {
          onResize({ height, scaledHeight, scaledWidth, width })
        }
      }
    }
  }

  _setRef = (autoSizer: HTMLElement | null) => {
    this._autoSizer = autoSizer
  }
}
