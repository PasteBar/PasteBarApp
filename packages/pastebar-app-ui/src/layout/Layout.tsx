import { forwardRef, ReactNode, useEffect, useRef, useState } from 'react'
import useDirection from '~/libs/hooks/useDirection'
import {
  actionNameForConfirmModal,
  actionTypeConfirmed,
  actionTypeForConfirmModal,
  addSelectedTextToClipBoard,
  addSelectedTextToMenu,
  APP_TOURS,
  clipboardHistoryStoreAtom,
  hasDashboardItemCreate,
  isAppLocked,
  isCreatingMenuItem,
  isKeyAltPressed,
  isNavBarHovering,
  onBoardingTourSingleElements,
  openAboutPasteBarModal,
  openActionConfirmModal,
  openAddSelectedTextModal,
  openContactUsFormModal,
  openOnBoardingTourName,
  openOSXSystemPermissionsModal,
  openProtectedContentModal,
  pendingProtectedCollectionId,
  playerStoreAtom,
  resetPassCodeNextDelayInSeconds,
  resetPassCodeNumberOfTried,
  resetTimeModalInterval,
  settingsStoreAtom,
  showClipFindKeyPressed,
  showLargeViewHistoryId,
  showUpdateAppIsLatest,
  showUpdateChecking,
  uiStore,
  uiStoreAtom,
  visibilityCopyPopup,
} from '~/store'
import { clsx } from 'clsx'
import { useAtomValue } from 'jotai'
import { debounce, throttle } from 'lodash-es'
import { Check, Clipboard, ClipboardPaste, Plus } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { Trans, useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getSelectedText } from '~/lib/utils'

import { Toaster } from '~/components/ui/toaster'
import { TooltipProvider } from '~/components/ui/tooltip'
import { ToasterToast, useToast } from '~/components/ui/use-toast'
import mergeRefs from '~/components/atoms/merge-refs'
import ToolTip from '~/components/atoms/tooltip'
import ModalAboutPasteBar from '~/components/organisms/modals/about-pastebar-modal'
import ModalConfirmationAddSelectedTextAs from '~/components/organisms/modals/add-selected-text-as-modal'
import ModalContactSupportForm from '~/components/organisms/modals/contact-support-form'
import ModalLockScreenConfirmationWithPasscodeOrPassword from '~/components/organisms/modals/lock-screen-confirmation-modal'
import ModalOSXSystemPermissions from '~/components/organisms/modals/system-permissions-osx-modal'
import { Box, Button, Flex, Text } from '~/components/ui'

import { useSelectCollectionById } from '~/hooks/queries/use-collections'
import { useClipboardPaste, useCopyPaste } from '~/hooks/use-copypaste'
import { useLocalStorage } from '~/hooks/use-localstorage'

import { CreateDashboardItemType } from '~/types/menu'

import styles from '~/styles/popup-copy-paste.module.css'

import { PlayerAudioContainer } from '../components/audio-player/PlayerAudioContainer'
import Tour from './Tour'

type MainContainerProps = {
  children: ReactNode
}

