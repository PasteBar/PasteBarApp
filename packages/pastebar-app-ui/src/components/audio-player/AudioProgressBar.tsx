interface ProgressCSSProps extends React.CSSProperties {
  '--progress-width': number
  '--buffered-width': number
}

interface AudioProgressBarProps extends React.ComponentPropsWithoutRef<'input'> {
  duration: number
  hasTrack: boolean
  currentProgress: number
  buffered: number
}

export default function AudioProgressBar(props: AudioProgressBarProps) {
  const { duration, currentProgress, buffered, hasTrack, ...rest } = props

  const progressBarWidth = isNaN(currentProgress / duration)
    ? 0
    : currentProgress / duration
  const bufferedWidth = isNaN(buffered / duration) ? 0 : buffered / duration

  const progressStyles: ProgressCSSProps = {
    '--progress-width': progressBarWidth,
    '--buffered-width': bufferedWidth,
  }

  return (
    <div
      className={`absolute h-1 top-0 left-0 right-0 group bg-gray-50 dark:bg-gray-900 ${
        hasTrack ? 'hover:h-2' : ''
      }`}
    >
      <input
        type="range"
        name="progress"
        disabled={!hasTrack}
        className={`player-progress-bar absolute inset-0 w-full m-0 h-full ${
          hasTrack ? 'hover:h-2 cursor-pointer group-hover:h-2' : ''
        } transition-all text-amber-600 hover:accent-amber-600 before:absolute before:inset-0 before:h-full before:w-full before:bg-amber-600 before:origin-left after:absolute after:h-full after:w-full after:bg-amber-500/30 after:dark:bg-amber-950`}
        style={progressStyles}
        min={0}
        step={1}
        max={duration}
        value={currentProgress}
        {...rest}
      />
    </div>
  )
}
