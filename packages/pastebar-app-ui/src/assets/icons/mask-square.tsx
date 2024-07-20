import { SVGProps } from 'react'

export default function BlankIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? '24px'}
      height={props.height ?? '24px'}
      onClick={props.onClick}
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />

      <rect
        x="7.3"
        y="7.3"
        rx="5"
        ry="5"
        width="9.3"
        height="9.3"
        className="opacity-90"
        stroke="none"
        fill="currentColor"
      />
    </svg>
  )
}
