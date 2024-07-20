import React from 'react'
import classNames from 'classnames'
import { DivProps } from 'react-html-props'

export interface PlaceholderTextBodyProps extends DivProps {}

export const PlaceholderTextBody = ({ ...divProps }: PlaceholderTextBodyProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: 16,
        ...divProps.style,
      }}
    >
      {divProps.children}
    </div>
  )
}
