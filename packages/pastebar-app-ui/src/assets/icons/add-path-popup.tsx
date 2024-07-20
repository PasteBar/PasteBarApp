import { SVGProps } from 'react'

export default function AddPathPopup(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? '24px'}
      height={props.height ?? '24px'}
      className={props.className}
      onClick={props.onClick}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m6.033 4.294-.007 7.865M21.25 10.12v-3c0-1.16-.84-2-2-2h-7m-9 9v2c0 1.05.95 2 2 2h3" />
      <rect width="10" height="7" x="11.75" y="12.707" ry="2" />
      <path d="m2.25 8.089 7.928.007" />
    </svg>
  )
}
