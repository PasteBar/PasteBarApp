import classNames from 'classnames';
import React from 'react';
import { DivProps } from 'react-html-props';

export interface FooterLinkTextProps extends DivProps {}

export const FooterLinkText = ({ ...divProps }: FooterLinkTextProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{
        color: '#0095f6',
        fontWeight: 600,
        padding: 16,
        fontFamily: 'Arial,sans-serif',
        fontSize: '14px',
        fontStyle: 'normal',
        ...divProps.style,
      }}
    >
      {divProps.children}
    </div>
  );
};
