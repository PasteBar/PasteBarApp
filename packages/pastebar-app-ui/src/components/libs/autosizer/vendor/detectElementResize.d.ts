type ResizeHandler = (element: HTMLElement, onResize: () => void) => void

export type DetectElementResize = {
  addResizeListener: ResizeHandler
  removeResizeListener: ResizeHandler
}

export function createDetectElementResize(nonce?: string): DetectElementResize

export {}
