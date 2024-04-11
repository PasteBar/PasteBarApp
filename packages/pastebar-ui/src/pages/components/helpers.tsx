import { UniqueIdentifier } from '@dnd-kit/core'
import { TooltipPortal } from '@radix-ui/react-tooltip'
import { open } from '@tauri-apps/api/shell'

import { ensureUrlPrefix } from '~/lib/utils'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import PreviewLinkCard from '~/components/atoms/link-card/preview-link-card'

export function highlightMatchedText(
  text: string | null | undefined,
  searchTerm: string
) {
  if (!text) {
    return ''
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={index} className="bg-yellow-300 dark:bg-amber-400 dark:text-black">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}
export function highlightWithPreviewMatchedText(
  text: string | null | undefined,
  searchTerm: string,
  previewLength = 160
) {
  if (!text) {
    return ''
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi')
  const parts = text.split(regex)

  const firstMatchIndex = parts.findIndex(
    part => part.toLowerCase() === searchTerm.toLowerCase()
  )
  let startIndex = 0
  if (firstMatchIndex !== -1) {
    startIndex = Math.max(
      parts.slice(0, firstMatchIndex).join('').length - Math.floor(previewLength / 2),
      0
    )
  }

  while (
    startIndex > 0 &&
    text[startIndex - 1] !== ' ' &&
    text[startIndex - 1] !== '\n'
  ) {
    startIndex--
  }

  const endIndex = Math.min(startIndex + previewLength, text.length)
  const slicedParts = text.slice(startIndex, endIndex).split(regex)

  return (
    <span>
      {slicedParts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={index} className="bg-yellow-300 dark:bg-amber-400 dark:text-black">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}

export function hyperlinkText(value: string | null, links: string[] | string) {
  if (!value || !Array.isArray(links) || !links.length) {
    return value
  }

  const parts = links.reduce(
    (accumulatedParts, link) => {
      const safeLink = link.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape special characters
      return accumulatedParts.flatMap(part => {
        if (typeof part === 'string') {
          return part.split(new RegExp(`(${safeLink})`, 'g'))
        }
        return part
      })
    },
    [value]
  )

  return parts.map((part, index) =>
    links.includes(part) ? (
      <span
        key={index}
        className="underline cursor-pointer text-blue-700 dark:text-blue-400"
        onClick={() => {
          open(ensureUrlPrefix(part))
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function hyperlinkTextWithPreview({
  value,
  links,
  previewLinkCard,
  historyId,
  itemId,
}: {
  value: string | null
  links: string[] | string
  previewLinkCard: boolean
  historyId: UniqueIdentifier | null | undefined
  itemId: UniqueIdentifier | null | undefined
}) {
  if (!value || !Array.isArray(links) || !links.length) {
    return value
  }

  const parts = links.reduce(
    (accumulatedParts, link) => {
      const safeLink = link.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape special characters
      return accumulatedParts.flatMap(part => {
        if (typeof part === 'string') {
          return part.split(new RegExp(`(${safeLink})`, 'g'))
        }
        return part
      })
    },
    [value]
  )

  return parts.map((part, index) =>
    links.includes(part) ? (
      previewLinkCard ? (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <span
              className="underline cursor-pointer text-blue-700 dark:text-blue-400"
              onClick={() => {
                open(ensureUrlPrefix(part))
              }}
            >
              {part}
            </span>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent className="px-0 py-0 duration-300" align="start">
              <PreviewLinkCard
                generateLinkUrl={part}
                itemId={itemId}
                historyId={historyId}
              />
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      ) : (
        <span
          key={index}
          className="underline cursor-pointer text-blue-700 dark:text-blue-400"
          onClick={() => {
            open(ensureUrlPrefix(part))
          }}
        >
          {part}
        </span>
      )
    ) : (
      part
    )
  )
}
