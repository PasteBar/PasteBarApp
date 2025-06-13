import { memo, useEffect, useMemo, useRef } from 'react'
import type { UniqueIdentifier } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { message } from '@tauri-apps/api/dialog'
import { open } from '@tauri-apps/api/shell'
import { invoke } from '@tauri-apps/api/tauri'
import ClipboardRun from '~/assets/icons/clipboard-run'
import ExternalOpenIcon from '~/assets/icons/external-open'
import FindIcon from '~/assets/icons/find'
import OpenAppIcon from '~/assets/icons/open-app'
import OpenFileIcon from '~/assets/icons/open-file'
import OpenFileShellIcon from '~/assets/icons/open-file-shell'
import OpenFolderIcon from '~/assets/icons/open-folder'
import SpinnerIcon from '~/assets/icons/spinner-icon'
import WebRequestIcon from '~/assets/icons/web-request'
import WebScraperIcon from '~/assets/icons/web-scraper'
import {
  closeEdit,
  contextMenuClipId,
  dragClipHeight,
  dragClipWidth,
  hoveringClipIdBoardId,
  isDeletingSelectedClips,
  isKeyAltPressed,
  settingsStoreAtom,
  showClipFindKeyPressed,
  showLargeViewClipId,
  showLinkedClipId,
} from '~/store'
import { cva } from 'class-variance-authority'
import { useAtomValue } from 'jotai'
import linkifyIt from 'linkify-it'
import {
  BookOpenText,
  Check,
  Clipboard,
  ClipboardPaste,
  Contact,
  Dot,
  FileMusic,
  FilePenLine,
  FileText,
  Grip,
  Locate,
  MessageSquareText,
  MoreVertical,
  Move,
  MoveLeft,
  MoveRight,
  Music,
  NotebookPen,
  Search,
  Star,
  TerminalSquare,
  TextCursorInput,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import mergeRefs from '~/components/atoms/merge-refs'
import PlayButtonClipTitle from '~/components/atoms/play-button/PlayButtonClipTitle'
import ToolTip from '~/components/atoms/tooltip'
import ToolTipNotes from '~/components/atoms/tooltip-notes'
import {
  Badge,
  Box,
  Button,
  ButtonGhost,
  ContextMenu,
  ContextMenuTrigger,
  Flex,
  Input,
  Text,
} from '~/components/ui'

import { useUpdateItemById } from '~/hooks/queries/use-items'
import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'
import { useDebounce } from '~/hooks/use-debounce'
import { useLongPress } from '~/hooks/use-long-press'
import { useSignal } from '~/hooks/use-signal'

import { highlightMatchedText } from '../../helpers'
import { Card, CardHeaderWithRef } from './BaseCard'
import { BoardType } from './Board'
import { ClipCardBody } from './ClipCardBody'
import { ClipEditName } from './ClipEdit'
import { ClipEditContent } from './ClipEditContent'
import ClipIcon from './ClipIcon'
import ClipsCardContextMenu from './context-menus/ClipsCardContextMenu'
import { getNoteOptions, shouldShowNoteIcon } from './utils'

export type ClipType = 'clip'
export type ClipDropZoneType = 'clip::dropzone'

export const ClipFormKeyPress = [
  'Tab',
  'Enter',
  'TabTab',
  'TabTabTab',
  'EnterEnter',
  'TabEnter',
  'TabTabEnter',
] as const

const getNoteIconComponent = (iconType: string | undefined) => {
  const iconMap = {
    MessageSquareText,
    FileText,
    BookOpenText,
    Contact,
    NotebookPen,
  }
  return (
    iconMap[(iconType || 'MessageSquareText') as keyof typeof iconMap] ||
    MessageSquareText
  )
}

export type ClipFormTemplateOptions = {
  templateOptions: {
    id?: string
    label?: string
    isLabelOnTop?: boolean
    value?: string
    isValueMasked?: boolean
    defaultValue?: string
    selectOptions?: string[]
    isFound?: boolean
    type?:
      | 'password'
      | 'number'
      | 'creditcard'
      | 'text'
      | 'textarea'
      | 'select'
      | 'passwordCode'
      | 'section'

    isEnable?: boolean
  }[]
  formOptions: {
    fields: {
      id?: string
      label?: string
      type?:
        | 'password'
        | 'number'
        | 'creditcard'
        | 'text'
        | 'textarea'
        | 'passwordCode'
        | 'section'
      pressKeysAfterPaste?: (typeof ClipFormKeyPress)[number] | null
      isPressKeysOnly?: boolean
      isLabelOnTop?: boolean
      isValueMasked?: boolean
      isDelayOnly?: boolean
      isLabelHidden?: boolean
      value?: string
      isEnable?: boolean
    }[]

    openUrl?: string | null
    isOpenUrlDisabled?: boolean
  }
}

export type ClipWebRequestOptions = {
  method: string
  headers: {
    id?: string
    name?: string
    value?: string
    isEnable?: boolean
  }[]
  body?: string
  auth?: {
    type?: 'Bearer Token' | 'Basic Password' | 'API Key'
    isEnable?: boolean
    bearerToken?: string
    basicUsername?: string
    basicPassword?: string
    apiKey?: string
    apiValue?: string
  }
  filters: {
    id?: string
    filterType?: 'dotpathjson' | 'regex' | 'jsonpath' | 'regexreplace' | 'removequotes'
    value?: string
    replace?: string
    isEnable?: boolean
  }[]
  outputTemplate?: {
    id?: string | null
    value?: string
    isEnable?: boolean
  }
  outputRegexFilter?: {
    id?: string | null
    value?: string
    isEnable?: boolean
  }
  scrapingOptions?: {
    returnType?: 'Text' | 'Array'
    returnSeparator?: 'newline' | 'comma' | 'semicolon' | 'space' | 'tab' | 'pipe' | null
    returnPosition?: 'first' | 'last' | null
    returnCount?: number | null
  }

  scrapingRules?: {
    id?: string
    ruleType?:
      | 'cssselector'
      | 'regexfind'
      | 'regexreplace'
      | 'regexmatch'
      | 'regexmatchfoundgroup'
    value?: string
    replace?: string
    filterText?: string
    returnAttribute?: string
    returnAttributeText?: string
    isEnable?: boolean
  }[]
}

export enum Position {
  ABOVE_LEFT = 'ABOVE_LEFT',
  ABOVE_RIGHT = 'ABOVE_RIGHT',
  BELOW_LEFT = 'BELOW_LEFT',
  BELOW_RIGHT = 'BELOW_RIGHT',
  ABOVE_CENTER = 'ABOVE_CENTER',
}

export interface Clip {
  arrLinks?: string[]
  borderWidth?: number | null
  clipId?: UniqueIdentifier
  color?: string | null
  commandLastRunAt?: number | null
  createdAt: number
  description?: string | null
  detectedLanguage?: string | null
  hasEmoji?: boolean
  hasMaskedWords?: boolean
  id: UniqueIdentifier
  icon?: string | null
  iconVisibility?: string | null
  imageDataUrl?: string | null
  imageHash?: string | null
  imageHeight?: number | null
  imagePathFullRes?: string | null
  imagePreviewHeight?: number | null
  imageScale?: number
  imageType?: string | null
  imageWidth?: number | null
  isCode?: boolean
  isCommand?: boolean
  isFavorite?: boolean
  isImage?: boolean
  isImageData?: boolean
  isLink?: boolean
  isMasked?: boolean
  isPath?: boolean
  isPinned?: boolean
  isText?: boolean
  isForm?: boolean
  isTemplate?: boolean
  isVideo?: boolean
  isWebRequest?: boolean
  isWebScraping?: boolean
  isMenu?: boolean
  isProtected?: boolean
  links?: string | null
  name: string
  orderNumber: number
  parentId: UniqueIdentifier | null
  pathType?: string | null
  tabId: UniqueIdentifier | null
  type: ClipType | BoardType
  value: string | undefined
  commandRequestLastRunAt?: number | null
  requestOptions?: string | null
  itemOptions?: string | null
  formTemplateOptions?: string | null
  commandRequestOutput?: string | null
}

interface ClipCardProps {
  clip: Clip
  isLargeView?: boolean
  boardColor?: string
  isMp3?: boolean
  isMp3File?: boolean
  isPlaying?: boolean
  isSelected?: boolean
  globalSearchTerm?: string
  isClipNotesHoverCardsEnabled?: boolean
  clipNotesHoverCardsDelayMS?: number
  clipNotesMaxWidth?: number
  clipNotesMaxHeight?: number
  isGlobalSearchBoardsOnly?: boolean
  selectedOrder?: number
  isShowDetails?: boolean
  showDeselected?: boolean
  canReorangeItems?: boolean
  isHistoryDragActive?: boolean
  isClipEdit?: boolean
  isClipNameEditing?: boolean
  isDark: boolean
  isPinnedBoard?: boolean
  isShowOrganizeLayoutValue?: boolean
  isDisabledPinnedMoveUp?: boolean
  isClipDelete?: boolean
  isDisabledPinnedMoveDown?: boolean
  closeGlobalSearch?: () => void
  onMovePinnedUpDown?: ({
    itemId,
    moveUp,
    moveDown,
  }: {
    itemId: UniqueIdentifier
    moveUp?: boolean
    moveDown?: boolean
  }) => void
  setShowDetailsItem?: (id: UniqueIdentifier | null) => void
  setSelectedItemId?: (id: UniqueIdentifier) => void
  isDragPreview?: boolean
}

export interface ClipDragData {
  type: ClipType | ClipDropZoneType
  clip: Clip
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ClipCard({
  clip,
  boardColor,
  globalSearchTerm,
  isGlobalSearchBoardsOnly,
  isDragPreview,
  isClipNotesHoverCardsEnabled,
  clipNotesHoverCardsDelayMS,
  clipNotesMaxWidth,
  clipNotesMaxHeight,
  isSelected,
  selectedOrder,
  isMp3,
  isMp3File,
  isPlaying,
  isShowDetails,
  canReorangeItems,
  isClipDelete,
  isHistoryDragActive,
  isClipEdit,
  isClipNameEditing,
  isPinnedBoard,
  isLargeView,
  isShowOrganizeLayoutValue,
  isDisabledPinnedMoveDown,
  isDisabledPinnedMoveUp,
  isDark,
  closeGlobalSearch,
  onMovePinnedUpDown = ({}) => {},
  setShowDetailsItem = () => {},
  setSelectedItemId = () => {},
}: ClipCardProps) {
  const { t } = useTranslation()
  const { isNoteIconsEnabled, defaultNoteIconType } = useAtomValue(settingsStoreAtom)
  const contextMenuOpen = useSignal(false)
  const isExpanded = useSignal(false)
  const isSearch = useSignal(false)
  const searchTerm = useSignal('')
  const { updateItemById } = useUpdateItemById()
  // const onLongPress = useLongPress()

  const [copiedItem, setCopiedItem, _, copyInProgressItemId] = useCopyClipItem({})
  const [pastedItem, pastingCountDown, setPastedItem] = usePasteClipItem({})

  const debouncedSearchTerm = useDebounce(searchTerm.value, 300)

  const contextMenuButtonRef = useRef<HTMLButtonElement>(null)
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null)

  const canReorangeClips =
    (isShowOrganizeLayoutValue || canReorangeItems) && !isPinnedBoard

  const { setNodeRef, listeners, isDragging, setActivatorNodeRef, isOver } = useSortable({
    transition: null,
    disabled:
      !!(canReorangeClips && isClipEdit && isClipNameEditing) || isDragPreview || false,
    id: isPinnedBoard
      ? `${clip.id}::pinnedzone`
      : isClipEdit
        ? `${clip.id}::dropzone`
        : clip.id,
    animateLayoutChanges: () => false,
    data: {
      type: isClipEdit ? 'clip::dropzone' : 'clip',
      clip,
    } satisfies ClipDragData,
  })

  const clipName =
    globalSearchTerm && !isGlobalSearchBoardsOnly
      ? highlightMatchedText(clip.name, globalSearchTerm)
      : clip.name

  const isDelete = isClipDelete || (isDeletingSelectedClips.value && isSelected)

  const isCopied = copiedItem === clip.id
  const isPasted = pastedItem === clip.id
  const isCopyInProgress = copyInProgressItemId === clip.id
  const isPastingCountDown = pastedItem === clip.id ? pastingCountDown : undefined

  const isShowLinkedClip =
    isShowDetails && !isPinnedBoard && showLinkedClipId.value === clip.id

  const isNewlyCreated =
    clip.createdAt > Math.floor(Date.now()) - 60 * 1000 &&
    !clip.isPinned &&
    !clip.isFavorite

  const color = clip.color
    ? clip.color
    : boardColor
      ? boardColor
      : isPinnedBoard
        ? 'orange'
        : 'slate'

  const hasBorderLeft = clip.borderWidth && clip.borderWidth > 0
  const borderWidthLeft = hasBorderLeft ? clip.borderWidth : 1

  const borderLeftColors = hasBorderLeft
    ? `border-l-${color}-400 hover:!border-l-${color}-500 dark:border-l-${color}-600 dark:hover:!border-l-${color}-500`
    : ''

  const variants = cva(
    `relative clip_tour overflow-hidden p-[2px] px-0 hover:shadow-sm !rounded-lg duration-300 bg-${color}-50 dark:bg-${color}-950 dark:bg-opacity-80 border-${color}-200 dark:border-${color}-900 ${borderLeftColors} hover:bg-white dark:hover:bg-${color}-950 dark:hover:bg-opacity-60 ` +
      `${hasBorderLeft ? `border border-l-[${borderWidthLeft}px] ` : 'border-0'} ` +
      `${isClipEdit ? 'bg-white' : ''} ` +
      `${
        isSelected
          ? 'bg-yellow-50 dark:bg-amber-950/80 border-amber-300 hover:border-yellow-300/80 hover:bg-yellow-50/80 dark:hover:bg-yellow-950/80'
          : ''
      } h-full ` +
      `${
        isDelete
          ? `border-red-300 bg-red-100 border hover:!bg-red-100 dark:!bg-red-900 border-l-[${borderWidthLeft}px] `
          : ''
      }` +
      `${
        isCopied || isPasted
          ? '!border-green-600 !bg-green-50 dark:!bg-green-900 dark:!border-green-700'
          : ''
      } ` +
      `${isPinnedBoard && !isShowOrganizeLayoutValue ? 'animate-in fade-in' : ''} ` +
      `${isShowLinkedClip ? 'pulse-clip' : ''} `,
    {
      variants: {
        dragging: {
          over: 'border-2 border-dashed border-blue-400 min-w-[120px]',
          overlay: 'opacity-80 ml-[-2px] mt-[1px] min-w-[120px]',
        },
      },
    }
  )

  useEffect(() => {
    if (!canReorangeClips && dragClipHeight.value) {
      dragClipHeight.value = null
      dragClipWidth.value = null
    } else if (isDragging) {
      dragClipHeight.value =
        contextMenuTriggerRef?.current?.firstElementChild?.getBoundingClientRect()
          .height ?? null
      dragClipWidth.value =
        contextMenuTriggerRef?.current?.firstElementChild?.getBoundingClientRect()
          .width ?? null
    }
  }, [isDragging, canReorangeClips])

  const hoverId = useMemo(
    () => `${clip.id}:::${isPinnedBoard ? 'pinned' : clip.parentId}`,
    [clip.id, isPinnedBoard, clip.parentId]
  )

  const isHover =
    hoveringClipIdBoardId.value === hoverId ||
    isShowOrganizeLayoutValue ||
    canReorangeItems ||
    isCopyInProgress

  const titleText =
    !isClipEdit && !isExpanded && (isNewlyCreated || clip.isPinned || clip.isFavorite)
      ? `${isNewlyCreated ? t('New', { ns: 'common' }) : ''} ${
          clip.isPinned ? t('Pinned', { ns: 'common' }) : ''
        } ${clip.isFavorite ? t('Starred', { ns: 'common' }) : ''}`
      : undefined

  const arrLinks = useMemo(() => {
    if (!clip.links) {
      return []
    }

    if (clip.links) {
      try {
        clip.arrLinks = JSON.parse(clip.links as string)
      } catch (e) {
        clip.arrLinks = []
      }
    }

    return clip.arrLinks
  }, [clip.isLink, clip.links])

  useEffect(() => {
    isExpanded.value = false
    isSearch.value = false
  }, [isShowDetails])

  useEffect(() => {
    if (!isSearch.value) {
      searchTerm.value = ''
    }
  }, [isSearch.value])

  useEffect(() => {
    if (!isShowDetails || !showClipFindKeyPressed.value) {
      return
    }
    if (showClipFindKeyPressed.value && isShowDetails && !isSearch.value) {
      isSearch.value = true
    } else if (showClipFindKeyPressed.value && searchTerm.value.trim() === '') {
      isSearch.value = false
    }
  }, [showClipFindKeyPressed.value])

  const isEditing = isClipNameEditing || isClipEdit

  const copyDisabled =
    isSearch.value || isEditing || isShowOrganizeLayoutValue || canReorangeItems

  const showNotesToolTip = useMemo(
    () =>
      Boolean(
        clip.description && !isDragPreview && isClipNotesHoverCardsEnabled && !isEditing
      ),
    [clip.description, isDragPreview, isClipNotesHoverCardsEnabled, isEditing]
  )

  return (
    <ContextMenu
      onOpenChange={isOpen => {
        contextMenuOpen.value = isOpen
      }}
    >
      <ContextMenuTrigger
        disabled={(!isHover && !isSelected) || Boolean(globalSearchTerm)}
        ref={contextMenuTriggerRef}
      >
        <Box className="relative">
          {isSelected && !(isCopied || isPasted) && (
            <Badge
              variant="outline"
              className="bg-yellow-50 fade-in animate-in border-amber-300 dark:bg-amber-900 dark:border-amber-950/80 border cursor-pointer px-1.5 py-[1px] absolute top-[-10px] left-[-4px] z-100"
            >
              <Text className="font-mono !text-yellow-500 dark:!text-yellow-300 font-semibold">
                {selectedOrder}
              </Text>
            </Badge>
          )}
          {(isCopied || isPasted) && !isPastingCountDown ? (
            <Box
              className={`z-100 w-full flex justify-center fade-in-animation absolute top-[-10px]`}
            >
              {!clip.isForm ? (
                <Badge
                  variant="default"
                  className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 py-[1.5px] pr-4 mr-[-6px] text-[10px] uppercase font-semibold border-0"
                >
                  <Check size={14} className="mr-1" />
                  {isCopied
                    ? t('Copied', { ns: 'common' })
                    : isPasted
                      ? t('Pasted', { ns: 'common' })
                      : ''}
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 py-[1.5px] mr-[-6px] text-[10px] uppercase font-semibold border-0"
                >
                  {t('Running', { ns: 'common' })}...
                </Badge>
              )}
            </Box>
          ) : (
            isPastingCountDown &&
            pastingCountDown > 0 && (
              <Box
                className={`z-100 w-full flex justify-center fade-in-animation absolute top-[-10px]`}
              >
                {!clip.isForm ? (
                  <Badge
                    variant="default"
                    className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-3 py-[1.5px] pr-4 mr-[-6px] text-[10px] font-semibold border-0"
                  >
                    {t('Paste in {{pastingCountDown}}...', {
                      ns: 'common',
                      pastingCountDown,
                    })}
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-3 py-[1.5px] pr-4 mr-[-6px] text-[10px] font-semibold border-0"
                  >
                    {t('Run in {{pastingCountDown}}...', {
                      ns: 'common',
                      pastingCountDown,
                    })}
                  </Badge>
                )}
              </Box>
            )
          )}
          <Card
            ref={mergeRefs(canReorangeClips || isClipEdit ? setNodeRef : null)}
            style={
              isDragPreview
                ? {
                    height: dragClipHeight.value ?? 'auto',
                    width: dragClipWidth.value ?? 'auto',
                  }
                : {}
            }
            onMouseEnter={() => {
              hoveringClipIdBoardId.value = hoverId
            }}
            onMouseLeave={() => {
              hoveringClipIdBoardId.value = null
            }}
            onClick={() => {
              hoveringClipIdBoardId.value = hoverId
            }}
            className={variants({
              dragging: isDragPreview ? 'overlay' : isDragging ? 'over' : undefined,
            })}
          >
            <CardHeaderWithRef
              title={titleText}
              // {...onLongPress(() => {
              //   if (isClipEdit || isShowDetails || isPinnedBoard) {
              //     return
              //   }
              //   showClipsMoveOnBoardId.value = clip.parentId
              // })}
              onClickCapture={e => {
                if (e.shiftKey) {
                  e.preventDefault()
                  e.stopPropagation()
                  if (isShowOrganizeLayoutValue || canReorangeItems) {
                    return
                  }
                  if (!isShowDetails) {
                    setShowDetailsItem(clip.id)
                  } else if (showLargeViewClipId.value === clip.id) {
                    showLargeViewClipId.value = null
                  } else {
                    setShowDetailsItem(null)
                  }
                }
              }}
              onDoubleClickCapture={e => {
                if (copyDisabled || e.shiftKey) {
                  e.preventDefault()
                  return
                }
                if (e.altKey || e.metaKey) {
                  if (clip.isForm) {
                    setPastedItem(clip.id, undefined, true)
                    return
                  }
                  setPastedItem(clip.id)
                } else {
                  setCopiedItem(clip.id)
                }
              }}
              className={`overflow-hidden px-2.5 pr-1 py-1 break-words whitespace-pre-wrap flex gap-2 items-center justify-start flex-row ${
                canReorangeClips ? 'cursor-grab' : 'cursor-pointer'
              } ${isLargeView ? 'min-h-[30px]' : ''}`}
              {...(canReorangeClips ? listeners : {})}
            >
              {!isClipEdit ? (
                isSearch.value && clip.value?.trim() ? (
                  <Flex className="w-full text-sm">
                    <Input
                      placeholder={`${t('Find in clip', { ns: 'dashboard' })} ...`}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Escape' && searchTerm.value.trim() === '') {
                          isSearch.value = false
                        }
                      }}
                      iconLeft={<Search className="h-4 w-4" />}
                      classNameInput="w-full px-[6px] h-6"
                      onChange={e => {
                        searchTerm.value = e.target.value
                      }}
                      className="text-md ring-offset-0 pl-[6px] pr-[6px] bg-slate-100 dark:bg-slate-700 border-r-0 border-t-0 border-b-0 h-8"
                      type="search"
                    />
                    <ButtonGhost className="hover:bg-transparent text-slate-500 ml-1.5">
                      <ToolTip
                        text={t('Close Find', { ns: 'common' })}
                        delayDuration={2000}
                        isCompact
                        side="bottom"
                        sideOffset={10}
                      >
                        <X
                          size={18}
                          onClick={() => {
                            isSearch.value = false
                          }}
                        />
                      </ToolTip>
                    </ButtonGhost>
                  </Flex>
                ) : (
                  <div
                    className={`text-slate-600 dark:text-slate-300 text-sm line-clamp-3 text-ellipsis ${
                      isNewlyCreated ? 'font-semibold' : 'font-normal'
                    } ${isEditing || isNewlyCreated ? 'w-full' : ''}`}
                  >
                    {isClipNameEditing ? (
                      <ClipEditName
                        clipId={clip.id}
                        name={clip.name}
                        isEditOnly
                        isLargeView={isLargeView}
                        description={clip.description ?? null}
                        color={color}
                        borderWidth={clip.borderWidth ? clip.borderWidth : 0}
                      />
                    ) : (
                      <ToolTipNotes
                        text={clip.description}
                        isDisabled={!showNotesToolTip}
                        side="right"
                        isDark={isDark}
                        delayDuration={clipNotesHoverCardsDelayMS}
                        align="end"
                        classNameTrigger={`${
                          clip.description && isShowDetails ? 'inline-flex' : ''
                        } items-start break-words`}
                        sideOffset={10}
                        maxWidth={clipNotesMaxWidth}
                        maxHeight={clipNotesMaxHeight}
                        asChild
                      >
                        <div className="flex items-center">
                          {arrLinks && arrLinks.length === 1 && clip.isLink ? (
                            <span
                              onClick={e => {
                                if (e.shiftKey || copyDisabled) {
                                  e.preventDefault()
                                  return
                                }
                                open(ensureUrlPrefix(arrLinks[0]))
                              }}
                              title={arrLinks[0]}
                              className="underline decoration-slate-400 hover:decoration-blue-700 hover:text-blue-700 dark:hover:decoration-blue-400 dark:hover:text-blue-400 cursor-pointer"
                            >
                              {clipName}
                            </span>
                          ) : clip.isLink && clip.value ? (
                            <span
                              onClick={e => {
                                if (e.shiftKey) {
                                  e.preventDefault()
                                  return
                                }
                                const linkify = linkifyIt()
                                const matches = linkify.match(clip.value ?? '')
                                if (matches && matches.length === 1) {
                                  open(ensureUrlPrefix(matches[0].raw))
                                } else {
                                  message(
                                    t('Provided link {{clipValue}} might be invalid!', {
                                      ns: 'common',
                                      clipValue: clip.value,
                                    }),
                                    'Warning'
                                  )
                                }
                              }}
                              title={clip.value}
                              className="underline decoration-slate-400 hover:decoration-blue-700 hover:text-blue-700 dark:hover:decoration-blue-400 dark:hover:text-blue-400 cursor-pointer"
                            >
                              {clipName}
                            </span>
                          ) : clip.isPath && clip.value ? (
                            <span
                              onClick={async () => {
                                try {
                                  await invoke('check_path', { path: clip.value })
                                  await invoke('open_path_or_app', { path: clip.value })
                                } catch (err) {
                                  message(
                                    t('Provided path {{clipValue}} might be invalid!', {
                                      ns: 'common',
                                      clipValue: clip.value,
                                    }),
                                    'Warning'
                                  )
                                }
                              }}
                              title={clip.value}
                              className="underline decoration-slate-400 hover:decoration-blue-700 hover:text-blue-700 dark:hover:decoration-blue-400 dark:hover:text-blue-400 cursor-pointer"
                            >
                              {clipName}
                            </span>
                          ) : (
                            clipName
                          )}
                          {shouldShowNoteIcon(clip.description, clip.itemOptions, {
                            isNoteIconsEnabled,
                            defaultNoteIconType,
                          }) && (
                            <ToolTipNotes
                              text={clip.description}
                              isDisabled={isDragPreview}
                              side="right"
                              isDark={isDark}
                              delayDuration={300}
                              align="end"
                              sideOffset={10}
                              maxWidth={clipNotesMaxWidth}
                              maxHeight={clipNotesMaxHeight}
                              asChild
                            >
                              {(() => {
                                const NoteIcon = getNoteIconComponent(
                                  getNoteOptions(clip.itemOptions, {
                                    isNoteIconsEnabled,
                                    defaultNoteIconType,
                                  }).iconType
                                )
                                return (
                                  <NoteIcon
                                    size={16}
                                    className="opacity-70 hover:opacity-100 ml-1.5 hover:text-yellow-600"
                                  />
                                )
                              })()}
                            </ToolTipNotes>
                          )}
                        </div>
                        {clip.description &&
                          isShowDetails &&
                          !shouldShowNoteIcon(clip.description, clip.itemOptions, {
                            isNoteIconsEnabled,
                            defaultNoteIconType,
                          }) && (
                            <ToolTipNotes
                              text={clip.description}
                              isDisabled={isDragPreview}
                              side="right"
                              isDark={isDark}
                              delayDuration={300}
                              align="end"
                              classNameTrigger="mt-[2px]"
                              sideOffset={10}
                              maxWidth={clipNotesMaxWidth}
                              maxHeight={clipNotesMaxHeight}
                              asChild
                            >
                              <MessageSquareText
                                size={16}
                                className="opacity-70 hover:opacity-100 ml-1.5 hover:text-yellow-600"
                              />
                            </ToolTipNotes>
                          )}
                      </ToolTipNotes>
                    )}
                  </div>
                )
              ) : (
                <ClipEditName
                  clipId={clip.id}
                  name={clip.name}
                  isLargeView={isLargeView}
                  description={clip.description ?? null}
                  color={color}
                  borderWidth={clip.borderWidth ? clip.borderWidth : 0}
                />
              )}
              {!((isHover || contextMenuOpen.value) && !isEditing && !isSearch.value) &&
                !isEditing && (
                  <div
                    className={`text-secondary-foreground/50 flex flex-row ml-auto self-start items-center justify-end w-[40px] h-5 !mt-0 !p-0`}
                  >
                    {clip.isFavorite && (
                      <Star
                        className={`absolute text-transparent ${
                          clip.isPinned ? ' fill-orange-400' : ' fill-yellow-400 '
                        } pointer-events-none right-[4px] top-[4px] animate-in fade-in duration-500`}
                        size={11}
                      />
                    )}

                    {clip.isPinned && !clip.isFavorite && !isPinnedBoard ? (
                      <Dot
                        className={`absolute text-orange-400 pointer-events-none top-[-5px] right-[-5px] animate-in fade-in duration-500`}
                        size={28}
                      />
                    ) : (
                      isNewlyCreated &&
                      !clip.isFavorite && (
                        <Dot
                          className={`absolute text-green-400 pointer-events-none top-[-5px] right-[-3px] animate-in fade-in duration-500`}
                          size={28}
                        />
                      )
                    )}

                    {!isClipEdit && (
                      <div
                        className={
                          clip.isPinned && !clip.isFavorite
                            ? 'mr-[11px]'
                            : isNewlyCreated
                              ? 'mr-[14px]'
                              : clip.isFavorite
                                ? 'mr-[13px]'
                                : 'mr-1.5'
                        }
                      >
                        {(arrLinks && arrLinks.length === 1 && clip.isLink) ||
                        (clip.isLink && clip.value) ? (
                          !isMp3 ? (
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              pathType={t('Type:::Link', { ns: 'common' })}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            >
                              <ExternalOpenIcon
                                className="ml-1.5"
                                width={15}
                                height={15}
                              />
                            </ClipIcon>
                          ) : (
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              pathType={t('Type:::Link', { ns: 'common' })}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            >
                              {!isPlaying ? (
                                <Music className="ml-1.5" width={15} height={15} />
                              ) : (
                                <div className="playing-sound">
                                  <span className="playing__bar playing__bar1"></span>
                                  <span className="playing__bar playing__bar2"></span>
                                  <span className="playing__bar playing__bar3"></span>
                                </div>
                              )}
                            </ClipIcon>
                          )
                        ) : clip.isPath && clip.value ? (
                          !isMp3File ? (
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              pathType={t(`Type:::${clip.pathType}`, { ns: 'common' })}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            >
                              {clip.pathType === 'Folder' ? (
                                <OpenFolderIcon width={16} height={16} />
                              ) : clip.pathType === 'File' ? (
                                <OpenFileIcon width={16} height={16} />
                              ) : clip.pathType === 'App' ? (
                                <OpenAppIcon width={16} height={16} />
                              ) : (
                                (clip.pathType?.includes('Executable') ||
                                  clip.pathType?.includes('Script')) && (
                                  <OpenFileShellIcon width={16} height={16} />
                                )
                              )}
                            </ClipIcon>
                          ) : (
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              pathType={t(`Type:::${clip.pathType}`, { ns: 'common' })}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            >
                              {!isPlaying ? (
                                <FileMusic className="ml-1.5" width={15} height={15} />
                              ) : (
                                <div className="playing-sound">
                                  <span className="playing__bar playing__bar1"></span>
                                  <span className="playing__bar playing__bar2"></span>
                                  <span className="playing__bar playing__bar3"></span>
                                </div>
                              )}
                            </ClipIcon>
                          )
                        ) : clip.isCommand ? (
                          <ClipIcon
                            icon={clip.icon}
                            description={clip.description}
                            pathType={t('Type:::Shell Command', { ns: 'common' })}
                            iconVisibility={clip.iconVisibility}
                            isHover={isHover}
                          >
                            <TerminalSquare width={16} height={16} />
                          </ClipIcon>
                        ) : clip.isForm ? (
                          <>
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              pathType={t('Type:::Form Auto Fill', { ns: 'common' })}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            >
                              <TextCursorInput width={16} height={16} />
                            </ClipIcon>
                          </>
                        ) : clip.isTemplate ? (
                          <>
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              pathType={t('Type:::Template', { ns: 'common' })}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            >
                              <FilePenLine width={16} height={16} />
                            </ClipIcon>
                          </>
                        ) : clip.isWebRequest ? (
                          <ClipIcon
                            icon={clip.icon}
                            description={clip.description}
                            pathType={t('Type:::Web Request (HTTP)', { ns: 'common' })}
                            iconVisibility={clip.iconVisibility}
                            isHover={isHover}
                          >
                            <WebRequestIcon width={16} height={16} />
                          </ClipIcon>
                        ) : clip.isWebScraping ? (
                          <ClipIcon
                            icon={clip.icon}
                            description={clip.description}
                            pathType={t('Type:::Web Scraper / Parser', {
                              ns: 'common',
                            })}
                            iconVisibility={clip.iconVisibility}
                            isHover={isHover}
                          >
                            <WebScraperIcon width={16} height={16} />
                          </ClipIcon>
                        ) : (
                          clip.icon && (
                            <ClipIcon
                              icon={clip.icon}
                              description={clip.description}
                              iconVisibility={clip.iconVisibility}
                              isHover={isHover}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              {(isHover || contextMenuOpen.value) &&
                !isEditing &&
                (!canReorangeItems &&
                !isDragPreview &&
                !isDragging &&
                !isSearch.value &&
                !isShowOrganizeLayoutValue ? (
                  <>
                    <div
                      className={`self-start justify-end  text-secondary-foreground/50 flex ml-auto !mt-0 !p-0 ${
                        !isShowDetails ? 'w-[40px]' : ''
                      } items-center justify-center fade-in-init ${
                        isHover || contextMenuOpen.value ? 'fade-in-init-hover' : ''
                      }`}
                    >
                      <div />
                      {isShowDetails &&
                        !isSearch.value &&
                        !clip.isImage &&
                        clip.value?.trim() && (
                          <ButtonGhost
                            className="hover:bg-transparent hover:text-yellow-600 pr-2"
                            onClick={() => {
                              isSearch.value = true
                            }}
                          >
                            <ToolTip
                              text={t('Find in Clip', { ns: 'dashboard' })}
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              <FindIcon
                                width={16}
                                height={16}
                                className="cursor-pointer"
                              />
                            </ToolTip>
                          </ButtonGhost>
                        )}
                      {isShowDetails && clip.isImage && isLargeView && (
                        <ButtonGhost
                          className="hover:bg-transparent pr-3"
                          onClick={() => {
                            updateItemById({
                              updatedItem: {
                                itemId: clip.id,
                                imageScale: clip.imageScale === 1 ? 2 : 1,
                              },
                            })
                          }}
                        >
                          <ToolTip
                            text={t('Image Scale {{ImageScale}}x', {
                              ns: 'common',
                              ImageScale: clip.imageScale,
                            })}
                            delayDuration={2000}
                            isCompact
                            side="bottom"
                            sideOffset={10}
                          >
                            <Flex>
                              <Badge
                                variant="outline"
                                className="bg-slate-100 border border-slate-100 cursor-pointer px-1.5 mr-1 py-[1px]"
                              >
                                <Text className="font-mono !text-slate-400 font-semibold">
                                  {`${clip.imageScale}x`}
                                </Text>
                              </Badge>

                              {clip.imageScale === 1 ? (
                                <ZoomOut
                                  width={16}
                                  height={16}
                                  className="cursor-pointer"
                                />
                              ) : (
                                <ZoomIn
                                  width={16}
                                  height={16}
                                  className="cursor-pointer"
                                />
                              )}
                            </Flex>
                          </ToolTip>
                        </ButtonGhost>
                      )}
                      {isMp3 || isMp3File ? (
                        <PlayButtonClipTitle
                          isKeyAltPressed={isKeyAltPressed.value}
                          id={clip.id}
                          isMp3File={isMp3File}
                          isPinnedBoard={isPinnedBoard}
                          isStarred={clip.isFavorite}
                          src={clip.value}
                        />
                      ) : (
                        <ButtonGhost
                          className="hover:bg-transparent hover:text-green-600"
                          onClick={() => {
                            isKeyAltPressed.value
                              ? clip.isForm
                                ? setPastedItem(clip.id, undefined, true)
                                : setPastedItem(clip.id)
                              : setCopiedItem(clip.id)
                          }}
                        >
                          {clip.isForm ? (
                            <ToolTip
                              text={t('Type:::Run Auto Fill', { ns: 'common' })}
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isCopyInProgress || (isPasted && !isPastingCountDown) ? (
                                <SpinnerIcon />
                              ) : (
                                <ClipboardRun width={16} height={16} />
                              )}
                            </ToolTip>
                          ) : clip.isWebRequest ||
                            clip.isWebScraping ||
                            clip.isCommand ? (
                            <ToolTip
                              text={
                                isKeyAltPressed.value
                                  ? t('Run and Paste Response', { ns: 'common' })
                                  : t('Run and Copy Response', { ns: 'common' })
                              }
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isKeyAltPressed.value ? (
                                <ClipboardPaste size={16} />
                              ) : !isCopyInProgress ? (
                                <ClipboardRun width={16} height={16} />
                              ) : (
                                <SpinnerIcon />
                              )}
                            </ToolTip>
                          ) : (
                            <ToolTip
                              text={
                                isKeyAltPressed.value
                                  ? t('Copy and Paste', { ns: 'common' })
                                  : t('Copy to Clipboard', { ns: 'common' })
                              }
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              {isKeyAltPressed.value ? (
                                <ClipboardPaste size={16} />
                              ) : (
                                <Clipboard size={16} />
                              )}
                            </ToolTip>
                          )}
                        </ButtonGhost>
                      )}
                      {!Boolean(globalSearchTerm) ? (
                        <Button
                          variant="ghost"
                          size="mini"
                          className="px-1 pr-0 text-secondary-foreground/50 cursor-pointer !mt-0 flex hover:bg-transparent dark:hover:bg-transparent hover:text-slate-600 hover:dark:text-slate-300"
                          onClick={() => {
                            const x =
                              contextMenuButtonRef?.current?.getBoundingClientRect().x
                            const y =
                              contextMenuButtonRef?.current?.getBoundingClientRect().y

                            contextMenuClipId.value = clip.id

                            contextMenuTriggerRef?.current?.dispatchEvent(
                              new MouseEvent('contextmenu', {
                                bubbles: true,
                                clientX: x,
                                clientY: y && y + 30,
                              })
                            )
                          }}
                          ref={contextMenuButtonRef}
                        >
                          <ToolTip
                            text={t('Clip Menu', { ns: 'dashboard' })}
                            delayDuration={2000}
                            isCompact
                            side="bottom"
                            sideOffset={10}
                          >
                            <MoreVertical size={18} />
                          </ToolTip>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="mini"
                          className="px-1 pr-1 text-secondary-foreground/50 cursor-pointer !mt-0 flex hover:bg-transparent hover:text-blue-500"
                          onClick={() => {
                            showLinkedClipId.value = clip.id
                            closeGlobalSearch?.()
                          }}
                        >
                          <ToolTip
                            text={t('Locate Clip', { ns: 'contextMenus' })}
                            delayDuration={2000}
                            isCompact
                            side="bottom"
                            sideOffset={10}
                          >
                            <Locate size={18} />
                          </ToolTip>
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  !isSearch.value && (
                    <div className="text-secondary-foreground/50 flex ml-auto !mt-0 !p-0 pr-2 w-[40px] items-center justify-center">
                      {isDragPreview ? (
                        <Move size={16} />
                      ) : !isPinnedBoard ? (
                        <Button
                          variant="ghost"
                          size="mini"
                          {...listeners}
                          data-drag-handle
                          ref={setActivatorNodeRef}
                          className="px-1 text-secondary-foreground/50 ml-auto cursor-grab fade-in animate-in !mt-0 flex hover:bg-transparent"
                        >
                          <ToolTip
                            text={t('Drag to Move', { ns: 'common' })}
                            delayDuration={2000}
                            isCompact
                            side="bottom"
                            sideOffset={10}
                          >
                            <Grip size={16} />
                          </ToolTip>
                        </Button>
                      ) : (
                        <Flex>
                          <Box
                            className={`${
                              isDisabledPinnedMoveUp
                                ? 'cursor-default text-gray-300'
                                : 'cursor-pointer text-slate-500'
                            } pr-1 flex items-center justify-center`}
                          >
                            <MoveLeft
                              size={15}
                              onClick={() => {
                                if (isDisabledPinnedMoveUp) {
                                  return
                                }
                                onMovePinnedUpDown({
                                  itemId: clip.id,
                                  moveUp: true,
                                })
                              }}
                            />
                          </Box>
                          <Box
                            className={`${
                              isDisabledPinnedMoveDown
                                ? 'cursor-default text-gray-300'
                                : 'cursor-pointer text-slate-500'
                            } flex items-center justify-center`}
                          >
                            <MoveRight
                              size={15}
                              onClick={() => {
                                if (isDisabledPinnedMoveDown) {
                                  return
                                }
                                onMovePinnedUpDown({
                                  itemId: clip.id,
                                  moveDown: true,
                                })
                              }}
                            />
                          </Box>
                        </Flex>
                      )}
                    </div>
                  )
                ))}
            </CardHeaderWithRef>
            {isShowDetails && !isClipEdit ? (
              <ClipCardBody
                isImage={clip.isImage}
                isLink={clip.isLink}
                isShowLinkedClip={isShowLinkedClip}
                searchTerm={debouncedSearchTerm}
                isVideo={clip.isVideo}
                isPath={clip.isPath}
                isForm={clip.isForm}
                isTemplate={clip.isTemplate}
                isCode={clip.isCode}
                isMenu={clip.isMenu}
                clipName={clip.name}
                isCommand={clip.isCommand}
                isWebRequest={clip.isWebRequest}
                isWebScraping={clip.isWebScraping}
                isExpanded={isExpanded}
                isCopyOrPaste={isCopied || isPasted}
                isDark={isDark}
                arrLinks={clip.arrLinks}
                isMasked={clip.isMasked}
                hasMaskedWords={clip.hasMaskedWords}
                detectedLanguage={clip.detectedLanguage}
                hasEmoji={clip.hasEmoji}
                pathType={clip.pathType}
                isImageData={clip.isImageData}
                imageHash={clip.imageHash}
                imageType={clip.imageType}
                imageScale={clip.imageScale}
                imagePathFullRes={clip.imagePathFullRes}
                imageDataUrl={clip.imageDataUrl}
                isLargeView={isLargeView}
                formTemplateOptions={clip.formTemplateOptions}
                commandRequestOutput={clip.commandRequestOutput?.replace('[Err]', '')}
                isCommandRequestRunError={Boolean(
                  clip.commandRequestOutput?.startsWith('[Err]')
                )}
                commandRequestOutputLastRunAt={clip.commandRequestLastRunAt}
                requestOptions={clip.requestOptions}
                itemOptions={clip.itemOptions}
                imageWidthHeight={
                  clip.imageWidth ? `${clip.imageWidth}x${clip.imageHeight}` : null
                }
                clipId={clip.id}
                value={clip.value}
              />
            ) : (
              isClipEdit && (
                <ClipEditContent
                  value={clip.value}
                  isOver={isOver}
                  isLargeView={isLargeView}
                  isShowLinkedClip={isShowLinkedClip}
                  isNewlyCreated={isNewlyCreated}
                  isPinned={clip.isPinned}
                  isFavorite={clip.isFavorite}
                  isDelete={isDelete}
                  isCode={clip.isCode}
                  isImage={clip.isImage}
                  isCommand={clip.isCommand}
                  isLink={clip.isLink}
                  isWebRequest={clip.isWebRequest}
                  isWebScraping={clip.isWebScraping}
                  requestOptions={clip.requestOptions}
                  itemOptions={clip.itemOptions}
                  formTemplateOptions={clip.formTemplateOptions}
                  isPath={clip.isPath}
                  isVideo={clip.isVideo}
                  isMasked={clip.isMasked}
                  hasEmoji={clip.hasEmoji}
                  imageDataUrl={clip.imageDataUrl}
                  isText={clip.isText}
                  isTemplate={clip.isTemplate}
                  isForm={clip.isForm}
                  detectedLanguage={clip.detectedLanguage}
                  isDark={isDark}
                  isHistoryDragActive={isHistoryDragActive}
                  clipId={clip.id}
                  onCancel={() => {
                    closeEdit()
                  }}
                />
              )
            )}
          </Card>
        </Box>
      </ContextMenuTrigger>
      {(isHover || contextMenuOpen.value) && (
        <ClipsCardContextMenu
          itemId={clip.id}
          isSelected={isSelected}
          isPinnedBoard={isPinnedBoard}
          isMp3={isMp3 || isMp3File}
          isImage={clip.isImage}
          arrLinks={arrLinks}
          isImageData={clip.isImageData}
          isShowDetails={isShowDetails}
          setShowDetails={setShowDetailsItem}
          setSelectedItemId={setSelectedItemId}
          icon={clip.icon}
          iconVisibility={clip.iconVisibility}
          description={clip.description}
          itemOptions={clip.itemOptions}
          isPinned={clip.isPinned}
          isFavorite={clip.isFavorite}
          isMenu={clip.isMenu}
          isLargeView={isLargeView}
          tabId={clip.tabId}
          boardId={clip.parentId}
        />
      )}
    </ContextMenu>
  )
}

export const ClipCardMemoized = memo(ClipCard)
