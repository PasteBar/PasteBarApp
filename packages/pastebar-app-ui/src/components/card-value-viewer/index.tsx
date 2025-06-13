import {
  Children,
  cloneElement,
  createRef,
  FC,
  isValidElement,
  memo,
  MutableRefObject,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { bbCode } from '~/libs/bbcode'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { ensureUrlPrefix, escapeRegExp, maskValue } from '~/lib/utils'

import { LinkMetadata } from '~/types/history'

import LinkCard from '../atoms/link-card/link-card'
import mergeRefs from '../atoms/merge-refs'
import { CardSocialEmbed } from '../social-embend/CardSocialEmbed'
import { Box, TextNormal } from '../ui'
import YoutubeEmbed from '../video-player/YoutubeEmbed'

const highlightSearchTermInNode = (
  node: ReactNode,
  searchTerm: string,
  highlightedRefs: MutableRefObject<RefObject<HTMLElement>[]>
): React.ReactNode => {
  const searchRegex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')

  if (typeof node === 'string') {
    const parts = node.split(searchRegex)
    const ref = createRef()

    return parts.map((part: string, index: number) => {
      // @ts-expect-error
      highlightedRefs.current.push(ref)

      return part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span
          key={index}
          className="bg-yellow-300 dark:bg-amber-400 dark:text-black search-pulse-animation"
          ref={mergeRefs(ref)}
        >
          {part}
        </span>
      ) : (
        part
      )
    })
  } else if (isValidElement(node)) {
    if (node?.props?.text && typeof node.props.text === 'string') {
      const parts = node.props.text.split(searchRegex)
      const ref = createRef()

      return cloneElement(
        node,
        {
          ...node.props,
          text: (
            <span>
              {parts.map((part: string, index: number) => {
                // @ts-expect-error
                highlightedRefs.current.push(ref)

                return part.toLowerCase() === searchTerm.toLowerCase() ? (
                  <span
                    key={index}
                    className="bg-yellow-300 dark:bg-yellow-600 search-pulse-animation"
                    ref={mergeRefs(ref)}
                  >
                    {bbCode.parse(part)}
                  </span>
                ) : (
                  <span>{bbCode.parse(part)}</span>
                )
              })}
            </span>
          ),
        },
        node.props.children
      )
    } else {
      return cloneElement(
        node,
        node.props,
        ...Children.toArray(node.props.children).map(child => {
          return highlightSearchTermInNode(child, searchTerm, highlightedRefs)
        })
      )
    }
  } else {
    return node
  }
}

interface CardValueViewerProps {
  isWrapped: boolean
  valuePreview: string
  itemId?: UniqueIdentifier
  isLargeView: boolean | undefined
  isImageData: boolean | undefined
  isImage: boolean | undefined
  isCode: boolean | undefined
  isMasked?: boolean | undefined
  isVideo?: boolean | undefined
  isLink?: boolean | undefined
  isPath?: boolean | undefined
  morePreviewLines: number | null
  hasLinkCard: boolean | undefined
  metadataLinkByItemId: LinkMetadata | undefined
  metadataLinkImageWidth?: number
  isExpanded: boolean
  searchTerm: string
  isDark: boolean
  textValue: string
}

