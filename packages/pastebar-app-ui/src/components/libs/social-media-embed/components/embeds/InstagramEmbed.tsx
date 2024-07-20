import * as React from 'react'
import classNames from 'classnames'
import { DivProps } from 'react-html-props'
import { Subs } from 'react-sub-unsub'

import { Frame, useFrame } from '../hooks/useFrame'
import { PlaceholderEmbed, PlaceholderEmbedProps } from '../placeholder/PlaceholderEmbed'
import { generateUUID } from '../uuid'
import { EmbedStyle } from './EmbedStyle'

const embedJsScriptSrc = 'https://www.instagram.com/embed.js'
const borderRadius = 3

// Embed Stages
const CHECK_SCRIPT_STAGE = 'check-script'
const LOAD_SCRIPT_STAGE = 'load-script'
const CONFIRM_SCRIPT_LOADED_STAGE = 'confirm-script-loaded'
const PROCESS_EMBED_STAGE = 'process-embed'
const CONFIRM_EMBED_SUCCESS_STAGE = 'confirm-embed-success'
const RETRYING_STAGE = 'retrying'
const EMBED_SUCCESS_STAGE = 'embed-success'

export interface InstagramEmbedProps extends DivProps {
  url: string
  width?: string | number
  height?: string | number
  linkText?: string
  theme?: 'light' | 'dark'
  captioned?: boolean
  placeholderImageUrl?: string
  placeholderSpinner?: React.ReactNode
  placeholderSpinnerDisabled?: boolean
  placeholderProps?: PlaceholderEmbedProps
  embedPlaceholder?: React.ReactNode
  placeholderDisabled?: boolean
  scriptLoadDisabled?: boolean
  retryDelay?: number
  retryDisabled?: boolean
  igVersion?: string
  frame?: Frame
  debug?: boolean
}

