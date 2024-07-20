import { useEffect, useState } from 'react'
import {
  APP_TOURS,
  APP_TOURS_ORDER,
  AppTourType,
  onBoardingTourSingleElements,
  openOnBoardingTourName,
  settingsStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { Check, X } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Trans, useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { useToast } from '~/components/ui/use-toast'
import useBoarding from '~/components/guidedtour/useBoarding'
import HighlightElement from '~/components/libs/boarding-js/lib/core/highlight-element'
import { BoardingSteps } from '~/components/libs/boarding-js/lib/types/boarding-types'
import { Box, Button, Flex } from '~/components/ui'

export type TranslatedBoardingSteps = {
  element: string
  popover: {
    title: string
    description: string
    preferredSide?: string
    alignment?: string
  }
  meta?: {
    closeTourCssPosition?: string
  }
}

const Tour = ({
  tourName,
  element,
  isSplitPanelView,
  toggleIsSplitPanelView,
  onCompleted,
  onSkipped,
}: {
  tourName: string
  isSplitPanelView?: boolean
  toggleIsSplitPanelView: () => void
  onCompleted?: (tourName: string, startNextTourName?: AppTourType) => void
  onSkipped?: (tourName: string) => void
  element?: string | string[] | null
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [steps, setSteps] = useState([] as BoardingSteps)
  const [currentTourName, setCurrentTourName] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(null as HighlightElement | null)
  const { appToursCompletedList, appToursSkippedList, setAppToursSkippedList } =
    useAtomValue(settingsStoreAtom)
  const { toast } = useToast()

  useEffect(() => {
    if (currentTourName === tourName && !boarding?.isActivated) {
      startBoarding()
      return
    }
    resetBoarding()
    const stepsTranslation: BoardingSteps = t(tourName, {
      returnObjects: true,
      defaultValue: [],
      ns: 'tours',
    })

    const stepTours = !element
      ? stepsTranslation
      : stepsTranslation.filter(step => {
          return Array.isArray(element)
            ? element.includes(step.element as string)
            : element === step.element
        })

    setSteps(stepTours)
    setCurrentTourName(tourName)
  }, [tourName])

  const { startBoarding, resetBoarding, boarding } = useBoarding({
    steps,
    options: {
      animate: true,
      opacity: 0.65,
      padding: 8,
      allowClose: Boolean(element),
      doneBtnText: Boolean(element)
        ? t('Got It', { ns: 'help' })
        : t('Done', { ns: 'help' }),
      closeBtnText: 'x',
      nextBtnText: t('Next', { ns: 'help' }),
      prevBtnText: t('Previous', { ns: 'help' }),
      showButtons: true,
      keyboardControl: true,
    },
    onEnd: (_el, reason) => {
      const currentTourName = openOnBoardingTourName.value
      const allToursSorted = Object.values(APP_TOURS).sort(
        (a, b) => APP_TOURS_ORDER.indexOf(a) - APP_TOURS_ORDER.indexOf(b)
      )

      const notCompletedTours = allToursSorted.filter(
        tour => !appToursCompletedList.includes(tour) && tour !== currentTourName
      )
      const nextTourToComplete = notCompletedTours[0]

      openOnBoardingTourName.value = null

      const isFinished = reason === 'finish'

      if (!element) {
        if (!isFinished) {
          const allSkippedTours = [
            ...appToursSkippedList,
            currentTourName,
          ] as AppTourType[]
          setAppToursSkippedList(allSkippedTours)
        }
        const currentTour = toast({
          id: isFinished ? 'tour-completed' : 'tour-skipped',
          title: isFinished ? (
            <Flex className="text-green-600 dark:text-green-500 justify-start items-center">
              {t('Tour Completed', { ns: 'help' })}
              <Check className="h-5 w-5 ml-2" />
            </Flex>
          ) : (
            <Box className="text-yellow-600 dark:text-yellow-500">
              {t('Tour Skipped', { ns: 'help' })}
            </Box>
          ),
          duration: isFinished ? 6000 : 3000,
          description:
            reason === 'finish' ? (
              !nextTourToComplete ? (
                <>
                  <Box className="text-[14px]">
                    <Trans
                      i18nKey="Congratulations! You have finished <strong>all the tours</strong> and now ready to make the most of PasteBar's features. Remember, all tours always available from the <strong>Help > App Guided Tours</strong> menu in the navbar."
                      ns="help"
                    />
                  </Box>
                  <Flex className="justify-between">
                    <Button
                      autoFocus
                      className="bg-green-500 dark:bg-green-700 dark:hover:bg-green-800 hover:bg-green-600 px-4 mt-3 text-white !outline-none"
                      onClick={() => {
                        currentTour?.dismiss()
                      }}
                    >
                      {t("Let's get started", { ns: 'help' })}
                    </Button>
                  </Flex>
                </>
              ) : (
                <>
                  <Box className="text-[14px]">
                    <Trans
                      i18nKey="Great job! You have completed this tour. Ready to see more? Click <i>Skip</i> if you want to explore on your own. All tours always available from the <strong>Help > App Guided Tours</strong> menu in the navbar."
                      ns="help"
                    />
                  </Box>
                  <Flex className="justify-between">
                    <Button
                      autoFocus
                      className="bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-600 px-4 mt-3 text-white whitespace-nowrap"
                      onClick={() => {
                        currentTour?.dismiss()
                        openOnBoardingTourName.value = nextTourToComplete
                      }}
                    >
                      {t('Start Next Tour', { ns: 'help' })}
                    </Button>
                    <Flex className="gap-3">
                      <Button
                        variant="light"
                        className="text-gray-800 px-4 mt-3 dark:bg-slate-800 dark:text-gray-400 hover:dark:text-gray-300"
                        onClick={() => {
                          currentTour?.dismiss()
                        }}
                      >
                        {t('Later', { ns: 'help' })}
                      </Button>

                      <Button
                        variant="outline"
                        className="text-gray-800 px-4 mt-3"
                        onClick={() => {
                          resetBoarding()
                          if (onSkipped && currentTourName) {
                            onSkipped(currentTourName)
                          }
                          currentTour?.dismiss()
                        }}
                      >
                        {t('Skip', { ns: 'help' })}
                      </Button>
                    </Flex>
                  </Flex>
                </>
              )
            ) : (
              <Box className="text-[15px]">
                <Trans
                  i18nKey="Feel free to explore the app on your own. If you need help or want to access the tours later, you can always find them in the <strong>Help > App Guided Tours</strong> menu in the navigation bar."
                  ns="help"
                />
                <Box>
                  <Button
                    variant="outline"
                    autoFocus
                    className="text-gray-800 px-4 mt-3"
                    onClick={() => {
                      resetBoarding()
                      currentTour?.dismiss()
                    }}
                  >
                    {t('Got It', { ns: 'help' })}
                  </Button>
                </Box>
              </Box>
            ),
        })
        if (onCompleted && isFinished) {
          onCompleted(tourName)
        }
      } else {
        onBoardingTourSingleElements.value = null
      }
    },
    onHighlighted: (element: HighlightElement) => {
      setCurrentStep(element)
    },
  })

  useHotkeys('esc', () => {
    if (openOnBoardingTourName.value) {
      openOnBoardingTourName.value = null
      onBoardingTourSingleElements.value = null

      resetBoarding()
    }
  })

  useEffect(() => {
    if (boarding?.isActivated) {
      return
    }

    if (openOnBoardingTourName.value === APP_TOURS.historyPanelTour && isSplitPanelView) {
      toggleIsSplitPanelView()
    }

    if (
      location.pathname !== '/history' &&
      (openOnBoardingTourName.value === APP_TOURS.historyPanelTour ||
        openOnBoardingTourName.value === APP_TOURS.dashboardClipsTour)
    ) {
      navigate('/history', { replace: true })
      return
    }

    if (
      location.pathname !== '/menu' &&
      openOnBoardingTourName.value === APP_TOURS.menuTour
    ) {
      navigate('/menu', { replace: true })
      return
    }

    if (
      !location.pathname.startsWith('/app-settings') &&
      openOnBoardingTourName.value === APP_TOURS.settingsTour
    ) {
      navigate('/app-settings/history', { replace: true })
      return
    }

    if (openOnBoardingTourName.value === APP_TOURS.navBarTour) {
      startBoarding()
    }
  }, [openOnBoardingTourName.value])

  useEffect(() => {
    if (boarding?.isActivated) {
      return
    }

    if (
      location.pathname === '/history' &&
      (openOnBoardingTourName.value === APP_TOURS.historyPanelTour ||
        openOnBoardingTourName.value === APP_TOURS.dashboardClipsTour)
    ) {
      startBoarding()
      return
    }

    if (
      location.pathname === '/menu' &&
      openOnBoardingTourName.value === APP_TOURS.menuTour
    ) {
      startBoarding()
      return
    }

    if (
      location.pathname.startsWith('/app-settings') &&
      openOnBoardingTourName.value === APP_TOURS.settingsTour
    ) {
      startBoarding()
      return
    }

    if (openOnBoardingTourName.value === APP_TOURS.navBarTour) {
      startBoarding()
    }

    return () => {
      resetBoarding()
    }
  }, [])

  return boarding?.isActivated ? (
    <Button
      className={`boarding-highlighted-element fixed bottom-4 z-[10001] ${currentStep?.popover?.options.meta?.closeTourCssPosition}`}
      onClick={() => {
        resetBoarding()
      }}
    >
      {Boolean(element) ? (
        <>
          <X className="h-5 w-5" />
        </>
      ) : (
        <>{t('Skip Tour', { ns: 'help' })}</>
      )}
    </Button>
  ) : null
}

export default Tour
