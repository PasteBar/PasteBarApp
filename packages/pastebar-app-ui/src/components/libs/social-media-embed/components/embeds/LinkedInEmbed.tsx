import classNames from 'classnames';
import * as React from 'react';
import { DivProps } from 'react-html-props';
import { PlaceholderEmbed, PlaceholderEmbedProps } from '../placeholder/PlaceholderEmbed';
import { EmbedStyle } from './EmbedStyle';

const minPlaceholderWidth = 250;
const maxPlaceholderWidth = 550;
const defaultPlaceholderHeight = 550;
const borderRadius = 8;

export interface LinkedInEmbedProps extends DivProps {
  url: string;
  postUrl?: string;
  width?: string | number;
  height?: string | number;
  linkText?: string;
  placeholderImageUrl?: string;
  placeholderSpinner?: React.ReactNode;
  placeholderSpinnerDisabled?: boolean;
  placeholderProps?: PlaceholderEmbedProps;
  embedPlaceholder?: React.ReactNode;
  placeholderDisabled?: boolean;
}

export const LinkedInEmbed = ({
  url,
  postUrl,
  width,
  height = 500,
  linkText = 'View post on LinkedIn',
  placeholderImageUrl,
  placeholderSpinner,
  placeholderSpinnerDisabled = false,
  placeholderProps,
  embedPlaceholder,
  placeholderDisabled = false,
  ...divProps
}: LinkedInEmbedProps) => {
  const [ready, setReady] = React.useState(false);

  // === Placeholder ===
  const placeholderStyle: React.CSSProperties = {
    minWidth: minPlaceholderWidth,
    maxWidth: maxPlaceholderWidth,
    width: typeof width !== 'undefined' ? width : '100%',
    height:
      typeof height !== 'undefined'
        ? height
        : typeof divProps.style?.height !== 'undefined' || typeof divProps.style?.maxHeight !== 'undefined'
          ? '100%'
          : defaultPlaceholderHeight,
    border: 'solid 1px rgba(0, 0, 0, 0.15)',
    borderRadius,
  };
  const placeholder = embedPlaceholder ?? (
    <PlaceholderEmbed
      url={postUrl ?? url}
      imageUrl={placeholderImageUrl}
      linkText={linkText}
      spinner={placeholderSpinner}
      spinnerDisabled={placeholderSpinnerDisabled}
      {...placeholderProps}
      style={{ ...placeholderStyle, ...placeholderProps?.style }}
    />
  );
  // === END Placeholder ===

  return (
    <div
      {...divProps}
      className={classNames('rsme-embed rsme-linkedin-embed', divProps.className)}
      style={{
        overflow: 'hidden',
        width: width ?? undefined,
        height: height ?? undefined,
        borderRadius,
        ...divProps.style,
      }}
    >
      <EmbedStyle />
      <iframe
        className={classNames('linkedin-post', !ready && 'rsme-d-none')}
        src={url}
        width="100%"
        height={!ready ? 0 : height}
        frameBorder="0"
        onLoad={() => setReady(true)}
      ></iframe>
      {!ready && !placeholderDisabled && placeholder}
    </div>
  );
};