const Container: React.ForwardRefRenderFunction<HTMLDivElement, MainContainerProps> = (
  props,
  ref
) => {
  const { t } = useTranslation()
  const mainContentRef = useRef<HTMLDivElement>(null)
  const toatTourRef = useRef<{
    id: string
    dismiss: () => void
    update: (props: ToasterToast) => void
  } | null>(null)
  const location = useLocation()
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const { isScrolling, isSwapPanels, isSplitPanelView, toggleIsSplitPanelView } =
    useAtomValue(uiStoreAtom)
  const { historyListSimpleBar, clipboardHistory } = useAtomValue(
    clipboardHistoryStoreAtom
  )
  const { selectCollectionById } = useSelectCollectionById()

  const {
    appToursCompletedList,
    setAppToursCompletedList,
    setAppToursSkippedList,
    isNotTourCompletedOrSkipped,
    appToursSkippedList,
  } = useAtomValue(settingsStoreAtom)

  const [resetPassCodeNextDelayInSecondsStorage, setResetPassCodeNextDelayInSeconds] =
    useLocalStorage('resetPassCodeNextDelayInSeconds', null)
  const [, setResetPassCodeGlobalUnsuccessfulTriesStorage] = useLocalStorage(
    'resetPassCodeGlobalUnsuccessfulTries',
    0
  )

  const [isCopied, copyToClipboard] = useCopyPaste({})
  const [pastedText, pastedItemCountDown, pasteToClipboard] = useClipboardPaste({})

  const [positionCopyPopup, setPositionCopyPopup] = useState({ top: 0, left: 0 })

  const pastedTextRef = useRef(pastedText)
  const isCopiedRef = useRef(isCopied)
  const navigate = useNavigate()
  const { toast } = useToast()

  const updatePositionCopyPopup = (rect: DOMRect, maxWidth = 0): void => {
    if (pastedTextRef.current || isCopiedRef.current) {
      return
    }
    requestAnimationFrame(() => {
      const refRect = mainContentRef.current
        ? mainContentRef.current.getBoundingClientRect()
        : new DOMRect(0)
      const top = rect.top - refRect.top - 10
      const left =
        maxWidth > 0
          ? rect.left + rect.width / 2 - refRect.left > maxWidth
            ? maxWidth / 2
            : rect.left + rect.width / 2 - refRect.left
          : rect.left + rect.width / 2 - refRect.left
      setPositionCopyPopup({ top, left })
      visibilityCopyPopup.value = true
    })
  }

  useEffect(() => {
    if (resetPassCodeNextDelayInSecondsStorage) {
      resetPassCodeNextDelayInSeconds.value =
        parseInt(resetPassCodeNextDelayInSecondsStorage, 10) ?? 0
    }
    return () => {
      if (resetTimeModalInterval.value) {
        clearInterval(resetTimeModalInterval.value)
        resetTimeModalInterval.value = null
      }
      if (resetPassCodeNextDelayInSeconds.value > 0) {
        setResetPassCodeNextDelayInSeconds(resetPassCodeNextDelayInSeconds.value)
        resetPassCodeNextDelayInSeconds.value = 0
      } else {
        setResetPassCodeNextDelayInSeconds(null)
      }
    }
  }, [])

  useEffect(() => {
    if (
      resetPassCodeNextDelayInSeconds.value > 0 &&
      resetTimeModalInterval.value == null
    ) {
      resetTimeModalInterval.value = setInterval(() => {
        if (resetPassCodeNextDelayInSeconds.value > 0) {
          setResetPassCodeNextDelayInSeconds(resetPassCodeNextDelayInSeconds.value)
          resetPassCodeNextDelayInSeconds.value -= 1
        } else {
          if (resetTimeModalInterval.value) {
            clearInterval(resetTimeModalInterval.value)
          }
          setResetPassCodeGlobalUnsuccessfulTriesStorage(0)
          setResetPassCodeNextDelayInSeconds(null)
          resetPassCodeNextDelayInSeconds.value = 0
          resetPassCodeNumberOfTried.value = 0
          resetTimeModalInterval.value = null
        }
      }, 1000)
    }
  }, [resetPassCodeNextDelayInSeconds.value])

  useEffect(() => {
    if (isCopied || pastedText) {
      return
    }
    visibilityCopyPopup.value = false
    window.getSelection()?.removeAllRanges()
  }, [isSwapPanels, clipboardHistory, isCopied, pastedText])

  useEffect(() => {
    pastedTextRef.current = pastedText
    isCopiedRef.current = isCopied
  }, [pastedText, isCopied])

  useEffect(() => {
    if (visibilityCopyPopup.value) {
      addSelectedTextToClipBoard.value = null
      addSelectedTextToMenu.value = null
    }
  }, [visibilityCopyPopup.value])

  useHotkeys('esc', () => {
    if (visibilityCopyPopup.value) {
      visibilityCopyPopup.value = false
    }
    window.getSelection()?.removeAllRanges()
  })

  useHotkeys(['meta+a', 'ctrl+a'], e => {
    e.preventDefault()
  })

  useHotkeys(
    ['meta+f', 'ctrl+f'],
    e => {
      showClipFindKeyPressed.value = e.type === 'keydown'
      setTimeout(() => {
        if (showClipFindKeyPressed.value) {
          showClipFindKeyPressed.value = false
        }
      }, 300)
    },
    {
      enableOnFormTags: true,
    }
  )

  const updateShared = debounce(
    (e): void => {
      const selected = getSelectedText()
      if (
        selected.text.trim().length &&
        selected.selection?.containsNode(mainContentRef.current as Node, true)
      ) {
        try {
          const oRange = selected.selection.getRangeAt(0)
          const oRect = oRange.getBoundingClientRect()
          let maxWidth = 0

          if (
            historyListSimpleBar?.current?.contains(e.target) &&
            historyListSimpleBar.current.getBoundingClientRect().width > 0
          ) {
            maxWidth = !uiStore.getState().isSwapPanels
              ? historyListSimpleBar.current.getBoundingClientRect().width
              : 0
          }

          updatePositionCopyPopup(oRect, maxWidth)
        } catch (e) {
          visibilityCopyPopup.value = false
        }
      } else {
        visibilityCopyPopup.value = false
      }
    },
    600,
    { leading: false }
  )

  const hideSharedDebounced = throttle(
    e => {
      if (
        e.target === shareButtonRef?.current ||
        shareButtonRef.current?.contains(e.target)
      ) {
        return false
      }
      if (visibilityCopyPopup.value) {
        visibilityCopyPopup.value = false
      }
    },
    30,
    { leading: true }
  )

  useEffect(() => {
    if (isScrolling && visibilityCopyPopup.value) {
      visibilityCopyPopup.value = false
    }
  }, [isScrolling])

  useEffect(() => {
    mainContentRef?.current?.addEventListener('mouseup', updateShared)
    mainContentRef?.current?.addEventListener('click', hideSharedDebounced)

    return (): void => {
      mainContentRef?.current?.removeEventListener('mouseup', updateShared)
      mainContentRef?.current?.removeEventListener('click', hideSharedDebounced)
    }
  }, [mainContentRef.current])

  useEffect(() => {
    if (openOnBoardingTourName.value) {
      return
    }

    if (location.pathname === '/menu') {
      if (isNotTourCompletedOrSkipped(APP_TOURS.menuTour)) {
        toatTourRef.current = toast({
          title: `${t('Welcome to Paste Menu', { ns: 'help' })}`,
          id: 'menu-tour',
          duration: 3000,
          description: (
            <Box>
              {t(`WelcomeTourDescription`, { ns: 'help' })}
              <Box className="mt-3">
                <Trans i18nKey="WelcomeTourCanSkip" ns="help" />
              </Box>
              <Flex className="justify-between">
                <Button
                  className="bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-600 px-4 mt-3 text-white"
                  onClick={() => {
                    openOnBoardingTourName.value = APP_TOURS.menuTour
                    toatTourRef.current?.dismiss()
                  }}
                >
                  {t('Start Tour', { ns: 'help' })}
                </Button>
                <Flex className="gap-3">
                  <Button
                    variant="light"
                    className="text-gray-800 px-4 mt-3 dark:bg-slate-800 dark:text-gray-400 hover:dark:text-gray-300"
                    onClick={() => {
                      toatTourRef.current?.dismiss()
                    }}
                  >
                    {t('Later', { ns: 'help' })}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-gray-800 px-4 mt-3"
                    onClick={() => {
                      toatTourRef.current?.dismiss()
                      setAppToursSkippedList([...appToursSkippedList, APP_TOURS.menuTour])
                    }}
                  >
                    {t('Skip Tour', { ns: 'help' })}
                  </Button>
                </Flex>
              </Flex>
            </Box>
          ),
        })
      }
    } else if (
      location.pathname.startsWith('/app-settings') &&
      isNotTourCompletedOrSkipped(APP_TOURS.settingsTour)
    ) {
      toatTourRef.current = toast({
        title: `${t('Welcome to PasteBar Settings', { ns: 'help' })}`,
        id: 'settings-tour',
        duration: 0,
        description: (
          <Box>
            {t(`WelcomeTourDescription`, { ns: 'help' })}
            <Box className="mt-3">
              <Trans i18nKey="WelcomeTourCanSkip" ns="help" />
            </Box>
            <Flex className="justify-between">
              <Button
                className="bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-600 px-4 mt-3 text-white"
                onClick={() => {
                  openOnBoardingTourName.value = APP_TOURS.settingsTour
                  toatTourRef.current?.dismiss()
                }}
              >
                {t('Start Tour', { ns: 'help' })}
              </Button>
              <Flex className="gap-3">
                <Button
                  variant="light"
                  className="text-gray-800 px-4 mt-3 dark:bg-slate-800 dark:text-gray-400 hover:dark:text-gray-300"
                  onClick={() => {
                    toatTourRef.current?.dismiss()
                  }}
                >
                  {t('Later', { ns: 'help' })}
                </Button>
                <Button
                  variant="outline"
                  className="text-gray-800 px-4 mt-3"
                  onClick={() => {
                    toatTourRef.current?.dismiss()
                    setAppToursSkippedList([
                      ...appToursSkippedList,
                      APP_TOURS.settingsTour,
                    ])
                  }}
                >
                  {t('Skip Tour', { ns: 'help' })}
                </Button>
              </Flex>
            </Flex>
          </Box>
        ),
      })
    } else {
      toatTourRef.current?.dismiss()
    }
  }, [location.pathname])

  return (
    <div
      ref={mergeRefs(ref, mainContentRef)}
      className="flex flex-col items-center relative"
    >
      {props.children}
      {createPortal(
        <Box
          className={clsx(
            styles['shared-container'],
            !visibilityCopyPopup.value && styles.visible
          )}
          style={{
            zIndex: 9999,
            ...positionCopyPopup,
          }}
        >
          {visibilityCopyPopup.value && (
            <button
              ref={shareButtonRef}
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Box
                className={
                  'h-8 text-slate-50 flex items-center justify-center gap-1 px-1.5'
                }
              >
                {!isCopied && !pastedText ? (
                  <>
                    {!isKeyAltPressed.value ? (
                      <Clipboard
                        size={18}
                        onClick={e => {
                          if (!e.altKey && !e.metaKey) {
                            copyToClipboard(getSelectedText().text)
                          } else {
                            pasteToClipboard(getSelectedText().text)
                          }
                        }}
                      />
                    ) : (
                      <ClipboardPaste
                        size={18}
                        onClick={() => {
                          pasteToClipboard(getSelectedText().text)
                        }}
                      />
                    )}
                    <ToolTip
                      isCompact
                      side="right"
                      delayDuration={2000}
                      sideOffset={10}
                      text={t('Add to clip or menu', { ns: 'common' })}
                    >
                      <Plus
                        size={18}
                        onClick={() => {
                          openAddSelectedTextModal.value = true
                          visibilityCopyPopup.value = false
                        }}
                      />
                    </ToolTip>
                  </>
                ) : isCopied ? (
                  <>
                    <Check size={16} />
                    <Text className="text-white text-sm pr-1">
                      {t('Copied', { ns: 'common' })}
                    </Text>
                  </>
                ) : pastedText && pastedItemCountDown === null ? (
                  <>
                    <Check size={16} />
                    <Text className="text-white text-sm pr-1">
                      {t('Pasted', { ns: 'common' })}
                    </Text>
                  </>
                ) : (
                  pastedItemCountDown !== null &&
                  pastedItemCountDown > 0 && (
                    <>
                      <Text className="text-white text-sm px-1">
                        {t('Paste in {{pastingCountDown}}...', {
                          ns: 'common',
                          pastingCountDown: pastedItemCountDown,
                        })}
                      </Text>
                    </>
                  )
                )}
              </Box>
              <Box className={styles.arrow} />
            </button>
          )}
        </Box>,
        document.body
      )}
      {openAddSelectedTextModal.value && (
        <ModalConfirmationAddSelectedTextAs
          open={getSelectedText().text?.length > 0}
          selectedText={getSelectedText().text}
          onClose={() => {
            openAddSelectedTextModal.value = false
            if (getSelectedText().text) {
              visibilityCopyPopup.value = true
            } else {
              visibilityCopyPopup.value = false
            }
          }}
          onConfirmClip={text => {
            navigate('/history', { replace: true })
            openAddSelectedTextModal.value = false
            if (showLargeViewHistoryId.value) {
              showLargeViewHistoryId.value = null
            }
            setTimeout(() => {
              addSelectedTextToClipBoard.value = text
              hasDashboardItemCreate.value = CreateDashboardItemType.CLIP
            }, 300)
          }}
          onConfirmMenu={text => {
            navigate('/menu', { replace: true })
            openAddSelectedTextModal.value = false
            setTimeout(() => {
              addSelectedTextToMenu.value = text
              isCreatingMenuItem.value = true
            }, 300)
          }}
        />
      )}
      {openAboutPasteBarModal.value && (
        <ModalAboutPasteBar
          open
          showUpdateAppIsLatest={showUpdateAppIsLatest}
          showUpdateChecking={showUpdateChecking}
          onClose={() => {
            openAboutPasteBarModal.value = false
          }}
        />
      )}
      {openActionConfirmModal.value && (
        <ModalLockScreenConfirmationWithPasscodeOrPassword
          title={actionNameForConfirmModal.value ?? undefined}
          open
          onClose={() => {
            openActionConfirmModal.value = false
            actionNameForConfirmModal.value = null
            actionTypeConfirmed.value = null
            actionTypeForConfirmModal.value = null
          }}
          showPasscode
          onConfirmSuccess={() => {
            openActionConfirmModal.value = false
            actionNameForConfirmModal.value = null
            actionTypeConfirmed.value = actionTypeForConfirmModal.value
          }}
          onConfirmFailed={() => {
            openActionConfirmModal.value = false
            actionNameForConfirmModal.value = null
            actionTypeConfirmed.value = null
            actionTypeForConfirmModal.value = null
          }}
        />
      )}
      {openContactUsFormModal.value && (
        <ModalContactSupportForm
          open
          onClose={() => {
            openContactUsFormModal.value = false
          }}
        />
      )}
      {openOSXSystemPermissionsModal.value && (
        <ModalOSXSystemPermissions
          open
          onClose={() => {
            openOSXSystemPermissionsModal.value = false
          }}
        />
      )}
      {isAppLocked.value && (
        <ModalLockScreenConfirmationWithPasscodeOrPassword
          open
          showPasscode
          isLockScreen
          onClose={() => {
            isAppLocked.value = false
          }}
          onConfirmSuccess={() => {
            isAppLocked.value = false
          }}
        />
      )}
      {openOnBoardingTourName.value && (
        <Tour
          tourName={openOnBoardingTourName.value}
          isSplitPanelView={isSplitPanelView}
          toggleIsSplitPanelView={toggleIsSplitPanelView}
          onCompleted={tourName => {
            if (!appToursCompletedList.includes(tourName)) {
              setAppToursCompletedList([...appToursCompletedList, tourName])
            }
          }}
          onSkipped={tourName => {
            if (!appToursSkippedList.includes(tourName)) {
              setAppToursSkippedList([...appToursSkippedList, tourName])
            }
          }}
          element={onBoardingTourSingleElements.value}
        />
      )}
      {openProtectedContentModal.value && (
        <ModalLockScreenConfirmationWithPasscodeOrPassword
          open={openProtectedContentModal.value}
          // no need to translate this will be done in the modal
          title="Enter PIN to Access Protected Collection"
          isLockScreen={false}
          showPasscode={true}
          onConfirmSuccess={() => {
            openProtectedContentModal.value = false
            if (pendingProtectedCollectionId.value) {
              selectCollectionById({
                selectCollection: {
                  collectionId: pendingProtectedCollectionId.value,
                },
              })
              pendingProtectedCollectionId.value = null
            }
          }}
          onClose={() => {
            openProtectedContentModal.value = false
            pendingProtectedCollectionId.value = null
          }}
        />
      )}
    </div>
  )
}

