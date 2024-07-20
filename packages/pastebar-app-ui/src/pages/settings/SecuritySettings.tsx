import { useEffect, useMemo } from 'react'
import SpinnerIcon from '~/assets/icons/spinner-icon'
import {
  actionNameForConfirmModal,
  actionTypeConfirmed,
  actionTypeForConfirmModal,
  openActionConfirmModal,
  resetPassCodeNextDelayInSeconds,
  settingsStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import { maskValue } from '~/lib/utils'

import Spacer from '~/components/atoms/spacer'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Flex,
  Switch,
  Text,
} from '~/components/ui'

import {
  ACTION_TYPE_COMFIRMATION_MODAL,
  SCREEN_AUTO_LOCK_TIMES_IN_MINUTES,
} from '~/store/constants'

import { useSignal } from '~/hooks/use-signal'

export default function SecuritySettings() {
  const { t } = useTranslation()
  const {
    isIdleScreenAutoLockEnabled,
    setIsIdleScreenAutoLockEnabled,
    idleScreenAutoLockTimeInMinutes,
    setIdleScreenAutoLockTimeInMinutes,
    isShowHistoryCaptureOnLockedScreen,
    setIsShowHistoryCaptureOnLockedScreen,
    isScreenLockPassCodeRequireOnStart,
    setIsScreenLockPassCodeRequireOnStart,
    screenLockPassCode,
    setScreenLockPassCode,
    screenLockPassCodeLength,
    setScreenLockPassCodeLength,
    screenLockRecoveryPasswordMasked,
    hashPassword,
    setScreenLockRecoveryPasswordMasked,
    storePassword,
    verifyStoredPassword,
    deleteStoredPassword,
  } = useAtomValue(settingsStoreAtom)

  const { returnRoute } = useAtomValue(uiStoreAtom)

  const newPassCode = useSignal('')
  const confirmPassCode = useSignal('')
  const newPassword = useSignal('')
  const confirmPassword = useSignal('')
  const confirmPasswordReset = useSignal('')

  const showConfirmPassCode = useSignal(false)
  const showResetPassCode = useSignal(false)
  const showResetPassword = useSignal(false)

  const showResetInvalidPassCodeError = useSignal(false)
  const showConfirmPasswordResetError = useSignal(false)
  const showConfirmPasswordResetVerifying = useSignal(false)
  const showConfirmEmailResetVerifying = useSignal(false)
  const showConfirmEmailResetError = useSignal(false)

  useEffect(() => {
    if (
      actionTypeForConfirmModal.value === ACTION_TYPE_COMFIRMATION_MODAL.resetPassword &&
      actionTypeConfirmed.value === ACTION_TYPE_COMFIRMATION_MODAL.resetPassword
    ) {
      setScreenLockRecoveryPasswordMasked(null)
      deleteStoredPassword('screenLockRecoveryPassword')
      actionTypeForConfirmModal.value = null
      actionTypeConfirmed.value = null
    } else if (
      actionTypeForConfirmModal.value === ACTION_TYPE_COMFIRMATION_MODAL.resetPasscode &&
      actionTypeConfirmed.value === ACTION_TYPE_COMFIRMATION_MODAL.resetPasscode
    ) {
      setScreenLockPassCode(null)
      setScreenLockPassCodeLength(0)
      actionTypeForConfirmModal.value = null
      actionTypeConfirmed.value = null
    }
  }, [actionTypeConfirmed.value, actionTypeForConfirmModal.value])

  useEffect(() => {
    if (newPassCode.value.length === 0) {
      return
    }
    if (!screenLockPassCode && newPassCode.value === confirmPassCode.value) {
      hashPassword(newPassCode.value).then(hash => {
        setScreenLockPassCode(hash)
        setScreenLockPassCodeLength(newPassCode.value.length)
        showConfirmPassCode.value = false
        confirmPassCode.value = ''
        newPassCode.value = ''
      })
    }
  }, [newPassCode.value, confirmPassCode.value])

  const showResetPasswordValue = useMemo(
    () => showResetPassword.value,
    [showResetPassword.value]
  )

  const resetPassCodeNextDelayInSecondsValue = useMemo(
    () => resetPassCodeNextDelayInSeconds.value,
    [resetPassCodeNextDelayInSeconds.value]
  )

  useMemo(() => {
    return true
  }, [
    confirmPassCode.value,
    showConfirmPassCode.value,
    showResetPassCode.value,
    showResetInvalidPassCodeError.value,
    confirmPasswordReset.value,
    showConfirmPasswordResetError.value,
    showConfirmPasswordResetVerifying.value,
    showConfirmEmailResetError.value,
    showConfirmEmailResetVerifying.value,
  ])

  const isNewPasswordValid = useMemo(() => {
    return (
      newPassword.value.length >= 6 &&
      newPassword.value.length <= 50 &&
      newPassword.value === confirmPassword.value
    )
  }, [newPassword.value, confirmPassword.value])

  const isNewPasswordDidNotMatch = useMemo(() => {
    return (
      confirmPassword.value.length >= newPassword.value.length &&
      newPassword.value !== confirmPassword.value
    )
  }, [newPassword.value, confirmPassword.value])

  return (
    <AutoSize disableWidth>
      {({ height }) => {
        return (
          height && (
            <Box className="p-4 py-6 select-none min-w-[320px]">
              <Box className="text-xl my-2 mx-2 flex items-center justify-between">
                <Text className="light">
                  {t('Security Settings', { ns: 'settings' })}
                </Text>
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
              </Box>
              <Spacer h={3} />
              <SimpleBar style={{ maxHeight: height - 85 }} autoHide={true}>
                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3 flex">
                        <Box>
                          {t('Lock Screen Passcode', {
                            ns: 'settings',
                          })}
                        </Box>
                      </CardTitle>
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t(
                          'Set a passcode to unlock the locked screen and protect your data from unauthorized access.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                    </CardHeader>
                    <CardContent>
                      {!screenLockPassCode ? (
                        <>
                          {!showConfirmPassCode.value ? (
                            <Flex className="gap-3 flex-wrap items-center justify-start my-2">
                              <InputField
                                className="text-md !w-40"
                                numbersOnly
                                autoComplete="off"
                                onPaste={e => {
                                  e.preventDefault()
                                  return false
                                }}
                                placeholder={t('Enter Passcode', { ns: 'common' })}
                                label={t('Digits Only Passcode', { ns: 'common' })}
                                onKeyDown={e => {
                                  if (
                                    e.key === 'Enter' &&
                                    (newPassCode.value.length > 3 ||
                                      newPassCode.value.length < 11)
                                  ) {
                                    showConfirmPassCode.value = true
                                  }
                                }}
                                onChange={e => {
                                  const value = e.target.value
                                  newPassCode.value = value
                                }}
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={
                                  newPassCode.value.length < 4 ||
                                  newPassCode.value.length > 10
                                }
                                onClick={() => {
                                  showConfirmPassCode.value = true
                                }}
                                className="text-sm bg-blue-300 hover:bg-blue-300/80 dark:bg-blue-700 hover:dark:bg-blue-700/80 dark:text-slate-200 mt-4 h-9"
                              >
                                {t('Set', { ns: 'common' })}
                              </Button>
                            </Flex>
                          ) : (
                            <Flex className="gap-3 flex-wrap items-center justify-start my-2">
                              <InputField
                                className="text-md !w-40"
                                key="confirm-passcode"
                                numbersOnly
                                isPassword
                                autoComplete="off"
                                onPaste={e => {
                                  e.preventDefault()
                                  return false
                                }}
                                autoFocus
                                placeholder={t('Confirm', { ns: 'common' })}
                                label={t('Confirm Passcode', { ns: 'common' })}
                                onChange={e => {
                                  const value = e.target.value
                                  confirmPassCode.value = value
                                }}
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  showConfirmPassCode.value = false
                                  confirmPassCode.value = ''
                                  newPassCode.value = ''
                                }}
                                className="text-sm bg-gray-200 dark:bg-gray-700 dark:text-slate-200 mt-4 h-9"
                              >
                                {t('Cancel', { ns: 'common' })}
                              </Button>
                            </Flex>
                          )}
                          {!showConfirmPassCode.value ? (
                            <>
                              {newPassCode.value.length >= 4 &&
                              newPassCode.value.length <= 10 ? (
                                <Text
                                  size="sm"
                                  className="!text-green-500 dark:!text-green-600"
                                >
                                  {t('Passcode length', { ns: 'settings' })}:
                                  <b className="ml-1">{newPassCode.value.length}</b>
                                </Text>
                              ) : newPassCode.value.length > 10 ? (
                                <Text
                                  size="sm"
                                  className="!text-amber-500 dark:!text-amber-600"
                                >
                                  {t('Maximum 10 digits', { ns: 'settings' })}
                                </Text>
                              ) : (
                                newPassCode.value.length > 0 &&
                                newPassCode.value.length < 4 && (
                                  <Text
                                    size="sm"
                                    className="!text-amber-500 dark:!text-amber-600"
                                  >
                                    {t('Minimal 4 digits', { ns: 'settings' })}
                                  </Text>
                                )
                              )}
                            </>
                          ) : (
                            confirmPassCode.value &&
                            newPassCode.value && (
                              <>
                                {confirmPassCode.value &&
                                newPassCode.value.length - confirmPassCode.value.length >
                                  0 ? (
                                  <Text
                                    size="sm"
                                    className="!text-green-500 dark:!text-green-600"
                                  >
                                    {t('Passcode digits remaining', { ns: 'settings' })}:
                                    <b className="ml-1">
                                      {newPassCode.value.length -
                                        confirmPassCode.value.length}
                                    </b>
                                  </Text>
                                ) : (
                                  newPassCode.value !== confirmPassCode.value && (
                                    <Text
                                      size="sm"
                                      className="!text-red-500 dark:!text-red-400"
                                    >
                                      {t('Passcode mismatch', { ns: 'settings' })}
                                    </Text>
                                  )
                                )}
                              </>
                            )
                          )}
                        </>
                      ) : (
                        <>
                          <Flex className="gap-5 justify-start flex-wrap">
                            {new Array(screenLockPassCodeLength)
                              .fill(0)
                              .map((_, index) => (
                                <Box
                                  key={index}
                                  className="text-lg px-4 py-4 rounded-md text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 text-center"
                                >
                                  ●
                                </Box>
                              ))}
                          </Flex>
                          <Box className="mt-2 text-green-700 dark:text-green-600">
                            <Trans
                              i18nKey="<strong>{{screenLockPassCodeLength}}</strong> digits passcode is set."
                              values={{ screenLockPassCodeLength }}
                              ns="settings"
                            />
                          </Box>
                        </>
                      )}

                      {screenLockPassCode && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              openActionConfirmModal.value = true
                              actionTypeForConfirmModal.value =
                                ACTION_TYPE_COMFIRMATION_MODAL.resetPasscode
                              actionNameForConfirmModal.value = t('passcode reset', {
                                ns: 'settings',
                              })
                            }}
                            className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-2"
                          >
                            {t('Reset Passcode', { ns: 'common' })}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3 flex">
                        <Box>
                          {t('Recovery Password for Lock Screen Passcode', {
                            ns: 'settings',
                          })}
                        </Box>
                      </CardTitle>
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t(
                          "Set a recovery password to easily reset your lock screen passcode if forgotten. Your password will be securely stored in your device's OS storage.",
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                    </CardHeader>
                    <CardContent>
                      {!screenLockRecoveryPasswordMasked ? (
                        <Flex className="gap-3 flex-wrap items-start justify-start my-2 flex-col">
                          <InputField
                            className="text-md !w-60"
                            key="recovery-password"
                            isPassword
                            autoComplete="off"
                            onPaste={e => {
                              e.preventDefault()
                              return false
                            }}
                            showHidePassword
                            placeholder={t('Recovery Password', { ns: 'common' })}
                            label={t('Enter Recovery Password', { ns: 'common' })}
                            classNameInput={
                              newPassword.value.length >= 6 &&
                              newPassword.value.length <= 50
                                ? '!border-green-400 !bg-green-100 dark:!border-green-700 dark:!bg-green-950 h-9'
                                : 'h-9'
                            }
                            onChange={e => {
                              newPassword.value = e.target.value
                            }}
                          />
                          <InputField
                            className="text-md !w-60"
                            key="recovery-password-confirmation"
                            isPassword
                            showHidePassword
                            onKeyDown={e => {
                              if (
                                e.key === 'Enter' &&
                                newPassword.value === confirmPassword.value &&
                                newPassword.value.length >= 6 &&
                                newPassword.value.length <= 50
                              ) {
                                storePassword(
                                  'screenLockRecoveryPassword',
                                  newPassword.value
                                ).then(() => {
                                  setScreenLockRecoveryPasswordMasked(
                                    maskValue(newPassword.value)
                                  )
                                  newPassword.value = ''
                                  confirmPassword.value = ''
                                })
                              }
                            }}
                            error={
                              isNewPasswordDidNotMatch
                                ? t('Passwords do not match', { ns: 'settings' })
                                : ''
                            }
                            autoComplete="off"
                            onPaste={e => {
                              e.preventDefault()
                              return false
                            }}
                            classNameInput={
                              !isNewPasswordDidNotMatch && isNewPasswordValid
                                ? '!border-green-400 !bg-green-100 dark:!border-green-700 dark:!bg-green-950 h-9'
                                : 'h-9'
                            }
                            placeholder={t('Confirm Password', { ns: 'common' })}
                            label={t('Confirm Password', { ns: 'common' })}
                            onChange={e => {
                              confirmPassword.value = e.target.value
                            }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!isNewPasswordValid}
                            onClick={() => {
                              if (newPassword.value === confirmPassword.value) {
                                storePassword(
                                  'screenLockRecoveryPassword',
                                  newPassword.value
                                ).then(() => {
                                  setScreenLockRecoveryPasswordMasked(
                                    maskValue(newPassword.value)
                                  )
                                  newPassword.value = ''
                                  confirmPassword.value = ''
                                })
                              }
                            }}
                            className="text-sm bg-blue-300 hover:bg-blue-300/80 dark:bg-blue-700 hover:dark:bg-blue-700/80 dark:text-slate-200 mt-1 h-9"
                          >
                            {t('Set Password', { ns: 'common' })}
                          </Button>
                        </Flex>
                      ) : (
                        <Box>
                          <Flex className="gap-2 justify-start items-start flex-wrap flex-col my-1">
                            <Box className="text-lg px-4 py-2 rounded-md text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 text-center">
                              <Text className="text-lg">
                                {screenLockRecoveryPasswordMasked}
                              </Text>
                            </Box>
                            <Box className="mt-1 text-green-700 dark:text-green-600">
                              {t('Recovery password is set.', { ns: 'settings' })}
                            </Box>
                          </Flex>
                          {!showResetPasswordValue ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                showResetPassword.value = true
                              }}
                              className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-2"
                            >
                              {t('Reset Password', { ns: 'common' })}
                            </Button>
                          ) : (
                            <Box className="mt-2">
                              <InputField
                                className="text-md !w-60"
                                key="recovery-reset-password"
                                isPassword
                                showHidePassword
                                onKeyDown={e => {
                                  if (
                                    e.key === 'Enter' &&
                                    !showConfirmPasswordResetVerifying.value &&
                                    confirmPasswordReset.value.length >= 6
                                  ) {
                                    showConfirmPasswordResetError.value = false
                                    showConfirmPasswordResetVerifying.value = true
                                    verifyStoredPassword(
                                      'screenLockRecoveryPassword',
                                      confirmPasswordReset.value
                                    )
                                      .then(isVerified => {
                                        if (isVerified) {
                                          showResetPassword.value = false
                                          setScreenLockRecoveryPasswordMasked(null)
                                          deleteStoredPassword(
                                            'screenLockRecoveryPassword'
                                          )
                                          confirmPasswordReset.value = ''
                                        } else {
                                          showConfirmPasswordResetError.value = true
                                        }
                                        showConfirmPasswordResetVerifying.value = false
                                      })
                                      .catch(() => {
                                        showConfirmPasswordResetError.value = true
                                        showConfirmPasswordResetVerifying.value = false
                                      })
                                  }
                                }}
                                error={
                                  confirmPasswordReset.value.length >= 6 &&
                                  showConfirmPasswordResetError.value
                                    ? t('Password is incorrect', { ns: 'settings' })
                                    : ''
                                }
                                autoComplete="off"
                                onPaste={e => {
                                  e.preventDefault()
                                  return false
                                }}
                                classNameInput="h-9"
                                autoFocus
                                placeholder={t('Enter Password', { ns: 'common' })}
                                label={t('Verify Current Password', { ns: 'common' })}
                                onChange={e => {
                                  showConfirmPasswordResetError.value = false
                                  confirmPasswordReset.value = e.target.value
                                }}
                              />
                              <Flex className="justify-start items-center gap-2 mt-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={confirmPasswordReset.value.length < 6}
                                  onClick={() => {
                                    showConfirmPasswordResetError.value = false
                                    showConfirmPasswordResetVerifying.value = true
                                    verifyStoredPassword(
                                      'screenLockRecoveryPassword',
                                      confirmPasswordReset.value
                                    )
                                      .then(isVerified => {
                                        if (isVerified) {
                                          showResetPassword.value = false
                                          setScreenLockRecoveryPasswordMasked(null)
                                          deleteStoredPassword(
                                            'screenLockRecoveryPassword'
                                          )
                                          confirmPasswordReset.value = ''
                                        } else {
                                          showConfirmPasswordResetError.value = true
                                        }
                                        showConfirmPasswordResetVerifying.value = false
                                      })
                                      .catch(() => {
                                        showConfirmPasswordResetError.value = true
                                        showConfirmPasswordResetVerifying.value = false
                                      })
                                  }}
                                  className="w-20 text-sm bg-blue-300 hover:bg-blue-300/80 dark:bg-blue-700 hover:dark:bg-blue-700/80 dark:text-slate-200"
                                >
                                  {!showConfirmPasswordResetVerifying.value ? (
                                    t('Reset', { ns: 'common' })
                                  ) : (
                                    <SpinnerIcon />
                                  )}
                                </Button>

                                {screenLockPassCode && (
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => {
                                      showResetPassword.value = false
                                      openActionConfirmModal.value = true
                                      actionTypeForConfirmModal.value =
                                        ACTION_TYPE_COMFIRMATION_MODAL.resetPassword
                                      actionNameForConfirmModal.value = t(
                                        'password reset',
                                        { ns: 'settings' }
                                      )
                                    }}
                                    className={`text-sm bg-gray-200 dark:bg-gray-700 dark:text-slate-200`}
                                  >
                                    {t('Use Passcode', { ns: 'common' })}
                                  </Button>
                                )}

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={resetPassCodeNextDelayInSecondsValue > 0}
                                  onClick={() => {
                                    showResetPassword.value = false
                                    showConfirmPasswordResetError.value = false
                                    confirmPasswordReset.value = ''
                                  }}
                                  className={`text-sm bg-transparent dark:bg-transparent dark:text-slate-200 hover:dark:bg-slate-800`}
                                >
                                  {t('Cancel', { ns: 'common' })}
                                </Button>
                              </Flex>
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isShowHistoryCaptureOnLockedScreen &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3 flex">
                        <Box>
                          {t('Show Clipboard History Capture Control on Lock Screen', {
                            ns: 'settings',
                          })}
                        </Box>
                        <Switch
                          checked={isShowHistoryCaptureOnLockedScreen}
                          className="ml-auto"
                          onCheckedChange={() => {
                            setIsShowHistoryCaptureOnLockedScreen(
                              !isShowHistoryCaptureOnLockedScreen
                            )
                          }}
                        />
                      </CardTitle>
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t(
                          'Display clipboard history capture toggle on the locked application screen. This allows you to control history capture settings directly from the lock screen.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                    </CardHeader>
                    <CardContent />
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isIdleScreenAutoLockEnabled &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3 flex">
                        <Box>
                          {t('Auto Lock the Screen on User Inactivity', {
                            ns: 'settings',
                          })}
                        </Box>
                        <Switch
                          checked={isIdleScreenAutoLockEnabled}
                          className="ml-auto"
                          onCheckedChange={() => {
                            setIsIdleScreenAutoLockEnabled(!isIdleScreenAutoLockEnabled)
                          }}
                        />
                      </CardTitle>
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t(
                          'Enable auto lock the application screen after a certain period of inactivity, to prevent unauthorized access to your data.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                    </CardHeader>
                    <CardContent>
                      <Flex className="gap-3 flex-wrap items-start justify-start my-2">
                        {SCREEN_AUTO_LOCK_TIMES_IN_MINUTES.map((time, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            disabled={!isIdleScreenAutoLockEnabled}
                            onClick={() => {
                              setIdleScreenAutoLockTimeInMinutes(time)
                            }}
                            className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                              idleScreenAutoLockTimeInMinutes === time
                                ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                : ''
                            } dark:text-slate-200 hover:dark:bg-slate-800 px-2 !py-0.5`}
                          >
                            {time} {t('minutes', { ns: 'common' })}
                          </Button>
                        ))}
                      </Flex>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={idleScreenAutoLockTimeInMinutes === 15}
                        onClick={() => {
                          setIdleScreenAutoLockTimeInMinutes(15)
                        }}
                        className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-2"
                      >
                        {t('Reset', { ns: 'common' })}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isScreenLockPassCodeRequireOnStart &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3 flex">
                        <Box>
                          {t('Require Screen Unlock at Application Start', {
                            ns: 'settings',
                          })}
                        </Box>
                        <Switch
                          checked={isScreenLockPassCodeRequireOnStart}
                          className="ml-auto"
                          onCheckedChange={() => {
                            setIsScreenLockPassCodeRequireOnStart(
                              !isScreenLockPassCodeRequireOnStart
                            )
                          }}
                        />
                      </CardTitle>
                      <Text className="text-sm text-muted-foreground mt-2">
                        {t(
                          'Enable screen unlock requirement on app launch for enhanced security, safeguarding data from unauthorized access.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                    </CardHeader>
                    <CardContent />
                  </Card>
                </Box>

                <Spacer h={6} />
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
                <Spacer h={4} />
              </SimpleBar>
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
