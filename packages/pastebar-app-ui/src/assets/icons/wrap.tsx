import React from 'react'

export default function WrapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.width ?? '14px'}
      height={props.height ?? '14px'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 3 8.992 L 18 8.992 C 20.309 8.992 21.753 11.492 20.598 13.492 C 20.062 14.42 19.072 14.992 18 14.992 L 14 14.992" />
      <polyline points="16 12.992 14 14.992 16 16.992" />
      <line x1="3" x2="10" y1="14.992" y2="14.992" />
    </svg>
  )
}
