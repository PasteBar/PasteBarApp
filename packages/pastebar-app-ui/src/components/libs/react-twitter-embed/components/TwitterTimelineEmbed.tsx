import React from 'react'
// @ts-expect-error
import loadScript from 'scriptjs'

import twitterWidgetJs from './twiter-widget-url'

declare global {
  interface Window {
    twttr: any
  }
}

interface JSONObject {
  [k: string]: any
}

export interface TwitterTimelineEmbedBase {
  /**
   * Additional options to pass to twitter widget plugin
   */
  options?: JSONObject
  /**
   * Automatically fit into parent container height
   */
  autoHeight?: boolean
  /**
   * With dark or light theme
   */
  theme?: 'dark' | 'light'
  /**
   * With custom link colors. Note: Only Hex colors are supported.
   */
  linkColor?: string
  /**
   * With custom border colors. Note: Only Hex colors are supported.
   */
  borderColor?: string
  /**
   * Hide the header from timeline
   */
  noHeader?: boolean
  /**
   * Hide the footer from timeline
   */
  noFooter?: boolean
  /**
   * Hide the border from timeline
   */
  noBorders?: boolean
  /**
   * Hide the scrollbars
   */
  noScrollbar?: boolean
  /**
   * Enable Transparancy
   */
  transparent?: boolean
  /**
   * Custom language code. Supported codes here: https://developer.twitter.com/en/docs/twitter-for-websites/twitter-for-websites-supported-languages/overview.html
   */
  lang?: string
  /**
   * ariaPolite
   */
  ariaPolite?: 'polite' | 'assertive' | 'rude'
  /**
   * Limit of tweets to be shown
   */
  tweetLimit?: number
  /**
   * Placeholder while tweet is loading
   */
  placeholder?: string | React.ReactNode
  /**
   * Function to execute after load, return html element
   */
  onLoad?: (element: any) => void
}

export interface TwitterTimelineEmbedSourceScreenName extends TwitterTimelineEmbedBase {
  /**
   * This can be either of profile, likes
   */
  sourceType: 'profile' | 'likes'
  /**
   * username of twitter handle as String
   */
  screenName: string
}

export interface TwitterTimelineEmbedSourceUserId extends TwitterTimelineEmbedBase {
  /**
   * This can be either of profile, likes
   */
  sourceType: 'profile' | 'likes'
  /**
   * UserId of twitter handle as number
   */
  userId: string
}

export interface TwitterTimelineEmbedSourceTimeline extends TwitterTimelineEmbedBase {
  /**
   * This can be either of timeline
   */
  sourceType: 'timeline'
  /**
   * To show list, unique list id
   * Also used with collections, in that case its valid collection id
   */
  id: string
}

export interface TwitterTimelineEmbedSourceTimelineWidget
  extends TwitterTimelineEmbedBase {
  /**
   * This can be either of timeline
   */
  sourceType: 'timeline'
  /**
   * To show list, unique list id
   * Also used with collections, in that case its valid collection id
   */
  widgetId: string
}

export interface TwitterTimelineEmbedSourceList extends TwitterTimelineEmbedBase {
  /**
   * This can be either of list
   */
  sourceType: 'list'
  /**
   * To show list, used along with slug
   */
  ownerScreenName: string
  /**
   * To show list, used along with ownerScreenName
   */
  slug: string
}

export interface TwitterTimelineEmbedSourceListId extends TwitterTimelineEmbedBase {
  /**
   * This can be either of list
   */
  sourceType: 'list'
  /**
   * To show list, unique list id
   * Also used with collections, in that case its valid collection id
   */
  id: string | number
}

export interface TwitterTimelineEmbedSourceCollectionId extends TwitterTimelineEmbedBase {
  /**
   * This can be collection
   */
  sourceType: 'collection'
  /**
   * To show list, unique list id
   * Also used with collections, in that case its valid collection id
   */
  id: string | number
}

export interface TwitterTimelineEmbedSourceCollectionUrl
  extends TwitterTimelineEmbedBase {
  /**
   * This can be collection
   */
  sourceType: 'collection'
  /**
   * To show list, unique list url
   * Also used with collections, in that case its valid collection id
   */
  url: string
}

