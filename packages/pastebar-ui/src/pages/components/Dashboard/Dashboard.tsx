import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  CollisionDetection,
  defaultDropAnimation,
  DndContext,
  DragOverlay,
  DropAnimation,
  getFirstCollision,
  MeasuringStrategy,
  pointerWithin,
  rectIntersection,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Portal } from '@radix-ui/react-portal'
import { collectionsStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'

import {
  useGetCollections,
  useGetCollectionWithClips,
} from '~/hooks/queries/use-collections'

export const BOARD = 'board' as const
export const CLIP = 'clip' as const
export const TAB = 'tab' as const

export type UpdatedClip = {
  itemId: string
  name: string
  parentId: string | null
  tabId?: string | null
  collectionId: string | null
  orderNumber: number
}

function DashboardComponent({
  historyDragActive,
}: {
  historyDragActive: boolean
  isDark: boolean
  dragOverBoardId?: UniqueIdentifier | null
}) {
  useGetCollections()

  const [dragOverPinnedId] = useState<UniqueIdentifier | null>(null)

  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const { invalidateCollectionWithClips } = useGetCollectionWithClips()

  const [isDragCancelled, setIsDragCancelled] = useState(false)

  const { clipItems } = useAtomValue(collectionsStoreAtom)

  const [activeDragBoard, setActiveDragBoard] = useState(null)
  const [activeDragClip, setActiveDragClip] = useState(null)

  const DragOverCallback = useCallback(() => {}, [
    activeDragBoard,
    activeDragClip,
    clipItems,
  ])

  const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
      if (isDragCancelled || dragOverPinnedId) {
        return [
          {
            opacity: 0.7,
          },
          {
            opacity: 0,
          },
        ]
      }
      return [
        { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
        {
          opacity: 0,
          transform: CSS.Transform.toString({
            ...transform.final,
          }),
        },
      ]
    },
    easing: 'ease-out',
    duration: isDragCancelled ? 0 : 300,
    sideEffects({ active, dragOverlay }) {
      if (activeDragClip || dragOverPinnedId) {
        dragOverlay.node.animate([{ opacity: 0.7 }, { opacity: 0 }], {
          duration: 300,
          easing: defaultDropAnimation.easing,
        })
      } else {
        active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: defaultDropAnimation.duration,
          easing: defaultDropAnimation.easing,
        })
      }
    },
  }

  const clipsIds = useMemo(
    () => clipItems.filter(({ isClip }) => isClip).map(board => board.itemId),
    [clipItems, activeDragClip]
  )

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    args => {
      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args)
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args)
      let overId = getFirstCollision(intersections, 'id')

      if (overId != null) {
        if (overId in clipsIds) {
          const containerItems = clipItems.map(
            item => item.parentId === overId && item.itemId
          ) as UniqueIdentifier[]

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                container =>
                  container.id !== overId && containerItems.includes(container.id)
              ),
            })[0]?.id
          }
        }

        lastOverId.current = overId

        return [{ id: overId }]
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [activeDragBoard, activeDragClip, clipsIds, clipItems]
  )

  const DndContextWrapper = useMemo(() => DndContext, [historyDragActive])

  return (
    <DndContextWrapper
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      collisionDetection={collisionDetectionStrategy}
      onDragCancel={() => {
        setIsDragCancelled(true)
        setActiveDragBoard(null)
        setActiveDragClip(null)
        invalidateCollectionWithClips()
        setTimeout(() => {
          setIsDragCancelled(false)
        }, 300)
      }}
      onDragOver={DragOverCallback}
    >
      <Portal>
        <DragOverlay dropAnimation={dropAnimationConfig}></DragOverlay>
      </Portal>
    </DndContextWrapper>
  )
}

export const Dashboard = memo(DashboardComponent)
