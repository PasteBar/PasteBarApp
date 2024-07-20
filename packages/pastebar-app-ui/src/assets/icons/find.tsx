import { SVGProps } from 'react'

export default function FindIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={props.width ?? '24px'}
      height={props.height ?? '24px'}
      className={props.className}
      onClick={props.onClick}
      viewBox="0 0 25 27"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.3"
    >
      <path
        fillRule="evenodd"
        d="M12.2852 4.057c-4.5443 0-8.2282 3.684-8.2282 8.2282 0 4.5443 3.684 8.2282 8.2282 8.2282 4.5443 0 8.2282-3.6839 8.2282-8.2282S16.8295 4.057 12.2852 4.057ZM2 12.2852C2 6.6049 6.6048 2 12.2852 2s10.2852 4.6048 10.2852 10.2852-4.6048 10.2852-10.2852 10.2852C6.6049 22.5704 2 17.9656 2 12.2852Z"
        clipRule="evenodd"
      />
      <path d="m19.8786 18.3487 5.8043 5.8043c.4228.4228.4228 1.1083 0 1.5311-.4228.4228-1.1083.4228-1.5311 0l-5.8043-5.8043 1.5311-1.5311Z" />
    </svg>
  )
}
