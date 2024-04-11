import { Prism } from 'prismjs'

declare global {
  interface Window {
    __locale__: string
    highlighter: unknown
    Prism: Prism
  }
}

declare module 'i18next' {
  interface TypeOptions {
    returnNull: false
    allowObjectInHTMLChildren: false
  }
  export function t<T>(s: string): T
}
