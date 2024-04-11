import { ImgHTMLAttributes, memo, useState } from 'react'
import BrokenImageIcon from '~/assets/icons/broken-image'

import ToolTip from '~/components/atoms/tooltip'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
  hasError?: boolean
  onErrorCallback?: () => void
}

function ImageWithFallback({
  fallback,
  onErrorCallback = () => {},
  hasError = false,
  src,
  ...props
}: Props) {
  const [imageSuccessfullyLoaded, setImageSuccessfullyLoaded] = useState(!hasError)
  return imageSuccessfullyLoaded && !hasError ? (
    <img
      src={src}
      onError={() => {
        if (imageSuccessfullyLoaded) {
          setImageSuccessfullyLoaded(false)
        }
        onErrorCallback()
      }}
      {...props}
    />
  ) : fallback ? (
    <img src={fallback} {...props} alt="404 Not Found" />
  ) : (
    <ToolTip text="404 / broken image link">
      <BrokenImageIcon className="mb-1 text-gray-400" width="50px" height="36px" />
    </ToolTip>
  )
}

export default memo(ImageWithFallback, (prevProps, nextProps) => {
  return prevProps.src === nextProps.src
})
