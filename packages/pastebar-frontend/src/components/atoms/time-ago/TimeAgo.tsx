import ReactTimeAgo from 'react-time-ago'

export function TimeAgo({
  date,
  tick = true,
  timeStyle = 'round-minute',
}: {
  date: string | number
  tick?: boolean
  timeStyle?: string
}) {
  return <ReactTimeAgo date={new Date(date)} timeStyle={timeStyle} tick={tick} />
}
