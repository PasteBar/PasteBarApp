import { useRef, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { isKeyAltPressed, showLargeViewClipId } from '~/store'
import {
  ArrowDownToLine,
  Check,
  Clipboard,
  ClipboardPaste,
  Dot,
  MoreVertical,
  AlignLeft as NoWrapIcon,
  WrapText as WrapIcon,
  X,
} from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import ImageWithFallback from '~/components/atoms/image/image-with-fallback-on-error'
import LinkCard from '~/components/atoms/link-card/link-card'
import ToolTip from '~/components/atoms/tooltip'
import { CardSocialEmbed } from '~/components/social-embend/CardSocialEmbed'
import { Badge, Box, ContextMenu, ContextMenuTrigger } from '~/components/ui'
import YoutubeEmbed from '~/components/video-player/YoutubeEmbed'

import { useSignal } from '~/hooks/use-signal'

import { ClipboardHistoryItem, LinkMetadata } from '~/types/history'

import { highlightMatchedText, hyperlinkText } from '../helpers'
import ClipboardHistoryRowContextMenu from './context-menu/ClipboardHistoryRowContextMenu'

interface ClipboardHistoryLargeViewProps {
  isSelected?: boolean
  isDeleting?: boolean
  showTimeAgo?: boolean
  selectedItemsCount?: number
  timeAgo?: string | null
  searchTerm?: string
  isBrokenImage?: boolean
  isCopied?: boolean
  isMp3?: boolean
  isPasted?: boolean
  isSaved?: boolean
  setLargeViewItemId?: (historyId: UniqueIdentifier | null) => void
  setSavingItem?: (historyId: UniqueIdentifier | null) => void
  pastingCountDown?: number | null
  onCopy?: (id: UniqueIdentifier) => void
  onCopyPaste?: (id: UniqueIdentifier, delay?: number) => void
  invalidateClipboardHistoryQuery?: () => void
  setExpanded?: (historyId: UniqueIdentifier, isExpanded: boolean) => void
  setBrokenImageItem: (id: UniqueIdentifier) => void
  generateLinkMetaData?: (
    historyId: UniqueIdentifier,
    url: string
  ) => Promise<LinkMetadata | void>
  removeLinkMetaData?: (historyId: UniqueIdentifier) => Promise<void>
  setSelectHistoryItem?: (id: UniqueIdentifier) => void
  clipboard?: ClipboardHistoryItem
  isDark: boolean
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ClipboardHistoryLargeViewComponent({
  clipboard,
  isDark,
  searchTerm,
  isSelected = false,
  isDeleting = false,
  timeAgo = null,
  isCopied,
  isPasted,
  isSaved,
  isMp3,
  setSavingItem = () => {},
  setLargeViewItemId = () => {},
  pastingCountDown = null,
  onCopyPaste = () => {},
  onCopy = () => {},
  invalidateClipboardHistoryQuery = () => {},
  generateLinkMetaData = () => Promise.resolve(),
  removeLinkMetaData = () => Promise.resolve(),
  isBrokenImage = false,
  setBrokenImageItem = () => {},
  setSelectHistoryItem = () => {},
}: ClipboardHistoryLargeViewProps) {
  const { t } = useTranslation()
  const contextMenuOpen = useSignal<boolean>(false)
  const [isWrapText, setWrapText] = useState(false)
  const contextMenuButtonRef = useRef<HTMLDivElement>(null)
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null)

  const textValue: string = clipboard?.value ?? ''
  const hasLinkCard =
    clipboard?.isLink &&
    clipboard?.linkMetadata?.linkTitle &&
    clipboard?.linkMetadata?.linkDomain

  const isCopiedOrPasted = isCopied || isPasted || isSaved

  const isTwitter =
    clipboard?.linkMetadata?.linkDomain === 'x.com' ||
    clipboard?.linkMetadata?.linkDomain === 'twitter.com'
  const isInstagram = clipboard?.linkMetadata?.linkDomain === 'www.instagram.com'

  const isSocialEmbed = isTwitter || isInstagram

  return clipboard ? (
    <Box className="max-w-full max-h-full select-none">
      <Box className="flex justify-center text-gray-400 text-xs my-2">{timeAgo}</Box>
      <ContextMenu
        onOpenChange={isOpen => {
          contextMenuOpen.value = isOpen
        }}
      >
        <ContextMenuTrigger ref={contextMenuTriggerRef}>
          <Box className="select-none relative">
            <Box
              className={`rounded-md min-w-[300px] dark:border-slate-700 justify-start duration-300 px-2.5 py-1.5 hover:shadow-sm shadow-none border-2 flex flex-col ${
                isDeleting
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/80 dark:border-red-900/80 dark:hover:border-red-800'
                  : contextMenuOpen.value
                    ? 'bg-slate-100 dark:bg-slate-950/80 border-slate-300 dark:border-slate-600'
                    : isSaved
                      ? 'bg-sky-50 border-sky-600 dark:bg-sky-950/80 dark:border-sky-900/80 hover:border-sky-300/80 dark:hover:border-sky-800'
                      : isCopiedOrPasted
                        ? `bg-green-50 border-green-600 dark:bg-green-950/80 dark:border-green-800`
                        : isSelected
                          ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/80 dark:border-amber-900/80 dark:hover:border-amber-800 hover:border-amber-300/80 hover:bg-amber-50/80'
                          : 'bg-white border-slate-300 dark:hover:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <Box>
                {clipboard.isImageData ? (
                  <Box className="text-ellipsis self-start text-xs w-full select-text overflow-hidden">
                    <Box className="flex px-0 py-1 items-center justify-center">
                      <ImageWithFallback
                        src={textValue}
                        hasError={isBrokenImage}
                        key={clipboard.historyId}
                        decoding="async"
                        onErrorCallback={() => {
                          setBrokenImageItem(clipboard.historyId)
                        }}
                        className="min-h-20 object-scale-down animate-in fade-in duration-300 border-slate-100 dark:border-slate-700"
                      />
                    </Box>
                    <code className="pb-0.5">
                      {searchTerm ? (
                        highlightMatchedText(clipboard.valuePreview, searchTerm)
                      ) : (
                        <span>{clipboard.valuePreview}</span>
                      )}
                    </code>
                  </Box>
                ) : clipboard.isLink && clipboard.isImage ? (
                  <Box className="text-ellipsis self-start text-xs w-full select-text overflow-hidden">
                    <Box className="flex px-0 pt-1.5 pb-0.5 items-center justify-center">
                      <ImageWithFallback
                        src={ensureUrlPrefix(textValue)}
                        key={clipboard.historyId}
                        hasError={isBrokenImage}
                        height={clipboard.imageHeight}
                        decoding="async"
                        onErrorCallback={() => {
                          setBrokenImageItem(clipboard.historyId)
                        }}
                        className="min-h-20 object-scale-down animate-in fade-in duration-300 border-slate-100 dark:border-slate-700"
                      />
                    </Box>
                    <code className="pb-0.5">
                      {searchTerm
                        ? highlightMatchedText(textValue, searchTerm)
                        : hyperlinkText(textValue, clipboard.arrLinks)}
                    </code>
                  </Box>
                ) : clipboard.isImage && clipboard.imagePathFullRes ? (
                  <Box className="px-0 py-1.5 flex items-center justify-center">
                    <img
                      decoding="async"
                      srcSet={`${convertFileSrc(clipboard.imagePathFullRes)} 2x`}
                      key={clipboard.historyId}
                      src={convertFileSrc(clipboard.imagePathFullRes)}
                      className="min-h-20 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 object-scale-down animate-in fade-in duration-300"
                    />
                  </Box>
                ) : clipboard.detectedLanguage && clipboard.valuePreview ? (
                  <Box
                    className="text-ellipsis self-start text-sm w-full animate-in fade-in"
                    key={clipboard.historyId}
                  >
                    <Highlight
                      theme={isDark ? themes.vsDark : themes.github}
                      code={textValue}
                      language={clipboard.detectedLanguage}
                    >
                      {({ className, style, tokens, getLineProps, getTokenProps }) => {
                        return (
                          <OverlayScrollbarsComponent
                            options={{
                              overflow: {
                                x: 'scroll',
                                y: 'scroll',
                              },
                              scrollbars: {
                                theme: isDark ? 'os-theme-light' : 'os-theme-dark',
                                autoHide: 'never',
                              },
                            }}
                            style={{
                              maxWidth: '100%',
                            }}
                          >
                            <code className={`${className}`} style={style}>
                              {tokens
                                .filter((line, i) => {
                                  // Remove last line if it's empty (only contains whitespace or newlines)
                                  if (i === tokens.length - 1) {
                                    return line.some(token => token.content.trim() !== '')
                                  }
                                  return true
                                })
                                .map((line, i) => {
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
                                          className="select-text"
                                        >
                                          {!searchTerm
                                            ? token.content
                                            : highlightMatchedText(
                                                token.content,
                                                searchTerm
                                              )}
                                        </span>
                                      ))}
                                    </div>
                                  )
                                })}
                            </code>
                          </OverlayScrollbarsComponent>
                        )
                      }}
                    </Highlight>
                  </Box>
                ) : (
                  <Box
                    className="text-ellipsis self-start text-sm w-full overflow-hidden animate-in fade-in"
                    key={clipboard.historyId}
                  >
                    {clipboard.isVideo ? (
                      <YoutubeEmbed url={textValue} minWidth={530} />
                    ) : isSocialEmbed ? (
                      <CardSocialEmbed
                        url={textValue}
                        isTwitter={isTwitter}
                        isDark={isDark}
                        isInstagram={isInstagram}
                        id={clipboard.historyId}
                      />
                    ) : (
                      hasLinkCard && (
                        <Box className="self-start mt-1.5 mb-1 text-xs w-full select-text overflow-hidden">
                          <LinkCard
                            title={clipboard.linkMetadata?.linkTitle}
                            isTrack={clipboard.linkMetadata?.linkIsTrack}
                            trackTitle={clipboard.linkMetadata?.linkTrackTitle}
                            trackArtist={clipboard.linkMetadata?.linkTrackArtist}
                            trackAlbum={clipboard.linkMetadata?.linkTrackAlbum}
                            trackYear={clipboard.linkMetadata?.linkTrackYear}
                            description={clipboard.linkMetadata?.linkDescription}
                            favicon={clipboard.linkMetadata?.linkFavicon}
                            link={clipboard?.arrLinks[0]}
                            image={clipboard.linkMetadata?.linkImage}
                            domain={clipboard.linkMetadata?.linkDomain}
                          />
                        </Box>
                      )
                    )}
                    <code
                      className={`justify-start select-text ${
                        isWrapText ? 'whitespace-break-spaces' : 'whitespace-pre'
                      }`}
                    >
                      {searchTerm
                        ? highlightMatchedText(textValue, searchTerm)
                        : hyperlinkText(textValue, clipboard.arrLinks)}
                    </code>
                  </Box>
                )}
                <Box className="flex flex-row gap-1 items-center mt-1">
                  <Box className="flex flex-row gap-1 items-center pb-1 ml-auto">
                    <>
                      {!clipboard.isImage && (
                        <Box
                          className="text-xs text-muted-foreground px-1.5 ml-1.5 cursor-pointer"
                          onClick={() => setWrapText(!isWrapText)}
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
                              <WrapIcon width={20} height={20} strokeWidth={1.5} />
                            ) : (
                              <NoWrapIcon width={20} height={20} strokeWidth={1.5} />
                            )}
                          </ToolTip>
                        </Box>
                      )}

                      {clipboard.isImage && !clipboard.isLink && (
                        <Box className="flex flex-row gap-1 rounded items-center">
                          <Box className="bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-[12px] rounded-sm px-2">
                            {t('Type:::Image', { ns: 'common' })}
                          </Box>

                          <Box className="text-[11px] text-muted-foreground px-1 pt-0.5">
                            {clipboard.imageWidth}x{clipboard.imageHeight}
                          </Box>
                        </Box>
                      )}

                      {(clipboard.isMasked || clipboard.hasMaskedWords) && (
                        <Box
                          className={`bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm ${
                            clipboard.hasMaskedWords ? 'px-1' : 'px-1.5'
                          }`}
                        >
                          {clipboard.isMasked ? (
                            t('Type:::Secret', { ns: 'common' })
                          ) : (
                            <ToolTip
                              text={t('Found Masked Words', { ns: 'common' })}
                              delayDuration={600}
                              isCompact
                              side="bottom"
                              sideOffset={6}
                            >
                              <Dot size={18} />
                            </ToolTip>
                          )}
                        </Box>
                      )}

                      {clipboard.detectedLanguage && (
                        <Box
                          className={`bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-[12px] rounded-sm px-2`}
                        >
                          {clipboard.detectedLanguage}
                        </Box>
                      )}
                      {clipboard.isLink && (
                        <Box
                          className={`bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-[12px] rounded-sm px-2`}
                        >
                          {clipboard.isVideo
                            ? t('Type:::Video', { ns: 'common' })
                            : t('Type:::Link', { ns: 'common' })}
                        </Box>
                      )}
                      {clipboard.hasEmoji && (
                        <Box
                          className={`bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-[12px] rounded-sm px-2`}
                        >
                          {t('Type:::Emoji', { ns: 'common' })}
                        </Box>
                      )}
                      {clipboard.isImageData && (
                        <Box
                          className={`bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-[12px] rounded-sm px-2`}
                        >
                          {t('Type:::Image Base64', { ns: 'common' })}
                        </Box>
                      )}
                      <ToolTip
                        text={t('Copy to Clipboard', { ns: 'common' })}
                        delayDuration={2000}
                        isCompact
                        side="bottom"
                        sideOffset={10}
                      >
                        <Box className="text-xs cursor-pointer hover:text-green-700 text-slate-500 px-0 ml-1.5 border-0 flex items-center justify-center">
                          {isKeyAltPressed.value ? (
                            <ClipboardPaste
                              size={18}
                              onClick={() => {
                                onCopyPaste(clipboard.historyId)
                              }}
                            />
                          ) : (
                            <Clipboard
                              size={18}
                              onClick={() => {
                                onCopy(clipboard.historyId)
                              }}
                            />
                          )}
                        </Box>
                      </ToolTip>
                      <ToolTip
                        text={t('Action Menu', { ns: 'common' })}
                        delayDuration={2000}
                        isCompact
                        side="bottom"
                        sideOffset={10}
                      >
                        <Box
                          ref={contextMenuButtonRef}
                          className="text-xs cursor-pointer text-slate-500 pl-2 pr-0 flex items-center justify-center"
                        >
                          <MoreVertical
                            size={18}
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
                    </>
                  </Box>
                </Box>
              </Box>
            </Box>
            {isSaved ? (
              <Box className="absolute z-50 w-full top-[-13px] flex justify-center animate-in fade-in-500 duration-500">
                <Badge
                  variant="default"
                  className="dark:bg-sky-800 dark:text-blue-200 pointer-events-none px-2"
                >
                  <ArrowDownToLine size={14} className="mr-1" />
                  {t('Saved', { ns: 'common' })}
                </Badge>
              </Box>
            ) : isCopiedOrPasted && pastingCountDown === null ? (
              <Box className="absolute z-50 w-full top-[-13px] animate-in fade-in-500 duration-500 slide-in-from-bottom-1 flex justify-center">
                <Badge
                  variant="default"
                  className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 pr-4"
                >
                  <Check size={14} className="mr-1" />
                  {isCopied
                    ? t('Copied', { ns: 'common' })
                    : isPasted
                      ? t('Pasted', { ns: 'common' })
                      : ''}
                </Badge>
              </Box>
            ) : (
              pastingCountDown !== null &&
              pastingCountDown > 0 && (
                <Box className="absolute z-50 w-full top-[-13px] slide-in-from-bottom-1 flex justify-center">
                  <Badge
                    variant="default"
                    className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 pl-3"
                  >
                    {pastingCountDown &&
                      pastingCountDown > 0 &&
                      t('Paste in {{pastingCountDown}}...', {
                        ns: 'common',
                        pastingCountDown,
                      })}
                  </Badge>
                </Box>
              )
            )}
          </Box>
        </ContextMenuTrigger>
        <ClipboardHistoryRowContextMenu
          historyId={clipboard.historyId}
          isPinned={clipboard.isPinned}
          isFavorite={clipboard.isFavorite}
          isMp3={isMp3}
          isMasked={clipboard.isMasked}
          detectedLanguage={clipboard.detectedLanguage}
          setSavingItem={setSavingItem}
          value={clipboard.value}
          isImage={clipboard.isImage}
          isText={clipboard.isText}
          isImageData={clipboard.isImageData}
          setLargeViewItemId={setLargeViewItemId}
          isLargeView={true}
          arrLinks={clipboard.arrLinks}
          hasLinkCard={hasLinkCard}
          isSelected={isSelected}
          invalidateClipboardHistoryQuery={invalidateClipboardHistoryQuery}
          generateLinkMetaData={generateLinkMetaData}
          removeLinkMetaData={removeLinkMetaData}
          setSelectHistoryItem={setSelectHistoryItem}
          onCopyPaste={onCopyPaste}
        />
      </ContextMenu>
      <Box className="flex justify-center text-gray-400 text-xs my-2">
        <Badge
          variant="outline"
          className="bg-slate-100 px-2 pl-2.5 text-slate-400 cursor-pointer hover:bg-slate-300 dark:bg-slate-500 dark:text-slate-800 hover:dark:bg-slate-400"
          onClick={() => {
            setLargeViewItemId(null)
            showLargeViewClipId.value = null
          }}
        >
          {t('Close', { ns: 'common' })}
          <X size={14} className="ml-1" />
        </Badge>
      </Box>
    </Box>
  ) : null
}

export const ClipboardHistoryLargeView = ClipboardHistoryLargeViewComponent
