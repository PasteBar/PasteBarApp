import React from 'react'
import classNames from 'classnames'
import { DivProps } from 'react-html-props'

export interface PlaceholderHeaderProps extends DivProps {}

export const PlaceholderHeader = ({ ...divProps }: PlaceholderHeaderProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        paddingLeft: 16,
        paddingRight: 16,
        ...divProps.style,
      }}
    >
      {divProps.children}
    </div>
  )
}
