import React from 'react'
import classNames from 'classnames'
import { DivProps } from 'react-html-props'

export interface ProfilePlaceholderProps extends DivProps {}

export const ProfilePlaceholder = ({ ...divProps }: ProfilePlaceholderProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{ ...divProps.style }}
    >
      <div style={{ display: 'flex', columnGap: 14 }}>
        <div
          style={{
            backgroundColor: '#F4F4F4',
            borderRadius: '50%',
            width: 40,
            height: 40,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            rowGap: 6,
          }}
        >
          <div
            style={{
              backgroundColor: '#F4F4F4',
              borderRadius: 4,
              width: 100,
              height: 14,
            }}
          />
          <div
            style={{
              backgroundColor: '#F4F4F4',
              borderRadius: 4,
              width: 60,
              height: 14,
            }}
          />
        </div>
      </div>
    </div>
  )
}
