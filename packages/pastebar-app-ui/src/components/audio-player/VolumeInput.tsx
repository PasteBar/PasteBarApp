interface VolumeInputProps {
  volume: number
  onVolumeChange: (volume: number) => void
}

export default function VolumeInput({ volume, onVolumeChange }: VolumeInputProps) {
  return (
    <input
      aria-label="volume"
      name="volume"
      type="range"
      min={0}
      step={0.05}
      max={1}
      value={volume}
      className="player-progress-bar-volume w-[80px] h-1.5 rounded-full bg-gray-700 cursor-pointer"
      onChange={e => {
        onVolumeChange(e.currentTarget.valueAsNumber)
      }}
    />
  )
}
