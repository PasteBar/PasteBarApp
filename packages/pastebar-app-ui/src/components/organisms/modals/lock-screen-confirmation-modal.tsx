import { useEffect, useMemo } from 'react'
import SpinnerIcon from '~/assets/icons/spinner-icon'
import {
  resetPassCodeNextDelayInSeconds,
  resetPassCodeNumberOfTried,
  resetTimeModalInterval,
  settingsStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai/react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import Spacer from '~/components/atoms/spacer'
import InputField from '~/components/molecules/input'
import Modal from '~/components/molecules/modal'
import {
  Box,
  Button,
  DropdownMenuShortcut,
  Flex,
  Shortcut,
  Switch,
  Text,
} from '~/components/ui'

import { RESET_TIME_DELAY_SECONDS } from '~/store/constants'

import { useLocalStorage } from '~/hooks/use-localstorage'
import { useSignal } from '~/hooks/use-signal'

type Props = {
  open: boolean
  title?: string
  isLockScreen?: boolean
  showPasscode?: boolean
  showPasswordOnly?: boolean
  onConfirmSuccess: () => void
  onConfirmFailed?: () => void
  onClose?: () => void
}

export default function ModalLockScreenConfirmationWithPasscodeOrPassword({
  open,
  title = 'Confirm Passcode',
  isLockScreen = false,
  showPasscode = true,
  onConfirmSuccess,
  onClose = () => {},
}: Props) {
  const { t } = useTranslation()
  const isShowPasscode = useSignal(showPasscode)
  const isShowResetWithPassword = useSignal(false)
  const isShowDigitsInPasscode = useSignal(false)
  const showConfirmPasswordResetVerifying = useSignal(false)
  const showConfirmPasswordResetError = useSignal(false)
  const confirmPasswordReset = useSignal('')
  const isVerified = useSignal(false)
  const isVerifingPasscode = useSignal(false)
  const isInvalid = useSignal(false)
  const navigate = useNavigate()
  const [, setResetPassCodeNextDelayInSeconds] = useLocalStorage(
    'resetPassCodeNextDelayInSeconds',
    null
  )
  const [
    resetPassCodeGlobalUnsuccessfulTriesStorage,
    setResetPassCodeGlobalUnsuccessfulTriesStorage,
  ] = useLocalStorage('resetPassCodeGlobalUnsuccessfulTries', 0)

  const confirmPasscodeCurrentFocus = useSignal<number>(0)

  const { isHistoryEnabled, setIsHistoryEnabled } = useAtomValue(settingsStoreAtom)

  const {
    screenLockPassCode,
    screenLockPassCodeLength,
    screenLockRecoveryPasswordMasked,
    verifyPassword,
    setScreenLockPassCode,
    isShowHistoryCaptureOnLockedScreen,
    setScreenLockPassCodeLength,
    verifyStoredPassword,
  } = useAtomValue(settingsStoreAtom)

  const confirmPasscodeArray = useSignal<(number | undefined)[]>(
    new Array(screenLockPassCodeLength).fill(undefined)
  )

  const showConfirmPasswordResetVerifyingValue = useMemo(
    () => showConfirmPasswordResetVerifying.value,
    [showConfirmPasswordResetVerifying.value]
  )

  const setFocusField = (index: number) => {
    const focusfield = document.querySelector(
      `input[name=field-${index}]`
    ) as HTMLInputElement | null

    if (focusfield !== null) {
      focusfield.focus()
    }
  }

  useEffect(() => {
    if (!resetPassCodeNextDelayInSeconds.value) {
      return
    } else if (resetPassCodeNextDelayInSeconds.value < 1) {
      isInvalid.value = false
      confirmPasscodeArray.value = new Array(screenLockPassCodeLength).fill(undefined)
    } else {
      isInvalid.value = true
    }
  }, [resetPassCodeNextDelayInSeconds.value])

  useEffect(() => {
    if (isVerified.value) {
      setTimeout(() => {
        onConfirmSuccess()
      }, 800)
    }
  }, [isVerified.value])

  useEffect(() => {
    isVerified.value = false
    async function verifyEnteredPasscode(screenLockPassCode: string) {
      if (isVerifingPasscode.value) {
        return
      }
      const passcode = confirmPasscodeArray.value.join('')
      if (await verifyPassword(passcode, screenLockPassCode)) {
        isVerified.value = true
        resetPassCodeNextDelayInSeconds.value = 0
        resetPassCodeNumberOfTried.value = 0
        setResetPassCodeGlobalUnsuccessfulTriesStorage(0)
        setResetPassCodeNextDelayInSeconds(null)
        isVerifingPasscode.value = false
      } else {
        resetPassCodeNumberOfTried.value = resetPassCodeNumberOfTried.value + 1
        if (resetPassCodeNumberOfTried.value === 3) {
          const totalTries =
            parseInt(resetPassCodeGlobalUnsuccessfulTriesStorage, 10) ?? 0
          setResetPassCodeGlobalUnsuccessfulTriesStorage(totalTries + 1)

          resetPassCodeNextDelayInSeconds.value =
            totalTries > 0
              ? RESET_TIME_DELAY_SECONDS * totalTries
              : RESET_TIME_DELAY_SECONDS
        }
        isInvalid.value = true
        isVerified.value = false
        isVerifingPasscode.value = false
        confirmPasscodeArray.value = new Array(screenLockPassCodeLength).fill(undefined)
        setFocusField(0)
      }
    }

    if (
      isShowPasscode.value &&
      screenLockPassCode &&
      !isVerifingPasscode.value &&
      confirmPasscodeArray.value.every(v => v !== undefined)
    ) {
      setTimeout(() => {
        verifyEnteredPasscode(screenLockPassCode)
      }, 100)
    }
  }, [isShowPasscode.value, confirmPasscodeArray.value, screenLockPassCode])

  useEffect(() => {
    setFocusField(confirmPasscodeCurrentFocus.value)
  }, [confirmPasscodeCurrentFocus.value])

  // Set initial focus when modal opens
  useEffect(() => {
    if (open && showPasscode && screenLockPassCode) {
      setTimeout(() => {
        confirmPasscodeCurrentFocus.value = 0
        setFocusField(0)
      }, 100)
    }
  }, [open, showPasscode])

  return (
    <Modal
      open={open}
      onOutsideClick={() => {
        if (!confirmPasscodeArray.value[0]) {
          setFocusField(0)
        }
      }}
      handleClose={onClose}
      canClose={!isLockScreen || !screenLockPassCode}
      isNavVisible={false}
    >
      <Modal.Body className="bg-emerald-100/20 dark:bg-emerald-800/30">
        <Modal.Header
          handleClose={onClose}
          canClose={!isLockScreen || !screenLockPassCode}
          isCenter={isLockScreen}
        >
          {screenLockPassCode ? (
            <h1
              className={`m-1 opacity-90 ${
                isVerified.value
                  ? '!text-green-600 dark:!text-green-500'
                  : isInvalid.value
                    ? '!text-red-600 dark:!text-red-500'
                    : ''
              }`}
            >
              {isShowResetWithPassword.value
                ? t('Forgot passcode ?', {
                    ns: 'settings',
                  })
                : t(title, { ns: 'common' })}
            </h1>
          ) : (
            <h1 className="opacity-90">
              {t('Passcode is not set', {
                ns: 'settings',
              })}
            </h1>
          )}
        </Modal.Header>
        <Modal.Content className="!pt-2 justify-center items-center flex flex-col !min-w-[390px]">
          {isShowPasscode.value &&
          !isShowResetWithPassword.value &&
          screenLockPassCode ? (
            <>
              <Flex className="gap-3 flex-wrap items-start justify-center my-2 flex-row animate-in fade-in duration-700">
                {new Array(screenLockPassCodeLength).fill(0).map((_, index) => (
                  <Box
                    key={index}
                    className="text-lg px-2 py-2 rounded-md text-slate-600 dark:text-slate-400 bg-slate-300 dark:bg-slate-800 text-center"
                  >
                    {!isVerified.value ? (
                      <InputField
                        isPassword={!isShowDigitsInPasscode.value}
                        name={`field-${index}`}
                        className="!w-9 !text-xl"
                        ref={() => {
                          if (index === 0 && !confirmPasscodeArray.value[0]) {
                            setFocusField(0)
                          }
                        }}
                        disabled={resetPassCodeNextDelayInSeconds.value > 0}
                        autoComplete="off"
                        numbersOnly
                        onKeyDown={e => {
                          if ((e.metaKey || e.altKey) && e.code === 'KeyH') {
                            setIsHistoryEnabled(!isHistoryEnabled)
                          } else if (
                            e.key === 'Backspace' &&
                            e.currentTarget.value === ''
                          ) {
                            confirmPasscodeCurrentFocus.value = index > 0 ? index - 1 : 0
                          } else if (e.key === 'ArrowLeft') {
                            e.preventDefault()
                            confirmPasscodeCurrentFocus.value = index > 0 ? index - 1 : 0
                          } else if (e.key === 'ArrowRight') {
                            e.preventDefault()
                            confirmPasscodeCurrentFocus.value =
                              index < confirmPasscodeArray.value.length + 1
                                ? index + 1
                                : index
                          }
                        }}
                        onPaste={e => {
                          e.preventDefault()
                          return false
                        }}
                        maxLength={2}
                        value={confirmPasscodeArray.value[index] || ''}
                        classNameInput={`h-[48px] text-center !px-0 !text-[34px] pb-[2px] !border-0
                        ${
                          confirmPasscodeArray.value[index] && !isInvalid.value
                            ? '!bg-green-100 dark:!bg-green-900/80'
                            : isInvalid.value
                              ? 'dark:!bg-red-900/90 !bg-red-300/90'
                              : 'dark:!bg-slate-800'
                        }`}
                        onChange={e => {
                          isInvalid.value = false
                          if (e.target?.value?.length >= 1) {
                            e.target.value = e.target.value[e.target?.value?.length - 1]
                            confirmPasscodeCurrentFocus.value =
                              index < confirmPasscodeArray.value.length + 1
                                ? index + 1
                                : index
                          }
                          const value = e.target.value

                          confirmPasscodeArray.value = confirmPasscodeArray.value.map(
                            (v, i) => {
                              if (i === index) {
                                return value ? parseInt(value) : undefined
                              } else {
                                return v
                              }
                            }
                          )
                        }}
                      />
                    ) : (
                      <Flex className="h-[48px] !w-9 !px-0 !text-[34px] pb-[2px] !border-0 !bg-green-100 dark:!bg-green-900/80">
                        <Check size={26} className="text-green-600 dark:text-green-300" />
                      </Flex>
                    )}
                  </Box>
                ))}
              </Flex>

              <Spacer h={4} />
              <Flex
                className={`font-light ${
                  isInvalid.value ? '!text-red-600 dark:!text-red-500/90' : ''
                }`}
              >
                {!isInvalid.value ? (
                  <>
                    {isVerified.value ? (
                      <Text className="!text-green-600 dark:!text-green-500 font-semibold">
                        {t('Passcode successfully verified', { ns: 'settings' })}
                      </Text>
                    ) : (
                      <Text>
                        <Trans
                          i18nKey="Enter your <strong>{{screenLockPassCodeLength}} digits</strong> passcode"
                          values={{ screenLockPassCodeLength }}
                          ns="settings"
                        />
                      </Text>
                    )}
                  </>
                ) : resetPassCodeNextDelayInSeconds.value > 0 ? (
                  <Text className="!text-red-600 dark:!text-red-500/90 font-semibold">
                    {t('Passcode verification is locked.', {
                      ns: 'settings',
                    })}
                  </Text>
                ) : (
                  <Text className="!text-red-600 dark:!text-red-500/90 font-semibold">
                    {t('Passcode is not valid', {
                      screenLockPassCodeLength,
                      ns: 'settings',
                    })}
                  </Text>
                )}
                {!isVerified.value && resetPassCodeNextDelayInSeconds.value === 0 && (
                  <>
                    {isShowDigitsInPasscode.value ? (
                      <EyeOff
                        className="cursor-pointer ml-1.5 opacity-60 hover:opacity-100"
                        size={18}
                        onClick={e => {
                          e.preventDefault()
                          isShowDigitsInPasscode.value = false
                          setFocusField(confirmPasscodeCurrentFocus.value)
                        }}
                      />
                    ) : (
                      <Eye
                        className="cursor-pointer ml-1.5 opacity-60 hover:opacity-100"
                        size={18}
                        onClick={e => {
                          e.preventDefault()
                          isShowDigitsInPasscode.value = true
                          setFocusField(confirmPasscodeCurrentFocus.value)
                        }}
                      />
                    )}
                  </>
                )}
              </Flex>
              {resetPassCodeNextDelayInSeconds.value > 0 && (
                <Box className="!text-amber-500 dark:!text-amber-600">
                  <Trans
                    i18nKey="Try after <strong>{{resetPassCodeNextDelay}}</strong> seconds"
                    values={{
                      resetPassCodeNextDelay: resetPassCodeNextDelayInSeconds.value,
                    }}
                    ns="settings"
                  />
                </Box>
              )}
            </>
          ) : isShowResetWithPassword.value && screenLockRecoveryPasswordMasked ? (
            <>
              <Flex className="mb-3 mt-0 gap-2 items-start justify-start">
                <InputField
                  className="text-md !w-60"
                  isPassword
                  autoFocus
                  showHidePassword
                  onKeyDown={e => {
                    if (
                      e.key === 'Enter' &&
                      !showConfirmPasswordResetVerifying.value &&
                      confirmPasswordReset.value.length >= 6
                    ) {
                      showConfirmPasswordResetError.value = false
                      showConfirmPasswordResetVerifying.value = true
                      setTimeout(() => {
                        verifyStoredPassword(
                          'screenLockRecoveryPassword',
                          confirmPasswordReset.value
                        )
                          .then(isVerified => {
                            if (isVerified) {
                              isShowResetWithPassword.value = false
                              setScreenLockPassCode(null)
                              setScreenLockPassCodeLength(0)
                              confirmPasswordReset.value = ''
                            } else {
                              showConfirmPasswordResetError.value = true
                            }
                            showConfirmPasswordResetVerifying.value = false
                          })
                          .catch(e => {
                            console.error(e)
                            showConfirmPasswordResetError.value = true
                            showConfirmPasswordResetVerifying.value = false
                          })
                      }, 1000)
                    }
                  }}
                  errorElement={
                    confirmPasswordReset.value.length >= 6 &&
                    showConfirmPasswordResetError.value ? (
                      <>
                        <Text className="!text-red-400">
                          {t('Password is incorrect.', {
                            ns: 'settings',
                          })}
                        </Text>
                        <Text className="mt-1 !text-red-400">
                          {t('Hint: {{screenLockRecoveryPasswordMasked}}', {
                            ns: 'settings',
                            screenLockRecoveryPasswordMasked,
                          })}
                        </Text>
                      </>
                    ) : (
                      ''
                    )
                  }
                  autoComplete="off"
                  onPaste={e => {
                    e.preventDefault()
                    return false
                  }}
                  classNameInput="h-9"
                  placeholder={t('Enter Password', { ns: 'common' })}
                  onChange={e => {
                    showConfirmPasswordResetError.value = false
                    confirmPasswordReset.value = e.target.value
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={confirmPasswordReset.value.length < 6}
                  onClick={() => {
                    if (
                      !showConfirmPasswordResetVerifying.value &&
                      confirmPasswordReset.value.length >= 6
                    ) {
                      showConfirmPasswordResetError.value = false
                      showConfirmPasswordResetVerifying.value = true
                      setTimeout(() => {
                        verifyStoredPassword(
                          'screenLockRecoveryPassword',
                          confirmPasswordReset.value
                        )
                          .then(isVerified => {
                            if (isVerified) {
                              isShowResetWithPassword.value = false
                              setScreenLockPassCode(null)
                              setScreenLockPassCodeLength(0)
                              resetPassCodeNextDelayInSeconds.value = 0
                              resetPassCodeNumberOfTried.value = 0
                              setResetPassCodeGlobalUnsuccessfulTriesStorage(0)
                              setResetPassCodeNextDelayInSeconds(null)
                              if (resetTimeModalInterval.value) {
                                clearInterval(resetTimeModalInterval.value)
                                resetTimeModalInterval.value = null
                              }
                              confirmPasswordReset.value = ''
                            } else {
                              showConfirmPasswordResetError.value = true
                            }
                            showConfirmPasswordResetVerifying.value = false
                          })
                          .catch(e => {
                            console.error(e)
                            showConfirmPasswordResetError.value = true
                            showConfirmPasswordResetVerifying.value = false
                          })
                      }, 600)
                    }
                  }}
                  className={`min-w-[80px] mt-0.5 text-sm cursor-pointer whitespace-nowrap bg-blue-500 text-slate-50 hover:bg-blue-300/80 dark:bg-blue-700 hover:dark:bg-blue-700/80 dark:text-slate-200`}
                >
                  {!showConfirmPasswordResetVerifyingValue ? (
                    t('Reset', { ns: 'common' })
                  ) : (
                    <SpinnerIcon />
                  )}
                </Button>
              </Flex>
              <Text className="mt-1 text-center">
                {t('Enter recovery password to reset passcode.', {
                  ns: 'settings',
                })}
              </Text>
            </>
          ) : (
            <Text className="mt-1 text-center">
              {t(
                'Please set up a Passcode and recovery password in Security Settings to enable Screen Lock and ensure better security.',
                {
                  ns: 'settings',
                }
              )}
            </Text>
          )}
        </Modal.Content>
        <Modal.Footer className="flex-row !pt-0 !pb-5 justify-center items-center gap-3 relative">
          {!isLockScreen && screenLockPassCode ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-slate-200 dark:hover:bg-slate-900"
            >
              {t('Cancel', { ns: 'common' })}
            </Button>
          ) : (
            !screenLockPassCode && (
              <Button
                size="sm"
                variant="light"
                className="dark:bg-slate-700 bg-slate-200"
                onClick={() => {
                  navigate('/app-settings/security', { replace: true })
                  onClose()
                }}
              >
                {t('Open Security Settings', { ns: 'settings' })}
              </Button>
            )
          )}
          {(isInvalid.value || isShowResetWithPassword.value) &&
            screenLockRecoveryPasswordMasked &&
            screenLockPassCode && (
              <>
                {!isShowResetWithPassword.value ? (
                  <Button
                    size="sm"
                    variant="light"
                    className="dark:bg-slate-700 bg-slate-200"
                    onClick={() => {
                      isShowResetWithPassword.value = true
                      showConfirmPasswordResetError.value = false
                      showConfirmPasswordResetVerifying.value = false
                      confirmPasswordReset.value = ''
                    }}
                  >
                    {t('Forgot?', { ns: 'settings' })}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="light"
                    className="dark:bg-slate-700 bg-slate-200"
                    onClick={() => {
                      isShowResetWithPassword.value = false
                      confirmPasscodeArray.value = new Array(
                        screenLockPassCodeLength
                      ).fill(undefined)
                    }}
                  >
                    {t('Back', { ns: 'settings' })}
                  </Button>
                )}
              </>
            )}

          {isShowHistoryCaptureOnLockedScreen && (
            <>
              <Flex
                className="dark:bg-slate-950/90 bg-gray-400/90 absolute bottom-[-100px] rounded-md px-2 py-1 cursor-pointer"
                onClick={e => {
                  e.preventDefault()
                  setIsHistoryEnabled(!isHistoryEnabled)
                }}
              >
                <Flex className="mr-1">
                  <Text
                    className={`mr-1 ${
                      !isHistoryEnabled
                        ? '!text-gray-500 dark:!text-gray-700'
                        : '!text-slate-800 dark:!text-slate-400'
                    }`}
                  >
                    {t('Capture History', { ns: 'history' })}
                  </Text>
                  <DropdownMenuShortcut
                    className={!isHistoryEnabled ? 'opacity-30' : 'opacity-60'}
                  >
                    <Shortcut keys="ALT+H" />
                  </DropdownMenuShortcut>
                </Flex>
                <Switch
                  checked={isHistoryEnabled}
                  className={
                    !isHistoryEnabled
                      ? '!bg-gray-300 dark:!bg-gray-600 opacity-70'
                      : 'opacity-100'
                  }
                />
              </Flex>
            </>
          )}
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}
