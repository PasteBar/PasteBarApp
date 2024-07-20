import classNames from 'classnames';
import React from 'react';
import { DivProps } from 'react-html-props';

export interface EngagementIconsPlaceholderProps extends DivProps {}

export const EngagementIconsPlaceholder = ({ ...divProps }: EngagementIconsPlaceholderProps) => {
  return (
    <div
      {...divProps}
      className={classNames(divProps.className)}
      style={{ display: 'flex', alignItems: 'center', columnGap: 14, ...divProps.style }}
    >
      <HeartIcon />
      <ChatBubbleIcon />
      <ShareArrowIcon />
    </div>
  );
};

export const HeartIcon = (props: DivProps) => {
  return (
    <div {...props}>
      <div
        style={{
          backgroundColor: '#F4F4F4',
          borderRadius: '50%',
          height: '12.5px',
          width: '12.5px',
          transform: 'translateX(0px) translateY(7px)',
        }}
      />
      <div
        style={{
          backgroundColor: '#F4F4F4',
          height: '12.5px',
          transform: 'rotate(-45deg) translateX(3px) translateY(1px)',
          width: '12.5px',
          flexGrow: 0,
          marginRight: '6px',
          marginLeft: '2px',
        }}
      />
      <div
        style={{
          backgroundColor: '#F4F4F4',
          borderRadius: '50%',
          height: '12.5px',
          width: '12.5px',
          transform: 'translateX(9px) translateY(-18px)',
        }}
      />
    </div>
  );
};

export const ChatBubbleIcon = (props: DivProps) => {
  return (
    <div {...props}>
      <div
        style={{
          backgroundColor: '#F4F4F4',
          borderRadius: '50%',
          height: '20px',
          width: '20px',
        }}
      />
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: '2px solid transparent',
          borderLeft: '6px solid #f4f4f4',
          borderBottom: '2px solid transparent',
          transform: 'translateX(16px) translateY(-4px) rotate(30deg)',
        }}
      />
    </div>
  );
};

export const ShareArrowIcon = (props: DivProps) => {
  return (
    <div
      {...props}
      style={{
        height: 25,
        width: 25,
        transform: 'translateX(0px) translateY(-2px)',
      }}
    >
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 512 512"
        xmlSpace="preserve"
      >
        <path
          style={{ fill: '#F4F4F4' }}
          d="M295.204,180.593C132.168,180.593,0,312.759,0,475.796
c51.398-130.047,184.869-203.22,317.483-183.603L295.204,180.593z"
        />
        <path
          style={{ fill: '#F4F4F4' }}
          d="M512,253L295.204,36.204v217.818C159.946,249.655,34.992,339.262,0,475.794
c59.905-109.171,178.724-165.463,295.204-151.033v145.035L512,253z"
        />
      </svg>
    </div>
  );
};
