import { useCallback, useEffect, useMemo, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { invoke } from '@tauri-apps/api'
import BlankIcon from '~/assets/icons/blank-square'
import HightlightIcon from '~/assets/icons/hightlight-square'
import MaskIcon from '~/assets/icons/mask-square'
import WebRequestIcon from '~/assets/icons/web-request'
import WebScraperIcon from '~/assets/icons/web-scraper'
import NoImage from '~/assets/images/no-image.png'
import { isEmailNotUrl } from '~/libs/utils'
import {
  forceSaveClipNameEditingError,
  forceSaveEditClipName,
  isClipNameEditing,
  showDeleteImageClipConfirmationId,
} from '~/store'
import clsx from 'clsx'
import DOMPurify from 'dompurify'
import linkifyIt from 'linkify-it'
import {
  AlertTriangle,
  Bold,
  Check,
  CheckSquare2,
  ChevronDown,
  ClipboardType,
  CreditCard,
  ExternalLink,
  FileCode2,
  FilePenLine,
  FileSymlink,
  FileText,
  Heading,
  Image,
  Italic,
  Keyboard,
  Pin,
  PinOff,
  PlayCircle,
  RefreshCcw,
  RemoveFormatting,
  Settings,
  Square,
  Star,
  StarOff,
  TerminalSquare,
  TextCursorInput,
  Trash,
  X,
  XCircle,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import ImageWithFallback from '~/components/atoms/image/image-with-fallback-on-error'
import LinkCard from '~/components/atoms/link-card/link-card'
import LinkCardTrackOnly from '~/components/atoms/link-card/link-card-track'
import Spacer from '~/components/atoms/spacer'
import ToolTip from '~/components/atoms/tooltip'
import CodeEditor from '~/components/code-editor'
import { CodeViewerMemo } from '~/components/code-viewer'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import TextArea, { TextAreaRef } from '~/components/molecules/textarea'
import { CardSocialEmbed } from '~/components/social-embend/CardSocialEmbed'
import {
  Box,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '~/components/ui'

import { invokeFetcher } from '~/hooks/queries/use-invoke'
import { useGetLinkMetadataByItemId, useUpdateItemById } from '~/hooks/queries/use-items'
import { useDebounce } from '~/hooks/use-debounce'
import { useSignal } from '~/hooks/use-signal'

import { CardContent } from './BaseCard'
import { ClipAddImage } from './ClipAddImage'
import { ClipAddPath } from './ClipAddPath'
import { ClipFormTemplateOptions, ClipWebRequestOptions } from './ClipCard'
import { ClipCardTypeMenu } from './ClipCardTypeMenu'
import { ClipDelete } from './ClipDelete'
import { ClipDropZone } from './ClipDropZone'
import {
  ClipEditForm,
  ClipFormAfterInputKeyPress,
  ClipFormKeyPressDisplayValueMap,
} from './ClipEditForm'
import { ClipEditTemplate } from './ClipEditTemplate'
import { ClipEditWebRequest } from './ClipEditWebRequest'
import { ClipEditWebScraping } from './ClipEditWebScraping'
import { ClipRemoveImage } from './ClipRemoveImage'

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ClipEditContent({
  clipId,
  isOver,
  value,
  isCode,
  isText,
  isTemplate,
  isForm,
  isImage,
  isDelete,
  isMasked,
  hasEmoji,
  isVideo,
  isCommand,
  isWebRequest,
  isWebScraping,
  isPath,
  isLink,
  isLargeView,
  imageDataUrl,
  isPinned,
  isFavorite,
  requestOptions,
  isShowLinkedClip,
  itemOptions,
  formTemplateOptions,
  isNewlyCreated,
  isDark,
  detectedLanguage,
  isHistoryDragActive,
  onCancel,
}: {
  clipId: UniqueIdentifier
  isHistoryDragActive: boolean | undefined
  isOver: boolean
  isCode?: boolean
  isImage?: boolean
  isText?: boolean
  isTemplate?: boolean
  isForm?: boolean
  isMasked?: boolean
  isVideo?: boolean
  hasEmoji?: boolean
  isCommand?: boolean
  isWebRequest?: boolean
  isWebScraping?: boolean
  itemOptions?: string | null
  requestOptions?: string | null
  formTemplateOptions?: string | null
  isPath?: boolean
  isPinned?: boolean
  isFavorite?: boolean
  isLargeView?: boolean
  isLink?: boolean
  isNewlyCreated?: boolean
  isShowLinkedClip?: boolean
  imageDataUrl?: string | null
  isDark: boolean
  detectedLanguage?: string | null
  isDelete: boolean | undefined
  value: string | undefined
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const scollToRef = useRef<HTMLDivElement>(null)
  const clipValue = useSignal('')
  const itemLocalOptions = useSignal<{
    noLinkCard?: boolean | undefined
    pressKeysAfterPaste?: string | undefined
    autoTrimSpaces?: boolean | undefined
  }>({
    autoTrimSpaces: true,
  })
  const webrequestLocalOptions = useSignal<ClipWebRequestOptions>({
    method: 'GET',
    headers: [],
    body: '',
    scrapingRules: [],
    scrapingOptions: {
      returnType: 'Text',
      returnSeparator: null,
      returnCount: null,
    },
    filters: [],
    auth: {},
  })
  const formTemplateLocalOptions = useSignal<ClipFormTemplateOptions>({
    templateOptions: [],
    formOptions: {
      fields: [],
    },
  })
  const commandTestOutput = useSignal('')
  const templateTestOutput = useSignal('')
  const templateTestOutputFormat = useSignal<'text' | 'html'>('text')
  const webrequestTestOutputObject = useSignal<{
    body?: string | null
    filteredBody?: string | null
    status?: number | null
    foundCount?: number | null
    hasFiltersError?: boolean | null
    contentType?: string | null
  }>({
    body: null,
    status: null,
    hasFiltersError: null,
    foundCount: null,
    filteredBody: null,
    contentType: null,
  })

  const { metadataLinkByItemId, invalidateLinkMetadataByItemId } =
    useGetLinkMetadataByItemId(isLink || isPath, clipId)

  const isTwitter =
    metadataLinkByItemId?.linkDomain === 'x.com' ||
    metadataLinkByItemId?.linkDomain === 'twitter.com'
  const isInstagram = metadataLinkByItemId?.linkDomain === 'www.instagram.com'

  const isSocialEmbed = isTwitter || isInstagram

  const hasLinkCard =
    (isLink &&
      Boolean(metadataLinkByItemId?.linkTitle && metadataLinkByItemId?.linkDomain)) ||
    (isPath && Boolean(metadataLinkByItemId?.linkIsTrack))

  const showSaveConfirmation = useSignal(false)
  const templateMissingFields = useSignal<string[]>([])
  const templateFoundFields = useSignal<string[]>([])
  const clipValueUpdated = useSignal(Date.now())
  const isSaving = useSignal(false)
  const showLinkValidationError = useSignal<boolean | undefined>(undefined)
  const showPathValidationError = useSignal<boolean | undefined>(undefined)
  const showCommandTestRunError = useSignal<boolean | undefined>(undefined)
  const showCommandOutputTemplateError = useSignal<boolean | undefined>(undefined)
  const { updateItemById } = useUpdateItemById()
  const textAreaRef = useRef<TextAreaRef>(null)
  const debouncedPathInput = useDebounce(clipValue.value, 300)
  const debouncedTemplateInput = useDebounce(clipValue.value, 600)
  const imageMaxHeight = isLargeView ? 'max-h-[600px]' : 'max-h-[300px]'
  const isBrokenImage = useSignal(false)

  useEffect(() => {
    if (itemOptions) {
      try {
        const options = JSON.parse(itemOptions)
        itemLocalOptions.value = {
          ...itemLocalOptions.value,
          ...options,
        }
      } catch (e) {
        console.log('error', e)
      }
    }
  }, [itemOptions])

  useEffect(() => {
    if (requestOptions) {
      try {
        const options = JSON.parse(requestOptions)
        webrequestLocalOptions.value = {
          ...webrequestLocalOptions.value,
          ...options,
        }
      } catch (e) {
        console.log('error', e)
      }
    }
  }, [requestOptions])

  useEffect(() => {
    if (formTemplateOptions) {
      try {
        const options = JSON.parse(formTemplateOptions)
        formTemplateLocalOptions.value = {
          ...formTemplateLocalOptions.value,
          ...options,
        }
      } catch (e) {
        console.log('error', e)
      }
    }
  }, [formTemplateOptions])

  useEffect(() => {
    clipValue.value = value ?? ''
  }, [value])

  const clipType = useMemo(
    () =>
      isCode
        ? t('Type:::Code Snippet', { ns: 'common' })
        : isImage
          ? t('Type:::Image', { ns: 'common' })
          : isCommand
            ? t('Type:::Shell Command', { ns: 'common' })
            : isWebRequest
              ? t('Type:::Web Request (HTTP)', { ns: 'common' })
              : isWebScraping
                ? t('Type:::Web Scraper / Parser', { ns: 'common' })
                : isLink
                  ? t('Type:::Link or Email', { ns: 'common' })
                  : isPath
                    ? t('Type:::File, Path or App', { ns: 'common' })
                    : isForm
                      ? t('Type:::Form Auto Fill', { ns: 'common' })
                      : isTemplate
                        ? t('Type:::Template Fill', { ns: 'common' })
                        : t('Type:::Plain Text', { ns: 'common' }),

    [
      isCode,
      isImage,
      isCommand,
      isWebRequest,
      isLink,
      isPath,
      isForm,
      isTemplate,
      isWebScraping,
    ]
  )

  const getLinkMetadata = async () => {
    await invokeFetcher('fetch_link_metadata', {
      url: ensureUrlPrefix(clipValue.value),
      itemId: clipId,
    })
    if (clipValue.value.endsWith('.mp3')) {
      await invokeFetcher('fetch_link_track_metadata', {
        itemId: clipId,
        url: ensureUrlPrefix(clipValue.value),
      })
    }
    invalidateLinkMetadataByItemId()
  }

  useEffect(() => {
    if (isLink) {
      const linkify = linkifyIt()
      const matches = linkify.match(clipValue.value)
      if (!matches || matches.length > 1) {
        showLinkValidationError.value = true
      } else {
        showLinkValidationError.value = false
        if (!hasLinkCard && !itemLocalOptions.value.noLinkCard) {
          getLinkMetadata()
        }
      }
    }
  }, [isLink])

  const validatePath = useCallback(
    async (path: string) => {
      const isInit = value === clipValue.value
      const pathToValidate = isInit ? value : path
      if (isPath && pathToValidate.length > 5) {
        invoke('check_path', { path: pathToValidate })
          .then(async () => {
            showPathValidationError.value = false
            invoke('fetch_path_metadata', {
              filePath: pathToValidate,
              itemId: clipId,
            })
              .then(() => {
                console.log('fetch metadata for path success')
                invalidateLinkMetadataByItemId()
              })
              .catch(e => {
                console.log('fetch metadata for path error', e)
              })
          })
          .catch(() => {
            showPathValidationError.value = true
          })
      }
    },
    [isPath]
  )

  const checkForTemplateFields = useCallback(
    (template: string) => {
      const regex = /{{[^{}]+}}/g
      templateMissingFields.value = []
      templateFoundFields.value = []
      const matches = template.match(regex)
      if (matches) {
        matches.forEach((match, index) => {
          matches[index] = match.replace(/[\n\r{}]+/g, '').trim()
          templateFoundFields.value.push(matches[index].toLocaleLowerCase())
          const field = formTemplateLocalOptions.value.templateOptions.find(
            f => f.label?.toLocaleLowerCase() === matches[index].toLocaleLowerCase()
          )
          if (!field) {
            if (matches[index].toLocaleLowerCase() === 'clipboard') {
              templateMissingFields.value.push('Clipboard')
            } else {
              templateMissingFields.value.push(matches[index])
            }
          } else {
            field.isFound = true
          }
        })
      }
      templateMissingFields.value = [...new Set(templateMissingFields.value)]
      if (!matches || matches.length === 0 || templateMissingFields.value.length > 0) {
        showCommandOutputTemplateError.value = true
      } else {
        showCommandOutputTemplateError.value = false
      }
    },
    [isTemplate, formTemplateLocalOptions.value.templateOptions]
  )

  useEffect(() => {
    if (isPath && debouncedPathInput.length > 5) {
      validatePath(debouncedPathInput)
    }
  }, [isPath, debouncedPathInput])

  useEffect(() => {
    if (isTemplate && debouncedTemplateInput.length > 5) {
      checkForTemplateFields(clipValue.value)
    }
  }, [debouncedTemplateInput])

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

  useEffect(() => {
    if (
      webrequestTestOutputObject.value.status &&
      webrequestTestOutputObject.value.status >= 400 &&
      isSaving.value
    ) {
      showSaveConfirmation.value = true
    }
  }, [webrequestTestOutputObject.value.status, isSaving.value])

  const saveEditValue = async (force = false) => {
    if (isClipNameEditing.value) {
      forceSaveEditClipName.value = true
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    if (forceSaveClipNameEditingError.value) {
      return
    }

    let pathType: string | null = null

    showSaveConfirmation.value = false
    isSaving.value = true
    showLinkValidationError.value = undefined
    showPathValidationError.value = undefined
    webrequestTestOutputObject.value = {}

    const saveValue = itemLocalOptions.value?.autoTrimSpaces === false ? clipValue.value : clipValue.value.trim()

    if (!force) {
      if (isTemplate) {
        checkForTemplateFields(clipValue.value)

        if (
          templateMissingFields.value.length > 0 ||
          templateFoundFields.value.length === 0
        ) {
          showCommandOutputTemplateError.value = true
          return
        } else {
          showCommandOutputTemplateError.value = false
        }
      }

      if (
        isForm &&
        formTemplateLocalOptions.value.formOptions?.openUrl &&
        !formTemplateLocalOptions.value.formOptions?.isOpenUrlDisabled
      ) {
        const linkify = linkifyIt()
        const matches = linkify.match(formTemplateLocalOptions.value.formOptions?.openUrl)
        if (!matches || matches.length > 1) {
          showLinkValidationError.value = true
          return
        }
      }
      if (isLink) {
        const linkify = linkifyIt()
        const matches = linkify.match(saveValue)
        if (!matches || matches.length > 1) {
          showLinkValidationError.value = true
          return
        }
      }

      if (isPath) {
        try {
          pathType = await invoke('path_type_check', { path: saveValue })
        } catch (e) {
          pathType = 'Error'
          showPathValidationError.value = true
          return
        }
      } else if (isCommand) {
        try {
          await invoke('run_shell_command', {
            execCmd: saveValue,
          })
          if (
            webrequestLocalOptions.value.outputTemplate?.id &&
            !webrequestLocalOptions.value.outputTemplate?.value?.includes('{{output}}')
          ) {
            showCommandOutputTemplateError.value = true
            return
          }
        } catch (e) {
          commandTestOutput.value = e as string
          showCommandTestRunError.value = true
          return
        }
      } else if (isWebRequest) {
        try {
          const res = (await invoke('run_web_request', {
            request: {
              url: saveValue,
              method: webrequestLocalOptions.value.method,
              headers: webrequestLocalOptions.value.headers,
              filters: webrequestLocalOptions.value.filters,
              body: webrequestLocalOptions.value.body,
              auth: webrequestLocalOptions.value.auth,
            },
          })) as {
            body: string | null
            status: number | null
            filteredBody?: string | null
            foundCount?: number | null
            hasFiltersError?: boolean | null
            contentType: string | null
          }

          webrequestTestOutputObject.value = {}

          if (res.status && res.status >= 400) {
            webrequestTestOutputObject.value = {
              body: res.body,
              filteredBody: res.filteredBody,
              hasFiltersError: res.hasFiltersError,
              status: res.status,
              contentType: res.contentType,
            }
            return
          }
        } catch (e) {
          webrequestTestOutputObject.value = {
            body: e as string,
            status: 500,
            contentType: null,
          }
          return
        }
      } else if (isWebScraping) {
        try {
          const res = (await invoke('run_web_scraping', {
            request: {
              url: saveValue,
              method: 'GET',
              scrapingRules: webrequestLocalOptions.value.scrapingRules,
              scrapingOptions: webrequestLocalOptions.value.scrapingOptions,
            },
          })) as {
            body: string | null
            status: number | null
            foundCount?: number | null
            scrappedBody?: string | null
            hasRulesError?: boolean | null
          }

          webrequestTestOutputObject.value = {}

          if (res.status && res.status >= 400) {
            webrequestTestOutputObject.value = {
              body: res.body,
              filteredBody: res.scrappedBody,
              hasFiltersError: res.hasRulesError,
              status: res.status,
            }
            return
          }
        } catch (e) {
          webrequestTestOutputObject.value = {
            body: e as string,
            status: 500,
            contentType: null,
          }
          return
        }
      }
    } else {
      pathType = isPath ? 'Error' : null
    }

    if (isForm || isTemplate) {
      if (isTemplate) {
        formTemplateLocalOptions.value.templateOptions.forEach(field => {
          field.defaultValue = field.value
        })
      }
      formTemplateOptions = JSON.stringify(formTemplateLocalOptions.value)
      await updateItemById({
        updatedItem: {
          formTemplateOptions,
          isForm: Boolean(isForm),
          isTemplate: Boolean(isTemplate),
          itemId: clipId,
        },
      })
    }

    if (isWebRequest || isWebScraping || isCommand) {
      requestOptions = JSON.stringify(webrequestLocalOptions.value)
      await updateItemById({
        updatedItem: {
          requestOptions,
          itemId: clipId,
        },
      })
    }

    if (Object.keys(itemLocalOptions.value).length > 0) {
      itemOptions = JSON.stringify(itemLocalOptions.value)
    }

    await updateItemById({
      updatedItem: {
        value: saveValue,
        itemOptions,
        ...(isCommand ? { isCommand: true } : {}),
        ...(isWebRequest ? { isWebRequest: true } : {}),
        ...(isWebScraping ? { isWebScraping: true } : {}),
        ...(pathType && isPath ? { pathType } : {}),
        itemId: clipId,
      },
    })

    setTimeout(() => {
      isSaving.value = false
      onCancel()
    }, 200)
  }

  useEffect(() => {
    if (isShowLinkedClip) {
      scollToRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, [isShowLinkedClip, scollToRef?.current])

  return (
    <CardContent
      className={clsx(
        'px-2 pr-1.5 py-2 m-0.5 mt-0 pt-0 mx-1 text-left flex flex-row rounded-md select-auto',
        isDelete && 'bg-red-50 dark:bg-red-900'
      )}
    >
      <Box className="w-full mt-0" ref={scollToRef}>
        {!isHistoryDragActive || (isImage && imageDataUrl) ? (
          !(
            isCode ||
            Boolean(detectedLanguage) ||
            isImage ||
            isCommand ||
            isLink ||
            isWebRequest ||
            isTemplate ||
            isWebScraping ||
            isForm ||
            isPath
          ) ? (
            <>
              <Box
                className={'text-slate-400 flex gap-1.5 px-0.5 p-1.5 pt-0.5 items-center'}
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
                <ToolTip
                  isCompact
                  text={t('Toolbar:::Header Formatting', { ns: 'common' })}
                >
                  <Heading
                    size={17}
                    className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                    onClick={() => {
                      textAreaRef?.current?.handleAddBBcode('h')
                    }}
                  />
                </ToolTip>
                <ToolTip
                  isCompact
                  text={t('Toolbar:::Bold Formatting', { ns: 'common' })}
                >
                  <Bold
                    size={17}
                    className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                    onClick={() => {
                      textAreaRef?.current?.handleAddBBcode('b')
                    }}
                  />
                </ToolTip>
                <ToolTip
                  isCompact
                  text={t('Toolbar:::Italic Formatting', { ns: 'common' })}
                >
                  <Italic
                    size={17}
                    className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                    onClick={() => {
                      textAreaRef?.current?.handleAddBBcode('i')
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
                placeholder={t('Enter value or drag from history', { ns: 'dashboard' })}
                rows={2}
                autoFocus={isNewlyCreated}
                autoCorrect="off"
                spellCheck={false}
                enableEmojiInside={true}
                label=""
                maxRows={isLargeView ? 12 : 6}
                value={clipValue.value}
                onKeyDown={e => {
                  e.stopPropagation()
                }}
                onChange={e => {
                  clipValue.value = e.target.value
                }}
              />
            </>
          ) : isPath ? (
            <>
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
                          className="bg-yellow-50 text-yellow-600 font-semibold"
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
                            className="bg-green-50 text-green-600 font-semibold"
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
              {hasLinkCard && (
                <Box className="self-start mt-2 mb-0 text-xs w-full select-none overflow-hidden">
                  <LinkCardTrackOnly
                    trackTitle={metadataLinkByItemId?.linkTrackTitle}
                    trackArtist={metadataLinkByItemId?.linkTrackArtist}
                    trackAlbum={metadataLinkByItemId?.linkTrackAlbum}
                  />
                </Box>
              )}
            </>
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
              {isSocialEmbed ? (
                <Box className="self-start mt-2 mb-0 text-xs w-full select-none overflow-hidden">
                  <CardSocialEmbed
                    url={clipValue.value?.trim()}
                    isTwitter={isTwitter}
                    isInstagram={isInstagram}
                    id={clipId}
                  />
                </Box>
              ) : (
                hasLinkCard && (
                  <Box className="self-start mt-2 mb-0 text-xs w-full select-none overflow-hidden">
                    <LinkCard
                      isDisabled={
                        ensureUrlPrefix(clipValue.value?.trim()) !==
                        metadataLinkByItemId?.linkUrl?.trim()
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
                      domain={metadataLinkByItemId?.linkDomain}
                    />
                  </Box>
                )
              )}
              {!isImage ? (
                <Flex className="w-full mt-1 justify-start select-none">
                  {isEmailNotUrl(clipValue.value) ||
                  showLinkValidationError.value ||
                  clipValue.value.length < 3 ? (
                    !isEmailNotUrl(clipValue.value) && (
                      <Button disabled={true} variant="ghost" className="!px-1 !m-0 !h-4">
                        {hasLinkCard ? (
                          <Text
                            className="!text-blue-500 dark:!text-blue-400 hover:underline"
                            size="xs"
                          >
                            <RefreshCcw size={13} className="mr-1" />!
                            {t('Update Link Card', { ns: 'dashboard' })}!
                          </Text>
                        ) : (
                          <Text
                            className="!text-blue-500 dark:!text-blue-400 hover:underline"
                            size="xs"
                          >
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
                        getLinkMetadata()
                        if (itemLocalOptions.value.noLinkCard) {
                          itemLocalOptions.value.noLinkCard = false
                        }
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
                          itemId: clipId,
                        })
                        itemLocalOptions.value.noLinkCard = true
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
              ) : (
                !isEmailNotUrl(clipValue.value) &&
                !showLinkValidationError.value && (
                  <Box className="flex px-0 pt-1.5 pb-0.5 items-center justify-center">
                    <ImageWithFallback
                      src={ensureUrlPrefix(clipValue.value)}
                      hasError={isBrokenImage.value}
                      onErrorCallback={() => {
                        isBrokenImage.value = true
                      }}
                      draggable={false}
                      decoding="async"
                      className={`${imageMaxHeight} min-h-10`}
                    />
                  </Box>
                )
              )}
            </Flex>
          ) : isCode ? (
            <CodeEditor
              key="code-editor"
              value={clipValue.value}
              height={isLargeView ? 'calc(100vh - 280px)' : '200px'}
              isDark={isDark}
              options={{
                mode: detectedLanguage ?? 'javascript',
              }}
              onChange={e => {
                clipValue.value = e.getValue()
              }}
            />
          ) : isImage ? (
            <Box className="px-0 py-1.5 flex items-center justify-center relative">
              <img
                src={imageDataUrl ? imageDataUrl : NoImage}
                draggable={false}
                decoding="async"
                height="auto"
                className={`${
                  showDeleteImageClipConfirmationId.value === clipId
                    ? '!border-red-400 opacity-70'
                    : ''
                } max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-400`}
              />
              <Box className="absolute">
                {imageDataUrl ? (
                  <ClipRemoveImage id={clipId} />
                ) : (
                  <ClipAddImage id={clipId} />
                )}
              </Box>
            </Box>
          ) : isCommand ? (
            <Box className="mt-0.5">
              <CodeEditor
                key="code-editor"
                value={clipValue.value}
                height={isLargeView ? '260px' : '70px'}
                isDark={isDark}
                isCmd={true}
                lineWrapping={true}
                options={{
                  mode: 'shell',
                }}
                onChange={e => {
                  clipValue.value = e.getValue()
                  commandTestOutput.value = ''
                  showCommandTestRunError.value = undefined
                }}
              />
              {!webrequestLocalOptions.value.outputRegexFilter?.id ? (
                <Flex className="gap-4 w-full justify-start mt-2 mb-1">
                  <Text
                    className="!text-blue-500 dark:!text-blue-400 hover:underline cursor-pointer"
                    size="xs"
                    onClick={() => {
                      if (!webrequestLocalOptions.value.outputRegexFilter) {
                        webrequestLocalOptions.value.outputRegexFilter = {}
                      }

                      webrequestLocalOptions.value = {
                        ...webrequestLocalOptions.value,
                        outputRegexFilter: {
                          id:
                            webrequestLocalOptions.value.outputRegexFilter.id ??
                            Date.now().toString(),
                          value:
                            webrequestLocalOptions.value.outputRegexFilter.value ?? '',
                          isEnable:
                            webrequestLocalOptions.value.outputRegexFilter.isEnable ??
                            true,
                        },
                      }
                    }}
                  >
                    {t('Add Regex Match Group Filter', { ns: 'dashboard' })}
                  </Text>
                </Flex>
              ) : (
                <Box className="mt-2">
                  <Flex className="gap-1 w-full justify-start">
                    <Text className="font-semibold" size={'sm'}>
                      {t('Regex Match Group Filter', { ns: 'dashboard' })}
                    </Text>
                  </Flex>

                  <Flex className={`gap-2 mb-2`}>
                    <InputField
                      small
                      defaultValue={webrequestLocalOptions.value.outputRegexFilter?.value}
                      disabled={
                        webrequestLocalOptions.value.outputRegexFilter?.isEnable === false
                      }
                      onChange={e => {
                        if (!webrequestLocalOptions.value.outputRegexFilter) {
                          webrequestLocalOptions.value.outputRegexFilter = {}
                        }

                        webrequestLocalOptions.value.outputRegexFilter.value =
                          e.target.value.trim()
                      }}
                      className={`${
                        webrequestLocalOptions.value.outputRegexFilter?.isEnable === false
                          ? 'bg-gray-100 opacity-50'
                          : ''
                      }`}
                      placeholder={t('Enter regex for output filer', {
                        ns: 'dashboard',
                      })}
                      classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                      required
                    />
                    <Button
                      size="mini"
                      title={t('Enable / Disable', { ns: 'dashboard' })}
                      variant="ghost"
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          outputRegexFilter: {
                            ...webrequestLocalOptions.value.outputRegexFilter,
                            isEnable:
                              !webrequestLocalOptions.value.outputRegexFilter?.isEnable,
                          },
                        }
                      }}
                    >
                      {webrequestLocalOptions.value.outputRegexFilter?.isEnable ? (
                        <CheckSquare2 size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </Button>
                    <Button
                      size="mini"
                      title={t('Remove', { ns: 'common' })}
                      variant="ghost"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          outputRegexFilter: {},
                        }
                      }}
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
                    >
                      <Trash size={14} />
                    </Button>
                  </Flex>
                </Box>
              )}
              {!webrequestLocalOptions.value.outputTemplate?.id ? (
                <Flex className="gap-4 w-full justify-start mt-2 mb-1">
                  <Text
                    className="!text-blue-500 dark:!text-blue-400 hover:underline cursor-pointer"
                    size="xs"
                    onClick={() => {
                      if (!webrequestLocalOptions.value.outputTemplate) {
                        webrequestLocalOptions.value.outputTemplate = {}
                      }

                      webrequestLocalOptions.value = {
                        ...webrequestLocalOptions.value,
                        outputTemplate: {
                          id:
                            webrequestLocalOptions.value.outputTemplate.id ??
                            Date.now().toString(),
                          value: webrequestLocalOptions.value.outputTemplate.value ?? '',
                          isEnable:
                            webrequestLocalOptions.value.outputTemplate.isEnable ?? true,
                        },
                      }
                    }}
                  >
                    {t('Add Output Template', { ns: 'dashboard' })}
                  </Text>
                </Flex>
              ) : (
                <Box className="mt-2">
                  <Flex className="gap-1 w-full justify-start">
                    <Text className="font-semibold" size={'sm'}>
                      {t('Output Template', { ns: 'dashboard' })}
                    </Text>
                  </Flex>

                  {showCommandOutputTemplateError.value && (
                    <Text className="!text-yellow-600 text-xs mt-2">
                      <Trans
                        i18nKey="Template should have⠀<b>{{output}}</b>⠀placeholder."
                        ns="dashboard"
                      />
                    </Text>
                  )}

                  <Flex className={`gap-2 mb-2`}>
                    <InputField
                      small
                      defaultValue={webrequestLocalOptions.value.outputTemplate?.value}
                      disabled={
                        webrequestLocalOptions.value.outputTemplate?.isEnable === false
                      }
                      onChange={e => {
                        if (!webrequestLocalOptions.value.outputTemplate) {
                          webrequestLocalOptions.value.outputTemplate = {}
                        }

                        webrequestLocalOptions.value.outputTemplate.value =
                          e.target.value.trim()
                      }}
                      className={`${
                        webrequestLocalOptions.value.outputTemplate?.isEnable === false
                          ? 'bg-gray-100 opacity-50'
                          : ''
                      }`}
                      placeholder={t('Wrap output using {{output}} placeholder', {
                        ns: 'dashboard',
                      })}
                      classNameInput="text-sm border-0 border-b border-gray-200 rounded-none pl-1.5"
                      required
                    />
                    <Button
                      size="mini"
                      title={t('Enable / Disable', { ns: 'dashboard' })}
                      variant="ghost"
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-blue-400 text-slate-600 hover:text-blue-500"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          outputTemplate: {
                            ...webrequestLocalOptions.value.outputTemplate,
                            isEnable:
                              !webrequestLocalOptions.value.outputTemplate?.isEnable,
                          },
                        }
                      }}
                    >
                      {webrequestLocalOptions.value.outputTemplate?.isEnable ? (
                        <CheckSquare2 size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </Button>
                    <Button
                      size="mini"
                      title={t('Remove', { ns: 'common' })}
                      variant="ghost"
                      onClick={() => {
                        webrequestLocalOptions.value = {
                          ...webrequestLocalOptions.value,
                          outputTemplate: {},
                        }
                      }}
                      className="text-sm font-semibold w-6 h-6 hover:bg-transparent dark:text-slate-400 dark:hover:text-red-500 text-slate-600 hover:text-red-500"
                    >
                      <Trash size={14} />
                    </Button>
                  </Flex>
                </Box>
              )}
              {commandTestOutput.value && (
                <Box
                  className={`${
                    showCommandTestRunError.value
                      ? 'bg-red-50 dark:bg-red-950'
                      : 'bg-green-50 dark:bg-green-950'
                  } ${isLargeView ? 'py-1' : 'py-0'} rounded-md px-3 relative`}
                >
                  <CodeViewerMemo
                    isDark={isDark}
                    maxHeight={!isLargeView ? 100 : 150}
                    isLargeView={false}
                    isShowMore={true}
                    isWrapped={true}
                    value={commandTestOutput.value}
                    language="shell"
                  />
                  <Box
                    className={`${
                      showCommandTestRunError.value
                        ? 'bg-red-300 dark:bg-red-800'
                        : 'bg-green-300 dark:bg-green-800'
                    } text-xs rounded-sm px-1.5 absolute right-2 bottom-2 select-none`}
                  >
                    {showCommandTestRunError.value
                      ? t('Command:::error', { ns: 'dashboard' })
                      : t('Command:::output', { ns: 'dashboard' })}
                  </Box>
                </Box>
              )}
            </Box>
          ) : isWebRequest ? (
            <ClipEditWebRequest
              isLargeView={isLargeView}
              clipId={clipId}
              clipValue={clipValue}
              webrequestTestOutputObject={webrequestTestOutputObject}
              webrequestLocalOptions={webrequestLocalOptions}
              showLinkValidationError={showLinkValidationError}
              isDark={isDark}
              requestOptions={requestOptions}
            />
          ) : isWebScraping ? (
            <ClipEditWebScraping
              isLargeView={isLargeView}
              clipValue={clipValue}
              testOutputObject={webrequestTestOutputObject}
              localOptions={webrequestLocalOptions}
              showLinkValidationError={showLinkValidationError}
              isDark={isDark}
              requestOptions={requestOptions}
            />
          ) : isTemplate ? (
            <Box>
              <ClipEditTemplate
                clipValue={clipValue}
                isLargeView={isLargeView}
                checkForTemplateFieldsCallback={() => {
                  checkForTemplateFields(clipValue.value)
                }}
                templateMissingFields={templateMissingFields}
                templateFoundFields={templateFoundFields}
                localOptions={formTemplateLocalOptions}
              />
              {templateTestOutput.value && (
                <Box className="bg-sky-50/70 dark:bg-sky-950/70 relative mt-2 rounded-md text-sm">
                  <SimpleBar
                    className="code-filter"
                    style={{ height: 'auto', maxHeight: '260px' }}
                    autoHide={false}
                  >
                    <Box className="text-sm py-1 px-3 whitespace-pre-wrap pb-8">
                      <div
                        {...(templateTestOutputFormat.value === 'html' && {
                          dangerouslySetInnerHTML: {
                            __html: DOMPurify.sanitize(templateTestOutput.value),
                          },
                        })}
                        className="font-normal"
                      />
                      {templateTestOutputFormat.value === 'text' &&
                        templateTestOutput.value}
                    </Box>
                  </SimpleBar>
                  <X
                    size={16}
                    className="absolute right-2 top-2 cursor-pointer opacity-30 hover:opacity-100"
                    onClick={() => {
                      templateTestOutput.value = ''
                    }}
                  />
                  <Box
                    className={`bg-slate-300 dark:bg-slate-900 text-xs rounded-sm px-1.5 absolute left-2 bottom-2 select-none`}
                  >
                    {t('filled template', { ns: 'dashboard' })}
                  </Box>
                  <Tabs
                    className="flex flex-row absolute bottom-2 right-3 z-10 select-none"
                    value={templateTestOutputFormat.value}
                    onValueChange={(val: string) => {
                      templateTestOutputFormat.value = val === 'html' ? 'html' : 'text'
                    }}
                  >
                    <TabsList className="self-center px-1 py-1 opacity-60 hover:opacity-100 animate-in fade-in bg-slate-200 dark:bg-slate-900">
                      <TabsTrigger
                        value="text"
                        className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                      >
                        {t('Text', { ns: 'dashboard' })}
                      </TabsTrigger>
                      <TabsTrigger
                        value="html"
                        className="!text-xs py-0.5 data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-200 text-slate-400 dark:text-slate-500 hover:text-blue-400 dark:hover:text-slate-200 data-[state=active]:hover:text-slate-500"
                      >
                        {t('HTML', { ns: 'dashboard' })}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Box>
              )}
            </Box>
          ) : (
            isForm && (
              <ClipEditForm
                isLargeView={isLargeView}
                showLinkValidationError={showLinkValidationError}
                localOptions={formTemplateLocalOptions}
              />
            )
          )
        ) : (
          <ClipDropZone isOver={isOver} />
        )}
        <SimpleBar
          style={{ minWidth: '100%' }}
          forceVisible={true}
          className="dashboard-tabs"
        >
          <Flex className="w-full justify-start items-center select-none">
            <Flex className="items-start mt-2">
              <ClipCardTypeMenu
                isCode={isCode}
                isCommand={isCommand}
                isWebRequest={isWebRequest}
                isWebScraping={isWebScraping}
                isLink={isLink}
                isPath={isPath}
                isText={isText}
                isTemplate={isTemplate}
                isForm={isForm}
                isImage={isImage}
                itemId={clipId}
                detectedLanguage={detectedLanguage}
              >
                <Box>
                  <ToolTip text={clipType} isCompact side="bottom" asChild>
                    <Box tabIndex={0}>
                      <Button
                        variant="outline"
                        size="mini"
                        className="px-2 h-8 text-slate-500 border-0 dark:hover:bg-slate-900/70 bg-slate-200 dark:bg-slate-800 text-sm group hover:text-blue-500 dark:hover:!text-blue-600"
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
                        ) : isWebRequest ? (
                          <>
                            <WebRequestIcon width={16} height={16} />
                            <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                              {t('Type:::Request', { ns: 'common' })}
                            </Text>
                            <ChevronDown size={12} className="ml-1" />
                          </>
                        ) : isWebScraping ? (
                          <>
                            <WebScraperIcon width={16} height={16} />
                            <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                              {t('Type:::Scraper', { ns: 'common' })}
                            </Text>
                            <ChevronDown size={12} className="ml-1" />
                          </>
                        ) : isCommand ? (
                          <>
                            <TerminalSquare size={16} />
                            <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                              {t('Type:::Command', { ns: 'common' })}
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
                        ) : isForm ? (
                          <>
                            <TextCursorInput size={16} />
                            <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                              {t('Type:::AutoFill', { ns: 'common' })}
                            </Text>
                            <ChevronDown size={12} className="ml-1" />
                          </>
                        ) : isTemplate ? (
                          <>
                            <FilePenLine size={16} />
                            <Text className="ml-1.5 group-hover:!text-blue-500 dark:group-hover:!text-blue-400">
                              {t('Type:::Template', { ns: 'common' })}
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
              </ClipCardTypeMenu>
              {isCommand ? (
                <ToolTip
                  text={t('Test Run', { ns: 'dashboard' })}
                  isCompact
                  side="bottom"
                  asChild
                >
                  <Box tabIndex={0}>
                    <Button
                      variant="outline"
                      size="mini"
                      className="ml-2 px-1.5 h-8 w-8 text-gray-400 border-0 group"
                      onClick={async () => {
                        try {
                          commandTestOutput.value = await invoke('run_shell_command', {
                            execCmd: clipValue.value,
                            outputTemplate: webrequestLocalOptions.value.outputTemplate
                              ?.id
                              ? webrequestLocalOptions.value.outputTemplate
                              : null,
                            outputRegexFilter: webrequestLocalOptions.value
                              .outputRegexFilter?.id
                              ? webrequestLocalOptions.value.outputRegexFilter
                              : null,
                          })
                          showCommandTestRunError.value = false
                          showCommandOutputTemplateError.value = Boolean(
                            webrequestLocalOptions.value.outputTemplate?.id &&
                              !webrequestLocalOptions.value.outputTemplate?.value?.includes(
                                '{{output}}'
                              )
                          )
                        } catch (e) {
                          commandTestOutput.value = e as string
                          showCommandTestRunError.value = true
                        }
                      }}
                    >
                      <Flex className="font-medium text-sm gap-1">
                        <PlayCircle size={16} className="text-gray-500" />
                      </Flex>
                    </Button>
                  </Box>
                </ToolTip>
              ) : isWebRequest ? (
                <ToolTip
                  text={t('Test Request', { ns: 'dashboard' })}
                  isCompact
                  side="bottom"
                  asChild
                >
                  <Box tabIndex={0}>
                    <Button
                      variant="outline"
                      size="mini"
                      className="ml-2 px-1.5 h-8 w-8 text-gray-400 border-0 group"
                      onClick={async () => {
                        webrequestTestOutputObject.value = {}
                        try {
                          webrequestTestOutputObject.value = await invoke(
                            'run_web_request',
                            {
                              request: {
                                url: clipValue.value,
                                method: webrequestLocalOptions.value.method,
                                headers: webrequestLocalOptions.value.headers,
                                filters: webrequestLocalOptions.value.filters,
                                body: webrequestLocalOptions.value.body,
                                auth: webrequestLocalOptions.value.auth,
                              },
                            }
                          )
                        } catch (e) {
                          webrequestTestOutputObject.value = {
                            body: e as string,
                            status: 500,
                            contentType: null,
                          }
                        }
                      }}
                    >
                      <Flex className="font-medium text-sm gap-1">
                        <PlayCircle size={16} className="text-gray-500" />
                      </Flex>
                    </Button>
                  </Box>
                </ToolTip>
              ) : isForm ? (
                <ToolTip
                  text={t('Test Run', { ns: 'dashboard' })}
                  isCompact
                  side="bottom"
                  asChild
                >
                  <Box tabIndex={0}>
                    <Button
                      variant="outline"
                      size="mini"
                      className="ml-2 px-1.5 h-8 w-8 text-gray-400 border-0 group"
                      onClick={async () => {
                        await invoke('run_form_fill', {
                          formOptions: formTemplateLocalOptions.value.formOptions,
                          firstDelay: 1,
                        })
                      }}
                    >
                      <Flex className="font-medium text-sm gap-1">
                        <PlayCircle size={16} className="text-gray-500" />
                      </Flex>
                    </Button>
                  </Box>
                </ToolTip>
              ) : isTemplate ? (
                <ToolTip
                  text={t('Test Run', { ns: 'dashboard' })}
                  isCompact
                  side="bottom"
                  asChild
                >
                  <Box tabIndex={0}>
                    <Button
                      variant="outline"
                      size="mini"
                      className="ml-2 px-1.5 h-8 w-8 text-gray-400 border-0 group"
                      onClick={async () => {
                        try {
                          templateTestOutput.value = await invoke('run_template_fill', {
                            templateValue: clipValue.value,
                            templateOptions:
                              formTemplateLocalOptions.value.templateOptions,
                            isPreview: true,
                          })
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      <Flex className="font-medium text-sm gap-1">
                        <PlayCircle size={16} className="text-gray-500" />
                      </Flex>
                    </Button>
                  </Box>
                </ToolTip>
              ) : (
                isWebScraping && (
                  <ToolTip
                    text={t('Test Run', { ns: 'dashboard' })}
                    isCompact
                    side="bottom"
                    asChild
                  >
                    <Box tabIndex={0}>
                      <Button
                        variant="outline"
                        size="mini"
                        className="ml-2 px-1.5 h-8 w-8 text-gray-400 border-0 group"
                        onClick={async () => {
                          webrequestTestOutputObject.value = {}
                          try {
                            webrequestTestOutputObject.value = await invoke(
                              'run_web_scraping',
                              {
                                request: {
                                  url: clipValue.value,
                                  method: 'GET',
                                  scrapingRules:
                                    webrequestLocalOptions.value.scrapingRules,
                                  scrapingOptions:
                                    webrequestLocalOptions.value.scrapingOptions,
                                },
                              }
                            )
                          } catch (e) {
                            webrequestTestOutputObject.value = {
                              body: e as string,
                              status: 500,
                              contentType: null,
                            }
                          }
                        }}
                      >
                        <Flex className="font-medium text-sm gap-1">
                          <PlayCircle size={16} className="text-gray-500" />
                        </Flex>
                      </Button>
                    </Box>
                  </ToolTip>
                )
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Box tabIndex={0}>
                    <ToolTip
                      text={t('Clip Options', { ns: 'dashboard' })}
                      isCompact
                      side="bottom"
                      asChild
                    >
                      <Button
                        variant="outline"
                        size="mini"
                        className="ml-1 px-1 h-8 w-8 text-slate-500 border-0 hover:text-blue-500"
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
                    <Text>{t('Clip Options', { ns: 'dashboard' })}</Text>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {!isPinned ? (
                    <DropdownMenuItem
                      onClick={() => {
                        updateItemById({
                          updatedItem: {
                            isPinned: true,
                            itemId: clipId,
                          },
                        })
                      }}
                    >
                      {t('Pin', { ns: 'contextMenus' })}
                      <div className="ml-auto">
                        <Pin size={15} />
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => {
                        updateItemById({
                          updatedItem: {
                            isPinned: false,
                            itemId: clipId,
                          },
                        })
                      }}
                    >
                      {t('UnPin Clip', { ns: 'contextMenus' })}
                      <div className="ml-auto">
                        <PinOff size={15} />
                      </div>
                    </DropdownMenuItem>
                  )}

                  {!isFavorite ? (
                    <DropdownMenuItem
                      onClick={() => {
                        updateItemById({
                          updatedItem: {
                            isFavorite: true,
                            itemId: clipId,
                          },
                        })
                      }}
                    >
                      {t('Star', { ns: 'contextMenus' })}
                      <div className="ml-auto pl-2">
                        <Star size={15} className="fill-transparent" />
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => {
                        updateItemById({
                          updatedItem: {
                            isFavorite: false,
                            itemId: clipId,
                          },
                        })
                      }}
                    >
                      {t('Remove Star', { ns: 'contextMenus' })}
                      <div className="ml-auto pl-2">
                        <StarOff size={15} className="fill-transparent" />
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={isMasked ? 'font-semibold' : ''}
                    onClick={e => {
                      e.preventDefault()
                      updateItemById({
                        updatedItem: {
                          isMasked: !isMasked,
                          itemId: clipId,
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
                      updateItemById({
                        updatedItem: {
                          isVideo: !isVideo,
                          itemId: clipId,
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
                      updateItemById({
                        updatedItem: {
                          hasEmoji: !hasEmoji,
                          itemId: clipId,
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

                  <DropdownMenuItem
                    className={itemLocalOptions.value.autoTrimSpaces ? 'font-semibold' : ''}
                    onClick={e => {
                      e.preventDefault()
                      itemLocalOptions.value = {
                        ...itemLocalOptions.value,
                        autoTrimSpaces: !itemLocalOptions.value.autoTrimSpaces,
                      }
                    }}
                  >
                    {t('Type:::Trim', { ns: 'common' })}
                    {itemLocalOptions.value.autoTrimSpaces && (
                      <div className="ml-auto pl-2">
                        <Check size={15} className="fill-transparent" />
                      </div>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ClipDelete clipId={clipId} onComplete={onCancel} />
                </DropdownMenuContent>
              </DropdownMenu>
              {!isCommand &&
                !isTemplate &&
                !isForm &&
                !isWebRequest &&
                !isWebScraping && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Box tabIndex={0}>
                        <ToolTip
                          text={
                            itemLocalOptions.value.pressKeysAfterPaste
                              ? t('Key Press After Paste: {{keyPress}}', {
                                  ns: 'dashboard',
                                  keyPress: itemLocalOptions.value.pressKeysAfterPaste,
                                })
                              : t('Add Key Press After Paste', {
                                  ns: 'dashboard',
                                })
                          }
                          isCompact
                          side="bottom"
                          asChild
                        >
                          <Button
                            variant="outline"
                            size="mini"
                            className={`ml-1 px-1 h-8 w-8 ${
                              itemLocalOptions.value.pressKeysAfterPaste
                                ? 'text-green-500 dark:text-green-600'
                                : 'text-slate-500'
                            } border-0 hover:text-blue-500`}
                          >
                            <Keyboard size={16} />
                          </Button>
                        </ToolTip>
                      </Box>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={12} align="center">
                      <DropdownMenuItem
                        className="text-center items-center justify-center py-0.5"
                        disabled={true}
                      >
                        <Text>{t('Key Press After Paste', { ns: 'dashboard' })}</Text>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={!itemLocalOptions.value.pressKeysAfterPaste}
                        onCheckedChange={() => {
                          itemLocalOptions.value.pressKeysAfterPaste = undefined
                        }}
                        className={
                          !itemLocalOptions.value.pressKeysAfterPaste
                            ? 'font-semibold'
                            : ''
                        }
                      >
                        {t('No Key Press', { ns: 'common' })}
                      </DropdownMenuCheckboxItem>
                      {ClipFormAfterInputKeyPress.map(type => {
                        return (
                          <DropdownMenuCheckboxItem
                            checked={itemLocalOptions.value.pressKeysAfterPaste === type}
                            onCheckedChange={
                              itemLocalOptions.value.pressKeysAfterPaste === type
                                ? undefined
                                : () => {
                                    itemLocalOptions.value.pressKeysAfterPaste = type
                                  }
                            }
                            key={type}
                            className={
                              itemLocalOptions.value.pressKeysAfterPaste === type
                                ? 'font-semibold'
                                : ''
                            }
                          >
                            {ClipFormKeyPressDisplayValueMap[type]}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
                        ? t(
                            'Errors:::Please verify your link for any errors, or confirm to save as is.',
                            { ns: 'dashboard' }
                          )
                        : showPathValidationError.value
                          ? t(
                              'Errors:::Please verify your path for any errors, or confirm to save as is.',
                              { ns: 'dashboard' }
                            )
                          : showCommandTestRunError.value
                            ? t(
                                'Errors:::Your command runs with errors, confirm you want to save as is.',
                                { ns: 'dashboard' }
                              )
                            : webrequestTestOutputObject.value.status &&
                                !webrequestTestOutputObject.value.hasFiltersError &&
                                webrequestTestOutputObject.value.status >= 400
                              ? t(
                                  'Errors:::Your request runs with errors, confirm you want to save as is.',
                                  { ns: 'dashboard' }
                                )
                              : webrequestTestOutputObject.value.status &&
                                  webrequestTestOutputObject.value.hasFiltersError &&
                                  webrequestTestOutputObject.value.status >= 400
                                ? t(
                                    'Errors:::Your request has filters error, confirm you want to save as is.',
                                    { ns: 'dashboard' }
                                  )
                                : showCommandOutputTemplateError.value
                                  ? templateFoundFields.value.length === 0
                                    ? t('Errors:::No fields found in the template.', {
                                        ns: 'dashboard',
                                      }) +
                                      ' ' +
                                      t(
                                        'Errors:::Please fix the problem or confirm to save as is.',
                                        { ns: 'dashboard' }
                                      )
                                    : templateMissingFields.value.length > 0
                                      ? t(
                                          '{{count}} fields found in template but missing from fields definition.',
                                          {
                                            ns: 'dashboard',
                                            count: templateMissingFields.value.length,
                                          }
                                        ) +
                                        ' ' +
                                        t(
                                          'Errors:::Please fix the problem or confirm to save as is.',
                                          { ns: 'dashboard' }
                                        )
                                      : t(
                                          'Errors:::Your template has errors, confirm you want to save as is.',
                                          { ns: 'dashboard' }
                                        )
                                  : t('Please confirm to save as is.', {
                                      ns: 'dashboard',
                                    })}
                    </Text>
                    <Spacer h={3} />
                    <Flex className="mb-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-500 hover:text-gray-600 mr-3 border-transparent hover:border-gray-200"
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
        </SimpleBar>
      </Box>
    </CardContent>
  )
}