export const Component = () => {
  const { isMacOSX, isWindows, isSplitPanelView, isSwapPanels } =
    useAtomValue(uiStoreAtom)
  const { playerSongs } = useAtomValue(playerStoreAtom)

  const {
    isShowNavBarItemsOnHoverOnly,
    isHistoryPanelVisibleOnly,
    isSavedClipsPanelVisibleOnly,
    isSimplifiedLayout,
  } = useAtomValue(settingsStoreAtom)

  const { pathname } = useLocation()

  const hasSplitViewLayout =
    pathname.startsWith('/history') && (isSplitPanelView || isHistoryPanelVisibleOnly)

  useDirection()

  return (
    <div
      className={`flex flex-col bg-gray-100 ${
        isSimplifiedLayout ? 'dark:bg-gray-900' : 'dark:bg-gray-700'
      } overflow-hidden ${
        !hasSplitViewLayout && !isSimplifiedLayout ? 'rounded-b-md' : ''
      } mt-[40px] ${isSimplifiedLayout ? 'simplified-layout' : ''} ${
        isSwapPanels ? 'swaped-panels' : ''
      } ${
        isHistoryPanelVisibleOnly
          ? 'history-panel-visible-only'
          : isSavedClipsPanelVisibleOnly
            ? 'clips-panel-visible-only'
            : ''
      }`}
    >
      <div
        data-tauri-drag-region
        onClick={() => {
          if (isNavBarHovering.value && isShowNavBarItemsOnHoverOnly) {
            isNavBarHovering.value = false
          }
        }}
        className={`${
          isMacOSX
            ? `h-calc(100vh-40px) ${
                !hasSplitViewLayout && !isSimplifiedLayout ? 'p-[14px]' : ''
              }`
            : ''
        } ${
          isWindows
            ? `h-[calc(100vh-50px)] ${
                !hasSplitViewLayout && !isSimplifiedLayout ? 'px-[12px] pt-[10px]' : ''
              }`
            : ''
        }  `}
      >
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
        <Toaster />
      </div>
      {playerSongs.length > 0 && <PlayerAudioContainer />}
    </div>
  )
}

export const MainContainer = forwardRef(Container)
