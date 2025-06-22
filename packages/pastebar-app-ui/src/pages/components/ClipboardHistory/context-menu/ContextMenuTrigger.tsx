import { Dispatch, forwardRef, SetStateAction, useState } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'

import {
  ContextMenu,
  ContextMenuTrigger as ContextMenuTriggerPrimitive,
} from '~/components/ui'

import { LinkMetadata } from '~/types/history'

import ClipboardHistoryRowContextMenu from './ClipboardHistoryRowContextMenu'

// // Lazy load the heavy context menu component
// const ClipboardHistoryRowContextMenu = lazy(
//   () => import('./ClipboardHistoryRowContextMenu')
// )

interface ContextMenuTriggerProps {
  children: React.ReactNode
  onOpenChange?: (isOpen: boolean) => void
  historyId: UniqueIdentifier
  value: string | null
  arrLinks: string[]
  isImage: boolean
  isText: boolean
  copiedFromApp?: string | null
  isMasked: boolean
  isImageData: boolean
  isMp3: boolean | undefined
  hasLinkCard: boolean | undefined | string | null
  isSelected: boolean
  isLargeView: boolean
  isPinned: boolean
  isFavorite: boolean
  detectedLanguage: string | null
  setLargeViewItemId: (historyId: UniqueIdentifier | null) => void
  setSavingItem: (historyId: UniqueIdentifier | null) => void
  invalidateClipboardHistoryQuery?: () => void
  generateLinkMetaData?: (
    historyId: UniqueIdentifier,
    url: string
  ) => Promise<LinkMetadata | void>
  removeLinkMetaData?: (historyId: UniqueIdentifier) => Promise<void>
  setSelectHistoryItem: (id: UniqueIdentifier) => void
  setSelectedHistoryItems?: (ids: UniqueIdentifier[]) => void
  selectedHistoryItems?: UniqueIdentifier[]
  onCopyPaste: (id: UniqueIdentifier, delay?: number) => void
  setHistoryFilters?: Dispatch<SetStateAction<string[]>>
  setAppFilters?: Dispatch<SetStateAction<string[]>>
  onDeleteConfirmationChange?: (
    historyId: UniqueIdentifier | null,
    isMultiSelect?: boolean
  ) => void
}

const ContextMenuTrigger = forwardRef<HTMLElement, ContextMenuTriggerProps>(
  (
    {
      children,
      onOpenChange,
      historyId,
      value,
      arrLinks,
      isImage,
      isText,
      copiedFromApp,
      isMasked,
      isImageData,
      isMp3,
      hasLinkCard,
      isSelected,
      isLargeView,
      isPinned,
      isFavorite,
      detectedLanguage,
      setLargeViewItemId,
      setSavingItem,
      invalidateClipboardHistoryQuery,
      generateLinkMetaData,
      removeLinkMetaData,
      setSelectHistoryItem,
      setSelectedHistoryItems,
      selectedHistoryItems,
      onCopyPaste,
      setHistoryFilters,
      setAppFilters,
      onDeleteConfirmationChange,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    }

    return (
      <ContextMenu onOpenChange={handleOpenChange}>
        <ContextMenuTriggerPrimitive ref={ref} asChild>
          {children}
        </ContextMenuTriggerPrimitive>

        {isOpen && (
          <ClipboardHistoryRowContextMenu
            historyId={historyId}
            value={value}
            arrLinks={arrLinks}
            isImage={isImage}
            isText={isText}
            copiedFromApp={copiedFromApp}
            isMasked={isMasked}
            isImageData={isImageData}
            isMp3={isMp3}
            hasLinkCard={hasLinkCard}
            isSelected={isSelected}
            isLargeView={isLargeView}
            isPinned={isPinned}
            isFavorite={isFavorite}
            detectedLanguage={detectedLanguage}
            setLargeViewItemId={setLargeViewItemId}
            setSavingItem={setSavingItem}
            invalidateClipboardHistoryQuery={invalidateClipboardHistoryQuery}
            generateLinkMetaData={generateLinkMetaData}
            removeLinkMetaData={removeLinkMetaData}
            setSelectHistoryItem={setSelectHistoryItem}
            setSelectedHistoryItems={setSelectedHistoryItems}
            selectedHistoryItems={selectedHistoryItems}
            onCopyPaste={onCopyPaste}
            setHistoryFilters={setHistoryFilters}
            setAppFilters={setAppFilters}
            onDeleteConfirmationChange={onDeleteConfirmationChange}
          />
        )}
      </ContextMenu>
    )
  }
)

ContextMenuTrigger.displayName = 'ContextMenuTrigger'

export default ContextMenuTrigger
