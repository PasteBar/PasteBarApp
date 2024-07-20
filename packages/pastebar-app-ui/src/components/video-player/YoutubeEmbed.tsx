import { useState } from 'react'
import { open as openUrl } from '@tauri-apps/api/shell'
import { isKeyAltPressed } from '~/store'

import LiteYouTubeEmbed from './LiteYouTubeEmbed'

const YoutubeEmbed = ({ url, minWidth = 0 }: { url: string; minWidth?: number }) => {
  const embedId = getYouTubeVideoId(url)
  const [videoShown, setVideoShown] = useState(false)

  return (
    embedId && (
      <div className="relative" style={{ minWidth }}>
        <LiteYouTubeEmbed
          id={embedId}
          params="fs=0"
          onIframeAdded={() => {
            setVideoShown(true)
          }}
          title=""
        />
        {videoShown && (
          <button
            className="w-[70px] h-[28px] absolute bottom-1.5 right-1 z-100"
            onClick={() => {
              openUrl(
                isKeyAltPressed.value
                  ? `https://www.youtube-nocookie.com/embed/${embedId}`
                  : url
              )
            }}
          />
        )}
      </div>
    )
  )
}

function getYouTubeVideoId(url: string) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export default YoutubeEmbed
