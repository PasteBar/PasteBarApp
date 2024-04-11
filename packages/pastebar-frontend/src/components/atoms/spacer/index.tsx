type SpacerProps = {
  h?: number
  w?: number
  className?: string
}

type HeightWidthClasses = {
  [key: number]: string
  full?: string
}

const Spacer: React.FC<SpacerProps> = ({ h = 3, w = 'full', className = '' }) => {
  const heightClasses = {
    1: 'h-1',
    2: 'h-2',
    3: 'h-3',
    4: 'h-4',
    5: 'h-5',
    6: 'h-6',
    7: 'h-7',
    8: 'h-8',
    9: 'h-9',
    10: 'h-10',
    11: 'h-11',
    12: 'h-12',
  } as HeightWidthClasses

  const widthClasses = {
    full: 'w-full',
    1: 'w-1',
    2: 'w-2',
    3: 'w-3',
    4: 'w-4',
    5: 'w-5',
    7: 'w-7',
    8: 'w-8',
    9: 'w-9',
    10: 'w-10',
    11: 'w-11',
    12: 'w-12',
  } as HeightWidthClasses

  const height = typeof h === 'number' ? heightClasses[h] : ''
  const width = typeof w === 'number' || w === 'full' ? widthClasses[w] : ''

  return <div className={`${height} ${width} ${className}`} />
}

export default Spacer
