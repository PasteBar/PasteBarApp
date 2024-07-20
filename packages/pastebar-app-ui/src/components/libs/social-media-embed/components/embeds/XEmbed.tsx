import * as React from 'react'
import classNames from 'classnames'
import { DivPropsWithoutRef } from 'react-html-props'

import { TwitterTweetEmbed } from '../../../react-twitter-embed'
import { TwitterTweetEmbedProps } from '../../../react-twitter-embed/components/TwitterTweetEmbed'
import { PlaceholderEmbed, PlaceholderEmbedProps } from '../placeholder/PlaceholderEmbed'
import { EmbedStyle } from './EmbedStyle'

const borderRadius = 12

export interface XEmbedProps extends DivPropsWithoutRef {
  url: string
  width?: string | number
  height?: string | number
  theme?: 'light' | 'dark'
  linkText?: string
  placeholderImageUrl?: string
  placeholderSpinner?: React.ReactNode
  placeholderSpinnerDisabled?: boolean
  placeholderProps?: PlaceholderEmbedProps
  embedPlaceholder?: React.ReactNode
  placeholderDisabled?: boolean
  twitterTweetEmbedProps?: TwitterTweetEmbedProps
}

export const XEmbed = ({
  url,
  width,
  theme = 'light',
  height,
  linkText = '',
  placeholderImageUrl,
  placeholderSpinner,
  placeholderSpinnerDisabled = false,
  placeholderProps,
  embedPlaceholder,
  placeholderDisabled,
  twitterTweetEmbedProps,
  ...divProps
}: XEmbedProps) => {
  const postId = url.substring(url.lastIndexOf('/') + 1).replace(/[?].*$/, '')

  const placeholder = embedPlaceholder ?? (
    <PlaceholderEmbed
      url={url}
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
        'rsme-embed rsme-twitter-embed rounded-md',
        divProps.className
      )}
      style={{
        overflow: 'hidden',
        width: width ?? undefined,
        height: height ?? undefined,
        ...divProps.style,
      }}
    >
      <TwitterTweetEmbed
        tweetId={postId}
        options={{ theme }}
        placeholder={placeholderDisabled ? undefined : placeholder}
        {...twitterTweetEmbedProps}
      />
    </div>
  )
}
