import classNames from 'classnames';
import React from 'react';
import { DivProps } from 'react-html-props';

export interface CaptionPlaceholderProps extends DivProps {}

export const CaptionPlaceholder = ({ ...divProps }: CaptionPlaceholderProps) => {
  return (
    <div {...divProps} className={classNames(divProps.className)} style={{ ...divProps.style }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#F4F4F4',
            borderRadius: '4px',
            height: '14px',
            marginBottom: '6px',
            width: '224px',
          }}
        />
        <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', height: '14px', width: '144px' }} />
      </div>
    </div>
  );
};
