import * as React from 'react'
import { open } from '@tauri-apps/api/shell'
import { isKeyAltPressed } from '~/store'
import linkifyIt from 'linkify-it'
import { Check, Clipboard, ClipboardPaste } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import ToolTip from '~/components/atoms/tooltip'
import { Badge, ButtonGhost } from '~/components/ui'

import { useClipboardPaste, useCopyPaste } from '~/hooks/use-copypaste'

type BBCodeReplacement = ((text: string, id: number) => React.ReactNode) | React.ReactNode

interface BBCodeConfig {
  [regex: string]: BBCodeReplacement
}

export default class BBCodeParser {
  private codes: Array<{ tag: string; regexp: RegExp; replacement: BBCodeReplacement }>

  constructor(codes: BBCodeConfig) {
    this.codes = []
    this.setCodes(codes)
  }

  closeTags(text: string): string {
    let processedText = text

    this.codes.forEach(({ tag }) => {
      const openTag = `[${tag}]`
      const closeTag = `[/${tag}]`
      const openTagsStack = []

      let i = 0
      while (i < processedText.length) {
        if (processedText.substr(i, openTag.length) === openTag) {
          openTagsStack.push(i)
          i += openTag.length
        } else if (processedText.substr(i, closeTag.length) === closeTag) {
          openTagsStack.pop()
          i += closeTag.length
        } else {
          i++
        }
      }

      while (openTagsStack.length > 0) {
        openTagsStack.pop()
        processedText += closeTag
      }
    })

    return processedText
  }

  parse(text: string): React.ReactNode {
    const processedText = text

    let elements: React.ReactNode[] = [processedText]

    for (const { regexp, replacement } of this.codes) {
      elements = elements.flatMap((element, index) => {
        if (typeof element === 'string') {
          return this.replaceText(element, regexp, replacement, index)
        } else {
          return element
        }
      })
    }

    // Linkify the text after BBCode processing
    elements = elements.flatMap(element => {
      if (typeof element === 'string') {
        return this.linkifyText(element)
      } else {
        return element
      }
    })

    return elements.length === 1 ? (
      elements[0]
    ) : (
      <>
        {elements.map((element, index) =>
          React.isValidElement(element)
            ? React.cloneElement(element, { key: `element-${index}` })
            : element
        )}
      </>
    )
  }

  linkifyText(text: string) {
    const linkify = linkifyIt()
    const matches = linkify.match(text)

    if (!matches) {
      return text
    }

    const elements = []
    let lastIndex = 0

    matches.forEach((match, index) => {
      elements.push(text.slice(lastIndex, match.index))
      elements.push(
        <span
          key={`link-${index}`}
          className="underline cursor-pointer text-blue-700 dark:text-blue-400"
          onClick={() => {
            open(ensureUrlPrefix(match.url))
          }}
        >
          {match.raw}
        </span>
      )
      lastIndex = match.lastIndex
    })

    elements.push(text.slice(lastIndex))

    return elements
  }

  private replaceText(
    text: string,
    regexp: RegExp,
    replacement: BBCodeReplacement,
    index: number
  ): React.ReactNode[] {
    let lastIndex = 0
    const elements: React.ReactNode[] = []

    text.replace(regexp, (match, group1, offset) => {
      if (offset > lastIndex) {
        elements.push(text.substring(lastIndex, offset))
      }

      if (typeof replacement === 'function') {
        elements.push(replacement(group1, Date.now() + index))
      } else {
        elements.push(replacement)
      }

      lastIndex = offset + match.length
      return match
    })

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex))
    }

    return elements
  }

  add(regex: string, replacement: BBCodeReplacement, tag: string): BBCodeParser {
    this.codes.push({
      tag: tag,
      regexp: new RegExp(regex, 'igms'),
      replacement,
    })

    return this
  }

  remove(text: string): string {
    let processedText = text

    this.codes.forEach(({ tag }) => {
      const openTagRegex = new RegExp(`\\[${tag}\\]`, 'gi')
      const closeTagRegex = new RegExp(`\\[/${tag}\\]`, 'gi')
      processedText = processedText.replace(openTagRegex, '')
      processedText = processedText.replace(closeTagRegex, '')
    })

    return processedText
  }

  setCodes(codes: BBCodeConfig): BBCodeParser {
    this.codes = Object.keys(codes).map(regex => {
      const replacement = codes[regex]
      const tagNameMatch = regex.match(/\\\[(.+?)\\\]/)
      const tagName = tagNameMatch ? tagNameMatch[1] : null ?? 'unknown'

      return {
        tag: tagName,
        regexp: new RegExp(regex, 'igms'),
        replacement,
      }
    })

    return this
  }
}

