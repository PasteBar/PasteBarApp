import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import { UniqueIdentifier, useDraggable } from '@dnd-kit/core'
import NoWrapIcon from '~/assets/icons/nowrap'
import WrapIcon from '~/assets/icons/wrap'
import { MINUTE_IN_MS } from '~/constants'
import { isEmailNotUrl } from '~/libs/utils'
import { formatLocale as format } from '~/locales/date-locales'
import {
  hoveringHistoryRowId,
  isKeyAltPressed,
  isKeyCtrlPressed,
  showHistoryDeleteConfirmationId,
} from '~/store'
import {
  ArrowDownToLine,
  Check,
  Clipboard,
  ClipboardPaste,
  Dot,
  Grip,
  MoreVertical,
  MoveDown,
  MoveUp,
  Star,
  X,
} from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix, getSelectedText } from '~/lib/utils'

import ImageWithFallback from '~/components/atoms/image/image-with-fallback-on-error'
import LinkCard from '~/components/atoms/link-card/link-card'
import PlayButton from '~/components/atoms/play-button/PlayButton'
import ToolTip from '~/components/atoms/tooltip'
import { Badge, Box, ContextMenu, ContextMenuTrigger, Flex, Text } from '~/components/ui'
import YoutubeEmbed from '~/components/video-player/YoutubeEmbed'

import { useSignal } from '~/hooks/use-signal'

import { ClipboardHistoryItem, LinkMetadata } from '~/types/history'

import {
  highlightMatchedText,
  highlightWithPreviewMatchedText,
  hyperlinkText,
  hyperlinkTextWithPreview,
} from '../helpers'
import ClipboardHistoryRowContextMenu from './context-menu/ClipboardHistoryRowContextMenu'

