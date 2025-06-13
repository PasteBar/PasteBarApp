import { useEffect } from 'react'
import { Signal, useSignal } from '@preact/signals-react'
import { invoke } from '@tauri-apps/api'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import NoWrapIcon from '~/assets/icons/nowrap'
import WrapIcon from '~/assets/icons/wrap'
import NotFoundImage from '~/assets/images/image-not-found.png'
import NoImage from '~/assets/images/no-image.png'
import { isEmailNotUrl } from '~/libs/utils'
import clsx from 'clsx'
import { Dot } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import ImageWithFallback from '~/components/atoms/image/image-with-fallback-on-error'
import ToolTip from '~/components/atoms/tooltip'
import { CardValueViewer } from '~/components/card-value-viewer'
import { CodeViewerMemo } from '~/components/code-viewer'
import { Box, Flex, TextNormal } from '~/components/ui'

import { useGetLinkMetadataByItemId } from '~/hooks/queries/use-items'

import { CardContent } from '../../Dashboard/components/BaseCard'
import { getValuePreview } from '../../Dashboard/components/utils'
import { hyperlinkText } from '../../helpers'

type MenuCardViewBodyProps = {
  itemId?: string
  isDisabled?: boolean
  isActive?: boolean
  isSeparator?: boolean
  isFolder?: boolean
  isCode?: boolean
  isImage?: boolean
  isPath?: boolean
  isLink?: boolean
  isMasked?: boolean
  isVideo?: boolean
  hasMaskedWords?: boolean
  hasEmoji?: boolean
  imagePathFullRes?: string | null
  imageDataUrl?: string | null
  imageHash?: string | null
  imageWidthHeight?: string | null
  imageType?: string
  arrLinks?: string[] | string
  detectedLanguage?: string | null
  isImageData?: boolean
  menuName?: string | null
  pathType?: string | null
  isExpanded: Signal
  isDelete?: boolean
  isCopyOrPaste?: boolean
  isDark: boolean
  value?: string
}

