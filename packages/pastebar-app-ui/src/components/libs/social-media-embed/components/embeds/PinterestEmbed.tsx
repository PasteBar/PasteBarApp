import classNames from 'classnames';
import * as React from 'react';
import { DivProps } from 'react-html-props';
import { PlaceholderEmbed, PlaceholderEmbedProps } from '../placeholder/PlaceholderEmbed';
import { EmbedStyle } from './EmbedStyle';

const minPlaceholderWidth = 250;
const maxPlaceholderWidth = 550;
const defaultPlaceholderHeight = 550;
const borderRadius = 8;

export interface PinterestEmbedProps extends DivProps {
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

export const PinterestEmbed = ({
  url,
  postUrl,
  width,
  height = 500,
  linkText = 'View post on Pinterest',
  placeholderImageUrl,
  placeholderSpinner,
  placeholderSpinnerDisabled = false,
  placeholderProps,
  embedPlaceholder,
  placeholderDisabled = false,
  ...divProps
}: PinterestEmbedProps) => {
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

  // Example URL: https://www.pinterest.com/pin/875105771321194304/sent/?invite_code=e86262c989ee4f559a08a4494c300ba3&sfo=1
  const postIdMatch = url.match(/pin\/([\w\d_-]+)/)?.[1];
  const postId = postIdMatch ?? '000000000000000000';

  return (
    <div
      {...divProps}
      className={classNames('rsme-embed rsme-pinterest-embed', divProps.className)}
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
        className={classNames('pinterest-post', !ready && 'rsme-d-none')}
        src={`https://assets.pinterest.com/ext/embed.html?id=${postId}`}
        width="100%"
        height={!ready ? 0 : height}
        frameBorder="0"
        scrolling="no"
        onLoad={() => setReady(true)}
      ></iframe>
      {!ready && !placeholderDisabled && placeholder}
    </div>
  );
};
