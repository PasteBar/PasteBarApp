declare global {
  interface Window {
    __TAURI_INVOKE__<T>(cmd: string, args?: Record<string, unknown>): Promise<T>
  }
}

const invoke = () => window.__TAURI_INVOKE__

export function appReady() {
  return invoke()<null>('app_ready')
}

export type Content = { body: string }
