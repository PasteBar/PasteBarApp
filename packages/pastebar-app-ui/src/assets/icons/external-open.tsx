import { SVGProps } from 'react'

export default function ExternalOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? '24px'}
      height={props.height ?? '24px'}
      className={props.className}
      onClick={props.onClick}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.272 8.567v-6m0 0h-6m6 0L10.87 13.308M9.729 5.432h-2.2c-1.68 0-2.52 0-3.162.327-.564.288-1.023.747-1.311 1.311-.327.642-.327 1.482-.327 3.162v6.4c0 1.68 0 2.52.327 3.162.288.565.747 1.023 1.311 1.311.642.327 1.482.327 3.162.327h6.4c1.68 0 2.52 0 3.162-.327a2.9984 2.9984 0 0 0 1.311-1.311c.327-.642.327-1.482.327-3.162v-2.2"
      />
    </svg>
  )
}
