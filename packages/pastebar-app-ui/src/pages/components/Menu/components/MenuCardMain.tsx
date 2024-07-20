import { useMemo } from 'react'
import { Signal } from '@preact/signals-react'
import { collectionsStoreAtom, resetMenuCreateOrEdit } from '~/store'
import { useAtomValue } from 'jotai/react'

import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'
import { useSignal } from '~/hooks/use-signal'

import { Item } from '~/types/menu'

import { MenuEditContent } from './MenuCardEdit'
import { MenuCardViewBody } from './MenuCardViewBody'
import { MenuClipCardViewBody } from './MenuClipCardViewBody'

export default function MenuCardMain({
  isDisabled,
  isActive,
  isMenuEdit,
  isSeparator,
  isMenu,
  isFolder,
  item,
  menuName,
  isDark,
  deletingMenuItemIds,
  isClip,
}: {
  isDisabled?: boolean
  isActive?: boolean
  isMenu?: boolean
  isText?: boolean
  isFolder?: boolean
  isSeparator?: boolean
  isCode?: boolean
  item: Item
  isShowLinkedMenu?: boolean
  isMenuEdit: boolean
  menuName: string
  isDark: boolean
  deletingMenuItemIds: Signal<string[] | null>
  isClip: boolean | undefined
}) {
  const { clipItems } = useAtomValue(collectionsStoreAtom)
  const isExpanded = useSignal(false)

  const [copiedItem] = useCopyClipItem({})
  const [pastedItem] = usePasteClipItem({})

  const {
    itemId,
    isImage,
    isImageData,
    isPath,
    isLink,
    isCode,
    isText,
    detectedLanguage,
    imagePathFullRes,
    imageDataUrl,
    imageHash,
    isMasked,
    isVideo,
    hasMaskedWords,
    hasEmoji,
    imageWidth,
    imageHeight,
    imageType,
    value,
  } = item

  const clip = useMemo(() => {
    return isClip ? clipItems.find(clip => clip.itemId === itemId) : null
  }, [isClip, clipItems, itemId])

  const isDelete = useMemo(() => {
    return deletingMenuItemIds.value?.includes(itemId) ?? false
  }, [deletingMenuItemIds.value, itemId])

  const arrLinks = useMemo(() => {
    if (!clip || !clip.links) {
      return []
    }

    let arrLinks = []

    if (clip.links) {
      try {
        arrLinks = JSON.parse(clip.links as string)
      } catch (e) {
        arrLinks = []
      }
    }

    return arrLinks
  }, [clip])

  if (isMenuEdit) {
    return (
      <MenuEditContent
        isClip={isClip}
        itemId={itemId}
        value={value}
        isCode={isCode}
        detectedLanguage={detectedLanguage}
        isText={isText}
        isMenu={isMenu}
        isImage={isImage}
        isMasked={isMasked}
        isVideo={isVideo}
        isDelete={isDelete}
        hasEmoji={hasEmoji}
        imageDataUrl={imageDataUrl}
        isDark={isDark}
        isPath={isPath}
        isLink={isLink}
        deletingMenuItemIds={deletingMenuItemIds}
        onCancel={() => {
          resetMenuCreateOrEdit()
        }}
      />
    )
  }

  return isClip && clip?.itemId === itemId ? (
    <MenuClipCardViewBody
      isImage={clip.isImage}
      isLink={clip.isLink}
      isVideo={clip.isVideo}
      isPath={clip.isPath}
      isForm={clip.isForm}
      isTemplate={clip.isTemplate}
      isCopyOrPaste={copiedItem === itemId || pastedItem === itemId}
      isCode={clip.isCode}
      clipName={clip.name}
      isCommand={clip.isCommand}
      isWebRequest={clip.isWebRequest}
      isWebScraping={clip.isWebScraping}
      isExpanded={isExpanded}
      isDark={isDark}
      arrLinks={arrLinks}
      isMasked={clip.isMasked}
      hasMaskedWords={clip.hasMaskedWords}
      detectedLanguage={clip.detectedLanguage}
      hasEmoji={clip.hasEmoji}
      pathType={clip.pathType}
      isImageData={clip.isImageData}
      imageHash={clip.imageHash}
      imageType={clip.imageType}
      imageScale={clip.imageScale}
      imagePathFullRes={clip.imagePathFullRes}
      imageDataUrl={clip.imageDataUrl}
      isLargeView={false}
      isDelete={isDelete}
      formTemplateOptions={clip.formTemplateOptions}
      commandRequestOutput={clip.commandRequestOutput?.replace('[Err]', '')}
      isCommandRequestRunError={Boolean(clip.commandRequestOutput?.startsWith('[Err]'))}
      commandRequestOutputLastRunAt={clip.commandRequestLastRunAt}
      requestOptions={clip.requestOptions}
      itemOptions={clip.itemOptions}
      imageWidthHeight={clip.imageWidth ? `${clip.imageWidth}x${clip.imageHeight}` : null}
      clipId={itemId}
      value={clip.value}
    />
  ) : (
    <MenuCardViewBody
      itemId={itemId}
      isDark={isDark}
      isDisabled={isDisabled}
      isActive={isActive}
      isCopyOrPaste={copiedItem === itemId || pastedItem === itemId}
      isFolder={isFolder}
      isImageData={isImageData}
      isCode={isCode}
      isSeparator={isSeparator}
      menuName={menuName}
      isExpanded={isExpanded}
      isImage={isImage}
      isPath={isPath}
      isLink={isLink}
      isVideo={isVideo}
      isDelete={isDelete}
      isMasked={isMasked}
      hasMaskedWords={hasMaskedWords}
      hasEmoji={hasEmoji}
      pathType={item.pathType}
      detectedLanguage={detectedLanguage}
      imagePathFullRes={imagePathFullRes}
      imageDataUrl={imageDataUrl}
      imageHash={imageHash}
      imageWidthHeight={imageWidth ? `${imageWidth}x${imageHeight}` : null}
      imageType={imageType}
      arrLinks={item.links ? JSON.parse(item.links as string) ?? [] : []}
      value={value}
    />
  )
}
