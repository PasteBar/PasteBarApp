import { SVGProps } from 'react'

export default function BlankIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? '24px'}
      height={props.height ?? '24px'}
      className={props.className}
      onClick={props.onClick}
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
        x="6.881"
        y="6.83"
        width="10.2"
        height="10.2"
        className="opacity-50"
        stroke="none"
        fill="currentColor"
      />
    </svg>
  )
}
