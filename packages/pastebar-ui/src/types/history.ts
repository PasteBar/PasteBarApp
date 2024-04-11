import { UniqueIdentifier } from '@dnd-kit/core'

export type LinkMetadata = {
  metadataId?: string | null
  linkTitle: string | null
  linkFavicon: string | null
  linkDescription: string | null
  linkUrl: string | null
  linkDomain: string | null
  linkImage: string | null
}

export type ClipboardHistoryItem = {
  historyId: UniqueIdentifier
  title: string | null
  value: string | null
  valuePreview: string | null
  _type: string | null

  isImage: boolean
  imageDataUrl: string | null
  imagePathFullRes: string | null
  imageHeight: number
  imageWidth: number
  imagePreviewHeight: number
  isLink: boolean
  links: string | null
  arrLinks: string[]
  linkTitle: string | null
  linkDescription: string | null
  linkImage: string | null
  linkFavicon: string | null
  linkDomain: string | null
  linkMetadata: LinkMetadata | null
  isImageData: boolean
  isMasked: boolean
  isPassword: boolean
  isPinned: boolean
  isFavorite: boolean
  isVideo: boolean
  isCode: boolean
  isText: boolean
  isIgnored: boolean
  hasEmoji: boolean
  hasMaskedWords: boolean
  valueTypeId: string | null
  itemId: string | null
  createdAt: number
  valueMorePreviewLines: number | null
  valueMorePreviewChars: number | null
  detectedLanguage: string | null
  pinnedOrderNumber: number
  showTimeAgo?: boolean
  timeAgo: string
  timeAgoShort: string
  updatedAt: number
  createdDate: Date
  updatedDate: Date
}

export type UpdatedClipboardHistoryData = {
  historyId?: UniqueIdentifier
  title?: string | null
  value?: string | null
  _type?: string | null
  isImage?: boolean
  imagePath?: string | null
  isMasked?: boolean
  isFavorite?: boolean
  isPinned?: boolean
  isCode?: boolean
  isText?: boolean
  detectedLanguage?: string | null
  valueTypeId?: string | null
  itemId?: string | null
}