export interface TwitterTimelineEmbedSourceUrl extends TwitterTimelineEmbedBase {
  /**
   * This can be url
   */
  sourceType: 'url'
  /**
   * To show twitter content with url.
   * Supported content includes profiles, likes, lists, and collections.
   */
  url: string
}

export interface TwitterTimelineEmbedSourceWidget extends TwitterTimelineEmbedBase {
  /**
   * This can be widget
   */
  sourceType: 'widget'
  /**
   * To show custom widget
   */
  widgetId: string
}

export type TwitterTimelineEmbedPropsType =
  | TwitterTimelineEmbedSourceScreenName
  | TwitterTimelineEmbedSourceUserId
  | TwitterTimelineEmbedSourceTimeline
  | TwitterTimelineEmbedSourceTimelineWidget
  | TwitterTimelineEmbedSourceList
  | TwitterTimelineEmbedSourceListId
  | TwitterTimelineEmbedSourceCollectionId
  | TwitterTimelineEmbedSourceCollectionUrl
  | TwitterTimelineEmbedSourceUrl
  | TwitterTimelineEmbedSourceWidget

// export interface TwitterTimelineEmbedProps {
//   sourceType: 'profile' | 'likes' | 'list' | 'collection' | 'URL' | 'widget'
//   url: string;
//   options?: JSONObject,
//   placeholder?: string | React.ReactNode;
//   onLoad?: (element: any) => void;
// };

const methodName = 'createTimeline'

const TwitterTimelineEmbed = (props: TwitterTimelineEmbedPropsType): any => {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = React.useState(true)

  const buildOptions = () => {
    let options = Object.assign({}, props.options)
    if (props?.autoHeight) {
      options.height = (ref.current?.parentNode as HTMLElement)?.offsetHeight
    }

    options = Object.assign({}, options, {
      theme: props?.theme,
      linkColor: props?.linkColor,
      borderColor: props?.borderColor,
      lang: props?.lang,
      tweetLimit: props?.tweetLimit,
      ariaPolite: props?.ariaPolite,
    })

    return options
  }

  const buildChromeOptions = (options: JSONObject) => {
    options.chrome = ''
    if (props.noHeader) {
      options.chrome = options.chrome + ' noheader'
    }
    if (props.noFooter) {
      options.chrome = options.chrome + ' nofooter'
    }
    if (props.noBorders) {
      options.chrome = options.chrome + ' noborders'
    }
    if (props.noScrollbar) {
      options.chrome = options.chrome + ' noscrollbar'
    }
    if (props.transparent) {
      options.chrome = options.chrome + ' transparent'
    }

    return options
  }

  React.useEffect(() => {
    let isComponentMounted = true

    loadScript(twitterWidgetJs, 'twitter-embed', () => {
      if (!window.twttr) {
        console.error('Failure to load window.twttr, aborting load')
        return
      }
      if (isComponentMounted) {
        if (!window.twttr.widgets[methodName]) {
          console.error(`Method ${methodName} is not present anymore in twttr.widget api`)
          return
        }

        let options = buildOptions()
        /** Append chrome options */
        options = buildChromeOptions(options)

        window.twttr.widgets[methodName](
          {
            // @ts-ignore
            sourceType: props.sourceType,
            // @ts-ignore
            screenName: props.screenName,
            // @ts-ignore
            userId: props.userId,
            // @ts-ignore
            ownerScreenName: props.ownerScreenName,
            // @ts-ignore
            slug: props.slug,
            // @ts-ignore
            id: props.id || props.widgetId,
            // @ts-ignore
            url: props.url,
          },
          ref?.current,
          options
        ).then((element: any) => {
          setLoading(false)
          if (props.onLoad) {
            props.onLoad(element)
          }
        })
      }
    })

    // cleaning up
    return () => {
      isComponentMounted = false
    }
  }, [])

  return (
    <React.Fragment>
      {loading && <React.Fragment>{props.placeholder}</React.Fragment>}
      <div ref={ref} />
    </React.Fragment>
  )
}

export default TwitterTimelineEmbed
