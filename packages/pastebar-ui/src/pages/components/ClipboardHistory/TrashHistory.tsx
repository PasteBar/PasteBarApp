import { UniqueIdentifier, useDroppable } from '@dnd-kit/core'
import { TrashIcon } from 'lucide-react'

import { Text } from '~/components/ui'

export function TrashHistory({ id }: { id: UniqueIdentifier }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-row items-center justify-center py-1.5 px-3 border-2 border-dashed rounded-md w-[260px] ${
        isOver ? 'border-red-600' : 'border-slate-300 dark:border-slate-600'
      }`}
    >
      <Text>&nbsp;</Text>
      <TrashIcon size={15} className="text-red-400 dark:text-red-700" />
      <Text>&nbsp;</Text>
    </div>
  )
}