export const CopyComponent = ({
  text,
  copyText,
  id,
  parser,
}: {
  text: string
  id: number
  copyText: string
  parser?: BBCodeParser
}) => {
  const content = parser ? parser.parse(text) : text
  const { t } = useTranslation()

  const [isCopied, copyToClipboard] = useCopyPaste({})
  const [pastedText, pastedItemCountDown, pasteToClipboard] = useClipboardPaste({})

  const isCopiedOrPasted = isCopied || pastedText
  return (
    <span
      key={id}
      onDoubleClick={e => {
        e.preventDefault()
        if (!isKeyAltPressed.value) {
          copyToClipboard(parser ? parser.remove(copyText) : copyText)
        } else {
          pasteToClipboard(parser ? parser.remove(copyText) : copyText)
        }
      }}
      className={`${
        isCopiedOrPasted ? 'dark:!border-green-800' : ''
      } inline-flex relative select-none items-center border rounded-md px-1.5 py-[1px] my-[1px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-green-100/80 bg-green-50 dark:bg-green-950 border-slate-300 dark:hover:bg-green-900/80 dark:border-slate-600 cursor-pointer`}
    >
      <span>{content}</span>
      {isCopiedOrPasted && !pastedItemCountDown ? (
        <Badge
          key={`badge-${id}`}
          variant="default"
          className={`bg-green-700 dark:bg-green-800 pointer-events-none px-2 !rounded-md absolute right-0 w-full h-full flex items-center justify-center z-100`}
        >
          <span className="flex items-center justify-center text-[10px] uppercase font-semibold text-white">
            <Check size={14} className="mr-1" />
            {text?.length > 10 && (
              <>
                {isCopied
                  ? t('Copied', { ns: 'common' })
                  : pastedText
                    ? t('Pasted', { ns: 'common' })
                    : ''}
              </>
            )}
          </span>
        </Badge>
      ) : (
        isCopiedOrPasted &&
        pastedItemCountDown &&
        pastedItemCountDown > 0 && (
          <Badge className="ml-1 bg-green-700 dark:bg-green-800 dark:text-white !rounded-md pointer-events-none px-2 text-white absolute right-0 w-full h-full flex items-center justify-center">
            {t('Paste in {{pastingCountDown}}...', {
              ns: 'common',
              pastingCountDown: pastedItemCountDown,
            })}
          </Badge>
        )
      )}

      <ButtonGhost
        className="ml-1 text-slate-500 h-full py-0.5 hover:text-green-700 hover:bg-transparent"
        onClick={(e: Event) => {
          e.preventDefault()
          if (!isKeyAltPressed.value) {
            copyToClipboard(parser ? parser.remove(copyText) : copyText)
          } else {
            pasteToClipboard(parser ? parser.remove(copyText) : copyText)
          }
        }}
      >
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
          {isKeyAltPressed.value ? <ClipboardPaste size={14} /> : <Clipboard size={14} />}
        </ToolTip>
      </ButtonGhost>
    </span>
  )
}

const MaskComponent = ({ txt, id }: { txt: string | React.ReactNode; id: number }) => {
  const maskWord = (word: string) => {
    if (word.length <= 1) {
      return word
    }

    if (word.length === 2) {
      return `${word[0]}•`
    }

    const firstChar = word[0]
    const lastChar = word[word.length - 1]
    const maskedMiddle = word
      .substring(1, word.length - 1)
      .split('')
      .map(() => '•')
      .join('')

    return `${firstChar}${maskedMiddle}${lastChar}`
  }

  const maskedText =
    typeof txt === 'string'
      ? txt
          .split(/(\s+)/) // Split by whitespace but keep the whitespace in the result
          .map(segment => (/\s/.test(segment) ? segment : maskWord(segment)))
          .join('')
      : React.isValidElement(txt)
        ? React.cloneElement(
            txt,
            { ...txt.props, key: 'parent-' + Math.random() * 1000 },
            ...React.Children.toArray(txt.props.children).map((child, index) => {
              return React.cloneElement(
                MaskComponent({ txt: child, id: Math.random() * 1000 }),
                { key: 'child-' + index }
              )
            })
          )
        : '•'

  return (
    <span key={id} className="masked-or-blanked">
      {maskedText}
    </span>
  )
}

const BlankComponent = ({ txt, id }: { txt: string | React.ReactNode; id: number }) => {
  if (typeof txt === 'string' && txt.length <= 2) {
    return <span>{txt}</span>
  }

  const maskedMiddle =
    typeof txt === 'string'
      ? txt
          .split('')
          .map(char => (/\s/.test(char) ? char : '█'))
          .join('')
      : React.isValidElement(txt)
        ? React.cloneElement(
            txt,
            { ...txt.props, key: 'parent-' + Math.random() * 1000 },
            ...React.Children.toArray(txt.props.children).map((child, index) => {
              return React.cloneElement(
                BlankComponent({ txt: child, id: Math.random() * 1000 }),
                { key: 'child-' + index }
              )
            })
          )
        : '█'

  return (
    <span className="text-gray-200 dark:text-gray-600 masked-or-blanked" key={id}>
      {maskedMiddle}
    </span>
  )
}

const HighlightComponent = ({ text, id }: { text: string; id: number }) => {
  return (
    <span key={id} className="bg-yellow-200 dark:bg-yellow-700 dark:text-slate-100">
      {text}
    </span>
  )
}

export const bbCode = new BBCodeParser({
  '\\[copy\\](.+?)\\[/copy\\]': (text: string, id: number) => (
    <CopyComponent text={text} copyText={text.repeat(1)} id={id} parser={bbCode} />
  ),
  '\\[mask\\](.+?)\\[/mask\\]': (text: string, id: number) => (
    <MaskComponent txt={text} id={id} />
  ),
  '\\[blank\\](.+?)\\[/blank\\]': (text: string, id: number) => (
    <BlankComponent txt={text} id={id} />
  ),
  '\\[hl\\](.+?)\\[/hl\\]': (text: string, id: number) => (
    <HighlightComponent text={text} id={id} />
  ),
  '\\[h\\](.+?)\\[/h\\]': (text: string, id: number) => (
    <span className="text-lg font-semibold" key={id}>
      {text}
    </span>
  ),
  '\\[b\\](.+?)\\[/b\\]': (text: string, id: number) => <strong key={id}>{text}</strong>,
  '\\[i\\](.+?)\\[/i\\]': (text: string, id: number) => (
    <span className="italic" key={id}>
      {text}
    </span>
  ),
})
