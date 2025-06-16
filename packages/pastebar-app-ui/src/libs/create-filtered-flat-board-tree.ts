import { BOARD, CLIP } from '~/pages/components/Dashboard/Dashboard'

import { Item, Tabs } from '~/types/menu'

export default function createFilteredFlatBoardTreeWithClips(
  items: Item[],
  find: string,
  allTabs: Tabs[],
  isSearchNameOrLabelOnly = true,
  boardsOnly = false
) {
  const findTabById = (tabId: string | undefined) =>
    allTabs.filter(tab => tab.tabId === tabId)

  const findChildrenClips = (parentId: string | null) =>
    items
      .filter(item => {
        if (!(item.parentId === parentId && item.isClip)) {
          return false
        }

        const nameMatches = item.name.toLowerCase().includes(find.toLowerCase())

        const valueMatches =
          !isSearchNameOrLabelOnly &&
          item.value?.toLowerCase().includes(find.toLowerCase())

        const descriptionMatches =
          !isSearchNameOrLabelOnly &&
          item.description?.toLowerCase().includes(find.toLowerCase())

        return nameMatches || valueMatches || descriptionMatches
      })
      .map(item => ({ ...item, type: CLIP, id: item.itemId.toString() }))

  const findAllChildrenClips = (parentId: string | null) =>
    items
      .filter(item => item.parentId === parentId && item.isClip)
      .map(item => ({ ...item, type: CLIP, id: item.itemId.toString() }))
      .sort((a, b) => a.orderNumber - b.orderNumber)

  const allBoards = items.filter(item => item.isBoard)

  let count = 0

  const results = !boardsOnly
    ? allBoards
        .map(board => {
          const children = findChildrenClips(board.itemId.toString())

          if (children.length > 0) {
            count = count + children.length
            return {
              ...board,
              type: BOARD,
              showDescription: false,
              tabName: findTabById(board.tabId)[0]?.tabName,
              id: board.itemId.toString(),
              children,
            }
          }

          return null
        })
        .filter(board => board !== null)
    : allBoards
        .filter(board => board.name.toLowerCase().includes(find.toLowerCase()))
        .map(board => {
          const children = findAllChildrenClips(board.itemId.toString())
          return {
            ...board,
            type: BOARD,
            showDescription: false,
            tabName: findTabById(board.tabId)[0]?.tabName,
            id: board.itemId.toString(),
            children,
          }
        })

  return {
    results,
    count: boardsOnly ? results.length : count,
  }
}
