import dayjs from 'dayjs'

export const MINIMAL_ITEM_NAME_LENGTH = 1
export const MAX_ITEM_NAME_LENGTH = 150
export const MAX_MENU_LABEL_LENGTH = 60
export const CLIPBOARD_HISTORY_SCROLL_PAGE_SIZE = 50
export const CLIPBOARD_HISTORY_LOAD_MORE_SIZE = 25
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

export const ACTION_TYPE_COMFIRMATION_MODAL = {
  resetPassword: 'RESET_PASSWORD',
  resetPasscode: 'RESET_PASSCODE',
  toggleProtection: 'TOGGLE_PROTECTION',
  changeProtectedCollections: 'CHANGE_PROTECTED_COLLECTIONS',
} as const

export const APP_TOURS = {
  historyPanelTour: 'HISTORY_PANEL_TOUR',
  menuTour: 'MENU_TOUR',
  dashboardClipsTour: 'DASHBOARD_CLIPS_TOUR',
  navBarTour: 'NAVBAR_TOUR',
  settingsTour: 'SETTINGS_TOUR',
} as const

export const APP_TOURS_NAMES = {
  [APP_TOURS.historyPanelTour]: 'Clipboard History Tour',
  [APP_TOURS.dashboardClipsTour]: 'Boards and Clips Tour',
  [APP_TOURS.menuTour]: 'Paste Menu Tour',
  [APP_TOURS.navBarTour]: 'Navigation Bar Tour',
  [APP_TOURS.settingsTour]: 'PasteBar Settings Tour',
} as const

export const APP_TOURS_ORDER = [
  APP_TOURS.historyPanelTour,
  APP_TOURS.dashboardClipsTour,
  APP_TOURS.menuTour,
  APP_TOURS.navBarTour,
  APP_TOURS.settingsTour,
] as const

export const SCREEN_AUTO_LOCK_TIMES_IN_MINUTES = [5, 10, 15, 20, 30, 45, 60]
export const RESET_TIME_DELAY_SECONDS = 60
export const APP_NAME = 'PasteBar'

// Default special copy/paste settings
export const DEFAULT_SPECIAL_PASTE_OPERATIONS = [
  // Text Case
  'upperCase',
  'lowerCase',
  'titleCase',
  'sentenceCase',
  'invertCase',
  // Code Formatting
  'camelCase',
  'snakeCase',
  'kebabCase',
  'pascalCase',
  'jsonStringify',
  // Whitespace & Lines
  'trimWhiteSpace',
  'removeLineFeeds',
  'addOneLineFeed',
  'addTwoLineFeeds',
  'removeExtraSpaces',
  'sortLinesAlphabetically',
  'removeDuplicateLines',
  'addLineNumbers',
  // Encode/Decode
  'base64Encode',
  'base64Decode',
  'urlEncode',
  'urlDecode',
  'htmlEncode',
  'htmlDecode',  
  // Text Tools
  'reverseText',
  'addCurrentDateTime',
  'countCharacters',
  'countWords',
  'countLines',
  'countSentences',
  // Format Converter - HTML
  'htmlToMarkdown',
  'htmlToReact',
  'htmlToReactComponent',
  'htmlToText',
  // Format Converter - Markdown
  'markdownToHtml',
  'markdownToText',
  // Format Converter - JSON
  'jsonToCsv',
  'jsonToYaml',
  'jsonToXml',
  'jsonToToml',
  'jsonToTable',
  // Format Converter - CSV
  'csvToJson',
  'csvToTable',
  // Format Converter - YAML
  'yamlToJson',
  // Format Converter - XML
  'xmlToJson',
  // Format Converter - TOML
  'tomlToJson',
] as const

export const DEFAULT_SPECIAL_PASTE_CATEGORIES = [
  'textCase',
  'codeFormatting',
  'whitespaceLines',
  'encodingSecurity',
  'textTools',
  'formatConverter',
] as const

window['PasteBar'] = {
  APP_UI_VERSION: APP_UI_VERSION,
  APP_VERSION: APP_VERSION,
  MAC_STORE: false,
  BUILD_DATE: dayjs(BUILD_DATE).format('YYYY-MM-DD'),
}