export function MenuCardViewBody({
  itemId,
  isExpanded,
  isActive,
  isDisabled,
  isSeparator,
  isCode,
  isImage,
  isImageData,
  isLink,
  isMasked,
  isPath,
  hasMaskedWords,
  hasEmoji,
  isFolder,
  isVideo,
  isDelete,
  detectedLanguage,
  imagePathFullRes,
  imageDataUrl,
  imageHash,
  imageWidthHeight,
  imageType,
  arrLinks,
  isCopyOrPaste,
  pathType,
  menuName,
  isDark,
  value = '',
}: MenuCardViewBodyProps) {
  const { t } = useTranslation()
  const isWrapText = useSignal(false)

  const { valuePreview, morePreviewLines, morePreviewChars } = getValuePreview(value)
  const textValue: string = value || ''
  const isBrokenImage = useSignal(false)
  const pathTypeCheck = useSignal<string | null | undefined>('')

  const { metadataLinkByItemId } = useGetLinkMetadataByItemId(isLink, itemId)

  const hasLinkCard =
    isLink && Boolean(metadataLinkByItemId?.linkTitle && metadataLinkByItemId?.linkDomain)

  useEffect(() => {
    if (isExpanded.value) {
      isWrapText.value = false
    }
  }, [isExpanded.value])

  useEffect(() => {
    if (isPath) {
      invoke('check_path', { path: textValue })
        .then(() => {
          pathTypeCheck.value = pathType
        })
        .catch(() => {
          pathTypeCheck.value = 'Error'
        })
    }
  }, [isPath])

  const isEmptyBody = textValue.length === 0

  return (
    <CardContent
      className={clsx(
        isCopyOrPaste
          ? 'bg-green-50 dark:bg-green-900/40'
          : 'bg-slate-50/50 dark:bg-slate-900',
        isDelete && '!bg-red-50 dark:!bg-red-900',
        'px-3 pr-2 py-1.5 text-left flex flex-col select-auto relative rounded-md'
      )}
    >
      <Box className={`mb-0.5 ${!isActive ? 'opacity-40' : ''}`}>
        {isPath ? (
          <Highlight
            theme={isDark ? themes.vsDark : themes.github}
            code={textValue}
            language={'path'}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => {
              return (
                <code
                  className={`${className} ${
                    pathTypeCheck.value === 'Error'
                      ? ' line-through decoration-gray-300'
                      : ''
                  }`}
                  style={style}
                >
                  {tokens.map((line, i) => {
                    return (
                      <div
                        key={i}
                        {...getLineProps({ line })}
                        className="overflow-hidden text-ellipsis whitespace-pre-wrap"
                      >
                        {line.map((token, key) => (
                          <span
                            key={key}
                            {...getTokenProps({ token })}
                            className={`${
                              pathTypeCheck.value === 'Error' ? 'opacity-60' : ''
                            } select-text`}
                          >
                            {token.content}
                          </span>
                        ))}
                      </div>
                    )
                  })}
                </code>
              )
            }}
          </Highlight>
        ) : isImageData ? (
          <Box className="text-ellipsis self-start text-xs overflow-hidden cursor-pointer">
            <Box className="flex px-0 py-1 items-center justify-center">
              <ImageWithFallback
                src={textValue}
                hasError={isBrokenImage.value}
                onErrorCallback={() => {
                  isBrokenImage.value = true
                }}
                draggable={false}
                decoding="async"
                className="max-h-[200px] min-h-10"
              />
            </Box>
            <code className="pb-0.5 select-none">{valuePreview}</code>
          </Box>
        ) : isLink && isImage ? (
          <Box className="text-ellipsis self-start text-xs cursor-pointer overflow-hidden">
            <Box className="flex px-0 pt-1.5 pb-0.5 items-center justify-center">
              <ImageWithFallback
                src={ensureUrlPrefix(textValue)}
                hasError={isBrokenImage.value}
                onErrorCallback={() => {
                  isBrokenImage.value = true
                }}
                draggable={false}
                decoding="async"
                className="max-h-[200px] min-h-10"
              />
            </Box>
            <code className="pb-0.5">{hyperlinkText(textValue, arrLinks ?? '')}</code>
          </Box>
        ) : isImage ? (
          <Box className="px-0 py-1.5 flex items-center justify-center relative animate-in fade-in duration-300 !fill-mode-forwards">
            <img
              src={
                imagePathFullRes && (imageType === 'webp' || imageType === 'gif')
                  ? `${convertFileSrc(imagePathFullRes)}?${imageHash}`
                  : imageDataUrl && imagePathFullRes
                    ? imageDataUrl
                    : !imageDataUrl && !imagePathFullRes
                      ? NoImage
                      : NotFoundImage
              }
              draggable={false}
              decoding="async"
              height="auto"
              className="max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-600"
            />

            <Box className="absolute left-0 bottom-1 flex flex-row gap-1 rounded items-center pb-0.5 pl-0.5">
              <Box
                className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-950 px-1.5 rounded transform duration-300"
                title={t('Image size in pixels', { ns: 'common' })}
              >
                {imageWidthHeight} {imageType}
              </Box>
            </Box>
          </Box>
        ) : detectedLanguage && isCode && valuePreview ? (
          <Box className="text-ellipsis self-start text-sm w-full select-text">
            <CodeViewerMemo
              isDark={isDark}
              isLargeView={false}
              isShowMore={isExpanded.value || morePreviewLines == null}
              isWrapped={isWrapText.value}
              value={isExpanded.value ? textValue : valuePreview}
              language={detectedLanguage}
            />
          </Box>
        ) : isEmptyBody ? (
          <Box className="mb-0.5">
            <TextNormal className="self-start text-sm font-normal select-text !text-gray-400">
              {menuName}
            </TextNormal>
          </Box>
        ) : (
          <CardValueViewer
            isExpanded={isExpanded.value}
            isWrapped={isWrapText.value}
            isImageData={isImageData}
            isLargeView={false}
            isCode={isCode}
            isMasked={isMasked}
            isImage={isImage}
            isDark={isDark}
            textValue={textValue}
            valuePreview={valuePreview}
            hasLinkCard={hasLinkCard}
            metadataLinkByItemId={metadataLinkByItemId}
            metadataLinkImageWidth={12}
            morePreviewLines={morePreviewLines}
            searchTerm=""
          />
        )}
      </Box>
      <Flex className="justify-between select-none">
        {(morePreviewLines || morePreviewChars) && isActive && !isDisabled ? (
          <Box className="flex flex-row items-center rounded">
            <Box
              className="text-xs text-muted-foreground px-0 transform duration-300 cursor-pointer"
              onClick={() => {
                isExpanded.value = !isExpanded.value
              }}
            >
              <ToolTip
                text={!isExpanded.value ? t('Show all', { ns: 'common' }) : ''}
                isCompact
                isDisabled={isExpanded.value}
                delayDuration={2000}
                side="bottom"
                sideOffset={10}
              >
                {!isExpanded.value ? (
                  morePreviewChars ? (
                    <>
                      +{morePreviewChars} {t('chars', { ns: 'common' })}
                    </>
                  ) : (
                    morePreviewLines && (
                      <>
                        +{morePreviewLines} {t('lines', { ns: 'common' })}
                      </>
                    )
                  )
                ) : (
                  <>- {t('show less', { ns: 'common' })}</>
                )}
              </ToolTip>
            </Box>

            <Box
              className="text-xs text-muted-foreground px-1.5 transform duration-300 cursor-pointer"
              onClick={() => {
                isWrapText.value = !isWrapText.value
              }}
            >
              <ToolTip
                text={
                  !isWrapText.value
                    ? t('Lines Wrap', { ns: 'common' })
                    : t('No Wrap', { ns: 'common' })
                }
                delayDuration={2000}
                isCompact
                side="bottom"
                sideOffset={10}
              >
                {!isWrapText.value ? (
                  <WrapIcon width={20} height={20} />
                ) : (
                  <NoWrapIcon width={20} height={20} />
                )}
              </ToolTip>
            </Box>
          </Box>
        ) : !isActive ? (
          <Box
            className={`bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-xs rounded-sm px-1.5`}
          >
            {t('Inactive', { ns: 'common' })}
          </Box>
        ) : isDisabled ? (
          <Box
            className={`bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-xs rounded-sm px-1.5`}
          >
            {t('Disabled', { ns: 'common' })}
          </Box>
        ) : (
          <Box />
        )}

        <Box className={`flex flex-row gap-1 items-center justify-end `}>
          {isEmptyBody && !isSeparator && !isFolder && !isImage ? (
            <>
              <Box
                className={`bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-400 text-xs rounded-sm px-1.5`}
              >
                {t('Type:::Empty', { ns: 'common' })}
              </Box>
              <Box
                className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
              >
                {t('Type:::Label', { ns: 'common' })}
              </Box>
            </>
          ) : isSeparator ? (
            <Box
              className={`bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-400v text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Separator', { ns: 'common' })}
            </Box>
          ) : isFolder ? (
            <Box
              className={`bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-400 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Submenu', { ns: 'common' })}
            </Box>
          ) : isImage ? (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Image', { ns: 'common' })}
            </Box>
          ) : detectedLanguage ? (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {detectedLanguage}
            </Box>
          ) : isMasked || hasMaskedWords ? (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm ${
                hasMaskedWords ? 'px-0.5' : 'px-1.5'
              }`}
            >
              {isMasked ? t('Type:::Secret', { ns: 'common' }) : <Dot size={16} />}
            </Box>
          ) : isImageData ? (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Image Base64', { ns: 'common' })}
            </Box>
          ) : (
            !isLink &&
            !isPath && (
              <Box
                className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
              >
                {t('Type:::Text', { ns: 'common' })}
              </Box>
            )
          )}

          {isLink ? (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {isVideo
                ? t('Type:::Video', { ns: 'common' })
                : isEmailNotUrl(textValue)
                  ? t('Type:::Email', { ns: 'common' })
                  : t('Type:::Link', { ns: 'common' })}
            </Box>
          ) : isPath && pathTypeCheck.value ? (
            <Box
              className={`${
                pathTypeCheck.value === 'Error'
                  ? 'bg-red-300 dark:bg-red-800'
                  : ' text-slate-700 dark:bg-slate-600'
              } dark:text-slate-300 bg-slate-200 text-xs rounded-sm px-1.5`}
            >
              {pathTypeCheck.value === 'Error' ? (
                <ToolTip
                  text={t('File, folder or app path does not exist', { ns: 'dashboard' })}
                  className="text-slate-300 bg-red-50 dark:!bg-red-800 text-center"
                  maxWidth={300}
                  isCompact
                  side="bottom"
                  sideOffset={10}
                >
                  {pathTypeCheck.value}
                </ToolTip>
              ) : (
                pathTypeCheck.value
              )}
            </Box>
          ) : (
            hasEmoji && (
              <Box
                className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
              >
                {t('Emoji', { ns: 'common' })}
              </Box>
            )
          )}
        </Box>
      </Flex>
    </CardContent>
  )
}
