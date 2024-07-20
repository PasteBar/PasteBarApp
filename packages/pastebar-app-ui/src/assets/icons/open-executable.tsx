import { SVGProps } from 'react'

export default function OpenExecutableIcon(props: SVGProps<SVGSVGElement>) {
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
      <rect width="18.953" height="16" x="2.524" y="4" rx="2" />
      <path d="M10.524 4v4m-8 0h18.953M6.524 4v4m1.442 7.043 2-2-2-2m4 6h4" />
    </svg>
  )
}
