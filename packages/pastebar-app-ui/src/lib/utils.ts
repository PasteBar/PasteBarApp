import { UniqueIdentifier } from '@dnd-kit/core'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { MenuItem } from '~/types/menu'

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

  const darkColorCode = darkCode
    ? darkCode
    : colorCode === '200' && colorNameToUse === 'slate'
      ? '700'
      : colorNameToUse !== 'slate'
        ? '900'
        : '300'
          ? '600'
          : '400'
            ? '500'
            : '600'
              ? '700'
              : '300'

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
