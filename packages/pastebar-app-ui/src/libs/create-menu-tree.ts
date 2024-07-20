import { Item, MenuItem } from '~/types/menu'

export default function createMenuTree(
  items: Item[],
  parentId?: string | null,
  showNotActive = false
): MenuItem[] {
  const findChildren = (parentId: string | null): MenuItem[] => {
    return items
      .map(
        ({
          itemId: id,
          name,
          parentId,
          orderNumber,
          isActive,
          isDisabled,
          isDeleted,
          isClip,
          isFolder,
          isSeparator,
        }) => ({
          id,
          name,
          parentId,
          orderNumber,
          isActive,
          isDisabled,
          isDeleted,
          isClip,
          isFolder,
          isSeparator,
          children: [],
        })
      )
      .filter(item => item.parentId === parentId)
      .filter(item => item.isActive || (showNotActive && !item.isActive))
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .map((item: MenuItem) => {
        item.children = findChildren(item.id)
        if (item.children.length === 0 && !item.isFolder) {
          delete item.children
        }
        return item
      })
  }

  return findChildren(parentId || null)
}
