export const MINIMAL_ITEM_NAME_LENGTH = 1
export const MAX_ITEM_NAME_LENGTH = 100
export const MAX_MENU_LABEL_LENGTH = 60
export const CLIPBOARD_HISTORY_SCROLL_PAGE_SIZE = 300
export const CONTENT_TYPE_LANGUAGE = {
  'text/html': 'html',
  'application/json': 'json',
  'text/plain': 'text',
  'text/xml': 'xml',
  'application/xml': 'xml',
  'application/javascript': 'javascript',
  'text/css': 'css',
  'text/markdown': 'markdown',
  'application/x-javascript': 'javascript',
  'application/x-json': 'json',
  'application/x-www-form-urlencoded': 'form',
  'application/javascript; charset=utf-8': 'javascript',
  'application/json; charset=utf-8': 'json',
  'text/html; charset=utf-8': 'html',
  'text/plain; charset=utf-8': 'text',
  'text/xml; charset=utf-8': 'xml',
  'application/xml; charset=utf-8': 'xml',
  'application/x-javascript; charset=utf-8': 'javascript',
  'application/x-json; charset=utf-8': 'json',
} as const

export const NEW_CLIPS_BOARD_NAME = 'New Clips Board'
export const NEW_CLIPS_BOARD_DESCRIPTION =
  'Default board for moved or copied items from other tabs'

export const ACTION_TYPE_COMFIRMATION_MODAL = {
  resetPassword: 'RESET_PASSWORD',
  resetPasscode: 'RESET_PASSCODE',
  removeLicense: 'REMOVE_LICENSE',
} as const

export const SCREEN_AUTO_LOCK_TIMES_IN_MINUTES = [5, 10, 15, 20, 30, 45, 60]
export const RESET_TIME_DELAY_SECONDS = 60
export const APP_NAME = 'PasteBar'
