import { UniqueIdentifier } from '@dnd-kit/core'
import createBoardTree from '~/libs/create-board-tree'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import {
  currentBoardIndex,
  currentNavigationContext,
  keyboardSelectedBoardId,
  keyboardSelectedClipId,
} from '~/store/signalStore'

import { MenuItem } from '~/types/menu'

// Navigation types and helper functions
interface NavigationItem {
  id: UniqueIdentifier
  type: 'history' | 'board'
  parentId?: UniqueIdentifier | null
  depth: number
}

const EMOJIREGEX =
  /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gm

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MASKCHAR = '•'

const extractFromTreeById = (items: MenuItem[], targetId: string): MenuItem | null => {
  for (const item of items) {
    if (item.id === targetId) {
      return item
    }
    if (item.children) {
      const result = extractFromTreeById(item.children, targetId)
      if (result) {
        return result
      }
    }
  }
  return null
}

const extractDraggedItems = (items: MenuItem[], dragIds: string[]): MenuItem[] => {
  let extracted: MenuItem[] = []
  for (const item of items) {
    if (dragIds.includes(item.id)) {
      extracted.push(item)
    }
    if (item.children) {
      extracted = [...extracted, ...extractDraggedItems(item.children, dragIds)]
    }
  }
  return extracted
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

// Build a flattened navigation order that includes boards and sub-boards
// Only boards are included in Left/Right navigation - clips are navigated with Up/Down within boards
export function buildNavigationOrder(
  clipItems: any[],
  currentTab: string
): NavigationItem[] {
  const navigationOrder: NavigationItem[] = []

  // Add history placeholder - actual history navigation is handled by ClipboardHistoryPage
  navigationOrder.push({ id: 'history', type: 'history', depth: 0 })

  // Get all boards and clips in the current tab
  const allItems = clipItems.filter(item => item.tabId === currentTab)

  // Build board tree for proper nesting
  const boardTree = createBoardTree(clipItems, currentTab, null)

  // Recursively add boards (but not clips - clips are navigated with Up/Down within boards)
  function addBoardAndContents(boardId: UniqueIdentifier, depth: number) {
    const board = allItems.find(item => item.itemId === boardId && item.isBoard)
    if (!board) return

    // Add the board itself to navigation order
    navigationOrder.push({
      id: boardId,
      type: 'board',
      parentId: board.parentId,
      depth,
    })

    // Get direct child boards (not clips) sorted by order
    const childBoards = allItems
      .filter(item => item.parentId === boardId && item.isBoard)
      .sort((a, b) => a.orderNumber - b.orderNumber)

    // Add child boards recursively
    childBoards.forEach(child => {
      addBoardAndContents(child.itemId, depth + 1)
    })
  }

  // Start with top-level boards
  const topLevelBoards = allItems
    .filter(item => item.isBoard && item.parentId === null)
    .sort((a, b) => a.orderNumber - b.orderNumber)

  topLevelBoards.forEach(board => {
    addBoardAndContents(board.itemId, 1)
  })

  return navigationOrder
}

// Find current position in navigation order
export function findCurrentNavigationIndex(navigationOrder: NavigationItem[]): number {
  if (currentNavigationContext.value === 'history') {
    return 0 // History is always at index 0
  } else if (currentNavigationContext.value === 'board') {
    if (keyboardSelectedBoardId.value) {
      // Find board position - since clips are not in navigation order,
      // we find the board that contains the selected clip
      return navigationOrder.findIndex(
        item => item.type === 'board' && item.id === keyboardSelectedBoardId.value
      )
    }
  }
  return 0
}

// Find the next non-empty board in the navigation order (skipping empty boards)
export function findNextNonEmptyBoard(
  navigationOrder: NavigationItem[],
  startIndex: number,
  direction: 'forward' | 'backward',
  clipItems: any[],
  currentTab: string
): NavigationItem | null {
  const maxAttempts = navigationOrder.length // Prevent infinite loops
  let currentIndex = startIndex

  for (let i = 0; i < maxAttempts; i++) {
    // Move in the specified direction
    if (direction === 'forward') {
      currentIndex = currentIndex + 1
      // If we've gone past the end, wrap to history (index 0) or return null for no more boards
      if (currentIndex >= navigationOrder.length) {
        return null // Let caller handle going back to history
      }
    } else {
      currentIndex = currentIndex - 1
      // If we've gone before the beginning, return null for going to history
      if (currentIndex < 1) {
        // Index 0 is history, so < 1 means we should go to history
        return null
      }
    }

    const candidateItem = navigationOrder[currentIndex]

    // Skip history item (only boards should be checked)
    if (candidateItem.type === 'history') {
      continue
    }

    // Check if this board has actual navigable clips (with non-null itemIds)
    const hasNavigableClips = clipItems.some(
      clipItem =>
        clipItem.isClip &&
        clipItem.parentId === candidateItem.id &&
        clipItem.tabId === currentTab &&
        clipItem.itemId != null // Crucial check: ensure the clip itself is navigable
    )

    // If board has navigable clips, return it
    if (hasNavigableClips) {
      return candidateItem
    }
  }

  // If no non-empty board found, return null
  return null
}

// Navigate to specific item in the navigation order
export function navigateToItem(
  item: NavigationItem,
  clipItems: any[],
  currentTab: string
) {
  if (item.type === 'history') {
    currentNavigationContext.value = 'history'
    keyboardSelectedBoardId.value = null
    keyboardSelectedClipId.value = null
    currentBoardIndex.value = 0
    // History item selection (e.g., selecting the first history item)
    // is typically handled by the calling component (ClipboardHistoryPage)
    // when currentNavigationContext.value changes to 'history'.
  } else if (item.type === 'board') {
    const clipsInBoard = clipItems
      .filter(
        clipItem =>
          clipItem.isClip &&
          clipItem.parentId === item.id &&
          clipItem.tabId === currentTab
      )
      .sort((a, b) => a.orderNumber - b.orderNumber)

    currentNavigationContext.value = 'board' // We are attempting to navigate to a board context
    keyboardSelectedBoardId.value = item.id // Select the target board ID

    // Find the first clip in the sorted list that has a valid itemId.
    // The 'item' (board) passed to this function should be guaranteed by
    // findNextNonEmptyBoard to have at least one such clip.
    const firstValidClip = clipsInBoard.find(clip => clip.itemId != null)

    if (firstValidClip) {
      // Board has at least one navigable clip, select it.
      keyboardSelectedClipId.value = firstValidClip.itemId
    } else {
      // This case should ideally not be reached if findNextNonEmptyBoard works correctly,
      // as it implies the board was deemed "non-empty" but no valid clips were found here.
      // For safety, ensure no clip is selected. The calling hotkey logic in
      // ClipboardHistoryPage (the while loops) will then continue to the next board.
      keyboardSelectedClipId.value = null
    }

    // Update board index (for UI, e.g., highlighting the top-level board tab)
    // This logic finds the root parent of the selected board.
    const topLevelBoards = clipItems
      .filter(
        boardItem =>
          boardItem.isBoard &&
          boardItem.parentId === null &&
          boardItem.tabId === currentTab
      )
      .sort((a, b) => a.orderNumber - b.orderNumber)

    const currentBoardData = clipItems.find(boardItem => boardItem.itemId === item.id)
    if (currentBoardData) {
      let rootParent = currentBoardData
      // Traverse up to find the root parent board
      while (rootParent.parentId !== null) {
        const parentBoard = clipItems.find(
          boardItem =>
            boardItem.itemId === rootParent.parentId &&
            boardItem.isBoard &&
            boardItem.tabId === currentTab
        )
        if (!parentBoard) {
          // Parent not found, treat current as root (should ideally not happen with consistent data)
          break
        }
        rootParent = parentBoard
      }
      currentBoardIndex.value = topLevelBoards.findIndex(
        board => board.itemId === rootParent.itemId
      )
    } else {
      // Fallback if currentBoardData is not found (e.g., item.id is invalid)
      // This might reset or clear the board index, or default to the first top-level board.
      // For now, if the board itself isn't found, the index might become -1 or an existing value.
      // Consider if a default (e.g., 0 or -1) is more appropriate if item.id is not a valid board.
      const directMatchIndex = topLevelBoards.findIndex(board => board.itemId === item.id)
      if (directMatchIndex !== -1) {
        currentBoardIndex.value = directMatchIndex
      }
      // If not a top-level board and data is missing, currentBoardIndex might remain unchanged or be -1.
    }
  }
}

export const findNewChildrenOrderByParentIdAndDragId = (
  items: MenuItem[],
  dragId: string,
  overId: string,
  parentId: string | null,
  originalItemIndex: number,
  overItem: number
): MenuItem[] | null => {
  const _allItems = JSON.parse(JSON.stringify(items)) as MenuItem[] // clone the items

  const draggedItemOriginal = extractFromTreeById(_allItems, dragId)
  if (!draggedItemOriginal) return null

  const isSameParent = draggedItemOriginal.parentId === parentId

  let parentItems = parentId
    ? extractFromTreeById(_allItems, parentId)?.children
    : _allItems
  if (!parentItems) return null

  const draggedItemIndex = parentItems.findIndex(item => item.id === dragId)
  const newDragIndex = parentItems.findIndex(item => item.id === overId)
  if (newDragIndex === -1) {
    return null
  }

  let adjustedNewDragIndex = newDragIndex

  if (!isSameParent && originalItemIndex < overItem && parentId !== null) {
    adjustedNewDragIndex += 1
  }

  if (!isSameParent && draggedItemIndex > newDragIndex && parentId !== null) {
    adjustedNewDragIndex -= 1
  }

  const draggedItem = { ...draggedItemOriginal }
  draggedItem.parentId = parentId

  if (isSameParent) {
    parentItems = parentItems.filter(item => item.id !== dragId)
  }

  const newChildren = [...parentItems]
  newChildren.splice(adjustedNewDragIndex, 0, draggedItem)

  newChildren.forEach((child, index) => {
    child.orderNumber = index
    child.parentId = child.id !== parentId ? parentId : null
  })

  return newChildren
}

export const findNewChildrenOrderByParentIdAndDragIds = (
  items: MenuItem[],
  parentId: string | null,
  dragIds: string[] = [],
  newDragIndex: number
): MenuItem[] | null => {
  let allItems = JSON.parse(JSON.stringify(items)) as MenuItem[] // lets clone the items

  if (parentId !== null) {
    allItems = extractFromTreeById(items, parentId)?.children || []
  }

  const firstDraggedItemIndex = allItems.findIndex(item => dragIds.includes(item.id))

  const draggedItems = extractDraggedItems(items, dragIds)

  draggedItems.forEach(item => {
    item.parentId = parentId
  })

  const newChildren = allItems.filter(child => !dragIds.includes(child.id))

  let adjustedNewDragIndex = newDragIndex
  if (firstDraggedItemIndex !== -1 && newDragIndex > firstDraggedItemIndex) {
    adjustedNewDragIndex -= 1
  }

  newChildren.splice(adjustedNewDragIndex, 0, ...draggedItems)

  newChildren.forEach((child, index) => {
    child.orderNumber = index
  })
  return newChildren
}

export interface SelectionProps {
  selection: Selection | null
  selectedElement: HTMLElement | null
  text: string
}

export const getSelectedText = function (): SelectionProps {
  let text = ''
  let selection: Selection | null = null
  let selectedElement: HTMLElement | null = null

  if (window.getSelection) {
    selection = window.getSelection()
    text = selection ? selection.toString() : ''
    selectedElement = selection
      ? selection.anchorNode && selection.anchorNode.parentElement
      : null
  } else if (
    // @ts-ignore
    (document as unknown).selection &&
    // @ts-ignore
    (document as unknown).selection.type !== 'Control'
  ) {
    // @ts-ignore
    const range = (document as unknown).selection.createRange()
    text = range.text
    selectedElement = range.parentElement ? range.parentElement() : null
  }

  return {
    selection,
    text,
    selectedElement,
  }
}

export function hasEmoji(text: string) {
  EMOJIREGEX.lastIndex = 0
  return EMOJIREGEX.test(text)
}

export function ensureUrlPrefix(url: string | null | undefined) {
  if (!url) return ''

  const emailRegex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
  if (emailRegex.test(url)) {
    return url.startsWith('mailto:') ? url : `mailto:${url}`
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }

  return url
}

export function isEmailValid(input: string) {
  if (!input && typeof input !== 'string') {
    return false
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(input)
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function maskEmailValue(email: string | undefined) {
  if (!email) return ''

  const emailParts = email.split('@')
  const maskedEmail = maskValue(emailParts[0])
  const domain = emailParts[1]

  return `${maskedEmail}@${domain}`
}

export function maskValueFirstLast(
  value: string | undefined | null,
  showFirst = 1,
  showLast = 1,
  skipShow = 0
) {
  if (!value) return ''
  const maskChar = '•'

  return value
    .split('\n')
    .map(line =>
      line
        .split(/\s+/)
        .map(word => {
          const firstChars = word.slice(0, showFirst)
          const lastChars = word.slice(-showLast)

          if (word.length > showFirst + showLast + skipShow) {
            const middleLen = word.length - showFirst - showLast
            const maskedMiddle = maskChar.repeat(middleLen)

            if (skipShow > 0 && middleLen > skipShow) {
              const ellipsis = '...'
              const remainingMaskedChars = maskChar.repeat(middleLen - skipShow)
              return `${firstChars}${remainingMaskedChars}${ellipsis}${lastChars}`
            } else {
              return `${firstChars}${maskedMiddle}${lastChars}`
            }
          } else {
            return word
          }
        })
        .join(' ')
    )
    .join('\n')
}

export function maskValue(value: string | undefined | null) {
  if (!value) return ''

  return value
    .split('\n')
    .map(line =>
      line
        .split(/\s+/)
        .map(word => {
          const firstChar = word.charAt(0)

          if (word.length > 2) {
            const middleLen = word.length - 2
            const lastChar = word.charAt(word.length - 1)
            const maskedMiddle = MASKCHAR.repeat(middleLen)

            return `${firstChar}${maskedMiddle}${lastChar}`
          } else {
            const maskedMiddle = MASKCHAR.repeat(1)

            return `${firstChar}${maskedMiddle}`
          }
        })
        .join(' ')
    )
    .join('\n')
}

export function trimAndRemoveExtraNewlines(str: string | undefined | null) {
  if (!str) return ''
  str = str.trim().replace(/\n+/g, '\n')
  if (str.endsWith('\n')) {
    str = str.slice(0, -1)
  }
  return str
}

export function bgColor(
  colorName: string | null | undefined,
  colorCode = '200',
  darkCode?: string,
  isBorder = false
) {
  const colorNameToUse = colorName || 'slate'

  let darkColorCode: string
  if (darkCode) {
    darkColorCode = darkCode
  } else if (colorCode === '200' && colorNameToUse === 'slate') {
    darkColorCode = '700'
  } else if (colorNameToUse !== 'slate') {
    darkColorCode = '900'
  } else {
    darkColorCode = '300'
  }

  const type = isBorder ? 'border' : 'bg'

  return `${type}-${colorNameToUse}-${colorCode} dark:${type}-${colorNameToUse}-${darkColorCode}`
}

export function borderColor(
  colorName: string | null | undefined,
  colorCode = '200',
  darkCode?: string
) {
  return bgColor(
    colorName,
    colorCode,
    colorName === 'slate' && darkCode === '700' ? '600' : darkCode,
    true
  )
}

export const checkParentsClass = (
  element: EventTarget | null,
  className: string
): boolean => {
  let currentElement = element as HTMLElement | null

  while (currentElement) {
    if (currentElement.classList && currentElement.classList.contains(className)) {
      return true
    }
    currentElement = currentElement.parentNode as HTMLElement | null
  }

  return false
}

export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  // @ts-ignore
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

export function arraysEqual(arr1: string[], arr2: string[]) {
  if (arr1.length !== arr2.length) return false
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

export function isStringArrayEmpty(arr: string[]) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return true
  }

  return arr.every(item => typeof item === 'string' && item.trim() === '')
}

export function compareIdArrays(
  arr1: UniqueIdentifier[] | null,
  arr2: UniqueIdentifier[] | null
) {
  if (!arr1 || !arr2) {
    return false
  }
  if (arr1.length !== arr2.length) {
    return false
  }

  return arr1.every((element, index) => element === arr2[index])
}
