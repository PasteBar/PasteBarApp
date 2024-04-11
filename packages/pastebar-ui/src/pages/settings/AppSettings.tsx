import { uiStoreAtom } from '~/store'
import { useAtomValue } from 'jotai'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

import Spacer from '~/components/atoms/spacer'
import { Box, Button, Flex, Separator, Text } from '~/components/ui'

import { MainContainer } from '../../layout/Layout'

export default function AppSettingsPage() {
  const { returnRoute } = useAtomValue(uiStoreAtom)
  const { t } = useTranslation()

  return (
    <MainContainer>
      <Box className="w-full">
        <Box className="h-[calc(100vh-70px)] flex flex-col bg-slate-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.8] py-6 px-3 pr-3">
          <Box className="animate-in fade-in">
            <Box className="flex flex-rowrounded-md p-0 items-center justify-end pr-5 h-[40px]">
              <Text className="text-lg font-semibold text-center flex items-center">
                <Settings className="mr-2" />
                {t('PasteBar Settings', { ns: 'settings' })}
              </Text>
            </Box>
            <Spacer h={3} />

            <NavLink to="/app-settings/history" replace>
              {({ isActive }) => (
                <Text
                  className={`pr-5 py-3 text-lg justify-end text-right items-center animate fade-in transition-fonts duration-100 dark:!text-slate-400 ${
                    isActive &&
                    '!font-bold text-[19px] dark:!text-slate-300 !_text-slate-600'
                  }`}
                >
                  {t('Clipboard History Settings', { ns: 'settings' })}
                </Text>
              )}
            </NavLink>

            <NavLink to="/app-settings/collections" replace>
              {({ isActive }) => (
                <Text
                  className={`pr-5 text-right py-3 text-lg justify-end items-center animate fade-in transition-fonts duration-100 dark:!text-slate-400 ${
                    isActive &&
                    '!font-bold text-[19px] dark:!text-slate-300 !_text-slate-600'
                  }`}
                >
                  {t('Manage Collections', { ns: 'settings' })}
                </Text>
              )}
            </NavLink>

            <NavLink to="/app-settings/preferences" replace>
              {({ isActive }) => (
                <Text
                  className={`pr-5 text-right py-3 text-lg justify-end items-center animate fade-in transition-fonts duration-100 dark:!text-slate-400 ${
                    isActive &&
                    '!font-bold text-[19px] dark:!text-slate-300 !_text-slate-600'
                  }`}
                >
                  {t('User Preferences', { ns: 'settings' })}
                </Text>
              )}
            </NavLink>

            <NavLink to="/app-settings/security" replace>
              {({ isActive }) => (
                <Text
                  className={`pr-5 text-right py-3 text-lg justify-end items-center animate fade-in transition-fonts duration-100 dark:!text-slate-400 ${
                    isActive &&
                    '!font-bold text-[19px] dark:!text-slate-300 !_text-slate-600'
                  }`}
                >
                  {t('Security', { ns: 'settings' })}
                </Text>
              )}
            </NavLink>

            <NavLink to="/app-settings/license" replace>
              {({ isActive }) => (
                <Text
                  className={`pr-5 text-right py-3 text-lg justify-end items-center animate fade-in transition-fonts duration-100 dark:!text-slate-400 ${
                    isActive &&
                    '!font-bold text-[19px] dark:!text-slate-300 !_text-slate-600'
                  }`}
                >
                  {t('License', { ns: 'settings' })}
                </Text>
              )}
            </NavLink>
            <Spacer h={6} />
            <Flex className="mr-5 justify-end">
              <Separator decorative className="bg-gray-300 dark:bg-gray-600" />
            </Flex>
            <Spacer h={6} />
            <NavLink to={returnRoute} replace>
              <Box className="pr-5 font-right text-right py-3 text-md animate fade-in transition-fonts duration-100">
                <Button
                  variant="secondary"
                  className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                >
                  {t('Back', { ns: 'common' })}
                </Button>
              </Box>
            </NavLink>
          </Box>
        </Box>
        <Box className="h-[calc(100vh-70px)] flex flex-col bg-slate-50 border-0 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
          <Outlet />
        </Box>
      </Box>
    </MainContainer>
  )
}