export const CardValueViewer: FC<CardValueViewerProps> = ({
  isWrapped,
  searchTerm,
  itemId,
  valuePreview,
  isCode,
  isImage,
  isLink,
  isPath,
  isVideo,
  isMasked,
  isLargeView,
  textValue,
  hasLinkCard,
  metadataLinkByItemId,
  metadataLinkImageWidth = 24,
  isImageData,
  morePreviewLines,
  isDark,
  isExpanded,
}) => {
  const highlightedRefs = useRef<React.RefObject<HTMLElement>[]>([])
  const wrapped = isLink || isVideo || isPath || isWrapped

  const isTwitter =
    metadataLinkByItemId?.linkDomain === 'x.com' ||
    metadataLinkByItemId?.linkDomain === 'twitter.com'
  const isInstagram = metadataLinkByItemId?.linkDomain === 'www.instagram.com'

  const isSocialEmbed = isTwitter || isInstagram

  const valuePreviewParsed = useMemo(() => {
    if (!isImageData && !isCode && !isImage && valuePreview) {
      return isMasked
        ? maskValue(bbCode.remove(valuePreview))
        : bbCode.parse(valuePreview)
    }
  }, [valuePreview])

  const valueParsed = useMemo(() => {
    if (!isImageData && !isCode && !isImage && textValue) {
      return isMasked ? maskValue(bbCode.remove(textValue)) : bbCode.parse(textValue)
    }
  }, [textValue])

  const highlightedContent = useMemo(() => {
    if (searchTerm.length > 1) {
      highlightedRefs.current = []
      return highlightSearchTermInNode(valueParsed, searchTerm, highlightedRefs)
    } else {
      return isExpanded ? valueParsed : valuePreviewParsed
    }
  }, [isExpanded, searchTerm, valueParsed, valuePreviewParsed])

  useEffect(() => {
    if (highlightedRefs.current.length > 0) {
      highlightedRefs.current[0].current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [highlightedContent])

  return (
    <OverlayScrollbarsComponent
      className={`clip-card-text-view ${
        !isExpanded || morePreviewLines == null ? 'code-scroll-x pb-2' : ''
      }`}
      options={{
        scrollbars: {
          theme: isDark ? 'os-theme-light' : 'os-theme-dark',
          autoHide: 'never',
        },
      }}
      style={{
        minWidth: isLargeView ? 500 : undefined,
        maxHeight: isLargeView
          ? 'calc(100vh - 240px)'
          : isExpanded || morePreviewLines == null
            ? 200
            : 120,

        maxWidth: '100%',
      }}
    >
      {isVideo && isLargeView ? (
        <YoutubeEmbed url={valuePreview} minWidth={isLargeView ? 530 : 0} />
      ) : isSocialEmbed ? (
        <CardSocialEmbed
          url={valuePreview}
          isTwitter={isTwitter}
          isInstagram={isInstagram}
          id={itemId}
        />
      ) : (
        hasLinkCard && (
          <Box className="self-start mt-1 mb-1 text-xs w-full select-none overflow-hidden">
            <LinkCard
              isDisabled={
                ensureUrlPrefix(textValue) !== metadataLinkByItemId?.linkUrl &&
                !Boolean(metadataLinkByItemId?.linkIsTrack)
              }
              title={metadataLinkByItemId?.linkTitle}
              isVideo={isVideo}
              videoSrc={valuePreview}
              description={metadataLinkByItemId?.linkDescription}
              favicon={metadataLinkByItemId?.linkFavicon}
              isTrack={metadataLinkByItemId?.linkIsTrack}
              trackTitle={metadataLinkByItemId?.linkTrackTitle}
              trackArtist={metadataLinkByItemId?.linkTrackArtist}
              itemId={itemId}
              trackAlbum={metadataLinkByItemId?.linkTrackAlbum}
              link={metadataLinkByItemId?.linkUrl}
              imageWidth={metadataLinkImageWidth}
              image={metadataLinkByItemId?.linkImage}
              domain={metadataLinkByItemId?.linkDomain}
            />
          </Box>
        )
      )}
      <TextNormal
        className={`self-start text-sm font-normal select-text break-all ${
          wrapped ? 'whitespace-pre-wrap' : 'whitespace-pre'
        } ${isExpanded ? '!overflow-visible pb-1.5' : ''}`}
      >
        {highlightedContent}
        {!isExpanded && morePreviewLines && <span className="select-none">...</span>}
      </TextNormal>
    </OverlayScrollbarsComponent>
  )
}

export const CardValueViewerPropsMemo = memo(CardValueViewer)
