import { UniqueIdentifier } from '@dnd-kit/core'

import Spinner from '../atoms/spinner'
import { InstagramEmbed } from '../libs/social-media-embed/components/embeds/InstagramEmbed'
import { XEmbed } from '../libs/social-media-embed/components/embeds/XEmbed'

export const CardSocialEmbed = ({
  id,
  isTwitter,
  isDark,
  isInstagram,
  url,
}: {
  id: UniqueIdentifier | undefined
  isTwitter?: boolean
  isDark?: boolean
  isInstagram?: boolean
  url: string
}) => {
  if (!url) {
    return null
  }

  if (isTwitter) {
    return (
      <XEmbed
        url={url}
        key={id}
        placeholderSpinner={<Spinner size="small" />}
        theme={isDark ? 'dark' : 'light'}
      />
    )
  }
  if (isInstagram) {
    return (
      <InstagramEmbed
        url={url}
        key={id}
        placeholderSpinner={<Spinner size="small" />}
        theme={isDark ? 'dark' : 'light'}
      />
    )
  }
  return null
}
