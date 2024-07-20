import { useMemo } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { timeAgoInstance } from '~/locales/locales'
import {
  collectionsStoreAtom,
  playerStoreAtom,
  showDeleteClipConfirmationId,
  showEditClipId,
  showEditClipNameId,
  showLargeViewClipId,
} from '~/store'
import format from 'date-fns/format'
import { useAtomValue } from 'jotai'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ToolTip from '~/components/atoms/tooltip'
import { Badge, Box, Button } from '~/components/ui'

import { useGetCollectionWithClips } from '~/hooks/queries/use-collections'

import { ClipCardMemoized } from './ClipCard'

interface ClipCardLargeViewProps {
  isDark: boolean
  isHistoryDragActive: boolean
  clipId: UniqueIdentifier
}

export function ClipCardLargeView({
  clipId,
  isDark,
  isHistoryDragActive,
}: ClipCardLargeViewProps) {
  useGetCollectionWithClips()
  const { t } = useTranslation()
  const { clipItems } = useAtomValue(collectionsStoreAtom)
  const { isPlaying, isSongWithIdAndTypePlaying } = useAtomValue(playerStoreAtom)

  const clip = useMemo(() => {
    if (showLargeViewClipId.value) {
      const clip = clipItems.find(({ itemId }) => itemId === clipId)
      if (clip) {
        return clip
      } else {
        showLargeViewClipId.value = null
      }
    }
  }, [clipId, clipItems])

  const [timeAgoCreated, timeAgoUpdated] = useMemo(() => {
    return [
      clip?.createdAt &&
        timeAgoInstance().format(clip.createdAt ?? 0, { round: 'floor' }),
      clip?.updatedAt &&
        timeAgoInstance().format(clip.updatedAt ?? 0, { round: 'floor' }),
    ]
  }, [clip])

  if (clip == null) {
    return null
  }

  return (
    <>
      <Box
        className={`max-w-full max-h-full ${
          showEditClipId.value === clipId && !clip.isCode && !clip.isImage
            ? 'min-w-[80%]'
            : ''
        }`}
      >
        <Box className="flex justify-center text-gray-400 text-xs my-2 gap-1">
          <ToolTip
            text={`${t('Created', { ns: 'common' })}: ${format(
              clip.createdAt ?? 0,
              'PPpp'
            )}`}
            delayDuration={2000}
            isCompact
            side="bottom"
            sideOffset={10}
          >
            {timeAgoCreated}
          </ToolTip>
          {timeAgoUpdated !== timeAgoCreated && (
            <ToolTip
              text={`${t('Updated', { ns: 'common' })}: ${format(
                clip.updatedAt ?? 0,
                'PPpp'
              )}`}
              delayDuration={2000}
              isCompact
              side="bottom"
              sideOffset={10}
            >
              ({timeAgoUpdated})
            </ToolTip>
          )}
        </Box>

        <Box className="text-gray-400 text-xs mb-1 mt-2">
          <ClipCardMemoized
            clip={{
              ...clip,
              type: 'clip',
              id: clipId,
              createdAt: clip.createdAt ?? 0,
              tabId: clip.tabId ?? null,
            }}
            boardColor={clip.color}
            isDark={isDark}
            isMp3={clip.isLink && clip.value?.endsWith('.mp3')}
            isPlaying={isSongWithIdAndTypePlaying(clipId, 'clip') && isPlaying}
            isClipNameEditing={showEditClipNameId.value === clipId}
            isClipDelete={showDeleteClipConfirmationId.value === clipId}
            isClipEdit={showEditClipId.value === clipId}
            isShowOrganizeLayoutValue={false}
            isHistoryDragActive={isHistoryDragActive}
            isShowDetails={true}
            isLargeView={true}
            isSelected={false}
          />
        </Box>
        <Box className="flex justify-center text-gray-400 text-xs my-2">
          <Badge
            variant="outline"
            className="bg-slate-100 px-2 pl-2.5 text-slate-400 cursor-pointer hover:bg-slate-300 dark:bg-slate-500 dark:text-slate-800 hover:dark:bg-slate-400"
            onClick={() => {
              showLargeViewClipId.value = null
            }}
          >
            {t('Close', { ns: 'common' })}
            <X size={14} className="ml-1" />
          </Badge>
        </Box>
      </Box>
    </>
  )
}
