import React from 'react'
import { open } from '@tauri-apps/api/shell'
import classNames from 'classnames'
import { DivProps } from 'react-html-props'

import { EmbedStyle } from '../embeds/EmbedStyle'
import { BorderSpinner } from './parts/BorderSpinner'
import { EngagementIconsPlaceholder } from './parts/EngagementIconsPlaceholder'
import { ProfilePlaceholder } from './parts/ProfilePlaceholder'

// See: https://pragmaticwebsecurity.com/articles/spasecurity/react-xss-part1
const isJavaScriptProtocol =
  /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i

export interface PlaceholderEmbedProps extends DivProps {
  url: string
  linkText?: string
  imageUrl?: string
  spinner?: React.ReactNode
  spinnerDisabled?: boolean
  allowJavaScriptUrls?: boolean
}

export const PlaceholderEmbed = ({
  url,
  spinner = <BorderSpinner />,
  allowJavaScriptUrls = true,
}: PlaceholderEmbedProps) => {
  if (isJavaScriptProtocol.test(url) && !allowJavaScriptUrls) {
    console.warn(
      `PlaceholderEmbed has blocked a javascript: URL as a security precaution`
    )
    return null
  }

  return (
    <div className="border border-gray-200 py-4 bg-gray-50 overflow-hidden rounded-md dark:bg-slate-800 dark:border-slate-900 flex justify-center items-center">
      {spinner}
    </div>
  )
}