export const InstagramEmbed = ({
  url,
  width,
  height,
  theme = 'light',
  linkText = '',
  captioned = false,
  placeholderImageUrl,
  placeholderSpinner,
  placeholderSpinnerDisabled = false,
  placeholderProps,
  embedPlaceholder,
  placeholderDisabled = false,
  scriptLoadDisabled = false,
  retryDelay = 5000,
  retryDisabled = false,
  igVersion = '14',
  frame = undefined,
  debug = false,
  ...divProps
}: InstagramEmbedProps): JSX.Element => {
  const [stage, setStage] = React.useState(CHECK_SCRIPT_STAGE)
  const uuidRef = React.useRef(generateUUID())
  const [processTime, setProcessTime] = React.useState(Date.now())
  const embedContainerKey = React.useMemo(
    () => `${uuidRef.current}-${processTime}`,
    [processTime]
  )
  const frm = useFrame(frame)

  // Debug Output
  React.useEffect(() => {
    debug && console.log(`[${new Date().toISOString()}]: ${stage}`)
  }, [debug, stage])

  // === === === === === === === === === === === === === === === === === === ===
  // Embed Stages
  // === === === === === === === === === === === === === === === === === === ===

  // Check Script Stage
  React.useEffect(() => {
    if (stage === CHECK_SCRIPT_STAGE) {
      if ((frm.window as any)?.instgrm?.Embeds?.process) {
        setStage(PROCESS_EMBED_STAGE)
      } else if (!scriptLoadDisabled) {
        setStage(LOAD_SCRIPT_STAGE)
      } else {
        console.error(
          'Instagram embed script not found. Unable to process Instagram embed:',
          url
        )
      }
    }
  }, [scriptLoadDisabled, stage, url, frm.window])

  // Load Script Stage
  React.useEffect(() => {
    if (stage === LOAD_SCRIPT_STAGE) {
      if (frm.document) {
        const scriptElement = frm.document.createElement('script')
        scriptElement.setAttribute('src', embedJsScriptSrc)
        frm.document.head.appendChild(scriptElement)
        setStage(CONFIRM_SCRIPT_LOADED_STAGE)
      }
    }
  }, [stage, frm.document])

  // Confirm Script Loaded Stage
  React.useEffect(() => {
    const subs = new Subs()
    if (stage === CONFIRM_SCRIPT_LOADED_STAGE) {
      subs.setInterval(() => {
        if ((frm.window as any)?.instgrm?.Embeds?.process) {
          setStage(PROCESS_EMBED_STAGE)
        }
      }, 1)
    }
    return subs.createCleanup()
  }, [stage, frm.window])

  // Process Embed Stage
  React.useEffect(() => {
    if (stage === PROCESS_EMBED_STAGE) {
      const process = (frm.window as any)?.instgrm?.Embeds?.process
      if (process) {
        process()
        setStage(CONFIRM_EMBED_SUCCESS_STAGE)
      } else {
        console.error(
          'Instagram embed script not found. Unable to process Instagram embed:',
          url
        )
      }
    }
  }, [stage, frm.window, url])

  // Confirm Embed Success Stage
  React.useEffect(() => {
    const subs = new Subs()
    if (stage === CONFIRM_EMBED_SUCCESS_STAGE) {
      subs.setInterval(() => {
        if (frm.document) {
          const preEmbedElement = frm.document.getElementById(uuidRef.current)
          if (!preEmbedElement) {
            setStage(EMBED_SUCCESS_STAGE)
          }
        }
      }, 1)
      if (!retryDisabled) {
        subs.setTimeout(() => {
          setStage(RETRYING_STAGE)
        }, retryDelay)
      }
    }
    return subs.createCleanup()
  }, [retryDelay, retryDisabled, stage, frm.document])

  // Retrying Stage
  React.useEffect(() => {
    if (stage === RETRYING_STAGE) {
      // This forces the embed container to remount
      setProcessTime(Date.now())
      setStage(PROCESS_EMBED_STAGE)
    }
  }, [stage])

  // END Embed Stages
  // === === === === === === === === === === === === === === === === === === ===

  const urlWithNoQuery = url.replace(/[?].*$/, '')
  const cleanUrlWithEndingSlash = `${urlWithNoQuery}${
    urlWithNoQuery.endsWith('/') ? '' : '/'
  }`

  const placeholder = embedPlaceholder ?? (
    <PlaceholderEmbed
      url={cleanUrlWithEndingSlash}
      imageUrl={placeholderImageUrl}
      linkText={linkText}
      spinner={placeholderSpinner}
      spinnerDisabled={placeholderSpinnerDisabled}
      {...placeholderProps}
    />
  )

  return (
    <div
      {...divProps}
      className={classNames(
        'rsme-embed rsme-instagram-embed overflow-hidden rounded-md w-full',
        uuidRef.current
      )}
    >
      <EmbedStyle />
      <blockquote
        key={embedContainerKey}
        className="instagram-media !border-transparent dark:!border-gray-800 !bg-transparent"
        // https://www.instagram.com/adidasfootball/reel/C8Y7uZrNSkc/
        // https://www.instagram.com/reel/C8XIHc9t37R/
        // https://www.instagram.com/leomessi/p/C8H0etNNFki/
        // https://www.instagram.com/leomessi/p/C8djxnMiM9P

        // working embeds
        // https://www.instagram.com/p/C8nOKy1tFv1/
        // https://www.instagram.com/reel/C8Y7uZrNSkc
        // https://www.instagram.com/reel/C8XIHc9t37R

        data-instgrm-permalink={`${convertToInstagramEmbedUrl(
          cleanUrlWithEndingSlash
        )}?utm_source=ig_embed&utm_campaign=loading`}
        data-instgrm-version={igVersion}
        data-instgrm-captioned={captioned ? captioned : undefined}
        style={{
          width: '100%',
        }}
      >
        {placeholder}
      </blockquote>
    </div>
  )
}

function convertToInstagramEmbedUrl(webUrl: string) {
  const regex =
    /https?:\/\/(?:www\.)?instagram\.com(?:\/[^\/]+)?\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/

  const match = webUrl.match(regex)

  if (match) {
    const contentId = match[1]

    let type = 'p'
    if (webUrl.includes('/reel/')) type = 'reel'
    else if (webUrl.includes('/tv/')) type = 'tv'

    return `https://www.instagram.com/${type}/${contentId}`
  } else if (webUrl.match(/https?:\/\/(?:www\.)?instagram\.com\/([^\/]+)\/?$/)) {
    const username = webUrl.split('/').filter(Boolean).pop()
    return `https://www.instagram.com/${username}`
  } else {
    return null
  }
}
