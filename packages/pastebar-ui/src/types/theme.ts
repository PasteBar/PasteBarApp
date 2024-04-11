export type Direction = 'ltr' | 'rtl'
export type Mode = 'light' | 'dark' | 'system' | string | undefined
export type NavMode = 'transparent' | 'light' | 'dark' | 'themed' | 'default'
export type ControlSize = 'lg' | 'md' | 'sm'
export type ColorLevel = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export interface SimpleBarRefType {
  scrollTo(options: ScrollToOptions): void
}
