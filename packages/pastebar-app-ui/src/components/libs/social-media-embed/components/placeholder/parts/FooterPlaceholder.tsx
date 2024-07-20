import classNames from 'classnames';
import React from 'react';
import { DivProps } from 'react-html-props';

export interface PlaceholderFooterProps extends DivProps {}

export const PlaceholderFooter = ({ ...divProps }: PlaceholderFooterProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{ paddingTop: 5, paddingBottom: 5, ...divProps.style }}
    >
      {divProps.children}
    </div>
  );
};
