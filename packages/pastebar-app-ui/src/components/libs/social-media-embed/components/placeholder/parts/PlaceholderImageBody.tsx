import React from 'react'
import classNames from 'classnames'
import { DivProps } from 'react-html-props'

export interface PlaceholderImageBodyProps extends DivProps {
  imageUrl: string
}

export const PlaceholderImageBody = ({
  imageUrl,
  ...divProps
}: PlaceholderImageBodyProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{ ...divProps.style }}
    >
      <img src={imageUrl} style={{ width: '100%' }} />
    </div>
  )
}
