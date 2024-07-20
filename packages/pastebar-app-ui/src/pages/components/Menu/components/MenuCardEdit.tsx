import { useCallback, useEffect, useMemo, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { Signal } from '@preact/signals-react'
import { invoke } from '@tauri-apps/api'
import BlankIcon from '~/assets/icons/blank-square'
import HightlightIcon from '~/assets/icons/hightlight-square'
import MaskIcon from '~/assets/icons/mask-square'
import NoImage from '~/assets/images/no-image.png'
import { isEmailNotUrl } from '~/libs/utils'
import {
  isMenuNameEditing,
  resetMenuCreateOrEdit,
  showMenuNameNotSavedError,
} from '~/store'
import clsx from 'clsx'
import linkifyIt from 'linkify-it'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardType,
  CreditCard,
  ExternalLink,
  FileCode2,
  FileSymlink,
  FileText,
  Image,
  Link,
  Pencil,
  RefreshCcw,
  RemoveFormatting,
  Settings,
  X,
  XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import LinkCard from '~/components/atoms/link-card/link-card'
import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import CodeEditor from '~/components/code-editor'
import InputField from '~/components/molecules/input'
import TextArea, { TextAreaRef } from '~/components/molecules/textarea'
import {
  Box,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Text,
} from '~/components/ui'

import { MAX_MENU_LABEL_LENGTH, MINIMAL_ITEM_NAME_LENGTH } from '~/store/constants'

import {
  useGetLinkMetadataByItemId,
  useUpdateMenuItemById,
} from '~/hooks/queries/use-items'
import { useDebounce } from '~/hooks/use-debounce'
import { useSignal } from '~/hooks/use-signal'

import { CardContent } from '../../Dashboard/components/BaseCard'
import { ClipAddImage } from '../../Dashboard/components/ClipAddImage'
import { ClipAddPath } from '../../Dashboard/components/ClipAddPath'
import { ClipRemoveImage } from '../../Dashboard/components/ClipRemoveImage'
import { MenuCardTypeMenu } from './MenuCardTypeMenu'
import { MenuDelete } from './MenuDelete'

// eslint-disable-next-line sonarjs/cognitive-complexity
export function MenuEditContent({
  itemId,
  value,
  isCode,
  detectedLanguage,
  isText,
  isClip,
  isMasked,
  isVideo,
  isImage,
  isDelete,
  hasEmoji,
  isPath,
  imageDataUrl,
  isDark,
  deletingMenuItemIds,
  isLink,
  onCancel,
}: {
  itemId: string
  isClip: boolean | undefined
  isMenu: boolean | undefined
  isCode?: boolean
  detectedLanguage?: string | null
  isImage?: boolean
  isText?: boolean
  isDelete?: boolean
  isMasked?: boolean
  isVideo?: boolean
  hasEmoji?: boolean
  isPath?: boolean
  isLink?: boolean
  imageDataUrl?: string | null
  value: string | undefined
  deletingMenuItemIds: Signal<string[] | null>
  isDark: boolean
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const clipValue = useSignal('')
  const showSaveConfirmation = useSignal(false)
  const clipValueUpdated = useSignal(Date.now())
  const isSaving = useSignal(false)
  const showLinkValidationError = useSignal<boolean | undefined>(undefined)
  const showPathValidationError = useSignal<boolean | undefined>(undefined)
  const showCommandTestRunError = useSignal<boolean | undefined>(undefined)
  const showCommandOutputTemplateError = useSignal<boolean | undefined>(undefined)
  const { updateMenuItemById } = useUpdateMenuItemById()
  const textAreaRef = useRef<TextAreaRef>(null)
  const debouncedPathInput = useDebounce(clipValue.value, 300)
  const { metadataLinkByItemId, invalidateLinkMetadataByItemId } =
    useGetLinkMetadataByItemId(isLink, itemId)

  const hasLinkCard = metadataLinkByItemId?.linkTitle && metadataLinkByItemId?.linkDomain

  useEffect(() => {
    clipValue.value = value ?? ''
  }, [value])

  useEffect(() => {
    if (isLink) {
      const linkify = linkifyIt()
      const matches = linkify.match(clipValue.value)
      if (!matches || matches.length > 1) {
        showLinkValidationError.value = true
      } else {
        showLinkValidationError.value = false
      }
    }
  }, [isLink])

  const validatePath = useCallback(
    async (path: string) => {
      const isInit = value === clipValue.value
      const pathToValidate = isInit ? value : path
      if (isPath && pathToValidate.length > 5) {
        invoke('check_path', { path: pathToValidate })
          .then(() => {
            showPathValidationError.value = false
          })
          .catch(() => {
            showPathValidationError.value = true
          })
      }
    },
    [isPath]
  )

  useEffect(() => {
    if (isPath && debouncedPathInput.length > 5) {
      validatePath(debouncedPathInput)
    }
  }, [isPath, debouncedPathInput])

  useEffect(() => {
    if (
      (showLinkValidationError.value ||
        showPathValidationError.value ||
        showCommandOutputTemplateError.value ||
        showCommandTestRunError.value) &&
      isSaving.value
    ) {
      showSaveConfirmation.value = true
    }
  }, [
    showLinkValidationError.value,
    showPathValidationError.value,
    showCommandTestRunError.value,
    showCommandOutputTemplateError.value,
    isSaving.value,
  ])

  const saveEditValue = async (force = false) => {
    if (isMenuNameEditing.value) {
      showMenuNameNotSavedError.value = true
      return
    }

    let pathType: string | null = null

    showMenuNameNotSavedError.value = false
    showSaveConfirmation.value = false
    isSaving.value = true
    showLinkValidationError.value = undefined
    showPathValidationError.value = undefined

    if (!force) {
      if (isLink) {
        const linkify = linkifyIt()
        const matches = linkify.match(clipValue.value)
        if (!matches || matches.length > 1) {
          showLinkValidationError.value = true
          return
        }
      }

      if (isPath) {
        try {
          pathType = await invoke('path_type_check', { path: clipValue.value })
        } catch (e) {
          pathType = 'Error'
          showPathValidationError.value = true
          return
        }
      }
    } else {
      pathType = isPath ? 'Error' : null
    }

    await updateMenuItemById({
      updatedItem: {
        value: clipValue.value,
        ...(pathType && isPath ? { pathType } : {}),
        itemId,
      },
    })

    setTimeout(() => {
      isSaving.value = false
      onCancel()
    }, 200)
  }

  const clipType = useMemo(
    () =>
      isCode
        ? t('TypeMenu:::Code Snippet', { ns: 'common' })
        : isImage
          ? t('TypeMenu:::Image', { ns: 'common' })
          : isLink
            ? t('TypeMenu:::Link or Email', { ns: 'common' })
            : isPath
              ? t('TypeMenu:::Link or File, Path or App', { ns: 'common' })
              : t('TypeMenu:::Plain Text', { ns: 'common' }),

    [isCode, isImage, isLink, isPath]
  )

  return (
    <CardContent
      className={clsx(
        'px-2 pr-1.5 pb-1.5 m-0.5 mt-0 pt-1 mx-1 text-left flex flex-row rounded-md select-auto',
        isDelete && 'bg-red-50 dark:bg-red-900'
      )}
    >
      <Box className="w-full mt-0">
        {!isClip ? (
          <>
            {isImage ? (
              <Box className="px-0 py-1.5 flex items-center justify-center relative">
                <img
                  src={imageDataUrl ? imageDataUrl : NoImage}
                  draggable={false}
                  decoding="async"
                  height="auto"
                  className="max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-400"
                />
                <Box className="absolute">
                  {imageDataUrl ? (
                    <ClipRemoveImage id={itemId as UniqueIdentifier} isMenu />
                  ) : (
                    <ClipAddImage id={itemId as UniqueIdentifier} />
                  )}
                </Box>
              </Box>
            ) : isPath ? (
              <Flex className="relative text-normal">
                <InputField
                  defaultValue={clipValue.value}
                  key={clipValueUpdated.value}
                  placeholder={t('Enter full path to file, folder or application', {
                    ns: 'dashboard',
                  })}
                  classNameInput={`pr-10 text-sm focus:border- ${
                    showPathValidationError.value
                      ? '!border-yellow-600 !focus:border-yellow-600'
                      : ''
                  } ${
                    showPathValidationError.value === false
                      ? '!border-green-600 !focus:border-green-600'
                      : ''
                  }`}
                  suffix={
                    <Box className="absolute top-3 right-4">
                      {showPathValidationError.value ? (
                        <ToolTip
                          text={t('File, folder or app path might not be valid', {
                            ns: 'dashboard',
                          })}
                          isCompact
                          side="bottom"
                          className="bg-yellow-50 dark:bg-yellow-900 text-yellow-600 font-semibold"
                          asChild
                          sideOffset={10}
                        >
                          <AlertTriangle
                            size={18}
                            className="text-yellow-500 cursor-pointer"
                          />
                        </ToolTip>
                      ) : (
                        showPathValidationError.value === false && (
                          <ToolTip
                            text={t('File, folder or app path is valid', {
                              ns: 'dashboard',
                            })}
                            isCompact
                            side="bottom"
                            className="bg-green-50 dark:bg-green-900 text-green-600 font-semibold"
                            asChild
                            sideOffset={10}
                          >
                            <Check size={18} className="text-green-600 cursor-pointer" />
                          </ToolTip>
                        )
                      )}
                    </Box>
                  }
                  onChange={e => {
                    clipValue.value = e.target.value
                  }}
                />
                <ClipAddPath
                  onCallBack={dropPath => {
                    clipValueUpdated.value = Date.now()
                    clipValue.value = dropPath
                  }}
                />
              </Flex>
            ) : isLink ? (
              <Flex className="relative text-normal mt-1 flex-col">
                <InputField
                  defaultValue={clipValue.value}
                  placeholder={t('Enter web link or email', { ns: 'dashboard' })}
                  classNameInput={`pr-7 text-sm focus:border- ${
                    showLinkValidationError.value
                      ? '!border-yellow-600 !focus:border-yellow-600'
                      : ''
                  } ${
                    showLinkValidationError.value === false
                      ? '!border-green-600 !focus:border-green-600'
                      : ''
                  }`}
                  suffix={
                    <Box className="absolute top-3 right-2">
                      {showLinkValidationError.value ? (
                        <ToolTip
                          text={t('Web Link or Email might not be valid', {
                            ns: 'dashboard',
                          })}
                          isCompact
                          side="bottom"
                          className="bg-yellow-50 dark:bg-yellow-900 dark:text-slate-200 text-yellow-600 font-semibold"
                          asChild
                          sideOffset={10}
                        >
                          <AlertTriangle
                            size={18}
                            className="text-yellow-500 cursor-pointer"
                          />
                        </ToolTip>
                      ) : (
                        showLinkValidationError.value === false && (
                          <ToolTip
                            text={t('Web or Email link is valid', { ns: 'dashboard' })}
                            isCompact
                            side="bottom"
                            className="bg-green-50 dark:bg-green-900 dark:text-slate-200 text-green-600 font-semibold"
                            asChild
                            sideOffset={10}
                          >
                            <Check size={18} className="text-green-600 cursor-pointer" />
                          </ToolTip>
                        )
                      )}
                    </Box>
                  }
                  onChange={e => {
                    if (showLinkValidationError.value) {
                      showLinkValidationError.value = undefined
                    }
                    if (e.target.value.length > 5) {
                      const linkify = linkifyIt()
                      const matches = linkify.match(e.target.value)
                      if (!matches || matches.length > 1) {
                        showLinkValidationError.value = true
                      } else {
                        showLinkValidationError.value = false
                      }
                    }
                    clipValue.value = e.target.value
                  }}
                />

                {hasLinkCard && (
                  <Box className="self-start mt-2 mb-0 text-xs w-full select-none overflow-hidden">
                    <LinkCard
                      isDisabled={
                        ensureUrlPrefix(clipValue.value) !== metadataLinkByItemId?.linkUrl
                      }
                      title={metadataLinkByItemId?.linkTitle}
                      isTrack={metadataLinkByItemId?.linkIsTrack}
                      trackTitle={metadataLinkByItemId?.linkTrackTitle}
                      trackArtist={metadataLinkByItemId?.linkTrackArtist}
                      trackAlbum={metadataLinkByItemId?.linkTrackAlbum}
                      description={metadataLinkByItemId?.linkDescription}
                      favicon={metadataLinkByItemId?.linkFavicon}
                      link={metadataLinkByItemId?.linkUrl}
                      image={metadataLinkByItemId?.linkImage}
                      imageWidth={12}
                      domain={metadataLinkByItemId?.linkDomain}
                    />
                  </Box>
                )}
                <Flex className="w-full mt-1 justify-start select-none">
                  {isEmailNotUrl(clipValue.value) ||
                  showLinkValidationError.value ||
                  clipValue.value.length < 3 ? (
                    !isEmailNotUrl(clipValue.value) && (
                      <Button disabled={true} variant="ghost" className="!px-1 !m-0 !h-4">
                        {hasLinkCard ? (
                          <Text className="!text-grey-500" size="xs">
                            <RefreshCcw size={13} className="mr-1" />
                            {t('Update Link Card', { ns: 'dashboard' })}
                          </Text>
                        ) : (
                          <Text className="!text-grey-500" size="xs">
                            <CreditCard size={13} className="mr-1" />
                            {t('Add Link Card', { ns: 'dashboard' })}
                          </Text>
                        )}
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="ghost"
                      className="px-1 !m-0 !h-4 hover:bg-transparent"
                      onClick={async () => {
                        await invoke('fetch_link_metadata', {
                          url: ensureUrlPrefix(clipValue.value),
                          itemId,
                        })
                        invalidateLinkMetadataByItemId()
                      }}
                    >
                      {hasLinkCard ? (
                        <Text
                          className="!text-blue-500 dark:!text-blue-400 hover:underline cursor-pointer"
                          size="xs"
                        >
                          <RefreshCcw size={13} className="mr-1" />
                          {t('Update Link Card', { ns: 'dashboard' })}
                        </Text>
                      ) : (
                        <Text
                          className="!text-blue-500 dark:!text-blue-400 hover:underline cursor-pointer"
                          size="xs"
                        >
                          <CreditCard size={13} className="mr-1" />
                          {t('Add Link Card', { ns: 'dashboard' })}
                        </Text>
                      )}
                    </Button>
                  )}
                  {hasLinkCard && (
                    <Button
                      variant="ghost"
                      className="px-1 ml-auto !h-4 hover:bg-transparent"
                      onClick={async () => {
                        await invoke('delete_link_metadata', {
                          itemId,
                        })
                        invalidateLinkMetadataByItemId()
                      }}
                    >
                      <Text
                        className="!text-blue-500 dark:!text-blue-400 hover:underline cursor-pointer"
                        size="xs"
                      >
                        {t('Remove', { ns: 'common' })}
                        <XCircle size={14} className="ml-1" />
                      </Text>
                    </Button>
                  )}
                </Flex>
              </Flex>
            ) : isCode ? (
              <CodeEditor
                key="code-editor"
                value={clipValue.value}
                height="200px"
                isDark={isDark}
                options={{
                  mode: detectedLanguage ?? 'javascript',
                }}
                onChange={e => {
                  clipValue.value = e.getValue()
                }}
              />
            ) : (
              <>
                <Box
                  className={
                    'text-slate-400 flex gap-1.5 px-0.5 p-1.5 pt-0.5 items-center'
                  }
                >
                  <ToolTip
                    isCompact
                    text={t('Toolbar:::Copy and Paste Formatting', { ns: 'common' })}
                  >
                    <ClipboardType
                      size={19}
                      className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                      onClick={() => {
                        textAreaRef?.current?.handleAddBBcode('copy')
                      }}
                    />
                  </ToolTip>
                  <ToolTip
                    isCompact
                    text={t('Toolbar:::Masked Text Formatting', { ns: 'common' })}
                  >
                    <MaskIcon
                      width={19}
                      height={19}
                      className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                      onClick={() => {
                        textAreaRef?.current?.handleAddBBcode('mask')
                      }}
                    />
                  </ToolTip>
                  <ToolTip
                    isCompact
                    text={t('Toolbar:::Blank Text Formatting', { ns: 'common' })}
                  >
                    <BlankIcon
                      width={19}
                      height={19}
                      className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                      onClick={() => {
                        textAreaRef?.current?.handleAddBBcode('blank')
                      }}
                    />
                  </ToolTip>
                  <ToolTip
                    isCompact
                    text={t('Toolbar:::Hightlight Text Formatting', { ns: 'common' })}
                  >
                    <HightlightIcon
                      width={19}
                      height={19}
                      className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                      onClick={() => {
                        textAreaRef?.current?.handleAddBBcode('hl')
                      }}
                    />
                  </ToolTip>
                  <div tabIndex={-1} className="ml-auto mr-0.5">
                    <ToolTip
                      isCompact
                      text={t('Toolbar:::Remove Text Formatting', { ns: 'common' })}
                      asChild
                    >
                      <RemoveFormatting
                        size={17}
                        className="hover:text-red-500 dark:hover:text-red-700 cursor-pointer"
                        onClick={() => {
                          textAreaRef?.current?.handleRemoveBBcodes([
                            'copy',
                            'mask',
                            'blank',
                            'hl',
                            'h',
                            'b',
                            'i',
                          ])
                        }}
                      />
                    </ToolTip>
                  </div>
                </Box>
                <TextArea
                  ref={textAreaRef}
                  tabIndex={0}
                  enableEmoji={false}
                  className="bg-white rounded-md text-sm w-full mr-1"
                  placeholder="Enter paste value"
                  rows={2}
                  autoFocus={!isMenuNameEditing.value}
                  autoCorrect="off"
                  spellCheck={false}
                  enableEmojiInside={true}
                  label=""
                  maxRows={6}
                  value={clipValue.value}
                  onKeyDown={e => {
                    e.stopPropagation()
                  }}
                  onChange={e => {
                    clipValue.value = e.target.value
                  }}
                />
              </>
            )}
          </>
        ) : (
          <Box className="mt-2">
            <Flex className="gap-1 w-full justify-start">
              <Text className="font-semibold" size={'sm'}>
                {t("Clip value can't edit", { ns: 'menus' })}
              </Text>
            </Flex>
          </Box>
        )}

        <Flex className="w-full justify-start items-center select-none">
          <Flex className="items-start mt-2">
            <MenuCardTypeMenu
              isCode={isCode}
              isLink={isLink}
              isPath={isPath}
              isText={isText}
              isImage={isImage}
              itemId={itemId}
              detectedLanguage={detectedLanguage}
            >
              <Box>
                <ToolTip text={clipType} isCompact side="bottom" asChild>
                  <Box tabIndex={0}>
                    <Button
                      variant="outline"
                      size="mini"
                      className="px-2 h-8 text-slate-500 border-0 dark:hover:bg-slate-800/80 bg-slate-200 dark:bg-slate-800 text-sm group hover:text-blue-500 dark:hover:!text-blue-600"
                    >
                      {isCode ? (
                        <>
                          <FileCode2 size={16} />
                          <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                            {t('Type:::Code', { ns: 'common' })}
                          </Text>
                          <ChevronDown size={12} className="ml-1" />
                        </>
                      ) : isImage ? (
                        <>
                          <Image size={16} />
                          <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                            {t('Type:::Image', { ns: 'common' })}
                          </Text>
                          <ChevronDown size={12} className="ml-1" />
                        </>
                      ) : isPath ? (
                        <>
                          <FileSymlink size={16} />
                          <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                            {t('Type:::Path', { ns: 'common' })}
                          </Text>
                          <ChevronDown size={12} className="ml-1" />
                        </>
                      ) : isLink ? (
                        <>
                          <ExternalLink size={16} />
                          <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                            {t('Type:::Link', { ns: 'common' })}
                          </Text>
                          <ChevronDown size={12} className="ml-1" />
                        </>
                      ) : (
                        <>
                          <FileText size={16} />
                          <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                            {t('Type:::Text', { ns: 'common' })}
                          </Text>
                          <ChevronDown size={12} className="ml-1" />
                        </>
                      )}
                    </Button>
                  </Box>
                </ToolTip>
              </Box>
            </MenuCardTypeMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Box tabIndex={0}>
                  <ToolTip
                    text={t('Menu Options', { ns: 'menus' })}
                    isCompact
                    side="bottom"
                    asChild
                  >
                    <Button
                      variant="outline"
                      size="mini"
                      className="ml-1 px-1 h-8 w-8 text-slate-500 border-0 hover:text-blue-500 dark:group-hover:!text-blue-400"
                    >
                      <Settings size={16} />
                    </Button>
                  </ToolTip>
                </Box>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="" sideOffset={12} align="center">
                <DropdownMenuItem
                  className="text-center items-center justify-center py-0.5"
                  disabled={true}
                >
                  <Text>{t('Menu Options', { ns: 'menus' })}</Text>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className={isMasked ? 'font-semibold' : ''}
                  onClick={e => {
                    e.preventDefault()
                    updateMenuItemById({
                      updatedItem: {
                        isMasked: !isMasked,
                        itemId,
                      },
                    })
                  }}
                >
                  {t('Type:::Secret', { ns: 'common' })}
                  {isMasked && (
                    <div className="ml-auto pl-2">
                      <Check size={15} className="fill-transparent" />
                    </div>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  className={isVideo ? 'font-semibold' : ''}
                  onClick={e => {
                    e.preventDefault()
                    updateMenuItemById({
                      updatedItem: {
                        isVideo: !isVideo,
                        itemId,
                      },
                    })
                  }}
                >
                  {t('Type:::Video', { ns: 'common' })}
                  {isVideo && (
                    <div className="ml-auto pl-2">
                      <Check size={15} className="fill-transparent" />
                    </div>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  className={hasEmoji ? 'font-semibold' : ''}
                  onClick={e => {
                    e.preventDefault()
                    updateMenuItemById({
                      updatedItem: {
                        hasEmoji: !hasEmoji,
                        itemId,
                      },
                    })
                  }}
                >
                  {t('Type:::Emoji', { ns: 'common' })}
                  {hasEmoji && (
                    <div className="ml-auto pl-2">
                      <Check size={15} className="fill-transparent" />
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <MenuDelete
                  itemId={itemId}
                  onComplete={onCancel}
                  deletingMenuItemIds={deletingMenuItemIds}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>

          <Flex className="items-end ml-auto mt-1">
            <ToolTip
              text={t('Cancel', { ns: 'common' })}
              isCompact
              side="bottom"
              sideOffset={10}
              asChild
            >
              <Box tabIndex={0}>
                <Button
                  variant="outline"
                  size="mini"
                  className="ml-1 px-1.5 h-8 text-gray-400 border-0"
                  onClick={() => {
                    onCancel()
                  }}
                >
                  <X size={18} />
                </Button>
              </Box>
            </ToolTip>

            <Popover defaultOpen={false} open={showSaveConfirmation.value}>
              <PopoverAnchor asChild>
                <Box tabIndex={0}>
                  <Button
                    variant="outline"
                    size="mini"
                    className="ml-1 px-1.5 h-8 text-blue-500 dark:!text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700 dark:hover:!text-blue-300 border-0"
                    onClick={() => {
                      saveEditValue()
                    }}
                  >
                    <Check size={18} className="mr-1" />
                    {t('Save', { ns: 'common' })}
                  </Button>
                </Box>
              </PopoverAnchor>
              <PopoverContent
                sideOffset={16}
                align="center"
                onEscapeKeyDown={() => {
                  showSaveConfirmation.value = false
                  isSaving.value = false
                }}
                onPointerDownOutside={() => {
                  showSaveConfirmation.value = false
                  isSaving.value = false
                }}
                className="p-1.5 bg-gray-100 border-gray-200 dark:bg-gray-900 dark:border-gray-950 w-60"
              >
                <Flex className="flex-col p-1.5 rounded-md">
                  <Text
                    color="black"
                    size="sm"
                    className="!inline-block text-center pointer-events-none !font-semibold drop-zone text-yellow-600"
                  >
                    {showLinkValidationError.value
                      ? 'Please verify your link for any errors, or confirm to save as is.'
                      : showPathValidationError.value
                        ? 'Please verify your path for any errors, or confirm to save as is.'
                        : showCommandTestRunError.value
                          ? 'Please verify your command for any errors, or confirm to save as is.'
                          : showCommandOutputTemplateError.value
                            ? 'Please verify your command output template for any errors, or confirm to save as is.'
                            : 'Are you sure you want to save this?'}
                  </Text>
                  <Spacer h={3} />
                  <Flex className="mb-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-500 dark:hover:text-gray-400 hover:text-gray-600 mr-3 border-gray-100 hover:border-gray-200 dark:bg-gray-900 dark:border-gray-900 dark:hover:border-gray-900 dark:hover:bg-gray-800"
                      onClick={() => {
                        showSaveConfirmation.value = false
                        isSaving.value = false
                      }}
                    >
                      {t('Cancel', { ns: 'common' })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-200 hover:bg-opacity-80 hover:bg-slate-200 text-slate-500 hover:text-slate-600 border-slate-200 whitespace-nowrap"
                      onClick={() => {
                        saveEditValue(true)
                      }}
                    >
                      {t('Save It!', { ns: 'common' })}
                    </Button>
                  </Flex>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>
      </Box>
    </CardContent>
  )
}
export function MenuEditName({
  isClip,
  itemId,
  isOpen,
  label,
}: {
  isClip: boolean | undefined
  itemId: UniqueIdentifier
  isOpen: boolean | undefined
  label: string | undefined
}) {
  const { t } = useTranslation()
  const renameError = useSignal(false)
  const renameEdit = useSignal('')

  const { updateMenuItemById } = useUpdateMenuItemById()
  const isNameEditing = useSignal(isMenuNameEditing.value)

  useEffect(() => {
    renameError.value = false
    renameEdit.value = label ?? ''
    isMenuNameEditing.value = isNameEditing.value
    if (isClip) {
      isNameEditing.value = false
    }
  }, [isNameEditing.value])

  return (
    <Flex className="justify-start w-full">
      {!isNameEditing.value ? (
        <>
          <Text
            className={`text-ellipsis !block overflow-hidden whitespace-nowrap ${
              !isClip
                ? 'border-dashed border-b border-slate-400 hover:border-gray-400'
                : ''
            }`}
            onClick={() => {
              isNameEditing.value = true
            }}
            color="black"
          >
            {label}
          </Text>
          {!isClip ? (
            <Box
              onClick={() => {
                isNameEditing.value = true
              }}
              className="ml-1 pr-0 pl-1 pt-[1px] text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100"
            >
              <ToolTip
                text={t('Rename', { ns: 'common' })}
                isCompact
                side="bottom"
                sideOffset={10}
                asChild
              >
                <Pencil size={14} />
              </ToolTip>
            </Box>
          ) : (
            <Box className="ml-1 pr-0 pl-1 pt-[1px] text-primary/50 cursor-pointer relative opacity-80 hover:opacity-100">
              <ToolTip
                text={t("Menu is a link to Clip. You can't edit the label directly", {
                  ns: 'menus',
                })}
                isCompact
                side="bottom"
                sideOffset={10}
                asChild
              >
                <Link size={14} />
              </ToolTip>
            </Box>
          )}
        </>
      ) : (
        <>
          <ToolTip
            open={renameError.value || showMenuNameNotSavedError.value}
            asChild
            text={
              showMenuNameNotSavedError.value
                ? t('Unsaved label', { ns: 'common' })
                : renameEdit.value.length <= MINIMAL_ITEM_NAME_LENGTH
                  ? t('Too short', { ns: 'common' })
                  : t('Too long', { ns: 'common' })
            }
            side="bottom"
            className="bg-rose-50 text-red-500 dark:bg-rose-900 dark:text-red-50 border-rose-100 dark:border-rose-950 text-base font-semibold border !px-2 !py-1.5"
          >
            <InputField
              small
              autoFocus={isMenuNameEditing.value}
              className="bg-white rounded-md text-sm font-semibold w-full"
              placeholder={t('Enter menu label', { ns: 'menus' })}
              onKeyDown={async e => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  isNameEditing.value = false
                } else if (
                  e.key === 'Enter' &&
                  (!renameEdit.value.length ||
                    renameEdit.value.length > MAX_MENU_LABEL_LENGTH)
                ) {
                  renameError.value = true
                } else if (e.key === 'Enter') {
                  await updateMenuItemById({
                    updatedItem: {
                      name: renameEdit.value,
                      itemId,
                    },
                  })
                  setTimeout(() => {
                    isNameEditing.value = false
                    if (!isOpen) {
                      resetMenuCreateOrEdit()
                    }
                  }, 200)
                }
              }}
              defaultValue={label}
              onFocus={e => {
                if (label?.startsWith('New ')) {
                  e.target.select()
                }
              }}
              onChange={e => {
                if (
                  renameError.value &&
                  e.target.value.length <= MAX_MENU_LABEL_LENGTH &&
                  renameError.value &&
                  e.target.value.length > 0
                ) {
                  renameError.value = false
                }
                renameEdit.value = e.target.value
              }}
            />
          </ToolTip>
          <Flex className="ml-1">
            <ToolTip
              text={t('Save', { ns: 'common' })}
              isCompact
              side="bottom"
              sideOffset={10}
              asChild
              isDisabled={showMenuNameNotSavedError.value}
            >
              <Box tabIndex={0}>
                <Button
                  variant="outline"
                  size="mini"
                  className="px-1.5 h-8 text-blue-500 dark:!text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700 dark:hover:!text-blue-300 border-0"
                  onClick={async () => {
                    if (showMenuNameNotSavedError.value) {
                      showMenuNameNotSavedError.value = false
                    }
                    if (
                      !renameEdit.value.length ||
                      renameEdit.value.length > MAX_MENU_LABEL_LENGTH
                    ) {
                      renameError.value = true
                      return
                    }

                    if (!renameError.value) {
                      await updateMenuItemById({
                        updatedItem: {
                          name: renameEdit.value,
                          itemId,
                        },
                      })
                      setTimeout(() => {
                        isNameEditing.value = false
                        if (!isOpen) {
                          resetMenuCreateOrEdit()
                        }
                      }, 200)
                    }
                  }}
                >
                  <Check size={18} />
                </Button>
              </Box>
            </ToolTip>
            <ToolTip
              text={t('Cancel', { ns: 'common' })}
              isCompact
              side="bottom"
              sideOffset={10}
              asChild
            >
              <Box tabIndex={0}>
                <Button
                  variant="outline"
                  size="mini"
                  className="ml-1 px-1.5 h-8 text-gray-400 border-0"
                  onClick={() => {
                    isNameEditing.value = false
                    if (!isOpen) {
                      resetMenuCreateOrEdit()
                    }
                  }}
                >
                  <X size={18} />
                </Button>
              </Box>
            </ToolTip>
          </Flex>
        </>
      )}
    </Flex>
  )
}
