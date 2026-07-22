import { Prism } from 'prismjs'

declare global {
  interface Window {
    __locale__: string
    markdown: unknown
    isMainWindow: boolean
    isHistoryWindow: boolean
    isQuickPasteWindow: boolean
    highlighter: unknown
    plausible: (
      event: string,
      options?: {
        callback?: (result?: { status?: number }) => void
        props?: Record<string, unknown>
        u?: string
      }
    ) => void
    statsEvent: (
      event: string,
      options?: {
        callback?: (result?: { status?: number }) => void
        props?: Record<string, unknown>
      }
    ) => void
    PasteBar: {
      APP_UI_VERSION: string
      APP_VERSION: string
      BUILD_DATE: string
      MAC_STORE: boolean
    }
  }
}

declare module 'i18next' {
  interface TypeOptions {
    returnNull: false
    allowObjectInHTMLChildren: false
  }
  export function t<T>(s: string): T
}
