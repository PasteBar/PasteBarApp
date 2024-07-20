import { Prism } from 'prismjs'

declare global {
  interface Window {
    __locale__: string
    markdown: unknown
    isMainWindow: boolean
    isHistoryWindow: boolean
    highlighter: unknown
    plausible: (
      event: string,
      {
        callback,
        props,
      }: {
        callback?: () => void
        props: Record<string, unknown>
      }
    ) => void
    statsEvent: (
      event: string,
      {
        callback,
        props,
      }: {
        callback?: () => void
        props: Record<string, unknown>
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
