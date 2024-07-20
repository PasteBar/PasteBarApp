import { SVGProps } from 'react'

export default function WrapIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M 3 8.992 L 19.686 8.988" />
      <polyline points="16 16.992000579833984" />
      <line x1="3" x2="13.406" y1="14.992" y2="14.992" />
    </svg>
  )
}
