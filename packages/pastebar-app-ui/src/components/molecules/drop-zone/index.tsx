import { useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'

export function DropZone({
  id,
  children,
  onOver = () => {},
  className = '',
  isActive = true,
}: {
  id: string
  onOver?: (isOver: boolean) => void
  className?: string
  children?: React.ReactNode
  isActive?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  useEffect(() => {
    onOver(isOver)
  }, [isOver])

  return (
    <div ref={isActive ? setNodeRef : null} className={className}>
      {children}
    </div>
  )
}
