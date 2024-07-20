import { SVGProps } from 'react'

export default function ClipboardRun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? '16'}
      height={props.height ?? '16'}
      className={props.className}
      onClick={props.onClick}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <path d="m9.392 10.005 6.16 3.697-6.16 3.697v-7.394Z" />
    </svg>
  )
}
