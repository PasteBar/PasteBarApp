import { Board } from '~/pages/components/Dashboard/components/Board'
import { Clip } from '~/pages/components/Dashboard/components/ClipCard'
import { BOARD, CLIP } from '~/pages/components/Dashboard/Dashboard'

import { Item } from '~/types/menu'

export default function createBoardTree(
  items: Item[],
  currentTab: string,
  parentId?: string | null
): (Board | Clip)[] {
  const findChildren = (parentId: string | null): (Board | Clip)[] => {
    return items
      .filter(
        item =>
          item.parentId === parentId && (item.isBoard ? item.tabId === currentTab : true)
      )
      .map(item => ({
        ...item,
        id: item.itemId.toString(),
        children: [],
        type: item.isBoard ? BOARD : item.isClip ? CLIP : undefined,
      }))
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .map(item => {
        const boardOrClip = item as Board | Clip

        if (
          'isBoard' in boardOrClip &&
          boardOrClip.isBoard &&
          boardOrClip.type === BOARD
        ) {
          boardOrClip.children = findChildren(boardOrClip.id.toString()) as Board[]
          if (boardOrClip.children.length === 0) {
            delete boardOrClip.children
          }
        }
        return boardOrClip
      })
  }

  return findChildren(parentId || null)
}
