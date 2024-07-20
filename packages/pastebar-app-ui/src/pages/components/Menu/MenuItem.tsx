import { useMemo, useRef } from 'react'
import { Signal } from '@preact/signals-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import ClipboardRun from '~/assets/icons/clipboard-run'
import SpinnerIcon from '~/assets/icons/spinner-icon'
import {
  isHoveringMenuId,
  isKeyAltPressed,
  isMenuNameEditing,
  resetMenuCreateOrEdit,
  showDeleteMenuItemsConfirmation,
  showLinkedMenuId,
} from '~/store'
import { clsx } from 'clsx'
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clipboard,
  ClipboardPaste,
  Dot,
  Folder,
  FolderOpen,
  Link,
  Locate,
  MoreVertical,
  PointerOff,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ToolTip from '~/components/atoms/tooltip'
import {
  Badge,
  Box,
  Button,
  ButtonGhost,
  ContextMenu,
  ContextMenuTrigger,
  Flex,
} from '~/components/ui'

import { useCopyClipItem, usePasteClipItem } from '~/hooks/use-copypaste-clip-item'
import { useSignal } from '~/hooks/use-signal'

import { Item } from '~/types/menu'

import { highlightMatchedText } from '../helpers'
import MenuCardContextMenu from './components/context-menus/MenuCardContextMenu'
import MenuCreateMenu from './components/MenuAddMenu'
import { MenuEditName } from './components/MenuCardEdit'

type MenuItemProps = {
  rootProps?: AccordionPrimitive.CollapsibleProps
  triggerProps?: AccordionPrimitive.CollapsibleTriggerProps
  contentProps?: AccordionPrimitive.CollapsibleContentProps
  indent?: number
  label: string
  item: Item
  id: string
  isLastItem: boolean
  isFirstItem: boolean
  isClosedFolder: boolean
  isClip: boolean | undefined
  onFolderOpen: (id: string) => void
  onFolderClose: (id: string) => void
  isCreatingMenuItem: Signal<boolean>
  isSelected?: boolean
  isForm?: boolean
  isWebRequest?: boolean
  isWebScraping?: boolean
  isCommand?: boolean
  isSeparator?: boolean
  globalSearchTerm?: string
  closeGlobalSearch?: () => void
  hasMultipleSelectedItems?: boolean
  showCreateMenuButton?: boolean
  isOpen?: boolean
  hasSelectedItems?: boolean
  hasChildren?: boolean
  showMultiSelectItems: Signal<boolean>
  showEditMenuItemId: Signal<string | null>
  deletingMenuItemIds: Signal<string[] | null>
  setOpenItemId?: (id: string | null) => void
  deselectItemById?: (id: string) => void
  selectItemById?: (id: string) => void
  setSelectedItemIds?: (ids: string[]) => void
  isDark: boolean
  className?: string
  children: React.ReactNode
}

