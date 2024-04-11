import { ClipboardHistoryItem } from './history'

export type Collection = {
  collectionId: string
  title: string
  description?: string | null
  isDefault: boolean
  isEnabled: boolean
  isSelected: boolean
  createdAt: number
  updatedAt: number
  createdDate: string
  updatedDate: string
}

export type Tabs = {
  tabId: string
  tabName: string
  tabColor: string | null
  tabIsActive: boolean
  tabIsHidden: boolean
  tabOrderNumber: number
  tabLayout: string | null
  tabLayoutSplit: number
}

export enum CreateItemType {
  FOLDER = 'folder',
  SEPARATOR = 'separator',
  ITEM = 'item',
  DISABLED = 'disabled',
}

export enum CreateDashboardItemType {
  TAB = 'tab',
  BOARD = 'board',
  CLIP = 'clip',
}

export enum ValueType {
  APIKEY = 'api_key',
  APP = 'app',
  CODE = 'code',
  CONTACT = 'contact',
  EMAIL = 'email',
  FILE = 'file',
  HTML = 'html',
  JSON = 'json',
  LINK = 'link',
  MDTEXT = 'mdtext',
  PASSWORD = 'password',
  PATH = 'path',
  PROMPT = 'prompt',
  RICHTEXT = 'richtext',
  TEXT = 'text',
  TOKEN = 'token',
  URL = 'url',
  UTILITY = 'utility',
}

export type NewItemType = {
  description?: string
  name: string
  type: CreateItemType
  value: string
  valueType: string
}

export type Item = {
  borderWidth?: number
  children?: Item[]
  hasChildren?: boolean
  color?: string
  commandLastRunAt?: number
  commandOutput?: string
  createdAt?: number
  createdDate?: string
  description?: string | null
  detectedLanguage?: string
  hasEmoji?: boolean
  hasMaskedWords?: boolean
  hasMultiLineCopy?: boolean
  icon?: string
  iconVisibility?: string
  id?: string
  imageDataUrl?: string | null
  imageHash?: string
  imageHeight?: number
  imagePathFullRes?: string | null
  imageScale?: number
  imageType?: string
  imageWidth?: number
  indent?: number
  isActive?: boolean
  isBoard?: boolean
  isClip?: boolean
  isCode?: boolean
  isCommand?: boolean
  isDeleted?: boolean
  isDisabled?: boolean
  isFavorite?: boolean
  isFolder?: boolean
  isImage?: boolean
  isImageData?: boolean
  isLink?: boolean
  isMasked?: boolean
  isMenu?: boolean
  isNew?: boolean
  isPath?: boolean
  isPinned?: boolean
  isSeparator?: boolean
  isText?: boolean
  isForm?: boolean
  isTemplate?: boolean
  isVideo?: boolean
  isProtected?: boolean
  isWebRequest?: boolean
  isWebScraping?: boolean
  itemId: string
  layout?: string
  layoutItemsMaxWidth?: string
  layoutSplit?: number
  links?: string
  name: string
  orderNumber: number
  parentId: string | null
  pathType?: string
  pinnedOrderNumber: number
  showDescription?: boolean
  tabId?: string
  updatedAt?: number
  updatedDate?: string
  value: string
  commandRequestLastRunAt?: number
  requestOptions?: string
  formTemplateOptions?: string
  commandRequestOutput?: string
}

export type MenuItem = {
  id: string
  name: string
  type?: string
  parentId: string | null
  orderNumber: number
  value?: string
  isActive?: boolean
  isDeleted?: boolean
  isFolder?: boolean
  isSeparator?: boolean
  children?: MenuItem[]
}

export type BoardItem = {
  id: string
  name: string
  parentId: string | null
  orderNumber: number
  isActive?: boolean
  isBoard?: boolean
  isDeleted?: boolean
  children?: BoardItem[]
}

export type CreateMenuItem = {
  type: CreateItemType
  orderNumber?: number
  currentMenuItemId?: string
  clipId?: string
  historyId?: string
  clipboardHistoryItem?: ClipboardHistoryItem
  text?: string
  parentId?: string | null
}
