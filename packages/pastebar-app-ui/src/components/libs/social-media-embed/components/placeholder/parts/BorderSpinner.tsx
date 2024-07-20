import classNames from 'classnames';
import React from 'react';
import { DivProps } from 'react-html-props';

export interface BorderSpinnerProps extends DivProps {}

export const BorderSpinner = ({ ...divProps }: BorderSpinnerProps) => {
  return (
    <>
      <style>
        {`
        .rsme-spinner {
          border: 3px solid rgba(0,0,0,0.75);
          border-right-color: transparent;
          border-radius: 50%;
          animation: rsme-spin 1s linear infinite;
        }
        @keyframes rsme-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }  
      `}
      </style>
      <div
        {...divProps}
        className={classNames('rsme-spinner', divProps.className)}
        style={{ width: 10, height: 10, ...divProps.style }}
      />
    </>
  );
};
