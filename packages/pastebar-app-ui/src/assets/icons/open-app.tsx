import { SVGProps } from 'react'

export default function OpenAppIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M10.524 4v4m-8 0h18.953M6.524 4v4" />
      {/* <path d="m9.431 17.386 3-3-3-3" /> */}

      {/* <path d="M2.066 17.386v-1c0-1.104.896-2 2-2h6" /> */}
      {/* <path d="M2 11.417V4.894c0-1.105.895-2 2-2h16c1.105 0 2 .895 2 2v14.213c0 1.105-.895 2-2 2H2.654m7.412-18.213V7.13M2 7.13h20M6 2.894V7.13" />
      <path d="m9.431 17.386 3-3-3-3" />
      <path d="M2.066 17.386v-1c0-1.104.896-2 2-2h6" /> */}
    </svg>
  )
}
