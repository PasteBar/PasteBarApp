import { SVGProps } from 'react'

export default function OpenFileShellIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M14.5 2.693H6c-1.105 0-2 .833-2 1.861v14.891c0 1.028.895 1.861 2 1.861h12c1.105 0 2-.833 2-1.861V7.812l-5.5-5.119Z" />
      <path d="M14 2.693v6h6M7.998 15.421l2-2-2-2m4 6h4" />
    </svg>
  )
}
