import * as React from 'react'

export type imgResolution =
  | 'default'
  | 'mqdefault'
  | 'hqdefault'
  | 'sddefault'
  | 'maxresdefault'

export interface LiteYouTubeProps {
  announce?: string
  id: string
  title: string
  activatedClass?: string
  adNetwork?: boolean
  aspectHeight?: number
  aspectWidth?: number
  iframeClass?: string
  noCookie?: boolean
  cookie?: boolean
  params?: string
  playerClass?: string
  playlist?: boolean
  playlistCoverId?: string
  poster?: imgResolution
  webp?: boolean
  wrapperClass?: string
  onIframeAdded?: () => void
  muted?: boolean
  thumbnail?: string
  rel?: string
  containerElement?: keyof JSX.IntrinsicElements
  style?: React.CSSProperties
}

function LiteYouTubeEmbedComponent(
  props: LiteYouTubeProps,
  ref: React.Ref<HTMLIFrameElement>
) {
  const [preconnected, setPreconnected] = React.useState(false)
  const [iframe, setIframe] = React.useState(false)
  const videoId = encodeURIComponent(props.id)
  const videoPlaylisCovertId =
    typeof props.playlistCoverId === 'string'
      ? encodeURIComponent(props.playlistCoverId)
      : null
  const videoTitle = props.title
  const posterImp = props.poster || 'hqdefault'
  const paramsImp = `&${props.params}` || ''
  const mutedImp = props.muted ? '&mute=1' : ''
  const announceWatch = props.announce || ''
  const format = props.webp ? 'webp' : 'jpg'
  const vi = props.webp ? 'vi_webp' : 'vi'
  const posterUrl =
    props.thumbnail ||
    (!props.playlist
      ? `https://i.ytimg.com/${vi}/${videoId}/${posterImp}.${format}`
      : `https://i.ytimg.com/${vi}/${videoPlaylisCovertId}/${posterImp}.${format}`)

  let ytUrl = props.noCookie
    ? 'https://www.youtube-nocookie.com'
    : 'https://www.youtube.com'
  ytUrl = props.cookie ? 'https://www.youtube.com' : 'https://www.youtube-nocookie.com'

  const iframeSrc = !props.playlist
    ? `${ytUrl}/embed/${videoId}?autoplay=1&state=1${mutedImp}${paramsImp}`
    : `${ytUrl}/embed/videoseries?autoplay=1${mutedImp}&list=${videoId}${paramsImp}`

  const activatedClassImp = props.activatedClass || 'lyt-activated'
  const aspectHeight = props.aspectHeight || 9
  const aspectWidth = props.aspectWidth || 16
  const iframeClassImp = props.iframeClass || ''
  const playerClassImp = props.playerClass || 'lty-playbtn'
  const wrapperClassImp = props.wrapperClass || 'yt-lite'
  const onIframeAdded = props.onIframeAdded || function () {}
  const ContainerElement = props.containerElement || 'article'
  const style = props.style || {}

  const warmConnections = () => {
    if (preconnected) return
    setPreconnected(true)
  }

  const addIframe = () => {
    if (iframe) return
    setIframe(true)
  }

  React.useEffect(() => {
    if (iframe) {
      onIframeAdded()
    }
  }, [iframe])

  return (
    <>
      <ContainerElement
        onPointerOver={warmConnections}
        onClick={addIframe}
        className={`${wrapperClassImp} ${iframe ? activatedClassImp : ''}`}
        data-title={videoTitle}
        style={{
          backgroundImage: `url(${posterUrl})`,
          ...({
            '--aspect-ratio': `${(aspectHeight / aspectWidth) * 100}%`,
          } as React.CSSProperties),
          ...style,
        }}
      >
        <button
          type="button"
          className={playerClassImp}
          aria-label={`${announceWatch} ${videoTitle}`}
        />
        {iframe && (
          <iframe
            ref={ref}
            className={iframeClassImp}
            title={videoTitle}
            width="560"
            height="315"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            src={iframeSrc}
          ></iframe>
        )}
      </ContainerElement>
    </>
  )
}

export default React.forwardRef<HTMLIFrameElement, LiteYouTubeProps>(
  LiteYouTubeEmbedComponent
)
