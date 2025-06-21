import { createRef, FC, memo, useEffect, useRef, useState } from 'react'
import CodeMirror from 'codemirror'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { escapeRegExp } from '~/lib/utils'

import { useSignal } from '~/hooks/use-signal'

import mergeRefs from '../atoms/merge-refs'
import DOMPurify from '../libs/dompurify'
import { Box, Tabs, TabsList, TabsTrigger } from '../ui'

interface CodeViewerProps {
  className?: string
  theme?: string
  isLargeView?: boolean
  inline?: boolean
  isWrapped?: boolean
  isCommand?: boolean
  webRequestMethod?: string
  autoHideScrollbar?: boolean
  isDark: boolean
  searchTerm?: string
  isShowMore?: boolean
  maxHeight?: number
  language: string
  prefix?: string
  value: string
}

export const CodeViewer: FC<CodeViewerProps> = ({
  prefix = 'cm-',
  isWrapped = false,
  isDark,
  isLargeView,
  isCommand,
  webRequestMethod,
  autoHideScrollbar,
  searchTerm,
  maxHeight,
  isShowMore = false,
  language,
  value,
}) => {
  const [elements, setElements] = useState<JSX.Element[]>([])
  const [isModeLoaded, setModeLoaded] = useState(false)
  const mdShowFormat = useSignal<'html' | 'markdown'>('html')

  const highlightedRefs = useRef<React.RefObject<HTMLElement>[]>([])
  const mdHTML = useSignal('')

  useEffect(() => {
    if (language === 'markdown' && window['markdown']) {
      // @ts-expect-error unknown type markdown
      window['markdown']?.ready.then(markdown => {
        try {
          const html = markdown.parse(value)
          mdHTML.value = DOMPurify.sanitize(html as string, {
            USE_PROFILES: { html: true },
          })
        } catch (e) {
          mdHTML.value = DOMPurify.sanitize(value as string, {
            USE_PROFILES: { html: true },
          })
        }
      })
    }
  }, [value])

  useEffect(() => {
    const loadMode = async () => {
      const mode = CodeMirror.findModeByName(language)
      try {
        if (mode && mode.mode) {
          if (mode.mode === 'dart') {
            // @ts-expect-error
            await import('codemirror/mode/clike/clike')
          }
          await import(`codemirror/mode/${mode.mode}/${mode.mode}`)
        }
        setModeLoaded(true)
      } catch (error) {
        console.error('Error loading CodeMirror mode:', error)
        setModeLoaded(false)
      }
    }

    loadMode()
  }, [language])

  useEffect(() => {
    if (!isModeLoaded) return

    const newElements: JSX.Element[] = []
    let index = 0

    const applySyntaxHighlighting = (val: string) => {
      let tokenBuf = ''
      let lastStyle: string | null = null

      const pushElement = (token: string, style: string | null) => {
        newElements.push(
          <span className={style ? `${prefix}${style}` : ''} key={index++}>
            {token}
          </span>
        )
      }

      const modeLanguage = CodeMirror.findModeByName(language)?.mime || 'text/plain'
      if (language === 'json') {
        try {
          val = JSON.stringify(JSON.parse(val), null, 2)
        } catch (e) {}
      }
      CodeMirror.runMode(
        val,
        modeLanguage,
        (token: string, style: string | null | undefined) => {
          if (lastStyle === style) {
            tokenBuf += token
            lastStyle = style
          } else {
            if (tokenBuf) {
              pushElement(tokenBuf, lastStyle)
            }
            tokenBuf = token
            //@ts-expect-error
            lastStyle = style
          }
        }
      )

      pushElement(tokenBuf, lastStyle)
    }

    if (searchTerm && searchTerm.length > 1) {
      const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
      const parts = value.split(regex)
      highlightedRefs.current = []

      parts.forEach(part => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          const ref = createRef()

          // @ts-expect-error
          highlightedRefs.current.push(ref)

          newElements.push(
            <span
              key={`found-${index++}`}
              className="bg-yellow-300 dark:bg-amber-400 dark:text-black search-pulse-animation"
              ref={mergeRefs(ref)}
            >
              {part}
            </span>
          )
        } else {
          applySyntaxHighlighting(part)
        }
      })
    } else {
      applySyntaxHighlighting(value)
    }

    setElements(newElements)
  }, [isModeLoaded, language, prefix, searchTerm, value])

  useEffect(() => {
    if (highlightedRefs.current.length > 0) {
      highlightedRefs.current[0].current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [elements])

  if (!isModeLoaded) {
    return null
  }

  return (
    <Box className="relative">
      <OverlayScrollbarsComponent
        className={`${isShowMore ? 'code-scroll-x' : ''}`}
        options={{
          overflow: {
            x: !isShowMore ? 'hidden' : 'scroll',
            y: 'scroll',
          },
          scrollbars: {
            theme: isDark ? 'os-theme-light' : 'os-theme-dark',
            autoHide: autoHideScrollbar ? 'move' : 'never',
          },
        }}
        style={{
          maxHeight: maxHeight
            ? maxHeight
            : isLargeView
              ? 'calc(100vh - 250px)'
              : isShowMore
                ? 200
                : 120,
          maxWidth: '100%',
        }}
      >
        {!mdHTML.value || mdShowFormat.value === 'markdown' ? (
          <code
            className={`${
              isWrapped ? 'whitespace-pre-wrap' : 'whitespace-pre'
            } !bg-transparent ${!isDark ? 'code-is-light' : 'code-is-dark'}`}
          >
            {isCommand && (
              <span className="mr-1 px-1 bg-gray-100 dark:bg-gray-800 text-slate-400 dark:text-slate-200">
                {'>_'}
              </span>
            )}
            {webRequestMethod && (
              <span className="mr-1 px-1 bg-gray-100 text-slate-400">
                {webRequestMethod}
              </span>
            )}
            {elements}
            {!isShowMore && <span className="select-none">...</span>}
          </code>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: mdHTML.value }}
            className="note-content"
          />
        )}
      </OverlayScrollbarsComponent>

      {mdHTML.value && (
        <Tabs
          className="flex flex-row absolute top-0 right-0 z-100 select-none"
          value={mdShowFormat.value}
          onValueChange={(val: string) => {
            mdShowFormat.value = val === 'markdown' ? 'markdown' : 'html'
          }}
        >
          <TabsList className="self-center px-1 py-1 bg-slate-200 dark:bg-slate-900 opacity-60 hover:opacity-100 animate-in fade-in">
            <TabsTrigger
              value="html"
              className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
            >
              {'HTML'}
            </TabsTrigger>
            <TabsTrigger
              value="markdown"
              className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
            >
              {'Markdown'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </Box>
  )
}

export const CodeViewerMemo = memo(CodeViewer)