export default function MenuItem({
  triggerProps,
  contentProps,
  isSelected,
  hasMultipleSelectedItems,
  isCreatingMenuItem,
  isFirstItem,
  isLastItem,
  isForm,
  isWebRequest,
  isWebScraping,
  isCommand,
  isSeparator,
  indent = 0,
  item,
  hasChildren,
  isOpen,
  isClip,
  showEditMenuItemId,
  onFolderClose,
  onFolderOpen,
  showMultiSelectItems,
  deletingMenuItemIds,
  isClosedFolder,
  setSelectedItemIds,
  deselectItemById,
  selectItemById,
  setOpenItemId,
  globalSearchTerm,
  isDark,
  closeGlobalSearch,
  id,
  label,
  children,
}: MenuItemProps) {
  const { t } = useTranslation()
  const { isFolder, isDisabled, isActive } = item
  const isDeleting = useMemo(() => {
    return deletingMenuItemIds.value?.includes(id) ?? false
  }, [deletingMenuItemIds.value, id])
  const contextMenuOpen = useSignal(false)

  const showFirstCreateMenuButton =
    isCreatingMenuItem.value && (isFirstItem || (isSelected && isLastItem))

  const showLastCreateMenuButton = isCreatingMenuItem.value && (isLastItem || isSelected)

  const [copiedItem, setCopiedItem, _, copyInProgressItemId] = useCopyClipItem({})
  const [pastedItem, pastingCountDown, setPastedItem] = usePasteClipItem({})

  const contextMenuButtonRef = useRef<HTMLButtonElement>(null)
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null)

  const isNewlyCreated =
    item.createdAt && item.createdAt > Math.floor(Date.now()) - 60 * 1000

  const isHover =
    (isHoveringMenuId.value === id || contextMenuOpen.value) &&
    !showMultiSelectItems.value

  const canCopyPaste = !isDisabled && isActive && !isFolder && !isSeparator
  const isMenuEdit = showEditMenuItemId.value === id

  const isCopied = copiedItem === id
  const isPasted = pastedItem === id
  const isCopyInProgress = copyInProgressItemId === id
  const isPastingCountDown = pastedItem === id ? pastingCountDown : undefined

  return (
    <>
      {showFirstCreateMenuButton && (
        <Flex
          className={clsx(
            'flex flex-col justify-center items-center my-1.5 mb-0 animate-in fade-in duration-300 ease-in-out transition-opacity',
            indent > 0 && `ml-[${indent * 30}px]`
          )}
        >
          <MenuCreateMenu
            isCreatingMenuItem={isCreatingMenuItem}
            showEditMenuItemId={showEditMenuItemId}
            isDark={isDark}
            currentMenuItemId={id}
            parentId={null}
            orderNumber={isLastItem ? item.orderNumber + 1 : 0}
          />
          <div className="h-[8px] w-[2px] bg-slate-400 opacity-20 dark:opacity-100" />
        </Flex>
      )}
      <ContextMenu
        onOpenChange={isContextOpen => {
          contextMenuOpen.value = isContextOpen
        }}
      >
        <ContextMenuTrigger
          ref={contextMenuTriggerRef}
          disabled={(!isHover && !isSelected) || Boolean(globalSearchTerm)}
        >
          <Box className="relative menu-item_tour">
            {(isCopied || isPasted) && !isPastingCountDown ? (
              <Box
                className={`z-100 w-full flex justify-center fade-in-animation absolute ${
                  isFirstItem ? 'top-[-6px]' : 'top-[-10px]'
                } ${indent > 0 ? `ml-[${indent * 10}px]` : ''}`}
              >
                {isForm ? (
                  <Badge
                    variant="default"
                    className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 py-[1.5px] mr-[-8px] text-[10px] uppercase font-semibold border-0"
                  >
                    {t('Running', { ns: 'common' })}...
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-2 py-[1.5px] pr-4 mr-[-6px] text-[10px] uppercase font-semibold border-0"
                  >
                    <Check size={14} className="mr-1" />
                    {isCopied
                      ? t('Copied', { ns: 'common' })
                      : isPasted
                        ? t('Pasted', { ns: 'common' })
                        : ''}
                  </Badge>
                )}
              </Box>
            ) : (
              isPastingCountDown &&
              pastingCountDown > 0 && (
                <Box
                  className={`z-100 w-full flex justify-center fade-in-animation absolute ${
                    isFirstItem ? 'top-[-6px]' : 'top-[-10px]'
                  } ${indent > 0 ? `ml-[${indent * 10}px]` : ''}`}
                >
                  {isForm ? (
                    <Badge
                      variant="default"
                      className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-3 py-[1.5px] pr-4 mr-[-6px] text-[10px] font-semibold border-0"
                    >
                      {t('Run in {{pastingCountDown}}...', {
                        ns: 'common',
                        pastingCountDown,
                      })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="bg-green-700 dark:bg-green-800 dark:text-white pointer-events-none px-3 py-[1.5px] pr-4 mr-[-6px] text-[10px] font-semibold border-0"
                    >
                      {t('Paste in {{pastingCountDown}}...', {
                        ns: 'common',
                        pastingCountDown,
                      })}
                    </Badge>
                  )}
                </Box>
              )
            )}
            <Box
              onMouseEnter={() => {
                isHoveringMenuId.value = id ?? null
              }}
              onMouseLeave={() => {
                isHoveringMenuId.value = null
              }}
              onClick={e => {
                if (showMultiSelectItems.value) {
                  return
                }

                e.stopPropagation()

                isHoveringMenuId.value = id ?? null

                if (e.shiftKey) {
                  if (isSeparator) {
                    return
                  }
                  if (isFolder) {
                    if (isClosedFolder) {
                      onFolderOpen(id)
                    } else {
                      onFolderClose(id)
                    }
                    return
                  }
                  if (!showEditMenuItemId.value) {
                    setOpenItemId?.(isOpen ? null : id)
                  }
                  return
                }
                if (e.metaKey || e.ctrlKey) {
                  if (isSelected) {
                    deselectItemById?.(id)
                  } else {
                    selectItemById?.(id)
                  }
                  return
                }

                setSelectedItemIds?.([id])
              }}
              className={clsx(
                'rounded-lg border-2 bg-card text-card-foreground shadow-sm flex flex-col',
                'duration-200 ease-in-out transition-none',
                indent > 0 && `ml-[${indent * 30}px]`,
                !showLastCreateMenuButton && !showFirstCreateMenuButton ? 'my-1.5' : '',
                isSelected && !isFirstItem && !isLastItem ? 'mt-1.5' : '',
                isFirstItem && showFirstCreateMenuButton && !isSelected ? 'mb-1.5' : '',
                isLastItem && showLastCreateMenuButton && !isSelected ? 'mt-1.5' : '',
                isSelected
                  ? 'border-slate-400/70 dark:border-slate-600'
                  : 'dark:border-slate-700/80',
                isDeleting && '!border-red-400 dark:!border-red-800',
                showDeleteMenuItemsConfirmation.value &&
                  isSelected &&
                  !hasChildren &&
                  '!border-red-400 dark:!border-red-800',
                isOpen ? 'max-w-[340px] min-w-[270px]' : 'w-[270px]',
                isMenuEdit && 'max-w-[340px] min-w-[340px]',
                (isCopied || isPasted) && '!border-green-600 dark:!border-green-700',
                'transition-transform',
                showLinkedMenuId.value === id && 'pulse-clip'
              )}
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  onDoubleClickCapture={e => {
                    if (
                      isMenuEdit ||
                      e.shiftKey ||
                      !canCopyPaste ||
                      contextMenuOpen.value
                    ) {
                      e.preventDefault()
                      return
                    }
                    if (e.altKey || e.metaKey) {
                      if (isForm) {
                        setPastedItem(id, undefined, true)
                        return
                      }
                      setPastedItem(id)
                    } else {
                      setCopiedItem(id)
                    }
                  }}
                  {...triggerProps}
                  asChild
                  className={clsx(
                    'group bg-white text-slate-600 dark:text-slate-400 dark:bg-slate-900 flex w-full select-none items-center justify-between rounded-md pl-2 pr-1 py-[6px] text-left text-sm font-medium cursor-pointer',
                    'focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 items-center justify-between',
                    (isSelected || isOpen) &&
                      'bg-slate-100/90 dark:bg-slate-950/80 dark:text-slate-300',
                    isHover &&
                      !(isSelected || isOpen) &&
                      '!bg-slate-50/60 dark:!bg-slate-950/60',
                    hasMultipleSelectedItems &&
                      isSelected &&
                      'bg-amber-50 dark:bg-amber-950/80',
                    isDeleting && '!bg-red-50 dark:!bg-red-950',
                    !isActive &&
                      'not-active-background bg-slate-100 text-slate-400 line-through dark:bg-slate-900 dark:text-slate-600',
                    showDeleteMenuItemsConfirmation.value &&
                      isSelected &&
                      !hasChildren &&
                      '!bg-red-50 dark:!bg-red-950/80',
                    (isCopied || isPasted) && '!bg-green-50 dark:!bg-green-900',
                    triggerProps?.className
                  )}
                >
                  <Flex className="relative">
                    <Flex
                      className={clsx(
                        'mx-1 mr-3 whitespace-nowrap overflow-hidden text-[15px] w-full',
                        showMultiSelectItems.value && 'ml-0',
                        isSelected || isNewlyCreated ? 'font-semibold' : 'font-normal',
                        isDisabled ? 'text-gray-500/60' : ''
                      )}
                    >
                      {showMultiSelectItems.value && (
                        <Box className="flex flex-row items-center pr-2.5 z-100">
                          <input
                            type="checkbox"
                            className="form-checkbox h-[16px] w-[16px] bg-slate-400"
                            key={id}
                            onChange={() => {
                              isSelected ? deselectItemById?.(id) : selectItemById?.(id)
                            }}
                            checked={isSelected}
                          />
                        </Box>
                      )}
                      {isFolder && (
                        <Flex className="mr-1.5">
                          {isClosedFolder ? (
                            <Folder size={17} />
                          ) : (
                            <FolderOpen size={17} />
                          )}
                        </Flex>
                      )}
                      {!isSeparator ? (
                        <>
                          {isMenuEdit ? (
                            <MenuEditName
                              label={label}
                              itemId={id}
                              isOpen={isOpen}
                              isClip={isClip}
                            />
                          ) : (
                            <Box className="whitespace-nowrap overflow-hidden text-ellipsis w-full">
                              {globalSearchTerm
                                ? highlightMatchedText(label, globalSearchTerm)
                                : label}
                              {isClip && (
                                <ToolTip
                                  text={t('Menu is a link to a clip', { ns: 'menus' })}
                                  delayDuration={2000}
                                  isCompact
                                  side="bottom"
                                  sideOffset={10}
                                >
                                  <Link size={13} className="ml-1.5 inline" />
                                </ToolTip>
                              )}
                            </Box>
                          )}
                        </>
                      ) : (
                        <hr className="h-[1px] border-t-0 bg-slate-600 opacity-30 dark:opacity-50 w-full" />
                      )}
                    </Flex>

                    {(isHover || isSelected || isOpen || isMenuEdit) &&
                    !showMultiSelectItems.value ? (
                      <Flex className="h-[24px]">
                        {!isSeparator ? (
                          <Flex className="gap-1 animate-in fade-in duration-100">
                            {!isFolder
                              ? !isMenuEdit && (
                                  <>
                                    {canCopyPaste && (
                                      <ButtonGhost
                                        className="hover:bg-transparent hover:text-green-600 text-slate-400"
                                        onClick={() => {
                                          isKeyAltPressed.value
                                            ? isForm
                                              ? setPastedItem(id, undefined, true)
                                              : setPastedItem(id)
                                            : setCopiedItem(id)
                                        }}
                                      >
                                        {isForm ? (
                                          <ToolTip
                                            text={t('Type:::Run Auto Fill', {
                                              ns: 'common',
                                            })}
                                            delayDuration={2000}
                                            isCompact
                                            side="bottom"
                                            sideOffset={10}
                                          >
                                            {isCopyInProgress ||
                                            (isPasted && !isPastingCountDown) ? (
                                              <SpinnerIcon />
                                            ) : (
                                              <ClipboardRun width={16} height={16} />
                                            )}
                                          </ToolTip>
                                        ) : isWebRequest || isWebScraping || isCommand ? (
                                          <ToolTip
                                            text={
                                              isKeyAltPressed.value
                                                ? t('Run and Paste Response', {
                                                    ns: 'common',
                                                  })
                                                : t('Run and Copy Response', {
                                                    ns: 'common',
                                                  })
                                            }
                                            delayDuration={2000}
                                            isCompact
                                            side="bottom"
                                            sideOffset={10}
                                          >
                                            {isKeyAltPressed.value ? (
                                              <ClipboardPaste size={16} />
                                            ) : !isCopyInProgress ? (
                                              <ClipboardRun width={16} height={16} />
                                            ) : (
                                              <SpinnerIcon />
                                            )}
                                          </ToolTip>
                                        ) : (
                                          <ToolTip
                                            text={
                                              isKeyAltPressed.value
                                                ? t('Copy and Paste', { ns: 'common' })
                                                : t('Copy to Clipboard', { ns: 'common' })
                                            }
                                            delayDuration={2000}
                                            isCompact
                                            side="bottom"
                                            sideOffset={10}
                                          >
                                            {isKeyAltPressed.value ? (
                                              <ClipboardPaste size={16} />
                                            ) : (
                                              <Clipboard size={16} />
                                            )}
                                          </ToolTip>
                                        )}
                                      </ButtonGhost>
                                    )}
                                    {!isDisabled ? (
                                      <>
                                        {!showEditMenuItemId.value &&
                                          !Boolean(globalSearchTerm) && (
                                            <ButtonGhost
                                              onClick={(e: Event) => {
                                                e.stopPropagation()
                                                setOpenItemId?.(isOpen ? null : id)
                                              }}
                                              className={clsx(
                                                'relative hover:bg-transparent w-[25px] h-[24px] mr-0 hover:text-slate-500 rounded-md transition-opacity text-slate-400 cursor-pointer flex items-center justify-center'
                                              )}
                                            >
                                              <ChevronsDownUp
                                                size="18px"
                                                className={clsx(
                                                  'absolute transform duration-300 ease-in-out',
                                                  isOpen
                                                    ? 'rotate-180 opacity-1'
                                                    : 'rotate-0 opacity-0'
                                                )}
                                              />
                                              <ChevronsUpDown
                                                size="18px"
                                                className={clsx(
                                                  'absolute transform duration-300 ease-in-out',
                                                  isOpen
                                                    ? 'rotate-180 opacity-0'
                                                    : 'rotate-0 opacity-1'
                                                )}
                                              />
                                            </ButtonGhost>
                                          )}
                                      </>
                                    ) : (
                                      <ToolTip
                                        text={t('Disabled Menu', { ns: 'menus' })}
                                        delayDuration={2000}
                                        isCompact
                                        side="bottom"
                                        sideOffset={10}
                                      >
                                        <PointerOff
                                          size={16}
                                          className="opacity-50 mr-1.5"
                                        />
                                      </ToolTip>
                                    )}
                                  </>
                                )
                              : !isMenuEdit && (
                                  <ButtonGhost
                                    onClick={() => {
                                      if (isClosedFolder) {
                                        onFolderOpen(id)
                                      } else {
                                        onFolderClose(id)
                                      }
                                    }}
                                    className={clsx(
                                      'relative w-[24px] h-[24px] mr-1 group-hover:opacity-100 rounded-md transition-opacity text-slate-400 cursor-pointer flex items-center justify-center',
                                      isOpen ? 'opacity-100' : 'opacity-20'
                                    )}
                                  >
                                    <ChevronRight
                                      size="18px"
                                      className={clsx(
                                        'absolute transform duration-300 ease-in-out',
                                        isClosedFolder
                                          ? 'rotate-0 opacity-1'
                                          : 'rotate-0 opacity-0'
                                      )}
                                    />
                                    <ChevronDown
                                      size="18px"
                                      className={clsx(
                                        'absolute transform duration-300 ease-in-out',
                                        isClosedFolder
                                          ? 'rotate-[-90deg] opacity-0'
                                          : 'rotate-0 opacity-1'
                                      )}
                                    />
                                  </ButtonGhost>
                                )}
                          </Flex>
                        ) : (
                          <>
                            <Box className="h-[23px]" />
                          </>
                        )}

                        {isMenuEdit ? (
                          <>
                            {!isMenuNameEditing.value && (
                              <ButtonGhost
                                className="mr-1"
                                onClick={() => {
                                  resetMenuCreateOrEdit()
                                }}
                              >
                                <ToolTip
                                  text={t('Close Edit', { ns: 'menus' })}
                                  delayDuration={2000}
                                  isCompact
                                  side="bottom"
                                  sideOffset={10}
                                >
                                  <X size={18} />
                                </ToolTip>
                              </ButtonGhost>
                            )}
                          </>
                        ) : !Boolean(globalSearchTerm) ? (
                          <Button
                            variant="ghost"
                            size="mini"
                            className="pr-0.5 text-secondary-foreground/50 cursor-pointer !mt-0 flex hover:bg-transparent hover:text-slate-600"
                            onClick={e => {
                              e.stopPropagation()
                              const x =
                                contextMenuButtonRef?.current?.getBoundingClientRect().x
                              const y =
                                contextMenuButtonRef?.current?.getBoundingClientRect().y

                              contextMenuTriggerRef?.current?.dispatchEvent(
                                new MouseEvent('contextmenu', {
                                  bubbles: true,
                                  clientX: x,
                                  clientY: y && y + 30,
                                })
                              )
                            }}
                            ref={contextMenuButtonRef}
                          >
                            <ToolTip
                              text={t('Options', { ns: 'common' })}
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              <MoreVertical size={18} />
                            </ToolTip>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="mini"
                            className="pl-2 pr-1 text-slate-400 cursor-pointer !mt-0 flex hover:bg-transparent hover:text-blue-500"
                            onClick={() => {
                              showLinkedMenuId.value = id
                              closeGlobalSearch?.()
                            }}
                            ref={contextMenuButtonRef}
                          >
                            <ToolTip
                              text={t('Locate Menu', { ns: 'contextMenus' })}
                              delayDuration={2000}
                              isCompact
                              side="bottom"
                              sideOffset={10}
                            >
                              <Locate size={18} />
                            </ToolTip>
                          </Button>
                        )}
                      </Flex>
                    ) : (
                      <Box className="h-[24px]" />
                    )}
                    {isNewlyCreated && (
                      <Dot
                        className={`absolute text-green-400 dark:text-green-600 pointer-events-none top-[-5px] right-[-5px] animate-in fade-in duration-500`}
                        size={28}
                      />
                    )}
                  </Flex>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content
                {...contentProps}
                className={clsx(
                  'overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
                  isDeleting && 'bg-red-50 dark:bg-red-900'
                )}
              >
                {children}
              </AccordionPrimitive.Content>
            </Box>
          </Box>
        </ContextMenuTrigger>
        {(isHover || isSelected) && (
          <MenuCardContextMenu
            id={id}
            isSelected={isSelected}
            isDisabled={isDisabled}
            setSelectedItemIds={setSelectedItemIds}
            isActive={isActive}
            hasChildren={hasChildren}
            isClip={isClip}
            isImage={item.isImage}
            isFolder={isFolder}
            itemParentId={item.parentId}
            isSeparator={isSeparator}
            setOpenItemId={setOpenItemId}
            isOpen={isOpen}
            itemOrderNumber={item.orderNumber}
            deletingMenuItemIds={deletingMenuItemIds}
            deselectItemById={deselectItemById}
            selectItemById={selectItemById}
          />
        )}
      </ContextMenu>
      {showLastCreateMenuButton && (
        <Flex
          className={clsx(
            'flex flex-col justify-center items-center mb-2 mt-0 animate-in fade-in duration-300 ease-in-out transition-opacity',
            indent > 0 && `ml-[${indent * 30}px]`
          )}
        >
          <div className="h-[8px] w-[2px] bg-slate-400 opacity-20 dark:opacity-100" />
          <MenuCreateMenu
            isCreatingMenuItem={isCreatingMenuItem}
            showEditMenuItemId={showEditMenuItemId}
            currentMenuItemId={id}
            isDark={isDark}
            parentId={isFolder && !isClosedFolder ? id : item.parentId}
            orderNumber={
              (isFolder && isClosedFolder) || !isFolder ? item.orderNumber + 2 : 0
            }
          />
        </Flex>
      )}
    </>
  )
}