interface ClipboardHistoryRowProps {
  index?: number
  style?: CSSProperties
  isExpanded: boolean
  isWindows?: boolean
  isWrapText: boolean
  isSelected?: boolean
  isDeleting?: boolean
  showTimeAgo?: boolean
  selectedItemsCount?: number
  isLinkCardPreviewEnabled?: boolean
  isAutoGenerateLinkCardsEnabled?: boolean
  timeAgo?: string | null
  searchTerm?: string
  isBrokenImage?: boolean
  isCopied?: boolean
  isKeyboardSelected?: boolean
  isPasted?: boolean
  isSaved?: boolean
  isLargeView?: boolean
  isScrolling?: boolean
  isPinnedTop?: boolean
  isPinnedTopFirst?: boolean
  isDisabledPinnedMoveUp?: boolean
  isDisabledPinnedMoveDown?: boolean
  isOverPinned?: boolean
  hasClipboardHistoryURLErrors?: boolean
  hasGenerateLinkMetaDataInProgress?: boolean
  addToGenerateLinkMetaDataInProgress?: (historyId: UniqueIdentifier) => void
  removeToGenerateLinkMetaDataInProgress?: (historyId: UniqueIdentifier) => void
  addToClipboardHistoryIdsURLErrors?: (historyId: UniqueIdentifier) => void
  largeViewItemId?: UniqueIdentifier | null
  setLargeViewItemId?: (historyId: UniqueIdentifier | null) => void
  setSavingItem?: (historyId: UniqueIdentifier | null) => void
  pastingCountDown?: number | undefined
  onCopy?: (id: UniqueIdentifier) => void
  onCopyPaste?: (id: UniqueIdentifier, delay?: number) => void
  showSelectHistoryItems: boolean
  invalidateClipboardHistoryQuery?: () => void
  onMovePinnedUpDown?: ({
    historyId,
    moveUp,
    moveDown,
  }: {
    historyId: UniqueIdentifier
    moveUp?: boolean
    moveDown?: boolean
  }) => void
  setExpanded?: (historyId: UniqueIdentifier, isExpanded: boolean) => void
  setBrokenImageItem: (id: UniqueIdentifier) => void
  setWrapText?: (historyId: UniqueIdentifier, isWrapped: boolean) => void
  generateLinkMetaData?: (
    historyId: UniqueIdentifier,
    url: string
  ) => Promise<LinkMetadata | void>
  removeLinkMetaData?: (historyId: UniqueIdentifier) => Promise<void>
  isDragPreview?: boolean
  setSelectHistoryItem?: (id: UniqueIdentifier) => void
  setSelectedHistoryItems?: (ids: UniqueIdentifier[]) => void
  selectedHistoryItems?: UniqueIdentifier[]
  clipboard?: ClipboardHistoryItem
  isDark: boolean
  setRowHeight?: (index: number, height: number) => void
  setHistoryFilters?: Dispatch<SetStateAction<string[]>>
  setAppFilters?: Dispatch<SetStateAction<string[]>>
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ClipboardHistoryRowComponent({
  index,
  style,
  clipboard,
  isDark,
  isWindows,
  searchTerm,
  isPinnedTop = false,
  isPinnedTopFirst = false,
  isDisabledPinnedMoveUp = false,
  isDisabledPinnedMoveDown = false,
  isExpanded = false,
  isSelected = false,
  isWrapText = false,
  isDeleting = false,
  isOverPinned = false,
  isKeyboardSelected = false,
  isScrolling = false,
  hasClipboardHistoryURLErrors = false,
  addToClipboardHistoryIdsURLErrors = () => {},
  hasGenerateLinkMetaDataInProgress = false,
  removeToGenerateLinkMetaDataInProgress,
  addToGenerateLinkMetaDataInProgress,
  isLinkCardPreviewEnabled = true,
  isAutoGenerateLinkCardsEnabled = true,
  selectedItemsCount = 0,
  timeAgo = null,
  showTimeAgo = false,
  showSelectHistoryItems,
  isCopied,
  isPasted,
  isSaved,
  isLargeView = false,
  largeViewItemId,
  setSavingItem = () => {},
  setLargeViewItemId = () => {},
  pastingCountDown,
  onCopyPaste = () => {},
  onCopy = () => {},
  invalidateClipboardHistoryQuery = () => {},
  generateLinkMetaData,
  removeLinkMetaData = () => Promise.resolve(),
  isBrokenImage = false,
  setExpanded = () => {},
  onMovePinnedUpDown = ({}) => {},
  setWrapText = () => {},
  setBrokenImageItem = () => {},
  setSelectHistoryItem = () => {},
  selectedHistoryItems = [],
  setSelectedHistoryItems = () => {},
  isDragPreview = false,
  setRowHeight = () => {},
  setHistoryFilters = () => {},
  setAppFilters = () => {},
}: ClipboardHistoryRowProps) {
  const { t } = useTranslation()
  const rowRef = useRef<HTMLDivElement>(null)
  const rowKeyboardRef = useRef<HTMLDivElement>(null)
  const contextMenuButtonRef = useRef<HTMLDivElement>(null)
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
  const isCopiedOrPasted = isCopied || isPasted || isSaved

  const contentElementRendered = useSignal<boolean>(false)
  const contextMenuOpen = useSignal<boolean>(false)

  const isHovering = !isPinnedTop
    ? (hoveringHistoryRowId.value === clipboard?.historyId &&
        !isCopiedOrPasted &&
        !isDragPreview) ||
      contextMenuOpen.value
    : (hoveringHistoryRowId.value === `${clipboard?.historyId}::pinned` &&
        !isDragPreview &&
        !isCopiedOrPasted) ||
      contextMenuOpen.value

  const { setNodeRef, listeners, isDragging } = useDraggable({
    disabled: isDragPreview && !(isHovering || isSelected),
    data: {
      isPinned: isPinnedTop,
    },
    id: isPinnedTop ? `${clipboard?.historyId}::pinned` : clipboard?.historyId ?? 'id',
  })

  useLayoutEffect(() => {
    if (
      rowRef.current?.clientHeight &&
      contentElementRendered.value &&
      index !== undefined
    ) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rowRef?.current && setRowHeight(index, rowRef?.current.clientHeight + 4)
        })
      })
    }
    // eslint-disable-next-line
  }, [
    contentElementRendered.value,
    rowRef.current?.clientHeight,
    setRowHeight,
    timeAgo,
    showTimeAgo,
    index,
  ])

  useEffect(() => {
    if (isKeyboardSelected && rowKeyboardRef.current && !isScrolling) {
      rowKeyboardRef.current.scrollIntoView({
        block: 'center',
      })
    }
  }, [isKeyboardSelected, isScrolling])

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        index !== undefined &&
          rowRef?.current &&
          setRowHeight(index, rowRef?.current.clientHeight + 4)
      })
    })
  }, [isExpanded, isWrapText])

  if (!clipboard) {
    return null
  }

  const labelsOffset = useMemo(() => {
    if (!clipboard.isFavorite && !clipboard.isPinned) {
      return ''
    }

    if (
      rowRef?.current?.clientHeight &&
      ((rowRef?.current?.clientHeight <= 42 && !showTimeAgo) ||
        (rowRef?.current?.clientHeight <= 72 && showTimeAgo))
    ) {
      return isPinnedTop && !clipboard.isFavorite ? '' : 'mr-4'
    }

    return ''
  }, [
    rowRef?.current?.clientHeight,
    showTimeAgo,
    isPinnedTop,
    clipboard.isFavorite,
    clipboard.isPinned,
  ])

  const stringValue: string = clipboard?.value ?? ''
  const hasLinkCard =
    clipboard?.isLink &&
    clipboard?.linkMetadata?.linkTitle &&
    clipboard?.linkMetadata?.linkDomain

  const isNowItem = index === 0 && clipboard.updatedAt > Date.now() - MINUTE_IN_MS
  const isMp3 = clipboard?.isLink && clipboard?.value?.endsWith('.mp3')

  useEffect(() => {
    if (
      !hasLinkCard &&
      clipboard?.isLink &&
      clipboard?.value &&
      !isEmailNotUrl(stringValue) &&
      !hasClipboardHistoryURLErrors &&
      !hasGenerateLinkMetaDataInProgress &&
      isAutoGenerateLinkCardsEnabled
    ) {
      if (clipboard.historyOptions) {
        try {
          clipboard.options = JSON.parse(clipboard.historyOptions)
        } catch (e) {
          clipboard.options = null
        }
      }

      if (clipboard.options?.noLinkCard) {
        return
      }
      addToGenerateLinkMetaDataInProgress?.(clipboard.historyId)

      generateLinkMetaData?.(clipboard.historyId, clipboard.value)
        .then(e => {
          invalidateClipboardHistoryQuery()
          removeToGenerateLinkMetaDataInProgress?.(clipboard.historyId)
        })
        .catch(e => {
          removeToGenerateLinkMetaDataInProgress?.(clipboard.historyId)
          addToClipboardHistoryIdsURLErrors(clipboard.historyId)
        })
    }
  }, [clipboard?.isLink, hasLinkCard])

  const showCopyPasteIndexNumber =
    (isKeyCtrlPressed.value || (isKeyAltPressed.value && !isWindows)) &&
    typeof index !== 'undefined' &&
    index < 10

  const pinnedTopOffsetFirst = !isPinnedTopFirst ? 'top-[-10px]' : 'top-[5px]'
  const bgToolsPanel = `${
    isKeyboardSelected
      ? 'bg-blue-50 dark:bg-blue-950/80'
      : !isPinnedTop && isOverPinned && !isNowItem
        ? 'bg-orange-50 dark:!bg-transparent'
        : isDeleting
          ? 'bg-red-50 dark:bg-red-950/80'
          : contextMenuOpen.value
            ? `bg-slate-100 dark:bg-slate-900 ${
                isNowItem ? 'bg-teal-50/80 dark:bg-sky-900/80' : ''
              }`
            : isCopiedOrPasted
              ? 'dark:bg-green-950/80'
              : isSaved
                ? 'dark:bg-sky-950/80'
                : isSelected
                  ? 'bg-yellow-50 dark:bg-amber-950/80'
                  : isNowItem
                    ? 'bg-teal-50/90 dark:bg-sky-950'
                    : 'bg-white dark:bg-slate-950/80'
  }`

  return (
    <Box
      style={{
        ...style,
        opacity:
          (isDeleting || isOverPinned) && !isDragPreview
            ? 1
            : isDragging
              ? 0.7
              : isDragPreview
                ? 0.7
                : undefined,
      }}
      ref={isDragPreview && !(isHovering || isSelected) ? null : setNodeRef}
      title={
        clipboard?.copiedFromApp && isHovering
          ? `${t('Source')}: ${clipboard?.copiedFromApp}`
          : ''
      }
      {...(isSelected || isHovering ? listeners : {})}
    >
      <Box ref={rowRef} tabIndex={0} role="option" aria-selected={isKeyboardSelected}>
        {showTimeAgo && (
          <Box
            className={`flex justify-center text-gray-400 text-xs ${
              index === 0 ? 'pt-0' : 'pt-2'
            }`}
          >
            {timeAgo}
          </Box>
        )}

        <ContextMenu
          onOpenChange={isOpen => {
            contextMenuOpen.value = isOpen
            showHistoryDeleteConfirmationId.value = null
          }}
        >
          <ContextMenuTrigger
            ref={isHovering || isSelected ? contextMenuTriggerRef : null}
          >
            <Box
              className="relative select-none history-item focus:outline-none"
              ref={rowKeyboardRef}
              tabIndex={0}
              role="option"
              aria-selected={isKeyboardSelected}
            >
              <Box
                className={`rounded-md justify-start duration-300 relative px-3 py-1 hover:shadow-sm my-0.5 shadow-none border-2 flex flex-col ${
                  index === 0 &&
                  clipboard.updatedAt > Date.now() - MINUTE_IN_MS &&
                  !isCopiedOrPasted &&
                  !isDeleting &&
                  !isKeyboardSelected &&
                  !isSelected
                    ? 'bg-teal-50 hover:border-slate-300 dark:bg-sky-900/40 dark:hover:border-slate-700 hover:bg-teal-50/90 hover:dark:bg-sky-950'
                    : isKeyboardSelected
                      ? `bg-blue-50 !shadow-sm border-blue-300 dark:bg-blue-950/80 dark:border-blue-900/80 hover:border-blue-300/80 dark:hover:border-blue-800 hover:bg-blue-50/80 ${
                          isPinnedTop ? ' dark:!bg-amber-950' : ''
                        }`
                      : isDeleting && !isDragPreview
                        ? 'border-red-400 bg-red-50 dark:bg-red-950/80 dark:border-red-900/80 dark:hover:border-red-800'
                        : contextMenuOpen.value
                          ? 'bg-slate-100 dark:bg-slate-950/80 border-slate-300 dark:border-slate-600'
                          : isSaved && !isDragPreview
                            ? 'bg-sky-50 border-sky-600 dark:bg-sky-950/80 dark:border-sky-900/80 dark:hover:border-sky-800'
                            : isCopiedOrPasted && !isDragPreview
                              ? `bg-green-50 border-green-600 dark:bg-green-950/80 dark:border-green-800`
                              : isSelected
                                ? `bg-amber-50 border-amber-300 dark:bg-amber-950/80 dark:border-amber-900/80 hover:border-amber-300/80 dark:hover:border-amber-800 hover:bg-amber-50/80 ${
                                    isPinnedTop ? '!border dark:!bg-amber-950' : ''
                                  }`
                                : `hover:bg-white dark:hover:bg-slate-950/80 ${
                                    isLargeView
                                      ? 'border-slate-500 bg-white dark:bg-slate-950 hover:dark:border-slate-500'
                                      : `${
                                          !isPinnedTop && isOverPinned
                                            ? 'border-orange-300 dark:border-orange-400/80 dark:bg-orange-900/80 bg-orange-50'
                                            : isPinnedTop
                                              ? 'bg-slate-50 dark:!bg-slate-900 dark:hover:!bg-slate-950 hover:!border-orange-300/90 border-orange-300/50 dark:!border-orange-800/60 dark:hover:!border-orange-900'
                                              : 'bg-slate-50 hover:border-slate-300 dark:border-slate-800'
                                        }`
                                  } dark:hover:border-slate-700 dark:bg-slate-900 ${
                                    isDragPreview ? 'dark:border-slate-700' : ''
                                  }`
                }`}
                onClickCapture={e => {
                  if ((isWindows && e.ctrlKey) || (e.metaKey && !isWindows)) {
                    setSelectHistoryItem(clipboard.historyId)
                  } else if (e.ctrlKey || e.metaKey) {
                    e.preventDefault()
                    e.stopPropagation()
                  } else if (e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    window.getSelection()?.removeAllRanges()
                    setLargeViewItemId(isLargeView ? null : clipboard.historyId)
                  } else if (largeViewItemId && !isLargeView) {
                    window.getSelection()?.removeAllRanges()
                    setLargeViewItemId(clipboard.historyId)
                  } else {
                    hoveringHistoryRowId.value = !isPinnedTop
                      ? clipboard.historyId
                      : `${clipboard.historyId}::pinned`
                  }
                }}
                onMouseEnter={() => {
                  hoveringHistoryRowId.value = !isPinnedTop
                    ? clipboard.historyId
                    : `${clipboard.historyId}::pinned`
                }}
                onMouseLeave={() => {
                  hoveringHistoryRowId.value = null
                }}
                onDoubleClickCapture={e => {
                  if (!getSelectedText().text) {
                    if (e.altKey || e.metaKey) {
                      onCopyPaste(clipboard.historyId)
                    } else {
                      onCopy(clipboard.historyId)
                    }
                  }
                }}
              >
                <Box
                  className={`${
                    showSelectHistoryItems || showCopyPasteIndexNumber
                      ? 'flex flex-row -ml-1'
                      : ''
                  }`}
                >
                  {showSelectHistoryItems && !isDragPreview ? (
                    <Box className="flex flex-row items-center pr-2 z-100">
                      <input
                        type="checkbox"
                        className="form-checkbox h-[16px] w-[16px] bg-slate-400"
                        onChange={() => {
                          setSelectHistoryItem(clipboard.historyId)
                        }}
                        checked={isSelected}
                      />
                    </Box>
                  ) : (
                    showCopyPasteIndexNumber && (
                      <Box className="flex flex-row items-center pr-2 z-100">
                        <Badge
                          className="font-mono bg-slate-200 dark:bg-slate-700 !py-0"
                          variant="outline"
                        >
                          {index === 9 ? 0 : index + 1}
                        </Badge>
                      </Box>
                    )
                  )}
                  {clipboard.isImageData ? (
                    <Box className="text-ellipsis self-start text-xs w-full _select-text overflow-hidden cursor-pointer">
                      <Box className="flex px-0 py-1 items-center justify-center w-full">
                        <ImageWithFallback
                          src={stringValue}
                          hasError={isBrokenImage}
                          onErrorCallback={() => {
                            setBrokenImageItem(clipboard.historyId)
                          }}
                          draggable={false}
                          decoding="async"
                          onLoad={() => {
                            contentElementRendered.value = true
                          }}
                          className="max-w-full max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-700"
                        />
                      </Box>
                      <code className="pb-0.5">
                        {searchTerm ? (
                          highlightWithPreviewMatchedText(clipboard.value, searchTerm)
                        ) : (
                          <span>{clipboard.valuePreview}</span>
                        )}
                      </code>
                    </Box>
                  ) : clipboard.isLink && clipboard.isImage ? (
                    <Box className="text-ellipsis self-start text-xs w-full _select-text cursor-pointer overflow-hidden">
                      <Box className="flex px-0 pt-1.5 pb-0.5 items-center justify-center w-full">
                        <ImageWithFallback
                          src={ensureUrlPrefix(stringValue)}
                          hasError={isBrokenImage}
                          height={clipboard.imageHeight}
                          onErrorCallback={() => {
                            setBrokenImageItem(clipboard.historyId)
                          }}
                          draggable={false}
                          decoding="async"
                          onLoad={() => {
                            contentElementRendered.value = true
                          }}
                          className="max-w-full max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-700"
                        />
                      </Box>
                      <code className="pb-0.5">
                        {searchTerm
                          ? highlightWithPreviewMatchedText(stringValue, searchTerm)
                          : hyperlinkText(stringValue, clipboard.arrLinks)}
                      </code>
                    </Box>
                  ) : clipboard.isLink && clipboard.isVideo ? (
                    <Box className="text-ellipsis self-start text-xs w-full _select-text cursor-pointer overflow-hidden">
                      <YoutubeEmbed url={stringValue} />
                      <code className="pb-0.5">
                        {searchTerm
                          ? highlightWithPreviewMatchedText(stringValue, searchTerm)
                          : hyperlinkText(stringValue, clipboard.arrLinks)}
                      </code>
                    </Box>
                  ) : clipboard.isImage && clipboard.imageDataUrl ? (
                    <Box className="px-0 py-1.5 flex items-center justify-center w-full">
                      <img
                        src={clipboard.imageDataUrl}
                        draggable={false}
                        decoding="async"
                        height={clipboard.imageHeight}
                        onLoad={() => {
                          contentElementRendered.value = true
                        }}
                        className="max-w-full max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-700"
                      />
                    </Box>
                  ) : clipboard.detectedLanguage && clipboard.valuePreview ? (
                    <Box
                      ref={ref => {
                        if (ref) {
                          contentElementRendered.value = true
                        }
                      }}
                      className={`text-ellipsis self-start text-sm w-full overflow-hidden`}
                    >
                      <Highlight
                        theme={isDark ? themes.vsDark : themes.github}
                        code={isExpanded ? stringValue : clipboard.valuePreview}
                        language={clipboard.detectedLanguage}
                      >
                        {({ className, style, tokens, getLineProps, getTokenProps }) => {
                          return (
                            <code className={`${className}`} style={style}>
                              {tokens.map((line, i) => {
                                const isLastLine =
                                  i === tokens.length - 1 &&
                                  clipboard.valueMorePreviewLines &&
                                  !isExpanded
                                return (
                                  <div
                                    key={i}
                                    {...getLineProps({ line })}
                                    className={`${
                                      isWrapText
                                        ? 'whitespace-pre-wrap'
                                        : 'whitespace-pre'
                                    } overflow-hidden text-ellipsis`}
                                  >
                                    {line.map((token, key) => (
                                      <span
                                        key={key}
                                        {...getTokenProps({ token })}
                                        className="_select-text cursor-pointer"
                                      >
                                        {!searchTerm
                                          ? token.content
                                          : highlightMatchedText(
                                              token.content,
                                              searchTerm
                                            )}
                                      </span>
                                    ))}
                                    {isLastLine && (
                                      <span className="select-none">...</span>
                                    )}
                                  </div>
                                )
                              })}
                            </code>
                          )
                        }}
                      </Highlight>
                      {clipboard.valueMorePreviewLines && (
                        <Box className="select-none"> {'\u00A0'} </Box>
                      )}
                    </Box>
                  ) : (
                    <Box
                      ref={ref => {
                        if (ref) {
                          contentElementRendered.value = true
                        }
                      }}
                      className="text-ellipsis self-start text-sm w-full overflow-hidden"
                    >
                      {hasLinkCard && (
                        <Box className="self-start mt-1.5 mb-1 text-xs w-full overflow-hidden">
                          <LinkCard
                            title={clipboard.linkMetadata?.linkTitle}
                            isTrack={clipboard.linkMetadata?.linkIsTrack}
                            trackTitle={clipboard.linkMetadata?.linkTrackTitle}
                            trackArtist={clipboard.linkMetadata?.linkTrackArtist}
                            trackAlbum={clipboard.linkMetadata?.linkTrackAlbum}
                            description={clipboard.linkMetadata?.linkDescription}
                            favicon={clipboard.linkMetadata?.linkFavicon}
                            link={clipboard?.linkMetadata?.linkUrl ?? null}
                            image={clipboard.linkMetadata?.linkImage}
                            historyId={clipboard.historyId}
                            domain={clipboard.linkMetadata?.linkDomain}
                          />
                        </Box>
                      )}
                      {isExpanded ? (
                        <code className="justify-start cursor-pointer">
                          {searchTerm
                            ? highlightMatchedText(stringValue, searchTerm)
                            : hyperlinkText(stringValue, clipboard.arrLinks)}
                          {clipboard.valueMorePreviewChars && (
                            <Box className="select-none"> {'\u00A0'} </Box>
                          )}
                        </code>
                      ) : (
                        <code className="justify-start cursor-pointer whitespace-pre">
                          {searchTerm
                            ? highlightWithPreviewMatchedText(
                                stringValue ?? '',
                                searchTerm
                              )
                            : hyperlinkTextWithPreview({
                                previewLinkCard: !hasLinkCard && isLinkCardPreviewEnabled,
                                isPreviewError: hasClipboardHistoryURLErrors,
                                value: clipboard.valuePreview ?? '',
                                links: clipboard.arrLinks,
                                itemId: null,
                                historyId: clipboard.historyId,
                              })}
                          {clipboard.valueMorePreviewChars && (
                            <>
                              <span className="select-none">...</span>
                              <Box className="select-none"> {'\u00A0'} </Box>
                            </>
                          )}
                          {isMp3 && (
                            <PlayButton
                              src={stringValue}
                              hasLinkCard={hasLinkCard}
                              isPinnedBoard={isPinnedTop}
                              isPinned={clipboard.isPinned}
                              isStarred={clipboard.isFavorite}
                              id={clipboard.historyId}
                              type="history"
                            />
                          )}
                        </code>
                      )}
                    </Box>
                  )}
                  {(clipboard.valueMorePreviewLines ||
                    clipboard.valueMorePreviewChars) && (
                    <Box
                      className={`absolute left-1 bottom-1 flex flex-row items-center rounded mb-[2px] pl-0.5 ${bgToolsPanel}`}
                    >
                      <Box
                        className={`text-xs text-muted-foreground px-1 cursor-pointer`}
                        onClick={() => {
                          setExpanded(clipboard.historyId, !isExpanded)
                        }}
                      >
                        <ToolTip
                          text={!isExpanded ? t('Show all', { ns: 'common' }) : ''}
                          isCompact
                          isDisabled={isExpanded || isDragPreview}
                          delayDuration={2000}
                          side="bottom"
                          sideOffset={10}
                        >
                          {!isExpanded ? (
                            clipboard?.valueMorePreviewChars ? (
                              <>
                                +{clipboard.valueMorePreviewChars}{' '}
                                {t('chars', { ns: 'common' })}
                              </>
                            ) : (
                              <>
                                +{clipboard.valueMorePreviewLines}{' '}
                                {t('lines', { ns: 'common' })}
                              </>
                            )
                          ) : (
                            <>- {t('show less', { ns: 'common' })}</>
                          )}
                        </ToolTip>
                      </Box>
                      {isExpanded && (
                        <Box
                          className={`text-xs text-muted-foreground px-1.5 cursor-pointer`}
                          onClick={() => setWrapText(clipboard.historyId, !isWrapText)}
                        >
                          <ToolTip
                            text={
                              !isWrapText
                                ? t('Lines Wrap', { ns: 'common' })
                                : t('No Wrap', { ns: 'common' })
                            }
                            delayDuration={2000}
                            isCompact
                            side="bottom"
                            sideOffset={10}
                          >
                            {!isWrapText ? (
                              <WrapIcon width={20} height={20} />
                            ) : (
                              <NoWrapIcon width={20} height={20} />
                            )}
                          </ToolTip>
                        </Box>
                      )}
                    </Box>
                  )}
                  {clipboard.isImage && !clipboard.isLink && (
                    <Box className="absolute left-1 bottom-1 flex flex-row gap-1 rounded items-center pb-0.5 pl-0.5 z-100">
                      <Box
                        className={`text-xs text-muted-foreground px-1.5 rounded ${bgToolsPanel}`}
                        title={t('Image size in pixels', { ns: 'common' })}
                      >
                        {clipboard.imageWidth}x{clipboard.imageHeight}
                      </Box>
                    </Box>
                  )}
                  <>
                    {clipboard.isFavorite && (
                      <Star
                        className={`absolute text-transparent z-100 ${
                          clipboard.isPinned
                            ? 'fill-orange-400 dark:fill-orange-500/60'
                            : 'fill-yellow-400 dark:fill-yellow-500/70'
                        } pointer-events-none  right-[4px] top-[3px]`}
                        size={12}
                      />
                    )}

                    {clipboard.isPinned && !clipboard.isFavorite && !isPinnedTop && (
                      <Dot
                        className={`absolute text-orange-400 dark:text-orange-500/60 pointer-events-none top-[-5px] right-[-5px] z-auto`}
                        size={28}
                      />
                    )}
                  </>
                  <Box
                    className={`absolute right-1 bottom-1 flex flex-row gap-1 items-center pb-0 pl-0.5 mb-[2px] rounded`}
                  >
                    {isHovering || isSelected ? (
                      <div className={`flex ${bgToolsPanel}`} key="hover-panel">
                        {isPinnedTop ? (
                          <Flex className="text-xs text-muted-foreground rounded px-1">
                            <ToolTip
                              text={t('Move Up', { ns: 'common' })}
                              delayDuration={2000}
                              isCompact
                              isDisabled={isDragPreview || isDisabledPinnedMoveUp}
                              side="bottom"
                              sideOffset={10}
                            >
                              <Box
                                className={`${
                                  isDisabledPinnedMoveUp
                                    ? 'cursor-default text-gray-300 dark:text-gray-800'
                                    : 'cursor-pointer text-slate-500'
                                } px-1 flex items-center justify-center`}
                              >
                                <MoveUp
                                  size={14}
                                  onClick={() => {
                                    if (isDisabledPinnedMoveUp) {
                                      return
                                    }
                                    onMovePinnedUpDown({
                                      historyId: clipboard.historyId,
                                      moveUp: true,
                                    })
                                  }}
                                />
                              </Box>
                            </ToolTip>
                            <ToolTip
                              text={t('Move Down', { ns: 'common' })}
                              delayDuration={2000}
                              isCompact
                              isDisabled={isDragPreview || isDisabledPinnedMoveDown}
                              side="bottom"
                              sideOffset={10}
                            >
                              <Box
                                className={`${
                                  isDisabledPinnedMoveDown
                                    ? 'cursor-default text-gray-300 dark:text-gray-800'
                                    : 'cursor-pointer text-slate-500'
                                } px-1 flex items-center justify-center`}
                              >
                                <MoveDown
                                  size={14}
                                  onClick={() => {
                                    if (isDisabledPinnedMoveDown) {
                                      return
                                    }
                                    onMovePinnedUpDown({
                                      historyId: clipboard.historyId,
                                      moveDown: true,
                                    })
                                  }}
                                />
                              </Box>
                            </ToolTip>
                          </Flex>
                        ) : (
                          clipboard.timeAgoShort && (
                            <Box className="text-xs text-muted-foreground rounded px-1">
                              <ToolTip
                                text={format(clipboard.updatedAt, 'PPpp')}
                                delayDuration={2000}
                                isCompact
                                isDisabled={isDragPreview}
                                side="bottom"
                                sideOffset={10}
                              >
                                {clipboard.timeAgoShort}
                              </ToolTip>
                            </Box>
                          )
                        )}
                        <ToolTip
                          text={
                            isKeyAltPressed.value
                              ? t('Copy and Paste', { ns: 'common' })
                              : t('Copy to Clipboard', { ns: 'common' })
                          }
                          delayDuration={2000}
                          isCompact
                          isDisabled={isDragPreview}
                          side="bottom"
                          sideOffset={10}
                        >
                          <Box className="text-xs cursor-pointer text-slate-500 hover:text-green-700 px-1 border-0 flex items-center justify-center">
                            {isKeyAltPressed.value ? (
                              <ClipboardPaste
                                size={14}
                                onClick={() => {
                                  onCopyPaste(clipboard.historyId)
                                }}
                              />
                            ) : (
                              <Clipboard
                                size={14}
                                onClick={() => {
                                  onCopy(clipboard.historyId)
                                }}
                              />
                            )}
                          </Box>
                        </ToolTip>
                        <ToolTip
                          text={t('Drag', { ns: 'common' })}
                          delayDuration={2000}
                          isCompact
                          isDisabled={isDragPreview}
                          side="bottom"
                          sideOffset={10}
                        >
                          <Box
                            className="text-xs cursor-move text-slate-500 px-1 border-0 flex items-center  justify-center"
                            {...listeners}
                          >
                            <Grip size={16} />
                          </Box>
                        </ToolTip>
                        <ToolTip
                          text={t('Action Menu', { ns: 'common' })}
                          delayDuration={2000}
                          isCompact
                          isDisabled={isDragPreview}
                          side="bottom"
                          sideOffset={10}
                        >
                          <Box
                            ref={contextMenuButtonRef}
                            className="text-xs px-1 cursor-pointer text-slate-500 pl-0 pr-0 flex items-center justify-center"
                          >
                            <MoreVertical
                              size={16}
                              onClick={() => {
                                contextMenuTriggerRef?.current?.dispatchEvent(
                                  new MouseEvent('contextmenu', {
                                    bubbles: true,
                                    clientX:
                                      contextMenuButtonRef?.current?.getBoundingClientRect()
                                        .x,
                                    clientY:
                                      contextMenuButtonRef?.current?.getBoundingClientRect()
                                        .y,
                                  })
                                )
                              }}
                            />
                          </Box>
                        </ToolTip>
                      </div>
                    ) : (
                      <div className={`${labelsOffset}`} key="labels-panel">
                        {clipboard.hasMaskedWords && (
                          <Box
                            className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-0.5`}
                          >
                            <Dot size={16} />
                          </Box>
                        )}

                        {clipboard.isMasked && (
                          <Box
                            className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
                          >
                            {t('Type:::Secret', { ns: 'common' })}
                          </Box>
                        )}

                        {clipboard.detectedLanguage && (
                          <Box
                            className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
                          >
                            {clipboard.detectedLanguage}
                          </Box>
                        )}

                        {clipboard.isLink && (
                          <Box
                            className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
                          >
                            {clipboard.isVideo
                              ? t('Type:::Video', { ns: 'common' })
                              : isEmailNotUrl(stringValue)
                                ? t('Type:::Email', { ns: 'common' })
                                : isMp3
                                  ? t('Type:::Mp3', { ns: 'common' })
                                  : t('Type:::Link', { ns: 'common' })}
                          </Box>
                        )}

                        {clipboard.hasEmoji && (
                          <Box
                            className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
                          >
                            {t('Type:::Emoji', { ns: 'common' })}
                          </Box>
                        )}

                        {clipboard.isImageData && (
                          <Box
                            className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
                          >
                            {t('Type:::Image Base64', { ns: 'common' })}
                          </Box>
                        )}
                      </div>
                    )}
                  </Box>
                  {selectedItemsCount > 1 && (
                    <Box className="absolute left-[-12px] top-[-12px] flex">
                      <Badge variant={isDeleting ? 'destructive' : 'default'}>
                        {selectedItemsCount}
                      </Badge>
                    </Box>
                  )}
                </Box>
              </Box>
              {isSaved ? (
                <Box
                  className={`absolute z-50 w-full ${pinnedTopOffsetFirst} flex justify-center fade-in-animation`}
                >
                  <Badge
                    variant="default"
                    className="bg-sky-700 dark:bg-sky-800 dark:text-blue-200 pointer-events-none px-2 py-[1.5px] pr-4 mr-[-6px] text-[10px] uppercase font-semibold"
                  >
                    <ArrowDownToLine size={14} className="mr-1" />
                    {t('Saved', { ns: 'common' })}
                  </Badge>
                </Box>
              ) : isCopiedOrPasted && !pastingCountDown ? (
                <Box
                  className={`absolute z-50 w-full ${pinnedTopOffsetFirst} flex justify-center ${
                    showCopyPasteIndexNumber ? '' : 'fade-in-animation'
                  }`}
                >
                  <Badge
                    variant="default"
                    className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 py-[1.5px] pr-4 _mr-[-6px] text-[10px] uppercase font-semibold"
                  >
                    <Check size={14} className="mr-1" />
                    {isCopied
                      ? t('Copied', { ns: 'common' })
                      : isPasted
                        ? t('Pasted', { ns: 'common' })
                        : ''}
                  </Badge>
                </Box>
              ) : !isLargeView ? (
                pastingCountDown &&
                pastingCountDown > 0 && (
                  <Box
                    className={`absolute z-50 w-full ${pinnedTopOffsetFirst} flex justify-center`}
                  >
                    <Badge
                      variant="default"
                      className="bg-green-700 dark:bg-green-800 dark:text-white px-3 py-[1.5px] pr-4 mr-[-6px] text-[10px] font-semibold"
                    >
                      {t('Paste in {{pastingCountDown}}...', {
                        ns: 'common',
                        pastingCountDown,
                      })}
                    </Badge>
                  </Box>
                )
              ) : (
                <Box
                  className={`absolute z-50 w-full ${pinnedTopOffsetFirst} flex justify-center`}
                >
                  <Badge
                    variant="default"
                    className="px-3 dark:bg-slate-600 hover:bg-slate-500/100 pr-2.5"
                  >
                    <Text
                      className="mr-1 bg-slate-500 dark:bg-slate-600 pointer-events-none dark:!text-slate-300"
                      color="muted"
                    >
                      {t('In View', { ns: 'common' })}
                    </Text>
                    <X
                      size={14}
                      className="cursor-pointer  dark:text-slate-300"
                      onClick={() => {
                        setLargeViewItemId(null)
                      }}
                    />
                  </Badge>
                </Box>
              )}
            </Box>
          </ContextMenuTrigger>
          <ClipboardHistoryRowContextMenu
            historyId={clipboard.historyId}
            copiedFromApp={clipboard.copiedFromApp}
            isMasked={clipboard.isMasked}
            setSavingItem={setSavingItem}
            value={clipboard.value}
            isImage={clipboard.isImage}
            isMp3={isMp3}
            isText={clipboard.isText}
            isPinned={clipboard.isPinned}
            isFavorite={clipboard.isFavorite}
            isImageData={clipboard.isImageData}
            detectedLanguage={clipboard.detectedLanguage}
            setLargeViewItemId={setLargeViewItemId}
            isLargeView={isLargeView}
            arrLinks={clipboard.arrLinks}
            hasLinkCard={hasLinkCard}
            isSelected={isSelected}
            invalidateClipboardHistoryQuery={invalidateClipboardHistoryQuery}
            generateLinkMetaData={generateLinkMetaData}
            removeLinkMetaData={removeLinkMetaData}
            setSelectHistoryItem={setSelectHistoryItem}
            setSelectedHistoryItems={setSelectedHistoryItems}
            selectedHistoryItems={selectedHistoryItems}
            onCopyPaste={onCopyPaste}
            setHistoryFilters={setHistoryFilters}
            setAppFilters={setAppFilters}
          />
        </ContextMenu>
      </Box>
    </Box>
  )
}

export const ClipboardHistoryRow = ClipboardHistoryRowComponent
